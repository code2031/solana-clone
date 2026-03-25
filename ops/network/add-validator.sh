#!/usr/bin/env bash
#
# add-validator.sh — Add a new validator to an existing Prism network.
#
# Usage:
#   ./add-validator.sh --cluster devnet|testnet|mainnet --entrypoint <host:port> [OPTIONS]
#
# Options:
#   --cluster <name>         Target cluster (devnet, testnet, mainnet)
#   --entrypoint <host:port> Gossip entrypoint of an existing validator
#   --rpc-url <url>          RPC URL for on-chain operations (default: http://127.0.0.1:8899)
#   --name <name>            Friendly name for this validator
#   --ledger-dir <path>      Directory for ledger data
#   --stake-amount <sol>     Amount of SOL to delegate (default: 1)
#   --commission <pct>       Vote commission percentage (default: 10)
#   --identity <path>        Path to existing identity keypair (optional)
#   --skip-stake             Do not request or delegate stake
#   --dry-run                Print commands without executing
#   -h, --help               Show this help message
#
set -euo pipefail
IFS=$'\n\t'

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
CLUSTER=""
ENTRYPOINT=""
RPC_URL="http://127.0.0.1:8899"
VALIDATOR_NAME="validator-$(date +%s)"
LEDGER_DIR="/var/prism/ledger"
STAKE_AMOUNT="1"
COMMISSION=10
IDENTITY_KEYPAIR=""
SKIP_STAKE=false
DRY_RUN=false
PRISM_BIN="${PRISM_BIN:-prism}"
PRISM_KEYGEN="${PRISM_KEYGEN:-prism-keygen}"
PRISM_VALIDATOR="${PRISM_VALIDATOR:-prism-validator}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cluster)       CLUSTER="$2";          shift 2 ;;
        --entrypoint)    ENTRYPOINT="$2";       shift 2 ;;
        --rpc-url)       RPC_URL="$2";          shift 2 ;;
        --name)          VALIDATOR_NAME="$2";   shift 2 ;;
        --ledger-dir)    LEDGER_DIR="$2";       shift 2 ;;
        --stake-amount)  STAKE_AMOUNT="$2";     shift 2 ;;
        --commission)    COMMISSION="$2";       shift 2 ;;
        --identity)      IDENTITY_KEYPAIR="$2"; shift 2 ;;
        --skip-stake)    SKIP_STAKE=true;       shift   ;;
        --dry-run)       DRY_RUN=true;          shift   ;;
        -h|--help)       usage ;;
        *)               die "Unknown option: $1" ;;
    esac
done

[[ -z "$CLUSTER" ]]    && die "Required: --cluster devnet|testnet|mainnet"
[[ -z "$ENTRYPOINT" ]] && die "Required: --entrypoint <host:port>"
[[ "$CLUSTER" =~ ^(devnet|testnet|mainnet)$ ]] || die "Invalid cluster: $CLUSTER"

# ---------------------------------------------------------------------------
# Directory setup
# ---------------------------------------------------------------------------
KEYS_DIR="${SCRIPT_DIR}/keys/${CLUSTER}/${VALIDATOR_NAME}"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/add-validator-${VALIDATOR_NAME}-$(date -u +%Y%m%d%H%M%S).log"

mkdir -p "$KEYS_DIR" "$LEDGER_DIR" "$LOG_DIR"

log "Adding validator '${VALIDATOR_NAME}' to Prism ${CLUSTER}"
exec > >(tee -a "$LOG_FILE") 2>&1

# ---------------------------------------------------------------------------
# Step 1: Generate identity + vote + withdrawer keypairs
# ---------------------------------------------------------------------------
log "=== Step 1: Generating keypairs ==="

generate_keypair() {
    local name="$1"
    local path="$KEYS_DIR/${name}.json"
    if [[ -f "$path" ]]; then
        warn "Keypair already exists: $path (skipping generation)"
    else
        run "$PRISM_KEYGEN" new --no-passphrase --outfile "$path" --force
        log "Generated keypair: $name"
    fi
    run "$PRISM_KEYGEN" pubkey "$path"
}

