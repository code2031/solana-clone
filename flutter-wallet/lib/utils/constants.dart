class AppConstants {
  static const String appName = 'SolClone Wallet';
  static const String appVersion = '1.0.0';

  // ── SolClone / Solana RPC URLs ──
  static const String mainnetRpcUrl = 'https://api.mainnet-beta.solana.com';
  static const String testnetRpcUrl = 'https://api.testnet.solana.com';
  static const String devnetRpcUrl = 'https://api.devnet.solana.com';
  static const String localRpcUrl = 'http://localhost:8899';

  // Default network
  static const String defaultRpcUrl = localRpcUrl;
  static const String defaultNetwork = 'localnet';

  // ── Multi-chain RPC / API URLs ──

  // Bitcoin - Blockstream.info REST API
  static const String bitcoinApiUrl = 'https://blockstream.info';
  static const String bitcoinTestnetApiUrl = 'https://blockstream.info/testnet';

  // Ethereum - public JSON-RPC endpoints
  static const String ethereumRpcUrl = 'https://eth.llamarpc.com';
  static const String ethereumGoerliRpcUrl = 'https://rpc.ankr.com/eth_goerli';

  // Solana (real mainnet / devnet, distinct from SolClone local)
  static const String solanaMainnetRpcUrl = 'https://api.mainnet-beta.solana.com';
  static const String solanaDevnetRpcUrl = 'https://api.devnet.solana.com';

  // Polygon (PoS) - public JSON-RPC
  static const String polygonRpcUrl = 'https://polygon-rpc.com';
  static const String polygonMumbaiRpcUrl = 'https://rpc.ankr.com/polygon_mumbai';

  // BNB Smart Chain - public JSON-RPC
  static const String bnbRpcUrl = 'https://bsc-dataseed.binance.org';
  static const String bnbTestnetRpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545';

  // ── Block Explorers ──
  static const String bitcoinExplorer = 'https://blockstream.info';
  static const String ethereumExplorer = 'https://etherscan.io';
  static const String solanaExplorer = 'https://explorer.solana.com';
  static const String polygonExplorer = 'https://polygonscan.com';
  static const String bnbExplorer = 'https://bscscan.com';

  // ── Program IDs (SolClone / Solana) ──
  static const String systemProgramId = '11111111111111111111111111111111';
  static const String tokenProgramId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  static const String associatedTokenProgramId = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
  static const String stakeProgramId = 'Stake11111111111111111111111111111111111111';

  // ── Storage Keys ──
  static const String walletMnemonicKey = 'wallet_mnemonic';
  static const String walletPrivateKeyKey = 'wallet_private_key';
  static const String walletPublicKeyKey = 'wallet_public_key';
  static const String selectedNetworkKey = 'selected_network';
  static const String customRpcUrlKey = 'custom_rpc_url';
  static const String biometricEnabledKey = 'biometric_enabled';
  static const String hasOnboardedKey = 'has_onboarded';
  static const String multiChainViewKey = 'multi_chain_view_enabled';

  // ── SOL Decimals ──
  static const int solDecimals = 9;
  static const double lamportsPerSol = 1000000000;

  // ── Chain-specific Decimals ──
  static const int btcDecimals = 8;
  static const int ethDecimals = 18;
  static const double satoshisPerBtc = 100000000;
  static const double weiPerEth = 1e18;

  // ── Animation Durations ──
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 400);
  static const Duration longAnimation = Duration(milliseconds: 800);
}
