# SolClone Privacy / Confidential Transfers

Shielded token pools for private transactions on SolClone. Users can deposit public tokens into a shielded pool, transfer within the pool without revealing amounts or recipients, and withdraw back to public accounts.

## Architecture

```
Public Layer (SPL Tokens)
+---------------------------+
| User A  -->  Shield       |   Deposit into pool
| (100 USDC)  (commitment)  |
+---------------------------+
            |
            v
Shielded Pool (Commitments + Nullifiers)
+---------------------------+
| Merkle Tree of Notes      |   Transfer: consume nullifiers,
| [C1, C2, C3, ...]        |   create new commitments
| Nullifier Set: {N1, N2}  |   ZK proof validates the transfer
+---------------------------+
            |
            v
Public Layer (SPL Tokens)
+---------------------------+
| Unshield  -->  User B     |   Withdraw from pool
| (nullifier)   (100 USDC)  |
+---------------------------+
```

## How It Works

### 1. Shield (Deposit)

A user deposits public SPL tokens into the shielded pool. This creates a **commitment** in the Merkle tree:

```
commitment = Hash(amount || randomness || owner_pubkey)
```

The commitment hides the amount and owner. The encrypted note data (amount, randomness) is stored on-chain, encrypted with the recipient's public key so only they can decrypt it.

### 2. Transfer (Shielded)

To transfer within the pool, the sender:

1. Selects input notes they own (by decrypting their encrypted data)
2. Computes **nullifiers** for each input: `nullifier = Hash(commitment || spending_key)`
3. Creates new output commitments for the recipient(s) and any change
4. Generates a **zero-knowledge proof** that:
   - The input commitments exist in the Merkle tree
   - The nullifiers correspond to the input commitments
   - Sum of input amounts = Sum of output amounts (conservation)
   - The prover knows the spending keys

The nullifiers are revealed (preventing double-spends) but the amounts and the link between sender/recipient remain hidden.

### 3. Unshield (Withdraw)

To withdraw back to a public account, the user:

1. Reveals the amount being withdrawn
2. Provides a nullifier for the note being spent
3. Provides a ZK proof that the nullifier corresponds to a valid unspent note with the claimed amount
4. Tokens are transferred from the pool vault to the user's public token account

## Privacy Model

| Property | Status |
|----------|--------|
| Amount hidden in pool | Yes (via commitments) |
| Sender/recipient hidden | Yes (nullifiers break the link) |
| Transaction graph hidden | Partial (pool acts as mixer) |
| Deposit amount hidden | No (visible on-chain) |
| Withdrawal amount hidden | No (visible on-chain) |
| Timing analysis resistance | Partial (depends on pool activity) |

## Current Limitations

1. **Proof Verification is Placeholder**: The current implementation accepts any non-empty proof. In production, this must be replaced with a proper ZK proof verifier (Groth16 via `ark-groth16`, or PLONK via a suitable library).

2. **Hash Function**: The Merkle tree uses a placeholder XOR-based hash. Production should use **Poseidon hash** (circuit-friendly) for the commitment scheme and Merkle tree.

3. **Incremental Merkle Tree**: The current Merkle root computation is simplified. Production needs a proper incremental Merkle tree that efficiently updates the root when new leaves are inserted.

4. **Encrypted Note Storage**: The encryption scheme for note data is not specified. Production should use ECIES (Elliptic Curve Integrated Encryption Scheme) or a similar construction.

5. **No Compliance Hooks**: A production system may need optional viewing keys or compliance mechanisms for regulatory requirements.

## Roadmap

- [ ] Integrate Groth16 proof verification (via `ark-groth16` or `bellman`)
- [ ] Replace placeholder hash with Poseidon hash
- [ ] Implement proper incremental Merkle tree
- [ ] Add ECIES encryption for note data
- [ ] Build proof generation client (WASM for browser, native for CLI)
- [ ] Add optional viewing keys for auditability
- [ ] Gas optimization for on-chain verification

## Program Instructions

| Instruction | Description |
|-------------|-------------|
| `InitializePool` | Create a shielded pool for an SPL token |
| `Shield` | Deposit public tokens, create a commitment |
| `TransferShielded` | Consume input notes, create output notes with ZK proof |
| `Unshield` | Withdraw from pool, reveal amount, burn commitment |
