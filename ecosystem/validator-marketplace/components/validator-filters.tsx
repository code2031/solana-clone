"use client";

import type { SortField } from "@/app/page";

interface ValidatorFiltersProps {
  sortBy: SortField;
  sortDesc: boolean;
  maxCommission: number;
  minStake: number;
  search: string;
  onSortChange: (field: SortField) => void;
  onMaxCommissionChange: (value: number) => void;
  onMinStakeChange: (value: number) => void;
  onSearchChange: (value: string) => void;
}

export function ValidatorFilters({
  sortBy,
  sortDesc,
  maxCommission,
  minStake,
  search,
  onSortChange,
  onMaxCommissionChange,
  onMinStakeChange,
  onSearchChange,
}: ValidatorFiltersProps) {
  const sortOptions: { field: SortField; label: string }[] = [
    { field: "apy", label: "APY" },
    { field: "stake", label: "Stake" },
    { field: "commission", label: "Commission" },
    { field: "uptime", label: "Uptime" },
  ];

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Search */}
        <div className="flex-1">
          <label className="block text-xs text-[#666688] mb-2">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#666688] focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-xs text-[#666688] mb-2">Sort By</label>
          <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.field}
                onClick={() => onSortChange(opt.field)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  sortBy === opt.field
                    ? "bg-emerald-600 text-white"
                    : "text-[#9999bb] hover:text-white"
                }`}
              >
                {opt.label}
                {sortBy === opt.field && (
                  <span className="ml-1">{sortDesc ? "\u2193" : "\u2191"}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Commission Slider */}
        <div className="md:w-48">
          <label className="block text-xs text-[#666688] mb-2">
            Max Commission: {maxCommission}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={maxCommission}
            onChange={(e) => onMaxCommissionChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Min Stake */}
        <div className="md:w-40">
          <label className="block text-xs text-[#666688] mb-2">Min Stake (SOL)</label>
          <input
            type="number"
            value={minStake || ""}
            onChange={(e) => onMinStakeChange(parseInt(e.target.value) || 0)}
            placeholder="0"
            min="0"
            className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666688] focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
