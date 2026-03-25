import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../utils/constants.dart';
import 'chain_service.dart';

/// Litecoin chain service using litecoinspace.org REST API.
///
/// Uses BIP84 derivation (m/84'/2'/0'/0/0) for native SegWit (ltc1...) addresses.
/// Communicates via litecoinspace.org API (similar to Blockstream for Bitcoin).
/// No token support -- native LTC only.
class LitecoinService extends ChainService {
  final http.Client _client;
  final String _apiBaseUrl;

  LitecoinService({http.Client? client, String? apiBaseUrl})
      : _client = client ?? http.Client(),
        _apiBaseUrl = apiBaseUrl ?? AppConstants.litecoinApiUrl;

  @override
  String get chainName => 'Litecoin';

  @override
  String get chainSymbol => 'LTC';

  @override
  String get chainIcon => '\u{1FA99}'; // coin

  @override
  int get decimals => 8;

  @override
  String get explorerUrl => 'https://litecoinspace.org';

  @override
  String get rpcUrl => _apiBaseUrl;

  @override
  Future<double> getBalance(String address) async {
    try {
      final response = await _client.get(
        Uri.parse('$_apiBaseUrl/api/address/$address'),
      );

      if (response.statusCode != 200) {
        throw Exception('Litecoin API HTTP ${response.statusCode}: ${response.body}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final chainStats = data['chain_stats'] as Map<String, dynamic>? ?? {};
      final mempoolStats = data['mempool_stats'] as Map<String, dynamic>? ?? {};

      // funded_txo_sum - spent_txo_sum = confirmed balance (in litoshis)
      final confirmedBalance =
          (chainStats['funded_txo_sum'] as int? ?? 0) -
          (chainStats['spent_txo_sum'] as int? ?? 0);

      // Include unconfirmed (mempool) balance
      final unconfirmedBalance =
          (mempoolStats['funded_txo_sum'] as int? ?? 0) -
          (mempoolStats['spent_txo_sum'] as int? ?? 0);

      final totalLitoshis = confirmedBalance + unconfirmedBalance;
      return totalLitoshis / 100000000.0; // litoshis to LTC
    } catch (e) {
      throw Exception('Litecoin balance fetch failed: $e');
    }
  }

  @override
  Future<String> sendTransaction(String to, double amount) async {
    // Full Litecoin transaction requires UTXO-based construction,
    // similar to Bitcoin:
    // 1. Fetch UTXOs for the sender address
    // 2. Select UTXOs to cover amount + fee
    // 3. Construct raw transaction with inputs/outputs
    // 4. Sign each input with the private key (ECDSA secp256k1)
    // 5. Broadcast the signed transaction
    //
    // Placeholder implementation:
    final litoshiAmount = (amount * 100000000).toInt();
    throw UnimplementedError(
      'Litecoin transaction sending requires UTXO construction. '
      'Amount: $amount LTC ($litoshiAmount litoshis) to $to. '
      'Use a dedicated Litecoin SDK for production transactions.',
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

        final netLitoshis = totalOut - totalIn;
        final isReceive = netLitoshis > 0;

        return {
          'txid': txData['txid'] ?? '',
          'type': isReceive ? 'receive' : 'send',
          'amount': netLitoshis.abs() / 100000000.0,
          'confirmed': confirmed,
          'timestamp': blockTime != null
              ? DateTime.fromMillisecondsSinceEpoch(blockTime * 1000).toIso8601String()
              : DateTime.now().toIso8601String(),
          'fee': (txData['fee'] as int? ?? 0) / 100000000.0,
          'chain': 'litecoin',
        };
      }).toList();
    } catch (e) {
      return [];
    }
  }

  @override
  String generateAddress(List<int> seed) {
    // BIP84 derivation path: m/84'/2'/0'/0/0
    // In a full implementation, this would:
    // 1. Derive the master key from the seed using HMAC-SHA512
    // 2. Follow BIP84 derivation with coin type 2 (Litecoin)
    // 3. Generate a native SegWit address starting with ltc1
    //
    // Deterministic placeholder based on seed bytes:
    final hash = seed.take(20).map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return 'ltc1q${hash.substring(0, 38)}';
  }

  @override
  bool validateAddress(String address) {
    // Native SegWit (bech32): ltc1q... or ltc1p...
    final bech32Regex = RegExp(r'^ltc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{25,87}$');

    // Legacy P2PKH: starts with L or M (44 prefix)
    final legacyRegex = RegExp(r'^[LM][a-km-zA-HJ-NP-Z1-9]{25,34}$');

    // P2SH: starts with 3 or M (for older addresses)
    final p2shRegex = RegExp(r'^3[a-km-zA-HJ-NP-Z1-9]{25,34}$');

    return bech32Regex.hasMatch(address) ||
        legacyRegex.hasMatch(address) ||
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
        // Use the ~6 block target
        final satPerVbyte = (fees['6'] as num?)?.toDouble() ?? 5.0;
        // Typical SegWit tx is ~140 vbytes
        return (satPerVbyte * 140) / 100000000.0;
      }
    } catch (_) {}
    // Fallback: ~5 litoshi/vbyte * 140 vbytes
    return 0.0000070;
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
