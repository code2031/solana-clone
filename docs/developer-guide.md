# SolClone Developer Guide

## Introduction

This guide covers everything you need to build, deploy, and test programs on the SolClone network. SolClone is architecturally compatible with Solana, so programs written in Rust (using the SolClone SDK) compile to BPF bytecode and run on the SolClone runtime.

---

## Setting Up Your Local Development Environment

### Prerequisites

- **Rust** (1.75.0 or later)
- **Node.js** (18 LTS or later) for the JavaScript SDK
- **Git**

### Install the SolClone CLI Tools

```bash
sh -c "$(curl -sSfL https://release.solclone.io/stable/install)"
export PATH="$HOME/.local/share/solclone/install/active_release/bin:$PATH"
```

Verify installation:

```bash
solclone --version
solclone-keygen --version
```

### Install the Rust Toolchain

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup component add rustfmt clippy
```

Install the BPF toolchain for on-chain programs:

```bash
cargo install cargo-build-bpf
```

### Start a Local Validator

```bash
solclone-test-validator
```

This starts a local single-node cluster at `http://localhost:8899`. It comes pre-funded and resets on restart.

In another terminal, configure the CLI to use localhost:

```bash
solclone config set --url http://localhost:8899
```

Create and fund a development keypair:

```bash
solclone-keygen new --outfile ~/.config/solclone/dev-keypair.json --no-bip39-passphrase
solclone config set --keypair ~/.config/solclone/dev-keypair.json
solclone airdrop 100
```

---

## Writing Programs (Rust)

### Project Structure

Create a new program project:

```bash
cargo init --lib my_program
cd my_program
```

Update `Cargo.toml`:

```toml
[package]
name = "my_program"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[dependencies]
solclone-program = "1.18"
borsh = "1.3"
borsh-derive = "1.3"

[dev-dependencies]
solclone-sdk = "1.18"
solclone-program-test = "1.18"
tokio = { version = "1", features = ["full"] }
```

### Minimal Program: Counter

`src/lib.rs`:

```rust
use borsh::{BorshDeserialize, BorshSerialize};
use solclone_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

/// Account data structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CounterAccount {
    pub count: u64,
}

/// Instruction types
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum CounterInstruction {
    Initialize,
    Increment,
    Decrement,
}

// Declare the program entrypoint
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = CounterInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    let accounts_iter = &mut accounts.iter();
    let counter_account = next_account_info(accounts_iter)?;

    // Verify the account is owned by this program
    if counter_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    match instruction {
        CounterInstruction::Initialize => {
            msg!("Initializing counter");
            let counter = CounterAccount { count: 0 };
            counter.serialize(&mut &mut counter_account.data.borrow_mut()[..])?;
        }
        CounterInstruction::Increment => {
            let mut counter = CounterAccount::try_from_slice(&counter_account.data.borrow())?;
            counter.count = counter.count.checked_add(1)
                .ok_or(ProgramError::ArithmeticOverflow)?;
            msg!("Counter incremented to: {}", counter.count);
            counter.serialize(&mut &mut counter_account.data.borrow_mut()[..])?;
        }
        CounterInstruction::Decrement => {
            let mut counter = CounterAccount::try_from_slice(&counter_account.data.borrow())?;
            counter.count = counter.count.checked_sub(1)
                .ok_or(ProgramError::ArithmeticOverflow)?;
            msg!("Counter decremented to: {}", counter.count);
            counter.serialize(&mut &mut counter_account.data.borrow_mut()[..])?;
        }
    }

    Ok(())
}
```

### Key Concepts

| Concept           | Description                                                          |
|-------------------|----------------------------------------------------------------------|
| **Program**       | Stateless executable code deployed on-chain (like a smart contract)   |
| **Account**       | Storage unit on the ledger; holds data and lamports                   |
| **Instruction**   | A call to a program with accounts and data                            |
| **Transaction**   | One or more instructions executed atomically                          |
| **PDA**           | Program Derived Address -- deterministic address owned by a program   |
| **CPI**           | Cross-Program Invocation -- one program calling another               |
| **Signer**        | An account that signed the transaction (authorization)                |

### Program Derived Addresses (PDAs)

PDAs allow programs to deterministically derive addresses and sign on behalf of those addresses:

