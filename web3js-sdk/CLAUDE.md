# Prism Web3.js SDK

Forked from [solana-labs/solana-web3.js](https://github.com/solana-labs/solana-web3.js). TypeScript client library for building DApps on the Prism blockchain.

## Build

```bash
npm install
npm run build
```

Uses rollup for bundling. Produces CJS, ESM, and browser bundles.

## Key Directories

- `src/` -- All TypeScript source code
- `src/connection.ts` -- RPC connection handling (all RPC methods)
- `src/transaction.ts` -- Transaction construction and signing
- `src/publickey.ts` -- Public key and address utilities
- `src/keypair.ts` -- Ed25519 key generation and import/export
- `src/programs/` -- Client-side program helpers (system, token)
- `test/` -- Unit and integration tests
- `rollup.config.mjs` -- Build configuration for multiple output formats

## Testing

```bash
npm test
npm run lint
```

Tests use mocha/chai. Some integration tests expect a local test validator running on port 8899.

## Ecosystem Links

- Monorepo: https://github.com/code2031/solana-clone
- Split repo: https://github.com/code2031/prism-web3js
- Validator: https://github.com/code2031/prism-validator
- DApp Scaffold: https://github.com/code2031/prism-dapp-scaffold
