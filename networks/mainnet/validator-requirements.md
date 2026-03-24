# SolClone Mainnet Validator Requirements

This document specifies the hardware, software, and network requirements for running a SolClone mainnet validator.

---

## Hardware Requirements

### Minimum Specifications

| Component       | Requirement                                |
|-----------------|--------------------------------------------|
| **CPU**         | 12+ physical cores, 24+ threads (AMD EPYC or Intel Xeon) |
| **RAM**         | 256 GB DDR4 ECC                            |
| **Storage**     | 2 TB NVMe SSD (PCIe Gen3x4 or better)     |
| **Network**     | 1 Gbps symmetric, unmetered               |
| **GPU**         | Not required                               |

### Recommended Specifications

| Component       | Requirement                                |
|-----------------|--------------------------------------------|
| **CPU**         | 16+ physical cores, 32+ threads (AMD EPYC 7003+ or Intel Xeon 3rd Gen+) |
| **RAM**         | 512 GB DDR4/DDR5 ECC                       |
| **Storage**     | 4 TB NVMe SSD in RAID 0 (2x 2TB PCIe Gen4x4), separate OS drive |
| **Network**     | 10 Gbps symmetric, unmetered              |
| **GPU**         | Not required (optional for future features)|

### Storage Details

- **Ledger storage**: The accounts database and ledger snapshots require high IOPS. Consumer SSDs will degrade under sustained write loads.
- **IOPS requirement**: Minimum 100,000 random read IOPS, 60,000 random write IOPS.
- **Recommended drives**: Samsung PM9A3, Intel D7-P5520, Micron 7450 PRO, or equivalent enterprise NVMe.
- **RAID**: RAID 0 across two NVMe drives is recommended for throughput. Use a separate drive for the OS.
- **Disk monitoring**: Monitor NVMe health via `smartctl` and replace drives proactively when wear reaches 80%.

### Memory Details

- The validator maintains the accounts database in memory for performance.
- 256 GB is the absolute minimum; during high-activity periods, memory pressure may cause degraded performance.
- 512 GB provides headroom for RPC serving, snapshots, and future account growth.
- ECC memory is strongly recommended to prevent silent data corruption.

---

## Software Requirements

### Operating System

| Requirement       | Specification                            |
|-------------------|------------------------------------------|
| **OS**            | Ubuntu 22.04 LTS (Jammy Jellyfish)       |
| **Kernel**        | 5.15+ (default Ubuntu 22.04 kernel)      |
| **Architecture**  | x86_64 (amd64)                           |

Ubuntu 24.04 LTS is also supported but 22.04 is the primary tested platform.

### Required Packages

```bash
sudo apt-get update && sudo apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    libudev-dev \
    clang \
    cmake \
    protobuf-compiler \
    libprotobuf-dev \
    curl \
    git \
    jq \
    net-tools \
    htop \
    iotop \
    nvme-cli \
    smartmontools
```

### Rust Toolchain

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup default stable
rustup component add rustfmt clippy
```

The validator is built from source. Ensure you are on the release branch matching the current cluster version.

### Build the Validator

```bash
git clone https://github.com/solclone/solclone.git
cd solclone
git checkout v<RELEASE_VERSION>
cargo build --release
```

The compiled binaries will be in `target/release/`.

---

## Network Requirements

### Required Ports

| Port Range    | Protocol | Direction | Purpose                     |
|---------------|----------|-----------|-----------------------------|
| **8000-8020** | UDP      | Inbound   | Gossip, Turbine, Repair     |
| **8000-8020** | TCP      | Inbound   | Gossip, Repair              |
| **8899**      | TCP      | Inbound   | JSON-RPC (optional, if serving RPC) |
| **8900**      | TCP      | Inbound   | WebSocket RPC (optional)    |
| **22**        | TCP      | Inbound   | SSH (management)            |

### Network Configuration

- **Static IP**: A static public IPv4 address is required. Dynamic DNS is not suitable for validators.
- **Elastic IP or equivalent**: If running in a cloud environment, attach an Elastic IP (AWS), Static IP (GCP), or equivalent.
- **No NAT**: The validator must be directly reachable on its gossip port. Running behind NAT is not supported.
- **Low latency**: Prefer data centers with < 100ms RTT to major internet exchanges.
- **Bandwidth**: Expect 200-500 Mbps sustained during normal operation, with bursts to 1 Gbps+ during catch-up.

### Firewall Configuration (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp                    # SSH
sudo ufw allow 8000:8020/tcp             # Gossip/Repair TCP
sudo ufw allow 8000:8020/udp             # Gossip/Turbine/Repair UDP
# Only if serving public RPC:
# sudo ufw allow 8899/tcp
# sudo ufw allow 8900/tcp
sudo ufw enable
```

