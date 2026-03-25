use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
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

// ---------------------------------------------------------------------------
// Program ID
// ---------------------------------------------------------------------------

solana_program::declare_id!("SolBrdg11111111111111111111111111111111111");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/// Bridge state for Prism <-> Solana.
/// Since both chains use the same account model and SPL token standard,
/// this bridge is simpler than the Ethereum or Bitcoin bridges.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct SolanaBridgeState {
    pub is_initialized: bool,
    pub admin: Pubkey,
    /// RPC endpoint for the real Solana cluster (informational, used by relayers)
    pub solana_rpc: [u8; 128],
    pub solana_rpc_len: u8,
    /// Guardian public keys that attest cross-chain transfers
    pub guardian_set: Vec<Pubkey>,
    /// Guardian signature threshold
    pub guardian_threshold: u8,
    /// Token mappings: (Prism mint, Solana mint) pairs
    pub token_mappings: Vec<TokenMapping>,
    /// Monotonically increasing nonce
    pub nonce: u64,
    /// Total transfers completed
    pub total_transfers: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct TokenMapping {
    /// SPL Token mint on Prism
    pub prism_mint: Pubkey,
    /// Corresponding SPL Token mint on Solana mainnet
    pub solana_mint: Pubkey,
    /// Whether this mapping is active
    pub is_active: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum TransferStatus {
    Initiated,
    Locked,
    Attested,
    Completed,
    Failed,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct TransferRecord {
    pub nonce: u64,
    /// 3 = Solana, 4 = Prism
    pub from_chain: u8,
    pub to_chain: u8,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub status: TransferStatus,
    pub guardian_signatures: Vec<Pubkey>,
    /// Timestamp of creation (Unix seconds)
    pub created_at: i64,
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum SolanaBridgeInstruction {
    /// Initialize the Solana bridge with guardian set and token mappings.
    ///
    /// Accounts:
    ///   0. `[writable, signer]` Admin / payer
    ///   1. `[writable]`         SolanaBridgeState PDA
    ///   2. `[]`                 System program
    Initialize {
        solana_rpc: [u8; 128],
        solana_rpc_len: u8,
        guardian_set: Vec<Pubkey>,
        guardian_threshold: u8,
    },

    /// Lock an SPL token on Prism and emit a transfer event.
    /// The relayer on Solana-side will observe this and mint/release the equivalent.
    ///
    /// Accounts:
    ///   0. `[signer]`          User
    ///   1. `[writable]`        User's token account (source)
    ///   2. `[writable]`        Bridge vault token account
    ///   3. `[writable]`        SolanaBridgeState PDA
    ///   4. `[writable]`        TransferRecord PDA
    ///   5. `[]`                SPL Token program
    ///   6. `[]`                System program
    LockToken {
        amount: u64,
        recipient: Pubkey,
    },

    /// After guardian attestation of a lock on Solana, mint the equivalent
    /// SPL token on Prism.
    ///
    /// Accounts:
    ///   0. `[signer]`          Guardian
    ///   1. `[writable]`        SolanaBridgeState PDA
    ///   2. `[writable]`        TransferRecord PDA
    ///   3. `[writable]`        Token mint PDA (Prism side)
    ///   4. `[writable]`        Recipient token account
    ///   5. `[]`                Mint authority PDA
    ///   6. `[]`                SPL Token program
    ///   7. `[]`                System program
    MintToken {
        nonce: u64,
        amount: u64,
        sender_on_solana: Pubkey,
        recipient: Pubkey,
        token_solana_mint: Pubkey,
    },

    /// Burn tokens on Prism, triggering a release on Solana.
    ///
    /// Accounts:
    ///   0. `[signer]`          User
    ///   1. `[writable]`        User's token account
    ///   2. `[writable]`        Token mint
    ///   3. `[writable]`        SolanaBridgeState PDA
    ///   4. `[writable]`        TransferRecord PDA
    ///   5. `[]`                SPL Token program
    ///   6. `[]`                System program
    BurnAndRelease {
        amount: u64,
        recipient_on_solana: Pubkey,
    },
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = SolanaBridgeInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        SolanaBridgeInstruction::Initialize {
            solana_rpc,
            solana_rpc_len,
            guardian_set,
            guardian_threshold,
        } => process_initialize(
            program_id,
            accounts,
            solana_rpc,
            solana_rpc_len,
            guardian_set,
            guardian_threshold,
        ),
        SolanaBridgeInstruction::LockToken { amount, recipient } => {
            process_lock_token(program_id, accounts, amount, recipient)
        }
        SolanaBridgeInstruction::MintToken {
            nonce,
            amount,
            sender_on_solana,
            recipient,
            token_solana_mint,
        } => process_mint_token(
            program_id,
            accounts,
            nonce,
            amount,
            sender_on_solana,
            recipient,
            token_solana_mint,
        ),
        SolanaBridgeInstruction::BurnAndRelease {
            amount,
            recipient_on_solana,
        } => process_burn_and_release(program_id, accounts, amount, recipient_on_solana),
    }
}

// ---------------------------------------------------------------------------
// Processors
// ---------------------------------------------------------------------------

fn process_initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    solana_rpc: [u8; 128],
    solana_rpc_len: u8,
    guardian_set: Vec<Pubkey>,
    guardian_threshold: u8,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let admin = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if guardian_threshold == 0 || guardian_threshold as usize > guardian_set.len() {
        msg!("Invalid guardian threshold");
        return Err(ProgramError::InvalidArgument);
    }

    let (bridge_pda, bump) =
        Pubkey::find_program_address(&[b"solana_bridge_state"], program_id);
    if bridge_state_account.key != &bridge_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let state = SolanaBridgeState {
        is_initialized: true,
        admin: *admin.key,
        solana_rpc,
        solana_rpc_len,
        guardian_set: guardian_set.clone(),
        guardian_threshold,
        token_mappings: vec![],
        nonce: 0,
        total_transfers: 0,
    };

    let serialized = state.try_to_vec()?;
    let space = serialized.len() + 256; // Extra space for token mappings
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            admin.key,
            bridge_state_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            admin.clone(),
            bridge_state_account.clone(),
            system_program.clone(),
        ],
        &[&[b"solana_bridge_state", &[bump]]],
    )?;

    state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Solana bridge initialized with {} guardians, threshold {}",
        guardian_set.len(),
        guardian_threshold
    );
    Ok(())
}

