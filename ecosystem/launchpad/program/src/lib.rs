use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

solana_program::declare_id!("Launch1111111111111111111111111111111111111");

// ── Constants ────────────────────────────────────────────────────────────────

const LAUNCH_SEED: &[u8] = b"launch";
const PARTICIPATION_SEED: &[u8] = b"participation";
const LAUNCH_CONFIG_SIZE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 64;
const PARTICIPATION_SIZE: usize = 8 + 32 + 8 + 8 + 1 + 1 + 32;

// ── Enums ────────────────────────────────────────────────────────────────────

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy, PartialEq)]
pub enum LaunchType {
    /// Fixed price sale — first come, first served
    FixedPrice,
    /// Lottery — random selection among participants
    Lottery,
    /// Auction — final price determined by demand
    Auction,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy, PartialEq)]
pub enum LaunchInstruction {
    /// Create a new token launch
    /// Accounts:
    ///   0. `[signer, writable]` Creator
    ///   1. `[writable]` Launch config PDA
    ///   2. `[]` Token mint
    ///   3. `[]` System program
    CreateLaunch {
        total_allocation: u64,
        price_per_token: u64,
        start_time: i64,
        end_time: i64,
        min_purchase: u64,
        max_purchase: u64,
        launch_type: LaunchType,
    },

    /// Participate in a launch by depositing SOL
    /// Accounts:
    ///   0. `[signer, writable]` User
    ///   1. `[writable]` Launch config PDA
    ///   2. `[writable]` Participation PDA
    ///   3. `[]` System program
    Participate {
        amount: u64,
    },

    /// Finalize the launch — determine winners (lottery) or final price (auction)
    /// Accounts:
    ///   0. `[signer]` Creator
    ///   1. `[writable]` Launch config PDA
    FinalizeLaunch,

    /// Claim allocated tokens after launch finalization
    /// Accounts:
    ///   0. `[signer, writable]` User
    ///   1. `[writable]` Launch config PDA
    ///   2. `[writable]` Participation PDA
    ///   3. `[writable]` Token source (launch vault)
    ///   4. `[writable]` Token destination (user ATA)
    ///   5. `[]` Token program
    ///   6. `[]` Launch authority PDA
    ClaimTokens,

    /// Refund SOL for unsuccessful participants
    /// Accounts:
    ///   0. `[signer, writable]` User
    ///   1. `[writable]` Launch config PDA
    ///   2. `[writable]` Participation PDA
    ///   3. `[]` System program
    Refund,

    /// Creator withdraws raised SOL proceeds
    /// Accounts:
    ///   0. `[signer, writable]` Creator
    ///   1. `[writable]` Launch config PDA
    ///   2. `[]` System program
    WithdrawProceeds,
}

// ── State ────────────────────────────────────────────────────────────────────

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct LaunchConfig {
    /// Discriminator for account type
    pub discriminator: [u8; 8],
    /// SPL token mint address
    pub token_mint: Pubkey,
    /// Creator/owner of the launch
    pub creator: Pubkey,
    /// Total tokens allocated for the launch
    pub total_allocation: u64,
    /// Price per token in lamports
    pub price_per_token: u64,
    /// Launch start time (unix timestamp)
    pub start_time: i64,
    /// Launch end time (unix timestamp)
    pub end_time: i64,
    /// Minimum purchase amount in lamports
    pub min_purchase: u64,
    /// Maximum purchase amount per wallet in lamports
    pub max_purchase: u64,
    /// Total SOL raised in lamports
    pub total_raised: u64,
    /// Total tokens sold/allocated
    pub total_sold: u64,
    /// Whether the launch is currently active
    pub is_active: bool,
    /// Whether the launch has been finalized
    pub is_finalized: bool,
    /// Type of launch mechanism
    pub launch_type: LaunchType,
    /// PDA bump seed
    pub bump: u8,
}

