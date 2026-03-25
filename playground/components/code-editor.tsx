"use client";

import { useCallback } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    monaco.editor.defineTheme("solclone-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "c084fc" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "fbbf24" },
        { token: "type", foreground: "60a5fa" },
        { token: "function", foreground: "f472b6" },
      ],
      colors: {
        "editor.background": "#12103a",
        "editor.foreground": "#e2e8f0",
        "editor.lineHighlightBackground": "#1e1a50",
        "editorCursor.foreground": "#00d18c",
        "editor.selectionBackground": "#2d2670",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#00d18c",
        "editorGutter.background": "#0F0B2E",
      },
    });
    monaco.editor.setTheme("solclone-dark");

    editor.updateOptions({
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      tabSize: 2,
      renderLineHighlight: "gutter",
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
    });
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange(value ?? "");
    },
    [onChange]
  );

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-[var(--border)]">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={code}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        loading={
          <div className="flex h-full items-center justify-center bg-[#12103a] text-[var(--muted)]">
            Loading editor...
          </div>
        }
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: "on",
          tabSize: 2,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
