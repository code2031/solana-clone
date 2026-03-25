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

solana_program::declare_id!("Priv11111111111111111111111111111111111111");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Depth of the Merkle tree for commitments.
/// Supports up to 2^20 = 1,048,576 shielded notes per pool.
const MERKLE_TREE_DEPTH: usize = 20;

/// Placeholder for the zero hash at each level of the Merkle tree.
const ZERO_HASH: [u8; 32] = [0u8; 32];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ShieldedPool {
    pub is_initialized: bool,
    pub admin: Pubkey,
    /// SPL Token mint for the token in this pool
    pub token_mint: Pubkey,
    /// Total amount of tokens currently shielded in this pool
    pub total_shielded: u64,
    /// Root of the Merkle tree of commitments
    pub merkle_root: [u8; 32],
    /// Number of commitments inserted so far (also the next leaf index)
    pub next_leaf_index: u64,
    /// Number of nullifiers that have been spent
    pub nullifier_set_size: u64,
    /// Pool vault token account (holds the shielded tokens)
    pub vault: Pubkey,
}

/// A shielded note is a commitment in the Merkle tree.
/// commitment = hash(amount || randomness || owner_pubkey)
/// The encrypted_data allows the owner to decrypt and reconstruct the note.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ShieldedNote {
    /// Pedersen or Poseidon commitment: H(amount || randomness || owner)
    pub commitment: [u8; 32],
    /// Encrypted note data (amount, randomness) encrypted with the owner's public key.
    /// In production this would use ECIES or a similar scheme.
    pub encrypted_data: Vec<u8>,
    /// Leaf index in the Merkle tree
    pub leaf_index: u64,
}

/// A nullifier marks a note as spent. Once a nullifier is revealed,
/// the corresponding commitment can never be spent again.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Nullifier {
    /// nullifier = hash(commitment || spending_key)
    pub hash: [u8; 32],
    pub is_spent: bool,
}

/// Placeholder for a zero-knowledge proof.
/// In production, this would be a Groth16, PLONK, or Bulletproof.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ZkProof {
    /// Serialized proof bytes (placeholder: we accept any non-empty proof)
    pub proof_data: Vec<u8>,
    /// Public inputs to the proof circuit
    pub public_inputs: Vec<[u8; 32]>,
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum PrivacyInstruction {
    /// Initialize a shielded pool for a specific SPL token.
    ///
    /// Accounts:
    ///   0. `[writable, signer]` Admin / payer
    ///   1. `[writable]`         ShieldedPool PDA
    ///   2. `[writable]`         Vault token account PDA
    ///   3. `[]`                 Token mint
    ///   4. `[]`                 SPL Token program
    ///   5. `[]`                 System program
    ///   6. `[]`                 Rent sysvar
    InitializePool,

    /// Shield (deposit) public tokens into the shielded pool.
    /// Creates a commitment note in the Merkle tree.
    ///
    /// Accounts:
    ///   0. `[signer]`          User (depositor)
    ///   1. `[writable]`        User's token account
    ///   2. `[writable]`        Pool vault token account
    ///   3. `[writable]`        ShieldedPool PDA
    ///   4. `[writable]`        ShieldedNote PDA (new commitment)
    ///   5. `[]`                SPL Token program
    ///   6. `[]`                System program
    Shield {
        /// Amount of tokens to shield
        amount: u64,
        /// The commitment hash: H(amount || randomness || owner_pubkey)
        commitment: [u8; 32],
        /// Encrypted note data for the recipient to decrypt
        encrypted_data: Vec<u8>,
    },

    /// Transfer within the shielded pool.
    /// Consumes input notes (by revealing nullifiers) and creates new output notes.
    /// Includes a ZK proof that:
    ///   - The input notes exist in the Merkle tree
    ///   - The nullifiers correspond to the input notes
    ///   - The sum of inputs equals the sum of outputs
    ///   - The sender knows the spending keys for the input notes
    ///
    /// Accounts:
    ///   0. `[signer]`          Sender (pays transaction fee)
    ///   1. `[writable]`        ShieldedPool PDA
    ///   2..n. `[writable]`     Nullifier PDAs (one per input)
    ///   n+1..m. `[writable]`   ShieldedNote PDAs (one per output, new commitments)
    ///   m+1. `[]`              System program
    TransferShielded {
        /// Nullifier hashes for input notes being consumed
        nullifiers: Vec<[u8; 32]>,
        /// Output commitments (new notes)
        output_commitments: Vec<[u8; 32]>,
        /// Encrypted data for each output note
        output_encrypted_data: Vec<Vec<u8>>,
        /// Zero-knowledge proof (placeholder)
        proof: ZkProof,
    },

    /// Unshield (withdraw) tokens from the pool back to a public account.
    /// Reveals the amount and burns the commitment.
    ///
    /// Accounts:
    ///   0. `[signer]`          User (withdrawer)
    ///   1. `[writable]`        User's token account (destination)
    ///   2. `[writable]`        Pool vault token account
    ///   3. `[writable]`        ShieldedPool PDA
    ///   4. `[writable]`        Nullifier PDA (for the note being spent)
    ///   5. `[]`                Vault authority PDA
    ///   6. `[]`                SPL Token program
    ///   7. `[]`                System program
    Unshield {
        /// Amount to withdraw (revealed publicly)
        amount: u64,
        /// Nullifier for the note being spent
        nullifier: [u8; 32],
        /// Zero-knowledge proof that the nullifier corresponds to a valid
        /// unspent note in the Merkle tree with the specified amount
        proof: ZkProof,
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
    let instruction = PrivacyInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        PrivacyInstruction::InitializePool => {
            process_initialize_pool(program_id, accounts)
        }
        PrivacyInstruction::Shield {
            amount,
            commitment,
            encrypted_data,
        } => process_shield(program_id, accounts, amount, commitment, encrypted_data),
        PrivacyInstruction::TransferShielded {
            nullifiers,
            output_commitments,
            output_encrypted_data,
            proof,
        } => process_transfer_shielded(
            program_id,
            accounts,
            nullifiers,
            output_commitments,
            output_encrypted_data,
            proof,
        ),
        PrivacyInstruction::Unshield {
            amount,
            nullifier,
            proof,
        } => process_unshield(program_id, accounts, amount, nullifier, proof),
    }
}

