use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, MintTo, Token, TokenAccount, Transfer};

declare_id!("TokenProg1111111111111111111111111111111111");

#[program]
pub mod solclone_token {
    use super::*;

    /// Initialize a new token mint with the given decimals and authority.
    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        decimals: u8,
        _name: String,
        _symbol: String,
    ) -> Result<()> {
        let mint_info = &mut ctx.accounts.mint_metadata;
        mint_info.authority = ctx.accounts.authority.key();
        mint_info.decimals = decimals;
        mint_info.total_supply = 0;
        mint_info.is_initialized = true;
        msg!("Mint initialized with {} decimals", decimals);
        Ok(())
    }

    /// Mint new tokens to a destination token account.
    pub fn mint_to(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, TokenError::InvalidAmount);

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        let mint_info = &mut ctx.accounts.mint_metadata;
        mint_info.total_supply = mint_info
            .total_supply
            .checked_add(amount)
            .ok_or(TokenError::Overflow)?;

        msg!("Minted {} tokens", amount);
        Ok(())
    }

    /// Transfer tokens between two token accounts.
    pub fn transfer(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, TokenError::InvalidAmount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        msg!("Transferred {} tokens", amount);
        Ok(())
    }

    /// Burn tokens from a token account, reducing total supply.
    pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, TokenError::InvalidAmount);

        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        let mint_info = &mut ctx.accounts.mint_metadata;
        mint_info.total_supply = mint_info
            .total_supply
            .checked_sub(amount)
            .ok_or(TokenError::Overflow)?;

        msg!("Burned {} tokens", amount);
        Ok(())
    }
}

// ─── Account Structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MintMetadata::SPACE,
        seeds = [b"mint-metadata", mint.key().as_ref()],
        bump
    )]
    pub mint_metadata: Account<'info, MintMetadata>,
    /// CHECK: The mint account to be initialized
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"mint-metadata", mint.key().as_ref()],
        bump,
        has_one = authority @ TokenError::Unauthorized
    )]
    pub mint_metadata: Account<'info, MintMetadata>,
    /// CHECK: The token mint
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(
        mut,
        seeds = [b"mint-metadata", mint.key().as_ref()],
        bump
    )]
    pub mint_metadata: Account<'info, MintMetadata>,
    /// CHECK: The token mint
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct MintMetadata {
    pub authority: Pubkey,
    pub decimals: u8,
    pub total_supply: u64,
    pub is_initialized: bool,
}

impl MintMetadata {
    pub const SPACE: usize = 32 + 1 + 8 + 1;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum TokenError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Unauthorized: signer is not the mint authority")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
