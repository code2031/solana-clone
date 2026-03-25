export interface ParsedQuery {
  intent: string;
  params: Record<string, string | number>;
  rpcMethod: string;
  description: string;
}

interface PatternRule {
  patterns: RegExp[];
  intent: string;
  rpcMethod: string;
  description: string;
  extractParams: (match: RegExpMatchArray, query: string) => Record<string, string | number>;
}

const ADDRESS_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

const RULES: PatternRule[] = [
  {
    patterns: [
      /balance\s+(?:of\s+)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
      /(?:how\s+much|what(?:'s| is))\s+(?:the\s+)?balance\s+(?:of\s+|for\s+)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
      /([1-9A-HJ-NP-Za-km-z]{32,44})\s+balance/i,
    ],
    intent: "get_balance",
    rpcMethod: "getBalance",
    description: "Get SOL balance for an account",
    extractParams: (match) => ({ address: match[1] }),
  },
  {
    patterns: [
      /(?:largest|biggest|top|recent)\s+transactions?/i,
      /(?:show|get|list)\s+(?:the\s+)?(?:latest|recent)\s+(?:transactions?|txs?)/i,
    ],
    intent: "recent_transactions",
    rpcMethod: "getSignaturesForAddress",
    description: "Get recent large transactions",
    extractParams: (_match, query) => {
      const addrMatch = query.match(ADDRESS_REGEX);
      return { limit: 10, address: addrMatch ? addrMatch[0] : "system" };
    },
  },
  {
    patterns: [
      /block\s+(?:#?\s*)?(\d+)/i,
      /(?:show|get|info)\s+(?:about\s+)?block\s+(?:#?\s*)?(\d+)/i,
      /slot\s+(?:#?\s*)?(\d+)/i,
    ],
    intent: "get_block",
    rpcMethod: "getBlock",
    description: "Get block details",
    extractParams: (match) => ({ slot: parseInt(match[1] || match[2]) }),
  },
  {
    patterns: [
      /token\s+supply\s+(?:of\s+|for\s+)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
      /(?:total|circulating)\s+supply\s+(?:of\s+|for\s+)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
    ],
    intent: "token_supply",
    rpcMethod: "getTokenSupply",
    description: "Get token supply information",
    extractParams: (match) => ({ mint: match[1] }),
  },
  {
    patterns: [
      /validators?/i,
      /(?:show|list|get)\s+(?:all\s+)?validators?/i,
      /vote\s+accounts?/i,
      /who(?:'s| is)\s+validating/i,
    ],
    intent: "validators",
    rpcMethod: "getVoteAccounts",
    description: "Get active validator information",
    extractParams: () => ({}),
  },
  {
    patterns: [
      /tps|throughput|transactions?\s+per\s+second/i,
      /(?:current|network)\s+(?:tps|speed|throughput)/i,
      /(?:how\s+fast|how\s+many\s+tps)/i,
    ],
    intent: "performance",
    rpcMethod: "getRecentPerformanceSamples",
    description: "Get network throughput (TPS)",
    extractParams: () => ({ limit: 5 }),
  },
  {
    patterns: [
      /epoch\s*(?:info)?/i,
      /(?:current|what)\s+epoch/i,
      /slot\s*(?:info)?$/i,
      /(?:current|latest)\s+slot/i,
    ],
    intent: "epoch_info",
    rpcMethod: "getEpochInfo",
    description: "Get current epoch and slot information",
    extractParams: () => ({}),
  },
  {
    patterns: [
      /account\s+(?:info|details?)\s+(?:for\s+|of\s+)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
      /(?:show|get|lookup)\s+(?:account\s+)?([1-9A-HJ-NP-Za-km-z]{32,44})/i,
      /(?:what\s+is|info\s+(?:on|about))\s+([1-9A-HJ-NP-Za-km-z]{32,44})/i,
    ],
    intent: "account_info",
    rpcMethod: "getAccountInfo",
    description: "Get account details",
    extractParams: (match) => ({ address: match[1] }),
  },
  {
    patterns: [
      /(?:network|cluster)\s+(?:status|health|info)/i,
      /(?:is\s+(?:the\s+)?network|solana)\s+(?:up|down|working|healthy)/i,
    ],
    intent: "cluster_info",
    rpcMethod: "getClusterNodes",
    description: "Get cluster/network status",
    extractParams: () => ({}),
  },
  {
    patterns: [
      /(?:minimum|min)\s+(?:balance|rent)/i,
      /rent\s+(?:exempt(?:ion)?|cost)/i,
    ],
    intent: "rent",
    rpcMethod: "getMinimumBalanceForRentExemption",
    description: "Get minimum rent exemption balance",
    extractParams: () => ({ dataLength: 0 }),
  },
];

export function parseQuery(query: string): ParsedQuery | null {
  const trimmed = query.trim();

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return {
          intent: rule.intent,
          params: rule.extractParams(match, trimmed),
          rpcMethod: rule.rpcMethod,
          description: rule.description,
        };
      }
    }
  }

  // Fallback: check if query contains an address
  const addrMatch = trimmed.match(ADDRESS_REGEX);
  if (addrMatch) {
    return {
      intent: "account_info",
      params: { address: addrMatch[0] },
      rpcMethod: "getAccountInfo",
      description: "Get account information",
    };
  }

  return null;
}

export const EXAMPLE_QUERIES = [
  "What is the current epoch?",
  "Show network TPS",
  "Balance of 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "List validators",
  "Block 250000000",
  "Largest recent transactions",
  "Cluster status",
  "Minimum rent exemption",
];
