# Prism Wallet Standard

Implements the [Wallet Standard](https://github.com/wallet-standard/wallet-standard) for the Prism blockchain, enabling any compliant third-party wallet -- Phantom, Solflare, Backpack, and others -- to connect to Prism DApps.

Part of the [Prism](https://github.com/code2031/solana-clone) ecosystem.

---

## Features

- Full Wallet Standard compliance for Prism chain
- Automatic wallet detection and registration
- Bridge layer for legacy `@solana/wallet-adapter` compatibility
- Support for Phantom, Solflare, Backpack, and any Wallet Standard wallet
- Sign transaction, sign message, and connect/disconnect flows

## Installation

```bash
npm install @prism/wallet-standard
```

## Quick Start

```typescript
import { PrismWallet } from "@prism/wallet-standard";
import { registerPrismWallet } from "@prism/wallet-standard/register";

const wallet = new PrismWallet(keypairProvider, transactionSender);
registerPrismWallet(wallet);
```

## Build

```bash
npm install
npm run build     # Compile TypeScript to dist/
npm run lint      # Run ESLint
npm test          # Run test suite
```

## Key Files

| File | Description |
|------|-------------|
| `src/wallet.ts` | `PrismWallet` class implementing the Wallet Standard interface |
| `src/adapter.ts` | Bridge between Wallet Standard and legacy wallet-adapter |
| `src/register.ts` | Wallet registration with the global wallet registry |
| `src/detect.ts` | Runtime detection of installed wallets |

## Architecture

```
DApp  -->  wallet-standard (detect + register)  -->  Wallet (Phantom, Solflare, etc.)
                  |
                  v
           wallet-adapter (legacy bridge)
```

The Wallet Standard acts as the universal interface layer. DApps built with `@prism/connect-kit` or `@prism/wallet-adapter` automatically discover any registered wallet through this package. The adapter bridge ensures backward compatibility with older DApps using the legacy wallet-adapter API.

## Supported Wallets

Phantom, Solflare, Backpack, and any wallet implementing the Wallet Standard are fully supported and auto-detected at runtime.

## Supported Chains

`prism:mainnet`, `prism:testnet`, `prism:devnet`, `solana:mainnet`, `solana:testnet`, `solana:devnet`

## License

Apache-2.0. See [LICENSE](./LICENSE).
