# SolClone Backpack Wallet

Forked from [coral-xyz/backpack](https://github.com/coral-xyz/backpack). A cross-platform wallet application supporting both web and React Native (mobile). Uses yarn workspaces and turborepo for monorepo orchestration.

## Build

```bash
yarn install
yarn start                               # start the web wallet
```

## Key Directories

- `packages/` -- Core shared logic and libraries
- `packages/common/` -- Shared utilities, types, and constants
- `packages/provider-core/` -- Wallet provider injection for DApps
- `packages/secure-background/` -- Keystore and secure key management
- `packages/recoil/` -- Global state management with Recoil
- `web/` -- Web-based wallet application
- `mobile/` -- React Native mobile wallet (iOS/Android)
- `backend/` -- Backend services (notifications, indexing)

## Testing

```bash
yarn test
yarn lint
```

## Development

- Uses **yarn** workspaces + **turborepo** for task orchestration
- State management via **Recoil**
- Mobile builds require Xcode (iOS) or Android Studio (Android)
- The wallet injects a provider into DApp browser contexts

## Ecosystem Links

- Monorepo: https://github.com/code2031/solana-clone
- Split repo: https://github.com/code2031/solclone-backpack
- Wallet Adapter: https://github.com/code2031/solclone-wallet-adapter
- Explorer: https://github.com/code2031/solclone-explorer
