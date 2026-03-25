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

solana_program::declare_id!("BtcBrdg11111111111111111111111111111111111");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct BtcBridgeState {
    pub is_initialized: bool,
    pub admin: Pubkey,
    /// Bitcoin multisig addresses controlled by the attestor set (as raw bytes)
    pub multisig_addresses: Vec<[u8; 34]>,
    /// Minimum attestor signatures required to confirm a deposit or withdrawal
    pub threshold: u8,
    /// Total satoshis locked in the bridge (represented on-chain)
    pub total_locked_sats: u64,
    /// SPL Token mint for scBTC (wrapped Bitcoin on Prism)
    pub scbtc_mint: Pubkey,
    /// List of attestor public keys
    pub attestors: Vec<Pubkey>,
    /// Monotonically increasing nonce
    pub nonce: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum DepositStatus {
    Pending,
    Confirmed,
    Minted,
    Failed,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct DepositProof {
    /// Bitcoin transaction ID (32 bytes, little-endian)
    pub btc_txid: [u8; 32],
    /// Output index in the Bitcoin transaction
    pub vout: u32,
    /// Amount in satoshis
    pub amount_sats: u64,
    /// Recipient's Prism public key
    pub recipient_pubkey: Pubkey,
    /// Number of Bitcoin confirmations observed by the submitting attestor
    pub confirmations: u32,
    /// Attestor public keys that have signed off on this deposit
    pub attestor_signatures: Vec<Pubkey>,
    /// Current status
    pub status: DepositStatus,
    /// Bridge nonce assigned to this deposit
    pub nonce: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum WithdrawalStatus {
    Requested,
    Signing,
    Broadcast,
    Confirmed,
    Failed,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct WithdrawalRequest {
    pub nonce: u64,
    /// Amount in satoshis to withdraw
    pub amount_sats: u64,
    /// Prism user who initiated the withdrawal
    pub requester: Pubkey,
    /// Bitcoin destination address (up to 62 bytes for bech32m)
    pub btc_destination: [u8; 62],
    /// Length of the actual address within btc_destination
    pub btc_destination_len: u8,
    /// Attestors that have co-signed the BTC release transaction
    pub attestor_signatures: Vec<Pubkey>,
    /// Status of the withdrawal
    pub status: WithdrawalStatus,
    /// Bitcoin txid once broadcast (zero until broadcast)
    pub btc_txid: [u8; 32],
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum BtcBridgeInstruction {
    /// Initialize the BTC bridge with an attestor set.
    ///
    /// Accounts:
    ///   0. `[writable, signer]` Admin / payer
    ///   1. `[writable]`         BtcBridgeState PDA
    ///   2. `[writable]`         scBTC mint PDA
    ///   3. `[]`                 SPL Token program
    ///   4. `[]`                 System program
    ///   5. `[]`                 Rent sysvar
    Initialize {
        multisig_addresses: Vec<[u8; 34]>,
        attestors: Vec<Pubkey>,
        threshold: u8,
    },

    /// Attestor submits proof that a BTC deposit was observed.
    ///
    /// Accounts:
    ///   0. `[signer]`          Attestor
    ///   1. `[writable]`        BtcBridgeState PDA
    ///   2. `[writable]`        DepositProof PDA (keyed by btc_txid + vout)
    ///   3. `[]`                System program
    SubmitDepositProof {
        btc_txid: [u8; 32],
        vout: u32,
        amount_sats: u64,
        recipient_pubkey: Pubkey,
        confirmations: u32,
    },

    /// After threshold attestations, mint scBTC to the recipient.
    ///
    /// Accounts:
    ///   0. `[signer]`          Any caller (relayer or user)
    ///   1. `[writable]`        BtcBridgeState PDA
    ///   2. `[writable]`        DepositProof PDA
    ///   3. `[writable]`        scBTC mint PDA
    ///   4. `[writable]`        Recipient's scBTC token account
    ///   5. `[]`                Mint authority PDA
    ///   6. `[]`                SPL Token program
    ConfirmDeposit {
        btc_txid: [u8; 32],
        vout: u32,
    },

    /// Burn scBTC and create a withdrawal request.
    ///
    /// Accounts:
    ///   0. `[signer]`          User
    ///   1. `[writable]`        User's scBTC token account
    ///   2. `[writable]`        scBTC mint
    ///   3. `[writable]`        BtcBridgeState PDA
    ///   4. `[writable]`        WithdrawalRequest PDA
    ///   5. `[]`                SPL Token program
    ///   6. `[]`                System program
    RequestWithdrawal {
        amount_sats: u64,
        btc_destination: [u8; 62],
        btc_destination_len: u8,
    },

    /// Attestor co-signs the BTC release transaction for a withdrawal.
    ///
    /// Accounts:
    ///   0. `[signer]`          Attestor
    ///   1. `[writable]`        BtcBridgeState PDA
    ///   2. `[writable]`        WithdrawalRequest PDA
    ProcessWithdrawal {
        nonce: u64,
        /// Bitcoin txid of the signed release transaction (set when broadcasting)
        btc_txid: [u8; 32],
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
    let instruction = BtcBridgeInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        BtcBridgeInstruction::Initialize {
            multisig_addresses,
            attestors,
            threshold,
        } => process_initialize(program_id, accounts, multisig_addresses, attestors, threshold),
        BtcBridgeInstruction::SubmitDepositProof {
            btc_txid,
            vout,
            amount_sats,
            recipient_pubkey,
            confirmations,
        } => process_submit_deposit_proof(
            program_id,
            accounts,
            btc_txid,
            vout,
            amount_sats,
            recipient_pubkey,
            confirmations,
        ),
        BtcBridgeInstruction::ConfirmDeposit { btc_txid, vout } => {
            process_confirm_deposit(program_id, accounts, btc_txid, vout)
        }
        BtcBridgeInstruction::RequestWithdrawal {
            amount_sats,
            btc_destination,
            btc_destination_len,
        } => process_request_withdrawal(
            program_id,
            accounts,
            amount_sats,
            btc_destination,
            btc_destination_len,
        ),
        BtcBridgeInstruction::ProcessWithdrawal { nonce, btc_txid } => {
            process_process_withdrawal(program_id, accounts, nonce, btc_txid)
        }
    }
}

// ---------------------------------------------------------------------------
// Processors
// ---------------------------------------------------------------------------

fn process_initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    multisig_addresses: Vec<[u8; 34]>,
    attestors: Vec<Pubkey>,
    threshold: u8,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let admin = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let scbtc_mint_account = next_account_info(account_iter)?;
    let _token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;
    let _rent_sysvar = next_account_info(account_iter)?;

    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if threshold == 0 || threshold as usize > attestors.len() {
        msg!("Invalid attestor threshold");
        return Err(ProgramError::InvalidArgument);
    }

    if multisig_addresses.is_empty() {
        msg!("At least one multisig address required");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive PDAs
    let (bridge_pda, bridge_bump) =
        Pubkey::find_program_address(&[b"btc_bridge_state"], program_id);
    if bridge_state_account.key != &bridge_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let (mint_pda, _mint_bump) =
        Pubkey::find_program_address(&[b"scbtc_mint"], program_id);
    if scbtc_mint_account.key != &mint_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let state = BtcBridgeState {
        is_initialized: true,
        admin: *admin.key,
        multisig_addresses,
        threshold,
        total_locked_sats: 0,
        scbtc_mint: mint_pda,
        attestors: attestors.clone(),
        nonce: 0,
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
        &[&[b"btc_bridge_state", &[bridge_bump]]],
    )?;

    state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "BTC bridge initialized with {} attestors, threshold {}, {} multisig addresses",
        attestors.len(),
        threshold,
        state.multisig_addresses.len()
    );
    Ok(())
}

fn process_submit_deposit_proof(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    btc_txid: [u8; 32],
    vout: u32,
    amount_sats: u64,
    recipient_pubkey: Pubkey,
    confirmations: u32,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let attestor = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let deposit_proof_account = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !attestor.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let bridge_state =
        BtcBridgeState::try_from_slice(&bridge_state_account.data.borrow())?;
    if !bridge_state.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    // Verify attestor is authorized
    if !bridge_state.attestors.contains(attestor.key) {
        msg!("Signer is not an authorized attestor");
        return Err(ProgramError::InvalidAccountData);
    }

    // Minimum 6 confirmations for Bitcoin
    if confirmations < 6 {
        msg!("Insufficient Bitcoin confirmations: {} (need 6)", confirmations);
        return Err(ProgramError::InvalidArgument);
    }

    // Derive deposit proof PDA
    let vout_bytes = vout.to_le_bytes();
    let (proof_pda, proof_bump) = Pubkey::find_program_address(
        &[b"deposit_proof", &btc_txid, &vout_bytes],
        program_id,
    );
    if deposit_proof_account.key != &proof_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    // Load existing or create new deposit proof
    let mut deposit_proof = if deposit_proof_account.data_len() > 0
        && deposit_proof_account.data.borrow()[0] != 0
    {
        DepositProof::try_from_slice(&deposit_proof_account.data.borrow())?
    } else {
        let proof = DepositProof {
            btc_txid,
            vout,
            amount_sats,
            recipient_pubkey,
            confirmations,
            attestor_signatures: vec![],
            status: DepositStatus::Pending,
            nonce: bridge_state.nonce + 1,
        };

        // Allocate account
        let serialized = proof.try_to_vec()?;
        // Reserve extra space for signatures
        let space = serialized.len() + 32 * bridge_state.attestors.len();
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                attestor.key,
                deposit_proof_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[
                attestor.clone(),
                deposit_proof_account.clone(),
                system_program.clone(),
            ],
            &[&[b"deposit_proof", &btc_txid, &vout_bytes, &[proof_bump]]],
        )?;

        proof
    };

    // Check for duplicate attestation
    if deposit_proof.attestor_signatures.contains(attestor.key) {
        msg!("Attestor has already submitted proof for this deposit");
        return Err(ProgramError::InvalidArgument);
    }

    deposit_proof.attestor_signatures.push(*attestor.key);

    // Update confirmations to the maximum observed
    if confirmations > deposit_proof.confirmations {
        deposit_proof.confirmations = confirmations;
    }

    // Check if threshold reached
    if deposit_proof.attestor_signatures.len() >= bridge_state.threshold as usize {
        deposit_proof.status = DepositStatus::Confirmed;
        msg!(
            "Deposit proof confirmed: txid {:?} vout {} amount {} sats ({}/{})",
            &btc_txid[..4],
            vout,
            amount_sats,
            deposit_proof.attestor_signatures.len(),
            bridge_state.threshold
        );
    } else {
        msg!(
            "Deposit proof attestation {}/{} for txid {:?}",
            deposit_proof.attestor_signatures.len(),
            bridge_state.threshold,
            &btc_txid[..4]
        );
    }

    deposit_proof.serialize(&mut &mut deposit_proof_account.data.borrow_mut()[..])?;

    Ok(())
}

fn process_confirm_deposit(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    btc_txid: [u8; 32],
    vout: u32,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let _caller = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let deposit_proof_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;
    let recipient_token_account = next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;

    let mut bridge_state =
        BtcBridgeState::try_from_slice(&bridge_state_account.data.borrow())?;
    let mut deposit_proof =
        DepositProof::try_from_slice(&deposit_proof_account.data.borrow())?;

    if deposit_proof.status != DepositStatus::Confirmed {
        msg!("Deposit not yet confirmed by threshold attestors");
        return Err(ProgramError::InvalidAccountData);
    }

    // Verify txid and vout match
    if deposit_proof.btc_txid != btc_txid || deposit_proof.vout != vout {
        msg!("Transaction ID or vout mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    // Derive mint authority PDA
    let (authority_pda, authority_bump) =
        Pubkey::find_program_address(&[b"btc_mint_authority"], program_id);
    if mint_authority.key != &authority_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    // Mint scBTC to recipient (1 sat = 1 token lamport with 8 decimals)
    let mint_ix = spl_token::instruction::mint_to(
        token_program.key,
        mint_account.key,
        recipient_token_account.key,
        &authority_pda,
        &[],
        deposit_proof.amount_sats,
    )?;
    invoke_signed(
        &mint_ix,
        &[
            mint_account.clone(),
            recipient_token_account.clone(),
            mint_authority.clone(),
            token_program.clone(),
        ],
        &[&[b"btc_mint_authority", &[authority_bump]]],
    )?;

    deposit_proof.status = DepositStatus::Minted;
    bridge_state.total_locked_sats += deposit_proof.amount_sats;

    deposit_proof.serialize(&mut &mut deposit_proof_account.data.borrow_mut()[..])?;
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Minted {} scBTC (sats) to recipient for BTC txid {:?}",
        deposit_proof.amount_sats,
        &btc_txid[..4]
    );
    Ok(())
}

fn process_request_withdrawal(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount_sats: u64,
    btc_destination: [u8; 62],
    btc_destination_len: u8,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let user = next_account_info(account_iter)?;
    let user_token_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let withdrawal_account = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if amount_sats == 0 {
        msg!("Withdrawal amount must be greater than zero");
        return Err(ProgramError::InvalidArgument);
    }

    // Minimum withdrawal: 10,000 sats (to cover BTC fees)
    if amount_sats < 10_000 {
        msg!("Minimum withdrawal is 10,000 sats");
        return Err(ProgramError::InvalidArgument);
    }

    let mut bridge_state =
        BtcBridgeState::try_from_slice(&bridge_state_account.data.borrow())?;

    // Burn scBTC
    let burn_ix = spl_token::instruction::burn(
        token_program.key,
        user_token_account.key,
        mint_account.key,
        user.key,
        &[],
        amount_sats,
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

    // Create withdrawal request
    bridge_state.nonce += 1;
    bridge_state.total_locked_sats = bridge_state.total_locked_sats.saturating_sub(amount_sats);
    let nonce = bridge_state.nonce;

    let (withdrawal_pda, withdrawal_bump) = Pubkey::find_program_address(
        &[b"withdrawal", &nonce.to_le_bytes()],
        program_id,
    );
    if withdrawal_account.key != &withdrawal_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let withdrawal = WithdrawalRequest {
        nonce,
        amount_sats,
        requester: *user.key,
        btc_destination,
        btc_destination_len,
        attestor_signatures: vec![],
        status: WithdrawalStatus::Requested,
        btc_txid: [0u8; 32],
    };

    let serialized = withdrawal.try_to_vec()?;
    let space = serialized.len() + 32 * bridge_state.attestors.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            user.key,
            withdrawal_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            user.clone(),
            withdrawal_account.clone(),
            system_program.clone(),
        ],
        &[&[b"withdrawal", &nonce.to_le_bytes(), &[withdrawal_bump]]],
    )?;

    withdrawal.serialize(&mut &mut withdrawal_account.data.borrow_mut()[..])?;
    bridge_state.serialize(&mut &mut bridge_state_account.data.borrow_mut()[..])?;

    msg!(
        "Withdrawal requested: {} sats, nonce {}, destination len {}",
        amount_sats,
        nonce,
        btc_destination_len
    );
    Ok(())
}

fn process_process_withdrawal(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    nonce: u64,
    btc_txid: [u8; 32],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let attestor = next_account_info(account_iter)?;
    let bridge_state_account = next_account_info(account_iter)?;
    let withdrawal_account = next_account_info(account_iter)?;

    if !attestor.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let bridge_state =
        BtcBridgeState::try_from_slice(&bridge_state_account.data.borrow())?;

    if !bridge_state.attestors.contains(attestor.key) {
        msg!("Signer is not an authorized attestor");
        return Err(ProgramError::InvalidAccountData);
    }

    let mut withdrawal =
        WithdrawalRequest::try_from_slice(&withdrawal_account.data.borrow())?;

    if withdrawal.nonce != nonce {
        msg!("Nonce mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    if withdrawal.status == WithdrawalStatus::Confirmed
        || withdrawal.status == WithdrawalStatus::Failed
    {
        msg!("Withdrawal already finalized");
        return Err(ProgramError::InvalidAccountData);
    }

    // Check for duplicate signature
    if withdrawal.attestor_signatures.contains(attestor.key) {
        msg!("Attestor has already signed this withdrawal");
        return Err(ProgramError::InvalidArgument);
    }

    withdrawal.attestor_signatures.push(*attestor.key);
    withdrawal.status = WithdrawalStatus::Signing;

    // If threshold reached, mark as broadcast and record the BTC txid
    if withdrawal.attestor_signatures.len() >= bridge_state.threshold as usize {
        withdrawal.btc_txid = btc_txid;
        withdrawal.status = WithdrawalStatus::Broadcast;
        msg!(
            "Withdrawal nonce {} fully signed and broadcast, BTC txid: {:?}",
            nonce,
            &btc_txid[..4]
        );
    } else {
        msg!(
            "Withdrawal nonce {} signature {}/{}",
            nonce,
            withdrawal.attestor_signatures.len(),
            bridge_state.threshold
        );
    }

    withdrawal.serialize(&mut &mut withdrawal_account.data.borrow_mut()[..])?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deposit_status_serialization() {
        let status = DepositStatus::Confirmed;
        let serialized = status.try_to_vec().unwrap();
        let deserialized = DepositStatus::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized, DepositStatus::Confirmed);
    }

    #[test]
    fn test_bridge_state_serialization() {
        let state = BtcBridgeState {
            is_initialized: true,
            admin: Pubkey::default(),
            multisig_addresses: vec![[0u8; 34]],
            threshold: 2,
            total_locked_sats: 100_000_000, // 1 BTC
            scbtc_mint: Pubkey::default(),
            attestors: vec![Pubkey::default(), Pubkey::default()],
            nonce: 0,
        };
        let serialized = state.try_to_vec().unwrap();
        let deserialized = BtcBridgeState::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized.total_locked_sats, 100_000_000);
        assert_eq!(deserialized.threshold, 2);
    }

    #[test]
    fn test_withdrawal_status_serialization() {
        let status = WithdrawalStatus::Broadcast;
        let serialized = status.try_to_vec().unwrap();
        let deserialized = WithdrawalStatus::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized, WithdrawalStatus::Broadcast);
    }
}
