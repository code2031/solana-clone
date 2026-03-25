# Prism Escrow Template

A trustless token escrow program built with the Anchor framework for the Prism blockchain. Enables atomic swaps between two token types.

## Features

- **initialize** - Lock token A in a PDA vault and specify the expected token B amount
- **exchange** - Taker sends token B to initializer, receives token A from vault (atomic)
- **cancel** - Initializer can cancel and reclaim locked tokens before exchange

## Usage

```bash
# Initialize from template
prism init my-escrow --template escrow

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy
```

## How It Works

1. **Initializer** creates an escrow, depositing token A into a PDA-controlled vault
2. **Taker** calls exchange, sending token B to the initializer and receiving token A
3. If no taker appears, the initializer can **cancel** to reclaim their tokens

## Account Structure

- `EscrowState` - Stores both parties' accounts, amounts, and escrow status
  - PDA seeds: `["escrow", initializer, seed]`
- Vault token account
  - PDA seeds: `["vault", escrow_key, seed]`

## Error Handling

| Error | Description |
|-------|-------------|
| `InvalidAmount` | Deposit or receive amount must be > 0 |
| `EscrowInactive` | Escrow already completed or cancelled |
| `Unauthorized` | Only initializer can cancel |
| `InvalidVault` | Vault account mismatch |
| `InvalidAccount` | Token account mismatch |
