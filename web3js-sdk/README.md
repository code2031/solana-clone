# SolClone Web3.js SDK

TypeScript client library for building DApps on the SolClone blockchain, forked from [solana-labs/solana-web3.js](https://github.com/solana-labs/solana-web3.js).

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Split repo:** [https://github.com/code2031/solclone-web3js](https://github.com/code2031/solclone-web3js)

## Prerequisites

- Node.js >= 16
- npm

## Build

```bash
git clone https://github.com/code2031/solclone-web3js.git
cd solclone-web3js

npm install
npm run build
```

Uses rollup for bundling. Produces CJS, ESM, and browser bundles.

## Testing

```bash
npm test
npm run lint
```

Unit tests use mocha/chai. Some integration tests expect a local test validator running on port 8899.

## Key Directories

| Directory | Description |
|-----------|-------------|
| `src/` | All TypeScript source code |
| `src/connection.ts` | RPC connection handling (all RPC methods) |
| `src/transaction.ts` | Transaction construction and signing |
| `src/publickey.ts` | Public key and address utilities |
| `src/keypair.ts` | Ed25519 key generation and import/export |
| `src/programs/` | Client-side program helpers (system, token) |
| `test/` | Unit and integration tests |
| `rollup.config.mjs` | Build configuration for multiple output formats |

## Usage

```typescript
import { Connection, Keypair, Transaction } from '@solclone/web3.js';

const connection = new Connection('http://localhost:8899');
const keypair = Keypair.generate();
const balance = await connection.getBalance(keypair.publicKey);
```

## Related Components

- [Validator](https://github.com/code2031/solclone-validator)
- [DApp Scaffold](https://github.com/code2031/solclone-dapp-scaffold)
- [Wallet Adapter](https://github.com/code2031/solclone-wallet-adapter)

## License

This project inherits the license from the upstream [solana-web3.js](https://github.com/solana-labs/solana-web3.js) repository.
