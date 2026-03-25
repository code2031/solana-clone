"use client";

import dynamic from "next/dynamic";
import { EXAMPLE_CODE } from "@/lib/auditor";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeInputProps {
  code: string;
  onChange: (value: string) => void;
  highlightedLine?: number;
}

export default function CodeInput({ code, onChange, highlightedLine }: CodeInputProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e2e] bg-[#0d0d14]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-[#64748b] ml-2">program.rs</span>
        </div>
        <button
          onClick={() => onChange(EXAMPLE_CODE)}
          className="text-xs text-[#64748b] hover:text-cyan-400 transition-colors px-2 py-1 rounded border border-[#1e1e2e] hover:border-cyan-500/30"
        >
          Load Example
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="rust"
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12 },
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            glyphMargin: true,
          }}
          onMount={(editor) => {
            if (highlightedLine) {
              editor.revealLineInCenter(highlightedLine);
              editor.deltaDecorations([], [
                {
                  range: {
                    startLineNumber: highlightedLine,
                    startColumn: 1,
                    endLineNumber: highlightedLine,
                    endColumn: 1,
                  },
                  options: {
                    isWholeLine: true,
                    className: "highlighted-line",
                    glyphMarginClassName: "glyph-warning",
                  },
                },
              ]);
            }
          }}
        />
      </div>
    </div>
  );
}
