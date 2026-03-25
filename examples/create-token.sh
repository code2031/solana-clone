#!/usr/bin/env bash
# ============================================================================
# Create a new SPL Token on Prism
# Usage: ./examples/create-token.sh [token-name] [decimals]
# ============================================================================

set -euo pipefail

TOKEN_NAME="${1:-MyToken}"
DECIMALS="${2:-9}"
RPC_URL="${RPC_URL:-http://localhost:8899}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT/validator/target/release/solana"
SPL_TOKEN="$ROOT/validator/target/release/spl-token"

echo "=== Create SPL Token on Prism ==="
echo ""
echo "  Token:    $TOKEN_NAME"
echo "  Decimals: $DECIMALS"
echo "  RPC:      $RPC_URL"
echo ""

# Check CLI is built
if [ ! -f "$CLI" ]; then
    echo "Error: Solana CLI not built. Run 'make cli' first."
    exit 1
fi

# Configure CLI
"$CLI" config set --url "$RPC_URL" 2>/dev/null

# Check if keypair exists
if ! "$CLI" address &>/dev/null; then
    echo "No keypair found. Generating one..."
    "$CLI" config set --keypair ~/.config/solana/id.json 2>/dev/null
    solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json 2>/dev/null
fi

WALLET=$("$CLI" address)
echo "Wallet: $WALLET"

# Airdrop if on devnet/testnet/localnet
BALANCE=$("$CLI" balance --lamports | awk '{print $1}')
if [ "$BALANCE" -lt 1000000000 ]; then
    echo "Low balance. Requesting airdrop..."
    "$CLI" airdrop 10 2>/dev/null || echo "Airdrop failed (might be mainnet)"
fi

echo ""
echo "Step 1: Creating token mint..."
MINT=$("$SPL_TOKEN" create-token --decimals "$DECIMALS" 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  Mint address: $MINT"

echo ""
echo "Step 2: Creating token account..."
ACCOUNT=$("$SPL_TOKEN" create-account "$MINT" 2>&1 | grep "Creating account" | awk '{print $3}')
echo "  Token account: $ACCOUNT"

echo ""
echo "Step 3: Minting 1,000,000 tokens..."
"$SPL_TOKEN" mint "$MINT" 1000000

echo ""
echo "Step 4: Checking balance..."
"$SPL_TOKEN" balance "$MINT"

echo ""
echo "=== Token Created Successfully ==="
echo ""
echo "  Mint:    $MINT"
echo "  Account: $ACCOUNT"
echo "  Supply:  1,000,000 $TOKEN_NAME"
echo ""
echo "To mint more:     spl-token mint $MINT <amount>"
echo "To transfer:      spl-token transfer $MINT <amount> <recipient>"
echo "To check balance: spl-token balance $MINT"
