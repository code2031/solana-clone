use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

// ---------------------------------------------------------------------------
// Program ID
// ---------------------------------------------------------------------------

solana_program::declare_id!("EthBrdg11111111111111111111111111111111111");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct BridgeState {
    pub is_initialized: bool,
    pub admin: Pubkey,
    /// Address of the bridge contract on Ethereum (20-byte hex stored as [u8; 20])
    pub ethereum_contract_address: [u8; 20],
    /// Total token-lamports locked on SolClone side
    pub total_locked: u64,
    /// Total token-lamports minted as wrapped tokens
    pub total_minted: u64,
    /// Monotonically increasing nonce for each bridge transaction
    pub nonce: u64,
    /// Public keys of the guardian set (validators that attest cross-chain events)
    pub guardians: Vec<Pubkey>,
    /// Minimum number of guardian signatures required
    pub guardian_threshold: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct WrappedToken {
    pub is_initialized: bool,
    /// Source chain identifier (1 = Ethereum, 2 = Bitcoin, 3 = Solana)
    pub original_chain: u8,
    /// Original token address on the source chain (e.g. ERC-20 contract address)
    pub original_address: [u8; 32],
    /// SPL Token mint on SolClone that represents this wrapped asset
    pub mint: Pubkey,
    pub name: [u8; 32],
    pub symbol: [u8; 8],
    pub decimals: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Completed,
    Failed,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct BridgeTransaction {
    pub nonce: u64,
    /// 1 = Ethereum, 2 = Bitcoin, 3 = Solana, 4 = SolClone
    pub from_chain: u8,
    pub to_chain: u8,
    /// Wrapped token mint on SolClone
    pub token: Pubkey,
    pub amount: u64,
    /// Sender address on source chain (padded to 32 bytes)
    pub sender: [u8; 32],
    /// Recipient pubkey on destination chain (padded to 32 bytes)
    pub recipient: [u8; 32],
    pub status: TransactionStatus,
    /// Guardian pubkeys that have signed off on this transaction
    pub signatures: Vec<Pubkey>,
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum BridgeInstruction {
    /// Initialize the bridge with a guardian set.
    ///
    /// Accounts:
    ///   0. `[writable, signer]` Admin / payer
    ///   1. `[writable]`         Bridge state PDA
    ///   2. `[]`                 System program
    InitializeBridge {
        ethereum_contract_address: [u8; 20],
        guardians: Vec<Pubkey>,
        guardian_threshold: u8,
    },

    /// Register an ERC-20 token for bridging and create a wrapped SPL mint.
    ///
    /// Accounts:
    ///   0. `[signer]`          Admin
    ///   1. `[writable]`        Bridge state PDA
    ///   2. `[writable]`        Wrapped-token metadata PDA
    ///   3. `[writable]`        New SPL Token mint (PDA)
    ///   4. `[]`                SPL Token program
    ///   5. `[]`                System program
    ///   6. `[]`                Rent sysvar
    RegisterToken {
        original_chain: u8,
        original_address: [u8; 32],
        name: [u8; 32],
        symbol: [u8; 8],
        decimals: u8,
    },

    /// Lock tokens on SolClone side (when user wants to bridge OUT to Ethereum).
    ///
    /// Accounts:
    ///   0. `[signer]`          User
    ///   1. `[writable]`        User's token account (source)
    ///   2. `[writable]`        Bridge vault token account
    ///   3. `[writable]`        Bridge state PDA
    ///   4. `[writable]`        BridgeTransaction PDA
    ///   5. `[]`                SPL Token program
    ///   6. `[]`                System program
    LockAndMint {
        amount: u64,
        recipient_eth_address: [u8; 20],
    },

    /// Guardian submits a signed attestation of a deposit observed on Ethereum.
    ///
    /// Accounts:
    ///   0. `[signer]`          Guardian
    ///   1. `[writable]`        Bridge state PDA
    ///   2. `[writable]`        BridgeTransaction PDA
    SubmitVaa {
        nonce: u64,
        amount: u64,
        sender_eth_address: [u8; 20],
        recipient: Pubkey,
        token_original_address: [u8; 32],
    },

    /// After the guardian threshold is reached, mint wrapped tokens to the recipient.
    ///
    /// Accounts:
    ///   0. `[signer]`          Any relayer or user
    ///   1. `[writable]`        Bridge state PDA
    ///   2. `[writable]`        BridgeTransaction PDA
    ///   3. `[writable]`        Wrapped token mint (PDA)
    ///   4. `[writable]`        Recipient token account
    ///   5. `[]`                Mint authority PDA
    ///   6. `[]`                SPL Token program
    CompleteTransfer { nonce: u64 },

    /// Burn wrapped tokens on SolClone and emit an event so the Ethereum-side
    /// relayer can release the original ERC-20 tokens.
    ///
    /// Accounts:
    ///   0. `[signer]`          User
    ///   1. `[writable]`        User's wrapped-token account
    ///   2. `[writable]`        Wrapped token mint
    ///   3. `[writable]`        Bridge state PDA
    ///   4. `[writable]`        BridgeTransaction PDA
    ///   5. `[]`                SPL Token program
    ///   6. `[]`                System program
    Redeem {
        amount: u64,
        recipient_eth_address: [u8; 20],
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
    let instruction = BridgeInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        BridgeInstruction::InitializeBridge {
            ethereum_contract_address,
            guardians,
            guardian_threshold,
        } => process_initialize_bridge(
            program_id,
            accounts,
            ethereum_contract_address,
            guardians,
            guardian_threshold,
        ),
        BridgeInstruction::RegisterToken {
            original_chain,
            original_address,
            name,
            symbol,
            decimals,
        } => process_register_token(
            program_id,
            accounts,
            original_chain,
            original_address,
            name,
            symbol,
            decimals,
        ),
        BridgeInstruction::LockAndMint {
            amount,
            recipient_eth_address,
        } => process_lock_and_mint(program_id, accounts, amount, recipient_eth_address),
        BridgeInstruction::SubmitVaa {
            nonce,
            amount,
            sender_eth_address,
            recipient,
            token_original_address,
        } => process_submit_vaa(
            program_id,
            accounts,
            nonce,
            amount,
            sender_eth_address,
            recipient,
            token_original_address,
        ),
        BridgeInstruction::CompleteTransfer { nonce } => {
            process_complete_transfer(program_id, accounts, nonce)
        }
        BridgeInstruction::Redeem {
            amount,
            recipient_eth_address,
        } => process_redeem(program_id, accounts, amount, recipient_eth_address),
    }
}

// ---------------------------------------------------------------------------
// Processors
// ---------------------------------------------------------------------------

fn process_initialize_bridge(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    ethereum_contract_address: [u8; 20],
    guardians: Vec<Pubkey>,
    guardian_threshold: u8,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let admin = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if guardian_threshold == 0 || guardian_threshold as usize > guardians.len() {
        msg!("Invalid guardian threshold");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive PDA for bridge state
    let (bridge_pda, bump) =
        Pubkey::find_program_address(&[b"bridge_state"], program_id);
    if bridge_state_account.key != &bridge_pda {
        msg!("Invalid bridge state PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Calculate space needed
    let state = BridgeState {
        is_initialized: true,
        admin: *admin.key,
        ethereum_contract_address,
        total_locked: 0,
        total_minted: 0,
        nonce: 0,
        guardians: guardians.clone(),
        guardian_threshold,
    };
    let serialized = state.try_to_vec()?;
    let space = serialized.len();

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
        &[&[b"bridge_state", &[bump]]],
    )?;

    state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Ethereum bridge initialized with {} guardians, threshold {}",
        guardians.len(),
        guardian_threshold
    );
    Ok(())
}

fn process_register_token(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    original_chain: u8,
    original_address: [u8; 32],
    name: [u8; 32],
    symbol: [u8; 8],
    decimals: u8,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let admin = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let wrapped_token_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;
    let _token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;
    let _rent_sysvar = next_account_info(account_iter)?;

    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let bridge_state = BridgeState::try_from_slice(&bridge_state_account.data.borrow())?;
    if !bridge_state.is_initialized {
        msg!("Bridge not initialized");
        return Err(ProgramError::UninitializedAccount);
    }
    if bridge_state.admin != *admin.key {
        msg!("Only admin can register tokens");
        return Err(ProgramError::InvalidAccountData);
    }

    // Derive PDA for wrapped token metadata
    let (wrapped_pda, wrapped_bump) =
        Pubkey::find_program_address(&[b"wrapped_token", &original_address], program_id);
    if wrapped_token_account.key != &wrapped_pda {
        msg!("Invalid wrapped token PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Derive PDA for the mint
    let (mint_pda, _mint_bump) =
        Pubkey::find_program_address(&[b"mint", &original_address], program_id);
    if mint_account.key != &mint_pda {
        msg!("Invalid mint PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    let wrapped_token = WrappedToken {
        is_initialized: true,
        original_chain,
        original_address,
        mint: mint_pda,
        name,
        symbol,
        decimals,
    };

    let serialized = wrapped_token.try_to_vec()?;
    let space = serialized.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            admin.key,
            wrapped_token_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            admin.clone(),
            wrapped_token_account.clone(),
            system_program.clone(),
        ],
        &[&[b"wrapped_token", &original_address, &[wrapped_bump]]],
    )?;

    wrapped_token.serialize(&mut &mut wrapped_token_account.data.borrow_mut()[..])?;

    msg!(
        "Registered wrapped token for chain {} with {} decimals",
        original_chain,
        decimals
    );
    Ok(())
}

fn process_lock_and_mint(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    recipient_eth_address: [u8; 20],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let user = next_account_info(account_iter)?;
    let user_token_account = next_account_info(account_iter)?;
    let vault_token_account = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let bridge_tx_account = next_account_info(account_iter)?;
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
        BridgeState::try_from_slice(&bridge_state_account.data.borrow())?;
    if !bridge_state.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    // Transfer tokens from user to bridge vault
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

    // Increment nonce and create bridge transaction
    bridge_state.nonce += 1;
    bridge_state.total_locked += amount;
    let nonce = bridge_state.nonce;

    let (tx_pda, tx_bump) = Pubkey::find_program_address(
        &[b"bridge_tx", &nonce.to_le_bytes()],
        program_id,
    );
    if bridge_tx_account.key != &tx_pda {
        msg!("Invalid bridge transaction PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    let mut recipient_padded = [0u8; 32];
    recipient_padded[12..32].copy_from_slice(&recipient_eth_address);

    let bridge_tx = BridgeTransaction {
        nonce,
        from_chain: 4, // SolClone
        to_chain: 1,   // Ethereum
        token: *vault_token_account.key, // Simplified — in production use the mint
        amount,
        sender: user.key.to_bytes(),
        recipient: recipient_padded,
        status: TransactionStatus::Pending,
        signatures: vec![],
    };

    let serialized = bridge_tx.try_to_vec()?;
    let space = serialized.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            user.key,
            bridge_tx_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            user.clone(),
            bridge_tx_account.clone(),
            system_program.clone(),
        ],
        &[&[b"bridge_tx", &nonce.to_le_bytes(), &[tx_bump]]],
    )?;

    bridge_tx.serialize(&mut &mut bridge_tx_account.data.borrow_mut()[..])?;

    // Re-serialize bridge state
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Locked {} tokens for bridge to Ethereum, nonce {}",
        amount,
        nonce
    );
    Ok(())
}

fn process_submit_vaa(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    nonce: u64,
    amount: u64,
    sender_eth_address: [u8; 20],
    recipient: Pubkey,
    token_original_address: [u8; 32],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let guardian = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let bridge_tx_account = next_account_info(account_iter)?;

    if !guardian.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let bridge_state =
        BridgeState::try_from_slice(&bridge_state_account.data.borrow())?;
    if !bridge_state.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    // Verify the signer is a guardian
    if !bridge_state.guardians.contains(guardian.key) {
        msg!("Signer is not a registered guardian");
        return Err(ProgramError::InvalidAccountData);
    }

    // Load or initialize bridge transaction
    let mut bridge_tx = if bridge_tx_account.data_len() > 0 && bridge_tx_account.data.borrow()[0] != 0
    {
        BridgeTransaction::try_from_slice(&bridge_tx_account.data.borrow())?
    } else {
        let mut sender_padded = [0u8; 32];
        sender_padded[12..32].copy_from_slice(&sender_eth_address);

        BridgeTransaction {
            nonce,
            from_chain: 1, // Ethereum
            to_chain: 4,   // SolClone
            token: Pubkey::new_from_array(token_original_address),
            amount,
            sender: sender_padded,
            recipient: recipient.to_bytes(),
            status: TransactionStatus::Pending,
            signatures: vec![],
        }
    };

    // Check for duplicate signature
    if bridge_tx.signatures.contains(guardian.key) {
        msg!("Guardian has already signed this transaction");
        return Err(ProgramError::InvalidArgument);
    }

    bridge_tx.signatures.push(*guardian.key);

    // If threshold reached, mark as Confirmed
    if bridge_tx.signatures.len() >= bridge_state.guardian_threshold as usize {
        bridge_tx.status = TransactionStatus::Confirmed;
        msg!(
            "VAA nonce {} reached guardian threshold ({}/{})",
            nonce,
            bridge_tx.signatures.len(),
            bridge_state.guardian_threshold
        );
    } else {
        msg!(
            "VAA nonce {} signature {}/{}",
            nonce,
            bridge_tx.signatures.len(),
            bridge_state.guardian_threshold
        );
    }

    bridge_tx.serialize(&mut &mut bridge_tx_account.data.borrow_mut()[..])?;

    Ok(())
}

fn process_complete_transfer(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    nonce: u64,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let _relayer = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let bridge_tx_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;
    let recipient_token_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;

    let mut bridge_state =
        BridgeState::try_from_slice(&bridge_state_account.data.borrow())?;
    let mut bridge_tx =
        BridgeTransaction::try_from_slice(&bridge_tx_account.data.borrow())?;

    if bridge_tx.status != TransactionStatus::Confirmed {
        msg!("Transaction not yet confirmed by guardians");
        return Err(ProgramError::InvalidAccountData);
    }

    if bridge_tx.nonce != nonce {
        msg!("Nonce mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive mint authority PDA
    let (authority_pda, authority_bump) =
        Pubkey::find_program_address(&[b"mint_authority"], program_id);
    if mint_authority.key != &authority_pda {
        msg!("Invalid mint authority PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Mint wrapped tokens to recipient
    let mint_ix = spl_token::instruction::mint_to(
        token_program.key,
        mint_account.key,
        recipient_token_account.key,
        &authority_pda,
        &[],
        bridge_tx.amount,
    )?;
    invoke_signed(
        &mint_ix,
        &[
            mint_account.clone(),
            recipient_token_account.clone(),
            mint_authority.clone(),
            token_program.clone(),
        ],
        &[&[b"mint_authority", &[authority_bump]]],
    )?;

    bridge_tx.status = TransactionStatus::Completed;
    bridge_state.total_minted += bridge_tx.amount;

    bridge_tx.serialize(&mut &mut bridge_tx_account.data.borrow_mut()[..])?;
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Completed transfer: minted {} wrapped tokens for nonce {}",
        bridge_tx.amount,
        nonce
    );
    Ok(())
}

fn process_redeem(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    recipient_eth_address: [u8; 20],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let user = next_account_info(account_iter)?;
    let user_token_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let bridge_tx_account = next_account_info(account_iter)?;
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
        BridgeState::try_from_slice(&bridge_state_account.data.borrow())?;

    // Burn wrapped tokens
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

    // Create redemption bridge transaction
    bridge_state.nonce += 1;
    bridge_state.total_minted = bridge_state.total_minted.saturating_sub(amount);
    let nonce = bridge_state.nonce;

    let (tx_pda, tx_bump) = Pubkey::find_program_address(
        &[b"bridge_tx", &nonce.to_le_bytes()],
        program_id,
    );
    if bridge_tx_account.key != &tx_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let mut recipient_padded = [0u8; 32];
    recipient_padded[12..32].copy_from_slice(&recipient_eth_address);

    let bridge_tx = BridgeTransaction {
        nonce,
        from_chain: 4, // SolClone
        to_chain: 1,   // Ethereum
        token: *mint_account.key,
        amount,
        sender: user.key.to_bytes(),
        recipient: recipient_padded,
        status: TransactionStatus::Pending,
        signatures: vec![],
    };

    let serialized = bridge_tx.try_to_vec()?;
    let space = serialized.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            user.key,
            bridge_tx_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            user.clone(),
            bridge_tx_account.clone(),
            system_program.clone(),
        ],
        &[&[b"bridge_tx", &nonce.to_le_bytes(), &[tx_bump]]],
    )?;

    bridge_tx.serialize(&mut &mut bridge_tx_account.data.borrow_mut()[..])?;
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Redeemed {} tokens for Ethereum release, nonce {}",
        amount,
        nonce
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
    fn test_transaction_status_serialization() {
        let status = TransactionStatus::Pending;
        let serialized = status.try_to_vec().unwrap();
        let deserialized = TransactionStatus::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized, TransactionStatus::Pending);
    }

    #[test]
    fn test_bridge_state_serialization() {
        let state = BridgeState {
            is_initialized: true,
            admin: Pubkey::default(),
            ethereum_contract_address: [0u8; 20],
            total_locked: 1000,
            total_minted: 500,
            nonce: 42,
            guardians: vec![Pubkey::default()],
            guardian_threshold: 1,
        };
        let serialized = state.try_to_vec().unwrap();
        let deserialized = BridgeState::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized.total_locked, 1000);
        assert_eq!(deserialized.nonce, 42);
    }
}
