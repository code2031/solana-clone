"use client";

import { useState, useCallback } from "react";
import ChainSelector from "@/components/chain-selector";
import TokenSelector from "@/components/token-selector";
import BridgeStatusTracker, { type BridgeStep } from "@/components/bridge-status";
import FeeEstimate from "@/components/fee-estimate";
import RecentBridges from "@/components/recent-bridges";
import { getBridgeClient, type ChainId } from "@/lib/bridge-client";

export default function BridgePage() {
  const [sourceChain, setSourceChain] = useState<string>("ethereum");
  const [destChain, setDestChain] = useState<string>("solclone");
  const [selectedToken, setSelectedToken] = useState<string>("ETH");
  const [amount, setAmount] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState<BridgeStep | null>(null);
  const [bridgeTxHash, setBridgeTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSwapChains = useCallback(() => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setSelectedToken("");
    setAmount("");
  }, [sourceChain, destChain]);

  const handleSourceChainChange = useCallback((chainId: string) => {
    setSourceChain(chainId);
    setSelectedToken("");
    setError("");
  }, []);

  const handleDestChainChange = useCallback((chainId: string) => {
    setDestChain(chainId);
    setError("");
  }, []);

  const handleBridge = useCallback(async () => {
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!recipientAddress) {
      setError("Please enter a recipient address");
      return;
    }
    if (sourceChain === destChain) {
      setError("Source and destination chains must be different");
      return;
    }
    if (sourceChain !== "solclone" && destChain !== "solclone") {
      setError("One side of the bridge must be SolClone");
      return;
    }

    setIsBridging(true);
    setBridgeStep("initiated");

    try {
      const client = getBridgeClient();
      const result = await client.bridge({
        sourceChain: sourceChain as ChainId,
        destChain: destChain as ChainId,
        token: selectedToken,
        amount,
        recipientAddress,
        senderAddress: "mock-sender",
      });

      if (!result.success) {
        setError(result.error || "Bridge transaction failed");
        setIsBridging(false);
        setBridgeStep(null);
        return;
      }

      setBridgeTxHash(result.txHash);

      // Simulate step progression
      setBridgeStep("confirming");
      await new Promise((r) => setTimeout(r, 3000));

      setBridgeStep("attesting");
      await new Promise((r) => setTimeout(r, 2000));

      setBridgeStep("minting");
      await new Promise((r) => setTimeout(r, 2000));

      setBridgeStep("complete");
    } catch (err) {
      setError(`Bridge failed: ${err}`);
      setBridgeStep(null);
    } finally {
      setIsBridging(false);
    }
  }, [amount, recipientAddress, sourceChain, destChain, selectedToken]);

  const bridgeSteps = [
    { key: "initiated" as BridgeStep, label: "Initiated on " + sourceChain, txHash: bridgeTxHash || undefined },
    { key: "confirming" as BridgeStep, label: `Confirming on ${sourceChain}` },
    { key: "attesting" as BridgeStep, label: "Guardian attestation" },
    { key: "minting" as BridgeStep, label: `Minting on ${destChain}` },
    { key: "complete" as BridgeStep, label: "Transfer complete" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          <span className="gradient-text">Cross-Chain Bridge</span>
        </h2>
        <p style={{ color: "#64748B", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
          Transfer assets between Ethereum, Bitcoin, Solana, and SolClone with
          guardian-verified security.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        {/* Bridge Form */}
        <div
          style={{
            background: "#1A1545",
            border: "1px solid #2D2670",
            borderRadius: 16,
            padding: 28,
          }}
        >
          {/* Chain Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end" }}>
            <ChainSelector
              label="From"
              selectedChainId={sourceChain}
              onSelect={handleSourceChainChange}
              disabledChainId={destChain}
            />

            {/* Swap button */}
            <button
              type="button"
              onClick={handleSwapChains}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#231D5E",
                border: "1px solid #2D2670",
                color: "#8B5CF6",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 2,
                transition: "background 0.2s",
              }}
              title="Swap chains"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M5 3L5 15M5 15L2 12M5 15L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 15L13 3M13 3L10 6M13 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <ChainSelector
              label="To"
              selectedChainId={destChain}
              onSelect={handleDestChainChange}
              disabledChainId={sourceChain}
            />
          </div>

          {/* Token + Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
            <TokenSelector
              sourceChain={sourceChain}
              selectedToken={selectedToken}
              onSelect={setSelectedToken}
            />

            <div>
              <label
                style={{ color: "#94A3B8", fontSize: 13, marginBottom: 6, display: "block" }}
              >
                Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                style={{
                  background: "#13103A",
                  border: "1px solid #2D2670",
                  borderRadius: 12,
                  padding: "12px 16px",
                  width: "100%",
                  color: "#E2E8F0",
                  fontSize: 15,
                  fontWeight: 500,
                  boxSizing: "border-box",
                  height: 58,
                }}
              />
            </div>
          </div>

          {/* Recipient Address */}
          <div style={{ marginTop: 16 }}>
            <label
              style={{ color: "#94A3B8", fontSize: 13, marginBottom: 6, display: "block" }}
            >
              Recipient Address ({destChain})
            </label>
            <input
              type="text"
              placeholder={
                destChain === "ethereum"
                  ? "0x..."
                  : destChain === "bitcoin"
                  ? "bc1q..."
                  : "Base58 address..."
              }
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                setError("");
              }}
              style={{
                background: "#13103A",
                border: "1px solid #2D2670",
                borderRadius: 12,
                padding: "12px 16px",
                width: "100%",
                color: "#E2E8F0",
                fontSize: 14,
                boxSizing: "border-box",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            />
          </div>

          {/* Fee Estimate */}
          <div style={{ marginTop: 16 }}>
            <FeeEstimate
              sourceChain={sourceChain}
              destChain={destChain}
              token={selectedToken}
              amount={amount}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                background: "#EF444422",
                border: "1px solid #EF444444",
                borderRadius: 8,
                color: "#EF4444",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* Bridge Button */}
          <button
            type="button"
            className="btn-bridge"
            onClick={handleBridge}
            disabled={isBridging}
            style={{ marginTop: 20 }}
          >
            {isBridging ? "Bridging..." : `Bridge ${selectedToken || "Tokens"}`}
          </button>
        </div>

        {/* Status Panel */}
        <div>
          {bridgeStep ? (
            <BridgeStatusTracker
              currentStep={bridgeStep}
              steps={bridgeSteps}
              sourceChain={sourceChain}
              destChain={destChain}
            />
          ) : (
            <div
              style={{
                background: "#1A1545",
                border: "1px solid #2D2670",
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#231D5E",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 6L8 18M8 18L4 14M8 18L12 14"
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 18L16 6M16 6L12 10M16 6L20 10"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>
                Ready to Bridge
              </h3>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                Select your source and destination chains, choose a token and
                amount, then click Bridge to initiate a cross-chain transfer.
              </p>

              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: "#13103A",
                  borderRadius: 10,
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 10 }}>
                  Estimated Transfer Times
                </div>
                {[
                  { chain: "Ethereum", time: "~15 min", color: "#627EEA" },
                  { chain: "Bitcoin", time: "~60 min", color: "#F7931A" },
                  { chain: "Solana", time: "~30 sec", color: "#9945FF" },
                ].map((item) => (
                  <div
                    key={item.chain}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: item.color,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ color: "#E2E8F0" }}>{item.chain}</span>
                    </div>
                    <span style={{ color: "#64748B" }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Bridges */}
      <RecentBridges />
    </div>
  );
}
