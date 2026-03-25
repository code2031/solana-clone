#!/usr/bin/env bash
#
# bootstrap-network.sh — Bootstrap a new Prism network from genesis.
#
# Usage:
#   ./bootstrap-network.sh --cluster devnet|testnet|mainnet [OPTIONS]
#
# Options:
#   --cluster <name>       Target cluster (devnet, testnet, mainnet)
#   --ledger-dir <path>    Directory for ledger data (default: /var/prism/ledger)
#   --identity <path>      Path to bootstrap validator identity keypair
#   --faucet-lamports <n>  Lamports to mint to faucet (devnet/testnet only)
#   --dry-run              Print commands without executing
#   -h, --help             Show this help message
#
set -euo pipefail
IFS=$'\n\t'

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
CLUSTER=""
LEDGER_DIR="/var/prism/ledger"
IDENTITY_KEYPAIR=""
FAUCET_LAMPORTS="500000000000000000"   # 500M SOL in lamports (devnet default)
DRY_RUN=false
PRISM_BIN="${PRISM_BIN:-prism}"
PRISM_KEYGEN="${PRISM_KEYGEN:-prism-keygen}"
PRISM_GENESIS="${PRISM_GENESIS:-prism-genesis}"
PRISM_VALIDATOR="${PRISM_VALIDATOR:-prism-validator}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYS_DIR=""
LOG_FILE=""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [INFO]  $*"; }
warn() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [WARN]  $*" >&2; }
die()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [FATAL] $*" >&2; exit 1; }

run() {
    if $DRY_RUN; then
        echo "[DRY-RUN] $*"
    else
        "$@"
    fi
}

usage() {
    sed -n '3,/^$/s/^# \?//p' "$0"
    exit 0
}

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        warn "Bootstrap failed with exit code $exit_code"
        warn "Check log file: $LOG_FILE"
        warn "Keys generated in: $KEYS_DIR"
    fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cluster)       CLUSTER="$2";          shift 2 ;;
        --ledger-dir)    LEDGER_DIR="$2";       shift 2 ;;
        --identity)      IDENTITY_KEYPAIR="$2"; shift 2 ;;
        --faucet-lamports) FAUCET_LAMPORTS="$2"; shift 2 ;;
        --dry-run)       DRY_RUN=true;          shift   ;;
        -h|--help)       usage ;;
        *)               die "Unknown option: $1" ;;
    esac
done

[[ -z "$CLUSTER" ]] && die "Required: --cluster devnet|testnet|mainnet"
[[ "$CLUSTER" =~ ^(devnet|testnet|mainnet)$ ]] || die "Invalid cluster: $CLUSTER (must be devnet, testnet, or mainnet)"

# ---------------------------------------------------------------------------
# Cluster-specific configuration
# ---------------------------------------------------------------------------
declare -A CLUSTER_CONF
case "$CLUSTER" in
    devnet)
        CLUSTER_CONF[hashes_per_tick]="sleep"
        CLUSTER_CONF[ticks_per_slot]=64
        CLUSTER_CONF[slots_per_epoch]=8192
        CLUSTER_CONF[target_lamports_per_signature]=10000
        CLUSTER_CONF[lamports_per_byte_year]=3480
        CLUSTER_CONF[inflation_initial]=0.08
        CLUSTER_CONF[inflation_terminal]=0.015
        CLUSTER_CONF[inflation_taper]=0.15
        CLUSTER_CONF[rent_exemption_threshold]=2.0
        CLUSTER_CONF[faucet_enabled]=true
        CLUSTER_CONF[bootstrap_stake]=500000000000000        # 500K SOL
        CLUSTER_CONF[foundation_lamports]=250000000000000000  # 250M SOL
        ;;
    testnet)
        CLUSTER_CONF[hashes_per_tick]="auto"
        CLUSTER_CONF[ticks_per_slot]=64
        CLUSTER_CONF[slots_per_epoch]=432000
        CLUSTER_CONF[target_lamports_per_signature]=10000
        CLUSTER_CONF[lamports_per_byte_year]=3480
        CLUSTER_CONF[inflation_initial]=0.08
        CLUSTER_CONF[inflation_terminal]=0.015
        CLUSTER_CONF[inflation_taper]=0.15
        CLUSTER_CONF[rent_exemption_threshold]=2.0
        CLUSTER_CONF[faucet_enabled]=true
        CLUSTER_CONF[bootstrap_stake]=5000000000000000       # 5M SOL
        CLUSTER_CONF[foundation_lamports]=250000000000000000  # 250M SOL
        ;;
    mainnet)
        CLUSTER_CONF[hashes_per_tick]="auto"
        CLUSTER_CONF[ticks_per_slot]=64
        CLUSTER_CONF[slots_per_epoch]=432000
        CLUSTER_CONF[target_lamports_per_signature]=5000
        CLUSTER_CONF[lamports_per_byte_year]=3480
        CLUSTER_CONF[inflation_initial]=0.08
        CLUSTER_CONF[inflation_terminal]=0.015
        CLUSTER_CONF[inflation_taper]=0.15
        CLUSTER_CONF[rent_exemption_threshold]=2.0
        CLUSTER_CONF[faucet_enabled]=false
        CLUSTER_CONF[bootstrap_stake]=50000000000000000      # 50M SOL
        CLUSTER_CONF[foundation_lamports]=250000000000000000  # 250M SOL
        ;;
