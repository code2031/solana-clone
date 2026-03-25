# Incident Response Runbook

This runbook covers response procedures for common Prism network incidents. Each section includes symptoms, diagnosis steps, resolution procedures, and escalation paths.

---

## Table of Contents

1. [Severity Levels](#severity-levels)
2. [Incident Commander Checklist](#incident-commander-checklist)
3. [Validator Down](#1-validator-down)
4. [Consensus Stall](#2-consensus-stall)
5. [Chain Halt](#3-chain-halt)
6. [Key Compromise](#4-key-compromise)
7. [Network Partition](#5-network-partition)
8. [Memory Exhaustion](#6-memory-exhaustion)
9. [Post-Incident Process](#post-incident-process)
10. [Contact Directory](#contact-directory)

---

## Severity Levels

| Level | Name | Description | Response Time |
|---|---|---|---|
| **SEV-1** | Critical | Chain halt, consensus failure, fund safety risk | Immediate (< 15 min) |
| **SEV-2** | High | Multiple validators down, degraded consensus | < 30 min |
| **SEV-3** | Medium | Single validator down, performance degradation | < 2 hours |
| **SEV-4** | Low | Non-urgent operational issue | Next business day |

---

## Incident Commander Checklist

When an incident is declared:

- [ ] Acknowledge the incident in the #incidents channel
- [ ] Assign severity level
- [ ] Open an incident tracking document (copy the template)
- [ ] Assemble the response team
- [ ] Begin diagnosis using the relevant runbook section below
- [ ] Post status updates every 15 minutes (SEV-1/2) or 60 minutes (SEV-3/4)
- [ ] Coordinate fix and deployment
- [ ] Declare incident resolved
- [ ] Schedule post-incident review within 48 hours

---

## 1. Validator Down

**Severity**: SEV-3 (single validator) / SEV-2 (multiple / high-stake validator)

### Symptoms

- Validator stops producing blocks during its leader slots
- Vote account shows no recent votes
- Gossip shows the validator as delinquent
- Monitoring alerts: service down, no heartbeat

### Diagnosis

```bash
# 1. Check if the validator process is running
systemctl status prism-validator
journalctl -u prism-validator --since "10 minutes ago" --no-pager

# 2. Check system resources
free -h                        # Memory
df -h /var/prism             # Disk space
top -bn1 | head -20            # CPU / load
dmesg | tail -50               # Kernel messages (OOM killer, disk errors)

# 3. Check validator logs for errors
tail -500 /var/log/prism/validator.log | grep -i "error\|panic\|fatal"

# 4. Check if RPC is responding
curl -s http://127.0.0.1:8899 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | jq .

# 5. Check network connectivity to entrypoints
prism gossip --url http://127.0.0.1:8899 | head -20

# 6. Check vote account status
prism vote-account <VOTE_PUBKEY> --url http://127.0.0.1:8899
```

### Resolution

**Process crashed (restart):**
```bash
# Restart the validator
sudo systemctl restart prism-validator

# Monitor startup
journalctl -u prism-validator -f

# Verify catchup
prism catchup <IDENTITY_PUBKEY> --url http://127.0.0.1:8899
```

**Out of memory (OOM killed):**
```bash
# Confirm OOM kill
dmesg | grep -i "out of memory\|oom"

# Check what consumed memory
journalctl -k | grep -i oom

# If accounts DB grew too large, consider --limit-ledger-size
# Restart with adjusted parameters
sudo systemctl restart prism-validator
```

**Disk full:**
```bash
# Check disk usage
du -sh /var/prism/ledger/*
du -sh /var/prism/snapshots/*

# Prune old snapshots (keep last 2)
ls -t /var/prism/snapshots/snapshot-*.tar.* | tail -n +3 | xargs rm -f

# Clean old ledger data
prism-ledger-tool purge --ledger /var/prism/ledger --before <SLOT>

# Restart
sudo systemctl restart prism-validator
```

**Corrupted ledger:**
```bash
# Stop the validator
sudo systemctl stop prism-validator

# Remove ledger and re-download from snapshot
rm -rf /var/prism/ledger/rocksdb

# Restart -- validator will download a fresh snapshot
sudo systemctl start prism-validator
```

### Escalation

- If the validator cannot restart after 3 attempts: escalate to SEV-2
- If multiple validators are affected: escalate to SEV-2 and begin consensus stall investigation

---

## 2. Consensus Stall

**Severity**: SEV-2 / SEV-1

### Symptoms

- Slot height stops advancing or advances very slowly
- Transaction confirmations are delayed (> 30 seconds)
- Multiple validators report high skip rates
- Block time increases significantly (> 1 second per slot)

### Diagnosis

```bash
# 1. Check current slot progression
prism slot --url <RPC_URL>
sleep 5
prism slot --url <RPC_URL>
# Slots should advance by ~12 in 5 seconds (400ms per slot)

# 2. Check cluster-wide validator status
prism validators --url <RPC_URL>

# 3. Check how much stake is active
prism validators --url <RPC_URL> | grep "Active Stake"
# Consensus requires >66% of stake to be voting

# 4. Check for delinquent validators (not voting)
prism validators --url <RPC_URL> --output json | \
  jq '.validators[] | select(.delinquent == true) | {identity, activatedStake}'

# 5. Check leader schedule gaps
prism leader-schedule --url <RPC_URL> | grep "SKIP"

# 6. Check if the issue is gossip-related
prism gossip --url <RPC_URL> | wc -l
# Compare with expected cluster size
```

### Resolution

**Insufficient voting stake (< 66%):**
```bash
# Identify delinquent high-stake validators
prism validators --url <RPC_URL> --output json | \
  jq -r '.validators[] | select(.delinquent == true) | "\(.identityPubkey) stake=\(.activatedStake)"' | \
  sort -t= -k2 -rn | head -20

# Contact delinquent validator operators (see Contact Directory)
# Coordinate restart of delinquent validators

# If enough stake has restarted, wait for 2 epochs for stake to reactivate
```

**Bug causing validators to diverge:**
```bash
# Compare bank hashes across validators at the same slot
# On each validator:
prism slot --url http://<VALIDATOR_IP>:8899
prism block-time <SLOT> --url http://<VALIDATOR_IP>:8899

# If bank hashes differ at the same slot, validators have diverged
# This indicates a consensus bug -- escalate immediately to SEV-1
```

**Network partition:**
See [Section 5: Network Partition](#5-network-partition).

### Escalation

- If slot production stops entirely for > 5 minutes: escalate to SEV-1 (Chain Halt)
- If bank hash divergence is detected: escalate to SEV-1 and notify the core engineering team

---

## 3. Chain Halt

**Severity**: SEV-1 (Critical)

### Symptoms

- No new blocks are produced for > 2 minutes
- All transactions fail or time out
- `prism slot` returns the same value repeatedly
- Validators report "tower is not making progress"

### Diagnosis

```bash
# 1. Confirm the halt is real (check multiple RPC endpoints)
for rpc in <RPC_1> <RPC_2> <RPC_3>; do
  echo "=== $rpc ===" && prism slot --url "$rpc"
done

# 2. Determine when the halt started
prism block-time $(prism slot --url <RPC_URL>) --url <RPC_URL>

# 3. Check total active/delinquent stake
prism validators --url <RPC_URL>

# 4. Check if this is a known software bug
# Review recent GitHub issues, Discord, and release notes

# 5. Gather diagnostic data from bootstrap/trusted validators
prism-validator --ledger /var/prism/ledger wait-for-restart-window \
  --min-idle-time 1 --skip-new-snapshot-check
```

### Resolution

**Option A: Wait for natural recovery**

If > 66% of stake comes back online, the chain will resume automatically. This is the preferred approach.

```bash
# Monitor stake recovery
watch -n 10 'prism validators --url <RPC_URL> 2>/dev/null | tail -5'
```

**Option B: Coordinated restart (if natural recovery fails)**

This requires coordination among validators holding > 66% of stake.

```bash
# 1. All participating validators stop
sudo systemctl stop prism-validator

# 2. Core team generates a restart snapshot
prism-ledger-tool create-snapshot \
  --ledger /var/prism/ledger \
  --snapshot-slot <LAST_CONFIRMED_SLOT> \
  --output-dir /var/prism/restart-snapshot

# 3. Distribute the restart snapshot to all validators

# 4. All validators restart with --wait-for-supermajority
prism-validator \
  --wait-for-supermajority <RESTART_SLOT> \
  --expected-bank-hash <BANK_HASH> \
  --expected-genesis-hash <GENESIS_HASH> \
  [... other flags ...]

# 5. Once >66% stake is waiting, the chain resumes automatically
```

**Option C: Emergency patch and restart (software bug)**

```bash
# 1. Identify the bug and prepare a patch
# 2. Build patched binary
# 3. Follow Option B procedure with the patched binary
# 4. Coordinate deployment via the emergency release process (see upgrade.md)
```

### Communication

During a chain halt:
- Post to #incidents, #validator-announcements, and Twitter/X every 15 minutes
- Include: time of halt, suspected cause, estimated recovery time
- Provide specific instructions for validators (restart with X flag, upgrade to version Y)

### Escalation

- Chain halts are already SEV-1; there is no higher severity
- If the halt persists > 1 hour, engage all core engineering resources
- If the halt persists > 4 hours, consider public communication and ecosystem coordination

---

## 4. Key Compromise

**Severity**: SEV-1 (Critical)

### Symptoms

- Unauthorized transactions from a validator identity account
- Unexpected vote account authority changes
- Unauthorized stake withdrawals
- Alerts from monitoring for unexpected on-chain activity

### Immediate Actions (First 15 Minutes)

```bash
# === FOR COMPROMISED VALIDATOR IDENTITY ===

# 1. IMMEDIATELY stop the validator to prevent further signing
sudo systemctl stop prism-validator

# 2. Rotate the identity keypair
prism-keygen new --outfile /secure/new-identity.json --no-passphrase

# 3. Set the new identity (requires authorized withdrawer)
# This must be done from a SECURE machine with the withdrawer key
prism vote-update-validator \
  <VOTE_PUBKEY> \
  /secure/new-identity.json \
  /secure/withdrawer.json \
  --url <RPC_URL>

# 4. Restart the validator with the new identity
# Update the identity path in the startup script and restart

# === FOR COMPROMISED VOTE ACCOUNT ===

# 1. If the authorized withdrawer is NOT compromised:
prism vote-authorize-withdrawer \
  <VOTE_PUBKEY> \
  /secure/current-withdrawer.json \
  <NEW_WITHDRAWER_PUBKEY>

# 2. Create a new vote account
prism-keygen new --outfile /secure/new-vote.json
prism create-vote-account \
  /secure/new-vote.json \
  /secure/identity.json \
  <NEW_WITHDRAWER_PUBKEY> \
  --url <RPC_URL>

# === FOR COMPROMISED AUTHORIZED WITHDRAWER ===

# This is the worst case. The withdrawer can:
# - Withdraw all vote account funds
# - Change all authorities on the vote account
# Act as fast as possible.

# 1. From ANY machine with the current withdrawer key:
prism vote-authorize-withdrawer \
  <VOTE_PUBKEY> \
  /secure/compromised-withdrawer.json \
  <NEW_SAFE_WITHDRAWER_PUBKEY>

# 2. Move all funds out of the vote account immediately
prism withdraw-from-vote-account \
  <VOTE_PUBKEY> \
  <SAFE_DESTINATION> \
  ALL \
  --authorized-withdrawer /secure/compromised-withdrawer.json
```

### Investigation

```bash
# 1. Gather all transactions involving the compromised key
prism transaction-history <COMPROMISED_PUBKEY> --url <RPC_URL> --limit 100

# 2. Check for unauthorized authority changes
prism vote-account <VOTE_PUBKEY> --url <RPC_URL>
prism stake-account <STAKE_PUBKEY> --url <RPC_URL>

# 3. Review server access logs
journalctl --since "48 hours ago" | grep -i "ssh\|login\|auth"
last -20
cat /var/log/auth.log | tail -100

# 4. Check for unauthorized file access
find /home/prism/keys -newer /home/prism/keys/identity.json -ls

# 5. Review running processes for suspicious activity
ps auxf
netstat -tlnp
```

### Post-Compromise Actions

- [ ] Rotate ALL keypairs (identity, vote, withdrawer, stake authority)
- [ ] Rotate SSH keys and revoke old ones
- [ ] Audit server for backdoors or malware
- [ ] Consider rebuilding the server from scratch
- [ ] Report the incident to security@prism.io
- [ ] If fund loss occurred, coordinate with the Foundation
- [ ] Document the incident timeline and root cause

---

## 5. Network Partition

**Severity**: SEV-2

### Symptoms

- Gossip node count drops significantly
- Validators in different data centers cannot see each other
- Transaction confirmations differ across RPC endpoints
- Turbine retransmit errors in logs

### Diagnosis

```bash
# 1. Check gossip from multiple vantage points
prism gossip --url http://<VALIDATOR_A>:8899 | wc -l
prism gossip --url http://<VALIDATOR_B>:8899 | wc -l

# 2. Test network connectivity between validators
# From validator A:
nc -zv <VALIDATOR_B_IP> 8001   # Gossip TCP
nc -zuv <VALIDATOR_B_IP> 8001  # Gossip UDP

# 3. Check for ISP/cloud provider issues
mtr -r <VALIDATOR_B_IP>
traceroute <VALIDATOR_B_IP>

# 4. Check if a cloud provider region is isolated
# Group validators by provider/region and check connectivity
```

### Resolution

- If ISP/cloud provider issue: contact the provider and wait for resolution
- If firewall misconfiguration: correct the rules (see validator-requirements.md)
- If gossip protocol bug: escalate to core engineering

---

## 6. Memory Exhaustion

**Severity**: SEV-3

### Symptoms

- OOM killer terminating the validator process
- System swap usage increasing
- Validator restart loop
- dmesg shows out-of-memory messages

### Diagnosis

```bash
# 1. Check current memory usage
free -h
cat /proc/meminfo | grep -E "MemTotal|MemAvailable|SwapTotal|SwapFree"

# 2. Check if OOM killer fired
dmesg | grep -i "out of memory\|oom"
journalctl -k --since "1 hour ago" | grep -i oom

# 3. Check validator memory usage
ps aux --sort=-%mem | head -10

# 4. Check accounts DB size
du -sh /var/prism/accounts/
du -sh /var/prism/ledger/

# 5. Check for memory leaks (rising RSS over time)
# Use monitoring graphs if available
```

### Resolution

```bash
# 1. Restart the validator (may be sufficient if transient)
sudo systemctl restart prism-validator

# 2. If accounts DB is too large, reduce with --limit-ledger-size
# Edit start-validator.sh to add/adjust --limit-ledger-size

# 3. If memory is fundamentally insufficient, upgrade the server
# See validator-requirements.md for minimum specs

# 4. Disable swap to prevent slow death (OOM kill is preferable)
sudo swapoff -a
```

---

## Post-Incident Process

After every SEV-1 or SEV-2 incident:

1. **Timeline**: Document a detailed timeline within 24 hours
2. **Root cause**: Identify the root cause, not just the symptoms
3. **Impact**: Quantify the impact (downtime, transactions affected, funds at risk)
4. **Action items**: Create specific, assigned, deadlined follow-up tasks
5. **Review meeting**: Hold a blameless post-incident review within 48 hours
6. **Report**: Publish an internal incident report; publish a public report for SEV-1 within 7 days

### Incident Report Template

```
## Incident Report: [TITLE]

**Date**: YYYY-MM-DD
**Duration**: X hours Y minutes
**Severity**: SEV-N
**Incident Commander**: [Name]

### Summary
[1-2 sentence summary]

### Timeline (UTC)
- HH:MM — [Event]
- HH:MM — [Event]

### Root Cause
[Description]

### Impact
[Quantified impact]

### Resolution
[What was done to resolve]

### Action Items
- [ ] [Action] — Owner — Due date
- [ ] [Action] — Owner — Due date

### Lessons Learned
[What we learned and what we will change]
```

---

## Contact Directory

| Role | Contact | Escalation |
|---|---|---|
| On-call engineer | PagerDuty rotation | Auto-escalates after 15 min |
| Core engineering lead | [Name] — Slack / Phone | SEV-1 and SEV-2 |
| Security team | security@prism.io | Key compromise, exploits |
| Foundation | foundation@prism.io | Chain halt, governance |
| Validator relations | validators@prism.io | Validator coordination |
| Communications | comms@prism.io | Public statements |

### Communication Channels

| Channel | Purpose |
|---|---|
| #incidents (Slack) | Real-time incident coordination |
| #validator-announcements (Discord) | Validator operator notifications |
| @prism (Twitter/X) | Public status updates |
| status.prism.io | Status page updates |
