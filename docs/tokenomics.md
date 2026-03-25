# Prism Tokenomics

## Overview

**Token Name:** Prism
**Token Symbol:** PRISM
**Decimals:** 9
**Total Initial Supply:** 500,000,000 PRISM
**Network:** Prism Layer 1

---

## Token Distribution

| Allocation       | Percentage | Tokens          | Purpose                                      |
|------------------|------------|-----------------|----------------------------------------------|
| Validators       | 40%        | 200,000,000     | Staking rewards, network security             |
| Ecosystem        | 30%        | 150,000,000     | Grants, partnerships, liquidity incentives     |
| Foundation       | 20%        | 100,000,000     | Core development, operations, treasury         |
| Community        | 10%        |  50,000,000     | Airdrops, bug bounties, governance rewards     |

```
Token Distribution (500M PRISM)
================================================

Validators  [########################################] 40%  200M
Ecosystem   [##############################          ] 30%  150M
Foundation  [####################                    ] 20%  100M
Community   [##########                              ] 10%   50M

================================================
```

---

## Vesting Schedules

### Foundation (100M PRISM) -- 4-Year Linear Vest

- **Cliff:** 12 months (no tokens released)
- **Vesting:** Linear monthly release over months 13-48
- **Monthly Release:** ~2,777,778 PRISM per month after cliff

```
Foundation Vesting Schedule (100M PRISM)

Tokens Released (M)
100 |                                                    ____---
 80 |                                          ____---""
 60 |                                ____---""
 40 |                      ____---""
 20 |            ____---""
  0 |___________/
    +----+----+----+----+----+
    0   12   24   36   48   (months)
         ^
       Cliff
```

| Period       | Monthly Release | Cumulative Released |
|--------------|-----------------|---------------------|
| Month 0-12   | 0               | 0                   |
| Month 13     | 2,777,778       | 2,777,778           |
| Month 24     | 2,777,778       | 33,333,336          |
| Month 36     | 2,777,778       | 66,666,672          |
| Month 48     | 2,777,778       | 100,000,000         |

### Ecosystem (150M PRISM) -- Milestone-Based Release

Tokens are released upon reaching ecosystem growth milestones, verified by on-chain governance vote.

| Milestone                          | Release       | Tokens       |
|------------------------------------|---------------|--------------|
| Mainnet launch                     | Immediate     | 15,000,000   |
| 1,000 active validators            | Milestone 1   | 22,500,000   |
| 10,000 unique programs deployed    | Milestone 2   | 30,000,000   |
| 100,000 daily active addresses     | Milestone 3   | 30,000,000   |
| 1M daily transactions              | Milestone 4   | 22,500,000   |
| Cross-chain bridge live            | Milestone 5   | 15,000,000   |
| Governance-approved proposals      | Ongoing       | 15,000,000   |

### Validators (200M PRISM)

Released as staking rewards over time, governed by the inflation schedule below. No cliff or lockup -- rewards are distributed per epoch.

### Community (50M PRISM)

- **Airdrops (20M):** Distributed over 4 quarterly events during Year 1
- **Bug Bounties (15M):** Released on verified submission
- **Governance Rewards (15M):** Distributed to active voters per epoch

---

## Inflation Model

Prism uses a disinflationary model where the inflation rate decreases annually.

**Parameters:**

| Parameter              | Value  |
|------------------------|--------|
| Initial Inflation Rate | 8.0%   |
| Annual Reduction       | 15%    |
| Long-Term Floor        | 1.5%   |

**Formula:**

```
inflation_rate(year) = max(initial_rate * (1 - reduction_rate)^year, floor_rate)
inflation_rate(year) = max(0.08 * (0.85)^year, 0.015)
```

**Projected Inflation Schedule:**

```
Inflation Rate Over Time

Rate %
8.0 |*
7.0 |  *
6.0 |    *
5.0 |      *
4.0 |        *
3.5 |          *
3.0 |            *
2.5 |              *
2.0 |                *  *
1.5 |                      *---*---*---*---*--- (floor)
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    0  1  2  3  4  5  6  7  8  9  10 11 12 13 14  Year
```

| Year | Inflation Rate | New Tokens Minted | Total Supply (approx) |
|------|----------------|-------------------|-----------------------|
| 0    | 8.000%         | 40,000,000        | 540,000,000           |
| 1    | 6.800%         | 36,720,000        | 576,720,000           |
| 2    | 5.780%         | 33,342,696        | 610,062,696           |
| 3    | 4.913%         | 29,962,381        | 640,025,077           |
| 4    | 4.176%         | 26,724,247        | 666,749,324           |
| 5    | 3.550%         | 23,669,601        | 690,418,925           |
| 6    | 3.017%         | 20,830,439        | 711,249,364           |
| 7    | 2.565%         | 18,233,545        | 729,482,909           |
| 8    | 2.180%         | 15,902,648        | 745,385,557           |
| 9    | 1.853%         | 13,808,997        | 759,194,554           |
| 10   | 1.575%         | 11,957,364        | 771,151,918           |
| 11+  | 1.500%         | Floor reached     | Grows at 1.5%/yr      |

---

## Staking Rewards

### Reward Formula

Validator rewards are calculated per epoch:

```
reward = inflation_tokens_per_epoch * (validator_stake / total_staked) * (1 - commission)
```

Where:
- `inflation_tokens_per_epoch` = annual inflation tokens / epochs per year
- `validator_stake` = total PRISM delegated to the validator
- `total_staked` = total PRISM staked across all validators
- `commission` = validator's commission rate (0.0 to 1.0)

### Example Calculation

