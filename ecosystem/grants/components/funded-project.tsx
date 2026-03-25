"use client";

import type { FundedProjectData } from "@/app/page";

export function FundedProject({ project }: { project: FundedProjectData }) {
  const progressPercent = project.totalMilestones > 0
    ? (project.completedMilestones / project.totalMilestones) * 100
    : 0;

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 hover:border-green-500/30 transition-all">
      <div className="mb-3">
        <h3 className="font-semibold text-white mb-1">{project.name}</h3>
        <div className="text-xs text-[#666688]">
          Grant: {project.grantTitle}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-[#9999bb]">Team</span>
        <span className="text-white">{project.team}</span>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-[#9999bb]">Funded</span>
        <span className="text-amber-400 font-medium">{project.amountFunded.toLocaleString()} SCLONE</span>
      </div>

      {/* Milestones Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[#9999bb] mb-1.5">
          <span>Progress</span>
          <span>{project.completedMilestones}/{project.totalMilestones} milestones</span>
        </div>
        <div className="w-full h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Links */}
      {project.links.length > 0 && (
        <div className="flex gap-2 pt-3 border-t border-[#2a2a4a]">
          {project.links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-[#0a0a0f] text-[#9999bb] hover:text-white border border-[#2a2a4a] hover:border-[#666688] transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