impl LaunchConfig {
    pub const DISCRIMINATOR: [u8; 8] = [0x4c, 0x61, 0x75, 0x6e, 0x63, 0x68, 0x43, 0x66]; // "LaunchCf"
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Participation {
    /// Discriminator for account type
    pub discriminator: [u8; 8],
    /// User's wallet address
    pub user: Pubkey,
    /// Launch config this participation belongs to
    pub launch: Pubkey,
    /// Amount of SOL deposited in lamports
    pub amount_deposited: u64,
    /// Number of tokens claimed
    pub tokens_claimed: u64,
    /// Whether this participant won (relevant for lottery)
    pub is_winner: bool,
    /// Whether a refund has been issued
    pub is_refunded: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl Participation {
    pub const DISCRIMINATOR: [u8; 8] = [0x50, 0x61, 0x72, 0x74, 0x69, 0x63, 0x69, 0x70]; // "Particip"
}

// ── Entrypoint ───────────────────────────────────────────────────────────────

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = LaunchInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        LaunchInstruction::CreateLaunch {
            total_allocation,
            price_per_token,
            start_time,
            end_time,
            min_purchase,
            max_purchase,
            launch_type,
        } => process_create_launch(
            program_id,
            accounts,
            total_allocation,
            price_per_token,
            start_time,
            end_time,
            min_purchase,
            max_purchase,
            launch_type,
        ),
        LaunchInstruction::Participate { amount } => {
            process_participate(program_id, accounts, amount)
        }
        LaunchInstruction::FinalizeLaunch => process_finalize_launch(program_id, accounts),
        LaunchInstruction::ClaimTokens => process_claim_tokens(program_id, accounts),
        LaunchInstruction::Refund => process_refund(program_id, accounts),
        LaunchInstruction::WithdrawProceeds => process_withdraw_proceeds(program_id, accounts),
    }
}

// ── Processors ───────────────────────────────────────────────────────────────

