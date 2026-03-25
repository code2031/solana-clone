"use client";

import type { Grant } from "@/app/page";

const categoryColors: Record<string, string> = {
  DeFi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Tooling: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Education: "bg-green-500/20 text-green-400 border-green-500/30",
  Infrastructure: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export function GrantCard({
  grant,
  onClick,
}: {
  grant: Grant;
  onClick: () => void;
}) {
  const daysRemaining = Math.max(0, Math.ceil((grant.deadline - Date.now()) / 86400000));

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 hover:border-amber-500/40 hover:bg-[#22223a] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors pr-4">
          {grant.title}
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${categoryColors[grant.category]}`}>
          {grant.category}
        </span>
      </div>

      <p className="text-sm text-[#9999bb] mb-4 line-clamp-2">
        {grant.description}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-amber-400 font-semibold">{grant.fundingAmount.toLocaleString()}</div>
          <div className="text-xs text-[#666688]">SCLONE</div>
        </div>
        <div>
          <div className="text-white font-semibold">
            {grant.isOpen ? `${daysRemaining}d` : "Closed"}
          </div>
          <div className="text-xs text-[#666688]">Deadline</div>
        </div>
        <div>
          <div className="text-white font-semibold">{grant.applicants}</div>
          <div className="text-xs text-[#666688]">Applicants</div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#2a2a4a] flex justify-end">
        <button
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            grant.isOpen
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:opacity-90"
              : "bg-[#2a2a4a] text-[#666688] cursor-default"
          }`}
          disabled={!grant.isOpen}
        >
          {grant.isOpen ? "Apply" : "Closed"}
        </button>
      </div>
    </div>
  );
}
