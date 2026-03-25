#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BENCHMARKS_DIR="$SCRIPT_DIR"

RPC_PORT="${RPC_PORT:-8899}"
RPC_URL="http://localhost:${RPC_PORT}"
VALIDATOR_PID=""

# ─── Colors ──────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${CYAN}[bench]${NC} $*"; }
ok()   { echo -e "${GREEN}[bench]${NC} $*"; }
warn() { echo -e "${YELLOW}[bench]${NC} $*"; }
fail() { echo -e "${RED}[bench]${NC} $*"; }

# ─── Cleanup ─────────────────────────────────────────────────────────────────

cleanup() {
  if [ -n "$VALIDATOR_PID" ] && kill -0 "$VALIDATOR_PID" 2>/dev/null; then
    log "Stopping validator (PID: $VALIDATOR_PID)..."
    kill "$VALIDATOR_PID" 2>/dev/null || true
    wait "$VALIDATOR_PID" 2>/dev/null || true
    ok "Validator stopped."
  fi
}

trap cleanup EXIT

# ─── Check Dependencies ─────────────────────────────────────────────────────

log "Checking dependencies..."

if ! command -v node &>/dev/null; then
  fail "Node.js is required but not found."
  exit 1
fi

# ─── Install Benchmark Dependencies ──────────────────────────────────────────

if [ ! -d "$BENCHMARKS_DIR/node_modules" ]; then
  log "Installing benchmark dependencies..."
  cd "$BENCHMARKS_DIR" && npm install
fi

# ─── Start Testnet ───────────────────────────────────────────────────────────

log "Starting Prism testnet..."

VALIDATOR_BIN="$PROJECT_ROOT/validator/target/release/prism-validator"
START_SCRIPT="$PROJECT_ROOT/scripts/start-testnet.sh"

if [ -x "$START_SCRIPT" ]; then
  log "Using start-testnet.sh..."
  "$START_SCRIPT" &
  VALIDATOR_PID=$!
elif [ -x "$VALIDATOR_BIN" ]; then
  log "Starting validator directly..."
  "$VALIDATOR_BIN" --rpc-port "$RPC_PORT" --ledger /tmp/prism-bench-ledger &
  VALIDATOR_PID=$!
else
  warn "No validator binary found. Assuming testnet is already running on $RPC_URL."
fi

# Wait for RPC to be ready
log "Waiting for RPC to be ready at $RPC_URL..."
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if curl -s "$RPC_URL" -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' 2>/dev/null | grep -q "result\|ok"; then
    ok "RPC is ready!"
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    warn "RPC not responding after ${MAX_RETRIES}s. Proceeding anyway..."
  fi
  sleep 1
done

# ─── Run Benchmarks ─────────────────────────────────────────────────────────

cd "$BENCHMARKS_DIR"
export RPC_URL

echo ""
echo "============================================"
echo "  Prism Benchmark Suite"
echo "  RPC: $RPC_URL"
echo "============================================"
echo ""

# TPS Benchmark
log "Running TPS benchmark..."
if npx tsx src/tps-bench.ts; then
  ok "TPS benchmark complete."
else
  warn "TPS benchmark had errors."
fi

echo ""

# Latency Benchmark
log "Running latency benchmark..."
if npx tsx src/latency-bench.ts; then
  ok "Latency benchmark complete."
else
  warn "Latency benchmark had errors."
fi

echo ""

# Generate Report
log "Generating report..."
npx tsx src/report.ts
ok "Report generated."

echo ""
echo "============================================"
echo "  Benchmark Complete!"
echo "  Results: $BENCHMARKS_DIR/RESULTS.md"
echo "============================================"
