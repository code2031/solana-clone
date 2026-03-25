# Prism Block Explorer

Forked from [solana-foundation/explorer](https://github.com/solana-foundation/explorer). A Next.js web application for browsing blocks, transactions, accounts, and programs on the Prism blockchain.

## Build

```bash
pnpm install
pnpm build
```

## Key Directories

- `app/` -- Next.js App Router pages and layouts
- `components/` -- Reusable React UI components
- `components/ui/` -- shadcn/ui primitives (Button, Card, Table, etc.)
- `lib/` -- Utility functions, RPC helpers, data fetching
- `public/` -- Static assets (icons, images)
- `styles/` -- Global CSS and Tailwind configuration

## Testing

```bash
pnpm test
pnpm lint
pnpm dev                                 # local dev server on port 3000
```

## Development

- Uses **pnpm** as the package manager
- UI built with **shadcn/ui** and **Tailwind CSS**
- Connects to the validator JSON-RPC endpoint for all blockchain data
- Set `NEXT_PUBLIC_RPC_URL` environment variable to point to your validator

## Ecosystem Links

- Monorepo: https://github.com/code2031/prism-chain
- Split repo: https://github.com/code2031/prism-explorer
- Validator: https://github.com/code2031/prism-validator
- Web3.js SDK: https://github.com/code2031/prism-web3js
