"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      theme="vs-light"
      value={value}
      onChange={(next) => onChange(next ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        padding: { top: 16, bottom: 16 },
        wordWrap: "on",
        lineNumbersMinChars: 3,
        glyphMargin: false,
        roundedSelection: false,
      }}
      loading={<div className="flex h-full items-center justify-center bg-[var(--panel)] text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Loading editor</div>}
    />
  );
}