fn process_create_launch(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    total_allocation: u64,
    price_per_token: u64,
    start_time: i64,
    end_time: i64,
    min_purchase: u64,
    max_purchase: u64,
    launch_type: LaunchType,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let creator = next_account_info(account_info_iter)?;
    let launch_account = next_account_info(account_info_iter)?;
    let token_mint = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !creator.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate parameters
    if total_allocation == 0 {
        msg!("Error: total allocation must be greater than zero");
        return Err(ProgramError::InvalidArgument);
    }
    if price_per_token == 0 {
        msg!("Error: price per token must be greater than zero");
        return Err(ProgramError::InvalidArgument);
    }
    if start_time >= end_time {
        msg!("Error: start time must be before end time");
        return Err(ProgramError::InvalidArgument);
    }
    if min_purchase > max_purchase {
        msg!("Error: min purchase must not exceed max purchase");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive PDA
    let (launch_pda, bump) = Pubkey::find_program_address(
        &[LAUNCH_SEED, token_mint.key.as_ref(), creator.key.as_ref()],
        program_id,
    );
    if launch_pda != *launch_account.key {
        msg!("Error: invalid launch PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    let rent = Rent::get()?;
    let space = LAUNCH_CONFIG_SIZE;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            creator.key,
            launch_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            creator.clone(),
            launch_account.clone(),
            system_program.clone(),
        ],
        &[&[
            LAUNCH_SEED,
            token_mint.key.as_ref(),
            creator.key.as_ref(),
            &[bump],
        ]],
    )?;

    let config = LaunchConfig {
        discriminator: LaunchConfig::DISCRIMINATOR,
        token_mint: *token_mint.key,
        creator: *creator.key,
        total_allocation,
        price_per_token,
        start_time,
        end_time,
        min_purchase,
        max_purchase,
        total_raised: 0,
        total_sold: 0,
        is_active: true,
        is_finalized: false,
        launch_type,
        bump,
    };

    config.serialize(&mut &mut launch_account.data.borrow_mut()[..])?;

    msg!(
        "Launch created: mint={}, type={:?}, allocation={}, price={}",
        token_mint.key,
        launch_type,
        total_allocation,
        price_per_token
    );

    Ok(())
}

fn process_participate(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?;
    let launch_account = next_account_info(account_info_iter)?;
    let participation_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut config = LaunchConfig::try_from_slice(&launch_account.data.borrow())?;

    // Validate launch is active
    if !config.is_active {
        msg!("Error: launch is not active");
        return Err(ProgramError::InvalidAccountData);
    }
    if config.is_finalized {
        msg!("Error: launch has been finalized");
        return Err(ProgramError::InvalidAccountData);
    }

    // Validate timing
    let clock = Clock::get()?;
    if clock.unix_timestamp < config.start_time {
        msg!("Error: launch has not started yet");
        return Err(ProgramError::InvalidArgument);
    }
    if clock.unix_timestamp > config.end_time {
        msg!("Error: launch has ended");
        return Err(ProgramError::InvalidArgument);
    }

    // Validate amount
    if amount < config.min_purchase {
        msg!("Error: amount below minimum purchase");
        return Err(ProgramError::InvalidArgument);
    }
    if amount > config.max_purchase {
        msg!("Error: amount exceeds maximum purchase");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive participation PDA
    let (participation_pda, part_bump) = Pubkey::find_program_address(
        &[
            PARTICIPATION_SEED,
            launch_account.key.as_ref(),
            user.key.as_ref(),
        ],
        program_id,
    );
    if participation_pda != *participation_account.key {
        msg!("Error: invalid participation PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Create participation account if it doesn't exist
    if participation_account.data_is_empty() {
        let rent = Rent::get()?;
        let space = PARTICIPATION_SIZE;
        let lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                user.key,
                participation_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[
                user.clone(),
                participation_account.clone(),
                system_program.clone(),
            ],
            &[&[
                PARTICIPATION_SEED,
                launch_account.key.as_ref(),
                user.key.as_ref(),
                &[part_bump],
            ]],
        )?;

        let participation = Participation {
            discriminator: Participation::DISCRIMINATOR,
            user: *user.key,
            launch: *launch_account.key,
            amount_deposited: 0,
            tokens_claimed: 0,
            is_winner: false,
            is_refunded: false,
            bump: part_bump,
        };
        participation.serialize(&mut &mut participation_account.data.borrow_mut()[..])?;
    }

    let mut participation =
        Participation::try_from_slice(&participation_account.data.borrow())?;

    // Check max purchase limit per user
    if participation.amount_deposited + amount > config.max_purchase {
        msg!("Error: total deposits exceed max purchase limit");
        return Err(ProgramError::InvalidArgument);
    }

    // Transfer SOL from user to launch PDA
    invoke(
        &system_instruction::transfer(user.key, launch_account.key, amount),
        &[user.clone(), launch_account.clone(), system_program.clone()],
    )?;

    // Update state
    participation.amount_deposited += amount;
    config.total_raised += amount;

    // For fixed price, calculate tokens immediately
    if config.launch_type == LaunchType::FixedPrice {
        let tokens = amount / config.price_per_token;
        if config.total_sold + tokens > config.total_allocation {
            msg!("Error: insufficient allocation remaining");
            return Err(ProgramError::InvalidArgument);
        }
        config.total_sold += tokens;
        participation.is_winner = true;
    }

    config.serialize(&mut &mut launch_account.data.borrow_mut()[..])?;
    participation.serialize(&mut &mut participation_account.data.borrow_mut()[..])?;

    msg!("Participation recorded: user={}, amount={}", user.key, amount);

    Ok(())
}

fn process_finalize_launch(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let creator = next_account_info(account_info_iter)?;
    let launch_account = next_account_info(account_info_iter)?;

    if !creator.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut config = LaunchConfig::try_from_slice(&launch_account.data.borrow())?;

    if config.creator != *creator.key {
        msg!("Error: only the creator can finalize the launch");
        return Err(ProgramError::IllegalOwner);
    }
    if config.is_finalized {
        msg!("Error: launch already finalized");
        return Err(ProgramError::InvalidAccountData);
    }

    let clock = Clock::get()?;
    if clock.unix_timestamp < config.end_time {
        msg!("Error: launch has not ended yet");
        return Err(ProgramError::InvalidArgument);
    }

    config.is_active = false;
    config.is_finalized = true;

    // For auction type, calculate final price based on total raised vs allocation
    if config.launch_type == LaunchType::Auction {
        if config.total_raised > 0 && config.total_allocation > 0 {
            let final_price = config.total_raised / config.total_allocation;
            config.price_per_token = if final_price > 0 {
                final_price
            } else {
                config.price_per_token
            };
            config.total_sold = config.total_allocation;
        }
    }

    // For lottery type, winners are determined off-chain and set via
    // separate winner-selection transactions (simplified here)
    if config.launch_type == LaunchType::Lottery {
        let tokens_available = config.total_allocation;
        let tokens_per_winner = if config.price_per_token > 0 {
            config.total_raised / config.price_per_token
        } else {
            0
        };
        config.total_sold = tokens_per_winner.min(tokens_available);
    }

    config.serialize(&mut &mut launch_account.data.borrow_mut()[..])?;

    msg!(
        "Launch finalized: total_raised={}, total_sold={}, final_price={}",
        config.total_raised,
        config.total_sold,
        config.price_per_token
    );

    Ok(())
}

fn process_claim_tokens(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?;
    let launch_account = next_account_info(account_info_iter)?;
    let participation_account = next_account_info(account_info_iter)?;
    let token_source = next_account_info(account_info_iter)?;
    let token_destination = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let launch_authority = next_account_info(account_info_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let config = LaunchConfig::try_from_slice(&launch_account.data.borrow())?;
    let mut participation =
        Participation::try_from_slice(&participation_account.data.borrow())?;

    if !config.is_finalized {
        msg!("Error: launch not finalized yet");
        return Err(ProgramError::InvalidAccountData);
    }
    if participation.user != *user.key {
        msg!("Error: participation does not belong to this user");
        return Err(ProgramError::IllegalOwner);
    }
    if participation.tokens_claimed > 0 {
        msg!("Error: tokens already claimed");
        return Err(ProgramError::InvalidAccountData);
    }

    // For lottery, only winners can claim
    if config.launch_type == LaunchType::Lottery && !participation.is_winner {
        msg!("Error: not a lottery winner");
        return Err(ProgramError::InvalidArgument);
    }

    // Calculate tokens to transfer
    let tokens_to_claim = if config.price_per_token > 0 {
        participation.amount_deposited / config.price_per_token
    } else {
        0
    };

    if tokens_to_claim == 0 {
        msg!("Error: no tokens to claim");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive launch authority PDA for signing
    let (authority_pda, authority_bump) = Pubkey::find_program_address(
        &[
            LAUNCH_SEED,
            config.token_mint.as_ref(),
            config.creator.as_ref(),
        ],
        program_id,
    );
    if authority_pda != *launch_authority.key {
        msg!("Error: invalid launch authority PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Transfer SPL tokens from vault to user
    let transfer_ix = spl_token::instruction::transfer(
        token_program.key,
        token_source.key,
        token_destination.key,
        launch_authority.key,
        &[],
        tokens_to_claim,
    )?;

    invoke_signed(
        &transfer_ix,
        &[
            token_source.clone(),
            token_destination.clone(),
            launch_authority.clone(),
            token_program.clone(),
        ],
        &[&[
            LAUNCH_SEED,
            config.token_mint.as_ref(),
            config.creator.as_ref(),
            &[authority_bump],
        ]],
    )?;

    participation.tokens_claimed = tokens_to_claim;
    participation.serialize(&mut &mut participation_account.data.borrow_mut()[..])?;

    msg!(
        "Tokens claimed: user={}, amount={}",
        user.key,
        tokens_to_claim
    );

    Ok(())
}

fn process_refund(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?;
    let launch_account = next_account_info(account_info_iter)?;
    let participation_account = next_account_info(account_info_iter)?;
    let _system_program = next_account_info(account_info_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let config = LaunchConfig::try_from_slice(&launch_account.data.borrow())?;
    let mut participation =
        Participation::try_from_slice(&participation_account.data.borrow())?;

    if !config.is_finalized {
        msg!("Error: launch not finalized yet");
        return Err(ProgramError::InvalidAccountData);
    }
    if participation.user != *user.key {
        msg!("Error: participation does not belong to this user");
        return Err(ProgramError::IllegalOwner);
    }
    if participation.is_refunded {
        msg!("Error: already refunded");
        return Err(ProgramError::InvalidAccountData);
    }
    if participation.tokens_claimed > 0 {
        msg!("Error: tokens already claimed, cannot refund");
        return Err(ProgramError::InvalidAccountData);
    }

    // For lottery, only non-winners get refunds
    if config.launch_type == LaunchType::Lottery && participation.is_winner {
        msg!("Error: winners cannot request refund, claim tokens instead");
        return Err(ProgramError::InvalidArgument);
    }

    // Transfer lamports back from launch PDA to user
    let refund_amount = participation.amount_deposited;
    **launch_account.try_borrow_mut_lamports()? -= refund_amount;
    **user.try_borrow_mut_lamports()? += refund_amount;

    participation.is_refunded = true;
    participation.serialize(&mut &mut participation_account.data.borrow_mut()[..])?;

    msg!("Refund issued: user={}, amount={}", user.key, refund_amount);

    Ok(())
}

fn process_withdraw_proceeds(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let creator = next_account_info(account_info_iter)?;
    let launch_account = next_account_info(account_info_iter)?;
    let _system_program = next_account_info(account_info_iter)?;

    if !creator.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let config = LaunchConfig::try_from_slice(&launch_account.data.borrow())?;

    if config.creator != *creator.key {
        msg!("Error: only the creator can withdraw proceeds");
        return Err(ProgramError::IllegalOwner);
    }
    if !config.is_finalized {
        msg!("Error: launch must be finalized first");
        return Err(ProgramError::InvalidAccountData);
    }

    // Calculate withdrawable amount (keep rent-exempt minimum)
    let rent = Rent::get()?;
    let min_balance = rent.minimum_balance(LAUNCH_CONFIG_SIZE);
    let available = launch_account
        .lamports()
        .checked_sub(min_balance)
        .ok_or(ProgramError::InsufficientFunds)?;

    if available == 0 {
        msg!("Error: no proceeds to withdraw");
        return Err(ProgramError::InsufficientFunds);
    }

    **launch_account.try_borrow_mut_lamports()? -= available;
    **creator.try_borrow_mut_lamports()? += available;

    msg!(
        "Proceeds withdrawn: creator={}, amount={}",
        creator.key,
        available
    );

    Ok(())
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_launch_type_serialization() {
        let lt = LaunchType::FixedPrice;
        let serialized = lt.try_to_vec().unwrap();
        let deserialized = LaunchType::try_from_slice(&serialized).unwrap();
        assert_eq!(lt, deserialized);

        let lt2 = LaunchType::Lottery;
        let serialized2 = lt2.try_to_vec().unwrap();
        let deserialized2 = LaunchType::try_from_slice(&serialized2).unwrap();
        assert_eq!(lt2, deserialized2);

        let lt3 = LaunchType::Auction;
        let serialized3 = lt3.try_to_vec().unwrap();
        let deserialized3 = LaunchType::try_from_slice(&serialized3).unwrap();
        assert_eq!(lt3, deserialized3);
    }

    #[test]
    fn test_launch_config_discriminator() {
        assert_eq!(
            LaunchConfig::DISCRIMINATOR,
            [0x4c, 0x61, 0x75, 0x6e, 0x63, 0x68, 0x43, 0x66]
        );
    }

    #[test]
    fn test_participation_discriminator() {
        assert_eq!(
            Participation::DISCRIMINATOR,
            [0x50, 0x61, 0x72, 0x74, 0x69, 0x63, 0x69, 0x70]
        );
    }
}
