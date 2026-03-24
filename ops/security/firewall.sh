#!/usr/bin/env bash
# =============================================================================
# SolClone Validator — UFW Firewall Setup
# =============================================================================
# Usage: sudo ./firewall.sh [--public-rpc] [--ssh-port PORT] [--admin-ip IP]
#
# Opens only the ports required for a SolClone validator node.
# By default, RPC (8899) and WebSocket (8900) are restricted to localhost.
# Use --public-rpc to open them (only if you're running a public RPC node).
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
SSH_PORT="${SSH_PORT:-2222}"
PUBLIC_RPC=false
ADMIN_IPS=()
MONITORING_PORT_PROMETHEUS=9090
MONITORING_PORT_GRAFANA=3000

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --public-rpc)
            PUBLIC_RPC=true
            shift
            ;;
        --ssh-port)
            SSH_PORT="$2"
            shift 2
            ;;
        --admin-ip)
            ADMIN_IPS+=("$2")
            shift 2
            ;;
        --help|-h)
            echo "Usage: sudo $0 [--public-rpc] [--ssh-port PORT] [--admin-ip IP]"
            echo ""
            echo "Options:"
            echo "  --public-rpc      Open RPC (8899) and WS (8900) to all sources"
            echo "  --ssh-port PORT   SSH port (default: 2222)"
            echo "  --admin-ip IP     Restrict SSH and Grafana to this IP (repeatable)"
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

# ---------------------------------------------------------------------------
# Ensure UFW is installed
# ---------------------------------------------------------------------------
if ! command -v ufw &>/dev/null; then
    echo "Installing UFW..."
    apt-get update -qq && apt-get install -y -qq ufw
fi

echo "============================================"
echo " SolClone Validator — Firewall Setup"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# Reset to clean state
# ---------------------------------------------------------------------------
echo "[1/6] Setting default policies..."
ufw --force reset >/dev/null 2>&1
ufw default deny incoming
ufw default allow outgoing
echo "       Defaults: deny incoming, allow outgoing"

# ---------------------------------------------------------------------------
# SSH
# ---------------------------------------------------------------------------
echo "[2/6] Allowing SSH on port ${SSH_PORT}..."
if [[ ${#ADMIN_IPS[@]} -gt 0 ]]; then
    for ip in "${ADMIN_IPS[@]}"; do
        ufw allow from "${ip}" to any port "${SSH_PORT}" proto tcp comment "SSH from ${ip}"
        echo "       SSH allowed from ${ip}"
    done
else
    ufw allow "${SSH_PORT}/tcp" comment "SSH"
    echo "       SSH allowed from any source"
fi

# ---------------------------------------------------------------------------
# Gossip & Turbine (8000-8020 TCP+UDP)
# ---------------------------------------------------------------------------
echo "[3/6] Allowing gossip/turbine ports 8000-8020..."
ufw allow 8000:8020/tcp comment "SolClone gossip TCP"
ufw allow 8000:8020/udp comment "SolClone gossip UDP"
echo "       8000-8020 TCP+UDP open"

# ---------------------------------------------------------------------------
# RPC & WebSocket
# ---------------------------------------------------------------------------
echo "[4/6] Configuring RPC and WebSocket ports..."
if [[ "${PUBLIC_RPC}" == "true" ]]; then
    ufw allow 8899/tcp comment "SolClone RPC (public)"
    ufw allow 8900/tcp comment "SolClone WebSocket (public)"
    echo "       WARNING: RPC (8899) and WS (8900) open to public."
    echo "       Ensure you have rate limiting via a reverse proxy."
else
    ufw allow from 127.0.0.1 to any port 8899 proto tcp comment "SolClone RPC (localhost)"
    ufw allow from 127.0.0.1 to any port 8900 proto tcp comment "SolClone WebSocket (localhost)"
    echo "       RPC (8899) and WS (8900) restricted to localhost"
fi

# ---------------------------------------------------------------------------
# Monitoring
# ---------------------------------------------------------------------------
echo "[5/6] Configuring monitoring ports..."
ufw allow from 127.0.0.1 to any port "${MONITORING_PORT_PROMETHEUS}" proto tcp \
    comment "Prometheus (localhost)"
echo "       Prometheus (${MONITORING_PORT_PROMETHEUS}) restricted to localhost"

if [[ ${#ADMIN_IPS[@]} -gt 0 ]]; then
    for ip in "${ADMIN_IPS[@]}"; do
        ufw allow from "${ip}" to any port "${MONITORING_PORT_GRAFANA}" proto tcp \
            comment "Grafana from ${ip}"
        echo "       Grafana (${MONITORING_PORT_GRAFANA}) allowed from ${ip}"
    done
else
    ufw allow from 127.0.0.1 to any port "${MONITORING_PORT_GRAFANA}" proto tcp \
        comment "Grafana (localhost)"
    echo "       Grafana (${MONITORING_PORT_GRAFANA}) restricted to localhost"
fi

# ---------------------------------------------------------------------------
# Enable
# ---------------------------------------------------------------------------
echo "[6/6] Enabling firewall..."
ufw --force enable
echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "============================================"
echo " Firewall active. Current rules:"
echo "============================================"
ufw status verbose
echo ""
echo "To check status later:  sudo ufw status numbered"
echo "To disable temporarily: sudo ufw disable"
