"use client";

import { useState, useCallback } from "react";

export const RPC_PRESETS = {
  devnet: "http://localhost:8899",
  testnet: "http://localhost:8799",
  custom: "",
} as const;

export type RpcNetwork = keyof typeof RPC_PRESETS;

interface RpcSelectorProps {
  rpcUrl: string;
  onRpcChange: (url: string) => void;
}

export default function RpcSelector({ rpcUrl, onRpcChange }: RpcSelectorProps) {
  const [network, setNetwork] = useState<RpcNetwork>(() => {
    if (rpcUrl === RPC_PRESETS.devnet) return "devnet";
    if (rpcUrl === RPC_PRESETS.testnet) return "testnet";
    return "custom";
  });
  const [customUrl, setCustomUrl] = useState(() =>
    network === "custom" ? rpcUrl : ""
  );

  const handleNetworkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = e.target.value as RpcNetwork;
      setNetwork(selected);
      if (selected !== "custom") {
        onRpcChange(RPC_PRESETS[selected]);
      } else if (customUrl) {
        onRpcChange(customUrl);
      }
    },
    [customUrl, onRpcChange]
  );

  const handleCustomUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setCustomUrl(url);
      if (url) {
        onRpcChange(url);
      }
    },
    [onRpcChange]
  );

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-[var(--muted)]">RPC:</label>
      <select
        value={network}
        onChange={handleNetworkChange}
        className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
      >
        <option value="devnet">Devnet (localhost:8899)</option>
        <option value="testnet">Testnet (localhost:8799)</option>
        <option value="custom">Custom URL</option>
      </select>

      {network === "custom" && (
        <input
          type="text"
          value={customUrl}
          onChange={handleCustomUrlChange}
          placeholder="http://..."
          className="w-48 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
      )}

      <span className="ml-1 h-2 w-2 rounded-full bg-[var(--accent)]" title="Connected" />
    </div>
  );
}
