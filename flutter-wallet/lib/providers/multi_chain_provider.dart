import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/chain.dart';
import '../services/chains/chain_service.dart';
import '../services/chains/bitcoin_service.dart';
import '../services/chains/ethereum_service.dart';
import '../services/chains/solana_service.dart';
import '../services/chains/polygon_service.dart';
import '../services/chains/bnb_service.dart';
import '../services/chains/prism_service.dart';
import '../services/rpc_service.dart';

/// Manages multi-chain wallet state across all supported blockchains.
///
/// Tracks balances, active chains, and total portfolio value for a
/// Trust Wallet / Exodus-style universal wallet experience.
class MultiChainProvider extends ChangeNotifier {
  final RpcService _rpcService;

  // Chain service instances
  late final PrismService _prismService;
  late final SolanaService _solanaService;
  late final BitcoinService _bitcoinService;
  late final EthereumService _ethereumService;
  late final PolygonService _polygonService;
  late final BnbService _bnbService;

  // State
  Map<ChainType, Chain> _chains = {};
  Map<ChainType, ChainService> _services = {};
  bool _isLoading = false;
  bool _isRefreshing = false;
  String? _error;
  Timer? _refreshTimer;

  // Mock USD prices for portfolio calculation
  final Map<String, double> _prices = {
    'BTC': 65000.0,
    'ETH': 3200.0,
    'SOL': 140.0,
    'POL': 0.55,
    'BNB': 580.0,
    'USDT': 1.0,
    'USDC': 1.0,
    'DAI': 1.0,
  };

  MultiChainProvider(this._rpcService) {
    _initServices();
    _initChains();
  }

  // -- Getters --

  Map<ChainType, Chain> get chains => Map.unmodifiable(_chains);
  List<Chain> get enabledChains =>
      _chains.values.where((c) => c.isEnabled).toList();
  List<Chain> get allChains => _chains.values.toList();
  bool get isLoading => _isLoading;
  bool get isRefreshing => _isRefreshing;
  String? get error => _error;

  ChainService getService(ChainType type) => _services[type]!;
  Chain getChain(ChainType type) => _chains[type]!;

  /// Total portfolio value in USD across all enabled chains.
  double get totalPortfolioUsd {
    return _chains.values
        .where((c) => c.isEnabled)
        .fold(0.0, (sum, chain) => sum + chain.totalUsdValue);
  }

  /// Get the native balance on a specific chain.
  double getChainBalance(ChainType type) {
    return _chains[type]?.balance ?? 0.0;
  }

  /// Get the USD value on a specific chain (native + tokens).
  double getChainUsdValue(ChainType type) {
    return _chains[type]?.totalUsdValue ?? 0.0;
  }

  // -- Initialization --

  void _initServices() {
    _prismService = PrismService(_rpcService);
    _solanaService = SolanaService();
    _bitcoinService = BitcoinService();
    _ethereumService = EthereumService();
    _polygonService = PolygonService();
    _bnbService = BnbService();

    _services = {
      ChainType.prism: _prismService,
      ChainType.solana: _solanaService,
      ChainType.bitcoin: _bitcoinService,
      ChainType.ethereum: _ethereumService,
      ChainType.polygon: _polygonService,
      ChainType.bnb: _bnbService,
    };
  }

  void _initChains() {
    _chains = Map.fromEntries(
      Chain.defaults.entries.map(
        (e) => MapEntry(e.key, e.value),
      ),
    );
  }

  /// Initialize the provider: load saved preferences and set addresses.
  Future<void> init(String walletPublicKey, {List<int>? seed}) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Load enabled chain preferences
      await _loadPreferences();

      // Generate addresses for each chain
      _generateAddresses(walletPublicKey, seed ?? []);

      // Initial balance refresh
      await refreshAllBalances();

      _startAutoRefresh();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Generate chain-specific addresses from the wallet seed.
  void _generateAddresses(String prismAddress, List<int> seed) {
    for (final type in ChainType.values) {
      String address;
      if (type == ChainType.prism) {
        // Prism uses the existing wallet address
        address = prismAddress;
      } else {
        address = _services[type]!.generateAddress(
          seed.isNotEmpty ? seed : prismAddress.codeUnits,
        );
      }

      _chains[type] = _chains[type]!.copyWith(address: address);
    }
  }

  // -- Balance Refresh --

  /// Refresh balances across all enabled chains.
  Future<void> refreshAllBalances() async {
    _isRefreshing = true;
    _error = null;
    notifyListeners();

    final futures = <Future>[];
    for (final type in ChainType.values) {
      if (_chains[type]?.isEnabled ?? false) {
        futures.add(_refreshChainBalance(type));
      }
    }

    try {
      await Future.wait(futures);
    } catch (e) {
      _error = 'Some chain balances could not be refreshed';
    }

    _isRefreshing = false;
    notifyListeners();
  }

