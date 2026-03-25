# Prism <-> Bitcoin Bridge

Cross-chain bridge enabling trustless Bitcoin transfers to and from Prism, represented as scBTC (wrapped Bitcoin).

## Architecture

```
Bitcoin Network                    Prism
+------------------+               +------------------+
| Multisig Wallet  |  <--------->  | BTC Bridge       |
| (P2SH / Taproot) |  Attestors   | Program (scBTC)  |
+------------------+               +------------------+
         ^                                  ^
         |          +------------+          |
         +--------->|  Attestor  |<---------+
                    +------------+
                    (Signer node)
```

### Components

1. **Bridge Program** (`program/`) - Solana-side program deployed on Prism that manages scBTC minting/burning, deposit proofs, and withdrawal requests.

2. **Attestor Service** (`attestor/`) - TypeScript service that monitors Bitcoin for deposits, submits proofs to Prism, and co-signs withdrawal transactions.

## How It Works

### Bitcoin -> Prism (Deposit)

1. User sends BTC to the bridge multisig address, including an OP_RETURN output with their Prism public key
2. Attestor nodes monitor Bitcoin for deposits to the bridge address
3. After 6+ confirmations, each attestor submits a deposit proof to the Prism bridge program
4. Once the attestor threshold is reached, anyone can call `confirm_deposit` to mint scBTC to the recipient

### Prism -> Bitcoin (Withdrawal)

1. User calls `request_withdrawal` on the Prism bridge program, burning scBTC
2. Attestor nodes observe the withdrawal request
3. Each attestor creates a partial signature (PSBT) for the Bitcoin release transaction
4. Once threshold signatures are collected, the transaction is broadcast to Bitcoin
5. The withdrawal status is updated on Prism after broadcast

## scBTC Token

- **Name**: Prism Wrapped Bitcoin
- **Symbol**: scBTC
- **Decimals**: 8 (matching Bitcoin's satoshi precision)
- **1 scBTC = 1 BTC** (1:1 peg)

## Attestor Set

The bridge uses a threshold multi-signature scheme. Each attestor independently:
- Runs a Bitcoin full node (or connects to a trusted one)
- Monitors the bridge multisig for incoming deposits
- Validates deposit amounts and recipient information
- Co-signs withdrawal transactions using their key share

## Security

- **6 Confirmation Minimum**: Deposits require at least 6 Bitcoin confirmations
- **10,000 sat Minimum Withdrawal**: Prevents dust attacks and ensures BTC fees are covered
- **Threshold Signatures**: No single attestor can mint scBTC or release BTC
- **Multisig Wallet**: Bridge funds are held in a multi-signature Bitcoin wallet

## Running the Attestor

```bash
cd attestor
npm install
npm run build

# Configure environment
export BITCOIN_RPC="http://localhost:8332"
export BITCOIN_RPC_USER="rpcuser"
export BITCOIN_RPC_PASS="rpcpassword"
export PRISM_RPC="http://localhost:8899"
export BRIDGE_PROGRAM_ID="BtcBrdg11111111111111111111111111111111111"
export ATTESTOR_KEYPAIR="./attestor-keypair.json"
export WATCH_ADDRESSES="bc1q...,bc1q..."

npm start
```
