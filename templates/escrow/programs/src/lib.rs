use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("EscrowProg1111111111111111111111111111111111");

#[program]
pub mod prism_escrow {
    use super::*;

    /// Initialize an escrow: lock token A and specify expected token B amount.
    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        deposit_amount: u64,
        receive_amount: u64,
    ) -> Result<()> {
        require!(deposit_amount > 0, EscrowError::InvalidAmount);
        require!(receive_amount > 0, EscrowError::InvalidAmount);

        // Transfer token A from initializer to escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.initializer_token_a.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.initializer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, deposit_amount)?;

        // Store escrow state
        let escrow = &mut ctx.accounts.escrow;
        escrow.initializer = ctx.accounts.initializer.key();
        escrow.initializer_token_a_account = ctx.accounts.initializer_token_a.key();
        escrow.initializer_token_b_account = ctx.accounts.initializer_token_b.key();
        escrow.vault = ctx.accounts.vault.key();
        escrow.deposit_amount = deposit_amount;
        escrow.receive_amount = receive_amount;
        escrow.seed = seed;
        escrow.is_active = true;
        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = ctx.bumps.vault;

        msg!(
            "Escrow initialized: {} token A locked, expecting {} token B",
            deposit_amount,
            receive_amount
        );
        Ok(())
    }

    /// Exchange: taker sends token B to initializer, receives token A from vault.
    pub fn exchange(ctx: Context<Exchange>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(escrow.is_active, EscrowError::EscrowInactive);

        // Taker sends token B to initializer
        let cpi_accounts_b = Transfer {
            from: ctx.accounts.taker_token_b.to_account_info(),
            to: ctx.accounts.initializer_token_b.to_account_info(),
            authority: ctx.accounts.taker.to_account_info(),
        };
        let cpi_ctx_b = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_b,
        );
        token::transfer(cpi_ctx_b, escrow.receive_amount)?;

        // Vault sends token A to taker (PDA signer)
        let seed_bytes = escrow.seed.to_le_bytes();
        let seeds: &[&[u8]] = &[
            b"vault",
            ctx.accounts.escrow.to_account_info().key.as_ref(),
            &seed_bytes,
            &[escrow.vault_bump],
        ];
        let signer_seeds = &[seeds];

        let cpi_accounts_a = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.taker_token_a.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx_a = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_a,
            signer_seeds,
        );
        token::transfer(cpi_ctx_a, escrow.deposit_amount)?;

        // Mark escrow as complete
        let escrow_mut = &mut ctx.accounts.escrow;
        escrow_mut.is_active = false;

        msg!("Escrow exchange completed successfully");
        Ok(())
    }

    /// Cancel: refund token A from vault back to initializer.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(escrow.is_active, EscrowError::EscrowInactive);

        // Return token A from vault to initializer
        let seed_bytes = escrow.seed.to_le_bytes();
        let seeds: &[&[u8]] = &[
            b"vault",
            ctx.accounts.escrow.to_account_info().key.as_ref(),
            &seed_bytes,
            &[escrow.vault_bump],
        ];
        let signer_seeds = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.initializer_token_a.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, escrow.deposit_amount)?;

        // Mark escrow as inactive
        let escrow_mut = &mut ctx.accounts.escrow;
        escrow_mut.is_active = false;

        msg!("Escrow cancelled, {} tokens refunded", escrow.deposit_amount);
        Ok(())
    }
}

// ─── Account Structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = initializer,
        space = 8 + EscrowState::SPACE,
        seeds = [b"escrow", initializer.key().as_ref(), &seed.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, EscrowState>,
    #[account(
        init,
        payer = initializer,
        token::mint = mint_a,
        token::authority = vault,
        seeds = [b"vault", escrow.key().as_ref(), &seed.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub initializer_token_a: Account<'info, TokenAccount>,
    pub initializer_token_b: Account<'info, TokenAccount>,
    /// CHECK: Mint for token A
    pub mint_a: AccountInfo<'info>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Exchange<'info> {
    #[account(
        mut,
        constraint = escrow.is_active @ EscrowError::EscrowInactive,
        seeds = [b"escrow", escrow.initializer.as_ref(), &escrow.seed.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowState>,
    #[account(
        mut,
        constraint = vault.key() == escrow.vault @ EscrowError::InvalidVault
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub taker_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub taker_token_b: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = initializer_token_b.key() == escrow.initializer_token_b_account @ EscrowError::InvalidAccount
    )]
    pub initializer_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub taker: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(
        mut,
        has_one = initializer @ EscrowError::Unauthorized,
        constraint = escrow.is_active @ EscrowError::EscrowInactive,
        seeds = [b"escrow", initializer.key().as_ref(), &escrow.seed.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowState>,
    #[account(
        mut,
        constraint = vault.key() == escrow.vault @ EscrowError::InvalidVault
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = initializer_token_a.key() == escrow.initializer_token_a_account @ EscrowError::InvalidAccount
    )]
    pub initializer_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct EscrowState {
    pub initializer: Pubkey,                   // 32
    pub initializer_token_a_account: Pubkey,   // 32
    pub initializer_token_b_account: Pubkey,   // 32
    pub vault: Pubkey,                         // 32
    pub deposit_amount: u64,                   // 8
    pub receive_amount: u64,                   // 8
    pub seed: u64,                             // 8
    pub is_active: bool,                       // 1
    pub bump: u8,                              // 1
    pub vault_bump: u8,                        // 1
}

impl EscrowState {
    pub const SPACE: usize = 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 1;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Escrow is not active")]
    EscrowInactive,
    #[msg("Unauthorized: signer is not the escrow initializer")]
    Unauthorized,
    #[msg("Invalid vault account")]
    InvalidVault,
    #[msg("Invalid token account")]
    InvalidAccount,
}
