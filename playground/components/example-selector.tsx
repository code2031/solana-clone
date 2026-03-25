"use client";

import { useCallback } from "react";

export interface CodeExample {
  name: string;
  code: string;
}

export const EXAMPLES: CodeExample[] = [
  {
    name: "Get Balance",
    code: `// Get Balance - Check an account's SOL balance
const address = "11111111111111111111111111111112";

console.log("Fetching balance for:", address);
const result = await prism.getBalance(address);

console.log("Balance result:", result);

const lamports = result?.value ?? 0;
const sol = lamports / 1_000_000_000;
console.log(\`Balance: \${sol} SOL (\${lamports} lamports)\`);`,
  },
  {
    name: "Send SOL",
    code: `// Send SOL - Transfer lamports between accounts
const from = "SenderAddress111111111111111111111111111111";
const to = "ReceiverAddress11111111111111111111111111111";
const lamports = 500_000_000; // 0.5 SOL

console.log(\`Sending \${lamports / 1e9} SOL...\`);
console.log(\`  From: \${from}\`);
console.log(\`  To:   \${to}\`);

try {
  const result = await prism.sendTransaction(from, to, lamports);
  console.log("Transaction signature:", result);
  console.log("Transfer complete!");
} catch (err) {
  console.error("Transfer failed:", err.message);
}`,
  },
  {
    name: "Create Token",
    code: `// Create Token - Initialize a new SPL token mint
// First, request some SOL for fees
const authority = "TokenAuthority1111111111111111111111111111";

console.log("Step 1: Requesting airdrop for token creation...");
const airdrop = await prism.requestAirdrop(authority, 2_000_000_000);
console.log("Airdrop result:", airdrop);

console.log("\\nStep 2: Creating token mint...");
const mintResult = await prism.call("createMint", [
  authority,  // mint authority
  authority,  // freeze authority
  9,          // decimals
]);
console.log("Mint created:", mintResult);

console.log("\\nStep 3: Minting tokens...");
const mintToResult = await prism.call("mintTo", [
  mintResult, // mint address
  authority,  // destination
  1000000000, // amount (1 token with 9 decimals)
]);
console.log("Minted tokens:", mintToResult);`,
  },
  {
    name: "Get Token Accounts",
    code: `// Get Token Accounts - List all token accounts for an owner
const owner = "TokenOwner111111111111111111111111111111111";
const mint = "TokenMint1111111111111111111111111111111111";

console.log("Fetching token accounts for owner:", owner);
console.log("Filtering by mint:", mint);

try {
  const accounts = await prism.getTokenAccountsByOwner(owner, mint);
  console.log("\\nToken accounts:", accounts);

  if (accounts?.value?.length > 0) {
    for (const account of accounts.value) {
      console.log("\\n--- Account ---");
      console.log("  Address:", account.pubkey);
      console.log("  Data:", account.account?.data);
    }
  } else {
    console.log("No token accounts found.");
  }
} catch (err) {
  console.error("Failed to fetch accounts:", err.message);
}`,
  },
  {
    name: "Get Block Info",
    code: `// Get Block Info - Fetch block details by slot
console.log("Fetching current block height...");
const height = await prism.getBlockHeight();
console.log("Current block height:", height);

if (typeof height === "number" && height > 0) {
  const targetSlot = height - 1;
  console.log(\`\\nFetching block at slot \${targetSlot}...\`);

  try {
    const block = await prism.getBlock(targetSlot);
    console.log("\\nBlock details:");
    console.log("  Parent slot:", block?.parentSlot);
    console.log("  Block time:", block?.blockTime ? new Date(block.blockTime * 1000).toISOString() : "N/A");
    console.log("  Transactions:", block?.transactions?.length ?? 0);

    if (block?.transactions?.length > 0) {
      console.log("\\nFirst transaction:");
      console.log(block.transactions[0]);
    }
  } catch (err) {
    console.error("Failed to fetch block:", err.message);
  }
} else {
  console.log("No blocks available yet.");
}`,
  },
];

interface ExampleSelectorProps {
  onSelect: (code: string) => void;
}

export default function ExampleSelector({ onSelect }: ExampleSelectorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value, 10);
      if (!isNaN(idx) && idx >= 0 && idx < EXAMPLES.length) {
        onSelect(EXAMPLES[idx].code);
      }
    },
    [onSelect]
  );

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-[var(--muted)]">Examples:</label>
      <select
        onChange={handleChange}
        defaultValue=""
        className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
      >
        <option value="" disabled>
          Load an example...
        </option>
        {EXAMPLES.map((ex, i) => (
          <option key={ex.name} value={i}>
            {ex.name}
          </option>
        ))}
      </select>
    </div>
  );
}
