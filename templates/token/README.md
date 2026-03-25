# Prism Token Template

A complete SPL-compatible token program built with the Anchor framework for the Prism blockchain.

## Features

- **initialize_mint** - Create a new token mint with configurable decimals, name, and symbol
- **mint_to** - Mint new tokens to a destination account (authority only)
- **transfer** - Transfer tokens between accounts
- **burn** - Burn tokens from an account, reducing total supply

## Usage

```bash
# Initialize from template
prism init my-token --template token

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy
```

## Account Structure

- `MintMetadata` - Stores mint authority, decimals, total supply, and initialization state
- Uses PDA seeds: `["mint-metadata", mint_pubkey]`

## Error Handling

| Error | Description |
|-------|-------------|
| `InvalidAmount` | Amount must be greater than zero |
| `Unauthorized` | Signer is not the mint authority |
| `Overflow` | Arithmetic overflow in supply calculations |