Given:
- Annual inflation tokens: 40,000,000 PRISM (Year 0)
- Epochs per year: 730 (1 epoch ~ 12 hours)
- Validator stake: 1,000,000 PRISM
- Total staked: 300,000,000 PRISM
- Commission: 10% (0.10)

```
tokens_per_epoch = 40,000,000 / 730 = 54,794.52 PRISM
reward = 54,794.52 * (1,000,000 / 300,000,000) * (1 - 0.10)
reward = 54,794.52 * 0.003333 * 0.90
reward = 164.38 PRISM per epoch (for delegators)
validator_commission = 54,794.52 * 0.003333 * 0.10 = 18.26 PRISM per epoch
```

### Staking APY Estimates

| Total Staked (% of supply) | Effective APY (0% commission) | Effective APY (10% commission) |
|----------------------------|-------------------------------|--------------------------------|
| 50%                        | 16.00%                        | 14.40%                         |
| 60%                        | 13.33%                        | 12.00%                         |
| 70%                        | 11.43%                        | 10.29%                         |
| 80%                        | 10.00%                        | 9.00%                          |
| 90%                        | 8.89%                         | 8.00%                          |

---

## Transaction Fees

### Fee Structure

Every transaction on Prism incurs a base fee calculated from the computational resources consumed.

| Component               | Description                                      |
|--------------------------|--------------------------------------------------|
| Base Fee                 | 5,000 lamports (0.000005 PRISM) per signature   |
| Priority Fee (optional)  | Additional lamports per compute unit              |
| Compute Budget           | Max 200,000 compute units per instruction         |

### Fee Distribution

```
Transaction Fee Split

100% of Fee
    |
    +-- 50% --> BURNED (permanently removed from supply)
    |
    +-- 50% --> Block Producer (current validator leader)
```

| Destination      | Percentage | Effect                        |
|------------------|------------|-------------------------------|
| Burn             | 50%        | Deflationary, reduces supply   |
| Block Producer   | 50%        | Validator incentive            |

---

## Rent Economics

Accounts on Prism must maintain a minimum balance to remain active, covering storage costs.

### Rent Calculation

```
rent_per_byte_per_year = 3.48 PRISM per MB per year
rent_per_epoch = rent_per_byte_per_year / epochs_per_year * account_size_bytes
```

### Rent Exemption

Accounts can become **rent-exempt** by holding a minimum balance:

```
minimum_balance = rent_per_byte_per_year * account_size_bytes * 2 years
```

| Account Size | Rent-Exempt Minimum       |
|--------------|---------------------------|
| 0 bytes      | 0.00089088 PRISM         |
| 128 bytes    | 0.00144768 PRISM         |
| 256 bytes    | 0.00200448 PRISM         |
| 1 KB         | 0.00713088 PRISM         |
| 10 KB        | 0.06729408 PRISM         |
| 1 MB         | 6.96096000 PRISM         |

Accounts falling below the rent-exempt threshold are charged rent each epoch. Accounts reaching zero balance are purged from the ledger.

---

## Deflationary Pressure

Prism is designed with built-in deflationary mechanisms that counterbalance inflation over time.

### Sources of Deflation

1. **Transaction Fee Burns (50% of all fees)**
2. **Failed Transaction Fee Burns (100% -- fees are not refunded)**
3. **Rent Collection from Non-Exempt Accounts**
4. **Account Closure (remaining lamports returned, account data purged)**

### Projected Net Inflation

As network activity grows, fee burns increase, reducing effective inflation:

```
Net Inflation Over Time (projected)

Rate %
8.0 |*  Gross Inflation
7.0 |  *
6.0 |    *                   * Net Inflation (low activity)
5.0 |  .   *
4.0 | .      *             .
3.0 |.          *        .     * Net Inflation (high activity)
2.0 |              *   .
1.5 |--- --- --- --- ---*--- --- --- (inflation floor)
1.0 |                .          *
0.5 |             .                *
0.0 |          .                      *  (net deflationary possible)
    +--+--+--+--+--+--+--+--+--+--+--+
    0  1  2  3  4  5  6  7  8  9  10   Year
```

| Scenario            | Daily Txns   | Annual Fees Burned | Net Year 0 Inflation |
|---------------------|--------------|--------------------|-----------------------|
| Low Activity        | 100K         | ~91,250 PRISM     | ~7.98%                |
| Medium Activity     | 10M          | ~9,125,000 PRISM  | ~6.18%                |
| High Activity       | 100M         | ~91,250,000 PRISM | Net deflationary      |

---

## Governance

PRISM holders can participate in governance:

- **1 PRISM = 1 vote** (staked tokens retain voting rights)
- **Proposal threshold:** 1,000,000 PRISM to submit a proposal
- **Quorum:** 10% of circulating supply must vote
- **Voting period:** 3 epochs (~36 hours)
- **Timelock:** 2 epochs (~24 hours) after approval before execution

Governable parameters include inflation rate adjustments, fee split ratios, rent costs, and validator requirements.

---

## Summary

| Parameter                | Value                              |
|--------------------------|------------------------------------|
| Token Symbol             | PRISM                             |
| Decimals                 | 9                                  |
| Initial Supply           | 500,000,000                        |
| Initial Inflation        | 8%                                 |
| Inflation Floor          | 1.5%                               |
| Annual Inflation Decay   | 15%                                |
| Fee Burn Rate            | 50%                                |
| Epoch Duration           | ~12 hours                          |
| Base Tx Fee              | 5,000 lamports (0.000005 PRISM)   |
| Rent Exemption           | 2 years of rent as minimum balance |
