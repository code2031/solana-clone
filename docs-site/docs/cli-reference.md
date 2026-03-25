---
sidebar_position: 3
---

# CLI Reference

The `solclone` CLI wallet provides full command-line access to the SolClone blockchain. Below is a complete reference of all available commands.

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

### `solclone keygen`

Generate a new Ed25519 keypair.

```bash
# Generate default keypair (~/.config/solclone/id.json)
solclone keygen

# Generate to a specific file
solclone keygen --outfile ./my-wallet.json

# Generate with BIP-39 mnemonic
solclone keygen --mnemonic
```

| Option | Description |
|--------|-------------|
| `--outfile <path>` | Output file path |
| `--mnemonic` | Generate from mnemonic phrase |
| `--force` | Overwrite existing keypair |

### `solclone address`

Display your wallet's public address.

```bash
solclone address
# Output: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### `solclone balance`

Check the SOL balance of an account.

```bash
# Check your balance
solclone balance

# Check another account's balance
solclone balance 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# Display in lamports
solclone balance --lamports
```

| Option | Description |
|--------|-------------|
| `--lamports` | Show balance in lamports instead of SOL |

### `solclone airdrop`

Request test SOL from the faucet.

```bash
# Request 10 SOL
solclone airdrop 10

# Request to a specific address
solclone airdrop 5 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### `solclone transfer`

Send SOL to another account.

```bash
# Transfer 2.5 SOL
solclone transfer <RECIPIENT_ADDRESS> 2.5

# Transfer with memo
solclone transfer <RECIPIENT_ADDRESS> 1.0 --memo "Payment for services"
```

| Option | Description |
|--------|-------------|
| `--memo <text>` | Attach a memo to the transaction |
| `--fee-payer <path>` | Use a different keypair for fees |

### `solclone token`

Manage SPL tokens.

```bash
# Create a new token mint
solclone token create-mint --decimals 9

# Mint tokens
solclone token mint <MINT_ADDRESS> 1000

# Get token balance
solclone token balance <MINT_ADDRESS>

# Transfer tokens
solclone token transfer <MINT_ADDRESS> <RECIPIENT> 100
```

| Subcommand | Description |
|------------|-------------|
| `create-mint` | Create a new token mint |
| `mint` | Mint tokens to an account |
| `balance` | Check token balance |
| `transfer` | Transfer tokens |

### `solclone stake`

Manage staking operations.

```bash
# Stake SOL
solclone stake create --amount 100

# View stake accounts
solclone stake list

# Deactivate a stake
solclone stake deactivate <STAKE_ADDRESS>

# Withdraw stake
solclone stake withdraw <STAKE_ADDRESS>
```

### `solclone config`

Manage CLI configuration.

```bash
# View current config
solclone config get

# Set RPC URL
solclone config set --url http://localhost:8899

# Set keypair path
solclone config set --keypair ~/.config/solclone/id.json
```

### `solclone history`

View transaction history for an account.

```bash
# View recent transactions
solclone history

# View with limit
solclone history --limit 20

# View for a specific address
solclone history <ADDRESS>
```

### `solclone info`

Display cluster and node information.

```bash
solclone info
# Output:
#   Cluster:     Devnet
#   RPC URL:     http://localhost:8899
#   Block Height: 12345
#   Slot:        12400
#   Epoch:       3
```

### `solclone init`

Initialize a new project from a template.

```bash
# Create a token project
solclone init my-token --template token

# Create an NFT project
solclone init my-nfts --template nft

# Create an escrow project
solclone init my-escrow --template escrow

# Available templates: token, nft, escrow, voting, staking
```

| Option | Description |
|--------|-------------|
| `-t, --template <name>` | Template to use (default: token) |
| `--dir <directory>` | Target directory |
