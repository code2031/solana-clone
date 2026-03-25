# Prism <-> Solana Bridge

The fastest bridge in the Prism ecosystem. Since both chains share the same account model, SPL token standard, and transaction format, transfers complete in under 30 seconds.

## Architecture

```
Solana Mainnet                     Prism
+-----------------+                +-----------------+
| SPL Token Vault |  <--------->   | Bridge Program  |
| (locked tokens) |  Guardians    | (mint/burn)     |
+-----------------+                +-----------------+
        ^                                  ^
        |          +------------+          |
        +--------->|  Relayer   |<---------+
                   +------------+
                   (Dual watcher)
```

### Components

1. **Bridge Program** (`program/`) - Prism-side program that locks/mints/burns SPL tokens.

2. **Relayer Service** (`relayer/`) - Watches both Solana and Prism for bridge events and relays attestations.

## Advantages Over Other Bridges

- **Speed**: ~30 seconds end-to-end (vs ~15 minutes for Ethereum, ~60 minutes for Bitcoin)
- **Cost**: Minimal fees on both sides (same fee structure)
- **Compatibility**: Same account model means simpler verification
- **Token Standard**: Both use SPL tokens, no wrapping overhead

## How It Works

### Solana -> Prism

1. User locks SPL tokens in the Solana vault
2. Relayer observes the lock event (1-2 slot confirmations)
3. Guardian submits mint attestation to Prism bridge program
4. After threshold attestations, equivalent tokens are minted on Prism

### Prism -> Solana

1. User calls `burn_and_release` on Prism, burning their tokens
2. Relayer observes the burn event
3. Guardian releases equivalent tokens from the Solana vault
4. Transfer record is updated on Prism

## Running the Relayer

```bash
cd relayer
npm install
npm run build

export SOLANA_RPC="https://api.mainnet-beta.solana.com"
export PRISM_RPC="http://localhost:8899"
export BRIDGE_PROGRAM_ID="SolBrdg11111111111111111111111111111111111"
export GUARDIAN_KEYPAIR="./guardian-keypair.json"

npm start
```
