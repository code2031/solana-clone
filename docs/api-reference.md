# SolClone JSON-RPC API Reference

## Overview

SolClone nodes expose a JSON-RPC 2.0 API on port **8899** (HTTP) and **8900** (WebSocket).

**Base URL:**
```
http://localhost:8899
```

**Request Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "<method_name>",
  "params": [<param1>, <param2>, ...]
}
```

**Common Conventions:**
- All token amounts are in **lamports** (1 SCLONE = 1,000,000,000 lamports)
- Public keys are base58-encoded strings
- Commitment levels: `finalized`, `confirmed`, `processed`
- Optional configuration objects are passed as the last parameter

---

## Methods -- Full Examples

### getBalance

Returns the lamport balance of the account at the given public key.

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | string | Yes      | Base58 public key of the account |
| 2 | object | No       | Configuration: `{ "commitment": "finalized" }` |

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getBalance",
  "params": [
    "9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g",
    { "commitment": "finalized" }
  ]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "context": { "slot": 194521 },
    "value": 2500000000
  },
  "id": 1
}
```

---

### getAccountInfo

Returns all information associated with the account at the given public key.

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | string | Yes      | Base58 public key                |
| 2 | object | No       | Configuration: `{ "encoding": "base64", "commitment": "finalized" }` |

Supported encodings: `base64`, `base58`, `jsonParsed`, `base64+zstd`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getAccountInfo",
  "params": [
    "9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g",
    { "encoding": "base64", "commitment": "finalized" }
  ]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "context": { "slot": 194521 },
    "value": {
      "data": ["base64_encoded_data_here", "base64"],
      "executable": false,
      "lamports": 2500000000,
      "owner": "11111111111111111111111111111111",
      "rentEpoch": 361,
      "space": 0
    }
  },
  "id": 1
}
```

---

### getBlock

Returns identity and transaction information about a confirmed block.

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | u64    | Yes      | Slot number                      |
| 2 | object | No       | Configuration: `{ "encoding": "json", "transactionDetails": "full", "maxSupportedTransactionVersion": 0 }` |

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getBlock",
  "params": [
    194521,
    {
      "encoding": "json",
      "transactionDetails": "full",
      "maxSupportedTransactionVersion": 0
    }
  ]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "blockHeight": 194500,
    "blockTime": 1711234567,
    "blockhash": "3Eq21vXNB5s86c62bVuUfTeaMif1N2kUqRPBmGRJhyTA",
    "parentSlot": 194520,
    "previousBlockhash": "mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B",
    "transactions": [
      {
        "meta": {
          "err": null,
          "fee": 5000,
          "preBalances": [1000000000, 500000000],
          "postBalances": [999995000, 500000000]
        },
        "transaction": {
          "message": {
            "accountKeys": ["..."],
            "instructions": ["..."],
            "recentBlockhash": "..."
          },
          "signatures": ["5VERv8NMhJkV..."]
        }
      }
    ]
  },
  "id": 1
}
```

---

### getLatestBlockhash

Returns the latest blockhash and the last valid block height for that blockhash.

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | object | No       | Configuration: `{ "commitment": "finalized" }` |

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getLatestBlockhash",
  "params": [{ "commitment": "finalized" }]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "context": { "slot": 194521 },
    "value": {
      "blockhash": "EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N",
      "lastValidBlockHeight": 194551
    }
  },
  "id": 1
}
```

---

### sendTransaction

Submits a signed transaction to the cluster for processing.

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | string | Yes      | Signed transaction as base64 or base58 encoded string |
| 2 | object | No       | Configuration: `{ "encoding": "base64", "skipPreflight": false, "preflightCommitment": "finalized", "maxRetries": 3 }` |

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sendTransaction",
  "params": [
    "AaXkCEFcjYMUAGQvJwLh0wo7bGxCZ...(base64 encoded transaction)",
    { "encoding": "base64" }
  ]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": "2id3YC2jK9G5Wo2phDx4gJVAew8DcY5NAojnVuao2rkBv1S8PZnPdGEmq6PdUFMapEra7PB4UoaQ2CAJqHpGNBHG",
  "id": 1
}
```

---

### simulateTransaction

Simulates sending a transaction without submitting it.

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | string | Yes      | Transaction as base64 encoded string |
| 2 | object | No       | Configuration: `{ "sigVerify": false, "commitment": "finalized", "encoding": "base64", "accounts": { "encoding": "base64", "addresses": [...] } }` |

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "simulateTransaction",
  "params": [
    "AaXkCEFcjYMUAGQvJwLh0wo7bGxCZ...(base64 encoded transaction)",
    { "sigVerify": true, "encoding": "base64" }
  ]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "context": { "slot": 194521 },
    "value": {
      "err": null,
      "logs": [
        "Program 11111111111111111111111111111111 invoke [1]",
        "Program 11111111111111111111111111111111 success"
      ],
      "accounts": null,
      "unitsConsumed": 1400
    }
  },
  "id": 1
}
```

---

### requestAirdrop

Requests an airdrop of lamports to a public key (devnet/testnet only).

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | string | Yes      | Base58 public key                |
| 2 | u64    | Yes      | Lamports to airdrop              |
| 3 | object | No       | Configuration: `{ "commitment": "finalized" }` |

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "requestAirdrop",
  "params": [
    "9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g",
    1000000000
  ]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": "5VERv8NMhJkVBh4GSTqEkrnXZ2vL3Z5RChxMoRdsUMeb5UiY9aiD7c2VbHAW95LhJTBipej5DQr14bDMKb1GQKLM",
  "id": 1
}
```

