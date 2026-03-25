---
sidebar_position: 3
---

# CLI Reference

The `prism` CLI wallet provides full command-line access to the Prism blockchain. Below is a complete reference of all available commands.

## Installation

```bash
cd cli-wallet
npm install && npm run build && npm link
```

## Global Options

| Flag | Description |
|------|-------------|
| `--version` | Display CLI version |
| `--help` | Show help information |

## Commands

### `prism keygen`

Generate a new Ed25519 keypair.

```bash
# Generate default keypair (~/.config/prism/id.json)
prism keygen

# Generate to a specific file
prism keygen --outfile ./my-wallet.json

# Generate with BIP-39 mnemonic
prism keygen --mnemonic
```

| Option | Description |
|--------|-------------|
| `--outfile <path>` | Output file path |
| `--mnemonic` | Generate from mnemonic phrase |
| `--force` | Overwrite existing keypair |

### `prism address`

Display your wallet's public address.

```bash
prism address
# Output: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### `prism balance`

Check the SOL balance of an account.

```bash
# Check your balance
prism balance

# Check another account's balance
prism balance 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# Display in lamports
prism balance --lamports
```

| Option | Description |
|--------|-------------|
| `--lamports` | Show balance in lamports instead of SOL |

### `prism airdrop`

Request test SOL from the faucet.

```bash
# Request 10 SOL
prism airdrop 10

# Request to a specific address
prism airdrop 5 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### `prism transfer`

Send SOL to another account.

```bash
# Transfer 2.5 SOL
prism transfer <RECIPIENT_ADDRESS> 2.5

# Transfer with memo
prism transfer <RECIPIENT_ADDRESS> 1.0 --memo "Payment for services"
```

| Option | Description |
|--------|-------------|
| `--memo <text>` | Attach a memo to the transaction |
| `--fee-payer <path>` | Use a different keypair for fees |

### `prism token`

Manage SPL tokens.

```bash
# Create a new token mint
prism token create-mint --decimals 9

# Mint tokens
prism token mint <MINT_ADDRESS> 1000

# Get token balance
prism token balance <MINT_ADDRESS>

# Transfer tokens
prism token transfer <MINT_ADDRESS> <RECIPIENT> 100
```

| Subcommand | Description |
|------------|-------------|
| `create-mint` | Create a new token mint |
| `mint` | Mint tokens to an account |
| `balance` | Check token balance |
| `transfer` | Transfer tokens |

### `prism stake`

Manage staking operations.

```bash
# Stake SOL
prism stake create --amount 100

# View stake accounts
prism stake list

# Deactivate a stake
prism stake deactivate <STAKE_ADDRESS>

# Withdraw stake
prism stake withdraw <STAKE_ADDRESS>
```

### `prism config`

Manage CLI configuration.

```bash
# View current config
prism config get

# Set RPC URL
prism config set --url http://localhost:8899

# Set keypair path
prism config set --keypair ~/.config/prism/id.json
```

### `prism history`

View transaction history for an account.

```bash
# View recent transactions
prism history

# View with limit
prism history --limit 20

# View for a specific address
prism history <ADDRESS>
```

### `prism info`

Display cluster and node information.

```bash
prism info
# Output:
#   Cluster:     Devnet
#   RPC URL:     http://localhost:8899
#   Block Height: 12345
#   Slot:        12400
#   Epoch:       3
```

### `prism init`

Initialize a new project from a template.

```bash
# Create a token project
prism init my-token --template token

# Create an NFT project
prism init my-nfts --template nft

# Create an escrow project
prism init my-escrow --template escrow

# Available templates: token, nft, escrow, voting, staking
```

| Option | Description |
|--------|-------------|
| `-t, --template <name>` | Template to use (default: token) |
| `--dir <directory>` | Target directory |
