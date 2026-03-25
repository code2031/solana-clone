/// Supported blockchain types.
enum ChainType { prism, solana, bitcoin, ethereum, polygon, bnb }

/// Represents a blockchain network with its current state.
class Chain {
  final ChainType type;
  final String name;
  final String symbol;
  final String iconEmoji;
  final String color; // hex color for UI
  final bool isEnabled;
  final double balance;
  final double usdValue;
  final String address;
  final List<ChainToken> tokens;

  const Chain({
    required this.type,
    required this.name,
    required this.symbol,
    required this.iconEmoji,
    required this.color,
    this.isEnabled = true,
    this.balance = 0,
    this.usdValue = 0,
    this.address = '',
    this.tokens = const [],
  });

  Chain copyWith({
    ChainType? type,
    String? name,
    String? symbol,
    String? iconEmoji,
    String? color,
    bool? isEnabled,
    double? balance,
    double? usdValue,
    String? address,
    List<ChainToken>? tokens,
  }) {
    return Chain(
      type: type ?? this.type,
      name: name ?? this.name,
      symbol: symbol ?? this.symbol,
      iconEmoji: iconEmoji ?? this.iconEmoji,
      color: color ?? this.color,
      isEnabled: isEnabled ?? this.isEnabled,
      balance: balance ?? this.balance,
      usdValue: usdValue ?? this.usdValue,
      address: address ?? this.address,
      tokens: tokens ?? this.tokens,
    );
  }

  /// Total USD value including all tokens on this chain.
  double get totalUsdValue {
    final tokenValue = tokens.fold(0.0, (sum, t) => sum + t.usdValue);
    return usdValue + tokenValue;
  }

  /// Short display address.
  String get shortAddress {
    if (address.length <= 11) return address;
    return '${address.substring(0, 6)}...${address.substring(address.length - 4)}';
  }

  /// Default chain configurations.
  static const Map<ChainType, Chain> defaults = {
    ChainType.prism: Chain(
      type: ChainType.prism,
      name: 'Prism',
      symbol: 'SOL',
      iconEmoji: '\u{1F7E3}', // purple circle
      color: 'FF9945FF',
    ),
    ChainType.solana: Chain(
      type: ChainType.solana,
      name: 'Solana',
      symbol: 'SOL',
      iconEmoji: '\u{1F7E3}', // purple circle
      color: 'FF7B61FF',
    ),
    ChainType.bitcoin: Chain(
      type: ChainType.bitcoin,
      name: 'Bitcoin',
      symbol: 'BTC',
      iconEmoji: '\u{1F7E0}', // orange circle
      color: 'FFF7931A',
    ),
    ChainType.ethereum: Chain(
      type: ChainType.ethereum,
      name: 'Ethereum',
      symbol: 'ETH',
      iconEmoji: '\u{1F535}', // blue circle
      color: 'FF627EEA',
    ),
    ChainType.polygon: Chain(
      type: ChainType.polygon,
      name: 'Polygon',
      symbol: 'POL',
      iconEmoji: '\u{1F7E3}', // purple circle
      color: 'FF8247E5',
    ),
    ChainType.bnb: Chain(
      type: ChainType.bnb,
      name: 'BNB Chain',
      symbol: 'BNB',
      iconEmoji: '\u{1F7E1}', // yellow circle
      color: 'FFF3BA2F',
    ),
  };
}

/// Represents a token on a specific chain (ERC-20, SPL, BEP-20, etc.).
class ChainToken {
  final String name;
  final String symbol;
  final String contractAddress;
  final double balance;
  final double usdValue;
  final int decimals;
  final String? iconUrl;

  const ChainToken({
    required this.name,
    required this.symbol,
    required this.contractAddress,
    this.balance = 0,
    this.usdValue = 0,
    this.decimals = 18,
    this.iconUrl,
  });

  ChainToken copyWith({
    String? name,
    String? symbol,
    String? contractAddress,
    double? balance,
    double? usdValue,
    int? decimals,
    String? iconUrl,
  }) {
    return ChainToken(
      name: name ?? this.name,
      symbol: symbol ?? this.symbol,
      contractAddress: contractAddress ?? this.contractAddress,
      balance: balance ?? this.balance,
      usdValue: usdValue ?? this.usdValue,
      decimals: decimals ?? this.decimals,
      iconUrl: iconUrl ?? this.iconUrl,
    );
  }
}
