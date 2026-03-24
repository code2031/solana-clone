# SolClone DApp Scaffold

Next.js starter template for building decentralized applications on the SolClone blockchain, forked from [solana-labs/dapp-scaffold](https://github.com/solana-labs/dapp-scaffold).

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Split repo:** [https://github.com/code2031/solclone-dapp-scaffold](https://github.com/code2031/solclone-dapp-scaffold)

## Prerequisites

- Node.js >= 16
- npm

## Build

```bash
git clone https://github.com/code2031/solclone-dapp-scaffold.git
cd solclone-dapp-scaffold

npm install
npm run build
```

## Development

```bash
npm run dev       # Start dev server on http://localhost:3000
```

Set `NEXT_PUBLIC_RPC_URL` to point to your SolClone validator.

## Testing

```bash
npm test
npm run lint
```

## Key Directories

| Directory | Description |
|-----------|-------------|
| `src/components/` | React components (wallet connect, send tx, etc.) |
| `src/contexts/` | React context providers for wallet and network |
| `src/hooks/` | Custom React hooks for blockchain interactions |
| `src/views/` | Page-level view components |
| `src/stores/` | Zustand state stores |
| `styles/` | Tailwind CSS configuration and global styles |
| `public/` | Static assets |

## Features

- Wallet integration with auto-connect/refresh via `@solana/wallet-adapter-react`
- State management with Zustand
- Pre-configured with Tailwind CSS and daisyUI
- Sample components demonstrating transactions and RPC calls
- Notification system

## Related Components

- [Wallet Adapter](https://github.com/code2031/solclone-wallet-adapter)
- [Web3.js SDK](https://github.com/code2031/solclone-web3js)
- [Explorer](https://github.com/code2031/solclone-explorer)

## License

This project inherits the license from the upstream [dapp-scaffold](https://github.com/solana-labs/dapp-scaffold) repository.
