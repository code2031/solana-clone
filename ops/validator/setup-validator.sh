#!/usr/bin/env bash
# =============================================================================
# SolClone Validator — One-Command Node Setup
# =============================================================================
# Usage: sudo ./setup-validator.sh [--cluster mainnet|testnet|devnet]
#
# This script performs a full validator node setup:
#   1. Creates the solclone system user
#   2. Generates identity / vote / withdrawer keypairs
#   3. Creates required directories
#   4. Installs the systemd service unit
#   5. Configures log rotation
#   6. Writes the default environment file
#   7. Prints next-step instructions
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CLUSTER="${CLUSTER:-mainnet}"
SOLCLONE_USER="solclone"
SOLCLONE_HOME="/home/${SOLCLONE_USER}"
CONFIG_DIR="/etc/solclone"
LOG_DIR="/var/log/solclone"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cluster)
            CLUSTER="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: sudo $0 [--cluster mainnet|testnet|devnet]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Require root
# ---------------------------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
    echo "ERROR: This script must be run as root (use sudo)." >&2
    exit 1
fi

echo "============================================"
echo " SolClone Validator — Node Setup"
echo " Cluster: ${CLUSTER}"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# 1. Create system user
# ---------------------------------------------------------------------------
step_create_user() {
    echo "[1/7] Creating system user '${SOLCLONE_USER}'..."
    if id "${SOLCLONE_USER}" &>/dev/null; then
        echo "       User already exists — skipping."
    else
        useradd --system --create-home --home-dir "${SOLCLONE_HOME}" \
            --shell /usr/sbin/nologin "${SOLCLONE_USER}"
        echo "       User created."
    fi
}

# ---------------------------------------------------------------------------
# 2. Create directories
# ---------------------------------------------------------------------------
step_create_dirs() {
    echo "[2/7] Creating directories..."
    local dirs=(
        "${SOLCLONE_HOME}/validator-ledger"
        "${SOLCLONE_HOME}/validator-accounts"
        "${SOLCLONE_HOME}/validator-snapshots"
        "${CONFIG_DIR}"
        "${LOG_DIR}"
    )
    for d in "${dirs[@]}"; do
        mkdir -p "${d}"
        chown "${SOLCLONE_USER}:${SOLCLONE_USER}" "${d}"
        echo "       ${d}"
    done
}

# ---------------------------------------------------------------------------
# 3. Generate keypairs
# ---------------------------------------------------------------------------
step_generate_keypairs() {
    echo "[3/7] Generating keypairs..."

    local keygen_bin="${SOLCLONE_HOME}/.local/share/solclone/install/active_release/bin/solclone-keygen"
    # Fallback: if the binary does not exist, use solana-keygen from PATH
    if [[ ! -x "${keygen_bin}" ]]; then
        keygen_bin="$(command -v solclone-keygen 2>/dev/null || command -v solana-keygen 2>/dev/null || true)"
    fi

    if [[ -z "${keygen_bin}" ]]; then
        echo "       WARNING: keygen binary not found. Creating placeholder keypair files."
        echo "       You MUST replace these with real keypairs before starting the validator."
        for kp in validator-keypair.json vote-account-keypair.json withdrawer-keypair.json; do
            local path="${SOLCLONE_HOME}/${kp}"
            if [[ ! -f "${path}" ]]; then
                echo '[]' > "${path}"
                chmod 600 "${path}"
                chown "${SOLCLONE_USER}:${SOLCLONE_USER}" "${path}"
                echo "       Placeholder: ${path}"
            else
                echo "       Exists (kept): ${path}"
            fi
        done
        return
    fi

    local keypairs=(
        "validator-keypair.json"
        "vote-account-keypair.json"
        "withdrawer-keypair.json"
    )

    for kp in "${keypairs[@]}"; do
        local path="${SOLCLONE_HOME}/${kp}"
        if [[ -f "${path}" ]]; then
            echo "       ${kp} already exists — skipping."
        else
            sudo -u "${SOLCLONE_USER}" "${keygen_bin}" new \
                --outfile "${path}" --no-bip39-passphrase --force --silent
            chmod 600 "${path}"
            echo "       Generated ${path}"
        fi
    done

    echo ""
    echo "       IMPORTANT: Back up your withdrawer keypair to offline/cold storage."
    echo "       File: ${SOLCLONE_HOME}/withdrawer-keypair.json"
}

# ---------------------------------------------------------------------------
# 4. Write environment file
# ---------------------------------------------------------------------------
step_write_env() {
    echo "[4/7] Writing environment file..."
    local env_file="${CONFIG_DIR}/validator.env"

    if [[ -f "${env_file}" ]]; then
        echo "       ${env_file} already exists — skipping."
        return
    fi

    case "${CLUSTER}" in
        mainnet)
            local entrypoint="entrypoint.mainnet.solclone.org:8001"
            ;;
        testnet)
            local entrypoint="entrypoint.testnet.solclone.org:8001"
            ;;
        devnet)
            local entrypoint="entrypoint.devnet.solclone.org:8001"
            ;;
        *)
            echo "ERROR: Unknown cluster '${CLUSTER}'." >&2
            exit 1
            ;;
    esac

    cat > "${env_file}" <<ENVEOF
# SolClone Validator Environment — ${CLUSTER}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

