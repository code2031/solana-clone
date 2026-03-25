"use client";

import { AuditResult, Severity } from "@/lib/auditor";

interface AuditResultsProps {
  result: AuditResult | null;
  onLineClick: (line: number) => void;
}

const severityConfig: Record<Severity, { color: string; bg: string; border: string; icon: string }> = {
  Critical: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  High: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  Medium: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  Low: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  Info: {
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return { text: "text-green-400", ring: "ring-green-500/30", bg: "bg-green-500/10" };
    if (score >= 60) return { text: "text-yellow-400", ring: "ring-yellow-500/30", bg: "bg-yellow-500/10" };
    if (score >= 40) return { text: "text-orange-400", ring: "ring-orange-500/30", bg: "bg-orange-500/10" };
    return { text: "text-red-400", ring: "ring-red-500/30", bg: "bg-red-500/10" };
  };
  const colors = getColor();

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
      <span className="text-xs text-[#64748b] uppercase tracking-wide">Security Score</span>
      <span className={`text-2xl font-bold ${colors.text}`}>{score}</span>
      <span className="text-xs text-[#64748b]">/100</span>
    </div>
  );
}

export default function AuditResults({ result, onLineClick }: AuditResultsProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <svg className="w-16 h-16 text-[#1e1e2e] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h3 className="text-lg font-medium text-[#64748b] mb-2">Ready to Audit</h3>
        <p className="text-sm text-[#475569] max-w-xs">
          Paste your Rust/Anchor code in the editor and click &quot;Audit&quot; to run the static analysis engine.
        </p>
      </div>
    );
  }

  const { findings, summary } = result;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary Header */}
      <div className="p-4 border-b border-[#1e1e2e] bg-[#0d0d14] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wide">Audit Results</h3>
          <ScoreBadge score={summary.score} />
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.critical > 0 && (
            <span className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
              {summary.critical} Critical
            </span>
          )}
          {summary.high > 0 && (
            <span className="text-xs px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {summary.high} High
            </span>
          )}
          {summary.medium > 0 && (
            <span className="text-xs px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              {summary.medium} Medium
            </span>
          )}
          {summary.low > 0 && (
            <span className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {summary.low} Low
            </span>
          )}
          {summary.info > 0 && (
            <span className="text-xs px-2 py-1 rounded-md bg-gray-500/10 text-gray-400 border border-gray-500/20">
              {summary.info} Info
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded-md bg-[#12121a] text-[#64748b] border border-[#1e1e2e]">
            {summary.total} Total
          </span>
        </div>
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-12 h-12 text-green-500/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-400 font-medium">No issues found!</p>
            <p className="text-xs text-[#64748b] mt-1">Your code passed all static analysis checks.</p>
          </div>
        ) : (
          findings.map((finding, index) => {
            const config = severityConfig[finding.severity];
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border ${config.border} ${config.bg} cursor-pointer transition-all hover:scale-[1.01] hover:brightness-110`}
                onClick={() => onLineClick(finding.line)}
              >
                <div className="flex items-start gap-2">
                  <svg className={`w-4 h-4 ${config.color} mt-0.5 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold uppercase ${config.color}`}>{finding.severity}</span>
                      <span className="text-sm font-medium text-[#e2e8f0]">{finding.title}</span>
                      <span className="text-xs text-[#64748b] font-mono ml-auto">Line {finding.line}</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{finding.description}</p>
                    <div className="mt-2 p-2 rounded-md bg-[#0a0a0f]/50 border border-[#1e1e2e]">
                      <div className="flex items-start gap-1.5">
                        <svg className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-xs text-cyan-300">{finding.suggestion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