esac

# ---------------------------------------------------------------------------
# Directory setup
# ---------------------------------------------------------------------------
KEYS_DIR="${SCRIPT_DIR}/keys/${CLUSTER}"
LOG_FILE="${SCRIPT_DIR}/logs/bootstrap-${CLUSTER}-$(date -u +%Y%m%d%H%M%S).log"

mkdir -p "$KEYS_DIR" "$LEDGER_DIR" "$(dirname "$LOG_FILE")"

log "Bootstrapping Prism ${CLUSTER} network"
log "Keys directory: $KEYS_DIR"
log "Ledger directory: $LEDGER_DIR"
log "Log file: $LOG_FILE"

# Tee all output to log
exec > >(tee -a "$LOG_FILE") 2>&1

# ---------------------------------------------------------------------------
# Step 1: Generate keypairs
# ---------------------------------------------------------------------------
log "=== Step 1: Generating keypairs ==="

generate_keypair() {
    local name="$1"
    local path="$KEYS_DIR/${name}.json"
    if [[ -f "$path" ]]; then
        warn "Keypair already exists: $path (skipping)"
    else
        run "$PRISM_KEYGEN" new --no-passphrase --outfile "$path" --force
        log "Generated keypair: $name -> $path"
    fi
    # Print pubkey
    run "$PRISM_KEYGEN" pubkey "$path"
}

# Bootstrap validator identity
if [[ -n "$IDENTITY_KEYPAIR" ]]; then
    cp "$IDENTITY_KEYPAIR" "$KEYS_DIR/bootstrap-identity.json"
    log "Using provided identity keypair"
else
    log "Generating bootstrap validator identity"
fi
BOOTSTRAP_IDENTITY=$(generate_keypair "bootstrap-identity")
log "Bootstrap identity: $BOOTSTRAP_IDENTITY"

# Vote account keypair
VOTE_PUBKEY=$(generate_keypair "bootstrap-vote")
log "Vote account: $VOTE_PUBKEY"

# Stake account keypair
STAKE_PUBKEY=$(generate_keypair "bootstrap-stake")
log "Stake account: $STAKE_PUBKEY"

# Faucet keypair (devnet/testnet only)
if [[ "${CLUSTER_CONF[faucet_enabled]}" == "true" ]]; then
    FAUCET_PUBKEY=$(generate_keypair "faucet")
    log "Faucet: $FAUCET_PUBKEY"
fi

# Foundation keypair
FOUNDATION_PUBKEY=$(generate_keypair "foundation")
log "Foundation: $FOUNDATION_PUBKEY"

# Authorized withdrawer for vote account
WITHDRAWER_PUBKEY=$(generate_keypair "bootstrap-withdrawer")
log "Withdrawer: $WITHDRAWER_PUBKEY"

# ---------------------------------------------------------------------------
# Step 2: Create genesis block
# ---------------------------------------------------------------------------
log "=== Step 2: Creating genesis block ==="

GENESIS_ARGS=(
    --bootstrap-validator
        "$KEYS_DIR/bootstrap-identity.json"
        "$KEYS_DIR/bootstrap-vote.json"
        "$KEYS_DIR/bootstrap-stake.json"
    --bootstrap-validator-lamports "${CLUSTER_CONF[bootstrap_stake]}"
    --bootstrap-validator-stake-lamports "${CLUSTER_CONF[bootstrap_stake]}"
    --ledger "$LEDGER_DIR"
    --hashes-per-tick "${CLUSTER_CONF[hashes_per_tick]}"
    --ticks-per-slot "${CLUSTER_CONF[ticks_per_slot]}"
    --slots-per-epoch "${CLUSTER_CONF[slots_per_epoch]}"
    --target-lamports-per-signature "${CLUSTER_CONF[target_lamports_per_signature]}"
    --lamports-per-byte-year "${CLUSTER_CONF[lamports_per_byte_year]}"
    --inflation "${CLUSTER_CONF[inflation_initial]}"
    --rent-exemption-threshold "${CLUSTER_CONF[rent_exemption_threshold]}"
    --cluster-type "$CLUSTER"
)

# Add faucet for devnet/testnet
if [[ "${CLUSTER_CONF[faucet_enabled]}" == "true" ]]; then
    GENESIS_ARGS+=(
        --faucet-pubkey "$KEYS_DIR/faucet.json"
        --faucet-lamports "$FAUCET_LAMPORTS"
    )
fi

# Add foundation account
GENESIS_ARGS+=(
    --primordial-account "$FOUNDATION_PUBKEY"
    --primordial-lamports "${CLUSTER_CONF[foundation_lamports]}"
)