```rust
use solclone_program::pubkey::Pubkey;

let (pda, bump_seed) = Pubkey::find_program_address(
    &[b"counter", user_pubkey.as_ref()],
    program_id,
);
```

### Cross-Program Invocations (CPI)

Call another program from within your program:

```rust
use solclone_program::program::invoke;
use solclone_program::system_instruction;

// Transfer lamports via the System Program
invoke(
    &system_instruction::transfer(from_pubkey, to_pubkey, lamports),
    &[from_account.clone(), to_account.clone(), system_program.clone()],
)?;
```

---

## Deploying Programs

### Build

```bash
cargo build-bpf
```

This produces a `.so` file in `target/deploy/`.

### Deploy to Local Validator

```bash
solclone program deploy target/deploy/my_program.so
```

The CLI outputs the program ID:

```
Program Id: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### Deploy to Testnet

```bash
solclone config set --url https://api.testnet.solclone.io
solclone airdrop 10  # Fund your account for deployment
solclone program deploy target/deploy/my_program.so
```

### Deploy to Mainnet

```bash
solclone config set --url https://api.mainnet.solclone.io
# Ensure your account has enough SCLONE for rent-exempt deployment
solclone program deploy target/deploy/my_program.so
```

### Program Upgrade Authority

By default, the deployer is the upgrade authority. To make a program immutable:

```bash
solclone program set-upgrade-authority <PROGRAM_ID> --final
```

To transfer upgrade authority:

```bash
solclone program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <NEW_AUTHORITY>
```

---

## Using the SDK

### JavaScript/TypeScript SDK

Install:

```bash
npm install @solclone/web3.js
```

#### Connect to the Network

```typescript
import { Connection, clusterApiUrl } from '@solclone/web3.js';

// Local
const connection = new Connection('http://localhost:8899', 'confirmed');

// Testnet
const connection = new Connection(clusterApiUrl('testnet'), 'confirmed');

// Mainnet
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
```

#### Create a Keypair and Check Balance

```typescript
import { Keypair, LAMPORTS_PER_SCLONE } from '@solclone/web3.js';

const keypair = Keypair.generate();
console.log('Public key:', keypair.publicKey.toBase58());

const balance = await connection.getBalance(keypair.publicKey);
console.log('Balance:', balance / LAMPORTS_PER_SCLONE, 'SCLONE');
```

#### Send a Transaction

```typescript
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SCLONE,
} from '@solclone/web3.js';

const from = Keypair.generate();
const to = Keypair.generate();

// Request airdrop (devnet/testnet only)
const airdropSig = await connection.requestAirdrop(
  from.publicKey,
  2 * LAMPORTS_PER_SCLONE
);
await connection.confirmTransaction(airdropSig);

// Build and send the transfer
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: from.publicKey,
    toPubkey: to.publicKey,
    lamports: LAMPORTS_PER_SCLONE / 2,
  })
);

const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
console.log('Transaction signature:', signature);
```

#### Interact with a Deployed Program

```typescript
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solclone/web3.js';
import * as borsh from 'borsh';

const programId = new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
const counterAccount = new PublicKey('...');

// Serialize the Increment instruction (enum variant index 1)
const data = Buffer.from([1, 0, 0, 0]);

const instruction = new TransactionInstruction({
  keys: [{ pubkey: counterAccount, isSigner: false, isWritable: true }],
  programId,
  data,
});

const tx = new Transaction().add(instruction);
const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
```

### Rust Client SDK

```toml
[dependencies]
solclone-client = "1.18"
solclone-sdk = "1.18"
```

```rust
use solclone_client::rpc_client::RpcClient;
use solclone_sdk::{
    commitment_config::CommitmentConfig,
    signature::Keypair,
    signer::Signer,
};

fn main() {
    let client = RpcClient::new_with_commitment(
        "http://localhost:8899".to_string(),
        CommitmentConfig::confirmed(),
    );

    let keypair = Keypair::new();
    let balance = client.get_balance(&keypair.pubkey()).unwrap();
    println!("Balance: {} lamports", balance);
}
```

---

## Token Creation Walkthrough

Create a custom SPL token on SolClone.

### 1. Install the SPL Token CLI

```bash
cargo install spl-token-cli
```

### 2. Create the Token Mint

```bash
spl-token create-token --decimals 9
```

Output:

```
Creating token 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
Signature: 3Bxs4ThwQbE...
```

### 3. Create a Token Account

```bash
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### 4. Mint Tokens

