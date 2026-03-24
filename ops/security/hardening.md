# SolClone Validator — Security Hardening Guide

## 1. SSH Configuration

Edit `/etc/ssh/sshd_config`:

```
Port 2222                          # Non-default port
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers deployer
X11Forwarding no
AllowTcpForwarding no
PermitEmptyPasswords no
```

Restart SSH after changes:
```bash
sudo systemctl restart sshd
```

## 2. Firewall (UFW)

### Required Ports

| Port Range  | Protocol | Purpose                    | Source        |
|-------------|----------|----------------------------|---------------|
| 2222        | TCP      | SSH (custom port)          | Admin IPs     |
| 8000-8020   | TCP/UDP  | Gossip & turbine protocol  | Any           |
| 8899        | TCP      | JSON-RPC API               | 127.0.0.1     |
| 8900        | TCP      | WebSocket API              | 127.0.0.1     |
| 9090        | TCP      | Prometheus (monitoring)    | 127.0.0.1     |
| 3000        | TCP      | Grafana (monitoring)       | Admin IPs     |

### Applying the Firewall

Run the provided script:
```bash
sudo ./ops/security/firewall.sh
```

Or manually:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp comment "SSH"
sudo ufw allow 8000:8020/tcp comment "SolClone gossip TCP"
sudo ufw allow 8000:8020/udp comment "SolClone gossip UDP"
# RPC and WS should only be exposed behind a reverse proxy
sudo ufw enable
```

**Do NOT expose port 8899 (RPC) or 8900 (WS) to the public internet** unless you are running a public RPC node behind rate-limiting and a reverse proxy.

## 3. Disable Unnecessary Services

```bash
# List running services
systemctl list-units --type=service --state=running

# Disable examples (adjust to your system)
sudo systemctl disable --now cups.service         # Printing
sudo systemctl disable --now avahi-daemon.service  # mDNS
sudo systemctl disable --now bluetooth.service     # Bluetooth
sudo systemctl disable --now ModemManager.service  # Modem
```

## 4. Automatic Security Updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Edit `/etc/apt/apt.conf.d/50unattended-upgrades` to enable only security updates.

## 5. Key Management Best Practices

### Keypair Hierarchy

| Keypair     | Purpose                        | Storage              |
|-------------|--------------------------------|----------------------|
| Identity    | Validator node identity        | On validator (600)   |
| Vote        | Vote account authority         | On validator (600)   |
| Withdrawer  | Withdraw stake rewards         | **OFFLINE / cold**   |

### Key Security Rules

1. **Never share private keys.** Treat keypair JSON files as passwords.
2. **Withdrawer keypair must be stored offline** (air-gapped machine, hardware wallet, or encrypted USB in a safe).
3. Set file permissions to `600` (owner read/write only):
   ```bash
   chmod 600 /home/solclone/*-keypair.json
   ```
4. **Back up all keypairs** to at least two separate secure, encrypted locations.
5. Use `solclone-keygen verify` to confirm a keypair matches its expected public key before use.
6. Rotate the identity keypair periodically and update the on-chain vote account authority.

### Keypair File Permissions Audit

```bash
# Should show -rw------- solclone solclone for each file
ls -la /home/solclone/*-keypair.json
```

## 6. System Hardening

### Kernel Parameters

Applied automatically by `setup-validator.sh`, but verify:

```bash
# /etc/sysctl.d/90-solclone.conf
net.core.rmem_default = 134217728
net.core.rmem_max     = 134217728
net.core.wmem_default = 134217728
net.core.wmem_max     = 134217728
vm.max_map_count      = 1000000
fs.nr_open            = 1000000
```

### File System

- Mount `/tmp` with `noexec,nosuid,nodev` in `/etc/fstab`.
- Use separate partitions for `/home/solclone/validator-ledger` and `/home/solclone/validator-accounts` (ideally NVMe).

### Process Isolation

The systemd service includes:
- `NoNewPrivileges=true` -- prevents privilege escalation
- `ProtectSystem=strict` -- read-only root filesystem
- `ProtectHome=read-only` -- read-only /home except explicit write paths
- `PrivateTmp=true` -- isolated /tmp namespace
- `RestrictNamespaces=true` -- blocks namespace creation

## 7. Monitoring and Intrusion Detection

```bash
# Install fail2ban for SSH brute-force protection
sudo apt install fail2ban
sudo systemctl enable --now fail2ban

# Install and configure auditd
sudo apt install auditd
sudo auditctl -w /home/solclone/ -p wa -k solclone_keys
```

## 8. Network Security

- Place the validator behind a DDoS-mitigating provider if possible.
- Use a reverse proxy (nginx/caddy) with rate limiting for any public RPC access.
- Enable TCP SYN cookies:
  ```bash
  echo "net.ipv4.tcp_syncookies = 1" | sudo tee -a /etc/sysctl.d/90-solclone.conf
  sudo sysctl -p /etc/sysctl.d/90-solclone.conf
  ```
- Disable ICMP redirects:
  ```bash
  echo "net.ipv4.conf.all.accept_redirects = 0" | sudo tee -a /etc/sysctl.d/90-solclone.conf
  ```

## 9. Checklist

- [ ] SSH key-only authentication on non-default port
- [ ] UFW firewall active with minimal open ports
- [ ] RPC/WS bound to 127.0.0.1 (not public)
- [ ] Withdrawer keypair stored offline
- [ ] All keypair files have 600 permissions
- [ ] Unnecessary services disabled
- [ ] Automatic security updates enabled
- [ ] fail2ban protecting SSH
- [ ] Kernel parameters tuned for validator workload
- [ ] Monitoring stack deployed and alerting configured
- [ ] Snapshot backups running via cron