// ---------------------------------------------------------------------------
// Processors
// ---------------------------------------------------------------------------

fn process_initialize_pool(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let admin = next_account_info(account_iter)?;
    let pool_account = next_account_info(account_iter)?;
    let vault_account = next_account_info(account_iter)?;
    let token_mint = next_account_info(account_iter)?;
    let _token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;
    let _rent_sysvar = next_account_info(account_iter)?;

    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Derive pool PDA keyed by token mint
    let (pool_pda, pool_bump) = Pubkey::find_program_address(
        &[b"shielded_pool", token_mint.key.as_ref()],
        program_id,
    );
    if pool_account.key != &pool_pda {
        msg!("Invalid shielded pool PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Derive vault PDA
    let (vault_pda, _vault_bump) = Pubkey::find_program_address(
        &[b"pool_vault", token_mint.key.as_ref()],
        program_id,
    );
    if vault_account.key != &vault_pda {
        msg!("Invalid vault PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Initialize empty Merkle root (all zeros = empty tree)
    let empty_root = compute_empty_root();

    let pool = ShieldedPool {
        is_initialized: true,
        admin: *admin.key,
        token_mint: *token_mint.key,
        total_shielded: 0,
        merkle_root: empty_root,
        next_leaf_index: 0,
        nullifier_set_size: 0,
        vault: vault_pda,
    };

    let serialized = pool.try_to_vec()?;
    let space = serialized.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            admin.key,
            pool_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            admin.clone(),
            pool_account.clone(),
            system_program.clone(),
        ],
        &[&[b"shielded_pool", token_mint.key.as_ref(), &[pool_bump]]],
    )?;

    pool.serialize(&mut &mut pool_account.data.borrow_mut()[..])?;

    msg!(
        "Shielded pool initialized for token mint {}",
        token_mint.key
    );
    Ok(())
}

fn process_shield(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    commitment: [u8; 32],
    encrypted_data: Vec<u8>,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let user = next_account_info(account_iter)?;
    let user_token_account = next_account_info(account_iter)?;
    let vault_account = next_account_info(account_iter)?;
    let pool_account = next_account_info(account_iter)?;
    let note_account = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if amount == 0 {
        msg!("Shield amount must be greater than zero");
        return Err(ProgramError::InvalidArgument);
    }

    let mut pool = ShieldedPool::try_from_slice(&pool_account.data.borrow())?;
    if !pool.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    // Transfer tokens from user to vault
    let transfer_ix = spl_token::instruction::transfer(
        token_program.key,
        user_token_account.key,
        vault_account.key,
        user.key,
        &[],
        amount,
    )?;
    invoke(
        &transfer_ix,
        &[
            user_token_account.clone(),
            vault_account.clone(),
            user.clone(),
            token_program.clone(),
        ],
    )?;

    // Create the shielded note
    let leaf_index = pool.next_leaf_index;
    let (note_pda, note_bump) = Pubkey::find_program_address(
        &[b"note", &leaf_index.to_le_bytes()],
        program_id,
    );
    if note_account.key != &note_pda {
        msg!("Invalid note PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    let note = ShieldedNote {
        commitment,
        encrypted_data,
        leaf_index,
    };

    let serialized = note.try_to_vec()?;
    let space = serialized.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            user.key,
            note_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            user.clone(),
            note_account.clone(),
            system_program.clone(),
        ],
        &[&[b"note", &leaf_index.to_le_bytes(), &[note_bump]]],
    )?;

    note.serialize(&mut &mut note_account.data.borrow_mut()[..])?;

    // Update pool state
    pool.total_shielded += amount;
    pool.next_leaf_index += 1;
    // Update Merkle root (simplified: in production use incremental Merkle tree)
    pool.merkle_root = compute_new_root(&commitment, leaf_index as usize);

    pool.serialize(&mut &mut pool_account.data.borrow_mut()[..])?;

    msg!(
        "Shielded {} tokens into pool, leaf index {}, commitment {:?}",
        amount,
        leaf_index,
        &commitment[..4]
    );
    Ok(())
}

fn process_transfer_shielded(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    nullifiers: Vec<[u8; 32]>,
    output_commitments: Vec<[u8; 32]>,
    output_encrypted_data: Vec<Vec<u8>>,
    proof: ZkProof,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let sender = next_account_info(account_iter)?;
    let pool_account = next_account_info(account_iter)?;

    if !sender.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate proof (placeholder: accept any non-empty proof)
    if !verify_zk_proof(&proof) {
        msg!("ZK proof verification failed");
        return Err(ProgramError::InvalidArgument);
    }

    let mut pool = ShieldedPool::try_from_slice(&pool_account.data.borrow())?;
    if !pool.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    if output_commitments.len() != output_encrypted_data.len() {
        msg!("Output commitments and encrypted data length mismatch");
        return Err(ProgramError::InvalidArgument);
    }

    // Process nullifiers (mark input notes as spent)
    for nullifier_hash in &nullifiers {
        let nullifier_account = next_account_info(account_iter)?;

        let (nullifier_pda, nullifier_bump) = Pubkey::find_program_address(
            &[b"nullifier", nullifier_hash],
            program_id,
        );
        if nullifier_account.key != &nullifier_pda {
            msg!("Invalid nullifier PDA");
            return Err(ProgramError::InvalidSeeds);
        }

        // Check if already spent
        if nullifier_account.data_len() > 0 && nullifier_account.data.borrow()[0] != 0 {
            let existing = Nullifier::try_from_slice(&nullifier_account.data.borrow())?;
            if existing.is_spent {
                msg!("Nullifier already spent (double-spend attempt)");
                return Err(ProgramError::InvalidArgument);
            }
        }

        // Create nullifier record
        let nullifier = Nullifier {
            hash: *nullifier_hash,
            is_spent: true,
        };

        let serialized = nullifier.try_to_vec()?;
        let space = serialized.len();
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);
        let system_program = next_account_info(account_iter)?;

        invoke_signed(
            &system_instruction::create_account(
                sender.key,
                nullifier_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[
                sender.clone(),
                nullifier_account.clone(),
                system_program.clone(),
            ],
            &[&[b"nullifier", nullifier_hash, &[nullifier_bump]]],
        )?;

        nullifier.serialize(&mut &mut nullifier_account.data.borrow_mut()[..])?;
        pool.nullifier_set_size += 1;
    }

    // Create output notes
    for (i, (commitment, enc_data)) in output_commitments
        .iter()
        .zip(output_encrypted_data.iter())
        .enumerate()
    {
        let note_account = next_account_info(account_iter)?;
        let leaf_index = pool.next_leaf_index;

        let (note_pda, note_bump) = Pubkey::find_program_address(
            &[b"note", &leaf_index.to_le_bytes()],
            program_id,
        );
        if note_account.key != &note_pda {
            msg!("Invalid output note PDA at index {}", i);
            return Err(ProgramError::InvalidSeeds);
        }

        let note = ShieldedNote {
            commitment: *commitment,
            encrypted_data: enc_data.clone(),
            leaf_index,
        };

        let serialized = note.try_to_vec()?;
        let space = serialized.len();
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);
        let system_program = next_account_info(account_iter)?;

        invoke_signed(
            &system_instruction::create_account(
                sender.key,
                note_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[
                sender.clone(),
                note_account.clone(),
                system_program.clone(),
            ],
            &[&[b"note", &leaf_index.to_le_bytes(), &[note_bump]]],
        )?;

        note.serialize(&mut &mut note_account.data.borrow_mut()[..])?;

        pool.next_leaf_index += 1;
        pool.merkle_root = compute_new_root(commitment, leaf_index as usize);
    }

    pool.serialize(&mut &mut pool_account.data.borrow_mut()[..])?;

    msg!(
        "Shielded transfer: {} inputs consumed, {} outputs created",
        nullifiers.len(),
        output_commitments.len()
    );
    Ok(())
}

fn process_unshield(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    nullifier: [u8; 32],
    proof: ZkProof,
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let user = next_account_info(account_iter)?;
    let user_token_account = next_account_info(account_iter)?;
    let vault_account = next_account_info(account_iter)?;
    let pool_account = next_account_info(account_iter)?;
    let nullifier_account = next_account_info(account_iter)?;
    let vault_authority = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;
    let system_program = next_account_info(account_iter)?;

    if !user.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if amount == 0 {
        msg!("Unshield amount must be greater than zero");
        return Err(ProgramError::InvalidArgument);
    }

    // Verify the ZK proof (placeholder)
    if !verify_zk_proof(&proof) {
        msg!("ZK proof verification failed");
        return Err(ProgramError::InvalidArgument);
    }

    let mut pool = ShieldedPool::try_from_slice(&pool_account.data.borrow())?;
    if !pool.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }

    if amount > pool.total_shielded {
        msg!("Insufficient shielded balance in pool");
        return Err(ProgramError::InsufficientFunds);
    }

    // Verify nullifier hasn't been spent
    let (nullifier_pda, nullifier_bump) = Pubkey::find_program_address(
        &[b"nullifier", &nullifier],
        program_id,
    );
    if nullifier_account.key != &nullifier_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    if nullifier_account.data_len() > 0 && nullifier_account.data.borrow()[0] != 0 {
        let existing = Nullifier::try_from_slice(&nullifier_account.data.borrow())?;
        if existing.is_spent {
            msg!("Nullifier already spent");
            return Err(ProgramError::InvalidArgument);
        }
    }

    // Mark nullifier as spent
    let nullifier_record = Nullifier {
        hash: nullifier,
        is_spent: true,
    };

    let serialized = nullifier_record.try_to_vec()?;
    let space = serialized.len();
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            user.key,
            nullifier_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            user.clone(),
            nullifier_account.clone(),
            system_program.clone(),
        ],
        &[&[b"nullifier", &nullifier, &[nullifier_bump]]],
    )?;

    nullifier_record.serialize(&mut &mut nullifier_account.data.borrow_mut()[..])?;

    // Transfer tokens from vault to user
    let (authority_pda, authority_bump) = Pubkey::find_program_address(
        &[b"vault_authority", pool.token_mint.as_ref()],
        program_id,
    );
    if vault_authority.key != &authority_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    let transfer_ix = spl_token::instruction::transfer(
        token_program.key,
        vault_account.key,
        user_token_account.key,
        &authority_pda,
        &[],
        amount,
    )?;
    invoke_signed(
        &transfer_ix,
        &[
            vault_account.clone(),
            user_token_account.clone(),
            vault_authority.clone(),
            token_program.clone(),
        ],
        &[&[b"vault_authority", pool.token_mint.as_ref(), &[authority_bump]]],
    )?;

    // Update pool state
    pool.total_shielded -= amount;
    pool.nullifier_set_size += 1;

    pool.serialize(&mut &mut pool_account.data.borrow_mut()[..])?;

    msg!(
        "Unshielded {} tokens from pool, nullifier {:?}",
        amount,
        &nullifier[..4]
    );
    Ok(())
}

