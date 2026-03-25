/**
 * Prism Chain Definitions for WalletConnect
 *
 * WalletConnect v2 uses CAIP-2 chain identifiers. This module defines
 * the Prism chains and their associated metadata so that sessions
 * can be established with the correct network parameters.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface ChainDefinition {
  /** CAIP-2 chain identifier (e.g., "prism:mainnet"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** WalletConnect namespace (e.g., "prism"). */
  namespace: string;
  /** Network reference within the namespace. */
  reference: string;
  /** JSON-RPC endpoint URL. */
  rpcUrl: string;
  /** WebSocket endpoint URL (optional). */
  wsUrl?: string;
  /** Block explorer URL (optional). */
  explorerUrl?: string;
  /** Native token metadata. */
  nativeToken: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Whether this is a test network. */
  isTestnet: boolean;
}

// ── Chain Definitions ───────────────────────────────────────────────────────

export const PRISM_MAINNET: ChainDefinition = {
  id: "prism:mainnet",
  name: "Prism Mainnet",
  namespace: "prism",
  reference: "mainnet",
  rpcUrl: "https://rpc.prism.io",
  wsUrl: "wss://rpc.prism.io",
  explorerUrl: "https://explorer.prism.io",
  nativeToken: {
    name: "Prism",
    symbol: "PRISM",
    decimals: 9,
  },
  isTestnet: false,
};

export const PRISM_TESTNET: ChainDefinition = {
  id: "prism:testnet",
  name: "Prism Testnet",
  namespace: "prism",
  reference: "testnet",
  rpcUrl: "https://testnet.rpc.prism.io",
  wsUrl: "wss://testnet.rpc.prism.io",
  explorerUrl: "https://testnet.explorer.prism.io",
  nativeToken: {
    name: "Prism",
    symbol: "PRISM",
    decimals: 9,
  },
  isTestnet: true,
};

export const PRISM_DEVNET: ChainDefinition = {
  id: "prism:devnet",
  name: "Prism Devnet",
  namespace: "prism",
  reference: "devnet",
  rpcUrl: "https://devnet.rpc.prism.io",
  wsUrl: "wss://devnet.rpc.prism.io",
  explorerUrl: "https://devnet.explorer.prism.io",
  nativeToken: {
    name: "Prism",
    symbol: "PRISM",
    decimals: 9,
  },
  isTestnet: true,
};

// ── Solana-Compatible Chain References ──────────────────────────────────────

export const SOLANA_MAINNET: ChainDefinition = {
  id: "solana:mainnet",
  name: "Solana Mainnet Beta",
  namespace: "solana",
  reference: "mainnet",
  rpcUrl: "https://api.mainnet-beta.solana.com",
  wsUrl: "wss://api.mainnet-beta.solana.com",
  explorerUrl: "https://explorer.solana.com",
  nativeToken: {
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
  },
  isTestnet: false,
};

export const SOLANA_TESTNET: ChainDefinition = {
  id: "solana:testnet",
  name: "Solana Testnet",
  namespace: "solana",
  reference: "testnet",
  rpcUrl: "https://api.testnet.solana.com",
  wsUrl: "wss://api.testnet.solana.com",
  explorerUrl: "https://explorer.solana.com/?cluster=testnet",
  nativeToken: {
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
  },
  isTestnet: true,
};

export const SOLANA_DEVNET: ChainDefinition = {
  id: "solana:devnet",
  name: "Solana Devnet",
  namespace: "solana",
  reference: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  wsUrl: "wss://api.devnet.solana.com",
  explorerUrl: "https://explorer.solana.com/?cluster=devnet",
  nativeToken: {
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
  },
  isTestnet: true,
};

// ── Lookups ─────────────────────────────────────────────────────────────────

/** All supported chains. */
export const ALL_CHAINS: ChainDefinition[] = [
  PRISM_MAINNET,
  PRISM_TESTNET,
  PRISM_DEVNET,
  SOLANA_MAINNET,
  SOLANA_TESTNET,
  SOLANA_DEVNET,
];

/** Map from CAIP-2 id to chain definition. */
export const CHAIN_MAP = new Map<string, ChainDefinition>(
  ALL_CHAINS.map((c) => [c.id, c]),
);

/** Resolve a CAIP-2 chain id to its definition, or undefined. */
export function getChain(chainId: string): ChainDefinition | undefined {
  return CHAIN_MAP.get(chainId);
}

/**
 * Returns the CAIP-2 chain ids grouped by namespace, suitable for
 * WalletConnect session proposals.
 *
 * @example
 * ```ts
 * getNamespaces()
 * // {
 * //   prism: { chains: ["prism:mainnet", ...], methods: [...], events: [...] },
 * //   solana:   { chains: ["solana:mainnet", ...],   methods: [...], events: [...] }
 * // }
 * ```
 */
export function getNamespaces(): Record<
  string,
  { chains: string[]; methods: string[]; events: string[] }
> {
  const methods = [
    "solana_signTransaction",
    "solana_signAndSendTransaction",
    "solana_signMessage",
  ];
  const events = ["accountsChanged", "chainChanged"];

  const prismChains = ALL_CHAINS.filter(
    (c) => c.namespace === "prism",
  ).map((c) => c.id);

  const solanaChains = ALL_CHAINS.filter(
    (c) => c.namespace === "solana",
  ).map((c) => c.id);

  return {
    prism: { chains: prismChains, methods, events },
    solana: { chains: solanaChains, methods, events },
  };
}
