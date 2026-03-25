"use client";

import { useState, useMemo } from "react";
import { ValidatorCard } from "@/components/validator-card";
import { ValidatorDetail } from "@/components/validator-detail";
import { ValidatorFilters } from "@/components/validator-filters";
import { MOCK_VALIDATORS, formatStake } from "@/lib/validator-data";
import type { ValidatorInfo } from "@/lib/validator-data";

export type SortField = "apy" | "stake" | "commission" | "uptime";

export default function ValidatorMarketplace() {
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("apy");
  const [sortDesc, setSortDesc] = useState(true);
  const [maxCommission, setMaxCommission] = useState(100);
  const [minStake, setMinStake] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = MOCK_VALIDATORS.filter((v) => {
      if (v.commission > maxCommission) return false;
      if (v.totalStake < minStake) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!v.name.toLowerCase().includes(q) && !v.identity.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDesc ? valB - valA : valA - valB;
      }
      return 0;
    });

    return result;
  }, [sortBy, sortDesc, maxCommission, minStake, search]);

  const totalStaked = MOCK_VALIDATORS.reduce((s, v) => s + v.totalStake, 0);
  const avgAPY = MOCK_VALIDATORS.reduce((s, v) => s + v.apy, 0) / MOCK_VALIDATORS.length;

  if (selectedValidator) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => setSelectedValidator(null)}
          className="mb-6 text-sm text-[#9999bb] hover:text-white transition-colors flex items-center gap-2"
        >
          <span>&larr;</span> Back to Validators
        </button>
        <ValidatorDetail validator={selectedValidator} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          SolClone Validators
        </h1>
        <p className="text-[#9999bb] text-lg max-w-2xl mx-auto">
          Explore validators, compare performance, and delegate your stake to secure the network.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Validators", value: MOCK_VALIDATORS.length.toString() },
          { label: "Total Staked", value: `${formatStake(totalStaked)} SOL` },
          { label: "Average APY", value: `${avgAPY.toFixed(2)}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-[#9999bb] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <ValidatorFilters
        sortBy={sortBy}
        sortDesc={sortDesc}
        maxCommission={maxCommission}
        minStake={minStake}
        search={search}
        onSortChange={(field) => {
          if (field === sortBy) {
            setSortDesc(!sortDesc);
          } else {
            setSortBy(field);
            setSortDesc(true);
          }
        }}
        onMaxCommissionChange={setMaxCommission}
        onMinStakeChange={setMinStake}
        onSearchChange={setSearch}
      />

      {/* Validator List */}
      <div id="validators" className="space-y-4 mt-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#666688]">
            No validators match your filters.
          </div>
        ) : (
          filtered.map((v) => (
            <ValidatorCard
              key={v.id}
              validator={v}
              onClick={() => setSelectedValidator(v)}
            />
          ))
        )}
      </div>
    </div>
  );
}
