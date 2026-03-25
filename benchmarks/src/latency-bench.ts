/**
 * Latency Benchmark for SolClone
 *
 * Sends 50 sequential transactions and measures the time from send to
 * confirmation for each. Reports min, max, median, p95, and average.
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
const TOTAL_TRANSACTIONS = 50;
const RESULTS_DIR = path.resolve(import.meta.dirname ?? ".", "..");

interface LatencyResult {
  transactionIndex: number;
  latencyMs: number;
  success: boolean;
}

interface LatencyBenchResult {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  latencies: LatencyResult[];
  minMs: number;
  maxMs: number;
  medianMs: number;
  p95Ms: number;
  averageMs: number;
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

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log("=== SolClone Latency Benchmark ===\n");
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`Total transactions: ${TOTAL_TRANSACTIONS}\n`);

  const sender = Keypair.generate();
  const senderPubkey = sender.publicKey.toBase58();

  console.log(`Sender: ${senderPubkey}`);
  console.log("Requesting airdrop...");

  await rpcCall(RPC_URL, "requestAirdrop", [senderPubkey, 50 * LAMPORTS_PER_SOL]);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const connection = new Connection(RPC_URL, "confirmed");
  const latencies: LatencyResult[] = [];
  let successful = 0;
  let failed = 0;

  console.log("Sending sequential transactions...\n");

  for (let i = 0; i < TOTAL_TRANSACTIONS; i++) {
    const recipient = Keypair.generate();
    const { blockhash } = await connection.getLatestBlockhash();

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 1000,
      })
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = sender.publicKey;

    const start = performance.now();

    try {
      await sendAndConfirmTransaction(connection, tx, [sender], {
        skipPreflight: true,
      });
      const latencyMs = performance.now() - start;

      latencies.push({ transactionIndex: i, latencyMs: Math.round(latencyMs * 100) / 100, success: true });
      successful++;

      process.stdout.write(
        `\r  TX ${i + 1}/${TOTAL_TRANSACTIONS} - ${latencyMs.toFixed(1)}ms (${successful} ok, ${failed} fail)`
      );
    } catch {
      const latencyMs = performance.now() - start;
      latencies.push({ transactionIndex: i, latencyMs: Math.round(latencyMs * 100) / 100, success: false });
      failed++;

      process.stdout.write(
        `\r  TX ${i + 1}/${TOTAL_TRANSACTIONS} - FAILED (${successful} ok, ${failed} fail)`
      );
    }
  }

  // Calculate statistics
  const successLatencies = latencies
    .filter((l) => l.success)
    .map((l) => l.latencyMs)
    .sort((a, b) => a - b);

  const minMs = successLatencies.length > 0 ? successLatencies[0] : 0;
  const maxMs = successLatencies.length > 0 ? successLatencies[successLatencies.length - 1] : 0;
  const medianMs = successLatencies.length > 0 ? percentile(successLatencies, 50) : 0;
  const p95Ms = successLatencies.length > 0 ? percentile(successLatencies, 95) : 0;
  const averageMs =
    successLatencies.length > 0
      ? Math.round((successLatencies.reduce((a, b) => a + b, 0) / successLatencies.length) * 100) / 100
      : 0;

  const result: LatencyBenchResult = {
    totalTransactions: TOTAL_TRANSACTIONS,
    successfulTransactions: successful,
    failedTransactions: failed,
    latencies,
    minMs,
    maxMs,
    medianMs,
    p95Ms,
    averageMs,
  };

  console.log("\n\n=== Latency Results ===");
  console.log(`  Successful: ${successful}/${TOTAL_TRANSACTIONS}`);
  console.log(`  Failed: ${failed}/${TOTAL_TRANSACTIONS}`);
  console.log(`  Min:     ${minMs.toFixed(1)}ms`);
  console.log(`  Max:     ${maxMs.toFixed(1)}ms`);
  console.log(`  Median:  ${medianMs.toFixed(1)}ms`);
  console.log(`  P95:     ${p95Ms.toFixed(1)}ms`);
  console.log(`  Average: ${averageMs.toFixed(1)}ms`);

  const outPath = path.join(RESULTS_DIR, "latency-result.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to ${outPath}`);
}

main().catch((err) => {
  console.error("Benchmark failed:", err.message);
  process.exit(1);
});