  /// Refresh the balance for a single chain.
  Future<void> _refreshChainBalance(ChainType type) async {
    final chain = _chains[type];
    if (chain == null || chain.address.isEmpty) return;

    try {
      final service = _services[type]!;
      final balance = await service.getBalance(chain.address);
      final price = _getPriceForSymbol(chain.symbol);
      final usdValue = balance * price;

      // Fetch tokens for EVM chains
      List<ChainToken> tokens = [];
      if (type == ChainType.ethereum) {
        tokens = await _fetchEthereumTokens(chain.address);
      } else if (type == ChainType.polygon) {
        tokens = await _fetchPolygonTokens(chain.address);
      } else if (type == ChainType.bnb) {
        tokens = await _fetchBnbTokens(chain.address);
      }

      _chains[type] = chain.copyWith(
        balance: balance,
        usdValue: usdValue,
        tokens: tokens,
      );
    } catch (e) {
      // Keep existing balance on error; don't overwrite with zero
      debugPrint('Failed to refresh ${chain.name}: $e');
    }
  }

  Future<List<ChainToken>> _fetchEthereumTokens(String address) async {
    final tokens = <ChainToken>[];
    for (final token in ERC20Token.popular) {
      try {
        final balance = await _ethereumService.getERC20Balance(
          token.contractAddress,
          address,
          tokenDecimals: token.decimals,
        );
        if (balance > 0) {
          final price = _getPriceForSymbol(token.symbol);
          tokens.add(ChainToken(
            name: token.name,
            symbol: token.symbol,
            contractAddress: token.contractAddress,
            balance: balance,
            usdValue: balance * price,
            decimals: token.decimals,
          ));
        }
      } catch (_) {}
    }
    return tokens;
  }

  Future<List<ChainToken>> _fetchPolygonTokens(String address) async {
    final tokens = <ChainToken>[];
    for (final token in PolygonToken.popular) {
      try {
        final balance = await _polygonService.getTokenBalance(
          token.contractAddress,
          address,
          tokenDecimals: token.decimals,
        );
        if (balance > 0) {
          final price = _getPriceForSymbol(token.symbol);
          tokens.add(ChainToken(
            name: token.name,
            symbol: token.symbol,
            contractAddress: token.contractAddress,
            balance: balance,
            usdValue: balance * price,
            decimals: token.decimals,
          ));
        }
      } catch (_) {}
    }
    return tokens;
  }

  Future<List<ChainToken>> _fetchBnbTokens(String address) async {
    final tokens = <ChainToken>[];
    for (final token in BEP20Token.popular) {
      try {
        final balance = await _bnbService.getTokenBalance(
          token.contractAddress,
          address,
          tokenDecimals: token.decimals,
        );
        if (balance > 0) {
          final price = _getPriceForSymbol(token.symbol);
          tokens.add(ChainToken(
            name: token.name,
            symbol: token.symbol,
            contractAddress: token.contractAddress,
            balance: balance,
            usdValue: balance * price,
            decimals: token.decimals,
          ));
        }
      } catch (_) {}
    }
    return tokens;
  }

  double _getPriceForSymbol(String symbol) {
    return _prices[symbol.toUpperCase()] ?? 0.0;
  }

  /// Update the mock price for a token.
  void updatePrice(String symbol, double price) {
    _prices[symbol.toUpperCase()] = price;
  }

  // -- Chain Enable/Disable --

  /// Toggle a chain on or off.
  Future<void> toggleChain(ChainType type, bool enabled) async {
    _chains[type] = _chains[type]!.copyWith(isEnabled: enabled);
    await _savePreferences();
    notifyListeners();

    if (enabled && _chains[type]!.balance == 0) {
      await _refreshChainBalance(type);
      notifyListeners();
    }
  }

  /// Enable a chain.
  Future<void> enableChain(ChainType type) async {
    await toggleChain(type, true);
  }

  /// Disable a chain.
  Future<void> disableChain(ChainType type) async {
    await toggleChain(type, false);
  }

  // -- Validation --

  /// Validate an address for a specific chain.
  bool validateAddress(ChainType type, String address) {
    return _services[type]!.validateAddress(address);
  }

  /// Estimate the fee for a transaction on a specific chain.
  Future<double> estimateFee(ChainType type) async {
    return await _services[type]!.estimateFee();
  }

  /// Get transaction history for a chain.
  Future<List<Map<String, dynamic>>> getTransactionHistory(ChainType type) async {
    final chain = _chains[type];
    if (chain == null || chain.address.isEmpty) return [];
    return await _services[type]!.getTransactionHistory(chain.address);
  }

  // -- Persistence --

  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final type in ChainType.values) {
        final key = 'chain_enabled_${type.name}';
        final enabled = prefs.getBool(key);
        if (enabled != null) {
          _chains[type] = _chains[type]!.copyWith(isEnabled: enabled);
        }
      }
    } catch (_) {}
  }

  Future<void> _savePreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final type in ChainType.values) {
        final key = 'chain_enabled_${type.name}';
        await prefs.setBool(key, _chains[type]!.isEnabled);
      }
    } catch (_) {}
  }

  // -- Auto Refresh --

  void _startAutoRefresh() {
    _stopAutoRefresh();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 60),
      (_) => refreshAllBalances(),
    );
  }

  void _stopAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  @override
  void dispose() {
    _stopAutoRefresh();
    super.dispose();
  }
}