fn process_lock_token(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    recipient: Pubkey,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let user = next_account_info(account_iter)?;
    let user_token_account = next_account_info(account_iter)?;
    let vault_token_account = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let transfer_record_account = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if amount == 0 {
        msg!("Amount must be greater than zero");
        return Err(ProgramError::InvalidArgument);
    }

    let mut bridge_state =
        SolanaBridgeState::try_from_slice(&bridge_state_account.data.borrow())?;
    if !bridge_state.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    // Transfer tokens to bridge vault
    let transfer_ix = spl_token::instruction::transfer(
        token_program.key,
        user_token_account.key,
        vault_token_account.key,
        user.key,
        &[],
        amount,
    )?;
    invoke(
        &transfer_ix,
        &[
            user_token_account.clone(),
            vault_token_account.clone(),
            user.clone(),
            token_program.clone(),
        ],
    )?;

    // Create transfer record
    bridge_state.nonce += 1;
    let nonce = bridge_state.nonce;

    let (record_pda, record_bump) = Pubkey::find_program_address(
        &[b"transfer", &nonce.to_le_bytes()],
        program_id,
    );
    if transfer_record_account.key != &record_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let record = TransferRecord {
        nonce,
        from_chain: 4, // Prism
        to_chain: 3,   // Solana
        token_mint: *vault_token_account.key,
        amount,
        sender: *user.key,
        recipient,
        status: TransferStatus::Locked,
        guardian_signatures: vec![],
        created_at: 0, // Would use Clock sysvar in production
    };

    let serialized = record.try_to_vec()?;
    let space = serialized.len() + 32 * bridge_state.guardian_set.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            user.key,
            transfer_record_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            user.clone(),
            transfer_record_account.clone(),
            system_program.clone(),
        ],
        &[&[b"transfer", &nonce.to_le_bytes(), &[record_bump]]],
    )?;

    record.serialize(&mut &mut transfer_record_account.data.borrow_mut()[..])?;
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Locked {} tokens on Prism for Solana transfer, nonce {}",
        amount,
        nonce
    );
    Ok(())
}

