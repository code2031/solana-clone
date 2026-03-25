"use client";

import type { Bounty } from "@/app/page";

const difficultyStyles: Record<string, string> = {
  Easy: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const categoryStyles: Record<string, string> = {
  Frontend: "bg-blue-500/20 text-blue-400",
  "Smart Contract": "bg-purple-500/20 text-purple-400",
  Infrastructure: "bg-amber-500/20 text-amber-400",
  Documentation: "bg-cyan-500/20 text-cyan-400",
  Testing: "bg-emerald-500/20 text-emerald-400",
  Design: "bg-pink-500/20 text-pink-400",
};

export function BountyCard({
  bounty,
  onClick,
}: {
  bounty: Bounty;
  onClick: () => void;
}) {
  const daysRemaining = Math.max(0, Math.ceil((bounty.deadline - Date.now()) / 86400000));
  const isExpired = bounty.deadline < Date.now() && bounty.status === "Open";

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 hover:border-red-500/40 hover:bg-[#22223a] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-red-300 transition-colors pr-4">
          {bounty.title}
        </h3>
        <div className="flex gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyStyles[bounty.difficulty]}`}>
            {bounty.difficulty}
          </span>
        </div>
      </div>

      <p className="text-sm text-[#9999bb] mb-4 line-clamp-2">
        {bounty.description}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryStyles[bounty.category]}`}>
          {bounty.category}
        </span>
        {bounty.status === "InProgress" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
            In Progress
          </span>
        )}
        {bounty.status === "Completed" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            Completed
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#2a2a4a]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-red-400 font-bold">{bounty.reward.toLocaleString()}</span>
            <span className="text-xs text-[#666688] ml-1">PRISM</span>
          </div>
          <div className="text-sm text-[#666688]">
            {bounty.status === "Completed"
              ? "Paid"
              : isExpired
              ? "Expired"
              : `${daysRemaining}d left`}
          </div>
        </div>
        <button
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            bounty.status === "Open" && !isExpired
              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-90"
              : "bg-[#2a2a4a] text-[#666688] cursor-default"
          }`}
          disabled={bounty.status !== "Open" || isExpired}
        >
          {bounty.status === "Completed"
            ? "Done"
            : bounty.status === "InProgress"
            ? "Claimed"
            : isExpired
            ? "Expired"
            : "Claim"}
        </button>
      </div>
    </div>
  );
}
