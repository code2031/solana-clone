"use client";

import { useState } from "react";

interface WalletInputProps {
  onAnalyze: (address: string) => void;
  isLoading: boolean;
}

export default function WalletInput({ onAnalyze, isLoading }: WalletInputProps) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const exampleAddresses = [
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!address.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(address.trim())) {
      setError("Invalid Solana address format");
      return;
    }

    onAnalyze(address.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text.trim());
      setError("");
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError("");
                }}
                placeholder="Enter Solana wallet address..."
                className="w-full px-4 py-3.5 bg-[#12121a] border border-[#1e1e2e] rounded-xl text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 font-mono text-sm transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b] hover:text-purple-400 transition-colors px-2 py-1 rounded border border-[#1e1e2e] hover:border-purple-500/30"
              >
                Paste
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>
      </form>

      <div className="mt-4">
        <p className="text-xs text-[#64748b] mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleAddresses.map((addr) => (
            <button
              key={addr}
              onClick={() => {
                setAddress(addr);
                setError("");
              }}
              className="text-xs font-mono px-3 py-1.5 bg-[#12121a] border border-[#1e1e2e] rounded-lg text-[#64748b] hover:text-purple-400 hover:border-purple-500/30 transition-all truncate max-w-[200px]"
            >
              {addr.slice(0, 8)}...{addr.slice(-4)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
