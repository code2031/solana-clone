# Prism Explorer

Web-based block explorer for the Prism blockchain, forked from [solana-foundation/explorer](https://github.com/solana-foundation/explorer).

**Monorepo:** [https://github.com/code2031/prism-chain](https://github.com/code2031/prism-chain)
**Split repo:** [https://github.com/code2031/prism-explorer](https://github.com/code2031/prism-explorer)

## Prerequisites

- Node.js >= 18
- [pnpm](https://pnpm.io/)

## Build

```bash
git clone https://github.com/code2031/prism-explorer.git
cd prism-explorer

pnpm install
pnpm build
```

## Development

```bash
pnpm dev          # Start dev server on http://localhost:3000
```

Set the `NEXT_PUBLIC_RPC_URL` environment variable to point to your Prism validator.

## Testing

```bash
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # End-to-end tests (playwright)
pnpm lint         # Lint check
```

## Key Directories

| Directory | Description |
|-----------|-------------|
| `app/` | Next.js App Router pages and layouts |
| `components/` | Reusable React UI components |
| `components/ui/` | shadcn/ui primitives (Button, Card, Table, etc.) |
| `lib/` | Utility functions, RPC helpers, data fetching |
| `public/` | Static assets (icons, images) |
| `styles/` | Global CSS and Tailwind configuration |

## Stack

- **Next.js** (App Router)
- **shadcn/ui** + **Tailwind CSS** for the UI layer
- Connects to the validator JSON-RPC endpoint for all blockchain data

## Related Components

- [Validator](https://github.com/code2031/prism-validator)
- [Web3.js SDK](https://github.com/code2031/prism-web3js)
- [DApp Scaffold](https://github.com/code2031/prism-dapp-scaffold)

## License

This project inherits the license from the upstream [explorer](https://github.com/solana-foundation/explorer) repository.
