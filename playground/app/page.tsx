"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import OutputPanel from "../components/output-panel";
import RpcSelector, { RPC_PRESETS } from "../components/rpc-selector";
import ExampleSelector, { EXAMPLES } from "../components/example-selector";
import { runCode, type ExecutionResult } from "../lib/sandbox-runner";

const CodeEditor = dynamic(() => import("../components/code-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#12103a] text-[var(--muted)]">
      Loading editor...
    </div>
  ),
});

const DEFAULT_CODE = EXAMPLES[0].code;

export default function PlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [rpcUrl, setRpcUrl] = useState(RPC_PRESETS.devnet);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const execResult = await runCode(code, rpcUrl);
      setResult(execResult);
    } catch {
      setResult({
        output: [],
        error: "Unexpected error during execution",
        duration: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, rpcUrl]);

  const handleExampleSelect = useCallback((exampleCode: string) => {
    setCode(exampleCode);
    setResult(null);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-[var(--foreground)]">
            <span className="text-[var(--accent)]">Prism</span> Playground
          </h1>
          <ExampleSelector onSelect={handleExampleSelect} />
        </div>

        <div className="flex items-center gap-4">
          <RpcSelector rpcUrl={rpcUrl} onRpcChange={setRpcUrl} />
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0F0B2E] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#0F0B2E] border-t-transparent" />
                Running...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Run
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content: Editor + Output */}
      <main className="flex flex-1 overflow-hidden">
        {/* Editor Panel - 65% */}
        <div className="flex w-[65%] flex-col border-r border-[var(--border)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">
              editor.ts
            </span>
            <span className="text-xs text-[var(--muted)]">TypeScript</span>
          </div>
          <div className="flex-1">
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>

        {/* Output Panel - 35% */}
        <div className="flex w-[35%] flex-col p-3">
          <div className="flex-1">
            <OutputPanel result={result} isRunning={isRunning} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-4 py-2 text-center text-xs text-[var(--muted)]">
        Prism SDK Playground - Code executes client-side via the{" "}
        <code className="text-[var(--accent)]">prism</code> helper object
      </footer>
    </div>
  );
}
