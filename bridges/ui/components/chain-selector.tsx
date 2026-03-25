"use client";

import { useState, useRef, useEffect } from "react";

export interface Chain {
  id: string;
  name: string;
  color: string;
  shortLabel: string;
  network: string;
}

export const CHAINS: Chain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    color: "#627EEA",
    shortLabel: "ETH",
    network: "Mainnet",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    color: "#F7931A",
    shortLabel: "BTC",
    network: "Mainnet",
  },
  {
    id: "solana",
    name: "Solana",
    color: "#9945FF",
    shortLabel: "SOL",
    network: "Mainnet-Beta",
  },
  {
    id: "solclone",
    name: "SolClone",
    color: "linear-gradient(135deg, #8B5CF6, #10B981)",
    shortLabel: "SC",
    network: "Mainnet",
  },
];

function ChainIcon({ chain, size = 32 }: { chain: Chain; size?: number }) {
  const isGradient = chain.color.includes("gradient");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: chain.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {chain.shortLabel}
    </div>
  );
}

interface ChainSelectorProps {
  label: string;
  selectedChainId: string;
  onSelect: (chainId: string) => void;
  disabledChainId?: string;
}

export default function ChainSelector({
  label,
  selectedChainId,
  onSelect,
  disabledChainId,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedChain = CHAINS.find((c) => c.id === selectedChainId) || CHAINS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <label
        style={{ color: "#94A3B8", fontSize: 13, marginBottom: 6, display: "block" }}
      >
        {label}
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
          gap: 12,
          width: "100%",
          cursor: "pointer",
          color: "#E2E8F0",
          transition: "border-color 0.2s",
        }}
      >
        <ChainIcon chain={selectedChain} size={32} />
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedChain.name}</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>{selectedChain.network}</div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
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
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {CHAINS.map((chain) => {
            const isDisabled = chain.id === disabledChainId;
            const isSelected = chain.id === selectedChainId;
            return (
              <button
                key={chain.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    onSelect(chain.id);
                    setIsOpen(false);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 16px",
                  background: isSelected ? "#231D5E" : "transparent",
                  border: "none",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  color: isDisabled ? "#475569" : "#E2E8F0",
                  opacity: isDisabled ? 0.5 : 1,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    (e.currentTarget as HTMLElement).style.background = "#231D5E";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                <ChainIcon chain={chain} size={28} />
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{chain.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{chain.network}</div>
                </div>
                {isDisabled && (
                  <span style={{ fontSize: 11, color: "#64748B" }}>Selected</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