// ---------------------------------------------------------------------------
// Cryptographic Helpers (Placeholder implementations)
// ---------------------------------------------------------------------------

/// Compute the root of an empty Merkle tree of depth MERKLE_TREE_DEPTH.
/// Each level hashes two zero values together.
fn compute_empty_root() -> [u8; 32] {
    let mut current = ZERO_HASH;
    for _ in 0..MERKLE_TREE_DEPTH {
        current = placeholder_hash(&current, &current);
    }
    current
}

/// Compute a new Merkle root after inserting a leaf at the given index.
/// This is a simplified placeholder. In production, use an incremental
/// Merkle tree (like the one in Tornado Cash or Zcash).
fn compute_new_root(leaf: &[u8; 32], _index: usize) -> [u8; 32] {
    // Placeholder: just hash the leaf with itself repeatedly
    let mut current = *leaf;
    for _ in 0..MERKLE_TREE_DEPTH {
        current = placeholder_hash(&current, &ZERO_HASH);
    }
    current
}

/// Placeholder hash function. In production, use Poseidon hash
/// (circuit-friendly) or SHA-256 for the Merkle tree.
fn placeholder_hash(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut result = [0u8; 32];
    for i in 0..32 {
        // Simple XOR-based mixing (NOT cryptographically secure)
        result[i] = left[i] ^ right[i] ^ (i as u8);
    }
    result
}

