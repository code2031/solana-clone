use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, MintTo};

declare_id!("StakePool1111111111111111111111111111111111");

#[program]
pub mod prism_staking_pool {
    use super::*;

    /// Initialize a new staking pool with a reward rate.
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        reward_rate: u64,
        lock_duration: i64,
    ) -> Result<()> {
        require!(reward_rate > 0, StakingError::InvalidRewardRate);
        require!(lock_duration >= 0, StakingError::InvalidDuration);

        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.staking_mint = ctx.accounts.staking_mint.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.pool_vault = ctx.accounts.pool_vault.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.reward_rate = reward_rate;
        pool.lock_duration = lock_duration;
        pool.total_staked = 0;
        pool.total_stakers = 0;
        pool.last_reward_timestamp = Clock::get()?.unix_timestamp;
        pool.accumulated_reward_per_share = 0;
        pool.is_active = true;
        pool.bump = ctx.bumps.pool;

        msg!(
            "Staking pool initialized: reward_rate={}, lock_duration={}s",
            reward_rate,
            lock_duration
        );
        Ok(())
    }

    /// Stake tokens into the pool.
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);
        let pool = &ctx.accounts.pool;
        require!(pool.is_active, StakingError::PoolInactive);

        // Transfer tokens from user to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

        // Update stake account
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        if stake_account.staked_amount == 0 {
            // New staker
            stake_account.owner = ctx.accounts.user.key();
            stake_account.pool = ctx.accounts.pool.key();
            stake_account.staked_at = clock.unix_timestamp;
            stake_account.reward_debt = 0;
            stake_account.bump = ctx.bumps.stake_account;

            let pool_mut = &mut ctx.accounts.pool;
            pool_mut.total_stakers = pool_mut
                .total_stakers
                .checked_add(1)
                .ok_or(StakingError::Overflow)?;
        } else {
            // Calculate pending rewards before updating stake
            let pending = calculate_pending_rewards(
                stake_account.staked_amount,
                ctx.accounts.pool.accumulated_reward_per_share,
                stake_account.reward_debt,
            )?;
            stake_account.pending_rewards = stake_account
                .pending_rewards
                .checked_add(pending)
                .ok_or(StakingError::Overflow)?;
        }

        stake_account.staked_amount = stake_account
            .staked_amount
            .checked_add(amount)
            .ok_or(StakingError::Overflow)?;
        stake_account.last_stake_timestamp = clock.unix_timestamp;

        // Update pool
        let pool_mut = &mut ctx.accounts.pool;
        pool_mut.total_staked = pool_mut
            .total_staked
            .checked_add(amount)
            .ok_or(StakingError::Overflow)?;

        // Update reward debt
        let stake_acct = &mut ctx.accounts.stake_account;
        stake_acct.reward_debt = stake_acct
            .staked_amount
            .checked_mul(pool_mut.accumulated_reward_per_share)
            .ok_or(StakingError::Overflow)?;

        msg!("Staked {} tokens", amount);
        Ok(())
    }

    /// Unstake tokens and claim accumulated rewards.
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let stake_account = &ctx.accounts.stake_account;
        require!(amount > 0, StakingError::InvalidAmount);
        require!(
            amount <= stake_account.staked_amount,
            StakingError::InsufficientStake
        );

        // Check lock duration
        let clock = Clock::get()?;
        let pool = &ctx.accounts.pool;
        let time_staked = clock
            .unix_timestamp
            .checked_sub(stake_account.last_stake_timestamp)
            .ok_or(StakingError::Overflow)?;
        require!(
            time_staked >= pool.lock_duration,
            StakingError::StakeLocked
        );

        // Calculate pending rewards
        let pending = calculate_pending_rewards(
            stake_account.staked_amount,
            pool.accumulated_reward_per_share,
            stake_account.reward_debt,
        )?;
        let total_rewards = stake_account
            .pending_rewards
            .checked_add(pending)
            .ok_or(StakingError::Overflow)?;

        // Transfer staked tokens back to user
        let pool_key = pool.key();
        let seeds: &[&[u8]] = &[b"pool-vault", pool_key.as_ref(), &[pool.bump]];
        let signer_seeds = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool_vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, amount)?;

        // Mint reward tokens to user if rewards available
        if total_rewards > 0 {
            let cpi_mint = MintTo {
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.user_reward_account.to_account_info(),
                authority: ctx.accounts.pool_vault.to_account_info(),
            };
            let cpi_mint_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_mint,
                signer_seeds,
            );
            token::mint_to(cpi_mint_ctx, total_rewards)?;
        }

        // Update stake account
        let stake_acct = &mut ctx.accounts.stake_account;
        stake_acct.staked_amount = stake_acct
            .staked_amount
            .checked_sub(amount)
            .ok_or(StakingError::Overflow)?;
        stake_acct.pending_rewards = 0;

        // Update pool
        let pool_mut = &mut ctx.accounts.pool;
        pool_mut.total_staked = pool_mut
            .total_staked
            .checked_sub(amount)
            .ok_or(StakingError::Overflow)?;

        if stake_acct.staked_amount == 0 {
            pool_mut.total_stakers = pool_mut
                .total_stakers
                .checked_sub(1)
                .ok_or(StakingError::Overflow)?;
        }

        // Update reward debt
        stake_acct.reward_debt = stake_acct
            .staked_amount
            .checked_mul(pool_mut.accumulated_reward_per_share)
            .ok_or(StakingError::Overflow)?;

        msg!(
            "Unstaked {} tokens, claimed {} reward tokens",
            amount,
            total_rewards
        );
        Ok(())
    }

    /// Distribute rewards: update the accumulated reward per share.
    pub fn distribute_rewards(ctx: Context<DistributeRewards>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.is_active, StakingError::PoolInactive);
        require!(pool.total_staked > 0, StakingError::NoStakers);

        let clock = Clock::get()?;
        let elapsed = clock
            .unix_timestamp
            .checked_sub(pool.last_reward_timestamp)
            .ok_or(StakingError::Overflow)? as u64;

        if elapsed == 0 {
            return Ok(());
        }

        let reward = elapsed
            .checked_mul(pool.reward_rate)
            .ok_or(StakingError::Overflow)?;

        let reward_per_share_increase = reward
            .checked_mul(1_000_000_000) // precision factor
            .ok_or(StakingError::Overflow)?
            .checked_div(pool.total_staked)
            .ok_or(StakingError::Overflow)?;

        pool.accumulated_reward_per_share = pool
            .accumulated_reward_per_share
            .checked_add(reward_per_share_increase)
            .ok_or(StakingError::Overflow)?;

        pool.last_reward_timestamp = clock.unix_timestamp;

        msg!(
            "Rewards distributed: {} total, {} per share increase",
            reward,
            reward_per_share_increase
        );
        Ok(())
    }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

