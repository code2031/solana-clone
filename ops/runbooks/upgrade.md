# Validator Upgrade Runbook

This document describes the staged rollout process for upgrading SolClone validators, including feature gates, version compatibility, and rollback procedures.

---

## Table of Contents

1. [Upgrade Philosophy](#upgrade-philosophy)
2. [Version Compatibility Matrix](#version-compatibility-matrix)
3. [Pre-Upgrade Checklist](#pre-upgrade-checklist)
4. [Staged Rollout Process](#staged-rollout-process)
5. [Feature Gates](#feature-gates)
6. [Upgrade Procedures](#upgrade-procedures)
7. [Rollback Procedure](#rollback-procedure)
8. [Emergency Upgrades](#emergency-upgrades)

---

## Upgrade Philosophy

SolClone follows a conservative upgrade strategy to maintain network stability:

1. **No surprise breaking changes.** All breaking changes are gated behind feature flags that activate at a future epoch.
2. **Staged rollout.** Upgrades propagate from devnet to testnet to mainnet with soak time at each stage.
3. **Backward compatibility.** New validator versions must be backward-compatible with the prior version during the transition window.
4. **Operator autonomy.** Validators choose when to upgrade within the compatibility window. Forced upgrades only occur for critical security patches.

---

## Version Compatibility Matrix

| Component | Minimum Supported | Recommended | End of Support |
|---|---|---|---|
| Validator software | N-2 minor versions | Latest stable | 3 months after N-2 |
| RPC API | Stable since v1.0 | Latest | Deprecated methods removed with 6-month notice |
| Gossip protocol | v1.0+ | Latest | N-1 supported |
| Snapshot format | v1.0+ | Latest | N-1 supported |

### Compatibility Rules

- Validators running version N can communicate with validators running version N-1 and N-2.
- Feature gates activated on-chain require the minimum validator version that supports them.
- Once a feature gate activates, validators on older versions that do not support it will fork off the network.

---

## Pre-Upgrade Checklist

Before beginning any upgrade:

- [ ] Read the full release notes for the target version
- [ ] Review breaking changes and new feature gates
- [ ] Verify the release is signed by the SolClone release key
- [ ] Check that the version has been running on devnet for at least 7 days
- [ ] Check that the version has been running on testnet for at least 7 days (mainnet upgrades)
- [ ] Confirm disk space: at least 200 GB free for the build and snapshot
- [ ] Confirm no active incidents or upcoming maintenance windows
- [ ] Notify the team and update the maintenance calendar
- [ ] Verify backup of identity and vote keypairs
- [ ] Take a pre-upgrade snapshot of the ledger

---

## Staged Rollout Process

### Stage 1: Devnet (Days 1-7)

| Step | Action | Verification |
|---|---|---|
| 1 | Build new version from source | Binary compiles without errors |
| 2 | Deploy to devnet canary validator | Validator starts and catches up |
| 3 | Run for 48 hours | No errors, normal skip rate |
| 4 | Deploy to all devnet validators | Cluster remains healthy |
| 5 | Soak for 5 additional days | Performance metrics normal |

**Gate criteria for testnet**: No regressions, all integration tests pass, 7-day soak complete.

### Stage 2: Testnet (Days 8-21)

| Step | Action | Verification |
|---|---|---|
| 1 | Deploy to 10% of testnet stake | No consensus issues |
| 2 | Expand to 33% of testnet stake | Skip rates normal |
| 3 | Expand to 66% of testnet stake | No performance regressions |
| 4 | Expand to 100% of testnet stake | Full cluster on new version |
| 5 | Soak for 7 days at 100% | All metrics stable |

**Gate criteria for mainnet**: 14-day testnet soak, no incidents, foundation approval.

### Stage 3: Mainnet (Days 22+)

| Step | Action | Verification |
|---|---|---|
| 1 | Foundation validators upgrade (10% of stake) | 48-hour soak |
| 2 | Announce upgrade window to all validators | Post in #validator-announcements |
| 3 | Early adopter validators upgrade (33% of stake) | 48-hour soak |
| 4 | Majority of validators upgrade (66%+ of stake) | Consensus healthy |
| 5 | Remaining validators upgrade | Monitor for stragglers |
| 6 | End-of-support deadline for old version | Communicate 30 days in advance |

### Rollout Timeline Summary

```
Day  1-7   : Devnet
Day  8-21  : Testnet
Day 22-24  : Mainnet canary (Foundation validators, 10% stake)
Day 24-26  : Mainnet early adopters (33% stake)
Day 26-30  : Mainnet majority (66%+ stake)
Day 30-60  : Remaining validators upgrade
Day 60+    : Old version end of support
```

---

## Feature Gates

Feature gates allow new protocol behavior to be deployed in the binary but activated on-chain at a specific epoch. This decouples the binary upgrade from the behavior change.

### How Feature Gates Work

1. A feature is implemented behind a feature gate (runtime check).
2. The feature gate has a unique public key identifier.
3. A feature activation transaction is submitted, targeting a future epoch.
4. When the epoch arrives, validators that support the feature activate it.
5. Validators that do not support the feature will produce incorrect blocks and fork off.

### Feature Gate Lifecycle

```
Proposed -> Pending Activation -> Active -> (permanent)
                                    |
                             (cannot be deactivated)
```

### Managing Feature Gates

```bash
# List all feature gates and their status
solclone feature status --url <RPC_URL>

# Check a specific feature
solclone feature status <FEATURE_PUBKEY> --url <RPC_URL>

# Activate a feature (requires authority — usually foundation multisig)
solclone feature activate <FEATURE_PUBKEY> \
  --keypair /secure/feature-authority.json \
  --url <RPC_URL>

# Check which features your validator version supports
solclone-validator --version
# Cross-reference with the release notes
```

### Feature Gate Coordination

For mainnet feature activations:

1. Announce the activation at least 14 days in advance.
2. Specify the minimum validator version required.
3. Monitor the percentage of stake running compatible versions.
4. Only activate when > 95% of stake is on a compatible version.
5. Monitor the activation epoch closely for consensus issues.

---

## Upgrade Procedures

### Standard Upgrade (In-Place)

This is the normal procedure for minor version upgrades.

```bash
# 1. Build the new version
cd ~/solclone-src
git fetch --tags
git checkout v<NEW_VERSION>
cargo build --release

# 2. Verify the build
./target/release/solclone-validator --version
# Should show the new version

# 3. Wait for a restart window
# The validator will find a window where it is not the leader
solclone-validator --ledger /var/solclone/ledger wait-for-restart-window \
  --min-idle-time 2 --skip-new-snapshot-check

# 4. Stop the validator
sudo systemctl stop solclone-validator

# 5. Install new binaries
cp target/release/solclone ~/bin/solclone
cp target/release/solclone-validator ~/bin/solclone-validator
cp target/release/solclone-keygen ~/bin/solclone-keygen

# 6. Start the validator
sudo systemctl start solclone-validator

# 7. Verify the upgrade
solclone-validator --version
journalctl -u solclone-validator -f  # Watch startup logs

# 8. Verify catchup
solclone catchup <IDENTITY_PUBKEY> --url http://127.0.0.1:8899
```

### Zero-Downtime Upgrade (Hot Swap)

For high-availability setups with a standby validator.

```bash
# 1. Build new version on the standby server
# (same as steps 1-2 above)

# 2. Copy the tower file from the active validator
scp active-validator:/var/solclone/ledger/tower-*.bin /var/solclone/ledger/

# 3. Start the standby with --no-voting initially
solclone-validator --no-voting [... flags ...] &

# 4. Wait for the standby to catch up
solclone catchup <STANDBY_IDENTITY> --url http://127.0.0.1:8899

# 5. Switch: stop active, enable voting on standby
# On active:
sudo systemctl stop solclone-validator

# On standby: restart with voting enabled
# (update start script to remove --no-voting, then restart)
sudo systemctl restart solclone-validator

# 6. Upgrade the original server and make it the new standby
```

### Major Version Upgrade

Major versions may include ledger format changes or require a fresh snapshot.

```bash
# 1. Build the new version (same as above)

# 2. Stop the validator
sudo systemctl stop solclone-validator

# 3. Back up the current ledger
cp -r /var/solclone/ledger /var/solclone/ledger-backup-$(date +%Y%m%d)

# 4. If ledger format changed, download a fresh snapshot
# Check release notes for instructions

# 5. Install new binaries and start
cp target/release/* ~/bin/
sudo systemctl start solclone-validator

# 6. Monitor closely for 24 hours
```

---

## Rollback Procedure

If an upgrade causes issues, roll back to the previous version.

### Quick Rollback

```bash
# 1. Stop the validator
sudo systemctl stop solclone-validator

# 2. Restore old binaries
# (assumes you kept the old build or have pre-built binaries)
cp ~/bin-backup/solclone ~/bin/solclone
cp ~/bin-backup/solclone-validator ~/bin/solclone-validator
cp ~/bin-backup/solclone-keygen ~/bin/solclone-keygen

# 3. Start the validator
sudo systemctl start solclone-validator

# 4. Verify the rollback
solclone-validator --version
solclone catchup <IDENTITY_PUBKEY> --url http://127.0.0.1:8899
```

### Rollback with Ledger Reset

If the new version corrupted the ledger:

```bash
# 1. Stop the validator
sudo systemctl stop solclone-validator

# 2. Restore old binaries (as above)

# 3. Remove the corrupted ledger
rm -rf /var/solclone/ledger/rocksdb

# 4. If you have a backup:
cp -r /var/solclone/ledger-backup-YYYYMMDD/* /var/solclone/ledger/

# 5. If no backup, the validator will download a snapshot on start
sudo systemctl start solclone-validator
```

### Rollback Limitations

- **Feature gates cannot be rolled back.** Once a feature gate activates on-chain, rolling back the binary version will cause the validator to fork off if it does not support the feature.
- If a feature gate was activated and is causing issues, the only fix is a new version that handles the feature correctly.

---

## Emergency Upgrades

Emergency upgrades bypass the normal staged rollout for critical security patches.

### Process

1. **Core team identifies the vulnerability** and prepares a patch.
2. **Embargoed build**: The patch is built and tested internally. A signed binary is prepared.
3. **Trusted validator notification**: Foundation and trusted validators are notified via encrypted channels. They receive the binary and upgrade immediately.
4. **Public announcement**: Once >33% of stake has upgraded, the patch is publicly announced with instructions.
5. **Deadline**: Validators must upgrade within 24 hours (critical) or 72 hours (high severity).

### Emergency Upgrade Commands

```bash
# 1. Download the emergency release (signed)
wget https://releases.solclone.io/emergency/v<VERSION>/solclone-release.tar.gz
wget https://releases.solclone.io/emergency/v<VERSION>/solclone-release.tar.gz.sig

# 2. Verify the signature
gpg --verify solclone-release.tar.gz.sig solclone-release.tar.gz

# 3. Extract and install
tar -xzf solclone-release.tar.gz -C ~/bin/

# 4. Restart the validator
sudo systemctl restart solclone-validator

# 5. Confirm the version
solclone-validator --version
```

### Communication During Emergency Upgrades

| Time | Action |
|---|---|
| T+0 | Notify trusted validators via encrypted channel |
| T+2h | Notify all validators via Discord and email |
| T+4h | Public announcement (Twitter, blog) |
| T+24h | Deadline for critical patches |
| T+72h | Deadline for high-severity patches |
| T+7d | End of support for unpatched versions |
