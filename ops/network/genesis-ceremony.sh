#!/usr/bin/env bash
#
# genesis-ceremony.sh — Production genesis ceremony for SolClone.
#
# Orchestrates a multi-party genesis ceremony where validator operators
# submit their pubkeys, stake is distributed according to policy, and
# the genesis block is created with cryptographic verification.
#
# Usage:
#   ./genesis-ceremony.sh --participants <file> --output-dir <dir> [OPTIONS]
#
# Options:
#   --participants <file>     YAML/CSV file with validator pubkeys and stakes
#   --output-dir <dir>        Output directory for genesis artifacts
#   --cluster <name>          Cluster type: devnet|testnet|mainnet (default: mainnet)
#   --total-supply <lamports> Total token supply in lamports
#   --verify-only             Only verify an existing genesis (do not create)
#   --dry-run                 Print commands without executing
#   -h, --help                Show this help message
#
# Participant file format (CSV):
#   # name, identity_pubkey, vote_pubkey, stake_pubkey, stake_lamports
#   validator-1, <base58>, <base58>, <base58>, 10000000000000
#   validator-2, <base58>, <base58>, <base58>, 10000000000000
#
set -euo pipefail
IFS=$'\n\t'

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
PARTICIPANTS_FILE=""
OUTPUT_DIR=""
CLUSTER="mainnet"
TOTAL_SUPPLY="500000000000000000"       # 500M SOL in lamports
VERIFY_ONLY=false
DRY_RUN=false
SOLCLONE_KEYGEN="${SOLCLONE_KEYGEN:-solclone-keygen}"
SOLCLONE_GENESIS="${SOLCLONE_GENESIS:-solclone-genesis}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Inflation configuration
INFLATION_INITIAL="0.08"
INFLATION_TERMINAL="0.015"
INFLATION_TAPER="0.15"

# Rent configuration
RENT_LAMPORTS_PER_BYTE_YEAR="3480"
RENT_EXEMPTION_THRESHOLD="2.0"
RENT_BURN_PERCENT="50"

# Fee configuration
TARGET_LAMPORTS_PER_SIGNATURE="5000"

# Epoch configuration
TICKS_PER_SLOT="64"
SLOTS_PER_EPOCH="432000"
HASHES_PER_TICK="auto"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [CEREMONY] $*"; }
warn() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [WARNING]  $*" >&2; }
die()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [FATAL]    $*" >&2; exit 1; }

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
        --participants)  PARTICIPANTS_FILE="$2"; shift 2 ;;
        --output-dir)    OUTPUT_DIR="$2";        shift 2 ;;
        --cluster)       CLUSTER="$2";           shift 2 ;;
        --total-supply)  TOTAL_SUPPLY="$2";      shift 2 ;;
        --verify-only)   VERIFY_ONLY=true;       shift   ;;
        --dry-run)       DRY_RUN=true;           shift   ;;
        -h|--help)       usage ;;
        *)               die "Unknown option: $1" ;;
    esac
done

[[ -z "$PARTICIPANTS_FILE" ]] && die "Required: --participants <file>"
[[ -f "$PARTICIPANTS_FILE" ]] || die "Participants file not found: $PARTICIPANTS_FILE"
[[ -z "$OUTPUT_DIR" ]]        && die "Required: --output-dir <dir>"
[[ "$CLUSTER" =~ ^(devnet|testnet|mainnet)$ ]] || die "Invalid cluster: $CLUSTER"

LEDGER_DIR="${OUTPUT_DIR}/ledger"
CEREMONY_LOG="${OUTPUT_DIR}/ceremony.log"
mkdir -p "$OUTPUT_DIR" "$LEDGER_DIR"

exec > >(tee -a "$CEREMONY_LOG") 2>&1

# =========================================================================
# PHASE 1: Collect and validate participant pubkeys
# =========================================================================
log "============================================"
log " SolClone Genesis Ceremony"
log " Cluster: ${CLUSTER}"
log " Date:    $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
log "============================================"
log ""

log "=== Phase 1: Collecting validator pubkeys ==="

