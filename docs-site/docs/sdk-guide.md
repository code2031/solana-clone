---
sidebar_position: 4
---

# SDK Guide

The Prism Web3.js SDK provides a TypeScript/JavaScript interface for interacting with the Prism blockchain. It follows the same patterns as `@solana/web3.js` for maximum compatibility.

## Installation

```bash
npm install @prism/web3.js
```

## Connecting to the Network

```typescript
import { Connection, clusterApiUrl } from '@prism/web3.js';

// Connect to local devnet
const connection = new Connection('http://localhost:8899', 'confirmed');

// Connect to testnet
const connection = new Connection('http://localhost:8799', 'confirmed');

// Check connection
const version = await connection.getVersion();
console.log('Connected to Prism:', version);
```

## Keypairs and Wallets

```typescript
import { Keypair } from '@prism/web3.js';

// Generate a new keypair
const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toBase58());

// Load from secret key bytes
const loaded = Keypair.fromSecretKey(secretKeyBytes);

// Load from file (Node.js)
import fs from 'fs';
const secretKey = JSON.parse(fs.readFileSync('~/.config/prism/id.json', 'utf-8'));
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
```

## Checking Balances

```typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@prism/web3.js';

const connection = new Connection('http://localhost:8899');
const publicKey = new PublicKey('YOUR_ADDRESS_HERE');

const balance = await connection.getBalance(publicKey);
console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
```

## Requesting Airdrops

```typescript
const signature = await connection.requestAirdrop(
  publicKey,
  2 * LAMPORTS_PER_SOL // 2 SOL
);

// Wait for confirmation
await connection.confirmTransaction(signature);
console.log('Airdrop confirmed:', signature);
```

## Sending Transactions

```typescript
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@prism/web3.js';

const connection = new Connection('http://localhost:8899');
const sender = Keypair.generate();
const recipient = Keypair.generate();

// Create a transfer instruction
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient.publicKey,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  })
);

// Sign and send
const signature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [sender]
);

console.log('Transaction confirmed:', signature);
```

## Working with Tokens

```typescript
import { Token, TOKEN_PROGRAM_ID } from '@prism/web3.js';

// Create a new token mint
const mint = await Token.createMint(
  connection,
  payer,           // fee payer
  mintAuthority,   // mint authority
  freezeAuthority, // freeze authority (optional)
  9,               // decimals
  TOKEN_PROGRAM_ID
);

// Create a token account
const tokenAccount = await mint.createAccount(owner.publicKey);

// Mint tokens
await mint.mintTo(tokenAccount, mintAuthority, [], 1000000000);

// Transfer tokens
await mint.transfer(
  sourceAccount,
  destinationAccount,
  owner,
  [],
  500000000
);

// Get token balance
const balance = await connection.getTokenAccountBalance(tokenAccount);
console.log('Token balance:', balance.value.uiAmount);
```

## Querying the Chain

```typescript
// Get block height
const height = await connection.getBlockHeight();

// Get a specific block
const block = await connection.getBlock(height - 1);
console.log('Transactions in block:', block.transactions.length);

// Get transaction details
const tx = await connection.getTransaction(signature);
console.log('Fee:', tx.meta.fee);

// Get account info
const accountInfo = await connection.getAccountInfo(publicKey);
console.log('Lamports:', accountInfo.lamports);
console.log('Owner:', accountInfo.owner.toBase58());

// Get recent blockhash
const { blockhash } = await connection.getLatestBlockhash();
```

## Subscribing to Events

```typescript
// Subscribe to account changes
const subscriptionId = connection.onAccountChange(
  publicKey,
  (accountInfo) => {
    console.log('Account changed:', accountInfo.lamports);
  }
);

// Subscribe to logs
connection.onLogs('all', (logs) => {
  console.log('Log:', logs.signature, logs.logs);
});

// Unsubscribe
await connection.removeAccountChangeListener(subscriptionId);
```

## Error Handling

```typescript
import { SendTransactionError } from '@prism/web3.js';

try {
  await sendAndConfirmTransaction(connection, transaction, [signer]);
} catch (err) {
  if (err instanceof SendTransactionError) {
    console.error('Transaction failed:', err.message);
    console.error('Logs:', err.logs);
  }
}
```

## Using with the Playground

The [Prism Playground](/playground) provides an interactive environment where you can test SDK calls directly in your browser. The `prism` helper object wraps the RPC client for quick experimentation.

## Next Steps

- [Anchor Guide](./anchor-guide) -- build on-chain programs
- [DeFi Guide](./defi-guide) -- interact with DeFi protocols
- [CLI Reference](./cli-reference) -- command-line tools
