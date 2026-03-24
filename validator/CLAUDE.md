# CLAUDE.md - Validator

## What This Is

This is the SolClone validator node, forked from anza-xyz/agave. It is the core blockchain component of the SolClone ecosystem. It implements the full Solana-compatible blockchain: consensus (Tower BFT), Proof of History, transaction processing, accounts database, gossip protocol, JSON-RPC API, and the Solana Virtual Machine (SVM).

## Role in SolClone Ecosystem

- This is the **backbone** of the entire network. Every other component depends on it.
- The RPC server here is what the explorer, web3js-sdk, wallet-adapter, wallet-gui, and dapp-scaffold all talk to.
- The SDK crate (`sdk/`) defines the core types (Pubkey, Transaction, Instruction) used across the ecosystem.
- The built-in programs (`programs/`) implement system, vote, stake, and BPF loader logic.
- The program-library repo builds programs that deploy on top of this runtime.

## Key Technologies

- **Language**: Rust
- **Rust toolchain**: 1.94.0 (pinned in `rust-toolchain.toml`)
- **Build system**: Cargo workspaces (~130 crates)
- **Networking**: QUIC (via `quinn`), UDP, TCP
- **Serialization**: `bincode`, `serde`, `borsh`
- **Cryptography**: `ed25519-dalek`, `curve25519-dalek`, `sha2`, `sha3`
- **Storage**: Custom AppendVec-based accounts DB, RocksDB for ledger
- **Consensus**: Tower BFT (Solana's PoH-based PBFT variant)

## Build Commands

```bash
cargo build --release                          # Full workspace build
cargo build --release --bin solana-validator    # Validator binary only
cargo build --release --bin solana             # CLI only
cargo build --release --bin solana-test-validator  # Test validator
cargo test                                     # All tests
cargo test -p solana-core                      # Tests for a specific crate
cargo test -p solana-runtime                   # Runtime tests
cargo clippy --workspace                       # Lint
cargo fmt --all -- --check                     # Format check
```

## Important Directories and Files

- `core/` - The heart of the validator: replay stage, banking stage, PoH service, Tower BFT, leader scheduling
- `runtime/` - Bank (the state machine), transaction processing, snapshot logic
- `accounts-db/` - AppendVec storage, account indexing, cleaning, shrinking
- `sdk/` - Core types shared across the ecosystem (Pubkey, Keypair, Transaction, Instruction, etc.)
- `programs/` - Built-in programs: system_program, vote, stake, bpf_loader
- `svm/` - The Solana Virtual Machine that executes transactions
- `ledger/` - Blockstore backed by RocksDB, shred storage
- `gossip/` - Cluster protocol for node discovery and protocol state sharing
- `rpc/` - JSON-RPC API (getAccountInfo, getBalance, sendTransaction, etc.)
- `cli/` - The `solana` CLI tool
- `validator/` - Validator entry point, startup, and configuration
- `turbine/` - Block propagation (shred retransmit tree)
- `streamer/` - QUIC/UDP packet I/O
- `Cargo.toml` - Workspace root manifest
- `rust-toolchain.toml` - Pinned Rust version
- `ci/` - CI scripts for building, testing, and releasing

## Testing Commands

```bash
cargo test                                # All workspace tests
cargo test -p solana-core                 # Core validator logic tests
cargo test -p solana-runtime              # Runtime/bank tests
cargo test -p solana-sdk                  # SDK type tests
cargo test -p solana-rpc                  # RPC server tests
cargo test -p solana-gossip               # Gossip protocol tests
cargo test -p solana-ledger               # Ledger/blockstore tests
cargo test -p solana-accounts-db          # Accounts database tests
cargo test -p solana-local-cluster        # Integration tests (slow, multi-node)
```

## Common Patterns

- **Bank**: The central state object. A new Bank is created for each slot, forked from the parent. Banks hold all account state and process transactions.
- **Stages**: The validator pipeline is organized as "stages" (banking_stage, replay_stage, fetch_stage, etc.) connected by crossbeam channels.
- **PoH**: Proof of History is a sequential SHA-256 hash chain that provides a verifiable ordering of events.
- **Entries**: Transactions are grouped into entries which are hashed into the PoH chain.
- **Feature gates**: New features are activated via feature-gate accounts, allowing phased rollouts across the cluster.
- **BPF/SBF**: On-chain programs are compiled to SBF (Solana BPF) bytecode and executed by the `solana_rbpf` VM inside the SVM.

## Things to Watch Out For

- Full builds are very resource-intensive (16 GB+ RAM, can take 15-30 minutes on a fast machine).
- The `local-cluster` integration tests spawn multiple validator processes and are slow.
- `accounts-db` has complex concurrent data structures; be careful modifying AppendVec or account index code.
- The `programs/` directory contains security-critical code (system program, vote program) -- changes need extreme care.
- `curve25519-dalek` is forced to opt-level 3 even in dev builds for performance (see `Cargo.toml` profile overrides).
- Many crates have circular-looking dependencies that are broken via feature flags; do not reorganize without understanding the dependency graph.

## Related Repositories

- Main repo: https://github.com/code2031/solana-clone
- Program Library: `../program-library/` -- SPL programs that deploy on this runtime
- Web3.js SDK: `../web3js-sdk/` -- JavaScript SDK that talks to this validator's RPC
- Explorer: `../explorer/` -- Block explorer that reads from this validator's RPC
- Wallet Adapter: `../wallet-adapter/` -- Wallet connection layer for DApps
- Wallet GUI: `../wallet-gui/` -- Backpack wallet that connects to this validator
- DApp Scaffold: `../dapp-scaffold/` -- Starter template for DApps on this network
