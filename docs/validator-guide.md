# Prism Validator Operator Guide

## Getting Started

### What Is a Validator?

A Prism validator is a node that participates in consensus by verifying transactions, producing blocks, and voting on the state of the ledger. Validators earn PRISM rewards through staking and block production.

### Types of Validators

| Type             | Description                                      | Voting | Block Production |
|------------------|--------------------------------------------------|--------|------------------|
| Voting Validator | Participates in consensus and earns full rewards  | Yes    | Yes              |
| RPC Node         | Serves API requests, does not vote                | No     | No               |

### Prerequisites

- A dedicated server meeting the hardware requirements below
- A funded keypair for voting and identity
- Minimum stake: 1 PRISM (for testnet), 10,000 PRISM (for mainnet)
- Basic Linux system administration knowledge

---

## Hardware Requirements

### Minimum Requirements

| Component    | Minimum Specification                        |
|--------------|----------------------------------------------|
| CPU          | 16 cores / 32 threads, 2.8 GHz+              |
| RAM          | 256 GB DDR4                                   |
| Storage      | 2 TB NVMe SSD (PCIe Gen3 x4 or better)       |
| Network      | 1 Gbps symmetric, unmetered                   |
| OS           | Ubuntu 22.04 LTS or 24.04 LTS                 |

### Recommended Requirements

| Component    | Recommended Specification                     |
|--------------|-----------------------------------------------|
| CPU          | 24 cores / 48 threads, 3.0 GHz+ (AMD EPYC)   |
| RAM          | 512 GB DDR5                                    |
| Storage      | 4 TB NVMe SSD (PCIe Gen4 x4)                  |
| Network      | 10 Gbps symmetric, unmetered                  |
| GPU          | Not required (CPU-only consensus)              |

### Storage Considerations

- Ledger data grows at approximately 1-2 TB per year under moderate load
- Use a separate NVMe drive for accounts database vs. ledger storage
- Enable TRIM support for SSD longevity
- Plan for snapshots: keep at least 2 recent snapshots (~50-100 GB each)

---

## Installation

### 1. Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev libudev-dev \
  clang cmake protobuf-compiler libprotobuf-dev curl git
```

### 2. Install the Prism CLI

```bash
sh -c "$(curl -sSfL https://release.prism.io/stable/install)"
export PATH="$HOME/.local/share/prism/install/active_release/bin:$PATH"
```

Verify the installation:

```bash
prism --version
prism-validator --version
```

### 3. Create Keypairs

Generate the required keypairs:

```bash
# Validator identity keypair
prism-keygen new -o ~/validator-keypair.json

# Vote account keypair
prism-keygen new -o ~/vote-account-keypair.json

# Authorized withdrawer keypair (keep offline and secure)
prism-keygen new -o ~/authorized-withdrawer-keypair.json
```

> **Security Warning:** The authorized withdrawer keypair controls withdrawal of staking rewards. Store it offline in a secure location. Never keep it on the validator server.

### 4. Fund Your Validator

```bash
# Check your validator identity address
prism-keygen pubkey ~/validator-keypair.json

# For testnet, request an airdrop
prism airdrop 100 ~/validator-keypair.json --url https://api.testnet.prism.io

# For mainnet, transfer PRISM from a funded wallet
prism transfer <VALIDATOR_PUBKEY> 100 --from <FUNDED_KEYPAIR>
```

---

## Network Setup

### Configure the Validator

Set the cluster RPC URL:

```bash
# Testnet
prism config set --url https://api.testnet.prism.io

# Mainnet
prism config set --url https://api.mainnet.prism.io

# Set your keypair
prism config set --keypair ~/validator-keypair.json
```

### Create a Vote Account

```bash
prism create-vote-account \
  ~/vote-account-keypair.json \
  ~/validator-keypair.json \
  ~/authorized-withdrawer-keypair.json \
  --commission 10
```

### Firewall Configuration

Open the following ports:

| Port       | Protocol | Purpose            |
|------------|----------|--------------------|
| 8000-8020  | UDP/TCP  | Gossip and repair   |
| 8899       | TCP      | JSON-RPC (optional) |
| 8900       | TCP      | WebSocket (optional) |

```bash
sudo ufw allow 8000:8020/tcp
sudo ufw allow 8000:8020/udp
sudo ufw allow 8899/tcp   # Only if serving RPC
sudo ufw allow 8900/tcp   # Only if serving WebSocket
sudo ufw enable
```

### System Tuning

Apply recommended system settings:

```bash
# /etc/sysctl.d/21-prism-validator.conf
sudo tee /etc/sysctl.d/21-prism-validator.conf <<EOF
net.core.rmem_default=134217728
net.core.rmem_max=134217728
net.core.wmem_default=134217728
net.core.wmem_max=134217728
vm.max_map_count=1000000
fs.nr_open=1000000
EOF