fn calculate_pending_rewards(
    staked_amount: u64,
    accumulated_reward_per_share: u64,
    reward_debt: u64,
) -> Result<u64> {
    let total = staked_amount
        .checked_mul(accumulated_reward_per_share)
        .ok_or(StakingError::Overflow)?;
    let pending = total
        .checked_sub(reward_debt)
        .ok_or(StakingError::Overflow)?
        .checked_div(1_000_000_000) // precision factor
        .ok_or(StakingError::Overflow)?;
    Ok(pending)
}

// ─── Account Structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::SPACE,
        seeds = [b"staking-pool", authority.key().as_ref(), staking_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, StakingPool>,
    #[account(
        init,
        payer = authority,
        token::mint = staking_mint,
        token::authority = pool_vault,
        seeds = [b"pool-vault", pool.key().as_ref()],
        bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = reward_mint,
        token::authority = pool_vault,
        seeds = [b"reward-vault", pool.key().as_ref()],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    /// CHECK: The staking token mint
    pub staking_mint: AccountInfo<'info>,
    /// CHECK: The reward token mint
    pub reward_mint: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        constraint = pool.is_active @ StakingError::PoolInactive
    )]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        constraint = pool_vault.key() == pool.pool_vault @ StakingError::InvalidVault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::SPACE,
        seeds = [b"stake", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        constraint = pool_vault.key() == pool.pool_vault @ StakingError::InvalidVault
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = owner @ StakingError::Unauthorized,
        seeds = [b"stake", pool.key().as_ref(), user.key().as_ref()],
        bump = stake_account.bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_reward_account: Account<'info, TokenAccount>,
    /// CHECK: The reward token mint
    #[account(mut)]
    pub reward_mint: AccountInfo<'info>,
    #[account(
        mut,
        constraint = user.key() == stake_account.owner @ StakingError::Unauthorized
    )]
    pub user: Signer<'info>,
    /// CHECK: Alias for constraint matching
    pub owner: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(
        mut,
        has_one = authority @ StakingError::Unauthorized
    )]
    pub pool: Account<'info, StakingPool>,
    pub authority: Signer<'info>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct StakingPool {
    pub authority: Pubkey,                       // 32
    pub staking_mint: Pubkey,                    // 32
    pub reward_mint: Pubkey,                     // 32
    pub pool_vault: Pubkey,                      // 32
    pub reward_vault: Pubkey,                    // 32
    pub reward_rate: u64,                        // 8
    pub lock_duration: i64,                      // 8
    pub total_staked: u64,                       // 8
    pub total_stakers: u64,                      // 8
    pub last_reward_timestamp: i64,              // 8
    pub accumulated_reward_per_share: u64,       // 8
    pub is_active: bool,                         // 1
    pub bump: u8,                                // 1
}

impl StakingPool {
    pub const SPACE: usize = 32 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,                   // 32
    pub pool: Pubkey,                    // 32
    pub staked_amount: u64,              // 8
    pub reward_debt: u64,                // 8
    pub pending_rewards: u64,            // 8
    pub staked_at: i64,                  // 8
    pub last_stake_timestamp: i64,       // 8
    pub bump: u8,                        // 1
}

impl StakeAccount {
    pub const SPACE: usize = 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum StakingError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Reward rate must be greater than zero")]
    InvalidRewardRate,
    #[msg("Lock duration cannot be negative")]
    InvalidDuration,
    #[msg("Staking pool is not active")]
    PoolInactive,
    #[msg("No stakers in the pool")]
    NoStakers,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("Stake is still locked")]
    StakeLocked,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid vault account")]
    InvalidVault,
    #[msg("Arithmetic overflow")]
    Overflow,
}
