"use client";

import { useEffect, useState } from "react";
import type { Launch } from "@/app/page";

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Ended";
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

export function LaunchDetail({ launch }: { launch: Launch }) {
  const [amount, setAmount] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    function update() {
      const now = Date.now();
      if (now < launch.startTime) {
        setTimeRemaining("Starts in " + formatTimeRemaining(launch.startTime - now));
      } else if (now < launch.endTime) {
        setTimeRemaining(formatTimeRemaining(launch.endTime - now) + " remaining");
      } else {
        setTimeRemaining("Launch Ended");
      }
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [launch.startTime, launch.endTime]);

  const progressPercent = Math.min(
    100,
    launch.targetRaise > 0 ? (launch.totalRaised / launch.targetRaise) * 100 : 0
  );

  const isActive = Date.now() >= launch.startTime && Date.now() <= launch.endTime && launch.isActive;
  const isEnded = launch.isFinalized || Date.now() > launch.endTime;
  const tokensForAmount = amount ? parseFloat(amount) / launch.price : 0;

  const launchTypeLabels: Record<string, string> = {
    FixedPrice: "Fixed Price",
    Lottery: "Lottery",
    Auction: "Auction",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Token Header */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
              {launch.tokenSymbol.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{launch.tokenName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[#9999bb]">${launch.tokenSymbol}</span>
                <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/20 text-purple-400">
                  {launchTypeLabels[launch.launchType]}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[#9999bb] leading-relaxed">{launch.description}</p>
        </div>

        {/* Progress & Stats */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Launch Progress</h2>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#9999bb]">
                {launch.totalRaised.toLocaleString()} / {launch.targetRaise.toLocaleString()} SOL
              </span>
              <span className="text-white font-medium">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Price per Token", value: `${launch.price} SOL` },
              { label: "Participants", value: launch.participants.toLocaleString() },
              { label: "Tokens Sold", value: `${(launch.totalSold / 1000).toFixed(1)}K` },
              { label: "Total Allocation", value: `${(launch.totalAllocation / 1000).toFixed(0)}K` },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0a0a0f] rounded-lg p-4">
                <div className="text-white font-semibold">{stat.value}</div>
                <div className="text-xs text-[#666688] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation Breakdown */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Allocation Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Public Sale", percent: 60, color: "from-purple-500 to-purple-400" },
              { label: "Liquidity Pool", percent: 20, color: "from-cyan-500 to-cyan-400" },
              { label: "Team & Advisors", percent: 10, color: "from-amber-500 to-amber-400" },
              { label: "Ecosystem Reserve", percent: 10, color: "from-green-500 to-green-400" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#9999bb]">{item.label}</span>
                  <span className="text-white">{item.percent}%</span>
                </div>
                <div className="w-full h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Launch Details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Token Mint", value: launch.tokenMint },
              { label: "Creator", value: launch.creator },
              { label: "Start Date", value: new Date(launch.startTime).toLocaleString() },
              { label: "End Date", value: new Date(launch.endTime).toLocaleString() },
              { label: "Min Purchase", value: `${launch.minPurchase} SOL` },
              { label: "Max Purchase", value: `${launch.maxPurchase} SOL` },
              { label: "Launch Type", value: launchTypeLabels[launch.launchType] },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2 border-b border-[#2a2a4a] last:border-0">
                <span className="text-[#9999bb]">{row.label}</span>
                <span className="text-white font-mono text-xs truncate max-w-[300px]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar — Participation */}
      <div className="space-y-6">
        {/* Timer */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 text-center">
          <div className="text-sm text-[#9999bb] mb-2">
            {Date.now() < launch.startTime ? "Starts In" : "Time Remaining"}
          </div>
          <div className={`text-2xl font-bold ${isEnded ? "text-[#666688]" : "text-cyan-400"}`}>
            {timeRemaining}
          </div>
        </div>

        {/* Participate Form */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Participate</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">Amount (SOL)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: ${launch.minPurchase}`}
                  min={launch.minPurchase}
                  max={launch.maxPurchase}
                  step="0.01"
                  disabled={!isActive}
                  className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <button
                  onClick={() => setAmount(launch.maxPurchase.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300"
                >
                  MAX
                </button>
              </div>
              <div className="text-xs text-[#666688] mt-1">
                Min: {launch.minPurchase} SOL &middot; Max: {launch.maxPurchase} SOL
              </div>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-[#0a0a0f] rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#9999bb]">You will receive</span>
                  <span className="text-white font-medium">
                    ~{tokensForAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {launch.tokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9999bb]">Price per token</span>
                  <span className="text-white">{launch.price} SOL</span>
                </div>
              </div>
            )}

            <button
              disabled={!isActive}
              className="w-full py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {!isActive
                ? isEnded
                  ? "Launch Ended"
                  : "Not Started Yet"
                : launch.launchType === "Lottery"
                ? "Enter Lottery"
                : "Participate Now"}
            </button>
          </div>
        </div>

        {/* Your Allocation */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Your Allocation</h3>
          <div className="text-center py-6">
            <div className="text-3xl font-bold text-white mb-1">0</div>
            <div className="text-sm text-[#9999bb]">{launch.tokenSymbol} Tokens</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Deposited</span>
              <span className="text-white">0 SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Status</span>
              <span className="text-[#666688]">Not participated</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              disabled
              className="py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Claim Tokens
            </button>
            <button
              disabled
              className="py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Refund
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
