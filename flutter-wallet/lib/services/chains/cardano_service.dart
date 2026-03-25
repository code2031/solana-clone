import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../utils/constants.dart';
import 'chain_service.dart';

/// Cardano chain service using Blockfrost REST API.
///
/// Uses Shelley-era derivation (m/1852'/1815'/0'/0/0) for Cardano addresses (addr1...).
/// Communicates via Blockfrost API (requires API key placeholder).
/// No token support for now -- native ADA only.
class CardanoService extends ChainService {
  final http.Client _client;
  final String _apiBaseUrl;
  final String _apiKey;

  CardanoService({
    http.Client? client,
    String? apiBaseUrl,
    String? apiKey,
  })  : _client = client ?? http.Client(),
        _apiBaseUrl = apiBaseUrl ?? AppConstants.cardanoApiUrl,
        _apiKey = apiKey ?? AppConstants.cardanoApiKey;

  @override
  String get chainName => 'Cardano';

  @override
  String get chainSymbol => 'ADA';

  @override
  String get chainIcon => '\u{1F0CF}'; // joker card

  @override
  int get decimals => 6;

  @override
  String get explorerUrl => 'https://cardanoscan.io';

  @override
  String get rpcUrl => _apiBaseUrl;

  /// Make an authenticated request to the Blockfrost API.
  Future<http.Response> _blockfrostGet(String path) async {
    return await _client.get(
      Uri.parse('$_apiBaseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        'project_id': _apiKey,
      },
    );
  }

  @override
  Future<double> getBalance(String address) async {
    try {
      final response = await _blockfrostGet('/addresses/$address');

      if (response.statusCode == 404) {
        return 0.0; // Address not found (unused)
      }

      if (response.statusCode != 200) {
        throw Exception('Cardano API HTTP ${response.statusCode}: ${response.body}');
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final amounts = json['amount'] as List<dynamic>? ?? [];

      // Find the lovelace (native ADA) entry
      for (final amount in amounts) {
        final amountData = amount as Map<String, dynamic>;
        if (amountData['unit'] == 'lovelace') {
          final lovelace = int.tryParse(amountData['quantity'] as String? ?? '0') ?? 0;
          // Convert lovelace to ADA (1 ADA = 1,000,000 lovelace)
          return lovelace / 1000000.0;
        }
      }

      return 0.0;
    } catch (e) {
      throw Exception('Cardano balance fetch failed: $e');
    }
  }

  @override
  Future<String> sendTransaction(String to, double amount) async {
    // Full Cardano transaction requires:
    // 1. Query UTXOs from Blockfrost
    // 2. Build transaction using Cardano Serialization Library
    // 3. Calculate min fee
    // 4. Sign with Ed25519 key
    // 5. Submit via Blockfrost /tx/submit
    //
    // Placeholder implementation:
    final lovelaceAmount = (amount * 1000000).toInt();
    throw UnimplementedError(
      'Cardano transaction sending requires Cardano serialization. '
      'Amount: $amount ADA ($lovelaceAmount lovelace) to $to. '
      'Use a dedicated Cardano SDK for production transactions.',
    );
  }

  @override
  Future<List<Map<String, dynamic>>> getTransactionHistory(String address) async {
    try {
      final response = await _blockfrostGet('/addresses/$address/transactions?order=desc&count=20');

      if (response.statusCode != 200) {
        return [];
      }

      final List<dynamic> txList = jsonDecode(response.body) as List<dynamic>;

      return txList.take(20).map((tx) {
        final txData = tx as Map<String, dynamic>;
        final txHash = txData['tx_hash'] as String? ?? '';
        final blockTime = txData['block_time'] as int? ?? 0;

        return {
          'txid': txHash,
          'type': 'info',
          'amount': 0.0,
          'confirmed': true,
          'timestamp': blockTime > 0
              ? DateTime.fromMillisecondsSinceEpoch(blockTime * 1000).toIso8601String()
              : DateTime.now().toIso8601String(),
          'note': 'Use Blockfrost /txs/$txHash/utxos for full details',
          'chain': 'cardano',
        };
      }).toList();
    } catch (e) {
      return [];
    }
  }

  @override
  String generateAddress(List<int> seed) {
    // Shelley-era derivation path: m/1852'/1815'/0'/0/0
    // In a full implementation, this would:
    // 1. Derive the master key from the seed
    // 2. Follow CIP-1852 derivation for Shelley addresses
    // 3. Generate the payment key and staking key
    // 4. Build a base address (addr1...)
    //
    // Deterministic placeholder based on seed bytes:
    final hash = seed.take(28).map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return 'addr1q${hash.substring(0, 53)}';
  }

  @override
  bool validateAddress(String address) {
    // Shelley mainnet addresses start with addr1 (Bech32)
    // Byron legacy addresses start with Ae2 or DdzFF (Base58)
    final shelleyRegex = RegExp(r'^addr1[a-z0-9]{53,}$');
    final byronRegex = RegExp(r'^(Ae2|DdzFF)[a-zA-Z0-9]{20,}$');

    return shelleyRegex.hasMatch(address) || byronRegex.hasMatch(address);
  }

  @override
  Future<double> estimateFee() async {
    // Cardano fees follow a formula: fee = a * tx_size + b
    // where a = 44 lovelace/byte and b = 155381 lovelace
    // A typical transaction is ~300 bytes
    // fee = 44 * 300 + 155381 = 168581 lovelace = ~0.168 ADA
    return 0.17;
  }

  @override
  String getTransactionExplorerUrl(String txHash) {
    return '$explorerUrl/transaction/$txHash';
  }

  @override
  String getAddressExplorerUrl(String address) {
    return '$explorerUrl/address/$address';
  }

  void dispose() {
    _client.close();
  }
}
