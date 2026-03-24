# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

SolClone is a complete Solana blockchain fork — a monorepo containing the validator (Rust), CLI wallet (TypeScript), Flutter GUI wallet (Dart), block explorer (Next.js), web3.js SDK, SPL programs, wallet adapter, DApp scaffold, and production ops tooling. Each of the 7 forked components also has its own GitHub repo under `code2031/solclone-*`.

## Build Commands

The root `Makefile` is the primary entry point. All paths assume you're in the repo root.

```bash
# Validator (Rust) — takes 10-30 minutes
make validator                    # Full release build
make cli                          # Just the CLI (faster)

# Local testnet
make testnet-bg                   # Start in background (RPC on :8899)
make stop-testnet                 # Stop it
make status                       # Check what's built/running

# SPL programs
make programs                     # All SPL programs
make token-program                # Just SPL Token

# JS/TS projects
make setup                        # npm/pnpm install for all JS projects
make explorer                     # Block explorer on :3000 (pnpm)
make dapp                         # DApp scaffold on :3000 (npm)
make sdk                          # Build web3.js SDK
make wallet                       # Backpack wallet (yarn)

# CLI wallet
cd cli-wallet && npm install && npm run build
npx solclone keygen               # Generate keypair
npx solclone balance              # Check balance
npx solclone config use devnet    # Switch network

# Flutter wallet
cd flutter-wallet && flutter run -d chrome   # Web
cd flutter-wallet && flutter run -d linux    # Desktop

# Docker — multi-network
docker compose --profile devnet up     # Validator + explorer + faucet
docker compose --profile testnet up
docker compose --profile full up       # All networks
```

## Architecture

All clients (CLI wallet, Flutter wallet, explorer, DApps) communicate with the validator via Solana-compatible JSON-RPC on port 8899. The validator runs Proof of History + Tower BFT consensus and executes on-chain programs through the Sealevel runtime.

**Component boundaries:**
- `validator/` is a Rust workspace with 100+ crates. Key crates: `cli/`, `core/`, `runtime/`, `rpc/`, `gossip/`, `ledger/`. Forked from `anza-xyz/agave`.
- `cli-wallet/` is a standalone TypeScript CLI (commander + tweetnacl + bs58). It builds its own JSON-RPC client — does NOT depend on `@solana/web3.js`. Commands live in `src/commands/`, lib layer in `src/lib/`.
- `flutter-wallet/` uses Provider for state management. Screens in `lib/screens/`, services (RPC, wallet, price) in `lib/services/`, state in `lib/providers/`.
- `explorer/` is a Next.js app using pnpm and shadcn/ui.
- `program-library/` is a Rust workspace with SPL programs (token, governance, stake-pool, etc.). Forked from `solana-labs/solana-program-library`.
- `web3js-sdk/` is the TypeScript SDK. Forked from `solana-labs/solana-web3.js`. Uses rollup.
- `wallet-adapter/` and `wallet-gui/` are forked ecosystem tools — wallet-adapter uses pnpm, wallet-gui (Backpack) uses yarn + turborepo.

**Networks** are configured in `networks/{devnet,testnet,mainnet}/genesis.json`. Devnet faucet allows 5 SOL/request, testnet 1 SOL, mainnet has no faucet. Docker profiles correspond to network names.

**Ops** tooling lives in `ops/`: Terraform (AWS r6a.8xlarge validator provisioning), Ansible (server config), Prometheus + Grafana monitoring, systemd service files, backup scripts, and network bootstrap/genesis ceremony scripts.

## Split Repos

Components are also pushed to individual repos via `scripts/update-split-repos.sh`:
- `code2031/solclone-validator`, `solclone-web3js`, `solclone-programs`, `solclone-explorer`, `solclone-wallet-adapter`, `solclone-backpack`, `solclone-dapp-scaffold`

After modifying a forked component, run the update script to sync changes to the split repo.

## Related Projects

- [ShardCoin](https://github.com/code2031/ShardCoin) — ShardCoin cryptocurrency
- [ShardWalletApp](https://github.com/code2031/ShardWalletApp) — ShardCoin Flutter wallet
