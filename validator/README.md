# SolClone Validator

Core validator node for the SolClone blockchain, forked from [anza-xyz/agave](https://github.com/anza-xyz/agave).

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Split repo:** [https://github.com/code2031/solclone-validator](https://github.com/code2031/solclone-validator)

## Prerequisites

- Rust (installed via [rustup](https://rustup.rs/)); the `rust-toolchain.toml` pins the required version
- System packages (Ubuntu): `libssl-dev libudev-dev pkg-config zlib1g-dev llvm clang cmake make libprotobuf-dev protobuf-compiler libclang-dev`
- System packages (Fedora): `openssl-devel systemd-devel pkg-config zlib-devel llvm clang cmake make protobuf-devel protobuf-compiler perl-core libclang-dev`

## Build

```bash
# Install Rust toolchain
curl https://sh.rustup.rs -sSf | sh
source $HOME/.cargo/env
rustup component add rustfmt

# Clone and build
git clone https://github.com/code2031/solclone-validator.git
cd solclone-validator

cargo build --release                          # Full workspace build
cargo build --release --bin solana-validator    # Validator binary only
cargo build --release --bin solana             # CLI binary only
```

## Testing

```bash
cargo test                                # All workspace tests
cargo test -p solana-core                 # Core validator logic
cargo test -p solana-runtime              # Runtime/bank tests
cargo test -p solana-rpc                  # RPC server tests
cargo clippy --workspace                  # Lint
cargo fmt --all -- --check                # Format check
```

## Key Directories

| Directory | Description |
|-----------|-------------|
| `cli/` | Solana CLI tool (`solana` command) |
| `core/` | Consensus engine (Tower BFT, replay stage, banking stage) |
| `runtime/` | Transaction processing and accounts database |
| `rpc/` | JSON-RPC server for external API access |
| `gossip/` | Peer-to-peer protocol for cluster communication |
| `ledger/` | Block storage and Proof of History verification |
| `sdk/` | Shared types and utilities used across crates |
| `svm/` | Solana Virtual Machine that executes transactions |
| `programs/` | Built-in on-chain programs (system, vote, stake) |
| `validator/` | Validator entrypoint and configuration |
| `turbine/` | Block propagation (shred retransmit tree) |
| `accounts-db/` | AppendVec storage and account indexing |

## Related Components

- [Explorer](https://github.com/code2031/solclone-explorer)
- [Web3.js SDK](https://github.com/code2031/solclone-web3js)
- [Program Library](https://github.com/code2031/solclone-programs)

## License

This project inherits the license from the upstream [agave](https://github.com/anza-xyz/agave) repository.
