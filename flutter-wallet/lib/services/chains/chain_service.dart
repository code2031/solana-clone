/// Abstract base class for all blockchain chain services.
///
/// Each supported chain (Bitcoin, Ethereum, Solana, etc.) implements this
/// interface to provide a uniform API for wallet operations across chains.
abstract class ChainService {
  /// Human-readable chain name (e.g., "Bitcoin", "Ethereum").
  String get chainName;

  /// Native token symbol (e.g., "BTC", "ETH").
  String get chainSymbol;

  /// Emoji icon representing the chain.
  String get chainIcon;

  /// Decimal precision for the native token.
  int get decimals;

  /// Base URL for the block explorer.
  String get explorerUrl;

  /// RPC or API endpoint URL.
  String get rpcUrl;

  /// Get the native token balance for an address.
  Future<double> getBalance(String address);

  /// Send a transaction on this chain.
  /// Returns the transaction hash/signature.
  Future<String> sendTransaction(String to, double amount);

  /// Get transaction history for an address.
  Future<List<Map<String, dynamic>>> getTransactionHistory(String address);

  /// Generate a chain-specific address from a seed (mnemonic-derived bytes).
  String generateAddress(List<int> seed);

  /// Validate a chain-specific address format.
  bool validateAddress(String address);

  /// Get the explorer URL for a specific transaction.
  String getTransactionExplorerUrl(String txHash) {
    return '$explorerUrl/tx/$txHash';
  }

  /// Get the explorer URL for a specific address.
  String getAddressExplorerUrl(String address) {
    return '$explorerUrl/address/$address';
  }

  /// Estimate the fee for a transaction.
  Future<double> estimateFee() async {
    return 0.0;
  }
}
