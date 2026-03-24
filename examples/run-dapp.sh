#!/usr/bin/env bash
# ============================================================================
# Quick-start: Run a DApp on SolClone
# This starts the local network + explorer + DApp scaffold
# ============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT/validator/target/release/solana"
VALIDATOR_BIN="$ROOT/validator/target/release"

echo "=== SolClone DApp Quick Start ==="
echo ""

# Check if validator is built
if [ ! -f "$VALIDATOR_BIN/solana-test-validator" ]; then
    echo "Validator not built. Building (this takes 10-30 minutes)..."
    cd "$ROOT" && make validator
fi

# Start local testnet
if [ -f "$ROOT/.testnet.pid" ]; then
    echo "Testnet already running."
else
    echo "Starting local testnet..."
    "$VALIDATOR_BIN/solana-test-validator" \
        --log "$ROOT/.testnet.log" \
        --rpc-port 8899 &>/dev/null &
    echo $! > "$ROOT/.testnet.pid"
    sleep 3
    echo "  Testnet started (RPC: http://localhost:8899)"
fi

# Configure CLI
"$CLI" config set --url http://localhost:8899 2>/dev/null

# Create keypair if needed
if ! "$CLI" address &>/dev/null; then
    solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json 2>/dev/null
fi

# Airdrop SOL
echo ""
echo "Airdropping 100 SOL..."
"$CLI" airdrop 100 2>/dev/null || true

echo ""
echo "=== Network Ready ==="
echo ""
echo "  RPC:       http://localhost:8899"
echo "  WebSocket: ws://localhost:8900"
echo "  Balance:   $("$CLI" balance)"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start the explorer:"
echo "     cd explorer && pnpm dev"
echo "     → http://localhost:3000"
echo ""
echo "  2. Start the DApp scaffold:"
echo "     cd dapp-scaffold && npm run dev"
echo "     → http://localhost:3000"
echo ""
echo "  3. Create a token:"
echo "     ./examples/create-token.sh MyToken 9"
echo ""
echo "  4. Create an NFT:"
echo "     ./examples/create-nft.sh MyNFT"
echo ""
echo "  5. Deploy a custom program:"
echo "     ./examples/deploy-program.sh <program.so>"
echo ""
echo "  6. Use the CLI wallet:"
echo "     cd cli-wallet && npx solclone balance"
echo ""
echo "  7. Use the Flutter wallet:"
echo "     cd flutter-wallet && flutter run -d chrome"
echo ""
echo "To stop: make stop-testnet"
