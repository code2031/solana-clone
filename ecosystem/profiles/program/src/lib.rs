use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

solana_program::declare_id!("Prof1111111111111111111111111111111111111111");

// ── Constants ────────────────────────────────────────────────────────────────

const PROFILE_SEED: &[u8] = b"profile";
const MAX_DISPLAY_NAME_LEN: usize = 32;
const MAX_AVATAR_URL_LEN: usize = 128;
const MAX_BIO_LEN: usize = 256;
// 8 (discriminator) + 32 (owner) + 4+32 (display_name) + 4+128 (avatar_url)
// + 4+256 (bio) + 8 (created_at) + 8 (updated_at) + 1 (bump) + 32 (padding)
const PROFILE_SIZE: usize = 8 + 32 + (4 + 32) + (4 + 128) + (4 + 256) + 8 + 8 + 1 + 32;

// ── Instructions ─────────────────────────────────────────────────────────────

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum ProfileInstruction {
    /// Create a new on-chain profile
    /// Accounts:
    ///   0. `[signer, writable]` Owner wallet
    ///   1. `[writable]` Profile PDA
    ///   2. `[]` System program
    CreateProfile {
        display_name: String,
        avatar_url: String,
        bio: String,
    },

    /// Update an existing profile
    /// Accounts:
    ///   0. `[signer]` Owner wallet
    ///   1. `[writable]` Profile PDA
    UpdateProfile {
        display_name: Option<String>,
        avatar_url: Option<String>,
        bio: Option<String>,
    },

    /// Delete profile and reclaim rent
    /// Accounts:
    ///   0. `[signer, writable]` Owner wallet
    ///   1. `[writable]` Profile PDA
    DeleteProfile,
}

// ── State ────────────────────────────────────────────────────────────────────

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Profile {
    /// Discriminator for account type identification
    pub discriminator: [u8; 8],
    /// Wallet address that owns this profile
    pub owner: Pubkey,
    /// Display name (max 32 bytes)
    pub display_name: String,
    /// Avatar URL (max 128 bytes)
    pub avatar_url: String,
    /// Bio/description (max 256 bytes)
    pub bio: String,
    /// Unix timestamp of creation
    pub created_at: i64,
    /// Unix timestamp of last update
    pub updated_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl Profile {
    pub const DISCRIMINATOR: [u8; 8] = [0x50, 0x72, 0x6f, 0x66, 0x69, 0x6c, 0x65, 0x30]; // "Profile0"
}

// ── Entrypoint ───────────────────────────────────────────────────────────────

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = ProfileInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        ProfileInstruction::CreateProfile {
            display_name,
            avatar_url,
            bio,
        } => process_create_profile(program_id, accounts, display_name, avatar_url, bio),
        ProfileInstruction::UpdateProfile {
            display_name,
            avatar_url,
            bio,
        } => process_update_profile(program_id, accounts, display_name, avatar_url, bio),
        ProfileInstruction::DeleteProfile => process_delete_profile(program_id, accounts),
    }
}

// ── Processors ───────────────────────────────────────────────────────────────