log "Running genesis creation..."
run "$PRISM_GENESIS" "${GENESIS_ARGS[@]}"
log "Genesis block created successfully"

# ---------------------------------------------------------------------------
# Step 3: Compute and record genesis hash
# ---------------------------------------------------------------------------
log "=== Step 3: Recording genesis hash ==="
GENESIS_HASH=$(run "$PRISM_GENESIS" hash --ledger "$LEDGER_DIR" 2>/dev/null || echo "UNKNOWN")
log "Genesis hash: $GENESIS_HASH"
echo "$GENESIS_HASH" > "$KEYS_DIR/genesis-hash.txt"

# ---------------------------------------------------------------------------
# Step 4: Start bootstrap validator
# ---------------------------------------------------------------------------
log "=== Step 4: Starting bootstrap validator ==="

VALIDATOR_ARGS=(
    --identity "$KEYS_DIR/bootstrap-identity.json"
    --vote-account "$KEYS_DIR/bootstrap-vote.json"
    --ledger "$LEDGER_DIR"
    --rpc-port 8899
    --gossip-port 8001
    --dynamic-port-range 8000-8020
    --log "$SCRIPT_DIR/logs/bootstrap-validator-${CLUSTER}.log"
    --limit-ledger-size
    --no-poh-speed-test
    --no-os-network-limits-test
    --no-wait-for-vote-to-start-leader
    --full-rpc-api
    --enable-rpc-transaction-history
)

# Cluster-specific flags
case "$CLUSTER" in
    devnet)
        VALIDATOR_ARGS+=(
            --allow-private-addr
            --rpc-faucet-address "127.0.0.1:9900"
        )
        ;;
    testnet)
        VALIDATOR_ARGS+=(
            --expected-genesis-hash "$GENESIS_HASH"
        )
        ;;
    mainnet)
        VALIDATOR_ARGS+=(
            --expected-genesis-hash "$GENESIS_HASH"
            --no-voting
        )
        # Mainnet starts with voting disabled until quorum is reached
        ;;
esac

log "Starting bootstrap validator..."
run "$PRISM_VALIDATOR" "${VALIDATOR_ARGS[@]}" &
VALIDATOR_PID=$!
log "Bootstrap validator started (PID: $VALIDATOR_PID)"

# Wait for RPC to become available
log "Waiting for RPC to become available..."
MAX_RETRIES=60
RETRY_COUNT=0
until run "$PRISM_BIN" --url http://127.0.0.1:8899 cluster-version 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [[ $RETRY_COUNT -ge $MAX_RETRIES ]]; then
        die "Timed out waiting for bootstrap validator RPC"
    fi
    sleep 2
done
log "RPC is available"

# ---------------------------------------------------------------------------
# Step 5: Create vote account (already created via genesis, verify it)
# ---------------------------------------------------------------------------
log "=== Step 5: Verifying vote account ==="

run "$PRISM_BIN" --url http://127.0.0.1:8899 vote-account "$VOTE_PUBKEY"
log "Vote account verified"

# ---------------------------------------------------------------------------
# Step 6: Delegate initial stake
# ---------------------------------------------------------------------------
log "=== Step 6: Delegating initial stake ==="

# The bootstrap stake is already delegated via genesis.
# Verify the delegation.
run "$PRISM_BIN" --url http://127.0.0.1:8899 stake-account "$STAKE_PUBKEY"
log "Stake delegation verified"

# ---------------------------------------------------------------------------
# Step 7: Start faucet (devnet/testnet only)
# ---------------------------------------------------------------------------
if [[ "${CLUSTER_CONF[faucet_enabled]}" == "true" ]]; then
    log "=== Step 7: Starting faucet ==="
    run "$PRISM_BIN" faucet \
        --keypair "$KEYS_DIR/faucet.json" \
        --per-time-cap 1000 \
        --per-request-cap 10 &
    FAUCET_PID=$!
    log "Faucet started (PID: $FAUCET_PID)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "========================================="
log "Prism ${CLUSTER} network bootstrapped!"
log "========================================="
log ""
log "  Genesis hash:      $GENESIS_HASH"
log "  Bootstrap identity: $BOOTSTRAP_IDENTITY"
log "  Vote account:      $VOTE_PUBKEY"
log "  Stake account:     $STAKE_PUBKEY"
log "  Foundation:        $FOUNDATION_PUBKEY"
[[ "${CLUSTER_CONF[faucet_enabled]}" == "true" ]] && \
log "  Faucet:            $FAUCET_PUBKEY"
log ""
log "  RPC endpoint:      http://127.0.0.1:8899"
log "  Gossip port:       8001"
log "  Ledger:            $LEDGER_DIR"
log "  Keys:              $KEYS_DIR"
log ""
log "To add validators, run:"
log "  ./add-validator.sh --cluster $CLUSTER --entrypoint <IP>:8001"
log ""
log "Bootstrap complete."
