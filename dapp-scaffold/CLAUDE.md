# SolClone DApp Scaffold

Forked from [solana-labs/dapp-scaffold](https://github.com/solana-labs/dapp-scaffold). A Next.js starter template for building decentralized applications on the SolClone blockchain.

## Build

```bash
npm install
npm run build
```

## Key Directories

- `src/` -- Application source code
- `src/components/` -- React components (wallet connect, send tx, etc.)
- `src/contexts/` -- React context providers for wallet and network
- `src/hooks/` -- Custom React hooks for blockchain interactions
- `src/views/` -- Page-level view components
- `src/stores/` -- Zustand state stores
- `public/` -- Static assets
- `styles/` -- Tailwind CSS configuration and global styles

## Testing

```bash
npm test
npm run lint
npm run dev                              # local dev server on port 3000
```

## Development

- Uses **@solana/wallet-adapter-react** for wallet connectivity
- Pre-configured with Tailwind CSS and daisyUI
- Set `NEXT_PUBLIC_RPC_URL` to point to your SolClone validator
- Designed as a starting point -- clone and customize for your DApp

## Ecosystem Links

- Monorepo: https://github.com/code2031/solana-clone
- Split repo: https://github.com/code2031/solclone-dapp-scaffold
- Wallet Adapter: https://github.com/code2031/solclone-wallet-adapter
- Web3.js SDK: https://github.com/code2031/solclone-web3js