```bash
spl-token mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU 1000000
```

### 5. Check Balance

```bash
spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### 6. Transfer Tokens

```bash
spl-token transfer 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU 500 <RECIPIENT_TOKEN_ACCOUNT> \
  --fund-recipient
```

### 7. Disable Minting (Optional)

```bash
spl-token authorize 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU mint --disable
```

### Programmatic Token Creation (TypeScript)

```typescript
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solclone/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SCLONE } from '@solclone/web3.js';

const connection = new Connection('http://localhost:8899', 'confirmed');
const payer = Keypair.generate();

// Fund payer
await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SCLONE);

// Create mint with 9 decimals
const mint = await createMint(
  connection,
  payer,
  payer.publicKey,    // mint authority
  payer.publicKey,    // freeze authority
  9                   // decimals
);
console.log('Mint address:', mint.toBase58());

// Create token account
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  mint,
  payer.publicKey
);

// Mint 1,000,000 tokens (with 9 decimals)
await mintTo(
  connection,
  payer,
  mint,
  tokenAccount.address,
  payer,
  1_000_000_000_000_000  // 1,000,000 * 10^9
);
```

---

## DApp Architecture

### Recommended Stack

```
+---------------------------------------------+
|              Frontend (React/Next.js)        |
|  - @solclone/web3.js                         |
|  - @solclone/wallet-adapter                  |
+---------------------+-----------------------+
                      |
                      | JSON-RPC
                      v
+---------------------------------------------+
|            SolClone RPC Node                 |
|  - getAccountInfo, sendTransaction, etc.     |
+---------------------+-----------------------+
                      |
                      v
+---------------------------------------------+
|          On-Chain Programs (Rust/BPF)        |
|  - Business logic                            |
|  - State stored in accounts                  |
+---------------------------------------------+
```

### Wallet Integration

```typescript
import { useWallet } from '@solclone/wallet-adapter-react';
import { WalletMultiButton } from '@solclone/wallet-adapter-react-ui';

function App() {
  const { publicKey, sendTransaction } = useWallet();

  return (
    <div>
      <WalletMultiButton />
      {publicKey && <p>Connected: {publicKey.toBase58()}</p>}
    </div>
  );
}
```

### State Management Pattern

On-chain accounts are the source of truth. Typical pattern:

1. **Read** account data via `getAccountInfo` or `getProgramAccounts`
2. **Deserialize** with Borsh on the client side
3. **Build** an instruction with the desired state change
4. **Send** the transaction and wait for confirmation
5. **Refresh** account data to update the UI

### Account Layout Best Practices

- Use a discriminator (first 8 bytes) to identify account types
- Pack fixed-size fields first
- Use Borsh serialization for deterministic encoding
- Keep accounts as small as possible to minimize rent

---

## Testing

### Unit Tests (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use solclone_program::clock::Epoch;
    use solclone_sdk::account::Account;

    #[test]
    fn test_initialize_counter() {
        let program_id = Pubkey::new_unique();
        let key = Pubkey::new_unique();
        let mut lamports = 1_000_000;
        let mut data = vec![0u8; 8]; // u64 = 8 bytes

        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &program_id,
            false,
            Epoch::default(),
        );

        let instruction_data = borsh::to_vec(&CounterInstruction::Initialize).unwrap();
        let accounts = vec![account];

        process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let counter = CounterAccount::try_from_slice(&accounts[0].data.borrow()).unwrap();
        assert_eq!(counter.count, 0);
    }
}
```

Run unit tests:

```bash
cargo test
```

### Integration Tests (solclone-program-test)