---

### getTransaction

Returns transaction details for a confirmed transaction signature.

**Parameters:**
| # | Type   | Required | Description                     |
|---|--------|----------|---------------------------------|
| 1 | string | Yes      | Transaction signature as base58 string |
| 2 | object | No       | Configuration: `{ "encoding": "json", "commitment": "finalized", "maxSupportedTransactionVersion": 0 }` |

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTransaction",
  "params": [
    "5VERv8NMhJkVBh4GSTqEkrnXZ2vL3Z5RChxMoRdsUMeb5UiY9aiD7c2VbHAW95LhJTBipej5DQr14bDMKb1GQKLM",
    { "encoding": "json", "maxSupportedTransactionVersion": 0 }
  ]
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "slot": 194521,
    "blockTime": 1711234567,
    "meta": {
      "err": null,
      "fee": 5000,
      "preBalances": [1000000000, 0],
      "postBalances": [999995000, 0],
      "logMessages": [
        "Program 11111111111111111111111111111111 invoke [1]",
        "Program 11111111111111111111111111111111 success"
      ]
    },
    "transaction": {
      "message": {
        "accountKeys": [
          "9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g",
          "11111111111111111111111111111111"
        ],
        "instructions": [
          {
            "programIdIndex": 1,
            "accounts": [0],
            "data": "3Bxs4ThwQbE4vyj5"
          }
        ],
        "recentBlockhash": "EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N"
      },
      "signatures": [
        "5VERv8NMhJkVBh4GSTqEkrnXZ2vL3Z5RChxMoRdsUMeb5UiY9aiD7c2VbHAW95LhJTBipej5DQr14bDMKb1GQKLM"
      ]
    }
  },
  "id": 1
}
```

---

## Methods -- Brief Reference

### Block and Slot Methods

| Method | Description | Key Params |
|--------|-------------|------------|
| `getBlock` | Returns block details for a given slot | `slot: u64`, config |
| `getBlockHeight` | Returns current block height | config |
| `getBlockTime` | Returns estimated production time for a block | `slot: u64` |
| `getFirstAvailableBlock` | Returns the slot of the lowest confirmed block not yet purged from the ledger | none |
| `getSlot` | Returns the slot that has reached the given commitment level | config |
| `getSlotLeader` | Returns the current slot leader | config |
| `minimumLedgerSlot` | Returns the lowest slot that the node has information about in its ledger | none |
| `isBlockhashValid` | Returns whether a blockhash is still valid | `blockhash: string`, config |
| `getLatestBlockhash` | Returns the latest blockhash | config |

### Account Methods

| Method | Description | Key Params |
|--------|-------------|------------|
| `getAccountInfo` | Returns account data for a public key | `pubkey: string`, config |
| `getBalance` | Returns lamport balance | `pubkey: string`, config |
| `getMultipleAccounts` | Returns account info for multiple public keys | `pubkeys: string[]`, config |
| `getProgramAccounts` | Returns all accounts owned by a program | `programId: string`, config with filters |
| `getLargestAccounts` | Returns 20 largest accounts by lamport balance | config with optional `filter: "circulating"` or `"nonCirculating"` |
| `getMinimumBalanceForRentExemption` | Returns minimum balance for rent exemption | `dataSize: usize`, config |

### Transaction Methods

| Method | Description | Key Params |
|--------|-------------|------------|
| `sendTransaction` | Submits a signed transaction | `transaction: string`, config |
| `simulateTransaction` | Simulates a transaction | `transaction: string`, config |
| `getTransaction` | Returns details for a confirmed transaction | `signature: string`, config |
| `getTransactionCount` | Returns the current transaction count from the ledger | config |
| `getSignaturesForAddress` | Returns signatures for confirmed transactions involving an address | `address: string`, config |
| `getSignatureStatuses` | Returns statuses of a list of signatures | `signatures: string[]`, config |
| `getFeeForMessage` | Returns the fee the network will charge for a message | `message: string`, config |
| `requestAirdrop` | Requests a lamport airdrop (devnet/testnet) | `pubkey: string`, `lamports: u64` |

### Token Methods

| Method | Description | Key Params |
|--------|-------------|------------|
| `getTokenAccountBalance` | Returns token balance for a token account | `tokenAccount: string`, config |
| `getTokenAccountsByOwner` | Returns all SPL token accounts by owner | `owner: string`, filter, config |
| `getTokenLargestAccounts` | Returns 20 largest token accounts for a mint | `mint: string`, config |
| `getTokenSupply` | Returns total supply of an SPL token | `mint: string`, config |

### Cluster and Network Methods

| Method | Description | Key Params |
|--------|-------------|------------|
| `getClusterNodes` | Returns information about all nodes participating in the cluster | none |
| `getEpochInfo` | Returns information about the current epoch | config |
| `getEpochSchedule` | Returns epoch schedule information | none |
| `getGenesisHash` | Returns the genesis hash | none |
| `getHealth` | Returns the current health of the node | none |
| `getHighestSnapshotSlot` | Returns the highest slot information for which a snapshot is available | none |
| `getVersion` | Returns the current SolClone version running on the node | none |
| `getRecentPerformanceSamples` | Returns recent performance samples | `limit: usize` (optional) |

### Inflation Methods

| Method | Description | Key Params |
|--------|-------------|------------|
| `getInflationGovernor` | Returns the current inflation governor | config |
| `getInflationRate` | Returns the current inflation rate | none |
| `getInflationReward` | Returns the inflation rewards for a list of addresses for an epoch | `addresses: string[]`, config |
| `getSupply` | Returns information about the current supply | config |

### Staking and Voting Methods

| Method | Description | Key Params |
|--------|-------------|------------|
| `getVoteAccounts` | Returns the account info and associated stake for all voting accounts | config |
| `getStakeActivation` | Returns epoch activation information for a stake account | `stakeAccount: string`, config |
| `getStakeMinimumDelegation` | Returns the stake minimum delegation in lamports | config |
| `getLeaderSchedule` | Returns the leader schedule for an epoch | `slot: u64` (optional), config |

---

## Error Codes

| Code   | Message                          | Description                             |
|--------|----------------------------------|-----------------------------------------|
| -32700 | Parse error                      | Invalid JSON                            |
| -32600 | Invalid request                  | JSON is not a valid request object       |
| -32601 | Method not found                 | Method does not exist                    |
| -32602 | Invalid params                   | Invalid method parameters                |
| -32603 | Internal error                   | Internal JSON-RPC error                  |
| -32001 | Block not available              | Requested block is not available         |
| -32002 | Node unhealthy                   | Node is not healthy                      |
| -32003 | Transaction precompile verification failure | Transaction simulation failed  |
| -32004 | Slot skipped                     | The requested slot was skipped           |
| -32005 | No snapshot                      | No snapshot available                    |
| -32006 | Long-term storage cleanup        | Block data cleaned from long-term storage |
| -32007 | Scan error                       | Error scanning accounts                  |
| -32009 | Transaction signature len mismatch | Transaction signature length mismatch  |
| -32010 | Block status not available       | Block status not yet available           |
| -32011 | Unsupported transaction version  | Transaction version is not supported     |
| -32014 | Min context slot not reached     | The minimum context slot has not been reached |

---

## Rate Limits

| Tier       | Requests/sec | Burst |
|------------|-------------|-------|
| Free       | 10          | 20    |
| Developer  | 100         | 200   |
| Pro        | 500         | 1000  |
| Enterprise | Custom      | Custom|

---

## WebSocket API

Connect to `ws://localhost:8900` for real-time subscriptions.

