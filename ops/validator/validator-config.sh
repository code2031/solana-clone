#!/usr/bin/env bash
# =============================================================================
# SolClone Validator Launch Script — Production Configuration
# =============================================================================
# Usage: ./validator-config.sh [--dry-run]
#
# This script launches the SolClone validator with production-grade settings.
# All tunable parameters are sourced from the environment file first, with
# sensible defaults provided below.
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Paths & identity
# ---------------------------------------------------------------------------
SOLCLONE_ROOT="${SOLCLONE_ROOT:-/home/solclone}"
VALIDATOR_BIN="${SOLCLONE_ROOT}/.local/share/solclone/install/active_release/bin/solclone-validator"
IDENTITY_KEYPAIR="${IDENTITY_KEYPAIR:-${SOLCLONE_ROOT}/validator-keypair.json}"
VOTE_ACCOUNT_KEYPAIR="${VOTE_ACCOUNT_KEYPAIR:-${SOLCLONE_ROOT}/vote-account-keypair.json}"
LEDGER_DIR="${LEDGER_DIR:-${SOLCLONE_ROOT}/validator-ledger}"
ACCOUNTS_DIR="${ACCOUNTS_DIR:-${SOLCLONE_ROOT}/validator-accounts}"
SNAPSHOTS_DIR="${SNAPSHOTS_DIR:-${SOLCLONE_ROOT}/validator-snapshots}"
LOG_DIR="${LOG_DIR:-/var/log/solclone}"
LOG_FILE="${LOG_DIR}/validator.log"

# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------
EXPECTED_GENESIS_HASH="${EXPECTED_GENESIS_HASH:-}"
ENTRYPOINT="${ENTRYPOINT:-entrypoint.mainnet.solclone.org:8001}"
KNOWN_VALIDATORS="${KNOWN_VALIDATORS:-}"
RPC_PORT="${RPC_PORT:-8899}"
RPC_BIND_ADDRESS="${RPC_BIND_ADDRESS:-127.0.0.1}"
WS_PORT="${WS_PORT:-8900}"
GOSSIP_PORT="${GOSSIP_PORT:-8001}"
DYNAMIC_PORT_RANGE="${DYNAMIC_PORT_RANGE:-8002-8020}"

# ---------------------------------------------------------------------------
# Performance tuning
# ---------------------------------------------------------------------------
LIMIT_LEDGER_SIZE="${LIMIT_LEDGER_SIZE:-50000000}"
ACCOUNTS_DB_CACHING="${ACCOUNTS_DB_CACHING:-true}"
ACCOUNT_INDEX="${ACCOUNT_INDEX:-program-id spl-token-owner spl-token-mint}"
MAX_GENESIS_ARCHIVE_UNPACKED_SIZE="${MAX_GENESIS_ARCHIVE_UNPACKED_SIZE:-1073741824}"
SNAPSHOT_INTERVAL_SLOTS="${SNAPSHOT_INTERVAL_SLOTS:-500}"
FULL_SNAPSHOT_INTERVAL_SLOTS="${FULL_SNAPSHOT_INTERVAL_SLOTS:-25000}"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
RUST_LOG="${RUST_LOG:-solana=info,solana_metrics=warn}"
RUST_BACKTRACE="${RUST_BACKTRACE:-1}"

# ---------------------------------------------------------------------------
# Dry-run support
# ---------------------------------------------------------------------------
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
fi

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
preflight() {
    local rc=0

    if [[ ! -x "${VALIDATOR_BIN}" ]]; then
        echo "ERROR: Validator binary not found at ${VALIDATOR_BIN}" >&2
        rc=1
    fi

    for kp in "${IDENTITY_KEYPAIR}" "${VOTE_ACCOUNT_KEYPAIR}"; do
        if [[ ! -f "${kp}" ]]; then
            echo "ERROR: Keypair not found: ${kp}" >&2
            rc=1
        fi
    done

    for dir in "${LEDGER_DIR}" "${ACCOUNTS_DIR}" "${SNAPSHOTS_DIR}" "${LOG_DIR}"; do
        mkdir -p "${dir}" 2>/dev/null || true
        if [[ ! -d "${dir}" ]]; then
            echo "ERROR: Cannot create directory: ${dir}" >&2
            rc=1
        fi
    done

    return ${rc}
}

# ---------------------------------------------------------------------------
# Build the argument list
# ---------------------------------------------------------------------------
build_args() {
    local args=(
        --identity "${IDENTITY_KEYPAIR}"
        --vote-account "${VOTE_ACCOUNT_KEYPAIR}"
        --ledger "${LEDGER_DIR}"
        --accounts "${ACCOUNTS_DIR}"
        --snapshots "${SNAPSHOTS_DIR}"
        --log "${LOG_FILE}"
        --rpc-port "${RPC_PORT}"
        --rpc-bind-address "${RPC_BIND_ADDRESS}"
        --ws-port "${WS_PORT}"
        --gossip-port "${GOSSIP_PORT}"
        --dynamic-port-range "${DYNAMIC_PORT_RANGE}"
        --limit-ledger-size "${LIMIT_LEDGER_SIZE}"
        --max-genesis-archive-unpacked-size "${MAX_GENESIS_ARCHIVE_UNPACKED_SIZE}"
        --snapshot-interval-slots "${SNAPSHOT_INTERVAL_SLOTS}"
        --full-snapshot-interval-slots "${FULL_SNAPSHOT_INTERVAL_SLOTS}"
        --private-rpc
        --full-rpc-api
        --no-voting
        --enable-rpc-transaction-history
        --enable-cpi-and-log-storage
        --wal-recovery-mode skip_any_corrupted_record
    )

    # Account indexes
    for idx in ${ACCOUNT_INDEX}; do
        args+=(--account-index "${idx}")
    done

    # Expected genesis hash (prevents connecting to wrong cluster)
    if [[ -n "${EXPECTED_GENESIS_HASH}" ]]; then
        args+=(--expected-genesis-hash "${EXPECTED_GENESIS_HASH}")
    fi

    # Entrypoint
    if [[ -n "${ENTRYPOINT}" ]]; then
        args+=(--entrypoint "${ENTRYPOINT}")
    fi

    # Trusted / known validators
    if [[ -n "${KNOWN_VALIDATORS}" ]]; then
        for kv in ${KNOWN_VALIDATORS}; do
            args+=(--known-validator "${kv}")
        done
        args+=(--only-known-rpc)
    fi

    # Log rotation via built-in rotation
    args+=(--log-messages-bytes-limit 104857600)

    echo "${args[@]}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    echo "============================================"
    echo " SolClone Validator — Production Launcher"
    echo "============================================"
    echo "Identity : ${IDENTITY_KEYPAIR}"
    echo "Vote     : ${VOTE_ACCOUNT_KEYPAIR}"
    echo "Ledger   : ${LEDGER_DIR}"
    echo "RPC      : ${RPC_BIND_ADDRESS}:${RPC_PORT}"
    echo "Gossip   : ${GOSSIP_PORT}"
    echo "============================================"

    preflight

    export RUST_LOG
    export RUST_BACKTRACE

    local args
    args=$(build_args)

    if [[ "${DRY_RUN}" == "true" ]]; then
        echo ""
        echo "[DRY RUN] Would execute:"
        echo "${VALIDATOR_BIN} ${args}"
        exit 0
    fi

    echo "Starting validator..."
    exec ${VALIDATOR_BIN} ${args}
}

main "$@"
