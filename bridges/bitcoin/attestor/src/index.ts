/**
 * SolClone <-> Bitcoin Bridge Attestor
 *
 * Monitors the Bitcoin network for deposits to the bridge multisig addresses,
 * submits deposit proofs to the SolClone bridge program, and co-signs
 * withdrawal transactions.
 *
 * In production this would use a Bitcoin Core RPC or Electrum server.
 * Here we define the full interface with the Bitcoin side mocked.
 */

import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface AttestorConfig {
  /** Bitcoin Core RPC endpoint */
  bitcoin_rpc: string;
  /** Bitcoin RPC username */
  bitcoin_rpc_user: string;
  /** Bitcoin RPC password */
  bitcoin_rpc_pass: string;
  /** SolClone validator RPC endpoint */
  solclone_rpc: string;
  /** BTC Bridge program ID on SolClone */
  bridge_program_id: string;
  /** Path to the attestor keypair JSON file */
  attestor_keypair: string;
  /** Bitcoin multisig addresses to watch */
  watch_addresses: string[];
  /** Polling interval in milliseconds */
  poll_interval_ms: number;
  /** Minimum BTC confirmations before attesting */
  min_confirmations: number;
}

const DEFAULT_CONFIG: AttestorConfig = {
  bitcoin_rpc: "http://localhost:8332",
  bitcoin_rpc_user: "rpcuser",
  bitcoin_rpc_pass: "rpcpassword",
  solclone_rpc: "http://localhost:8899",
  bridge_program_id: "BtcBrdg11111111111111111111111111111111111",
  attestor_keypair: "./attestor-keypair.json",
  watch_addresses: [],
  poll_interval_ms: 30_000, // 30 seconds (Bitcoin blocks are ~10min)
  min_confirmations: 6,
};

// ---------------------------------------------------------------------------
// Bitcoin Types (mock interface)
// ---------------------------------------------------------------------------

interface BtcTransaction {
  txid: string;
  confirmations: number;
  vout: BtcOutput[];
  blockhash?: string;
  blockheight?: number;
  time?: number;
}

interface BtcOutput {
  value: number;          // BTC amount (floating point)
  n: number;              // Output index
  scriptPubKey: {
    address?: string;
    hex: string;
    type: string;
  };
}

interface BtcDepositInfo {
  txid: string;
  vout: number;
  amountSats: bigint;
  confirmations: number;
  destinationAddress: string;
  /** Extracted from OP_RETURN or a memo field — the SolClone recipient pubkey */
  recipientPubkey: string;
}

// ---------------------------------------------------------------------------
// Bitcoin Watcher (mock implementation)
// ---------------------------------------------------------------------------

class BitcoinWatcher {
  private config: AttestorConfig;
  private processedDeposits: Set<string> = new Set();
  private currentBlockHeight: number = 0;

  constructor(config: AttestorConfig) {
    this.config = config;
  }

  /**
   * Start watching Bitcoin for deposits to bridge addresses.
   * In production: calls listsinceblock or scantxoutset on Bitcoin Core.
   */
  async start(onDeposit: (deposit: BtcDepositInfo) => Promise<void>): Promise<void> {
    console.log(`[BtcWatcher] Connecting to Bitcoin RPC: ${this.config.bitcoin_rpc}`);
    console.log(`[BtcWatcher] Watching ${this.config.watch_addresses.length} addresses`);
    console.log(`[BtcWatcher] Min confirmations: ${this.config.min_confirmations}`);

    while (true) {
      try {
        await this.pollForDeposits(onDeposit);
      } catch (err) {
        console.error("[BtcWatcher] Poll error:", err);
      }
      await sleep(this.config.poll_interval_ms);
    }
  }

  private async pollForDeposits(
    onDeposit: (deposit: BtcDepositInfo) => Promise<void>
  ): Promise<void> {
    // In production:
    // 1. Call `listsinceblock` to get new transactions
    // 2. Filter for outputs to watched multisig addresses
    // 3. Parse OP_RETURN data to extract the SolClone recipient pubkey
    // 4. Check confirmation count >= min_confirmations
    // 5. Emit deposit event

    console.log(
      `[BtcWatcher] Polling Bitcoin mempool and recent blocks (height: ${this.currentBlockHeight})...`
    );

    // Mock: no real deposits in dev mode
  }

  /**
   * Create and sign a partial Bitcoin transaction for a withdrawal.
   * In production: builds a PSBT (Partially Signed Bitcoin Transaction),
   * signs with this attestor's key share, and returns the PSBT.
   */
  async signWithdrawalTransaction(
    amount_sats: bigint,
    destination: string,
    nonce: bigint
  ): Promise<{ psbt: string; txid: string }> {
    console.log(`[BtcWatcher] Signing withdrawal transaction:`);
    console.log(`  Amount:      ${amount_sats} sats`);
    console.log(`  Destination: ${destination}`);
    console.log(`  Nonce:       ${nonce}`);

    // Mock PSBT and txid
    const mockTxid = Buffer.from(
      `withdrawal_${nonce}_${Date.now()}`
    ).toString("hex").padEnd(64, "0").slice(0, 64);

    return {
      psbt: `cHNidFF...mock_psbt_${nonce}`,
      txid: mockTxid,
    };
  }

