"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeEditor } from "@/components/CodeEditor";
import { runCases } from "@/lib/engine";
import { runMission } from "@/lib/runMission";
import { useLabStore } from "@/lib/store";
import type { CaseResult, Mission } from "@/lib/types";

interface MissionLabProps {
  mission: Mission;
  starter: string;
  folder: string;
  nextMissionHref?: string;
}

const STATUS_LABEL: Record<CaseResult["status"], string> = {
  pass: "cleared",
  fail: "mismatch",
  error: "crash",
  step_limit: "hang",
  timeout: "timeout",
};

export function MissionLab({ mission, starter, folder, nextMissionHref }: MissionLabProps) {
  const router = useRouter();
  const storeKey = `${mission.id}:${mission.seed ?? "static"}`;
  const stored = useLabStore((state) => state.codeByMission[storeKey]);
  const setCode = useLabStore((state) => state.setCode);
  const code = stored ?? starter;
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const investigationId = useRef(0);
  const [hintCount, setHintCount] = useState(0);
  const [question, setQuestion] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorReply, setMentorReply] = useState("");
  const [mentorError, setMentorError] = useState("");
  const [advancing, setAdvancing] = useState(false);

  // Keep selection independent from results. Previously an unrun selected case
  // fell back to results[0], which showed the previous case's trace.
  const selectedCase = mission.cases.find((testCase) => testCase.id === selectedId) ?? mission.cases[0] ?? null;
  const selected = selectedCase ? results?.find((result) => result.caseId === selectedCase.id) ?? null : null;
  const selectedCaseIndex = selectedCase
    ? mission.cases.findIndex((testCase) => testCase.id === selectedCase.id)
    : -1;
  const investigatedCount = results?.length ?? 0;
  const cleared = mission.cases.length > 0 && investigatedCount === mission.cases.length && results?.every((result) => result.status === "pass");
  const hangCount = results?.filter((result) => result.status === "step_limit" || result.status === "timeout").length ?? 0;

  const traceKeys = useMemo(() => {
    if (!selected?.trace.length) return [];
    const keys = new Set<string>();
    for (const event of selected.trace) {
      Object.keys(event.state).forEach((key) => keys.add(key));
    }
    return Array.from(keys);
  }, [selected]);

  async function investigate() {
    const requestId = investigationId.current + 1;
    investigationId.current = requestId;
    const codeToRun = code;
    const preserveSelection = selectedId !== null;
    setAdvancing(false);
    setRunning(true);
    try {
      let next: CaseResult[];
      try {
        // An investigation evaluates the whole fixed mission case set. Case
        // selection only controls which matching result and trace is shown.
        next = await runMission(codeToRun, mission);
      } catch {
        next = runCases(codeToRun, mission.entry, mission.cases);
      }
      if (investigationId.current !== requestId) return;
      setResults(next);
      if (!preserveSelection) {
        setSelectedId(next.find((result) => result.status !== "pass")?.caseId ?? next[0]?.caseId ?? null);
      }
      if (nextMissionHref && next.length === mission.cases.length && next.every((result) => result.status === "pass")) {
        setAdvancing(true);
        window.setTimeout(() => {
          if (investigationId.current === requestId) router.push(nextMissionHref);
        }, 800);
      }
    } finally {
      if (investigationId.current === requestId) setRunning(false);
    }
  }

  async function askMentor() {
    setMentorLoading(true);
    setMentorError("");
    setMentorReply("");

    const evidence = selected
      ? JSON.stringify({
          caseId: selected.caseId,
          status: selected.status,
          message: selected.message,
          expected: selected.expected,
          actual: selected.actual === undefined ? "<unavailable>" : selected.actual,
          recentTrace: selected.trace.slice(-5).map((event) => event.state),
        }).slice(0, 2000)
      : "No test case has been run yet.";

    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: folder,
          seed: mission.seed,
          code,
          evidence,
          question,
        }),
      });
      const result = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After"));
          const minutes = Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.ceil(retryAfter / 60)
            : 1;
          setMentorError(`Too many questions, try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
        } else if (response.status === 503) {
          setMentorError("Mentor is not available right now.");
        } else {
          setMentorError(result.error ?? "The mentor could not answer right now. Please try again.");
        }
        return;
      }
      if (typeof result.reply !== "string" || !result.reply.trim()) {
        setMentorError("The mentor returned an empty response. Please try again.");
        return;
      }
      setMentorReply(result.reply);
    } catch {
      setMentorError("The mentor could not be reached. Check your connection and try again.");
    } finally {
      setMentorLoading(false);
    }
  }

  return (
    <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
      <section className="flex min-h-[420px] flex-col border-b border-[var(--stroke)] lg:border-b-0 lg:border-r">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--stroke)] py-3 pr-0 sm:pr-5">
          <div>
            <p className="text-xs text-[var(--muted)]">Edit the source · {mission.entry}()</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCode(storeKey, starter)}
              className="rounded-md border border-[var(--stroke)] px-3 py-2 text-xs text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
            >
              Reset starter
            </button>
            <button
              type="button"
              onClick={investigate}
              disabled={running}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {running ? "Running…" : "Investigate"}
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <CodeEditor value={code} onChange={(next) => setCode(storeKey, next)} />
        </div>
      </section>

      <aside className="flex min-h-[420px] flex-col lg:pl-5">
        <div className="border-b border-[var(--stroke)] py-4">
          <h2 className="text-sm font-medium">Test results</h2>
          {results ? (
            <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
              {cleared
                ? advancing
                  ? "All probes cleared. Loading the next mission…"
                  : "All probes cleared. Mission complete."
                : investigatedCount < mission.cases.length
                  ? `${investigatedCount} of ${mission.cases.length} cases investigated.`
                : hangCount
                  ? `${hangCount} probe${hangCount === 1 ? "" : "s"} never returned.`
                  : "Some probes still fail. Read the trace."}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Run an investigation to capture traces.</p>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-[var(--stroke)] py-2">
          <span className="text-xs text-[var(--muted)]">
            Case {selectedCaseIndex + 1} of {mission.cases.length}
          </span>
          <button
            type="button"
            onClick={() => setSelectedId(mission.cases[selectedCaseIndex + 1]?.id ?? selectedCase?.id ?? null)}
            disabled={selectedCaseIndex < 0 || selectedCaseIndex >= mission.cases.length - 1}
            className="text-xs text-[var(--accent)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--muted)]"
          >
            Next case
          </button>
        </div>

        <ul className="max-h-52 overflow-auto border-b border-[var(--stroke)]">
          {mission.cases.map((testCase) => {
            const result = results?.find((item) => item.caseId === testCase.id);
            const active = selectedCase?.id === testCase.id;
            return (
              <li key={testCase.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(testCase.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center justify-between py-2.5 text-left text-sm ${
                    active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <span className="font-mono">{testCase.id}</span>
                  <span className={statusClass(result?.status)}>
                    {result ? STATUS_LABEL[result.status] : "idle"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="min-h-0 flex-1 overflow-auto py-4">
          {selected ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Trace · {selected.caseId} · {selected.trace.length} steps
              </p>
              {selected.message ? (
                <p className="mt-2 text-xs text-[var(--warn)]">{selected.message}</p>
              ) : null}
              {selected.trace.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse font-mono text-[11px]">
                    <thead>
                      <tr className="text-left text-[var(--muted)]">
                        <th className="pb-2 pr-3 font-normal">#</th>
                        {traceKeys.map((key) => (
                          <th key={key} className="pb-2 pr-3 font-normal">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.trace.slice(0, 24).map((event) => (
                        <tr key={event.step} className="text-[var(--ink)]">
                          <td className="py-1 pr-3 text-[var(--muted)]">{event.step}</td>
                          {traceKeys.map((key) => (
                            <td key={key} className="py-1 pr-3">
                              {formatValue(event.state[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selected.trace.length > 24 ? (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      Showing first 24 of {selected.trace.length} steps
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--muted)]">No probe() snapshots were recorded.</p>
              )}
            </>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              {selectedCase ? "Investigate this case to capture its trace." : "No cases are available for this mission."}
            </p>
          )}
        </div>

        <div className="border-t border-[var(--stroke)] py-4">
          <h2 className="text-sm font-medium">Mentor</h2>
          <label htmlFor="mentor-question" className="sr-only">
            Ask the mentor a question
          </label>
          <textarea
            id="mentor-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What should I investigate next?"
            className="mt-3 w-full resize-y border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--muted)]">{question.length}/500</span>
            <button
              type="button"
              onClick={askMentor}
              disabled={mentorLoading || !question.trim()}
              className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mentorLoading ? "Asking…" : "Ask mentor"}
            </button>
          </div>
          {mentorError ? (
            <p role="alert" className="mt-3 text-sm text-[var(--bad)]">{mentorError}</p>
          ) : null}
          {mentorReply ? (
            <p aria-live="polite" className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">
              {mentorReply}
            </p>
          ) : null}
        </div>

        <div className="border-t border-[var(--stroke)] py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Hints</h2>
            <button
              type="button"
              onClick={() => setHintCount((count) => Math.min(mission.hints.length, count + 1))}
              disabled={hintCount >= mission.hints.length}
              className="text-xs text-[var(--accent)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--muted)]"
            >
              {hintCount >= mission.hints.length ? "All notes open" : "Reveal next note"}
            </button>
          </div>
          {hintCount === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Open a hint if you get stuck.</p>
          ) : (
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-[var(--ink)]">
              {mission.hints.slice(0, hintCount).map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}

function statusClass(status?: CaseResult["status"]) {
  if (status === "pass") return "text-[var(--ok)]";
  if (status === "fail" || status === "error") return "text-[var(--bad)]";
  if (status === "step_limit" || status === "timeout") return "text-[var(--warn)]";
  return "text-[var(--muted)]";
}

function formatValue(value: unknown) {
  if (value === undefined) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
