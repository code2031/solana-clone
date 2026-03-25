# Prism Flutter Wallet

Custom cross-platform mobile and web wallet for the Prism blockchain, part of the Prism ecosystem. Built with Dart and Flutter.

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Location:** `flutter-wallet/` within the main monorepo

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (stable channel)
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

# Production build
flutter build web
flutter build apk          # Android
flutter build ios           # iOS
```

## Features

- **Create / Import wallet** -- generate new keypairs or import via mnemonic phrase
- **Send / Receive SOL** -- transfer native tokens with address QR codes
- **Staking** -- delegate, deactivate, and withdraw stake
- **Token management** -- view, send, and receive SPL tokens
- **DApp browser** -- interact with Prism DApps from within the wallet

## Architecture

- **Provider** for state management
- **BIP39** for mnemonic phrase generation and recovery
- **Ed25519** for cryptographic key operations
- Connects to the Prism validator via JSON-RPC

## Key Directories

| Directory | Description |
|-----------|-------------|
| `lib/` | Main Dart source code |
| `lib/screens/` | App screens (home, send, receive, staking, etc.) |
| `lib/models/` | Data models (wallet, token, transaction) |
| `lib/services/` | RPC client and blockchain interaction logic |
| `lib/providers/` | State management providers |
| `lib/widgets/` | Reusable UI widgets |
| `test/` | Unit and widget tests |

## Testing

```bash
flutter test
flutter analyze
```

## Related Components

- [CLI Wallet](../cli-wallet/)
- [Validator](https://github.com/code2031/prism-validator)
- [Web3.js SDK](https://github.com/code2031/prism-web3js)
- [Explorer](https://github.com/code2031/prism-explorer)

## License

MIT