  /**
   * Broadcast a fully-signed Bitcoin transaction.
   * In production: calls sendrawtransaction on Bitcoin Core.
   */
  async broadcastTransaction(rawTx: string): Promise<string> {
    console.log(`[BtcWatcher] Broadcasting BTC transaction (${rawTx.length} bytes)`);
    const mockTxid = Buffer.from(rawTx).toString("hex").slice(0, 64);
    console.log(`[BtcWatcher] Broadcast successful: ${mockTxid}`);
    return mockTxid;
  }
}

// ---------------------------------------------------------------------------
// SolClone Bridge Client
// ---------------------------------------------------------------------------

class SolCloneBridgeClient {
  private connection: Connection;
  private programId: PublicKey;
  private attestorKeypair: Keypair;

  constructor(config: AttestorConfig) {
    this.connection = new Connection(config.solclone_rpc, "confirmed");
    this.programId = new PublicKey(config.bridge_program_id);
    // In production: load from file
    this.attestorKeypair = Keypair.generate();
    console.log(
      `[BridgeClient] Attestor pubkey: ${this.attestorKeypair.publicKey.toBase58()}`
    );
  }

  /**
   * Submit a deposit proof to the SolClone bridge program.
   */
  async submitDepositProof(deposit: BtcDepositInfo): Promise<string> {
    console.log(`[BridgeClient] Submitting deposit proof for txid: ${deposit.txid}`);

    const recipientPubkey = new PublicKey(deposit.recipientPubkey);

    // Derive PDAs
    const [bridgeStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("btc_bridge_state")],
      this.programId
    );

