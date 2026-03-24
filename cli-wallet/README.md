# SolClone CLI Wallet

A command-line wallet for Solana-compatible blockchains. Built with TypeScript, using raw JSON-RPC calls (no `@solana/web3.js` dependency).

## Installation

```bash
npm install
npm run build
npm link    # makes 'solclone' available globally
```

## Quick Start

```bash
# Generate a keypair
solclone keygen

# Configure RPC endpoint
solclone config set --url http://localhost:8899

# Check your balance
solclone balance

# Request an airdrop (testnet/devnet)
solclone airdrop 2

# Send SOL
solclone transfer <recipient-address> 1.5

# Show your address with QR code
solclone address
```

## Commands

### Key Management
```bash
solclone keygen                        # Generate new keypair
solclone keygen --outfile key.json     # Save to specific file
solclone keygen --force                # Overwrite existing keypair
solclone address                       # Show address + QR code
```

### Balance & Transfers
```bash
solclone balance [address]             # Check SOL balance
solclone balance --lamports            # Show balance in lamports
solclone transfer <to> <amount>        # Send SOL
solclone airdrop <amount> [address]    # Request airdrop
```

### SPL Tokens
```bash
solclone token create-mint --decimals 9    # Create token mint
solclone token mint <mint> <amount>        # Mint tokens
solclone token transfer <mint> <to> <amt>  # Transfer tokens
solclone token balance <mint> [owner]      # Token balance
solclone token accounts [owner]            # List token accounts
```

### Staking
```bash
solclone stake delegate <validator> <amount>  # Delegate stake
solclone stake deactivate <stake-account>     # Deactivate
solclone stake withdraw <stake-account>       # Withdraw
```

### Information
```bash
solclone history [address] [--limit 10]   # Transaction history
solclone history --verbose                # Detailed tx info
solclone info [address]                   # Account info
solclone cluster-info                     # Cluster info
```

### Configuration
```bash
solclone config set --url <rpc-url>       # Set RPC URL
solclone config set --keypair <path>      # Set default keypair
solclone config set --commitment confirmed  # Set commitment
solclone config get                       # Show config
```

## Configuration

Config is stored at `~/.solclone/config.yml`:

```yaml
rpc_url: http://localhost:8899
keypair_path: ~/.solclone/id.json
commitment: confirmed
```

## Architecture

- **No `@solana/web3.js` dependency** -- uses a raw JSON-RPC HTTP client
- **`tweetnacl`** for Ed25519 key generation and transaction signing
- **`bs58`** for Base58 encoding/decoding
- **`commander`** for CLI framework
- **`chalk`** + **`ora`** for colored output and spinners
- **`qrcode-terminal`** for displaying receive-address QR codes

## Development

```bash
npm run dev -- keygen          # Run without building
npm run build                  # Compile TypeScript
npm run clean                  # Remove build output
```

## License

MIT
