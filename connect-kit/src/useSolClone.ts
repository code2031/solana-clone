/**
 * usePrism — Hook for Prism-specific features.
 *
 * Wraps Prism RPC calls and network management into a convenient
 * React hook for DApp developers.
 */

import { useState, useCallback } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

export type PrismNetwork = "devnet" | "testnet" | "mainnet";

export interface TokenAccount {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
}

export interface UsePrismReturn {
  /** Current network. */
  network: PrismNetwork;
  /** Switch to a different network. */
  switchNetwork: (network: PrismNetwork) => void;
  /** Request an airdrop of test tokens (devnet/testnet only). */
  requestAirdrop: (address: string, lamports?: number) => Promise<string>;
  /** Get the balance for an address (in lamports). */
  getBalance: (address: string) => Promise<number>;
  /** Get all SPL token accounts for an address. */
  getTokenAccounts: (address: string) => Promise<TokenAccount[]>;
}

// ── RPC URLs ────────────────────────────────────────────────────────────────

const RPC_URLS: Record<PrismNetwork, string> = {
  mainnet: "https://rpc.prism.io",
  testnet: "https://testnet.rpc.prism.io",
  devnet: "https://devnet.rpc.prism.io",
};

// ── RPC Helper ──────────────────────────────────────────────────────────────

async function rpcCall(
  network: PrismNetwork,
  method: string,
  params: any[],
): Promise<any> {
  const url = RPC_URLS[network];

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `RPC error ${data.error.code}: ${data.error.message}`,
    );
  }

  return data.result;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function usePrism(
  initialNetwork: PrismNetwork = "devnet",
): UsePrismReturn {
  const [network, setNetwork] = useState<PrismNetwork>(initialNetwork);

  // ── Switch Network ──────────────────────────────────────────────────

  const switchNetwork = useCallback((newNetwork: PrismNetwork) => {
    if (!RPC_URLS[newNetwork]) {
      throw new Error(`Unknown network: ${newNetwork}`);
    }
    setNetwork(newNetwork);
  }, []);

  // ── Request Airdrop ─────────────────────────────────────────────────

  const requestAirdrop = useCallback(
    async (
      address: string,
      lamports: number = 1_000_000_000, // 1 PRISM by default
    ): Promise<string> => {
      if (network === "mainnet") {
        throw new Error("Airdrops are not available on mainnet.");
      }

      const result = await rpcCall(network, "requestAirdrop", [
        address,
        lamports,
      ]);

      // result is typically a transaction signature string.
      return typeof result === "string" ? result : result.signature ?? result;
    },
    [network],
  );

  // ── Get Balance ─────────────────────────────────────────────────────

  const getBalance = useCallback(
    async (address: string): Promise<number> => {
      const result = await rpcCall(network, "getBalance", [address]);

      // RPC returns { context: {...}, value: <lamports> }
      return typeof result === "number"
        ? result
        : result?.value ?? 0;
    },
    [network],
  );

  // ── Get Token Accounts ──────────────────────────────────────────────

  const getTokenAccounts = useCallback(
    async (address: string): Promise<TokenAccount[]> => {
      const result = await rpcCall(network, "getTokenAccountsByOwner", [
        address,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" },
      ]);

      const accounts: TokenAccount[] = [];

      if (result?.value && Array.isArray(result.value)) {
        for (const item of result.value) {
          const info = item?.account?.data?.parsed?.info;
          if (!info) continue;

          accounts.push({
            mint: info.mint ?? "",
            owner: info.owner ?? address,
            amount: info.tokenAmount?.amount ?? "0",
            decimals: info.tokenAmount?.decimals ?? 0,
            uiAmount: info.tokenAmount?.uiAmount ?? 0,
          });
        }
      }

      return accounts;
    },
    [network],
  );

  return {
    network,
    switchNetwork,
    requestAirdrop,
    getBalance,
    getTokenAccounts,
  };
}
