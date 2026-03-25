# Prism Program Library

Collection of on-chain Rust programs for the Prism blockchain, forked from [solana-labs/solana-program-library](https://github.com/solana-labs/solana-program-library).

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Split repo:** [https://github.com/code2031/prism-programs](https://github.com/code2031/prism-programs)

## Prerequisites

- Rust (installed via [rustup](https://rustup.rs/))
- Solana CLI tools (for `cargo build-sbf`)
- `libudev-dev` (Debian/Ubuntu) or `libudev-devel` (Fedora)

## Build

```bash
git clone https://github.com/code2031/prism-programs.git
cd prism-programs

# Build all on-chain programs
cargo build-sbf

# Build a specific program
cd token/program
cargo build-sbf

# Build Rust clients
cargo build --release
```

Programs compile to `.so` files for deployment via `solana program deploy`.

## Testing

```bash
cargo test                    # Host-based unit tests
cargo test-sbf                # BPF runtime tests
cargo test -p spl-token       # Test a single program
cargo clippy --workspace      # Lint
```

Most programs include both unit tests and integration tests using `solana-program-test`.

## Key Directories

| Directory | Description |
|-----------|-------------|
| `token/` | SPL Token program (fungible and non-fungible tokens) |
| `associated-token-account/` | Deterministic token account derivation |
| `governance/` | On-chain DAO governance |
| `stake-pool/` | Liquid staking pool program |
| `memo/` | On-chain memo/logging program |
| `token-lending/` | Lending protocol program |
| `token-swap/` | AMM swap program |
| `name-service/` | On-chain naming registry |

## Related Components

- [Validator](https://github.com/code2031/prism-validator)
- [Web3.js SDK](https://github.com/code2031/prism-web3js)
- [Explorer](https://github.com/code2031/prism-explorer)

## License

This project inherits the license from the upstream [solana-program-library](https://github.com/solana-labs/solana-program-library) repository.