    const txidBytes = Buffer.from(deposit.txid, "hex");
    const voutBuffer = Buffer.alloc(4);
    voutBuffer.writeUInt32LE(deposit.vout);
    const [depositProofPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("deposit_proof"), txidBytes, voutBuffer],
      this.programId
    );

    // Build SubmitDepositProof instruction
    // Instruction discriminant: 1 (SubmitDepositProof)
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(deposit.amountSats);
    const confirmationsBuffer = Buffer.alloc(4);
    confirmationsBuffer.writeUInt32LE(deposit.confirmations);

    const data = Buffer.alloc(1 + 32 + 4 + 8 + 32 + 4);
    let offset = 0;
    data.writeUInt8(1, offset); offset += 1;                              // instruction index
    txidBytes.copy(data, offset); offset += 32;                           // btc_txid
    voutBuffer.copy(data, offset); offset += 4;                           // vout
    amountBuffer.copy(data, offset); offset += 8;                         // amount_sats
    recipientPubkey.toBuffer().copy(data, offset); offset += 32;          // recipient_pubkey
    confirmationsBuffer.copy(data, offset);                               // confirmations

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: this.attestorKeypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: bridgeStatePda, isSigner: false, isWritable: true },
        { pubkey: depositProofPda, isSigner: false, isWritable: true },
        { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);

    try {
      const signature = await this.connection.sendTransaction(transaction, [
        this.attestorKeypair,
      ]);
      console.log(`[BridgeClient] Deposit proof submitted: ${signature}`);
      return signature;
    } catch (err) {
      console.error(`[BridgeClient] Failed to submit deposit proof:`, err);
      throw err;
    }
  }

  /**
   * Submit a withdrawal co-signature to the SolClone bridge program.
   */
  async processWithdrawal(nonce: bigint, btcTxid: string): Promise<string> {
    console.log(`[BridgeClient] Processing withdrawal nonce ${nonce}, BTC txid: ${btcTxid}`);

    const [bridgeStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("btc_bridge_state")],
      this.programId
    );

    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(nonce);
    const [withdrawalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("withdrawal"), nonceBuffer],
      this.programId
    );

    const btcTxidBytes = Buffer.from(btcTxid, "hex");

    // Build ProcessWithdrawal instruction (discriminant: 4)
    const data = Buffer.alloc(1 + 8 + 32);
    let offset = 0;
    data.writeUInt8(4, offset); offset += 1;
    nonceBuffer.copy(data, offset); offset += 8;
    btcTxidBytes.copy(data, offset);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: this.attestorKeypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: bridgeStatePda, isSigner: false, isWritable: true },
        { pubkey: withdrawalPda, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);

    try {
      const signature = await this.connection.sendTransaction(transaction, [
        this.attestorKeypair,
      ]);
      console.log(`[BridgeClient] Withdrawal processed: ${signature}`);
      return signature;
    } catch (err) {
      console.error(`[BridgeClient] Failed to process withdrawal:`, err);
      throw err;
    }
  }

  /**
   * Watch for withdrawal requests on SolClone.
   */
  async watchWithdrawals(
    handler: (nonce: bigint, amountSats: bigint, destination: string) => Promise<void>
  ): Promise<void> {
    console.log(`[BridgeClient] Watching for withdrawal requests...`);

    while (true) {
      try {
        const signatures = await this.connection.getSignaturesForAddress(
          this.programId,
          { limit: 50 },
          "confirmed"
        );

        for (const sigInfo of signatures) {
          const tx = await this.connection.getTransaction(sigInfo.signature, {
            commitment: "confirmed",
          });

          if (!tx?.meta?.logMessages) continue;

          for (const log of tx.meta.logMessages) {
            if (log.includes("Withdrawal requested")) {
              const match = log.match(/(\d+) sats, nonce (\d+)/);
              if (match) {
                await handler(
                  BigInt(match[2]),
                  BigInt(match[1]),
                  "unknown" // Would parse from instruction data
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("[BridgeClient] Withdrawal watch error:", err);
      }

      await sleep(10_000);
    }
  }
}

// ---------------------------------------------------------------------------
// Main Attestor Service
// ---------------------------------------------------------------------------

class BitcoinBridgeAttestor {
  private config: AttestorConfig;
  private btcWatcher: BitcoinWatcher;
  private bridgeClient: SolCloneBridgeClient;

  constructor(config: AttestorConfig) {
    this.config = config;
    this.btcWatcher = new BitcoinWatcher(config);
    this.bridgeClient = new SolCloneBridgeClient(config);
  }

  async start(): Promise<void> {
    console.log("===========================================");
    console.log(" SolClone <-> Bitcoin Bridge Attestor");
    console.log("===========================================");
    console.log(`Bridge Program: ${this.config.bridge_program_id}`);
    console.log(`Bitcoin RPC:    ${this.config.bitcoin_rpc}`);
    console.log(`SolClone RPC:   ${this.config.solclone_rpc}`);
    console.log();

    // 1. Watch Bitcoin for deposits and submit proofs to SolClone
    this.btcWatcher.start(async (deposit) => {
      console.log(`[Attestor] BTC deposit detected: ${deposit.txid}:${deposit.vout}`);
      try {
        await this.bridgeClient.submitDepositProof(deposit);
        console.log(`[Attestor] Deposit proof submitted for ${deposit.txid}`);
      } catch (err) {
        console.error(`[Attestor] Failed to attest deposit:`, err);
      }
    });

    // 2. Watch SolClone for withdrawal requests and co-sign BTC releases
    this.bridgeClient.watchWithdrawals(async (nonce, amountSats, destination) => {
      console.log(`[Attestor] Withdrawal request: nonce=${nonce}, ${amountSats} sats`);
      try {
        // Sign the Bitcoin withdrawal transaction
        const { txid } = await this.btcWatcher.signWithdrawalTransaction(
          amountSats,
          destination,
          nonce
        );

        // Submit co-signature to SolClone
        await this.bridgeClient.processWithdrawal(nonce, txid);
        console.log(`[Attestor] Withdrawal co-signed for nonce=${nonce}`);
      } catch (err) {
        console.error(`[Attestor] Failed to process withdrawal:`, err);
      }
    });

    console.log("[Attestor] Bitcoin bridge attestor is running...");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadConfig(): AttestorConfig {
  return {
    ...DEFAULT_CONFIG,
    bitcoin_rpc: process.env.BITCOIN_RPC || DEFAULT_CONFIG.bitcoin_rpc,
    bitcoin_rpc_user: process.env.BITCOIN_RPC_USER || DEFAULT_CONFIG.bitcoin_rpc_user,
    bitcoin_rpc_pass: process.env.BITCOIN_RPC_PASS || DEFAULT_CONFIG.bitcoin_rpc_pass,
    solclone_rpc: process.env.SOLCLONE_RPC || DEFAULT_CONFIG.solclone_rpc,
    bridge_program_id:
      process.env.BRIDGE_PROGRAM_ID || DEFAULT_CONFIG.bridge_program_id,
    attestor_keypair:
      process.env.ATTESTOR_KEYPAIR || DEFAULT_CONFIG.attestor_keypair,
    watch_addresses: process.env.WATCH_ADDRESSES
      ? process.env.WATCH_ADDRESSES.split(",")
      : DEFAULT_CONFIG.watch_addresses,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const config = loadConfig();
  const attestor = new BitcoinBridgeAttestor(config);
  await attestor.start();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export {
  BitcoinBridgeAttestor,
  BitcoinWatcher,
  SolCloneBridgeClient,
  AttestorConfig,
  BtcDepositInfo,
};
