"use client";

import { useState } from "react";
import WalletInput from "@/components/wallet-input";
import PortfolioAnalysisDisplay from "@/components/portfolio-analysis";
import { PortfolioAnalysis } from "@/lib/analyzer";

export default function Home() {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handleAnalyze = async (address: string) => {
    setLoading(true);
    setError("");
    setWalletAddress(address);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze portfolio");
      }

      setAnalysis(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            AI Portfolio Analysis
          </span>
        </h1>
        <p className="text-[#64748b] text-sm sm:text-base max-w-xl mx-auto">
          Enter your Solana wallet address to get AI-powered insights, risk analysis, and rebalancing suggestions.
        </p>
      </div>

      {/* Wallet Input */}
      <WalletInput onAnalyze={handleAnalyze} isLoading={loading} />

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <div className="text-sm text-[#64748b]">
            Analyzing wallet <span className="font-mono text-purple-400">{walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}</span>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div className="mt-10">
          <div className="mb-6 flex items-center gap-2 text-xs text-[#64748b]">
            <span>Wallet:</span>
            <span className="font-mono text-purple-400">{walletAddress}</span>
          </div>
          <PortfolioAnalysisDisplay analysis={analysis} />
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <div className="mt-16 text-center">
          <div className="inline-flex p-6 rounded-2xl bg-[#12121a] border border-[#1e1e2e]">
            <div className="text-center">
              <svg className="w-12 h-12 text-[#1e1e2e] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <p className="text-sm text-[#64748b]">Enter a wallet address to begin analysis</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
