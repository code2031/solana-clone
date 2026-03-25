import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../utils/constants.dart';
import 'chain_service.dart';

/// XRP Ledger chain service using Ripple JSON-RPC API.
///
/// Uses BIP44 derivation (m/44'/144'/0'/0/0) for XRP addresses (r...).
/// Communicates via Ripple-style JSON-RPC for balance and transaction queries.
/// No token support for now -- native XRP only.
class XrpService extends ChainService {
  final http.Client _client;
  final String _rpcEndpoint;

  XrpService({http.Client? client, String? rpcUrl})
      : _client = client ?? http.Client(),
        _rpcEndpoint = rpcUrl ?? AppConstants.xrpRpcUrl;

  @override
  String get chainName => 'XRP Ledger';

  @override
  String get chainSymbol => 'XRP';

  @override
  String get chainIcon => '\u{1F4A7}'; // droplet

  @override
  int get decimals => 6;

  @override
  String get explorerUrl => 'https://xrpscan.com';

  @override
  String get rpcUrl => _rpcEndpoint;

  /// Make a Ripple JSON-RPC call.
  Future<Map<String, dynamic>> _rippleRpc(String method, Map<String, dynamic> params) async {
    final body = jsonEncode({
      'method': method,
      'params': [params],
    });

    try {
      final response = await _client.post(
        Uri.parse(_rpcEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: body,
      );

      if (response.statusCode != 200) {
        throw Exception('XRP RPC HTTP ${response.statusCode}: ${response.body}');
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final result = json['result'] as Map<String, dynamic>? ?? {};

      if (result['status'] == 'error') {
        final errorMessage = result['error_message'] as String? ?? result['error'] as String? ?? 'Unknown error';
        throw Exception('XRP RPC Error: $errorMessage');
      }

      return result;
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('XRP RPC connection failed: $e');
    }
  }

  @override
  Future<double> getBalance(String address) async {
    try {
      final result = await _rippleRpc('account_info', {
        'account': address,
        'strict': true,
        'ledger_index': 'current',
      });

      final accountData = result['account_data'] as Map<String, dynamic>? ?? {};
      final balanceDrops = accountData['Balance'] as String? ?? '0';
      final drops = int.tryParse(balanceDrops) ?? 0;

      // Convert drops to XRP (1 XRP = 1,000,000 drops)
      return drops / 1000000.0;
    } catch (e) {
      // Account not found means 0 balance
      if (e.toString().contains('actNotFound')) {
        return 0.0;
      }
      throw Exception('XRP balance fetch failed: $e');
    }
  }

  @override
  Future<String> sendTransaction(String to, double amount) async {
    // Full XRP transaction requires:
    // 1. Get account info and current sequence number
    // 2. Construct Payment transaction object
    // 3. Sign with secp256k1 or Ed25519
    // 4. Submit via submit method
    //
    // Placeholder implementation:
    final dropsAmount = (amount * 1000000).toInt();
    throw UnimplementedError(
      'XRP transaction sending requires signing. '
      'Amount: $amount XRP ($dropsAmount drops) to $to. '
      'Use a dedicated XRP SDK for production transactions.',
    );
  }

  @override
  Future<List<Map<String, dynamic>>> getTransactionHistory(String address) async {
    try {
      final result = await _rippleRpc('account_tx', {
        'account': address,
        'ledger_index_min': -1,
        'ledger_index_max': -1,
        'limit': 20,
        'forward': false,
      });

      final transactions = result['transactions'] as List<dynamic>? ?? [];

      return transactions.take(20).map((tx) {
        final txData = tx as Map<String, dynamic>;
        final txObj = txData['tx'] as Map<String, dynamic>? ?? {};
        final meta = txData['meta'] as Map<String, dynamic>? ?? {};

        final destination = txObj['Destination'] as String? ?? '';
        final isReceive = destination == address;
        final amountDrops = txObj['Amount'] as dynamic;
        double amount = 0.0;

        if (amountDrops is String) {
          amount = (int.tryParse(amountDrops) ?? 0) / 1000000.0;
        } else if (amountDrops is int) {
          amount = amountDrops / 1000000.0;
        }

        final date = txObj['date'] as int? ?? 0;
        // Ripple epoch starts at 2000-01-01 00:00:00 UTC (946684800 seconds after Unix epoch)
        final unixTimestamp = date + 946684800;

        return {
          'txid': txObj['hash'] ?? '',
          'type': isReceive ? 'receive' : 'send',
          'amount': amount,
          'confirmed': meta['TransactionResult'] == 'tesSUCCESS',
          'timestamp': DateTime.fromMillisecondsSinceEpoch(unixTimestamp * 1000).toIso8601String(),
          'fee': ((int.tryParse(txObj['Fee'] as String? ?? '0') ?? 0) / 1000000.0),
          'chain': 'xrp',
        };
      }).toList();
    } catch (e) {
      return [];
    }
  }

  @override
  String generateAddress(List<int> seed) {
    // BIP44 derivation path: m/44'/144'/0'/0/0
    // In a full implementation, this would:
    // 1. Derive the child key using BIP44 path with coin type 144
    // 2. Get the public key (secp256k1)
    // 3. SHA-256 then RIPEMD-160 of the public key
    // 4. Base58Check encode with version byte 0x00
    //
    // Deterministic placeholder based on seed bytes:
    final hash = seed.take(20).map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return 'r${hash.substring(0, 33)}';
  }

  @override
  bool validateAddress(String address) {
    // XRP addresses start with 'r' and are 25-35 characters (Base58Check)
    final regex = RegExp(r'^r[1-9A-HJ-NP-Za-km-z]{24,34}$');
    return regex.hasMatch(address);
  }

  @override
  Future<double> estimateFee() async {
    try {
      final result = await _rippleRpc('fee', {});
      final drops = result['drops'] as Map<String, dynamic>? ?? {};
      final openLedgerFee = drops['open_ledger_fee'] as String? ?? '12';
      final feeDrops = int.tryParse(openLedgerFee) ?? 12;
      return feeDrops / 1000000.0;
    } catch (_) {
      // Standard XRP transaction fee is 12 drops (0.000012 XRP)
      return 0.000012;
    }
  }

  @override
  String getTransactionExplorerUrl(String txHash) {
    return '$explorerUrl/tx/$txHash';
  }

  @override
  String getAddressExplorerUrl(String address) {
    return '$explorerUrl/account/$address';
  }

  void dispose() {
    _client.close();
  }
}
