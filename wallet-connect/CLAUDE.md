# CLAUDE.md — wallet-connect

Guidance for Claude Code when working in this package.

## Overview

WalletConnect v2 integration for Prism. Lets desktop DApp users pair with a mobile wallet via QR code and sign transactions remotely through the WalletConnect relay. TypeScript package, compiled with tsc.

## Build & Run

```bash
cd wallet-connect
npm install
npm run build        # Compile to dist/ (tsc)
npm run lint         # ESLint
npm test             # Jest/Vitest tests
```

Output goes to `dist/`. Package entry point is `dist/index.js`.

## Key Files

- `src/client.ts` — Wraps WalletConnect `SignClient`; handles `prism_signTransaction` and `prism_signMessage` RPC methods
- `src/qr-modal.ts` — Generates QR code from pairing URI using `qrcode` library; renders in a DOM modal
- `src/chains.ts` — Defines Prism CAIP-2 chain IDs: `prism:devnet`, `prism:testnet`, `prism:mainnet`
- `src/session.ts` — Persists sessions to localStorage, handles reconnect and expiry
- `src/types.ts` — Shared types (`PrismWCSession`, `SignRequest`, `ChainConfig`)

## Architecture

`client.ts` is the main entry point. It creates a WalletConnect `SignClient`, proposes sessions with Prism chain namespaces, and proxies sign requests to the paired wallet via the relay. `qr-modal.ts` is used only during initial pairing. Sessions persist across page reloads via `session.ts`.

## Dependencies

- `@walletconnect/sign-client` — WalletConnect v2 Sign Client
- `@walletconnect/utils` — WalletConnect utilities
- `qrcode` — QR code generation
- `@prism/web3js-sdk` — Transaction serialization
