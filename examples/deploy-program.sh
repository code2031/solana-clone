#!/usr/bin/env bash
# ============================================================================
# Deploy a custom program to SolClone
# Usage: ./examples/deploy-program.sh <program.so>
# ============================================================================

set -euo pipefail

PROGRAM_PATH="${1:-}"
RPC_URL="${RPC_URL:-http://localhost:8899}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT/validator/target/release/solana"

echo "=== Deploy Program to SolClone ==="
echo ""

if [ ! -f "$CLI" ]; then
    echo "Error: Solana CLI not built. Run 'make cli' first."
    exit 1
fi

if [ -z "$PROGRAM_PATH" ]; then
    echo "Usage: $0 <path-to-program.so>"
    echo ""
    echo "How to build a program:"
    echo ""
    echo "  Option 1: Using Anchor (recommended)"
    echo "    cd anchor && cargo install --path cli anchor-cli"
    echo "    anchor init my-program"
    echo "    cd my-program && anchor build"
    echo "    # Output: target/deploy/my_program.so"
    echo ""
    echo "  Option 2: Using cargo-build-sbf"
    echo "    cargo build-sbf --manifest-path <your-program>/Cargo.toml"
    echo "    # Output: target/deploy/<program_name>.so"
    echo ""
    echo "  Option 3: Deploy an SPL program"
    echo "    $0 program-library/target/deploy/spl_token.so"
    exit 1
fi

if [ ! -f "$PROGRAM_PATH" ]; then
    echo "Error: File not found: $PROGRAM_PATH"
    exit 1
fi

"$CLI" config set --url "$RPC_URL" 2>/dev/null

# Ensure enough SOL for deployment
BALANCE=$("$CLI" balance --lamports 2>/dev/null | awk '{print $1}')
if [ "${BALANCE:-0}" -lt 5000000000 ]; then
    echo "Requesting airdrop for deployment..."
    "$CLI" airdrop 100 2>/dev/null || true
fi

WALLET=$("$CLI" address)
echo "  Deployer: $WALLET"
echo "  Program:  $PROGRAM_PATH"
echo "  RPC:      $RPC_URL"
echo ""

echo "Deploying program..."
"$CLI" program deploy "$PROGRAM_PATH"

echo ""
echo "=== Program Deployed ==="
echo ""
echo "Your program is now live on the SolClone network."
echo "DApps can interact with it using the web3.js SDK or CLI."
