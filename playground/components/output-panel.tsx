"use client";

import { useRef, useEffect } from "react";
import type { ExecutionResult } from "../lib/sandbox-runner";

interface OutputPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
}

export default function OutputPanel({ result, isRunning }: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-[#0a0825]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="text-sm font-medium text-[var(--muted)]">Console Output</span>
        {result && !isRunning && (
          <span className="text-xs text-[var(--muted)]">
            {result.duration.toFixed(1)}ms
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
      >
        {isRunning && (
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            Running...
          </div>
        )}

        {!isRunning && !result && (
          <div className="text-[var(--muted)]">
            Click &quot;Run&quot; to execute your code.
            <br />
            <br />
            The <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[var(--accent)]">prism</code> object is available with these methods:
            <br />
            <br />
            <code className="text-xs text-[var(--foreground)]">
              prism.getBalance(address)<br />
              prism.getBlockHeight()<br />
              prism.getBlock(slot)<br />
              prism.getTransaction(sig)<br />
              prism.getTokenAccountsByOwner(owner, mint)<br />
              prism.sendTransaction(from, to, lamports)<br />
              prism.requestAirdrop(address, lamports)<br />
              prism.call(method, params)
            </code>
          </div>
        )}

        {!isRunning && result && (
          <>
            {result.output.map((line, i) => {
              const isError = line.startsWith("[ERROR]");
              const isWarn = line.startsWith("[WARN]");
              const isInfo = line.startsWith("[INFO]");
              let colorClass = "text-[var(--foreground)]";
              if (isError) colorClass = "text-[var(--error)]";
              else if (isWarn) colorClass = "text-[var(--warning)]";
              else if (isInfo) colorClass = "text-blue-400";

              return (
                <div key={i} className={`${colorClass} whitespace-pre-wrap break-all py-0.5`}>
                  <span className="mr-2 select-none text-[var(--muted)]">&gt;</span>
                  {line}
                </div>
              );
            })}

            {result.error && (
              <div className="mt-2 rounded border border-red-900 bg-red-950/50 p-3 text-[var(--error)]">
                <span className="font-semibold">Error: </span>
                {result.error}
              </div>
            )}

            {!result.error && result.output.length === 0 && (
              <div className="text-[var(--muted)]">
                (no output)
              </div>
            )}

            <div className="mt-4 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
              Executed in {result.duration.toFixed(1)}ms
              {result.error ? " (with errors)" : ` - ${result.output.length} line(s)`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