### Subscribe Methods

| Method                   | Description                                    |
|--------------------------|------------------------------------------------|
| `accountSubscribe`       | Subscribe to account changes                    |
| `logsSubscribe`          | Subscribe to transaction log events             |
| `programSubscribe`       | Subscribe to program-owned account changes      |
| `signatureSubscribe`     | Subscribe to transaction signature confirmation |
| `slotSubscribe`          | Subscribe to slot notifications                 |
| `rootSubscribe`          | Subscribe to root notifications                 |
| `blockSubscribe`         | Subscribe to block notifications                |
| `voteSubscribe`          | Subscribe to vote notifications                 |

### Example: accountSubscribe

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "accountSubscribe",
  "params": [
    "9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g",
    { "encoding": "base64", "commitment": "finalized" }
  ]
}
```

**Response (subscription ID):**
```json
{ "jsonrpc": "2.0", "result": 23784, "id": 1 }
```

**Notification:**
```json
{
  "jsonrpc": "2.0",
  "method": "accountNotification",
  "params": {
    "result": {
      "context": { "slot": 5199307 },
      "value": {
        "data": ["base64_data_here", "base64"],
        "executable": false,
        "lamports": 3500000000,
        "owner": "11111111111111111111111111111111",
        "rentEpoch": 370,
        "space": 0
      }
    },
    "subscription": 23784
  }
}
```

### Unsubscribe

Each subscribe method has a corresponding unsubscribe method (e.g., `accountUnsubscribe`). Pass the subscription ID as the parameter.
