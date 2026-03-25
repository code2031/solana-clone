# Prism Wallet Adapter

Forked from [anza-xyz/wallet-adapter](https://github.com/anza-xyz/wallet-adapter). TypeScript monorepo providing React hooks and UI components for connecting wallets to Prism DApps.

## Build

```bash
pnpm install
pnpm build
```

## Key Directories

- `packages/core/base/` -- Base adapter interface and types
- `packages/core/react/` -- React context providers and hooks (`useWallet`, `useConnection`)
- `packages/ui/react-ui/` -- Pre-built React wallet connection UI components
- `packages/ui/material-ui/` -- Material UI wallet components
- `packages/ui/ant-design/` -- Ant Design wallet components
- `packages/wallets/` -- Individual wallet adapter implementations
- `packages/starter/` -- Example starter apps

## Testing

```bash
pnpm test
pnpm lint
```

Each package has its own test suite. Tests use Jest.

## Development

- Uses **pnpm** workspaces for monorepo management
- Packages are published independently to npm
- Wallet adapters follow a standard interface defined in `packages/core/base/`

## Ecosystem Links

- Monorepo: https://github.com/code2031/prism-chain
- Split repo: https://github.com/code2031/prism-wallet-adapter
- Backpack Wallet: https://github.com/code2031/prism-backpack
- DApp Scaffold: https://github.com/code2031/prism-dapp-scaffold
