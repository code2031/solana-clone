"use client";

import { useState } from "react";
import CodeInput from "@/components/code-input";
import AuditResults from "@/components/audit-results";
import { AuditResult, EXAMPLE_CODE } from "@/lib/auditor";

export default function Home() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | undefined>();

  const handleAudit = async () => {
    if (!code.trim()) return;
    setLoading(true);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error("Audit failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLineClick = (line: number) => {
    setHighlightedLine(line);
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e2e] bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-[#e2e8f0]">Smart Contract Auditor</h2>
          <span className="text-xs text-[#64748b] px-2 py-0.5 rounded-full bg-[#12121a] border border-[#1e1e2e]">
            Rust / Anchor
          </span>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <span className="text-xs text-[#64748b]">
              {result.summary.total} findings
            </span>
          )}
          <button
            onClick={handleAudit}
            disabled={loading || !code.trim()}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Auditing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Audit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex min-h-0">
        {/* Code Editor - Left */}
        <div className="w-1/2 border-r border-[#1e1e2e]">
          <CodeInput code={code} onChange={setCode} highlightedLine={highlightedLine} />
        </div>

        {/* Audit Results - Right */}
        <div className="w-1/2 bg-[#0d0d14]">
          <AuditResults result={result} onLineClick={handleLineClick} />
        </div>
      </div>
    </div>
  );
}
