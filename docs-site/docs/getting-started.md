---
sidebar_position: 2
---

# Getting Started

This guide walks you through building SolClone from source, starting a local testnet, and sending your first transaction.

## Prerequisites

Ensure you have the following installed:

| Dependency | Version | Purpose |
|-----------|---------|---------|
| **Rust** | 1.70+ | Validator and program compilation |
| **Node.js** | 20+ | SDK, CLI, Explorer, and tooling |
| **Docker** | 24+ | (Optional) Containerized deployment |
| **Cargo** | Latest | Rust package manager |

```bash
# Verify installations
rustc --version
node --version
cargo --version
```

## Build the Validator

```bash
# Clone the repository
git clone https://github.com/solclone/solclone.git
cd solana-clone

# Build the validator in release mode
cd validator
cargo build --release

# The binary will be at target/release/solclone-validator
```

## Start a Local Testnet

### Option 1: Using the script

```bash
# From the project root
./scripts/start-testnet.sh

# This starts:
#   - Validator on port 8899 (RPC)
#   - Faucet on port 9900
#   - Explorer on port 3000
```

### Option 2: Using Docker

```bash
# Start the full network stack
docker-compose up -d

# Check status
docker-compose ps

# View validator logs
docker-compose logs -f validator
```

### Option 3: Manual start

```bash
# Start the validator directly
./validator/target/release/solclone-validator \
  --rpc-port 8899 \
  --ledger ./ledger \
  --log-level info
```

## Install the CLI Wallet

```bash
# From the project root
cd cli-wallet
npm install
npm run build
npm link  # Makes 'solclone' available globally

# Verify
solclone --version
```

## Generate a Keypair

```bash
# Generate a new keypair (saved to ~/.config/solclone/id.json)
solclone keygen

# View your address
solclone address
```

## Get Test SOL

```bash
# Request an airdrop from the faucet
solclone airdrop 10

# Check your balance
solclone balance
```

## Send Your First Transaction

```bash
# Generate a second keypair for the recipient
solclone keygen --outfile recipient.json

# Transfer 2 SOL
solclone transfer <RECIPIENT_ADDRESS> 2

# Verify the transfer
solclone balance
solclone balance <RECIPIENT_ADDRESS>
```

## Explore the Chain

Open the block explorer at [http://localhost:3000](http://localhost:3000) to see:
- Recent blocks and transactions
- Account details and token balances
- Network health metrics

## Next Steps

- [CLI Reference](./cli-reference) -- all wallet commands
- [SDK Guide](./sdk-guide) -- build dApps with the TypeScript SDK
- [Anchor Guide](./anchor-guide) -- write on-chain programs
- [DeFi Guide](./defi-guide) -- use SolSwap, SolLend, and SCUSD
