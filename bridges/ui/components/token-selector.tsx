"use client";

import { useState, useRef, useEffect } from "react";

export interface Token {
  symbol: string;
  name: string;
  chains: string[];
  decimals: number;
  icon: string;
}

export const BRIDGE_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", chains: ["ethereum", "prism"], decimals: 18, icon: "E" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", chains: ["ethereum", "prism"], decimals: 8, icon: "B" },
  { symbol: "BTC", name: "Bitcoin", chains: ["bitcoin", "prism"], decimals: 8, icon: "B" },
  { symbol: "SOL", name: "Solana", chains: ["solana", "prism"], decimals: 9, icon: "S" },
  { symbol: "USDC", name: "USD Coin", chains: ["ethereum", "solana", "prism"], decimals: 6, icon: "U" },
  { symbol: "USDT", name: "Tether", chains: ["ethereum", "solana", "prism"], decimals: 6, icon: "T" },
  { symbol: "scBTC", name: "Prism Bitcoin", chains: ["prism"], decimals: 8, icon: "B" },
  { symbol: "scETH", name: "Prism Ethereum", chains: ["prism"], decimals: 18, icon: "E" },
];

/** Mock balances for demo */
function getMockBalance(token: Token, chain: string): string {
  const balances: Record<string, Record<string, string>> = {
    ethereum: { ETH: "2.4531", WBTC: "0.0842", USDC: "5,230.00", USDT: "1,850.00" },
    bitcoin: { BTC: "0.1523" },
    solana: { SOL: "142.87", USDC: "3,100.00", USDT: "980.00" },
    prism: {
      scBTC: "0.0500", scETH: "1.2000", SOL: "50.00",
      USDC: "10,000.00", USDT: "2,500.00", ETH: "0.5000", WBTC: "0.0200", BTC: "0.0100",
    },
  };
  return balances[chain]?.[token.symbol] || "0.00";
}

interface TokenSelectorProps {
  sourceChain: string;
  selectedToken: string;
  onSelect: (symbol: string) => void;
}

export default function TokenSelector({
  sourceChain,
  selectedToken,
  onSelect,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableTokens = BRIDGE_TOKENS.filter((t) =>
    t.chains.includes(sourceChain)
  );
  const selected = availableTokens.find((t) => t.symbol === selectedToken) || availableTokens[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selection if current token is not available on the new chain
  useEffect(() => {
    if (!availableTokens.find((t) => t.symbol === selectedToken)) {
      if (availableTokens.length > 0) {
        onSelect(availableTokens[0].symbol);
      }
    }
  }, [sourceChain]);

  const tokenColors: Record<string, string> = {
    ETH: "#627EEA",
    WBTC: "#F7931A",
    BTC: "#F7931A",
    SOL: "#9945FF",
    USDC: "#2775CA",
    USDT: "#26A17B",
    scBTC: "#F7931A",
    scETH: "#627EEA",
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <label
        style={{ color: "#94A3B8", fontSize: 13, marginBottom: 6, display: "block" }}
      >
        Token
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "#13103A",
          border: "1px solid #2D2670",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          cursor: "pointer",
          color: "#E2E8F0",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: tokenColors[selected?.symbol] || "#666",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {selected?.icon}
        </div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{selected?.symbol}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>{selected?.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Balance</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {getMockBalance(selected, sourceChain)}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path d="M4 6L8 10L12 6" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#1A1545",
            border: "1px solid #2D2670",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 50,
            maxHeight: 280,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {availableTokens.map((token) => (
            <button
              key={token.symbol}
              type="button"
              onClick={() => {
                onSelect(token.symbol);
                setIsOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 16px",
                background: token.symbol === selectedToken ? "#231D5E" : "transparent",
                border: "none",
                cursor: "pointer",
                color: "#E2E8F0",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#231D5E";
              }}
              onMouseLeave={(e) => {
                if (token.symbol !== selectedToken) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: tokenColors[token.symbol] || "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 10,
                }}
              >
                {token.icon}
              </div>
              <div style={{ textAlign: "left", flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{token.symbol}</span>
                <span style={{ fontSize: 11, color: "#64748B", marginLeft: 6 }}>
                  {token.name}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#94A3B8" }}>
                {getMockBalance(token, sourceChain)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
