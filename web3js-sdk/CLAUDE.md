# CLAUDE.md - Web3.js SDK

## What This Is

This is the SolClone Web3.js SDK, forked from solana-labs/solana-web3.js. It is the primary JavaScript/TypeScript library for interacting with the SolClone blockchain. It provides `Connection` (RPC client), `PublicKey`, `Keypair`, `Transaction`, `Instruction`, and helpers for all built-in programs.

## Role in SolClone Ecosystem

- This is the **client-side foundation**. The DApp scaffold, wallet adapter, explorer, and wallet GUI all depend on this SDK (or its types).
- It communicates with the validator's JSON-RPC endpoint.
- It defines the TypeScript types that mirror the Rust SDK types in the validator.

## Key Technologies

- **Language**: TypeScript
- **Runtime**: Node.js 16+, browser, React Native
- **Package manager**: pnpm
- **Bundler**: Rollup (see `rollup.config.mjs`)
- **Testing**: Jest / Mocha (in `test/`)
- **Serialization**: borsh, buffer-layout
- **Cryptography**: `@noble/ed25519`, tweetnacl
- **RPC**: JSON-RPC 2.0 over HTTP and WebSocket

## Build Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build the library (CJS + ESM + browser bundles)
pnpm test             # Run test suite
pnpm lint             # Lint the code
pnpm doc              # Generate TypeDoc documentation
```

## Important Directories and Files

- `src/connection.ts` - The `Connection` class: all RPC methods (getAccountInfo, sendTransaction, getBalance, etc.)
- `src/publickey.ts` - `PublicKey` class: base58 encoding, program-derived addresses
- `src/keypair.ts` - `Keypair` class: ed25519 key generation and import/export
- `src/transaction/` - `Transaction` and `VersionedTransaction` construction and serialization
- `src/message/` - `Message` and `MessageV0` encoding for transaction messages
- `src/instruction.ts` - `TransactionInstruction` type
- `src/programs/` - Helpers for system program, stake, vote, etc.
- `src/account.ts` / `src/account-data.ts` - Account types
- `src/errors.ts` - Custom error classes for RPC and transaction errors
- `src/utils/` - Encoding utilities, cluster URLs, etc.
- `test/` - Test files
- `rollup.config.mjs` - Build configuration producing CJS, ESM, and browser bundles
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler configuration

## Testing Commands

```bash
pnpm test             # Run all tests
pnpm test -- --grep "Connection"  # Run tests matching a pattern
```

## Common Patterns

- **Connection**: The primary entry point. All RPC interactions go through `new Connection(url, commitment)`.
- **Transaction building**: Create a `Transaction`, add `TransactionInstruction` objects via `.add()`, then sign and send.
- **Commitment levels**: `processed`, `confirmed`, `finalized` -- always specify commitment for consistency.
- **PublicKey.findProgramAddress**: Used to derive PDAs (Program Derived Addresses) deterministically.
- **Borsh serialization**: Program instruction data is typically serialized with borsh for on-chain program consumption.
- **Browser/Node/React Native**: Three build targets with different crypto and fetch polyfills (see `src/fetch-impl.ts` and `src/__forks__/`).

## Things to Watch Out For

- This is the legacy v1 maintenance branch (`1.0.0-maintenance`). The modern v2 SDK lives in a different repo structure.
- The `src/__forks__/` directory contains platform-specific implementations (browser vs Node.js vs React Native).
- `rollup.config.mjs` produces multiple output formats; changes to exports need to be reflected in all bundles.
- The `connection.ts` file is very large and contains all RPC method implementations.
- WebSocket subscriptions (e.g., `onAccountChange`) have connection lifecycle management that can be tricky.

## Related Repositories

- Main repo: https://github.com/code2031/solana-clone
- Validator: `../validator/` -- The RPC endpoint this SDK communicates with
- DApp Scaffold: `../dapp-scaffold/` -- Uses this SDK to build example DApps
- Wallet Adapter: `../wallet-adapter/` -- Uses this SDK for wallet integration
- Explorer: `../explorer/` -- Uses this SDK to query the chain
- Program Library: `../program-library/` -- SPL programs whose clients use this SDK
