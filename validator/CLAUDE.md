# SolClone Validator

Forked from [anza-xyz/agave](https://github.com/anza-xyz/agave). This is the core validator node for the SolClone blockchain. It is a Rust monorepo containing 100+ crates.

## Build

```bash
cargo build --release                          # Full workspace build
cargo build --release --bin solana-validator    # Validator binary only
cargo build --release --bin solana             # CLI only
```

## Key Directories

- `cli/` -- Solana CLI tool (`solana` command)
- `core/` -- Consensus engine (Tower BFT, replay stage, banking stage)
- `runtime/` -- Transaction processing and accounts database
- `rpc/` -- JSON-RPC server for external API access
- `gossip/` -- Peer-to-peer protocol for cluster communication
- `ledger/` -- Block storage and Proof of History verification
- `sdk/` -- Shared types and utilities used across crates
- `svm/` -- Solana Virtual Machine that executes transactions
- `programs/` -- Built-in on-chain programs (system, vote, stake)
- `validator/` -- Validator entrypoint and configuration
- `turbine/` -- Block propagation (shred retransmit tree)
- `accounts-db/` -- AppendVec storage and account indexing

## Testing

```bash
cargo test                                # All workspace tests
cargo test -p solana-core                 # Core validator logic
cargo test -p solana-runtime              # Runtime/bank tests
cargo test -p solana-rpc                  # RPC server tests
cargo clippy --workspace                  # Lint
cargo fmt --all -- --check                # Format check
```

## Ecosystem Links

- Monorepo: https://github.com/code2031/solana-clone
- Split repo: https://github.com/code2031/solclone-validator
- Explorer: https://github.com/code2031/solclone-explorer
- Web3.js SDK: https://github.com/code2031/solclone-web3js
