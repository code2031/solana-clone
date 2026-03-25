# SolClone Staking Pool Template

A DeFi staking pool program built with the Anchor framework for the SolClone blockchain. Users stake tokens and earn rewards over time based on a configurable reward rate.

## Features

- **initialize_pool** - Create a staking pool with reward rate and optional lock duration
- **stake** - Deposit tokens into the pool to start earning rewards
- **unstake** - Withdraw staked tokens and claim accumulated rewards
- **distribute_rewards** - Update the accumulated reward per share (called by authority)

## Usage

```bash
# Initialize from template
solclone init my-staking --template staking

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy
```

## How Rewards Work

1. The pool authority sets a `reward_rate` (tokens per second)
2. `distribute_rewards` is called periodically to update the accumulated reward per share
3. Each staker's pending rewards = (staked_amount * accumulated_reward_per_share) - reward_debt
4. Rewards are minted from the reward token when unstaking

## Account Structure

- `StakingPool` - Pool configuration, total staked, reward tracking
  - PDA seeds: `["staking-pool", authority, staking_mint]`
- `StakeAccount` - Per-user staking position and reward debt
  - PDA seeds: `["stake", pool_key, user_key]`
- `pool_vault` - PDA-controlled token account holding staked tokens
- `reward_vault` - PDA-controlled token account for reward distribution

## Error Handling

| Error | Description |
|-------|-------------|
| `InvalidAmount` | Stake/unstake amount must be > 0 |
| `InvalidRewardRate` | Reward rate must be > 0 |
| `PoolInactive` | Pool has been deactivated |
| `InsufficientStake` | Cannot unstake more than staked |
| `StakeLocked` | Lock duration has not elapsed |
| `Unauthorized` | Signer is not authorized |
