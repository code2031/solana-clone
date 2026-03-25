"use client";

import { useState } from "react";

type LaunchType = "FixedPrice" | "Lottery" | "Auction";

export function CreateLaunchForm() {
  const [tokenMint, setTokenMint] = useState("");
  const [totalAllocation, setTotalAllocation] = useState("");
  const [pricePerToken, setPricePerToken] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxPurchase, setMaxPurchase] = useState("");
  const [launchType, setLaunchType] = useState<LaunchType>("FixedPrice");

  const launchTypes: { value: LaunchType; label: string; description: string }[] = [
    {
      value: "FixedPrice",
      label: "Fixed Price",
      description: "First come, first served at a set price per token.",
    },
    {
      value: "Lottery",
      label: "Lottery",
      description: "Random selection among all participants. Fair distribution.",
    },
    {
      value: "Auction",
      label: "Auction",
      description: "Final price determined by total demand. Price discovery.",
    },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const config = {
      tokenMint,
      totalAllocation: parseInt(totalAllocation),
      pricePerToken: parseFloat(pricePerToken),
      startTime: new Date(startDate).getTime(),
      endTime: new Date(endDate).getTime(),
      minPurchase: parseFloat(minPurchase),
      maxPurchase: parseFloat(maxPurchase),
      launchType,
    };
    console.log("Creating launch:", config);
    alert("Launch creation submitted! (Connect wallet to sign transaction)");
  }

  const estimatedRaise =
    totalAllocation && pricePerToken
      ? (parseInt(totalAllocation) * parseFloat(pricePerToken)).toLocaleString()
      : "0";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        Create a Token Launch
      </h1>
      <p className="text-[#9999bb] mb-8">
        Set up your token launch with customizable parameters and launch mechanism.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Token Mint */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Token Information</h2>
          <div>
            <label className="block text-sm text-[#9999bb] mb-2">Token Mint Address</label>
            <input
              type="text"
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
              placeholder="Enter SPL token mint address"
              required
              className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-purple-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Launch Type */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Launch Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {launchTypes.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => setLaunchType(lt.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  launchType === lt.value
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-[#2a2a4a] bg-[#0a0a0f] hover:border-[#666688]"
                }`}
              >
                <div className="font-medium text-white mb-1">{lt.label}</div>
                <div className="text-xs text-[#9999bb]">{lt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Allocation & Pricing */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Allocation &amp; Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">Total Allocation (tokens)</label>
              <input
                type="number"
                value={totalAllocation}
                onChange={(e) => setTotalAllocation(e.target.value)}
                placeholder="e.g. 100000"
                required
                min="1"
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">
                {launchType === "Auction" ? "Starting Price (SOL)" : "Price per Token (SOL)"}
              </label>
              <input
                type="number"
                value={pricePerToken}
                onChange={(e) => setPricePerToken(e.target.value)}
                placeholder="e.g. 0.005"
                required
                min="0"
                step="0.0001"
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          {totalAllocation && pricePerToken && (
            <div className="mt-4 p-3 bg-[#0a0a0f] rounded-lg text-sm">
              <span className="text-[#9999bb]">Estimated raise: </span>
              <span className="text-white font-medium">{estimatedRaise} SOL</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">Start Date &amp; Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">End Date &amp; Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Purchase Limits */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Purchase Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">Min Purchase (SOL)</label>
              <input
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="e.g. 0.1"
                required
                min="0"
                step="0.01"
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">Max Purchase (SOL)</label>
              <input
                type="number"
                value={maxPurchase}
                onChange={(e) => setMaxPurchase(e.target.value)}
                placeholder="e.g. 10"
                required
                min="0"
                step="0.01"
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 transition-opacity"
          >
            Create Launch
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenMint("");
              setTotalAllocation("");
              setPricePerToken("");
              setStartDate("");
              setEndDate("");
              setMinPurchase("");
              setMaxPurchase("");
              setLaunchType("FixedPrice");
            }}
            className="px-6 py-3 rounded-lg border border-[#2a2a4a] text-[#9999bb] hover:text-white hover:border-[#666688] transition-all"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
