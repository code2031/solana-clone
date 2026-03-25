# Prism Backpack Wallet

Cross-platform wallet application for the Prism blockchain, forked from [coral-xyz/backpack](https://github.com/coral-xyz/backpack).

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Split repo:** [https://github.com/code2031/prism-backpack](https://github.com/code2031/prism-backpack)

## Prerequisites

- Node.js >= 16
- [Yarn](https://yarnpkg.com/) v1
- For mobile: Xcode (iOS) or Android Studio (Android)

## Build

```bash
git clone https://github.com/code2031/prism-backpack.git
cd prism-backpack

yarn install
yarn build          # Production build of all packages
yarn start          # Start everything in dev mode
```

> Run `yarn build` before `yarn start` in a fresh clone.

## Testing

```bash
yarn test
yarn lint
```

## Development (Browser Extension)

1. Run `yarn start` to launch the dev build
2. Go to `chrome://extensions`, enable Developer Mode
3. Drag `packages/app-extension/dev` into the extensions page
4. The extension supports live-reloading during development

Optionally enable `chrome://flags/#allow-insecure-localhost` for local SSL.

## Key Directories

| Directory | Description |
|-----------|-------------|
| `packages/common/` | Shared utilities, types, and constants |
| `packages/provider-core/` | Wallet provider injection for DApps |
| `packages/secure-background/` | Keystore and secure key management |
| `packages/recoil/` | Global state management with Recoil |
| `web/` | Web-based wallet application |
| `mobile/` | React Native mobile wallet (iOS/Android) |
| `backend/` | Backend services (notifications, indexing) |

## Related Components

- [Wallet Adapter](https://github.com/code2031/prism-wallet-adapter)
- [Explorer](https://github.com/code2031/prism-explorer)
- [DApp Scaffold](https://github.com/code2031/prism-dapp-scaffold)

## License

This project inherits the license from the upstream [backpack](https://github.com/coral-xyz/backpack) repository.
