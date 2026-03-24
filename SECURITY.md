# Security Policy

The SolClone team takes security seriously. We appreciate the security research community's efforts in helping us maintain a secure network. This document outlines our security policy, responsible disclosure process, and bug bounty program.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in the SolClone protocol, validator software, or related infrastructure, please report it through our responsible disclosure process.

### Contact

- **Email**: security@solclone.io
- **PGP Key**: Available at [https://solclone.io/.well-known/security-pgp.asc](https://solclone.io/.well-known/security-pgp.asc)
- **PGP Fingerprint**: `XXXX XXXX XXXX XXXX XXXX  XXXX XXXX XXXX XXXX XXXX`

Please encrypt sensitive reports with our PGP key.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)
- Your contact information for follow-up

### Response Timeline

| Stage | Timeframe |
|---|---|
| **Acknowledgment** | Within 24 hours |
| **Initial assessment** | Within 72 hours |
| **Status update** | Within 7 days |
| **Fix deployed** | Depends on severity (see below) |
| **Public disclosure** | After fix is deployed and validators upgraded, minimum 30 days |

---

## Scope

### In Scope

The following components are eligible for the bug bounty program:

- **Consensus protocol**: Tower BFT, PoH, fork choice, block production
- **Validator software**: `solclone-validator`, `solclone`, `solclone-keygen`, `solclone-genesis`
- **Runtime**: Transaction processing, program execution, SBF/BPF VM
- **Networking**: Gossip protocol, Turbine (block propagation), Repair protocol
- **Cryptography**: Signature verification, hash functions, key derivation
- **RPC API**: JSON-RPC endpoint, WebSocket subscriptions
- **Token program**: SPL Token, associated token accounts
- **Stake program**: Stake delegation, rewards distribution, slashing
- **Vote program**: Vote account management, vote processing
- **System program**: Account creation, nonce management, program deployment
- **Smart contract infrastructure**: Program loader, upgradeable programs

### Out of Scope

The following are **not** eligible:

- Third-party applications built on SolClone (unless they expose a protocol-level flaw)
- Social engineering or phishing attacks
- Denial of service attacks that do not exploit a software vulnerability
- Issues in dependencies that are already publicly known (check CVE databases first)
- UI/UX issues in explorers or wallets (unless they lead to fund loss)
- Rate limiting or resource exhaustion on public RPC endpoints
- Issues requiring physical access to a validator server
- Issues in testnets or devnets that do not apply to mainnet

---

## Severity Levels

### Critical

**CVSS 9.0-10.0** | Fix target: 24-48 hours

Examples:
- Unauthorized token minting (inflation bug)
- Consensus failure leading to chain halt or fork
- Double-spend vulnerability
- Private key extraction from running validator
- Remote code execution on validators
- Unauthorized fund transfers

### High

**CVSS 7.0-8.9** | Fix target: 7 days

Examples:
- Denial of service affecting consensus (not just a single node)
- Vote manipulation leading to incorrect fork choice
- Memory corruption that could lead to exploitable conditions
- Bypass of transaction signature verification
- Unauthorized stake manipulation
- Rent bypass allowing free account storage

### Medium

**CVSS 4.0-6.9** | Fix target: 30 days

Examples:
- Information disclosure of validator operational data
- Denial of service affecting a single validator
- Transaction ordering manipulation for profit (MEV-related protocol flaws)
- Incorrect rewards calculation
- RPC endpoint vulnerabilities leaking internal state
- Snapshot integrity issues

### Low

**CVSS 0.1-3.9** | Fix target: 90 days

Examples:
- Minor information leakage in error messages
- Non-exploitable memory safety issues
- Cosmetic issues in CLI output that could confuse operators
- Minor deviations from protocol specification
- Performance degradation under specific conditions

---

## Bug Bounty Program

### Reward Tiers

| Severity | Reward Range |
|---|---|
| **Critical** | $50,000 - $500,000 |
| **High** | $10,000 - $50,000 |
| **Medium** | $2,000 - $10,000 |
| **Low** | $500 - $2,000 |

Rewards are determined based on:
- **Severity**: Impact on the network, users, and funds
- **Quality of report**: Clarity, reproducibility, and suggested fix
- **Novelty**: First report of this type of issue
- **Exploitability**: How easily could this be exploited in practice

Exceptional reports that identify novel attack classes or prevent catastrophic outcomes may receive bonuses above the listed ranges.

### Payment

- Rewards are paid in USDC or SOL (reporter's choice)
- Payment is processed within 30 days of fix deployment
- Reporters will be credited in the advisory (unless anonymity is requested)

### Rules

1. **Do not exploit the vulnerability** beyond the minimum necessary to demonstrate it.
2. **Do not access, modify, or destroy data** belonging to other users or validators.
3. **Do not disrupt** the network, validators, or services during testing.
4. **Do not publicly disclose** the vulnerability before the agreed-upon disclosure date.
5. **Test on devnet or local validators** whenever possible. Never test on mainnet without prior coordination.
6. **One report per vulnerability.** Duplicate reports receive no reward; the first valid report wins.
7. Researchers who violate these rules may be disqualified from the program.

### Legal Safe Harbor

SolClone will not pursue legal action against security researchers who:
- Act in good faith and follow this responsible disclosure policy
- Avoid privacy violations, data destruction, and service disruption
- Report vulnerabilities promptly and do not exploit them for profit
- Give reasonable time for fixes before any disclosure

---

## Security Advisories

Published security advisories are available at:

- GitHub: [https://github.com/solclone/solclone/security/advisories](https://github.com/solclone/solclone/security/advisories)
- Website: [https://solclone.io/security/advisories](https://solclone.io/security/advisories)

Subscribe to the security mailing list for notifications:
- Email `security-announce-subscribe@solclone.io` with subject "subscribe"

---

## Security Best Practices for Validators

1. **Keep your validator software up to date.** Apply security patches promptly.
2. **Never store the authorized withdrawer keypair on the validator server.**
3. **Use a dedicated, hardened server.** Do not run other services on the validator.
4. **Enable firewall rules.** Only open required ports.
5. **Monitor your validator.** Set up alerts for unusual behavior.
6. **Use SSH key authentication.** Disable password authentication.
7. **Enable automatic security updates** for the operating system.
8. **Rotate identity keypairs periodically** if you suspect compromise.

---

## Contact

- **Security reports**: security@solclone.io
- **General inquiries**: hello@solclone.io
- **Discord**: [https://discord.gg/solclone](https://discord.gg/solclone) (do not report vulnerabilities in Discord)

Thank you for helping keep SolClone secure.
