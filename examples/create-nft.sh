#!/usr/bin/env bash
# ============================================================================
# Create an NFT on SolClone
# NFTs are SPL tokens with: supply=1, decimals=0, no further minting
# Usage: ./examples/create-nft.sh [nft-name]
# ============================================================================

set -euo pipefail

NFT_NAME="${1:-MySolCloneNFT}"
RPC_URL="${RPC_URL:-http://localhost:8899}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT/validator/target/release/solana"
SPL_TOKEN="$ROOT/validator/target/release/spl-token"

echo "=== Create NFT on SolClone ==="
echo ""
echo "  Name: $NFT_NAME"
echo "  RPC:  $RPC_URL"
echo ""

if [ ! -f "$CLI" ]; then
    echo "Error: Solana CLI not built. Run 'make cli' first."
    exit 1
fi

"$CLI" config set --url "$RPC_URL" 2>/dev/null

# Ensure we have SOL
BALANCE=$("$CLI" balance --lamports 2>/dev/null | awk '{print $1}')
if [ "${BALANCE:-0}" -lt 1000000000 ]; then
    echo "Requesting airdrop..."
    "$CLI" airdrop 5 2>/dev/null || true
fi

WALLET=$("$CLI" address)
echo "Wallet: $WALLET"

echo ""
echo "Step 1: Creating NFT mint (0 decimals)..."
MINT=$("$SPL_TOKEN" create-token --decimals 0 2>&1 | grep "Creating token" | awk '{print $3}')
echo "  Mint: $MINT"

echo ""
echo "Step 2: Creating token account..."
ACCOUNT=$("$SPL_TOKEN" create-account "$MINT" 2>&1 | grep "Creating account" | awk '{print $3}')
echo "  Account: $ACCOUNT"

echo ""
echo "Step 3: Minting exactly 1 token (the NFT)..."
"$SPL_TOKEN" mint "$MINT" 1

echo ""
echo "Step 4: Disabling future minting (making it a true NFT)..."
"$SPL_TOKEN" authorize "$MINT" mint --disable

echo ""
echo "=== NFT Created Successfully ==="
echo ""
echo "  Mint:      $MINT"
echo "  Account:   $ACCOUNT"
echo "  Supply:    1 (immutable)"
echo "  Decimals:  0"
echo ""
echo "This is now a non-fungible token. No more can ever be minted."
echo ""
echo "To transfer: spl-token transfer $MINT 1 <recipient> --fund-recipient"
echo ""
echo "Note: For full NFT metadata (name, image, attributes), deploy the"
echo "Metaplex Token Metadata program from metaplex/ and attach metadata."
