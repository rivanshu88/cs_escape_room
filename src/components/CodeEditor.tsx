"use client";

import { useEffect, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: "vs-light" | "vs-dark";
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  theme = "vs-light",
}: CodeEditorProps) {
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // The wrapper otherwise fetches Monaco from a public CDN. Load the
    // installed package only in the browser, configure it first, then mount
    // Editor so it never starts the CDN loader during server rendering.
    void import("monaco-editor").then(
      (monaco) => {
        if (cancelled) return;
        globalThis.MonacoEnvironment = {
          getWorker(_moduleId, label) {
            if (label === "javascript" || label === "typescript") {
              return new Worker(
                new URL(
                  "../../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js",
                  import.meta.url
                ),
                { type: "module" }
              );
            }
            return new Worker(
              new URL(
                "../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
                import.meta.url
              ),
              { type: "module" }
            );
          },
        };
        loader.config({ monaco });
        setReady(true);
      },
      () => {
        if (!cancelled) setLoadFailed(true);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        role={loadFailed ? "alert" : "status"}
        className="flex h-full items-center justify-center bg-[var(--panel)] text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
      >
        {loadFailed ? "Code editor could not load." : "Loading editor"}
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme}
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
