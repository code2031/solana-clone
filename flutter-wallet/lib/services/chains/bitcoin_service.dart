import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../utils/constants.dart';
import 'chain_service.dart';

/// Bitcoin chain service using Blockstream API.
///
/// Uses BIP84 derivation (m/84'/0'/0'/0/0) for native SegWit (bc1...) addresses.
/// Interacts with the Blockstream.info API for balance and transaction data.
class BitcoinService extends ChainService {
  final http.Client _client;
  final String _apiBaseUrl;

  BitcoinService({http.Client? client, String? apiBaseUrl})
      : _client = client ?? http.Client(),
        _apiBaseUrl = apiBaseUrl ?? AppConstants.bitcoinApiUrl;

  @override
  String get chainName => 'Bitcoin';

  @override
  String get chainSymbol => 'BTC';

  @override
  String get chainIcon => '\u{1F7E0}'; // orange circle

  @override
  int get decimals => 8;

  @override
  String get explorerUrl => 'https://blockstream.info';

  @override
  String get rpcUrl => _apiBaseUrl;

  @override
  Future<double> getBalance(String address) async {
    try {
      final response = await _client.get(
        Uri.parse('$_apiBaseUrl/api/address/$address'),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch Bitcoin balance: HTTP ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final chainStats = data['chain_stats'] as Map<String, dynamic>? ?? {};
      final mempoolStats = data['mempool_stats'] as Map<String, dynamic>? ?? {};

      // funded_txo_sum - spent_txo_sum = confirmed balance (in satoshis)
      final confirmedBalance =
          (chainStats['funded_txo_sum'] as int? ?? 0) -
          (chainStats['spent_txo_sum'] as int? ?? 0);

      // Include unconfirmed (mempool) balance
      final unconfirmedBalance =
          (mempoolStats['funded_txo_sum'] as int? ?? 0) -
          (mempoolStats['spent_txo_sum'] as int? ?? 0);

      final totalSatoshis = confirmedBalance + unconfirmedBalance;
      return totalSatoshis / 100000000.0; // satoshis to BTC
    } catch (e) {
      throw Exception('Bitcoin balance fetch failed: $e');
    }
  }

  @override
  Future<String> sendTransaction(String to, double amount) async {
    // Full Bitcoin transaction construction requires:
    // 1. Fetch UTXOs for the sender address
    // 2. Select UTXOs to cover amount + fee
    // 3. Construct raw transaction with inputs/outputs
    // 4. Sign each input with the private key (ECDSA secp256k1)
    // 5. Serialize and broadcast via POST /api/tx
    //
    // This is a placeholder -- real implementation would use a Bitcoin
    // transaction builder library.
    throw UnimplementedError(
      'Bitcoin transaction sending requires UTXO construction. '
      'Amount: $amount BTC to $to. '
      'Use a dedicated Bitcoin SDK for production transactions.',
    );
  }

  @override
  Future<List<Map<String, dynamic>>> getTransactionHistory(String address) async {
    try {
      final response = await _client.get(
        Uri.parse('$_apiBaseUrl/api/address/$address/txs'),
      );

      if (response.statusCode != 200) {
        return [];
      }

      final List<dynamic> txList = jsonDecode(response.body) as List<dynamic>;

      return txList.take(20).map((tx) {
        final txData = tx as Map<String, dynamic>;
        final status = txData['status'] as Map<String, dynamic>? ?? {};
        final confirmed = status['confirmed'] as bool? ?? false;
        final blockTime = status['block_time'] as int?;

        // Calculate the net value for this address
        int totalIn = 0;
        int totalOut = 0;

        final vins = txData['vin'] as List<dynamic>? ?? [];
        for (final vin in vins) {
          final prevout = (vin as Map<String, dynamic>)['prevout'] as Map<String, dynamic>?;
          if (prevout != null && prevout['scriptpubkey_address'] == address) {
            totalIn += prevout['value'] as int? ?? 0;
          }
        }

        final vouts = txData['vout'] as List<dynamic>? ?? [];
        for (final vout in vouts) {
          final voutData = vout as Map<String, dynamic>;
          if (voutData['scriptpubkey_address'] == address) {
            totalOut += voutData['value'] as int? ?? 0;
          }
        }

        final netSatoshis = totalOut - totalIn;
        final isReceive = netSatoshis > 0;

        return {
          'txid': txData['txid'] ?? '',
          'type': isReceive ? 'receive' : 'send',
          'amount': netSatoshis.abs() / 100000000.0,
          'confirmed': confirmed,
          'timestamp': blockTime != null
              ? DateTime.fromMillisecondsSinceEpoch(blockTime * 1000).toIso8601String()
              : DateTime.now().toIso8601String(),
          'fee': (txData['fee'] as int? ?? 0) / 100000000.0,
          'chain': 'bitcoin',
        };
      }).toList();
    } catch (e) {
      return [];
    }
  }

  @override
  String generateAddress(List<int> seed) {
    // BIP84 derivation path: m/84'/0'/0'/0/0
    // In a full implementation, this would:
    // 1. Derive the master key from the seed using HMAC-SHA512
    // 2. Follow BIP84 derivation for native SegWit
    // 3. Generate the bc1... (bech32) address
    //
    // For now, return a deterministic placeholder based on seed bytes.
    final hash = seed.take(20).map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return 'bc1q${hash.substring(0, 38)}';
  }

  @override
  bool validateAddress(String address) {
    // Native SegWit (bech32): bc1q... (42 chars) or bc1p... (62 chars for taproot)
    final bech32Regex = RegExp(r'^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{25,87}$');

    // Legacy P2PKH: starts with 1, 25-34 chars
    final p2pkhRegex = RegExp(r'^1[a-km-zA-HJ-NP-Z1-9]{25,34}$');

    // P2SH (wrapped SegWit): starts with 3, 25-34 chars
    final p2shRegex = RegExp(r'^3[a-km-zA-HJ-NP-Z1-9]{25,34}$');

    return bech32Regex.hasMatch(address) ||
        p2pkhRegex.hasMatch(address) ||
        p2shRegex.hasMatch(address);
  }

  @override
  Future<double> estimateFee() async {
    try {
      final response = await _client.get(
        Uri.parse('$_apiBaseUrl/api/fee-estimates'),
      );

      if (response.statusCode == 200) {
        final fees = jsonDecode(response.body) as Map<String, dynamic>;
        // Use the ~6 block target (roughly 1 hour)
        final satPerVbyte = (fees['6'] as num?)?.toDouble() ?? 10.0;
        // Typical SegWit tx is ~140 vbytes
        return (satPerVbyte * 140) / 100000000.0;
      }
    } catch (_) {}
    // Fallback: ~10 sat/vbyte * 140 vbytes
    return 0.0000140;
  }

  @override
  String getTransactionExplorerUrl(String txHash) {
    return '$explorerUrl/tx/$txHash';
  }

  @override
  String getAddressExplorerUrl(String address) {
    return '$explorerUrl/address/$address';
  }

  void dispose() {
    _client.close();
  }
}
