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

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

function launchTypeBadge(type: Launch["launchType"]) {
  const styles: Record<string, string> = {
    FixedPrice: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Lottery: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Auction: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  const labels: Record<string, string> = {
    FixedPrice: "Fixed Price",
    Lottery: "Lottery",
    Auction: "Auction",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

export function LaunchCard({
  launch,
  onClick,
}: {
  launch: Launch;
  onClick: () => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    function update() {
      const now = Date.now();
      if (now < launch.startTime) {
        setTimeRemaining("Starts in " + formatTimeRemaining(launch.startTime - now));
      } else if (now < launch.endTime) {
        setTimeRemaining(formatTimeRemaining(launch.endTime - now));
      } else {
        setTimeRemaining("Ended");
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

  const isUpcoming = Date.now() < launch.startTime;
  const isEnded = launch.isFinalized || Date.now() > launch.endTime;

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 hover:border-purple-500/40 hover:bg-[#22223a] transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
              {launch.tokenSymbol.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                {launch.tokenName}
              </h3>
              <span className="text-xs text-[#9999bb]">${launch.tokenSymbol}</span>
            </div>
          </div>
        </div>
        {launchTypeBadge(launch.launchType)}
      </div>

      {/* Price */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-[#9999bb]">Price</span>
        <span className="text-white font-medium">{launch.price} SOL</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[#9999bb] mb-1.5">
          <span>{launch.totalRaised.toLocaleString()} SOL raised</span>
          <span>{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-[#666688] mt-1">
          Target: {launch.targetRaise.toLocaleString()} SOL
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="text-center">
          <div className="text-white font-medium">{launch.participants.toLocaleString()}</div>
          <div className="text-xs text-[#666688]">Participants</div>
        </div>
        <div className="text-center">
          <div className="text-white font-medium">
            {(launch.totalSold / 1000).toFixed(0)}K / {(launch.totalAllocation / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-[#666688]">Tokens Sold</div>
        </div>
      </div>

      {/* Time & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-[#2a2a4a]">
        <span className={`text-sm ${isEnded ? "text-[#666688]" : "text-cyan-400"}`}>
          {timeRemaining}
        </span>
        <button
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isEnded
              ? "bg-[#2a2a4a] text-[#666688] cursor-default"
              : isUpcoming
              ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
              : "bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:opacity-90"
          }`}
          disabled={isEnded}
        >
          {isEnded ? "Completed" : isUpcoming ? "Notify Me" : "Participate"}
        </button>
      </div>
    </div>
  );
}
