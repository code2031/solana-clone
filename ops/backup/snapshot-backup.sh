#!/usr/bin/env bash
# =============================================================================
# SolClone Validator — Snapshot Backup Script
# =============================================================================
# Usage: ./snapshot-backup.sh
#
# Designed to run via cron (e.g., every 6 hours):
#   0 */6 * * * /home/pranav/solana-clone/ops/backup/snapshot-backup.sh >> /var/log/solclone/backup.log 2>&1
#
# What it does:
#   1. Finds the latest full and incremental snapshots
#   2. Compresses them with zstd
#   3. Uploads to S3-compatible storage
#   4. Prunes remote backups older than RETENTION_DAYS
#   5. Logs every step with timestamps
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration (override via environment or /etc/solclone/backup.env)
# ---------------------------------------------------------------------------
BACKUP_ENV="/etc/solclone/backup.env"
if [[ -f "${BACKUP_ENV}" ]]; then
    # shellcheck source=/dev/null
    source "${BACKUP_ENV}"
fi

SNAPSHOT_DIR="${SNAPSHOT_DIR:-/home/solclone/validator-snapshots}"
STAGING_DIR="${STAGING_DIR:-/tmp/solclone-backup-staging}"
S3_BUCKET="${S3_BUCKET:-s3://solclone-snapshots}"
S3_PREFIX="${S3_PREFIX:-backups/$(hostname)}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
COMPRESS_THREADS="${COMPRESS_THREADS:-4}"
MAX_UPLOAD_RETRIES="${MAX_UPLOAD_RETRIES:-3}"
LOCK_FILE="/tmp/solclone-backup.lock"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*"
}

die() {
    log "FATAL: $*"
    exit 1
}

cleanup() {
    rm -rf "${STAGING_DIR}"
    rm -f "${LOCK_FILE}"
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
preflight() {
    # Prevent concurrent runs
    if [[ -f "${LOCK_FILE}" ]]; then
        local lock_pid
        lock_pid=$(cat "${LOCK_FILE}" 2>/dev/null || echo "")
        if [[ -n "${lock_pid}" ]] && kill -0 "${lock_pid}" 2>/dev/null; then
            die "Another backup is already running (PID ${lock_pid})"
        fi
        log "Stale lock file found — removing."
        rm -f "${LOCK_FILE}"
    fi
    echo $$ > "${LOCK_FILE}"

    # Check tools
    for cmd in aws zstd; do
        if ! command -v "${cmd}" &>/dev/null; then
            die "'${cmd}' is required but not installed."
        fi
    done

    if [[ ! -d "${SNAPSHOT_DIR}" ]]; then
        die "Snapshot directory not found: ${SNAPSHOT_DIR}"
    fi

    mkdir -p "${STAGING_DIR}"
}

# ---------------------------------------------------------------------------
# Build the aws CLI args (supports custom S3 endpoints like MinIO)
# ---------------------------------------------------------------------------
s3_cmd() {
    local args=("aws" "s3")
    if [[ -n "${S3_ENDPOINT}" ]]; then
        args+=("--endpoint-url" "${S3_ENDPOINT}")
    fi
    args+=("$@")
    "${args[@]}"
}

# ---------------------------------------------------------------------------
# Find and compress snapshots
# ---------------------------------------------------------------------------
find_and_compress() {
    log "Scanning for snapshots in ${SNAPSHOT_DIR}..."

    local snapshot_count=0

    # Full snapshots: snapshot-<slot>-<hash>.tar.bz2 or .tar.zst or .tar
    # Incremental:    incremental-snapshot-<slot>-<slot>-<hash>.tar.*
    while IFS= read -r -d '' snap; do
        local basename
        basename=$(basename "${snap}")
        local compressed="${STAGING_DIR}/${basename}.zst"

        # Skip if already zstd-compressed
        if [[ "${snap}" == *.zst ]]; then
            log "  Already compressed: ${basename}"
            cp "${snap}" "${STAGING_DIR}/${basename}"
            snapshot_count=$((snapshot_count + 1))
            continue
        fi

        log "  Compressing: ${basename}"
        zstd -T"${COMPRESS_THREADS}" -3 -q "${snap}" -o "${compressed}"
        snapshot_count=$((snapshot_count + 1))
    done < <(find "${SNAPSHOT_DIR}" -maxdepth 1 \
        \( -name "snapshot-*.tar*" -o -name "incremental-snapshot-*.tar*" \) \
        -mmin -720 -print0 | sort -z)

    if [[ ${snapshot_count} -eq 0 ]]; then
        log "No recent snapshots found (within last 12 hours). Nothing to upload."
        exit 0
    fi

    log "Found ${snapshot_count} snapshot(s) to upload."
}

# ---------------------------------------------------------------------------
# Upload to S3
# ---------------------------------------------------------------------------
upload() {
    log "Uploading to ${S3_BUCKET}/${S3_PREFIX}/..."

    local datestamp
    datestamp=$(date -u '+%Y-%m-%d')
    local dest="${S3_BUCKET}/${S3_PREFIX}/${datestamp}"

    local attempt=1
    while [[ ${attempt} -le ${MAX_UPLOAD_RETRIES} ]]; do
        if s3_cmd cp "${STAGING_DIR}/" "${dest}/" --recursive --only-show-errors; then
            log "Upload complete."
            return 0
        fi
        log "Upload attempt ${attempt}/${MAX_UPLOAD_RETRIES} failed — retrying in 30s..."
        sleep 30
        attempt=$((attempt + 1))
    done

    die "Upload failed after ${MAX_UPLOAD_RETRIES} attempts."
}

# ---------------------------------------------------------------------------
# Prune old backups
# ---------------------------------------------------------------------------
prune() {
    log "Pruning backups older than ${RETENTION_DAYS} days..."

    local cutoff_date
    cutoff_date=$(date -u -d "${RETENTION_DAYS} days ago" '+%Y-%m-%d' 2>/dev/null || \
                  date -u -v-"${RETENTION_DAYS}"d '+%Y-%m-%d' 2>/dev/null || echo "")

    if [[ -z "${cutoff_date}" ]]; then
        log "Could not compute cutoff date — skipping prune."
        return
    fi

    # List date-prefixed directories and remove old ones
    s3_cmd ls "${S3_BUCKET}/${S3_PREFIX}/" 2>/dev/null | while read -r line; do
        local dir_date
        dir_date=$(echo "${line}" | grep -oP '\d{4}-\d{2}-\d{2}' || true)
        if [[ -n "${dir_date}" && "${dir_date}" < "${cutoff_date}" ]]; then
            log "  Removing: ${S3_BUCKET}/${S3_PREFIX}/${dir_date}/"
            s3_cmd rm "${S3_BUCKET}/${S3_PREFIX}/${dir_date}/" --recursive --only-show-errors || true
        fi
    done

    log "Prune complete."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    log "============================================"
    log " SolClone Snapshot Backup"
    log "============================================"

    preflight
    find_and_compress
    upload
    prune

    log "Backup finished successfully."
}

main "$@"
