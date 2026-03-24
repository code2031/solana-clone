# SolClone Wallet Adapter

Modular TypeScript wallet adapters and React components for SolClone DApps, forked from [anza-xyz/wallet-adapter](https://github.com/anza-xyz/wallet-adapter).

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Split repo:** [https://github.com/code2031/solclone-wallet-adapter](https://github.com/code2031/solclone-wallet-adapter)

## Prerequisites

- Node.js >= 16
- [pnpm](https://pnpm.io/)

## Build

```bash
git clone https://github.com/code2031/solclone-wallet-adapter.git
cd solclone-wallet-adapter

pnpm install
pnpm build
```

## Testing

```bash
pnpm test         # Run all package test suites (Jest)
pnpm lint         # Lint check
```

## Key Directories

| Directory | Description |
|-----------|-------------|
| `packages/core/base/` | Base adapter interface and types |
| `packages/core/react/` | React context providers and hooks (`useWallet`, `useConnection`) |
| `packages/ui/react-ui/` | Pre-built React wallet connection UI components |
| `packages/ui/material-ui/` | Material UI wallet components |
| `packages/ui/ant-design/` | Ant Design wallet components |
| `packages/wallets/` | Individual wallet adapter implementations |
| `packages/starter/` | Example starter apps |

## Architecture

- Uses **pnpm** workspaces for monorepo management
- Packages are published independently to npm
- Wallet adapters follow a standard interface defined in `packages/core/base/`

## Related Components

- [Backpack Wallet](https://github.com/code2031/solclone-backpack)
- [DApp Scaffold](https://github.com/code2031/solclone-dapp-scaffold)
- [Web3.js SDK](https://github.com/code2031/solclone-web3js)

## License

This project inherits the license from the upstream [wallet-adapter](https://github.com/anza-xyz/wallet-adapter) repository.
