# SolClone CLI Wallet

Custom command-line wallet for the SolClone blockchain, part of the SolClone ecosystem. Built with TypeScript using raw JSON-RPC calls (no `@solana/web3.js` dependency).

**Monorepo:** [https://github.com/code2031/solana-clone](https://github.com/code2031/solana-clone)
**Location:** `cli-wallet/` within the main monorepo

## Prerequisites

- Node.js >= 16
- npm

## Build

```bash
cd cli-wallet
npm install
npm run build
npm link          # Makes 'solclone' available globally
```

## Quick Start

```bash
solclone keygen                              # Generate a keypair
solclone config set --url http://localhost:8899   # Set RPC endpoint
solclone balance                             # Check balance
solclone airdrop 2                           # Request airdrop (testnet/devnet)
solclone transfer <recipient> 1.5            # Send SOL
solclone address                             # Show address with QR code
```

## Commands

| Command | Description |
|---------|-------------|
| `keygen` | Generate new Ed25519 keypair |
| `balance [address]` | Check SOL balance (supports `--lamports`) |
| `transfer <to> <amount>` | Send SOL to an address |
| `airdrop <amount> [address]` | Request airdrop on testnet/devnet |
| `address` | Display wallet address with QR code |
| `token create-mint` | Create a new SPL token mint |
| `token mint <mint> <amount>` | Mint tokens |
| `token transfer <mint> <to> <amount>` | Transfer SPL tokens |
| `token balance <mint> [owner]` | Check token balance |
| `token accounts [owner]` | List all token accounts |
| `stake delegate <validator> <amount>` | Delegate stake |
| `stake deactivate <stake-account>` | Deactivate stake |
| `stake withdraw <stake-account>` | Withdraw stake |
| `config get` | Show current configuration |
| `config set --url <rpc-url>` | Set RPC URL, keypair, or commitment |
| `history [address]` | Transaction history (supports `--limit`, `--verbose`) |
| `info [address]` | Account info |

## Configuration

Config is stored at `~/.solclone/config.yml`:

```yaml
rpc_url: http://localhost:8899
keypair_path: ~/.solclone/id.json
commitment: confirmed
```

## Development

```bash
npm run dev -- keygen     # Run without building
npm run build             # Compile TypeScript
npm run clean             # Remove build output
```

## Architecture

- **tweetnacl** for Ed25519 key generation and transaction signing
- **bs58** for Base58 encoding/decoding
- **commander** for CLI framework
- **chalk** + **ora** for colored output and spinners
- **qrcode-terminal** for receive-address QR codes

## Related Components

- [Validator](https://github.com/code2031/solclone-validator)
- [Web3.js SDK](https://github.com/code2031/solclone-web3js)
- [Flutter Wallet](../flutter-wallet/)

## License

MIT