sudo sysctl --system

# Increase file descriptor limits
sudo tee /etc/security/limits.d/90-prism.conf <<EOF
* - nofile 1000000
* - nproc 1000000
EOF
```

Log out and back in for limits to take effect.

---

## Starting the Validator

### Basic Startup Command

```bash
prism-validator \
  --identity ~/validator-keypair.json \
  --vote-account ~/vote-account-keypair.json \
  --known-validator <KNOWN_VALIDATOR_PUBKEY_1> \
  --known-validator <KNOWN_VALIDATOR_PUBKEY_2> \
  --only-known-rpc \
  --ledger ~/validator-ledger \
  --accounts ~/validator-accounts \
  --rpc-port 8899 \
  --dynamic-port-range 8000-8020 \
  --entrypoint entrypoint.mainnet.prism.io:8001 \
  --expected-genesis-hash <GENESIS_HASH> \
  --wal-recovery-mode skip_any_corrupted_record \
  --limit-ledger-size 50000000 \
  --log ~/prism-validator.log
```

### Running as a systemd Service

Create `/etc/systemd/system/prism-validator.service`:

```ini
[Unit]
Description=Prism Validator
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=5
User=sol
LimitNOFILE=1000000
LogRateLimitIntervalSec=0
Environment="PATH=/home/sol/.local/share/prism/install/active_release/bin:/usr/bin:/bin"
ExecStart=/home/sol/bin/validator.sh
ExecReload=/bin/kill -s HUP $MAINPID

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable prism-validator
sudo systemctl start prism-validator
```

### Catching Up

After first start, the validator must download a snapshot and catch up to the cluster:

```bash
# Monitor catch-up progress
prism catchup ~/validator-keypair.json --url https://api.mainnet.prism.io
```

This can take 15 minutes to several hours depending on network speed and how far behind the validator is.

---

## Staking and Voting

### Create a Stake Account

```bash
prism create-stake-account \
  ~/stake-account-keypair.json \
  50000 \
  --from ~/validator-keypair.json
```

### Delegate Stake

```bash
prism delegate-stake \
  ~/stake-account-keypair.json \
  <VOTE_ACCOUNT_PUBKEY> \
  --keypair ~/validator-keypair.json
```

### Set Commission

```bash
prism vote-update-commission \
  ~/vote-account-keypair.json \
  10 \
  ~/authorized-withdrawer-keypair.json
```

Commission is the percentage of staking rewards kept by the validator (0-100).

### Withdraw Rewards

```bash
prism withdraw-from-vote-account \
  ~/vote-account-keypair.json \
  <RECIPIENT_PUBKEY> \
  ALL \
  --authorized-withdrawer ~/authorized-withdrawer-keypair.json
```

### Deactivate Stake

```bash
prism deactivate-stake ~/stake-account-keypair.json
# Wait one full epoch for deactivation
prism withdraw-stake ~/stake-account-keypair.json <RECIPIENT_PUBKEY> ALL
```

---

## Monitoring

### CLI Health Checks

```bash
# Check if the validator is running and voting
prism validators --url https://api.mainnet.prism.io | grep <IDENTITY_PUBKEY>

# Check vote account status
prism vote-account ~/vote-account-keypair.json

# Check stake account
prism stake-account ~/stake-account-keypair.json

# Check validator catch-up status
prism catchup ~/validator-keypair.json

# Check the local node health
curl http://localhost:8899 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Key Metrics to Monitor

| Metric                  | Healthy Range         | Check Command                         |
|-------------------------|-----------------------|---------------------------------------|
| Slot behind             | < 100 slots           | `prism catchup`                    |
| Vote success rate       | > 95%                 | `prism validators`                 |
| Skip rate               | < 5%                  | `prism validators`                 |
| CPU usage               | < 80%                 | `htop`, `mpstat`                      |
| RAM usage               | < 90%                 | `free -h`                             |
| Disk I/O latency        | < 5ms                 | `iostat -x 1`                         |
| Disk usage              | < 80%                 | `df -h`                               |
| Network bandwidth       | < 80% of capacity     | `iftop`, `nload`                      |

### Prometheus Metrics

The validator exposes Prometheus metrics on port 8899 at `/metrics`:

```bash
curl http://localhost:8899/metrics
```

Sample Prometheus scrape configuration:

