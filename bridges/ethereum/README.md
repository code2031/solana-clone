# SolClone <-> Ethereum Bridge

Cross-chain bridge enabling trustless asset transfers between SolClone and Ethereum.

## Architecture

```
Ethereum                          SolClone
+-----------------+               +-----------------+
| Bridge Contract |  <-- VAAs --> | Bridge Program  |
| (ERC-20 vault)  |               | (SPL minting)  |
+-----------------+               +-----------------+
        ^                                 ^
        |           +-----------+         |
        +---------->|  Relayer  |<--------+
                    +-----------+
                    (Guardian node)
```

### Components

1. **Bridge Program** (`program/`) - Solana-side program deployed on SolClone that manages wrapped token mints, guardian attestations, and transfer lifecycle.

2. **Relayer Service** (`relayer/`) - TypeScript service that watches events on both chains and submits cross-chain attestations.

## How It Works

### Ethereum -> SolClone

1. User deposits ERC-20 tokens into the Ethereum bridge contract
2. Relayer observes the deposit event after sufficient confirmations (15 blocks)
3. Guardian signs a VAA (Verified Action Approval) and submits to SolClone bridge program
4. Once threshold signatures are collected, anyone can call `complete_transfer` to mint wrapped tokens to the recipient

### SolClone -> Ethereum

1. User calls `redeem` on the SolClone bridge program, burning wrapped tokens
2. Relayer observes the redemption event on SolClone
3. Guardian co-signs a release transaction on Ethereum
4. After threshold signatures, ERC-20 tokens are released to the recipient

## State Accounts

- **BridgeState** - Global bridge configuration, guardian set, counters
- **WrappedToken** - Per-token metadata mapping ERC-20 address to SPL mint
- **BridgeTransaction** - Per-transfer state tracking signatures and status

## Guardian Set

The bridge uses a multi-signature guardian model. Each guardian runs a relayer node and independently verifies cross-chain events. A configurable threshold (e.g., 2-of-3) is required before transfers are executed.

## Token Registration

Before an ERC-20 token can be bridged, the admin must call `register_token` to create a corresponding wrapped SPL mint on SolClone.

## Running the Relayer

```bash
cd relayer
npm install
npm run build

# Configure environment
export ETHEREUM_RPC="https://eth-mainnet.example.com"
export SOLCLONE_RPC="http://localhost:8899"
export BRIDGE_PROGRAM_ID="EthBrdg11111111111111111111111111111111111"
export GUARDIAN_KEYPAIR="./guardian-keypair.json"

npm start
```

## Security Considerations

- Guardian keys must be stored securely (HSM recommended in production)
- Ethereum confirmations should be set high enough to avoid reorg attacks (15+ blocks)
- Rate limiting should be applied to prevent bridge abuse
- Token registration is admin-only to prevent unauthorized minting