fn process_create_profile(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    display_name: String,
    avatar_url: String,
    bio: String,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let owner = next_account_info(account_info_iter)?;
    let profile_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate field lengths
    if display_name.len() > MAX_DISPLAY_NAME_LEN {
        msg!(
            "Error: display name exceeds {} bytes",
            MAX_DISPLAY_NAME_LEN
        );
        return Err(ProgramError::InvalidArgument);
    }
    if avatar_url.len() > MAX_AVATAR_URL_LEN {
        msg!("Error: avatar URL exceeds {} bytes", MAX_AVATAR_URL_LEN);
        return Err(ProgramError::InvalidArgument);
    }
    if bio.len() > MAX_BIO_LEN {
        msg!("Error: bio exceeds {} bytes", MAX_BIO_LEN);
        return Err(ProgramError::InvalidArgument);
    }

    // Derive profile PDA from owner's wallet
    let (profile_pda, bump) =
        Pubkey::find_program_address(&[PROFILE_SEED, owner.key.as_ref()], program_id);
    if profile_pda != *profile_account.key {
        msg!("Error: invalid profile PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Ensure profile doesn't already exist
    if !profile_account.data_is_empty() {
        msg!("Error: profile already exists for this wallet");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    // Create PDA account
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(PROFILE_SIZE);

    invoke_signed(
        &system_instruction::create_account(
            owner.key,
            profile_account.key,
            lamports,
            PROFILE_SIZE as u64,
            program_id,
        ),
        &[
            owner.clone(),
            profile_account.clone(),
            system_program.clone(),
        ],
        &[&[PROFILE_SEED, owner.key.as_ref(), &[bump]]],
    )?;

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let profile = Profile {
        discriminator: Profile::DISCRIMINATOR,
        owner: *owner.key,
        display_name,
        avatar_url,
        bio,
        created_at: now,
        updated_at: now,
        bump,
    };

    profile.serialize(&mut &mut profile_account.data.borrow_mut()[..])?;

    msg!("Profile created for {}", owner.key);

    Ok(())
}

fn process_update_profile(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    display_name: Option<String>,
    avatar_url: Option<String>,
    bio: Option<String>,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let owner = next_account_info(account_info_iter)?;
    let profile_account = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Verify PDA
    let (profile_pda, _bump) =
        Pubkey::find_program_address(&[PROFILE_SEED, owner.key.as_ref()], program_id);
    if profile_pda != *profile_account.key {
        msg!("Error: invalid profile PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    let mut profile = Profile::try_from_slice(&profile_account.data.borrow())?;

    // Verify ownership
    if profile.owner != *owner.key {
        msg!("Error: not the profile owner");
        return Err(ProgramError::IllegalOwner);
    }

    // Update fields if provided
    if let Some(name) = display_name {
        if name.len() > MAX_DISPLAY_NAME_LEN {
            msg!(
                "Error: display name exceeds {} bytes",
                MAX_DISPLAY_NAME_LEN
            );
            return Err(ProgramError::InvalidArgument);
        }
        profile.display_name = name;
    }

    if let Some(url) = avatar_url {
        if url.len() > MAX_AVATAR_URL_LEN {
            msg!("Error: avatar URL exceeds {} bytes", MAX_AVATAR_URL_LEN);
            return Err(ProgramError::InvalidArgument);
        }
        profile.avatar_url = url;
    }

    if let Some(b) = bio {
        if b.len() > MAX_BIO_LEN {
            msg!("Error: bio exceeds {} bytes", MAX_BIO_LEN);
            return Err(ProgramError::InvalidArgument);
        }
        profile.bio = b;
    }

    let clock = Clock::get()?;
    profile.updated_at = clock.unix_timestamp;

    profile.serialize(&mut &mut profile_account.data.borrow_mut()[..])?;

    msg!("Profile updated for {}", owner.key);

    Ok(())
}

fn process_delete_profile(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let owner = next_account_info(account_info_iter)?;
    let profile_account = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Verify PDA
    let (profile_pda, _bump) =
        Pubkey::find_program_address(&[PROFILE_SEED, owner.key.as_ref()], program_id);
    if profile_pda != *profile_account.key {
        msg!("Error: invalid profile PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    let profile = Profile::try_from_slice(&profile_account.data.borrow())?;

    // Verify ownership
    if profile.owner != *owner.key {
        msg!("Error: not the profile owner");
        return Err(ProgramError::IllegalOwner);
    }

    // Transfer all lamports back to owner (closes the account)
    let lamports = profile_account.lamports();
    **profile_account.try_borrow_mut_lamports()? = 0;
    **owner.try_borrow_mut_lamports()? += lamports;

    // Zero out account data
    let mut data = profile_account.data.borrow_mut();
    for byte in data.iter_mut() {
        *byte = 0;
    }

    msg!("Profile deleted for {}, rent reclaimed: {}", owner.key, lamports);

    Ok(())
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_profile_discriminator() {
        assert_eq!(
            Profile::DISCRIMINATOR,
            [0x50, 0x72, 0x6f, 0x66, 0x69, 0x6c, 0x65, 0x30]
        );
    }

    #[test]
    fn test_instruction_serialization() {
        let create = ProfileInstruction::CreateProfile {
            display_name: "Alice".to_string(),
            avatar_url: "https://example.com/avatar.png".to_string(),
            bio: "Builder on SolClone".to_string(),
        };
        let serialized = create.try_to_vec().unwrap();
        let deserialized = ProfileInstruction::try_from_slice(&serialized).unwrap();

        if let ProfileInstruction::CreateProfile {
            display_name,
            avatar_url,
            bio,
        } = deserialized
        {
            assert_eq!(display_name, "Alice");
            assert_eq!(avatar_url, "https://example.com/avatar.png");
            assert_eq!(bio, "Builder on SolClone");
        } else {
            panic!("Deserialization failed");
        }
    }

    #[test]
    fn test_field_length_limits() {
        assert_eq!(MAX_DISPLAY_NAME_LEN, 32);
        assert_eq!(MAX_AVATAR_URL_LEN, 128);
        assert_eq!(MAX_BIO_LEN, 256);
    }
}
