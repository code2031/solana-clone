# Solana Clone

Complete fork of the Solana blockchain ecosystem.

## Components

| Directory | Source | Description |
|-----------|--------|-------------|
| `validator/` | [anza-xyz/agave](https://github.com/anza-xyz/agave) | Solana validator - blockchain core, CLI, runtime, Proof of History, gossip, RPC (Rust) |
| `web3js-sdk/` | [solana-labs/solana-web3.js](https://github.com/solana-labs/solana-web3.js) | JavaScript/TypeScript SDK for building DApps |
| `program-library/` | [solana-labs/solana-program-library](https://github.com/solana-labs/solana-program-library) | SPL programs - Token, Token-2022, Governance, Stake Pool, Memo (Rust) |
| `explorer/` | [solana-foundation/explorer](https://github.com/solana-foundation/explorer) | Block explorer web app (Next.js) |
| `wallet-adapter/` | [anza-xyz/wallet-adapter](https://github.com/anza-xyz/wallet-adapter) | Wallet adapter - React hooks/UI for connecting wallets to DApps |
| `wallet-gui/` | [coral-xyz/backpack](https://github.com/coral-xyz/backpack) | Backpack - open-source GUI wallet (React Native + web) |
| `dapp-scaffold/` | [solana-labs/dapp-scaffold](https://github.com/solana-labs/dapp-scaffold) | DApp starter template (Next.js) |

## Getting Started

### Prerequisites

- **Rust** (for validator and SPL programs): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js 18+** (for SDK, explorer, wallet, DApps)
- **Solana CLI** (built from `validator/`): `cd validator && cargo build --release`

### Build the Validator

```bash
cd validator
cargo build --release
```

### Run a Local Testnet

```bash
./validator/target/release/solana-test-validator
```

### Build the Explorer

```bash
cd explorer
pnpm install
pnpm dev
```

### Build the Wallet

```bash
cd wallet-gui
yarn install
yarn dev
```

### Build a DApp

```bash
cd dapp-scaffold
npm install
npm run dev
```

## Individual Forks

Each component is also forked separately:

- https://github.com/code2031/agave
- https://github.com/code2031/solana-web3.js
- https://github.com/code2031/solana-program-library
- https://github.com/code2031/explorer
- https://github.com/code2031/wallet-adapter
- https://github.com/code2031/backpack
- https://github.com/code2031/dapp-scaffold

## License

Each component retains its original license. See individual directories for details.
