"use client";

import { useState } from "react";
import type { Bounty } from "@/app/page";
import { SubmitWork } from "./submit-work";

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

export function BountyDetail({ bounty }: { bounty: Bounty }) {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const daysRemaining = Math.max(0, Math.ceil((bounty.deadline - Date.now()) / 86400000));
  const isOpen = bounty.status === "Open" && bounty.deadline > Date.now();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">{bounty.title}</h1>
            <div className="flex gap-2 shrink-0">
              <span className={`text-xs px-2.5 py-1 rounded-full border ${difficultyStyles[bounty.difficulty]}`}>
                {bounty.difficulty}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${categoryStyles[bounty.category]}`}>
                {bounty.category}
              </span>
            </div>
          </div>
          <p className="text-[#9999bb] leading-relaxed">{bounty.fullDescription}</p>
        </div>

        {/* Requirements */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Requirements</h2>
          <ul className="space-y-2">
            {bounty.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#9999bb]">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Submissions */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">
            Submissions ({bounty.submissions.length})
          </h2>
          {bounty.submissions.length === 0 ? (
            <div className="text-center py-8 text-[#666688]">
              No submissions yet. Be the first to submit your work.
            </div>
          ) : (
            <div className="space-y-4">
              {bounty.submissions.map((sub) => (
                <div key={sub.id} className="bg-[#0a0a0f] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#9999bb] font-mono">
                      {sub.author.slice(0, 8)}...{sub.author.slice(-4)}
                    </span>
                    <span className="text-xs text-[#666688]">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-white mb-2">{sub.description}</p>
                  <a
                    href={sub.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    {sub.link}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Work Form */}
        {(bounty.status === "Open" || bounty.status === "InProgress") && (
          <div>
            {!showSubmitForm ? (
              <button
                onClick={() => setShowSubmitForm(true)}
                className="w-full py-4 rounded-xl font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 transition-opacity text-lg"
              >
                Submit Work
              </button>
            ) : (
              <SubmitWork bountyTitle={bounty.title} />
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Reward */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 text-center">
          <div className="text-sm text-[#9999bb] mb-2">Reward</div>
          <div className="text-3xl font-bold text-red-400 mb-1">
            {bounty.reward.toLocaleString()}
          </div>
          <div className="text-sm text-[#666688]">SCLONE</div>
        </div>

        {/* Details */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Status</span>
              <span className={`font-medium ${
                bounty.status === "Open" ? "text-red-400" :
                bounty.status === "InProgress" ? "text-yellow-400" :
                "text-green-400"
              }`}>
                {bounty.status === "InProgress" ? "In Progress" : bounty.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Deadline</span>
              <span className="text-white">
                {daysRemaining > 0 ? `${daysRemaining} days` : "Expired"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Difficulty</span>
              <span className="text-white">{bounty.difficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Category</span>
              <span className="text-white">{bounty.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9999bb]">Submissions</span>
              <span className="text-white">{bounty.submissions.length}</span>
            </div>
          </div>
        </div>

        {/* Creator */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Posted By</h3>
          <div className="text-sm text-[#9999bb] font-mono break-all">
            {bounty.creator}
          </div>
        </div>

        {/* Claim Button */}
        {isOpen && (
          <button className="w-full py-3 rounded-lg font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 transition-opacity">
            Claim this Bounty
          </button>
        )}
      </div>
    </div>
  );
}