# Identity keypair
if [[ -n "$IDENTITY_KEYPAIR" ]]; then
    cp "$IDENTITY_KEYPAIR" "$KEYS_DIR/identity.json"
    log "Using provided identity keypair"
fi
IDENTITY_PUBKEY=$(generate_keypair "identity")
log "Identity: $IDENTITY_PUBKEY"

# Vote account keypair
VOTE_PUBKEY=$(generate_keypair "vote-account")
log "Vote account: $VOTE_PUBKEY"

# Authorized withdrawer keypair
WITHDRAWER_PUBKEY=$(generate_keypair "withdrawer")
log "Withdrawer: $WITHDRAWER_PUBKEY"

# Stake account keypair (if staking)
if ! $SKIP_STAKE; then
    STAKE_PUBKEY=$(generate_keypair "stake-account")
    log "Stake account: $STAKE_PUBKEY"
fi

# ---------------------------------------------------------------------------
# Step 2: Fund the identity account (devnet/testnet via airdrop)
# ---------------------------------------------------------------------------
log "=== Step 2: Funding identity account ==="

case "$CLUSTER" in
    devnet|testnet)
        log "Requesting airdrop for identity account..."
        run "$PRISM_BIN" --url "$RPC_URL" airdrop 10 "$IDENTITY_PUBKEY"
        sleep 2
        BALANCE=$(run "$PRISM_BIN" --url "$RPC_URL" balance "$IDENTITY_PUBKEY" | awk '{print $1}')
        log "Identity balance: ${BALANCE} SOL"
        ;;
    mainnet)
        log "Mainnet: Ensure the identity account is funded externally."
        log "Identity pubkey: $IDENTITY_PUBKEY"
        log "Minimum recommended: 5 SOL for transaction fees and vote costs."
        # Verify balance
        BALANCE=$(run "$PRISM_BIN" --url "$RPC_URL" balance "$IDENTITY_PUBKEY" 2>/dev/null | awk '{print $1}' || echo "0")
        if [[ "$BALANCE" == "0" ]]; then
            die "Identity account has no balance. Fund it before proceeding."
        fi
        log "Identity balance: ${BALANCE} SOL"
        ;;
esac

# ---------------------------------------------------------------------------
# Step 3: Create vote account
# ---------------------------------------------------------------------------
log "=== Step 3: Creating vote account ==="

run "$PRISM_BIN" --url "$RPC_URL" create-vote-account \
    "$KEYS_DIR/vote-account.json" \
    "$KEYS_DIR/identity.json" \
    "$WITHDRAWER_PUBKEY" \
    --commission "$COMMISSION"

log "Vote account created: $VOTE_PUBKEY (commission: ${COMMISSION}%)"

# Verify vote account
run "$PRISM_BIN" --url "$RPC_URL" vote-account "$VOTE_PUBKEY"
log "Vote account verified on-chain"

# ---------------------------------------------------------------------------
# Step 4: Request initial stake (optional)
# ---------------------------------------------------------------------------
if ! $SKIP_STAKE; then
    log "=== Step 4: Delegating stake ==="

    # Create stake account
    run "$PRISM_BIN" --url "$RPC_URL" create-stake-account \
        "$KEYS_DIR/stake-account.json" \
        "$STAKE_AMOUNT" \
        --from "$KEYS_DIR/identity.json"

    log "Stake account created with ${STAKE_AMOUNT} SOL"

    # Delegate to our vote account
    run "$PRISM_BIN" --url "$RPC_URL" delegate-stake \
        "$KEYS_DIR/stake-account.json" \
        "$VOTE_PUBKEY" \
        --stake-authority "$KEYS_DIR/identity.json"

    log "Stake delegated to vote account $VOTE_PUBKEY"
else
    log "=== Step 4: Skipping stake delegation (--skip-stake) ==="
fi

# ---------------------------------------------------------------------------
# Step 5: Start the validator
# ---------------------------------------------------------------------------
log "=== Step 5: Starting validator ==="

