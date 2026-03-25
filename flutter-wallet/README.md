# Prism Flutter Wallet

Cross-platform multi-chain crypto wallet supporting **32 blockchains** and **60+ tokens** with live pricing. Built with Dart and Flutter.

**Monorepo:** [https://github.com/code2031/prism-chain](https://github.com/code2031/prism-chain)
**Location:** `flutter-wallet/` within the main monorepo

## Supported Chains (32)

| Chain | Symbol | Address Format | Tokens |
|-------|--------|---------------|--------|
| Prism | SOL | Base58 | SPL |
| Solana | SOL | Base58 | 24 SPL tokens |
| Bitcoin | BTC | bc1... (SegWit) | — |
| Ethereum | ETH | 0x... | 18 ERC-20 tokens |
| Polygon | POL | 0x... | 7 tokens |
| BNB Chain | BNB | 0x... | 7 BEP-20 tokens |
| Avalanche | AVAX | 0x... | ERC-20 |
| Arbitrum | ETH | 0x... | ERC-20 |
| Optimism | ETH | 0x... | ERC-20 |
| Base | ETH | 0x... | ERC-20 |
| Fantom | FTM | 0x... | ERC-20 |
| Cronos | CRO | 0x... | ERC-20 |
| TRON | TRX | T... (Base58) | — |
| Dogecoin | DOGE | D... | — |
| Litecoin | LTC | ltc1... | — |
| Cardano | ADA | addr1... | — |
| XRP Ledger | XRP | r... | — |
| Cosmos | ATOM | cosmos1... | — |
| Polkadot | DOT | 1... (SS58) | — |
| NEAR | NEAR | .near | — |
| Sui | SUI | 0x... | — |
| Aptos | APT | 0x... | — |
| Stellar | XLM | G... | — |
| Algorand | ALGO | Base32 | — |
| Hedera | HBAR | 0.0.xxxxx | — |
| TON | TON | EQ/UQ... | — |
| Kaspa | KAS | kaspa:... | — |
| Filecoin | FIL | f1/f4... | — |
| Celestia | TIA | celestia1... | — |
| Sei | SEI | sei1... | — |
| Bitcoin Cash | BCH | bitcoincash:q... | — |
| Monero | XMR | 4... (95 char) | — |

## Live Pricing

Prices fetched from **CoinGecko API** in real-time (60-second cache). Supports 80+ price feeds including all native tokens and popular DeFi/meme tokens. Falls back to built-in defaults when offline.

Set your CoinGecko API key in `flutter-wallet/.env`:
```
COINGECKO_API_KEY=your-key-here
```

Or pass at build time:
```bash
flutter run --dart-define=COINGECKO_API_KEY=your-key-here
```

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (stable channel, 3.41+)
- Dart SDK (bundled with Flutter)
- Chrome (for web target)
- Xcode (for iOS) or Android Studio (for Android)

## Build and Run

```bash
cd flutter-wallet

# Web
flutter run -d chrome

# Mobile (connected device or emulator)
flutter run

# Desktop
flutter run -d linux

# Production builds
flutter build web
flutter build apk          # Android
flutter build ios           # iOS
```

## Features

- **32-chain wallet** — unified portfolio across all major blockchains
- **Live pricing** — real-time USD values from CoinGecko
- **60+ tokens** — SPL, ERC-20, BEP-20, Polygon tokens with real contract addresses
- **Create / Import wallet** — generate new keypairs or import via BIP39 mnemonic
- **Chain-aware send/receive** — validates addresses per chain, correct QR codes
- **Staking** — delegate, deactivate, and withdraw stake (Prism/Solana)
- **Token management** — view, send, and receive tokens on any supported chain
- **DApp browser** — interact with Prism DApps from within the wallet
- **Enable/disable chains** — customize which chains appear in your portfolio

## Architecture

- **Provider** for state management (WalletProvider, MultiChainProvider, NetworkProvider)
- **BIP39** mnemonic generation with chain-specific HD derivation paths
- **Ed25519** (Solana/Prism), **secp256k1** (EVM/BTC), chain-native crypto
- **CoinGecko API** for live prices, 24h changes, and 7-day price charts
- JSON-RPC / REST API per chain (Blockstream for BTC, Etherscan for ETH, etc.)

## Key Directories

| Directory | Description |
|-----------|-------------|
| `lib/screens/` | App screens (home, send, receive, staking, DApp browser) |
| `lib/models/` | Data models (wallet, token, transaction, chain) |
| `lib/services/` | RPC client, price service, wallet service |
| `lib/services/chains/` | 32 chain-specific services (balance, tx, address validation) |
| `lib/providers/` | State management (wallet, network, multi-chain) |
| `lib/widgets/` | Reusable UI widgets (chain cards, balance cards, selectors) |

## Testing

```bash
flutter test
flutter analyze
```

## License

MIT
