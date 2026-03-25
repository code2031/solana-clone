"use client";

import { useState } from "react";
import type { Grant } from "@/app/page";
import { ApplicationForm } from "./application-form";

export function GrantDetail({ grant }: { grant: Grant }) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const daysRemaining = Math.max(0, Math.ceil((grant.deadline - Date.now()) / 86400000));

  const categoryColors: Record<string, string> = {
    DeFi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Tooling: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Education: "bg-green-500/20 text-green-400 border-green-500/30",
    Infrastructure: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">{grant.title}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${categoryColors[grant.category]}`}>
            {grant.category}
          </span>
        </div>
        <p className="text-[#9999bb] leading-relaxed mb-6">{grant.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-amber-400 font-bold text-lg">{grant.fundingAmount.toLocaleString()}</div>
            <div className="text-xs text-[#666688] mt-1">PRISM Funding</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-white font-bold text-lg">
              {grant.isOpen ? `${daysRemaining} days` : "Closed"}
            </div>
            <div className="text-xs text-[#666688] mt-1">Deadline</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-white font-bold text-lg">{grant.applicants}</div>
            <div className="text-xs text-[#666688] mt-1">Applicants</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-white font-bold text-lg">
              {grant.isOpen ? "Open" : "Closed"}
            </div>
            <div className="text-xs text-[#666688] mt-1">Status</div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
        <h2 className="text-lg font-semibold mb-4">Requirements</h2>
        <ul className="space-y-2">
          {grant.requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-[#9999bb]">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                {i + 1}
              </span>
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Previously Funded in this Category */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
        <h2 className="text-lg font-semibold mb-4">Previously Funded ({grant.category})</h2>
        <div className="text-sm text-[#666688]">
          No previously funded projects in this category to display.
        </div>
      </div>

      {/* Apply Section */}
      {grant.isOpen && (
        <div>
          {!showApplicationForm ? (
            <button
              onClick={() => setShowApplicationForm(true)}
              className="w-full py-4 rounded-xl font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 transition-opacity text-lg"
            >
              Apply for this Grant
            </button>
          ) : (
            <ApplicationForm grantTitle={grant.title} />
          )}
        </div>
      )}
    </div>
  );
}
