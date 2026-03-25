# Prism Faucet

Repository: https://github.com/code2031/solana-clone

## Build

```bash
npm install          # install dependencies
npm run dev          # start dev server on :3000
npm run build        # production build
npm run lint         # run ESLint
npm test             # run test suite
```

## Key Files

- `app/page.tsx` -- Main faucet UI with address input and network selector
- `app/api/airdrop/route.ts` -- POST endpoint that processes airdrop requests
- `lib/rate-limiter.ts` -- In-memory rate limiting (10/hr per IP, 5/hr per address)
- `lib/rpc-client.ts` -- Prism RPC client wrapper for airdrop transactions
- `next.config.ts` -- Next.js configuration
- `tailwind.config.ts` -- Tailwind theme with Prism branding

## Architecture

Next.js App Router application. The frontend collects a wallet address and network
selection, then POSTs to `/api/airdrop`. The API route validates the address,
checks rate limits, and submits an airdrop transaction via the Prism RPC client.
The funder keypair is loaded from `FAUCET_KEYPAIR` on the server side.

Rate limiting uses two sliding-window counters: one keyed by client IP and one
keyed by the destination wallet address. Both are stored in-memory and reset on
server restart.

## Environment Variables

- `FAUCET_RPC_URL` -- RPC endpoint (default: `http://localhost:8899`)
- `FAUCET_KEYPAIR` -- Path to funder keypair JSON file
- `FAUCET_AMOUNT` -- PRISM tokens per request (default: `2`)