/// Verify a zero-knowledge proof.
///
/// PLACEHOLDER: In production this would verify a Groth16 or PLONK proof
/// using a verification key. The proof would attest that:
/// - The prover knows the preimage (amount, randomness, owner) of a commitment
/// - The commitment exists in the Merkle tree
/// - The nullifier is correctly derived
/// - For transfers: sum of inputs equals sum of outputs
///
/// Current implementation: accepts any non-empty proof.
fn verify_zk_proof(proof: &ZkProof) -> bool {
    if proof.proof_data.is_empty() {
        msg!("ZK proof is empty");
        return false;
    }

    // In production:
    // 1. Deserialize the proof (Groth16: pi_a, pi_b, pi_c)
    // 2. Load the verification key for the circuit
    // 3. Run the pairing check: e(pi_a, pi_b) = e(alpha, beta) * e(L, gamma) * e(C, delta)
    // 4. Verify all public inputs match

    msg!(
        "ZK proof verification PLACEHOLDER: accepting proof of {} bytes with {} public inputs",
        proof.proof_data.len(),
        proof.public_inputs.len()
    );

    true
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_root_deterministic() {
        let root1 = compute_empty_root();
        let root2 = compute_empty_root();
        assert_eq!(root1, root2);
    }

    #[test]
    fn test_new_root_changes_with_different_leaves() {
        let leaf1 = [1u8; 32];
        let leaf2 = [2u8; 32];
        let root1 = compute_new_root(&leaf1, 0);
        let root2 = compute_new_root(&leaf2, 0);
        assert_ne!(root1, root2);
    }

    #[test]
    fn test_placeholder_hash_not_identity() {
        let a = [0u8; 32];
        let b = [0u8; 32];
        let result = placeholder_hash(&a, &b);
        // Due to XOR with index, result should not be all zeros
        assert_ne!(result, [0u8; 32]);
    }

    #[test]
    fn test_verify_empty_proof_fails() {
        let proof = ZkProof {
            proof_data: vec![],
            public_inputs: vec![],
        };
        assert!(!verify_zk_proof(&proof));
    }

    #[test]
    fn test_verify_nonempty_proof_passes() {
        let proof = ZkProof {
            proof_data: vec![1, 2, 3, 4],
            public_inputs: vec![[0u8; 32]],
        };
        assert!(verify_zk_proof(&proof));
    }

    #[test]
    fn test_shielded_pool_serialization() {
        let pool = ShieldedPool {
            is_initialized: true,
            admin: Pubkey::default(),
            token_mint: Pubkey::default(),
            total_shielded: 1_000_000,
            merkle_root: [42u8; 32],
            next_leaf_index: 5,
            nullifier_set_size: 3,
            vault: Pubkey::default(),
        };
        let serialized = pool.try_to_vec().unwrap();
        let deserialized = ShieldedPool::try_from_slice(&serialized).unwrap();
        assert_eq!(deserialized.total_shielded, 1_000_000);
        assert_eq!(deserialized.next_leaf_index, 5);
        assert_eq!(deserialized.nullifier_set_size, 3);
    }

    #[test]
    fn test_nullifier_serialization() {
        let nullifier = Nullifier {
            hash: [99u8; 32],
            is_spent: true,
        };
        let serialized = nullifier.try_to_vec().unwrap();
        let deserialized = Nullifier::try_from_slice(&serialized).unwrap();
        assert!(deserialized.is_spent);
        assert_eq!(deserialized.hash, [99u8; 32]);
    }
}
