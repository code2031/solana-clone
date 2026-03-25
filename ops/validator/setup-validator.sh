#!/usr/bin/env bash
# =============================================================================
# Prism Validator — One-Command Node Setup
# =============================================================================
# Usage: sudo ./setup-validator.sh [--cluster mainnet|testnet|devnet]
#
# This script performs a full validator node setup:
#   1. Creates the prism system user
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
PRISM_USER="prism"
PRISM_HOME="/home/${PRISM_USER}"
CONFIG_DIR="/etc/prism"
LOG_DIR="/var/log/prism"
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
echo " Prism Validator — Node Setup"
echo " Cluster: ${CLUSTER}"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# 1. Create system user
# ---------------------------------------------------------------------------
step_create_user() {
    echo "[1/7] Creating system user '${PRISM_USER}'..."
    if id "${PRISM_USER}" &>/dev/null; then
        echo "       User already exists — skipping."
    else
        useradd --system --create-home --home-dir "${PRISM_HOME}" \
            --shell /usr/sbin/nologin "${PRISM_USER}"
        echo "       User created."
    fi
}

# ---------------------------------------------------------------------------
# 2. Create directories
# ---------------------------------------------------------------------------
step_create_dirs() {
    echo "[2/7] Creating directories..."
    local dirs=(
        "${PRISM_HOME}/validator-ledger"
        "${PRISM_HOME}/validator-accounts"
        "${PRISM_HOME}/validator-snapshots"
        "${CONFIG_DIR}"
        "${LOG_DIR}"
    )
    for d in "${dirs[@]}"; do
        mkdir -p "${d}"
        chown "${PRISM_USER}:${PRISM_USER}" "${d}"
        echo "       ${d}"
    done
}

# ---------------------------------------------------------------------------
# 3. Generate keypairs
# ---------------------------------------------------------------------------
step_generate_keypairs() {
    echo "[3/7] Generating keypairs..."

    local keygen_bin="${PRISM_HOME}/.local/share/prism/install/active_release/bin/prism-keygen"
    # Fallback: if the binary does not exist, use solana-keygen from PATH
    if [[ ! -x "${keygen_bin}" ]]; then
        keygen_bin="$(command -v prism-keygen 2>/dev/null || command -v solana-keygen 2>/dev/null || true)"
    fi

    if [[ -z "${keygen_bin}" ]]; then
        echo "       WARNING: keygen binary not found. Creating placeholder keypair files."
        echo "       You MUST replace these with real keypairs before starting the validator."
        for kp in validator-keypair.json vote-account-keypair.json withdrawer-keypair.json; do
            local path="${PRISM_HOME}/${kp}"
            if [[ ! -f "${path}" ]]; then
                echo '[]' > "${path}"
                chmod 600 "${path}"
                chown "${PRISM_USER}:${PRISM_USER}" "${path}"
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
        local path="${PRISM_HOME}/${kp}"
        if [[ -f "${path}" ]]; then
            echo "       ${kp} already exists — skipping."
        else
            sudo -u "${PRISM_USER}" "${keygen_bin}" new \
                --outfile "${path}" --no-bip39-passphrase --force --silent
            chmod 600 "${path}"
            echo "       Generated ${path}"
        fi
    done

    echo ""
    echo "       IMPORTANT: Back up your withdrawer keypair to offline/cold storage."
    echo "       File: ${PRISM_HOME}/withdrawer-keypair.json"
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
            local entrypoint="entrypoint.mainnet.prism.org:8001"
            ;;
        testnet)
            local entrypoint="entrypoint.testnet.prism.org:8001"
            ;;
        devnet)
            local entrypoint="entrypoint.devnet.prism.org:8001"
            ;;
        *)
            echo "ERROR: Unknown cluster '${CLUSTER}'." >&2
            exit 1
            ;;
    esac

    cat > "${env_file}" <<ENVEOF
# Prism Validator Environment — ${CLUSTER}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

PRISM_ROOT=${PRISM_HOME}
IDENTITY_KEYPAIR=${PRISM_HOME}/validator-keypair.json
VOTE_ACCOUNT_KEYPAIR=${PRISM_HOME}/vote-account-keypair.json
LEDGER_DIR=${PRISM_HOME}/validator-ledger
ACCOUNTS_DIR=${PRISM_HOME}/validator-accounts
SNAPSHOTS_DIR=${PRISM_HOME}/validator-snapshots
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
    chown root:${PRISM_USER} "${env_file}"
    echo "       Written: ${env_file}"
}

# ---------------------------------------------------------------------------
# 5. Install systemd service
# ---------------------------------------------------------------------------
step_install_service() {
    echo "[5/7] Installing systemd service..."

    local service_src="${SCRIPT_DIR}/prism-validator.service"
    local service_dst="/etc/systemd/system/prism-validator.service"

    if [[ ! -f "${service_src}" ]]; then
        echo "       WARNING: ${service_src} not found — skipping service install."
        return
    fi

    cp "${service_src}" "${service_dst}"
    chmod 644 "${service_dst}"

    # Point ExecStart at the launch script
    local launch_script="${SCRIPT_DIR}/validator-config.sh"
    if [[ -f "${launch_script}" ]]; then
        cp "${launch_script}" "${PRISM_HOME}/prism-validator.sh"
        chmod 755 "${PRISM_HOME}/prism-validator.sh"
        chown "${PRISM_USER}:${PRISM_USER}" "${PRISM_HOME}/prism-validator.sh"
    fi

    systemctl daemon-reload
    systemctl enable prism-validator.service
    echo "       Service installed and enabled."
    echo "       Start with: systemctl start prism-validator"
}

# ---------------------------------------------------------------------------
# 6. Configure log rotation
# ---------------------------------------------------------------------------
step_log_rotation() {
    echo "[6/7] Configuring log rotation..."

    local logrotate_conf="/etc/logrotate.d/prism-validator"

    cat > "${logrotate_conf}" <<'LREOF'
/var/log/prism/validator.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 500M
    su prism prism
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

    local limits_conf="/etc/security/limits.d/90-prism.conf"

    cat > "${limits_conf}" <<'LIMEOF'
# Prism validator limits
prism  soft  nofile  1000000
prism  hard  nofile  1000000
prism  soft  nproc   65535
prism  hard  nproc   65535
prism  soft  memlock unlimited
prism  hard  memlock unlimited
prism  soft  stack   65536
prism  hard  stack   65536
LIMEOF

    chmod 644 "${limits_conf}"
    echo "       Written: ${limits_conf}"

    # sysctl tuning
    local sysctl_conf="/etc/sysctl.d/90-prism.conf"
    cat > "${sysctl_conf}" <<'SYSEOF'
# Prism network tuning
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
    echo "   1. Edit /etc/prism/validator.env"
    echo "      - Set EXPECTED_GENESIS_HASH for your cluster"
    echo "      - Add KNOWN_VALIDATORS (space-separated pubkeys)"
    echo "   2. Fund validator identity with SOL for vote transactions"
    echo "   3. Create vote account on-chain:"
    echo "      prism create-vote-account \\"
    echo "        ${PRISM_HOME}/vote-account-keypair.json \\"
    echo "        ${PRISM_HOME}/validator-keypair.json \\"
    echo "        ${PRISM_HOME}/withdrawer-keypair.json"
    echo "   4. Configure firewall (see ops/security/firewall.sh)"
    echo "   5. Start the validator:"
    echo "      systemctl start prism-validator"
    echo "   6. Monitor logs:"
    echo "      journalctl -u prism-validator -f"
    echo ""
}

main "$@"
