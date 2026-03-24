# SolClone

Complete Solana blockchain fork with full ecosystem.

## Structure

This is a monorepo containing all SolClone components. Each component also has its own repo.

| Directory | Repo | Language |
|-----------|------|----------|
| `validator/` | [solclone-validator](https://github.com/code2031/solclone-validator) | Rust |
| `web3js-sdk/` | [solclone-web3js](https://github.com/code2031/solclone-web3js) | TypeScript |
| `program-library/` | [solclone-programs](https://github.com/code2031/solclone-programs) | Rust |
| `explorer/` | [solclone-explorer](https://github.com/code2031/solclone-explorer) | Next.js |
| `wallet-adapter/` | [solclone-wallet-adapter](https://github.com/code2031/solclone-wallet-adapter) | TypeScript |
| `wallet-gui/` | [solclone-backpack](https://github.com/code2031/solclone-backpack) | React Native |
| `dapp-scaffold/` | [solclone-dapp-scaffold](https://github.com/code2031/solclone-dapp-scaffold) | Next.js |
| `cli-wallet/` | (in this repo) | TypeScript |
| `flutter-wallet/` | (in this repo) | Dart/Flutter |
| `networks/` | (in this repo) | JSON configs |

## Build Commands

```bash
make check-deps      # Verify prerequisites
make validator       # Build validator (Rust, ~30 min)
make cli             # Build CLI only
make testnet-bg      # Start local testnet (background)
make explorer        # Start block explorer
make dapp            # Start DApp scaffold
make status          # Show all component status
```

## Networks

- Devnet: port 8899, faucet on 9900
- Testnet: port 8799, faucet on 9800
- Mainnet: port 8699, no faucet
- Docker: `docker compose --profile devnet up`

## Key Files

- `Makefile` — Unified build system
- `docker-compose.yml` — Multi-network Docker setup
- `networks/*/genesis.json` — Genesis configurations
- `scripts/setup.sh` — One-command setup
- `WHITEPAPER.md` — Technical whitepaper

## Related Projects

- [ShardCoin](https://github.com/code2031/ShardCoin) — ShardCoin cryptocurrency
- [ShardWalletApp](https://github.com/code2031/ShardWalletApp) — ShardCoin wallet
