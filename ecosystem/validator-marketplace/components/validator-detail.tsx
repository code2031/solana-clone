"use client";

import { useState } from "react";
import type { ValidatorInfo } from "@/lib/validator-data";
import { formatStake } from "@/lib/validator-data";
import { DelegateForm } from "./delegate-form";

export function ValidatorDetail({ validator }: { validator: ValidatorInfo }) {
  const v = validator;
  const [showDelegate, setShowDelegate] = useState(false);

  const maxAPY = Math.max(...v.apyHistory.map((h) => h.apy));
  const minAPY = Math.min(...v.apyHistory.map((h) => h.apy));
  const apyRange = maxAPY - minAPY || 1;

  const maxStake = Math.max(...v.stakeHistory.map((h) => h.stake));
  const minStakeVal = Math.min(...v.stakeHistory.map((h) => h.stake));
  const stakeRange = maxStake - minStakeVal || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-2xl font-bold text-white">
              {v.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{v.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[#9999bb] font-mono text-sm">{v.identity}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Stake", value: `${formatStake(v.totalStake)} SOL` },
              { label: "Commission", value: `${v.commission}%` },
              { label: "Est. APY", value: `${v.apy.toFixed(2)}%` },
              { label: "Delegators", value: v.delegators.toLocaleString() },
              { label: "Uptime", value: `${v.uptime.toFixed(2)}%` },
              { label: "Skip Rate", value: `${v.skipRate.toFixed(2)}%` },
              { label: "Version", value: v.version },
              { label: "Datacenter", value: v.datacenter },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0a0a0f] rounded-lg p-4">
                <div className="text-white font-semibold">{stat.value}</div>
                <div className="text-xs text-[#666688] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* APY Chart */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">APY Over Time</h2>
          <div className="h-48 flex items-end gap-1">
            {v.apyHistory.map((point, i) => {
              const height = ((point.apy - minAPY) / apyRange) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#666688]">{point.apy.toFixed(1)}%</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`Epoch ${point.epoch}: ${point.apy.toFixed(2)}%`}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[9px] text-[#666688]">{point.epoch}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stake History Chart */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Stake History</h2>
          <div className="h-48 flex items-end gap-1">
            {v.stakeHistory.map((point, i) => {
              const height = ((point.stake - minStakeVal) / stakeRange) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-teal-600 to-teal-400 transition-all hover:from-teal-500 hover:to-teal-300"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`Epoch ${point.epoch}: ${formatStake(point.stake)} SOL`}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[9px] text-[#666688]">{point.epoch}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Commission History */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Commission History</h2>
          <div className="space-y-3">
            {v.commissionHistory.map((entry, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-[#2a2a4a] last:border-0 text-sm">
                <span className="text-[#9999bb]">Epoch {entry.epoch}</span>
                <span className="text-white font-medium">{entry.commission}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vote Account Info */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Account Details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Vote Account", value: v.voteAccount },
              { label: "Identity", value: v.identity },
              { label: "Datacenter", value: v.datacenter },
              { label: "Software Version", value: v.version },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2 border-b border-[#2a2a4a] last:border-0">
                <span className="text-[#9999bb]">{row.label}</span>
                <span className="text-white font-mono text-xs truncate max-w-[350px]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-emerald-400 mb-1">{v.apy.toFixed(2)}%</div>
          <div className="text-sm text-[#9999bb]">Estimated APY</div>
          <button
            onClick={() => setShowDelegate(!showDelegate)}
            className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            {showDelegate ? "Hide Form" : "Delegate Stake"}
          </button>
        </div>

        {showDelegate && <DelegateForm validator={v} />}

        {/* Delegators Preview */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Delegators</h3>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => ({
              address: `Del${(i + 1).toString().padStart(2, "0")}11111111111111111111111111111111111111`,
              stake: Math.floor((v.totalStake / (i + 2)) * (0.8 + Math.random() * 0.4)),
            })).map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#9999bb] font-mono text-xs">
                  {d.address.slice(0, 8)}...{d.address.slice(-4)}
                </span>
                <span className="text-white">{formatStake(d.stake)} SOL</span>
              </div>
            ))}
          </div>
          <div className="text-center text-xs text-[#666688] mt-3">
            {v.delegators.toLocaleString()} total delegators
          </div>
        </div>
      </div>
    </div>
  );
}