KNOWN_VALIDATORS_FLAG=""
# For mainnet/testnet, expect a known-validator list
KNOWN_VALIDATORS_FILE="${SCRIPT_DIR}/known-validators-${CLUSTER}.txt"
if [[ -f "$KNOWN_VALIDATORS_FILE" ]]; then
    while IFS= read -r pubkey; do
        [[ -z "$pubkey" || "$pubkey" == \#* ]] && continue
        KNOWN_VALIDATORS_FLAG+=" --known-validator $pubkey"
    done < "$KNOWN_VALIDATORS_FILE"
fi

VALIDATOR_ARGS=(
    --identity "$KEYS_DIR/identity.json"
    --vote-account "$KEYS_DIR/vote-account.json"
    --ledger "$LEDGER_DIR"
    --entrypoint "$ENTRYPOINT"
    --rpc-port 8899
    --gossip-port 8001
    --dynamic-port-range 8000-8020
    --log "${LOG_DIR}/validator-${VALIDATOR_NAME}.log"
    --limit-ledger-size
    --expected-shred-version 0
    --full-rpc-api
    --enable-rpc-transaction-history
    --no-poh-speed-test
)

# Add known validators if available
if [[ -n "$KNOWN_VALIDATORS_FLAG" ]]; then
    # shellcheck disable=SC2206
    VALIDATOR_ARGS+=($KNOWN_VALIDATORS_FLAG)
    VALIDATOR_ARGS+=(--only-known-rpc)
fi

# Cluster-specific flags
case "$CLUSTER" in
    devnet)
        VALIDATOR_ARGS+=(--allow-private-addr)
        ;;
    mainnet)
        VALIDATOR_ARGS+=(--no-untrusted-rpc)
        ;;
esac

log "Starting validator with entrypoint: $ENTRYPOINT"
run "$PRISM_VALIDATOR" "${VALIDATOR_ARGS[@]}" &
VALIDATOR_PID=$!
log "Validator started (PID: $VALIDATOR_PID)"

# ---------------------------------------------------------------------------
# Step 6: Wait for catchup and verify voting
# ---------------------------------------------------------------------------
log "=== Step 6: Verifying validator status ==="

log "Waiting for validator to catch up..."
MAX_RETRIES=120
RETRY_COUNT=0
until run "$PRISM_BIN" --url "$RPC_URL" catchup "$IDENTITY_PUBKEY" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [[ $RETRY_COUNT -ge $MAX_RETRIES ]]; then
        warn "Validator has not caught up after ${MAX_RETRIES} retries"
        warn "It may still be syncing. Check logs at: ${LOG_DIR}/validator-${VALIDATOR_NAME}.log"
        break
    fi
    sleep 5
done

# Verify the validator appears in the vote accounts list
log "Checking vote account status..."
VOTE_STATUS=$(run "$PRISM_BIN" --url "$RPC_URL" vote-account "$VOTE_PUBKEY" 2>/dev/null || true)
if echo "$VOTE_STATUS" | grep -q "Recent Votes"; then
    log "Validator is actively voting!"
else
    warn "Validator has not voted yet. This is normal if it is still catching up."
fi

# Check gossip for our node
log "Checking gossip for validator presence..."
run "$PRISM_BIN" --url "$RPC_URL" gossip | grep "$IDENTITY_PUBKEY" || \
    warn "Validator not yet visible in gossip"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log "========================================="
log "Validator '${VALIDATOR_NAME}' added!"
log "========================================="
log ""
log "  Identity:       $IDENTITY_PUBKEY"
log "  Vote account:   $VOTE_PUBKEY"
log "  Withdrawer:     $WITHDRAWER_PUBKEY"
log "  Commission:     ${COMMISSION}%"
if ! $SKIP_STAKE; then
log "  Stake account:  $STAKE_PUBKEY"
log "  Stake amount:   ${STAKE_AMOUNT} SOL"
fi
log ""
log "  PID:            $VALIDATOR_PID"
log "  Logs:           ${LOG_DIR}/validator-${VALIDATOR_NAME}.log"
log "  Keys:           $KEYS_DIR"
log ""
log "IMPORTANT: Back up the following keypairs securely:"
log "  - $KEYS_DIR/identity.json"
log "  - $KEYS_DIR/vote-account.json"
log "  - $KEYS_DIR/withdrawer.json"
log ""
log "Done."
