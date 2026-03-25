---
sidebar_position: 1
slug: /intro
---

# What is Prism?

Prism is a **Solana-compatible Layer 1 blockchain** built from scratch for learning, experimentation, and development. It implements the core Solana architecture -- a custom validator, transaction processing pipeline, RPC interface, and program runtime -- while remaining approachable for developers who want to understand blockchain internals.

## Architecture Overview

Prism is composed of several interconnected systems:

```
                    +------------------+
                    |   Web3.js SDK    |
                    +--------+---------+
                             |
                    +--------v---------+
                    |    JSON-RPC API   |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v----------+     +-----------v-----------+
    |     Validator       |     |    Program Runtime     |
    |  (Rust, PoH + PoS) |     |   (BPF / Anchor)      |
    +-----+---------+----+     +-----------+-----------+
          |         |                      |
    +-----v----+ +--v-------+    +---------v----------+
    | Consensus | | Ledger   |    |  Program Library    |
    | Engine    | | Storage  |    |  (Token, NFT, DeFi) |
    +-----------+ +----------+    +--------------------+
```

### Core Components

| Component | Description | Location |
|-----------|-------------|----------|
| **Validator** | Rust-based node with Proof of History + Proof of Stake consensus | `validator/` |
| **Web3.js SDK** | TypeScript SDK compatible with `@solana/web3.js` patterns | `web3js-sdk/` |
| **CLI Wallet** | Full-featured command-line wallet (`prism` command) | `cli-wallet/` |
| **Program Library** | SPL-compatible token, NFT, and governance programs | `program-library/` |
| **Explorer** | Real-time blockchain explorer web app | `explorer/` |
| **DeFi Suite** | SolSwap DEX, SolLend lending, SCUSD stablecoin | `defi/` |
| **NFT Marketplace** | SolMart -- mint, list, buy NFTs | `nft-marketplace/` |
| **Playground** | Interactive SDK playground with Monaco editor | `playground/` |
| **Templates** | Anchor program templates (token, NFT, escrow, voting, staking) | `templates/` |

## Key Features

- **Full Solana RPC compatibility** -- same JSON-RPC methods you already know
- **Built-in faucet** for testnet SOL
- **Docker support** -- spin up a full network with `docker-compose up`
- **Anchor templates** -- scaffold projects with `prism init`
- **DeFi primitives** -- AMM, lending, stablecoin out of the box
- **Interactive playground** -- test SDK calls in the browser

## Quick Start

```bash
# Build the validator
cd validator && cargo build --release

# Start a local testnet
./scripts/start-testnet.sh

# Get some test SOL
prism airdrop 10

# Check your balance
prism balance
```

See the [Getting Started](./getting-started) guide for full setup instructions.
