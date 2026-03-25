# CLAUDE.md — connect-kit

Guidance for Claude Code when working in this package.

## Overview

Prism Connect Kit. Drop-in React component library for DApp wallet connection. Provides `PrismProvider`, `ConnectButton`, `WalletModal`, `useWallet`, and `usePrism`. Composes `@prism/wallet-standard` and `@prism/wallet-connect` under a unified React context. TypeScript + React.

## Build & Run

```bash
cd connect-kit
npm install
npm run build        # tsc + bundle (outputs to dist/)
npm run dev          # Storybook dev server for component development
npm run lint         # ESLint
npm test             # Jest/Vitest + React Testing Library
```

Output goes to `dist/`. Package entry point is `dist/index.js` with types at `dist/index.d.ts`.

## Key Files

- `src/provider.tsx` — `PrismProvider` React context provider; manages wallet state, connection, network
- `src/components/ConnectButton.tsx` — Connect/disconnect button; shows truncated address when connected
- `src/components/WalletModal.tsx` — Modal overlay listing detected wallets with icons and install links
- `src/hooks/useWallet.ts` — Hook exposing `publicKey`, `connected`, `signTransaction`, `signMessage`, `disconnect`
- `src/hooks/usePrism.ts` — Hook exposing `connection`, `balance`, `network`, `cluster`
- `src/theme.ts` — Light/dark theme tokens and CSS variable generation
- `src/detect.ts` — Aggregates wallets from wallet-standard and wallet-connect

## Architecture

`PrismProvider` is the root. It initializes wallet detection (via `@prism/wallet-standard`) and WalletConnect (via `@prism/wallet-connect`), manages active wallet state in React context, and exposes it through `useWallet` and `usePrism`. The UI components (`ConnectButton`, `WalletModal`) consume these hooks internally.

## Dependencies

- `@prism/wallet-standard` — Wallet Standard detection and registration
- `@prism/wallet-connect` — WalletConnect v2 mobile pairing
- `@prism/web3js-sdk` — Connection, transaction types
- `react`, `react-dom` — Peer dependencies (>=18)
