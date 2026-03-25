/**
 * TPS Benchmark for SolClone
 *
 * Generates 500 pre-signed transfer transactions, submits them in parallel
 * batches of 50, and measures confirmed transactions / elapsed time = TPS.
 */

import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.RPC_URL || "http://localhost:8899";
const TOTAL_TRANSACTIONS = 500;
const BATCH_SIZE = 50;
const RESULTS_DIR = path.resolve(import.meta.dirname ?? ".", "..");

interface TpsBenchResult {
  totalTransactions: number;
  confirmedTransactions: number;
  failedTransactions: number;
  elapsedMs: number;
  tps: number;
  batchSize: number;
  batchCount: number;
}

async function rpcCall(url: string, method: string, params: unknown[] = []): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await res.json() as { result?: unknown; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function main() {
  console.log("=== SolClone TPS Benchmark ===\n");
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`Total transactions: ${TOTAL_TRANSACTIONS}`);
  console.log(`Batch size: ${BATCH_SIZE}\n`);

  // Setup: create funded sender keypair
  const sender = Keypair.generate();
  const senderPubkey = sender.publicKey.toBase58();

  console.log(`Sender: ${senderPubkey}`);
  console.log("Requesting airdrop...");

  await rpcCall(RPC_URL, "requestAirdrop", [senderPubkey, 100 * LAMPORTS_PER_SOL]);
  // Wait for airdrop to confirm
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate recipient keypairs
  const recipients = Array.from({ length: TOTAL_TRANSACTIONS }, () => Keypair.generate());

  // Pre-build transactions
  console.log("Pre-building transactions...");
  const connection = new Connection(RPC_URL, "confirmed");
  const { blockhash } = await connection.getLatestBlockhash();

  const transactions: Transaction[] = recipients.map((recipient) => {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 1000, // minimal transfer
      })
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = sender.publicKey;
    tx.sign(sender);
    return tx;
  });

  console.log(`${transactions.length} transactions pre-signed\n`);

  // Submit in batches
  const batches: Transaction[][] = [];
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    batches.push(transactions.slice(i, i + BATCH_SIZE));
  }

  let confirmed = 0;
  let failed = 0;

  console.log(`Submitting ${batches.length} batches of ${BATCH_SIZE}...`);
  const startTime = performance.now();

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const results = await Promise.allSettled(
      batch.map((tx) =>
        sendAndConfirmTransaction(connection, tx, [sender], {
          skipPreflight: true,
        }).catch(() => null)
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value !== null) {
        confirmed++;
      } else {
        failed++;
      }
    }

    const progress = ((b + 1) / batches.length * 100).toFixed(1);
    process.stdout.write(`\r  Batch ${b + 1}/${batches.length} (${progress}%) - ${confirmed} confirmed, ${failed} failed`);
  }

  const endTime = performance.now();
  const elapsedMs = endTime - startTime;
  const tps = confirmed / (elapsedMs / 1000);

  const result: TpsBenchResult = {
    totalTransactions: TOTAL_TRANSACTIONS,
    confirmedTransactions: confirmed,
    failedTransactions: failed,
    elapsedMs: Math.round(elapsedMs),
    tps: Math.round(tps * 100) / 100,
    batchSize: BATCH_SIZE,
    batchCount: batches.length,
  };

  console.log("\n\n=== TPS Results ===");
  console.log(`  Confirmed: ${confirmed}/${TOTAL_TRANSACTIONS}`);
  console.log(`  Failed: ${failed}/${TOTAL_TRANSACTIONS}`);
  console.log(`  Elapsed: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`  TPS: ${result.tps}`);

  // Save result for report generation
  const outPath = path.join(RESULTS_DIR, "tps-result.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to ${outPath}`);
}

main().catch((err) => {
  console.error("Benchmark failed:", err.message);
  process.exit(1);
});
