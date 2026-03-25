"use client";

import { PortfolioAnalysis, Suggestion } from "@/lib/analyzer";

interface PortfolioAnalysisProps {
  analysis: PortfolioAnalysis;
}

const COLORS = [
  "#7c3aed", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6",
];

function PieChart({ holdings }: { holdings: PortfolioAnalysis["holdings"] }) {
  const total = holdings.reduce((sum, h) => sum + h.usdValue, 0);
  let cumulativePercent = 0;

  const slices = holdings.map((holding, i) => {
    const percent = (holding.usdValue / total) * 100;
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += percent;
    const endAngle = (cumulativePercent / 100) * 360;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const largeArc = percent > 50 ? 1 : 0;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    return (
      <path
        key={holding.symbol}
        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={COLORS[i % COLORS.length]}
        className="transition-opacity hover:opacity-80 cursor-pointer"
      >
        <title>{`${holding.symbol}: ${percent.toFixed(1)}%`}</title>
      </path>
    );
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-lg">
        {slices}
        <circle cx="50" cy="50" r="22" fill="#12121a" />
        <text x="50" y="47" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontWeight="bold">
          ${(total / 1000).toFixed(1)}k
        </text>
        <text x="50" y="57" textAnchor="middle" fill="#64748b" fontSize="4">
          Total Value
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {holdings.map((holding, i) => (
          <div key={holding.symbol} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[#e2e8f0] font-medium w-14">{holding.symbol}</span>
            <span className="text-[#64748b]">{holding.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const getColor = () => {
    if (score <= 3) return "#10b981";
    if (score <= 5) return "#f59e0b";
    if (score <= 7) return "#f97316";
    return "#ef4444";
  };
  const getLabel = () => {
    if (score <= 3) return "Conservative";
    if (score <= 5) return "Moderate";
    if (score <= 7) return "Aggressive";
    return "Very Aggressive";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#1e1e2e"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.41} 141`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span className="text-2xl font-bold" style={{ color: getColor() }}>
            {score}
          </span>
          <span className="text-xs text-[#64748b] ml-0.5 mb-1">/10</span>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color: getColor() }}>
        {getLabel()}
      </span>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const priorityColors = {
    high: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", badge: "bg-red-500/20" },
    medium: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", badge: "bg-yellow-500/20" },
    low: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20" },
  };
  const typeIcons: Record<string, string> = {
    rebalance: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    stake: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    diversify: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
    opportunity: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  };
  const colors = priorityColors[suggestion.priority];

  return (
    <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:scale-[1.01]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colors.badge} mt-0.5`}>
            <svg className={`w-4 h-4 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[suggestion.type] || typeIcons.rebalance} />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-[#e2e8f0] text-sm">{suggestion.title}</h4>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${colors.badge} ${colors.text}`}>
                {suggestion.priority}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">{suggestion.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-purple-400 font-medium">Action:</span>
              <span className="text-xs text-[#94a3b8]">{suggestion.action}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioAnalysisDisplay({ analysis }: PortfolioAnalysisProps) {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Summary Banner */}
      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
        <p className="text-sm text-[#94a3b8] leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase tracking-wide mb-1">Total Value</p>
          <p className="text-xl font-bold text-[#e2e8f0]">${analysis.totalValue.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase tracking-wide mb-1">Tokens</p>
          <p className="text-xl font-bold text-[#e2e8f0]">{analysis.holdings.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase tracking-wide mb-1">Diversification</p>
          <p className="text-xl font-bold text-cyan-400">{analysis.diversificationScore}/100</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase tracking-wide mb-1">Volatility</p>
          <p className="text-xl font-bold text-yellow-400">{analysis.volatilityEstimate}</p>
        </div>
      </div>

      {/* Holdings & Risk */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <h3 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wide mb-4">Holdings Breakdown</h3>
          <PieChart holdings={analysis.holdings} />
          <div className="mt-4 space-y-2">
            {analysis.holdings.map((holding, i) => (
              <div key={holding.symbol} className="flex items-center justify-between py-2 border-b border-[#1e1e2e] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div>
                    <span className="text-sm font-medium text-[#e2e8f0]">{holding.symbol}</span>
                    <span className="text-xs text-[#64748b] ml-2">{holding.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-[#e2e8f0]">${holding.usdValue.toLocaleString()}</span>
                  <span className="text-xs text-[#64748b] ml-2">{holding.balance.toLocaleString()} {holding.symbol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#12121a] border border-[#1e1e2e] flex flex-col items-center">
          <h3 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wide mb-6 self-start">Risk Score</h3>
          <RiskGauge score={analysis.riskScore} />
          <div className="mt-6 w-full space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748b]">Concentration</span>
              <span className="text-[#e2e8f0]">{analysis.concentrationRisk}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(analysis.concentrationRisk, 100)}%`,
                  backgroundColor: analysis.concentrationRisk > 50 ? "#ef4444" : analysis.concentrationRisk > 30 ? "#f59e0b" : "#10b981",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <h3 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wide mb-4">
          AI Suggestions ({analysis.suggestions.length})
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {analysis.suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      </div>
    </div>
  );
}
