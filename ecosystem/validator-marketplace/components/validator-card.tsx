"use client";

import type { ValidatorInfo } from "@/lib/validator-data";
import { formatStake } from "@/lib/validator-data";

export function ValidatorCard({
  validator,
  onClick,
}: {
  validator: ValidatorInfo;
  onClick: () => void;
}) {
  const v = validator;

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 hover:border-emerald-500/40 hover:bg-[#22223a] transition-all cursor-pointer group"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Identity */}
        <div className="flex items-center gap-3 md:w-64 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
            {v.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
              {v.name}
            </h3>
            <span className="text-xs text-[#666688] font-mono">
              {v.identity.slice(0, 8)}...{v.identity.slice(-4)}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
          <div>
            <div className="text-xs text-[#666688] mb-1">Total Stake</div>
            <div className="text-white font-medium">{formatStake(v.totalStake)} SOL</div>
          </div>
          <div>
            <div className="text-xs text-[#666688] mb-1">Commission</div>
            <div className={`font-medium ${v.commission <= 5 ? "text-emerald-400" : v.commission <= 8 ? "text-yellow-400" : "text-red-400"}`}>
              {v.commission}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#666688] mb-1">APY</div>
            <div className="text-emerald-400 font-medium">{v.apy.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-xs text-[#666688] mb-1">Uptime</div>
            <div className={`font-medium ${v.uptime >= 99.9 ? "text-emerald-400" : v.uptime >= 99.0 ? "text-yellow-400" : "text-red-400"}`}>
              {v.uptime.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#666688] mb-1">Skip Rate</div>
            <div className={`font-medium ${v.skipRate <= 0.2 ? "text-emerald-400" : v.skipRate <= 0.5 ? "text-yellow-400" : "text-red-400"}`}>
              {v.skipRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="md:w-32 shrink-0 flex justify-end">
          <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Delegate
          </button>
        </div>
      </div>
    </div>
  );
}