```yaml
scrape_configs:
  - job_name: 'prism-validator'
    static_configs:
      - targets: ['localhost:8899']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana Dashboard

Recommended panels for a Grafana dashboard:

- Slot height vs. cluster slot height
- Vote credits earned per epoch
- Transaction processing rate
- Skip rate over time
- Memory and CPU utilization
- Disk I/O throughput
- Network bandwidth usage

---

## Troubleshooting

### Validator Not Starting

| Symptom                        | Possible Cause                | Solution                                  |
|--------------------------------|-------------------------------|-------------------------------------------|
| `insufficient funds`           | Identity account has no PRISM | Fund the identity keypair                 |
| `Too many open files`          | File descriptor limit too low  | Update `/etc/security/limits.d/`          |
| `OutOfMemory`                  | Insufficient RAM               | Upgrade to 256 GB+ RAM                   |
| `Snapshot download failed`     | Network issue or no snapshot   | Retry or use `--no-snapshot-fetch`        |
| `GenesisMismatch`              | Wrong cluster genesis hash     | Verify `--expected-genesis-hash`          |

### Validator Falling Behind

```bash
# Check the current slot delta
prism catchup ~/validator-keypair.json

# If consistently behind, check:
# 1. CPU usage -- may need faster CPU
# 2. Disk I/O -- check for NVMe bottleneck with iostat
# 3. Network -- check for packet loss with mtr
# 4. Memory -- check for swap usage (should be zero)
```

### Vote Account Issues

```bash
# Verify the vote account is properly configured
prism vote-account <VOTE_ACCOUNT_PUBKEY>

# Re-authorize the voter if needed
prism vote-authorize-voter \
  <VOTE_ACCOUNT_PUBKEY> \
  ~/authorized-withdrawer-keypair.json \
  <NEW_VOTER_PUBKEY>
```

### Recovering from Ledger Corruption

```bash
# Stop the validator
sudo systemctl stop prism-validator

# Delete the corrupted ledger (snapshot will be re-downloaded)
rm -rf ~/validator-ledger

# Restart -- validator will download a fresh snapshot
sudo systemctl start prism-validator
```

### Log Analysis

```bash
# View recent logs
journalctl -u prism-validator -f

# Search for errors
journalctl -u prism-validator --since "1 hour ago" | grep -i error

# Check vote landing rate
journalctl -u prism-validator --since "1 hour ago" | grep "vote landed"
```

---

## Upgrading

### Standard Upgrade Process

```bash
# 1. Install the new version
prism-install update

# 2. Verify the new version
prism --version

# 3. Restart the validator
sudo systemctl restart prism-validator

# 4. Monitor catch-up
prism catchup ~/validator-keypair.json
```

### Rolling Restart (Zero Downtime)

For cluster-wide upgrades, validators coordinate rolling restarts:

```bash
# 1. Wait for your scheduled restart slot (announced in Discord/forums)
# 2. Set the validator to exit at the next restart slot
prism-validator --wait-for-supermajority <TARGET_SLOT> \
  --expected-bank-hash <EXPECTED_HASH>

# 3. Monitor the restart
prism catchup ~/validator-keypair.json
```

### Version Pinning

To pin a specific version:

```bash
prism-install init <VERSION_TAG>
# Example:
prism-install init v1.18.0
```

### Rollback

If an upgrade causes issues:

```bash
# List installed versions
prism-install info

# Revert to previous version
prism-install init <PREVIOUS_VERSION>
sudo systemctl restart prism-validator
```

---

## Security Best Practices

1. **Never store the authorized withdrawer keypair on the validator server.** Keep it in cold storage.
2. **Use a dedicated user account** (e.g., `sol`) with no sudo privileges to run the validator.
3. **Enable automatic security updates** for the OS.
4. **Restrict SSH access** to key-based authentication only, on a non-standard port.
5. **Use fail2ban** to prevent brute-force attempts.
6. **Only expose RPC ports** (8899, 8900) if you are intentionally running a public RPC node. Bind to localhost otherwise.
7. **Monitor for unauthorized logins** and set up alerts.
8. **Regularly rotate keypairs** (except the identity keypair, which is your validator's public identity).

---

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `prism validators` | List all validators and their status |
| `prism catchup <IDENTITY>` | Show catch-up progress |
| `prism vote-account <PUBKEY>` | Show vote account details |
| `prism stake-account <PUBKEY>` | Show stake account details |
| `prism balance <PUBKEY>` | Check account balance |
| `prism epoch-info` | Current epoch information |
| `prism leader-schedule` | View leader schedule |
| `prism block-production` | View block production stats |
| `prism gossip` | Show gossip network nodes |
| `prism-validator exit` | Gracefully stop the validator |
| `prism-validator monitor` | Monitor validator performance |
