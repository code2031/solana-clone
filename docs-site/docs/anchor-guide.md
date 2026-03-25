---
sidebar_position: 5
---

# Anchor Guide

SolClone includes a set of Anchor program templates that let you quickly scaffold and deploy on-chain programs. This guide covers the available templates and how to build with them.

## Prerequisites

- SolClone CLI installed (`solclone` command available)
- Rust toolchain with `anchor-cli` installed
- A running SolClone testnet

```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
```

## Initializing a Project

Use `solclone init` to scaffold a new project from a template:

```bash
# See available templates
solclone init --help

# Create a project
solclone init my-project --template <template-name>
```

### Available Templates

| Template | Command | Description |
|----------|---------|-------------|
| **Token** | `--template token` | SPL token with mint, transfer, burn |
| **NFT Collection** | `--template nft` | NFT collection with minting and royalties |
| **Escrow** | `--template escrow` | Trustless token swap escrow |
| **Voting** | `--template voting` | On-chain governance proposals and voting |
| **Staking Pool** | `--template staking` | Stake tokens and earn rewards |

## Token Program

Create a fungible token with full lifecycle management.

```bash
solclone init my-token --template token
cd my-token
```

### Instructions

- `initialize_mint(decimals, name, symbol)` -- Create a new token mint
- `mint_to(amount)` -- Mint tokens to a destination account
- `transfer(amount)` -- Transfer tokens between accounts
- `burn(amount)` -- Burn tokens, reducing total supply

### Example Client Code

```typescript
import * as anchor from '@coral-xyz/anchor';

const program = anchor.workspace.SolcloneToken;

// Initialize a mint
await program.methods
  .initializeMint(9, "My Token", "MTK")
  .accounts({ /* ... */ })
  .rpc();

// Mint tokens
await program.methods
  .mintTo(new anchor.BN(1_000_000_000))
  .accounts({ /* ... */ })
  .rpc();
```

## NFT Collection Program

Build NFT collections with metadata and royalty enforcement.

```bash
solclone init my-nfts --template nft
cd my-nfts
```

### Instructions

- `create_collection(name, symbol, uri, royalty_bps)` -- Create a collection
- `mint_nft(name, uri, royalty_bps)` -- Mint an NFT into the collection
- `transfer_nft()` -- Transfer NFT ownership

### Example

```typescript
// Create a collection (5% royalty)
await program.methods
  .createCollection("Cool Cats", "CATS", "https://metadata.uri/collection", 500)
  .accounts({ /* ... */ })
  .rpc();

// Mint an NFT
await program.methods
  .mintNft("Cat #1", "https://metadata.uri/1.json", 500)
  .accounts({ /* ... */ })
  .rpc();
```

## Escrow Program

Trustless atomic swaps between two token types.

```bash
solclone init my-escrow --template escrow
cd my-escrow
```

### Instructions

- `initialize(seed, deposit_amount, receive_amount)` -- Lock token A, specify token B amount
- `exchange()` -- Taker sends B, receives A (atomic)
- `cancel()` -- Initializer reclaims locked tokens

### Flow

1. Alice calls `initialize` -- deposits 100 Token A, wants 50 Token B
2. Bob calls `exchange` -- sends 50 Token B to Alice, receives 100 Token A
3. If no taker: Alice calls `cancel` to reclaim her Token A

## Voting Program

On-chain governance with weighted voting.

```bash
solclone init my-dao --template voting
cd my-dao
```

### Instructions

- `create_proposal(id, title, description, options, voting_ends_at)` -- Create a proposal
- `cast_vote(option_index, weight)` -- Vote on a proposal (one vote per wallet)
- `finalize()` -- Count votes and declare winner (after deadline)

### Example

```typescript
// Create a proposal
await program.methods
  .createProposal(
    new anchor.BN(1),
    "Treasury Allocation",
    "How should we allocate Q1 funds?",
    ["Development", "Marketing", "Community"],
    new anchor.BN(Math.floor(Date.now() / 1000) + 86400) // 24h from now
  )
  .accounts({ /* ... */ })
  .rpc();

// Cast a vote (option 0, weight 1)
await program.methods
  .castVote(0, new anchor.BN(1))
  .accounts({ /* ... */ })
  .rpc();
```

## Staking Pool Program

DeFi staking with configurable reward rates.

```bash
solclone init my-staking --template staking
cd my-staking
```

### Instructions

- `initialize_pool(reward_rate, lock_duration)` -- Create a staking pool
- `stake(amount)` -- Deposit tokens to earn rewards
- `unstake(amount)` -- Withdraw tokens and claim rewards
- `distribute_rewards()` -- Update reward calculations (called by authority)

## Build, Test, Deploy

All templates follow the same workflow:

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to SolClone devnet
anchor deploy --provider.cluster http://localhost:8899

# Get the program ID
anchor keys list
```

## Project Structure

```
my-project/
  programs/
    Cargo.toml          # Rust dependencies
    src/
      lib.rs            # Program logic
  README.md             # Template documentation
```

## Next Steps

- [SDK Guide](./sdk-guide) -- interact with your programs from TypeScript
- [DeFi Guide](./defi-guide) -- learn about SolClone DeFi protocols
- [CLI Reference](./cli-reference) -- deploy and manage from the command line