```rust
#[cfg(test)]
mod integration_tests {
    use solclone_program_test::*;
    use solclone_sdk::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        signature::Signer,
        transaction::Transaction,
    };

    #[tokio::test]
    async fn test_counter_program() {
        let program_id = Pubkey::new_unique();

        let mut program_test = ProgramTest::new(
            "my_program",
            program_id,
            processor!(super::process_instruction),
        );

        // Add a counter account
        let counter_keypair = solclone_sdk::signature::Keypair::new();
        program_test.add_account(
            counter_keypair.pubkey(),
            solclone_sdk::account::Account {
                lamports: 1_000_000,
                data: vec![0u8; 8],
                owner: program_id,
                ..solclone_sdk::account::Account::default()
            },
        );

        let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

        // Initialize
        let init_ix = Instruction::new_with_borsh(
            program_id,
            &super::CounterInstruction::Initialize,
            vec![AccountMeta::new(counter_keypair.pubkey(), false)],
        );

        let tx = Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&payer.pubkey()),
            &[&payer],
            recent_blockhash,
        );
        banks_client.process_transaction(tx).await.unwrap();

        // Increment
        let inc_ix = Instruction::new_with_borsh(
            program_id,
            &super::CounterInstruction::Increment,
            vec![AccountMeta::new(counter_keypair.pubkey(), false)],
        );

        let tx = Transaction::new_signed_with_payer(
            &[inc_ix],
            Some(&payer.pubkey()),
            &[&payer],
            recent_blockhash,
        );
        banks_client.process_transaction(tx).await.unwrap();

        // Verify
        let account = banks_client
            .get_account(counter_keypair.pubkey())
            .await
            .unwrap()
            .unwrap();
        let counter = super::CounterAccount::try_from_slice(&account.data).unwrap();
        assert_eq!(counter.count, 1);
    }
}
```

### JavaScript/TypeScript Tests

```typescript
import { Connection, Keypair, LAMPORTS_PER_SCLONE } from '@solclone/web3.js';
import { expect } from 'chai';

describe('Counter Program', () => {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  let payer: Keypair;

  before(async () => {
    payer = Keypair.generate();
    const sig = await connection.requestAirdrop(
      payer.publicKey,
      10 * LAMPORTS_PER_SCLONE
    );
    await connection.confirmTransaction(sig);
  });

  it('should initialize the counter to 0', async () => {
    // ... build and send Initialize instruction
    // ... fetch account and deserialize
    // expect(counter.count).to.equal(0);
  });

  it('should increment the counter', async () => {
    // ... build and send Increment instruction
    // expect(counter.count).to.equal(1);
  });
});
```

Run with:

```bash
# Start local validator in one terminal
solclone-test-validator

# Run tests in another terminal
npx mocha --timeout 30000 tests/**/*.ts
```

### Testing Checklist

| Test Type       | Tool                        | What It Covers                          |
|-----------------|-----------------------------|-----------------------------------------|
| Unit tests      | `cargo test`                | Individual function logic                |
| Integration     | `solclone-program-test`     | Full instruction processing              |
| E2E             | `solclone-test-validator`   | Real transactions against a local node   |
| Fuzzing         | `cargo fuzz`                | Edge cases and input validation          |
| Security audit  | Manual / third-party        | Access control, overflow, reentrancy     |

---

## Common Patterns

### Error Handling

Define custom errors for your program:

```rust
use solclone_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CounterError {
    #[error("Counter overflow")]
    Overflow,
    #[error("Counter underflow")]
    Underflow,
    #[error("Invalid instruction")]
    InvalidInstruction,
}

impl From<CounterError> for ProgramError {
    fn from(e: CounterError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
```

### Account Validation

Always validate accounts in your instruction handler:

```rust
// Check account ownership
if counter_account.owner != program_id {
    return Err(ProgramError::IncorrectProgramId);
}

// Check signer
if !authority.is_signer {
    return Err(ProgramError::MissingRequiredSignature);
}

// Check writable
if !counter_account.is_writable {
    return Err(ProgramError::InvalidAccountData);
}

// Verify PDA
let (expected_pda, bump) = Pubkey::find_program_address(seeds, program_id);
if counter_account.key != &expected_pda {
    return Err(ProgramError::InvalidSeeds);
}
```

---

## Resources

| Resource               | URL                                      |
|------------------------|------------------------------------------|
| SolClone Docs          | https://docs.solclone.io                  |
| API Reference          | https://docs.solclone.io/api              |
| SDK (npm)              | https://www.npmjs.com/package/@solclone/web3.js |
| Rust Crates            | https://crates.io/crates/solclone-program |
| Explorer               | https://explorer.solclone.io              |
| Faucet (testnet)       | https://faucet.solclone.io                |
| Discord                | https://discord.gg/solclone               |
| GitHub                 | https://github.com/solclone-labs          |
