use anchor_lang::prelude::*;

declare_id!("NftCollect111111111111111111111111111111111");

#[program]
pub mod prism_nft_collection {
    use super::*;

    /// Create a new NFT collection with metadata.
    pub fn create_collection(
        ctx: Context<CreateCollection>,
        name: String,
        symbol: String,
        uri: String,
        royalty_bps: u16,
    ) -> Result<()> {
        require!(name.len() <= 32, NftError::NameTooLong);
        require!(symbol.len() <= 10, NftError::SymbolTooLong);
        require!(uri.len() <= 200, NftError::UriTooLong);
        require!(royalty_bps <= 10_000, NftError::InvalidRoyalty);

        let collection = &mut ctx.accounts.collection;
        collection.authority = ctx.accounts.authority.key();
        collection.name = name.clone();
        collection.symbol = symbol;
        collection.uri = uri;
        collection.royalty_bps = royalty_bps;
        collection.item_count = 0;
        collection.bump = ctx.bumps.collection;

        msg!("Collection '{}' created with {}bps royalty", name, royalty_bps);
        Ok(())
    }

    /// Mint a new NFT into the collection.
    pub fn mint_nft(
        ctx: Context<MintNft>,
        name: String,
        uri: String,
        royalty_bps: u16,
    ) -> Result<()> {
        require!(name.len() <= 32, NftError::NameTooLong);
        require!(uri.len() <= 200, NftError::UriTooLong);
        require!(royalty_bps <= 10_000, NftError::InvalidRoyalty);

        let collection = &mut ctx.accounts.collection;
        let nft = &mut ctx.accounts.nft_metadata;

        let token_id = collection.item_count;
        collection.item_count = collection
            .item_count
            .checked_add(1)
            .ok_or(NftError::Overflow)?;

        nft.collection = collection.key();
        nft.owner = ctx.accounts.owner.key();
        nft.creator = ctx.accounts.authority.key();
        nft.name = name.clone();
        nft.uri = uri;
        nft.royalty_bps = royalty_bps;
        nft.token_id = token_id;
        nft.is_frozen = false;
        nft.bump = ctx.bumps.nft_metadata;

        msg!(
            "NFT '{}' minted (token_id: {}) in collection '{}'",
            name,
            token_id,
            collection.name
        );
        Ok(())
    }

    /// Transfer an NFT to a new owner.
    pub fn transfer_nft(ctx: Context<TransferNft>) -> Result<()> {
        let nft = &mut ctx.accounts.nft_metadata;
        require!(!nft.is_frozen, NftError::NftFrozen);

        let previous_owner = nft.owner;
        nft.owner = ctx.accounts.new_owner.key();

        msg!(
            "NFT '{}' (id: {}) transferred from {} to {}",
            nft.name,
            nft.token_id,
            previous_owner,
            nft.owner
        );
        Ok(())
    }
}

// ─── Account Structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Collection::SPACE,
        seeds = [b"collection", authority.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub collection: Account<'info, Collection>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct MintNft<'info> {
    #[account(
        mut,
        has_one = authority @ NftError::Unauthorized,
        seeds = [b"collection", authority.key().as_ref(), collection.name.as_bytes()],
        bump = collection.bump
    )]
    pub collection: Account<'info, Collection>,
    #[account(
        init,
        payer = authority,
        space = 8 + NftMetadata::SPACE,
        seeds = [
            b"nft",
            collection.key().as_ref(),
            &collection.item_count.to_le_bytes()
        ],
        bump
    )]
    pub nft_metadata: Account<'info, NftMetadata>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: The intended owner of the minted NFT
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferNft<'info> {
    #[account(
        mut,
        constraint = nft_metadata.owner == current_owner.key() @ NftError::NotOwner
    )]
    pub nft_metadata: Account<'info, NftMetadata>,
    pub current_owner: Signer<'info>,
    /// CHECK: The new owner receiving the NFT
    pub new_owner: AccountInfo<'info>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct Collection {
    pub authority: Pubkey,       // 32
    pub name: String,            // 4 + 32
    pub symbol: String,          // 4 + 10
    pub uri: String,             // 4 + 200
    pub royalty_bps: u16,        // 2
    pub item_count: u64,         // 8
    pub bump: u8,                // 1
}

impl Collection {
    pub const SPACE: usize = 32 + (4 + 32) + (4 + 10) + (4 + 200) + 2 + 8 + 1;
}

#[account]
pub struct NftMetadata {
    pub collection: Pubkey,      // 32
    pub owner: Pubkey,           // 32
    pub creator: Pubkey,         // 32
    pub name: String,            // 4 + 32
    pub uri: String,             // 4 + 200
    pub royalty_bps: u16,        // 2
    pub token_id: u64,           // 8
    pub is_frozen: bool,         // 1
    pub bump: u8,                // 1
}

impl NftMetadata {
    pub const SPACE: usize = 32 + 32 + 32 + (4 + 32) + (4 + 200) + 2 + 8 + 1 + 1;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum NftError {
    #[msg("Name exceeds 32 characters")]
    NameTooLong,
    #[msg("Symbol exceeds 10 characters")]
    SymbolTooLong,
    #[msg("URI exceeds 200 characters")]
    UriTooLong,
    #[msg("Royalty basis points must be <= 10000 (100%)")]
    InvalidRoyalty,
    #[msg("Unauthorized: signer is not the collection authority")]
    Unauthorized,
    #[msg("Not the NFT owner")]
    NotOwner,
    #[msg("NFT is frozen and cannot be transferred")]
    NftFrozen,
    #[msg("Arithmetic overflow")]
    Overflow,
}