SOLCLONE_ROOT=${SOLCLONE_HOME}
IDENTITY_KEYPAIR=${SOLCLONE_HOME}/validator-keypair.json
VOTE_ACCOUNT_KEYPAIR=${SOLCLONE_HOME}/vote-account-keypair.json
LEDGER_DIR=${SOLCLONE_HOME}/validator-ledger
ACCOUNTS_DIR=${SOLCLONE_HOME}/validator-accounts
SNAPSHOTS_DIR=${SOLCLONE_HOME}/validator-snapshots
LOG_DIR=${LOG_DIR}

ENTRYPOINT=${entrypoint}
EXPECTED_GENESIS_HASH=
KNOWN_VALIDATORS=

RPC_PORT=8899
RPC_BIND_ADDRESS=127.0.0.1
WS_PORT=8900
GOSSIP_PORT=8001
DYNAMIC_PORT_RANGE=8002-8020

LIMIT_LEDGER_SIZE=50000000
SNAPSHOT_INTERVAL_SLOTS=500
FULL_SNAPSHOT_INTERVAL_SLOTS=25000

RUST_LOG=solana=info,solana_metrics=warn
RUST_BACKTRACE=1
ENVEOF

    chmod 640 "${env_file}"
    chown root:${SOLCLONE_USER} "${env_file}"
    echo "       Written: ${env_file}"
}

# ---------------------------------------------------------------------------
# 5. Install systemd service
# ---------------------------------------------------------------------------
step_install_service() {
    echo "[5/7] Installing systemd service..."

    local service_src="${SCRIPT_DIR}/solclone-validator.service"
    local service_dst="/etc/systemd/system/solclone-validator.service"

    if [[ ! -f "${service_src}" ]]; then
        echo "       WARNING: ${service_src} not found — skipping service install."
        return
    fi

    cp "${service_src}" "${service_dst}"
    chmod 644 "${service_dst}"

    # Point ExecStart at the launch script
    local launch_script="${SCRIPT_DIR}/validator-config.sh"
    if [[ -f "${launch_script}" ]]; then
        cp "${launch_script}" "${SOLCLONE_HOME}/solclone-validator.sh"
        chmod 755 "${SOLCLONE_HOME}/solclone-validator.sh"
        chown "${SOLCLONE_USER}:${SOLCLONE_USER}" "${SOLCLONE_HOME}/solclone-validator.sh"
    fi

    systemctl daemon-reload
    systemctl enable solclone-validator.service
    echo "       Service installed and enabled."
    echo "       Start with: systemctl start solclone-validator"
}

# ---------------------------------------------------------------------------
# 6. Configure log rotation
# ---------------------------------------------------------------------------
step_log_rotation() {
    echo "[6/7] Configuring log rotation..."

    local logrotate_conf="/etc/logrotate.d/solclone-validator"

    cat > "${logrotate_conf}" <<'LREOF'
/var/log/solclone/validator.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 500M
    su solclone solclone
}
LREOF

    chmod 644 "${logrotate_conf}"
    echo "       Written: ${logrotate_conf}"
}

# ---------------------------------------------------------------------------
# 7. Set system limits
# ---------------------------------------------------------------------------
step_system_limits() {
    echo "[7/7] Configuring system limits..."

    local limits_conf="/etc/security/limits.d/90-solclone.conf"

    cat > "${limits_conf}" <<'LIMEOF'
# SolClone validator limits
solclone  soft  nofile  1000000
solclone  hard  nofile  1000000
solclone  soft  nproc   65535
solclone  hard  nproc   65535
solclone  soft  memlock unlimited
solclone  hard  memlock unlimited
solclone  soft  stack   65536
solclone  hard  stack   65536
LIMEOF

    chmod 644 "${limits_conf}"
    echo "       Written: ${limits_conf}"

    # sysctl tuning
    local sysctl_conf="/etc/sysctl.d/90-solclone.conf"
    cat > "${sysctl_conf}" <<'SYSEOF'
# SolClone network tuning
net.core.rmem_default=134217728
net.core.rmem_max=134217728
net.core.wmem_default=134217728
net.core.wmem_max=134217728
vm.max_map_count=1000000
fs.nr_open=1000000
SYSEOF

    chmod 644 "${sysctl_conf}"
    sysctl --system --quiet 2>/dev/null || true
    echo "       Written: ${sysctl_conf}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    step_create_user
    step_create_dirs
    step_generate_keypairs
    step_write_env
    step_install_service
    step_log_rotation
    step_system_limits

    echo ""
    echo "============================================"
    echo " Setup complete!"
    echo "============================================"
    echo ""
    echo " Next steps:"
    echo "   1. Edit /etc/solclone/validator.env"
    echo "      - Set EXPECTED_GENESIS_HASH for your cluster"
    echo "      - Add KNOWN_VALIDATORS (space-separated pubkeys)"
    echo "   2. Fund validator identity with SOL for vote transactions"
    echo "   3. Create vote account on-chain:"
    echo "      solclone create-vote-account \\"
    echo "        ${SOLCLONE_HOME}/vote-account-keypair.json \\"
    echo "        ${SOLCLONE_HOME}/validator-keypair.json \\"
    echo "        ${SOLCLONE_HOME}/withdrawer-keypair.json"
    echo "   4. Configure firewall (see ops/security/firewall.sh)"
    echo "   5. Start the validator:"
    echo "      systemctl start solclone-validator"
    echo "   6. Monitor logs:"
    echo "      journalctl -u solclone-validator -f"
    echo ""
}

main "$@"
