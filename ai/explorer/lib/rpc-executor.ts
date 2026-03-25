import { ParsedQuery } from "./query-parser";

export interface QueryResult {
  type: "balance" | "transactions" | "block" | "account" | "validators" | "performance" | "epoch" | "cluster" | "token_supply" | "rent" | "error";
  title: string;
  data: Record<string, unknown>;
  rpcMethod: string;
}

// Mock RPC responses for demonstration
function mockBalance(address: string): QueryResult {
  const seed = address.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const balance = ((seed * 7919) % 100000) / 100;

  return {
    type: "balance",
    title: `Balance for ${address.slice(0, 8)}...${address.slice(-4)}`,
    data: {
      address,
      lamports: Math.round(balance * 1e9),
      sol: balance,
      usdValue: (balance * 148.52).toFixed(2),
    },
    rpcMethod: "getBalance",
  };
}

function mockTransactions(): QueryResult {
  const txs = Array.from({ length: 10 }, (_, i) => ({
    signature: `${(5 - i)}abc${Math.random().toString(36).slice(2, 10)}def${Math.random().toString(36).slice(2, 14)}`,
    slot: 250000000 - i * 3,
    blockTime: Math.floor(Date.now() / 1000) - i * 60,
    fee: 5000 + Math.floor(Math.random() * 10000),
    status: i === 3 ? "Failed" : "Success",
    amount: ((10 - i) * 1234.56 + Math.random() * 5000).toFixed(2),
  }));

  return {
    type: "transactions",
    title: "Recent Transactions",
    data: { transactions: txs, count: txs.length },
    rpcMethod: "getSignaturesForAddress",
  };
}

function mockBlock(slot: number): QueryResult {
  return {
    type: "block",
    title: `Block #${slot.toLocaleString()}`,
    data: {
      slot,
      blockhash: `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`.slice(0, 44),
      parentSlot: slot - 1,
      blockTime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
      blockHeight: slot - 100000,
      transactions: 847 + Math.floor(Math.random() * 500),
      rewards: [
        { pubkey: "Vote111111111111111111111111111111111111111", lamports: 5000000, type: "voting" },
      ],
      previousBlockhash: `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`.slice(0, 44),
    },
    rpcMethod: "getBlock",
  };
}

function mockValidators(): QueryResult {
  const validators = [
    { name: "Chorus One", votePubkey: "ChorusmmC7X...", stake: 4250000, commission: 5, lastVote: 250000000, active: true },
    { name: "Figment", votePubkey: "Figment2y3k...", stake: 3800000, commission: 7, lastVote: 249999998, active: true },
    { name: "Everstake", votePubkey: "EverstaKe8Z...", stake: 3200000, commission: 3, lastVote: 250000000, active: true },
    { name: "Solana Beach", votePubkey: "SolBeach4x1...", stake: 2900000, commission: 10, lastVote: 250000000, active: true },
    { name: "Shinobi Systems", votePubkey: "ShinobiSys7...", stake: 2100000, commission: 0, lastVote: 249999999, active: true },
    { name: "P2P Validator", votePubkey: "P2PValid8r2...", stake: 1800000, commission: 6, lastVote: 249999997, active: true },
    { name: "Laine", votePubkey: "LaineSOL3n5...", stake: 1500000, commission: 5, lastVote: 250000000, active: true },
  ];

  return {
    type: "validators",
    title: "Active Validators",
    data: {
      validators,
      totalStake: validators.reduce((s, v) => s + v.stake, 0),
      totalValidators: 1847,
      showing: validators.length,
    },
    rpcMethod: "getVoteAccounts",
  };
}

function mockPerformance(): QueryResult {
  const samples = Array.from({ length: 5 }, (_, i) => ({
    slot: 250000000 - i * 60,
    numTransactions: 2500 + Math.floor(Math.random() * 2000),
    numNonVoteTransactions: 800 + Math.floor(Math.random() * 600),
    samplePeriodSecs: 60,
    tps: Math.round(2500 + Math.random() * 2000),
  }));

  const avgTps = Math.round(samples.reduce((s, x) => s + x.tps, 0) / samples.length);

  return {
    type: "performance",
    title: "Network Performance",
    data: {
      samples,
      averageTps: avgTps,
      peakTps: Math.max(...samples.map((s) => s.tps)),
    },
    rpcMethod: "getRecentPerformanceSamples",
  };
}

function mockEpochInfo(): QueryResult {
  return {
    type: "epoch",
    title: "Current Epoch Info",
    data: {
      epoch: 525,
      slotIndex: 185432,
      slotsInEpoch: 432000,
      absoluteSlot: 250000000,
      blockHeight: 249900000,
      transactionCount: 285000000000,
      epochProgress: ((185432 / 432000) * 100).toFixed(1),
      estimatedTimeRemaining: "1d 14h 23m",
    },
    rpcMethod: "getEpochInfo",
  };
}

function mockAccountInfo(address: string): QueryResult {
  const seed = address.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  return {
    type: "account",
    title: `Account ${address.slice(0, 8)}...${address.slice(-4)}`,
    data: {
      address,
      lamports: ((seed * 7919) % 100000) * 10000000,
      owner: "11111111111111111111111111111111",
      executable: false,
      rentEpoch: 525,
      dataLength: seed % 2 === 0 ? 0 : 165,
      type: seed % 2 === 0 ? "System Account" : "Token Account",
    },
    rpcMethod: "getAccountInfo",
  };
}

function mockClusterInfo(): QueryResult {
  return {
    type: "cluster",
    title: "Cluster Status",
    data: {
      status: "Healthy",
      clusterNodes: 1847,
      currentSlot: 250000000,
      epoch: 525,
      networkVersion: "1.17.28",
      featureSet: 4215500110,
      health: "ok",
    },
    rpcMethod: "getClusterNodes",
  };
}

function mockTokenSupply(mint: string): QueryResult {
  const seed = mint.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    type: "token_supply",
    title: `Token Supply`,
    data: {
      mint,
      supply: (seed * 1000000).toString(),
      decimals: 9,
      uiAmount: seed * 1000000 / 1e9,
      formatted: (seed * 1000000 / 1e9).toLocaleString(),
    },
    rpcMethod: "getTokenSupply",
  };
}

function mockRent(): QueryResult {
  return {
    type: "rent",
    title: "Rent Exemption",
    data: {
      minimumBalance: 890880,
      minimumBalanceSol: 0.00089088,
      dataSize: 0,
      note: "Minimum balance for a zero-data account",
    },
    rpcMethod: "getMinimumBalanceForRentExemption",
  };
}

export async function executeQuery(parsed: ParsedQuery): Promise<QueryResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  switch (parsed.intent) {
    case "get_balance":
      return mockBalance(parsed.params.address as string);
    case "recent_transactions":
      return mockTransactions();
    case "get_block":
      return mockBlock(parsed.params.slot as number);
    case "token_supply":
      return mockTokenSupply(parsed.params.mint as string);
    case "validators":
      return mockValidators();
    case "performance":
      return mockPerformance();
    case "epoch_info":
      return mockEpochInfo();
    case "account_info":
      return mockAccountInfo(parsed.params.address as string);
    case "cluster_info":
      return mockClusterInfo();
    case "rent":
      return mockRent();
    default:
      return {
        type: "error",
        title: "Unknown Query",
        data: { message: "Could not understand the query. Try one of the example queries." },
        rpcMethod: "unknown",
      };
  }
}