fn process_mint_token(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    nonce: u64,
    amount: u64,
    sender_on_solana: Pubkey,
    recipient: Pubkey,
    _token_solana_mint: Pubkey,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let guardian = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let transfer_record_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;
    let recipient_token_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !guardian.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut bridge_state =
        SolanaBridgeState::try_from_slice(&bridge_state_account.data.borrow())?;

    // Verify guardian
    if !bridge_state.guardian_set.contains(guardian.key) {
        msg!("Signer is not a registered guardian");
        return Err(ProgramError::InvalidAccountData);
    }

    // Load or create transfer record
    let (record_pda, record_bump) = Pubkey::find_program_address(
        &[b"transfer", &nonce.to_le_bytes()],
        program_id,
    );
    if transfer_record_account.key != &record_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let mut record = if transfer_record_account.data_len() > 0
        && transfer_record_account.data.borrow()[0] != 0
    {
        TransferRecord::try_from_slice(&transfer_record_account.data.borrow())?
    } else {
        let new_record = TransferRecord {
            nonce,
            from_chain: 3, // Solana
            to_chain: 4,   // Prism
            token_mint: *mint_account.key,
            amount,
            sender: sender_on_solana,
            recipient,
            status: TransferStatus::Initiated,
            guardian_signatures: vec![],
            created_at: 0,
        };

        let serialized = new_record.try_to_vec()?;
        let space = serialized.len() + 32 * bridge_state.guardian_set.len();
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                guardian.key,
                transfer_record_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[
                guardian.clone(),
                transfer_record_account.clone(),
                system_program.clone(),
            ],
            &[&[b"transfer", &nonce.to_le_bytes(), &[record_bump]]],
        )?;

        new_record
    };

    // Add guardian signature
    if record.guardian_signatures.contains(guardian.key) {
        msg!("Guardian has already attested this transfer");
        return Err(ProgramError::InvalidArgument);
    }

    record.guardian_signatures.push(*guardian.key);

    // If threshold met, mint tokens
    if record.guardian_signatures.len() >= bridge_state.guardian_threshold as usize {
        let (authority_pda, authority_bump) =
            Pubkey::find_program_address(&[b"sol_mint_authority"], program_id);
        if mint_authority.key != &authority_pda {
            return Err(ProgramError::InvalidSeeds);
        }

        let mint_ix = spl_token::instruction::mint_to(
            token_program.key,
            mint_account.key,
            recipient_token_account.key,
            &authority_pda,
            &[],
            amount,
        )?;
        invoke_signed(
            &mint_ix,
            &[
                mint_account.clone(),
                recipient_token_account.clone(),
                mint_authority.clone(),
                token_program.clone(),
            ],
            &[&[b"sol_mint_authority", &[authority_bump]]],
        )?;

        record.status = TransferStatus::Completed;
        bridge_state.total_transfers += 1;

        msg!(
            "Minted {} tokens on Prism for Solana->Prism transfer nonce {}",
            amount,
            nonce
        );
    } else {
        record.status = TransferStatus::Attested;
        msg!(
            "Guardian attestation {}/{} for transfer nonce {}",
            record.guardian_signatures.len(),
            bridge_state.guardian_threshold,
            nonce
        );
    }

    record.serialize(&mut &mut transfer_record_account.data.borrow_mut()[..])?;
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    Ok(())
}

fn process_burn_and_release(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    recipient_on_solana: Pubkey,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let user = next_account_info(account_iter)?;
    let user_token_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let transfer_record_account = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if amount == 0 {
        msg!("Amount must be greater than zero");
        return Err(ProgramError::InvalidArgument);
    }

    let mut bridge_state =
        SolanaBridgeState::try_from_slice(&bridge_state_account.data.borrow())?;

    // Burn tokens on Prism
    let burn_ix = spl_token::instruction::burn(
        token_program.key,
        user_token_account.key,
        mint_account.key,
        user.key,
        &[],
        amount,
    )?;
    invoke(
        &burn_ix,
        &[
            user_token_account.clone(),
            mint_account.clone(),
            user.clone(),
            token_program.clone(),
        ],
    )?;

    // Create transfer record for relayer to observe
    bridge_state.nonce += 1;
    let nonce = bridge_state.nonce;

    let (record_pda, record_bump) = Pubkey::find_program_address(
        &[b"transfer", &nonce.to_le_bytes()],
        program_id,
    );
    if transfer_record_account.key != &record_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let record = TransferRecord {
        nonce,
        from_chain: 4, // Prism
        to_chain: 3,   // Solana
        token_mint: *mint_account.key,
        amount,
        sender: *user.key,
        recipient: recipient_on_solana,
        status: TransferStatus::Initiated,
        guardian_signatures: vec![],
        created_at: 0,
    };

    let serialized = record.try_to_vec()?;
    let space = serialized.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            user.key,
            transfer_record_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            user.clone(),
            transfer_record_account.clone(),
            system_program.clone(),
        ],
        &[&[b"transfer", &nonce.to_le_bytes(), &[record_bump]]],
    )?;

    record.serialize(&mut &mut transfer_record_account.data.borrow_mut()[..])?;
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Burned {} tokens on Prism for Solana release, nonce {}, recipient {}",
        amount,
        nonce,
        recipient_on_solana
    );
    Ok(())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transfer_status_serialization() {
        let status = TransferStatus::Completed;
        let serialized = status.try_to_vec().unwrap();
        let deserialized = TransferStatus::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized, TransferStatus::Completed);
    }

    #[test]
    fn test_token_mapping_serialization() {
        let mapping = TokenMapping {
            prism_mint: Pubkey::default(),
            solana_mint: Pubkey::default(),
            is_active: true,
        };
        let serialized = mapping.try_to_vec().unwrap();
        let deserialized = TokenMapping::try_from_slice(&serialized).unwrap();
        assert!(deserialized.is_active);
    }

    #[test]
    fn test_bridge_state_serialization() {
        let mut rpc = [0u8; 128];
        let rpc_str = b"http://localhost:8899";
        rpc[..rpc_str.len()].copy_from_slice(rpc_str);

        let state = SolanaBridgeState {
            is_initialized: true,
            admin: Pubkey::default(),
            solana_rpc: rpc,
            solana_rpc_len: rpc_str.len() as u8,
            guardian_set: vec![Pubkey::default()],
            guardian_threshold: 1,
            token_mappings: vec![],
            nonce: 0,
            total_transfers: 0,
        };
        let serialized = state.try_to_vec().unwrap();
        let deserialized = SolanaBridgeState::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized.solana_rpc_len, rpc_str.len() as u8);
    }
}
