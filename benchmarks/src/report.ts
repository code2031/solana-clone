/**
 * Report Generator for SolClone Benchmarks
 *
 * Reads TPS and latency results, formats them as a markdown table,
 * and writes to RESULTS.md.
 */

import * as fs from "fs";
import * as path from "path";

const RESULTS_DIR = path.resolve(import.meta.dirname ?? ".", "..");

interface TpsResult {
  totalTransactions: number;
  confirmedTransactions: number;
  failedTransactions: number;
  elapsedMs: number;
  tps: number;
  batchSize: number;
  batchCount: number;
}

interface LatencyResult {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  minMs: number;
  maxMs: number;
  medianMs: number;
  p95Ms: number;
  averageMs: number;
}

function loadJson<T>(filename: string): T | null {
  const filePath = path.join(RESULTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filename} not found, skipping.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function main() {
  console.log("=== Generating Benchmark Report ===\n");

  const tpsResult = loadJson<TpsResult>("tps-result.json");
  const latencyResult = loadJson<LatencyResult>("latency-result.json");
  const timestamp = new Date().toISOString();

  let markdown = `# SolClone Benchmark Results

> Generated: ${timestamp}

## Summary

| Metric | Value |
|--------|-------|
`;

  if (tpsResult) {
    markdown += `| **TPS (Transactions Per Second)** | **${tpsResult.tps}** |
| Confirmed Transactions | ${tpsResult.confirmedTransactions} / ${tpsResult.totalTransactions} |
| Failed Transactions | ${tpsResult.failedTransactions} |
| Total Elapsed Time | ${(tpsResult.elapsedMs / 1000).toFixed(2)}s |
| Batch Size | ${tpsResult.batchSize} |
| Batch Count | ${tpsResult.batchCount} |
`;
  }

  if (latencyResult) {
    markdown += `
## Latency

| Metric | Value |
|--------|-------|
| **Median Latency** | **${latencyResult.medianMs.toFixed(1)}ms** |
| Min Latency | ${latencyResult.minMs.toFixed(1)}ms |
| Max Latency | ${latencyResult.maxMs.toFixed(1)}ms |
| P95 Latency | ${latencyResult.p95Ms.toFixed(1)}ms |
| Average Latency | ${latencyResult.averageMs.toFixed(1)}ms |
| Successful | ${latencyResult.successfulTransactions} / ${latencyResult.totalTransactions} |
| Failed | ${latencyResult.failedTransactions} |
`;
  }

  markdown += `
## Configuration

| Parameter | Value |
|-----------|-------|
| RPC URL | \`${process.env.RPC_URL || "http://localhost:8899"}\` |
| TPS Batch Size | ${tpsResult?.batchSize ?? "N/A"} |
| TPS Total TX | ${tpsResult?.totalTransactions ?? "N/A"} |
| Latency Total TX | ${latencyResult?.totalTransactions ?? "N/A"} |

## How to Reproduce

\`\`\`bash
cd benchmarks

# Run all benchmarks
./run.sh

# Or run individually
npm run bench:tps
npm run bench:latency
npm run report
\`\`\`

## Notes

- TPS benchmark pre-signs ${tpsResult?.totalTransactions ?? 500} transactions and submits in parallel batches of ${tpsResult?.batchSize ?? 50}
- Latency benchmark sends ${latencyResult?.totalTransactions ?? 50} sequential transactions and measures send-to-confirm time
- Results depend on hardware, network conditions, and validator configuration
- For best results, run on the same machine as the validator
`;

  const outPath = path.join(RESULTS_DIR, "RESULTS.md");
  fs.writeFileSync(outPath, markdown);
  console.log(`Report written to ${outPath}`);
  console.log("\n--- Preview ---\n");
  console.log(markdown);
}

main();