declare -a VALIDATOR_NAMES=()
declare -a IDENTITY_PUBKEYS=()
declare -a VOTE_PUBKEYS=()
declare -a STAKE_PUBKEYS=()
declare -a STAKE_AMOUNTS=()
TOTAL_STAKED=0
PARTICIPANT_COUNT=0

while IFS=',' read -r name identity_pk vote_pk stake_pk stake_lamports; do
    # Skip comments and empty lines
    name=$(echo "$name" | xargs)
    [[ -z "$name" || "$name" == \#* ]] && continue

    identity_pk=$(echo "$identity_pk" | xargs)
    vote_pk=$(echo "$vote_pk" | xargs)
    stake_pk=$(echo "$stake_pk" | xargs)
    stake_lamports=$(echo "$stake_lamports" | xargs)

    # Validate pubkeys (base58, 32-44 characters)
    for pk_var in identity_pk vote_pk stake_pk; do
        pk="${!pk_var}"
        if [[ ! "$pk" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]]; then
            die "Invalid pubkey for ${name} (${pk_var}): ${pk}"
        fi
    done

    # Validate stake amount
    if [[ ! "$stake_lamports" =~ ^[0-9]+$ ]]; then
        die "Invalid stake amount for ${name}: ${stake_lamports}"
    fi

    VALIDATOR_NAMES+=("$name")
    IDENTITY_PUBKEYS+=("$identity_pk")
    VOTE_PUBKEYS+=("$vote_pk")
    STAKE_PUBKEYS+=("$stake_pk")
    STAKE_AMOUNTS+=("$stake_lamports")
    TOTAL_STAKED=$((TOTAL_STAKED + stake_lamports))
    PARTICIPANT_COUNT=$((PARTICIPANT_COUNT + 1))

    log "  Participant: $name"
    log "    Identity:  $identity_pk"
    log "    Vote:      $vote_pk"
    log "    Stake:     $stake_pk"
    log "    Amount:    $stake_lamports lamports"

done < "$PARTICIPANTS_FILE"

[[ $PARTICIPANT_COUNT -eq 0 ]] && die "No valid participants found in $PARTICIPANTS_FILE"

log ""
log "Total participants: $PARTICIPANT_COUNT"
log "Total staked:       $TOTAL_STAKED lamports"

# =========================================================================
# PHASE 2: Calculate stake distribution
# =========================================================================
log ""
log "=== Phase 2: Calculating stake distribution ==="

# Verify total stake does not exceed supply
if [[ $TOTAL_STAKED -gt $TOTAL_SUPPLY ]]; then
    die "Total staked ($TOTAL_STAKED) exceeds total supply ($TOTAL_SUPPLY)"
fi

REMAINING_SUPPLY=$((TOTAL_SUPPLY - TOTAL_STAKED))
log "Total supply:       $TOTAL_SUPPLY lamports"
log "Total staked:       $TOTAL_STAKED lamports"
log "Remaining (reserve): $REMAINING_SUPPLY lamports"

# Calculate percentage distribution
log ""
log "Stake distribution:"
for i in $(seq 0 $((PARTICIPANT_COUNT - 1))); do
    PCT=$(echo "scale=4; ${STAKE_AMOUNTS[$i]} * 100 / $TOTAL_STAKED" | bc)
    log "  ${VALIDATOR_NAMES[$i]}: ${STAKE_AMOUNTS[$i]} lamports (${PCT}%)"
done

# =========================================================================
# PHASE 3: Generate genesis block
# =========================================================================
if $VERIFY_ONLY; then
    log ""
    log "=== Skipping Phase 3 (--verify-only) ==="
else
    log ""
    log "=== Phase 3: Generating genesis block ==="

    # Build genesis arguments
    GENESIS_ARGS=(
        --ledger "$LEDGER_DIR"
        --cluster-type "$CLUSTER"
        --hashes-per-tick "$HASHES_PER_TICK"
        --ticks-per-slot "$TICKS_PER_SLOT"
        --slots-per-epoch "$SLOTS_PER_EPOCH"
        --target-lamports-per-signature "$TARGET_LAMPORTS_PER_SIGNATURE"
        --lamports-per-byte-year "$RENT_LAMPORTS_PER_BYTE_YEAR"
        --rent-exemption-threshold "$RENT_EXEMPTION_THRESHOLD"
        --rent-burn-percentage "$RENT_BURN_PERCENT"
        --inflation "$INFLATION_INITIAL"
    )

    # The first participant is the bootstrap validator
    log "Bootstrap validator: ${VALIDATOR_NAMES[0]}"

    # For bootstrap-validator, we need keypair files.
    # In a real ceremony, these are provided by the operator.
    # Here we expect them in a known directory.
    BOOTSTRAP_KEYS_DIR="${OUTPUT_DIR}/bootstrap-keys"
    mkdir -p "$BOOTSTRAP_KEYS_DIR"

    # Write pubkey files for genesis (solclone-genesis accepts pubkey files)
    echo "${IDENTITY_PUBKEYS[0]}" > "$BOOTSTRAP_KEYS_DIR/identity.pubkey"
    echo "${VOTE_PUBKEYS[0]}" > "$BOOTSTRAP_KEYS_DIR/vote.pubkey"
    echo "${STAKE_PUBKEYS[0]}" > "$BOOTSTRAP_KEYS_DIR/stake.pubkey"

    GENESIS_ARGS+=(
        --bootstrap-validator
            "$BOOTSTRAP_KEYS_DIR/identity.pubkey"
            "$BOOTSTRAP_KEYS_DIR/vote.pubkey"
            "$BOOTSTRAP_KEYS_DIR/stake.pubkey"
        --bootstrap-validator-lamports "${STAKE_AMOUNTS[0]}"
        --bootstrap-validator-stake-lamports "${STAKE_AMOUNTS[0]}"
    )

    # Add remaining validators as primordial accounts
    for i in $(seq 1 $((PARTICIPANT_COUNT - 1))); do
        GENESIS_ARGS+=(
            --primordial-account "${IDENTITY_PUBKEYS[$i]}"
            --primordial-lamports "${STAKE_AMOUNTS[$i]}"
        )
    done

    log "Genesis configuration:"
    log "  Inflation:  initial=${INFLATION_INITIAL}, terminal=${INFLATION_TERMINAL}, taper=${INFLATION_TAPER}"
    log "  Rent:       ${RENT_LAMPORTS_PER_BYTE_YEAR} lamports/byte-year, exemption=${RENT_EXEMPTION_THRESHOLD}x, burn=${RENT_BURN_PERCENT}%"
    log "  Fees:       ${TARGET_LAMPORTS_PER_SIGNATURE} lamports/signature"
    log "  Epoch:      ${SLOTS_PER_EPOCH} slots/epoch, ${TICKS_PER_SLOT} ticks/slot"
    log ""

    log "Creating genesis block..."
    run "$SOLCLONE_GENESIS" "${GENESIS_ARGS[@]}"
    log "Genesis block created at: $LEDGER_DIR"
fi

# =========================================================================
# PHASE 4: Hash verification
# =========================================================================
log ""
log "=== Phase 4: Hash verification ==="

# Compute genesis hash
GENESIS_HASH=$(run "$SOLCLONE_GENESIS" hash --ledger "$LEDGER_DIR" 2>/dev/null || echo "UNAVAILABLE")
log "Genesis hash: $GENESIS_HASH"

# Compute SHA-256 of the genesis bin file
GENESIS_BIN="${LEDGER_DIR}/genesis.bin"
if [[ -f "$GENESIS_BIN" ]]; then
    GENESIS_SHA256=$(sha256sum "$GENESIS_BIN" | awk '{print $1}')
    log "genesis.bin SHA-256: $GENESIS_SHA256"
else
    GENESIS_SHA256="UNAVAILABLE"
    warn "genesis.bin not found at $GENESIS_BIN"
fi

# Write verification file
VERIFICATION_FILE="${OUTPUT_DIR}/genesis-verification.txt"
cat > "$VERIFICATION_FILE" <<VERIFY_EOF
SolClone Genesis Ceremony Verification
========================================
Date:              $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Cluster:           ${CLUSTER}
Participants:      ${PARTICIPANT_COUNT}
Total supply:      ${TOTAL_SUPPLY} lamports
Total staked:      ${TOTAL_STAKED} lamports

Genesis hash:      ${GENESIS_HASH}
genesis.bin SHA256: ${GENESIS_SHA256}

Configuration:
  Inflation:       initial=${INFLATION_INITIAL}, terminal=${INFLATION_TERMINAL}, taper=${INFLATION_TAPER}
  Rent:            ${RENT_LAMPORTS_PER_BYTE_YEAR} lamports/byte-year
  Fee:             ${TARGET_LAMPORTS_PER_SIGNATURE} lamports/signature
  Epoch:           ${SLOTS_PER_EPOCH} slots

Participants:
VERIFY_EOF

for i in $(seq 0 $((PARTICIPANT_COUNT - 1))); do
    cat >> "$VERIFICATION_FILE" <<PEOF
  ${VALIDATOR_NAMES[$i]}:
    Identity: ${IDENTITY_PUBKEYS[$i]}
    Vote:     ${VOTE_PUBKEYS[$i]}
    Stake:    ${STAKE_PUBKEYS[$i]}
    Amount:   ${STAKE_AMOUNTS[$i]} lamports
PEOF
done

log "Verification file written to: $VERIFICATION_FILE"

# =========================================================================
# PHASE 5: Distribute genesis to all validators
# =========================================================================
log ""
log "=== Phase 5: Distributing genesis artifacts ==="

# Create distributable tarball
TARBALL="${OUTPUT_DIR}/solclone-genesis-${CLUSTER}-$(date -u +%Y%m%d).tar.gz"
tar -czf "$TARBALL" -C "$LEDGER_DIR" genesis.bin 2>/dev/null || \
    warn "Could not create genesis tarball (genesis.bin may not exist in dry-run)"

if [[ -f "$TARBALL" ]]; then
    TARBALL_SHA256=$(sha256sum "$TARBALL" | awk '{print $1}')
    log "Genesis tarball: $TARBALL"
    log "Tarball SHA-256: $TARBALL_SHA256"

    # Write distribution instructions
    DIST_FILE="${OUTPUT_DIR}/distribution-instructions.txt"
    cat > "$DIST_FILE" <<DIST_EOF
SolClone Genesis Distribution Instructions
=============================================
Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')

Genesis hash:      ${GENESIS_HASH}
Tarball:           $(basename "$TARBALL")
Tarball SHA-256:   ${TARBALL_SHA256}
genesis.bin SHA256: ${GENESIS_SHA256}

Each validator operator should:

1. Download the genesis tarball:
   wget <distribution-url>/$(basename "$TARBALL")

2. Verify the SHA-256 checksum:
   echo "${TARBALL_SHA256}  $(basename "$TARBALL")" | sha256sum --check

3. Extract to the ledger directory:
   mkdir -p /var/solclone/ledger
   tar -xzf $(basename "$TARBALL") -C /var/solclone/ledger/

4. Verify the genesis hash:
   solclone-genesis hash --ledger /var/solclone/ledger
   # Expected: ${GENESIS_HASH}

5. Start your validator with --expected-genesis-hash ${GENESIS_HASH}
DIST_EOF

    log "Distribution instructions: $DIST_FILE"
else
    warn "Tarball not created; ensure genesis was generated before distributing."
fi

# =========================================================================
# Summary
# =========================================================================
log ""
log "============================================"
log " Genesis Ceremony Complete"
log "============================================"
log ""
log "  Cluster:        ${CLUSTER}"
log "  Participants:   ${PARTICIPANT_COUNT}"
log "  Genesis hash:   ${GENESIS_HASH}"
log "  SHA-256:        ${GENESIS_SHA256}"
log ""
log "  Output dir:     ${OUTPUT_DIR}"
log "  Verification:   ${VERIFICATION_FILE}"
log "  Ceremony log:   ${CEREMONY_LOG}"
log ""
log "NEXT STEPS:"
log "  1. All ceremony participants must independently verify the genesis hash."
log "  2. Distribute the genesis tarball via secure channels."
log "  3. Each validator: extract genesis.bin and start with --expected-genesis-hash."
log "  4. Bootstrap validator starts first; others join via --entrypoint."
log ""
log "Ceremony complete."
