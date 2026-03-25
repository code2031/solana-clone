"use client";

import { useState } from "react";
import type { ValidatorInfo } from "@/lib/validator-data";

export function DelegateForm({ validator }: { validator: ValidatorInfo }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"delegate" | "undelegate">("delegate");

  const expectedAPY = amount
    ? (parseFloat(amount) * (validator.apy / 100)).toFixed(4)
    : "0";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log(`${mode} ${amount} SOL to ${validator.name}`);
    alert(`${mode === "delegate" ? "Delegation" : "Undelegation"} submitted! Connect wallet to sign.`);
  }

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">
        {mode === "delegate" ? "Delegate" : "Undelegate"} Stake
      </h3>

      {/* Mode Toggle */}
      <div className="flex mb-4 bg-[#0a0a0f] rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode("delegate")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            mode === "delegate"
              ? "bg-emerald-600 text-white"
              : "text-[#9999bb] hover:text-white"
          }`}
        >
          Delegate
        </button>
        <button
          type="button"
          onClick={() => setMode("undelegate")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            mode === "undelegate"
              ? "bg-red-600 text-white"
              : "text-[#9999bb] hover:text-white"
          }`}
        >
          Undelegate
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#9999bb] mb-2">Amount (SOL)</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
              className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setAmount("1000")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-emerald-300"
            >
              MAX
            </button>
          </div>
        </div>

        {amount && parseFloat(amount) > 0 && mode === "delegate" && (
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Expected APY</span>
              <span className="text-emerald-400 font-medium">{validator.apy.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Est. Annual Reward</span>
              <span className="text-white font-medium">~{expectedAPY} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Commission</span>
              <span className="text-white">{validator.commission}%</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 rounded-lg font-medium text-white transition-all ${
            mode === "delegate"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {mode === "delegate" ? "Delegate" : "Undelegate"} Stake
        </button>
      </form>
    </div>
  );
}
