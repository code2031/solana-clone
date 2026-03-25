# Prism Program Library (SPL)

Forked from [solana-labs/solana-program-library](https://github.com/solana-labs/solana-program-library). Collection of Rust on-chain programs deployed to the Prism blockchain.

## Build

```bash
cargo build-sbf                          # build all programs for SBF target
cargo build-sbf -p spl-token             # build a single program
```

Programs compile to `.so` files for deployment via `solana program deploy`.

## Key Directories

- `token/` -- SPL Token program (fungible and non-fungible tokens)
- `associated-token-account/` -- Deterministic token account derivation
- `governance/` -- On-chain DAO governance
- `stake-pool/` -- Liquid staking pool program
- `memo/` -- On-chain memo/logging program
- `token-lending/` -- Lending protocol program
- `token-swap/` -- AMM swap program
- `name-service/` -- On-chain naming registry

## Testing

```bash
cargo test
cargo test-sbf                           # run tests against SBF runtime
cargo test -p spl-token                  # test a single program
```

Most programs include both unit tests and integration tests using `solana-program-test`.

## Ecosystem Links

- Monorepo: https://github.com/code2031/prism-chain
- Split repo: https://github.com/code2031/prism-programs
- Validator: https://github.com/code2031/prism-validator
- Web3.js SDK: https://github.com/code2031/prism-web3js