---

## System Tuning

### Kernel Parameters

Add to `/etc/sysctl.d/21-solclone-validator.conf`:

```ini
# Increase UDP buffer sizes
net.core.rmem_default = 134217728
net.core.rmem_max = 134217728
net.core.wmem_default = 134217728
net.core.wmem_max = 134217728

# Increase max open files
fs.nr_open = 1000000

# VM tuning
vm.max_map_count = 1000000
vm.swappiness = 1
```

Apply with:

```bash
sudo sysctl --system
```

### File Descriptor Limits

Add to `/etc/security/limits.d/90-solclone.conf`:

```
solclone  soft  nofile  1000000
solclone  hard  nofile  1000000
```

### CPU Governor

Set to performance mode:

```bash
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

---

## Validator Identity and Key Management

### Required Keypairs

| Keypair              | Purpose                              | Security Level |
|----------------------|--------------------------------------|----------------|
| **Identity**         | Node identity for gossip and voting  | Hot (on server)|
| **Vote Account**     | Vote account authority               | Hot (on server)|
| **Authorized Withdrawer** | Withdraw from vote account     | Cold (offline) |
| **Stake Authority**  | Manage stake delegations             | Cold (offline) |

### Key Security

- **Never store the authorized withdrawer keypair on the validator server.**
- Generate cold keys on an air-gapped machine.
- Back up all keypairs in multiple secure locations (encrypted USB, hardware wallet, safe deposit box).
- Use `solclone-keygen` with `--word-count 24` for mnemonic backup of critical keys.

---

## Monitoring

### Required Monitoring

- **Validator health**: `solclone catchup`, `solclone validators`, vote account status.
- **System metrics**: CPU, RAM, disk I/O, network throughput (via Prometheus + node_exporter).
- **Disk space**: Alert at 80% capacity; snapshot pruning may be needed.
- **NVMe health**: Track wear level and temperature.
- **Slot production**: Monitor skip rate; investigate if > 5%.

### Recommended Tools

- Prometheus + Grafana for metrics visualization.
- Alertmanager for alerts (PagerDuty, Slack, or email integration).
- SolClone's built-in metrics exporter (port 9125 by default).

---

## Cloud Provider Guidance

### AWS

- **Instance type**: `r6a.8xlarge` (256 GB RAM, 32 vCPU) minimum; `r6a.16xlarge` recommended.
- **Storage**: `gp3` volume at 16,000 IOPS, 1,000 MB/s throughput, 2 TB. Or `io2` for guaranteed performance.
- **Networking**: Enable enhanced networking (ENA). Use placement groups for reduced latency if running multiple validators.
- **Region**: Choose regions with good peering to other validators.

### GCP

- **Machine type**: `n2-highmem-32` or `n2d-highmem-32`.
- **Storage**: Local SSD (375 GB x 6 in RAID 0) or pd-ssd.
- **Networking**: Use Premium Tier networking.

### Bare Metal (Recommended for Mainnet)

Bare metal servers provide the best price-to-performance for validator operations. Recommended providers:

- Latitude.sh
- Equinix Metal
- Hetzner (dedicated servers)
- OVH (High-Grade servers)

---

## Checklist Before Going Live

- [ ] Hardware meets or exceeds minimum specifications
- [ ] Ubuntu 22.04 LTS installed and updated
- [ ] Rust toolchain installed and validator binary built
- [ ] All required ports open and accessible
- [ ] Static IP or Elastic IP configured
- [ ] Kernel parameters tuned (sysctl, limits)
- [ ] CPU governor set to performance
- [ ] Identity and vote keypairs generated
- [ ] Authorized withdrawer stored offline
- [ ] Monitoring and alerting configured
- [ ] Systemd service file created and tested
- [ ] Log rotation configured
- [ ] NVMe health baseline recorded
- [ ] Backup procedures documented and tested
- [ ] Joined the SolClone validator Discord/communications channel
