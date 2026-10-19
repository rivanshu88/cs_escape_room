"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeEditor } from "@/components/CodeEditor";
import { ESCAPE_LANGUAGES } from "@/lib/escapeRoom/campaigns";
import { simulateStage } from "@/lib/escapeRoom/simulation";
import { useEscapeProgressStore } from "@/lib/escapeRoom/store";
import type {
  EscapeCampaign,
  EscapeLanguage,
  EscapeStage,
  SimulationResult,
} from "@/lib/escapeRoom/types";

interface EscapeRoomProps {
  campaign: EscapeCampaign | null;
}

export function EscapeRoom({ campaign }: EscapeRoomProps) {
  const router = useRouter();
  const progress = useEscapeProgressStore((state) => state.progress);
  const completeNextStage = useEscapeProgressStore((state) => state.completeNextStage);
  const resetCampaign = useEscapeProgressStore((state) => state.restartCampaign);
  const [pendingLanguage, setPendingLanguage] = useState<EscapeLanguage | null>(null);
  const [selectedStage, setSelectedStage] = useState<{
    language: EscapeLanguage;
    stageId: string;
  } | null>(null);
  const [codeByStage, setCodeByStage] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    stageId: string;
    result: SimulationResult;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [hintCount, setHintCount] = useState(0);

  useEffect(() => {
    void useEscapeProgressStore.persist.rehydrate();
  }, []);

  const completedIds = campaign
    ? progress[campaign.language]?.completedStageIds ?? []
    : [];
  const completedCount = completedIds.length;
  const rememberedIndex =
    campaign && selectedStage?.language === campaign.language
      ? campaign.stages.findIndex((stage) => stage.id === selectedStage.stageId)
      : -1;
  const activeIndex = campaign
    ? rememberedIndex >= 0
      ? rememberedIndex
      : Math.min(completedCount, campaign.stages.length - 1)
    : 0;
  const activeStage = campaign?.stages[activeIndex] ?? null;
  const code = activeStage
    ? codeByStage[activeStage.id] ?? activeStage.starterCode
    : "";
  const stageResult =
    result && activeStage && result.stageId === activeStage.id
      ? result.result
      : null;
  const currentStageComplete = activeStage
    ? completedIds.includes(activeStage.id)
    : false;

  const completedSet = new Set(completedIds);

  function startCampaign(language: EscapeLanguage) {
    if (pendingLanguage) return;
    setPendingLanguage(language);
    window.setTimeout(() => {
      router.push(`/escape-room?language=${language}`);
    }, 550);
  }

  function selectStage(stage: EscapeStage) {
    if (!campaign) return;
    setSelectedStage({ language: campaign.language, stageId: stage.id });
    setResult(null);
    setHintCount(0);
  }

  function runSimulation() {
    if (!activeStage || running) return;
    setRunning(true);
    window.setTimeout(() => {
      const nextResult = simulateStage(activeStage, code);
      setResult({ stageId: activeStage.id, result: nextResult });
      setRunning(false);
      if (nextResult.passed && campaign && !completedSet.has(activeStage.id)) {
        completeNextStage(campaign.language, activeStage.id);
      }
    }, 220);
  }

  function restartCampaign() {
    if (!campaign) return;
    resetCampaign(campaign.language);
    setSelectedStage({ language: campaign.language, stageId: campaign.stages[0].id });
    setCodeByStage((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([stageId]) => !campaign.stages.some((stage) => stage.id === stageId)
        )
      )
    );
    setResult(null);
    setHintCount(0);
  }

  if (!campaign) {
    return (
      <main className="escape-room my-8 flex-1">
        <div className="escape-room__grid" aria-hidden="true" />
        <div className="escape-room__shell">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="escape-room__link">← Return to dashboard</Link>
            <p className="escape-room__mono">CS ESCAPE LAB // SIMULATION ACCESS</p>
          </div>

          <section className="mx-auto max-w-4xl py-12 text-center sm:py-16">
            <p className="escape-room__mono">UNIDENTIFIED SIGNAL // AWAITING OPERATOR</p>
            <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-6xl">
              WELCOME TO THE UNKNOWN
            </h1>
            <p className="mt-4 text-xs font-medium tracking-[0.15em] text-[#e5a6a6] sm:text-sm">
              THREE LANGUAGES. ONE EXPERIMENT. MULTIPLE WAYS OUT.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#c1b9b7]">
              The system has detected an anomaly in its environment. Select a language,
              enter the simulation, and investigate the chain of failures hidden inside the lab.
              Each campaign uses deterministic repair checks; learner code is not executed.
            </p>

            <div className="mx-auto mt-8 grid max-w-3xl gap-2 text-left sm:grid-cols-3">
              <div className="escape-room__panel">
                <p className="escape-room__mono">SYSTEM STATUS</p>
                <p className="mt-2 text-sm text-[#f0aaaa]">UNSTABLE</p>
              </div>
              <div className="escape-room__panel">
                <p className="escape-room__mono">SECURITY LEVEL</p>
                <p className="mt-2 text-sm text-[#e4d6d0]">CLASSIFIED</p>
              </div>
              <div className="escape-room__panel">
                <p className="escape-room__mono">SIMULATION</p>
                <p className="mt-2 text-sm text-[#e4d6d0]">STANDBY</p>
              </div>
            </div>

            <div className="mt-12">
              <p className="escape-room__mono">SELECT YOUR LANGUAGE // 05 STAGES EACH</p>
              <div className="mx-auto mt-5 grid max-w-4xl gap-4 text-left md:grid-cols-3">
                {ESCAPE_LANGUAGES.map((language) => {
                  const savedCount =
                    progress[language.language]?.completedStageIds.length ?? 0;
                  const isPending = pendingLanguage === language.language;
                  return (
                    <button
                      key={language.language}
                      type="button"
                      aria-pressed={isPending}
                      disabled={pendingLanguage !== null}
                      onClick={() => startCampaign(language.language)}
                      className="escape-room__language"
                    >
                      <span className="escape-room__language-symbol" aria-hidden="true">
                        {language.label === "C++" ? "++" : language.label.slice(0, 1)}
                      </span>
                      <span>
                        <span className="block text-2xl font-medium tracking-tight">{language.label}</span>
                        <span className="mt-2 block text-[10px] leading-5 tracking-[0.08em] text-[#c19b9b]">
                          {language.description}
                        </span>
                        <span className="mt-3 block text-xs text-[#d3c8c5]">
                          {isPending
                            ? "INITIALIZING SIMULATION..."
                            : savedCount
                              ? `RESUME // ${savedCount}/5 STAGES CLEARED`
                              : "ENTER SIMULATION // 5 STAGES"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="escape-room my-8 flex-1">
      <div className="escape-room__grid" aria-hidden="true" />
      <div className="escape-room__shell">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(207,117,117,0.25)] pb-4">
          <Link href="/escape-room" className="escape-room__link">← Change language</Link>
          <p className="escape-room__mono">{campaign.label} <span aria-hidden="true">·</span> {campaign.campaignTitle}</p>
          <Link href="/" className="escape-room__link">Exit to dashboard</Link>
        </div>

        <header className="py-7">
          <p className="escape-room__mono">{campaign.campaignSubtitle}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{campaign.campaignTitle}</h1>
            <p className="escape-room__mono">
              SIMULATION <span aria-hidden="true">·</span> {completedCount}/{campaign.stages.length} CLEARED
            </p>
          </div>
          <div
            className="mt-4 h-1 overflow-hidden bg-[rgba(255,255,255,0.08)]"
            role="progressbar"
            aria-label="Campaign progress"
            aria-valuemin={0}
            aria-valuemax={campaign.stages.length}
            aria-valuenow={completedCount}
          >
            <div
              className="h-full bg-[#b5414d] transition-[width] duration-500"
              style={{ width: `${(completedCount / campaign.stages.length) * 100}%` }}
            />
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)_245px]">
          <nav aria-label="Campaign stages" className="escape-room__panel h-fit">
            <p className="escape-room__mono">CHAIN OF FAILURES</p>
            <ol className="mt-4 space-y-1">
              {campaign.stages.map((stage, index) => {
                const unlocked = index <= completedCount;
                const completed = completedSet.has(stage.id);
                const selected = activeStage?.id === stage.id;
                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      disabled={!unlocked}
                      aria-current={selected ? "step" : undefined}
                      onClick={() => selectStage(stage)}
                      className={`w-full border-l-2 px-3 py-2.5 text-left text-xs transition-colors ${
                        selected
                          ? "border-[#dc6f76] bg-[rgba(153,44,53,0.14)] text-white"
                          : completed
                            ? "border-[#856066] text-[#d5c1c2] hover:bg-white/5"
                            : "border-transparent text-[#8f8988] disabled:cursor-not-allowed"
                      }`}
                    >
                      <span className="escape-room__mono">
                        {String(index + 1).padStart(2, "0")}{" "}
                        <span aria-hidden="true">·</span>{" "}
                        {completed ? "CLEARED" : unlocked ? "OPEN" : "LOCKED"}
                      </span>
                      <span className="mt-1 block leading-5">{stage.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={restartCampaign}
              className="escape-room__link mt-5 border-t border-[rgba(207,117,117,0.2)] pt-4"
            >
              Restart campaign
            </button>
          </nav>

          <section className="min-w-0">
            {activeStage ? (
              <>
                <div className="escape-room__panel">
                  <p className="escape-room__mono">
                    STAGE {String(activeIndex + 1).padStart(2, "0")} / {campaign.stages.length}
                  </p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight">{activeStage.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#c1b9b7]">{activeStage.briefing}</p>
                  <p className="mt-3 border-l border-[#ad515a] pl-3 text-sm leading-6 text-[#e1c2c2]">
                    {activeStage.failure}
                  </p>
                  <p className="mt-4 text-xs text-[#f0dede]">
                    OBJECTIVE <span aria-hidden="true">·</span> {activeStage.objective}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="escape-room__mono">SOURCE CONSOLE <span aria-hidden="true">·</span> {campaign.label}</p>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#978d8b]">
                    Deterministic simulation · no code execution
                  </span>
                </div>
                <div className="escape-room__editor mt-2">
                  <CodeEditor
                    value={code}
                    onChange={(next) => {
                      setCodeByStage((current) => ({
                        ...current,
                        [activeStage.id]: next,
                      }));
                      setResult(null);
                    }}
                    language={campaign.editorLanguage}
                    theme="vs-dark"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={runSimulation}
                    disabled={running || currentStageComplete}
                    className="escape-room__button"
                  >
                    {running ? "Running simulation…" : currentStageComplete ? "Stage cleared" : "Run simulation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeByStage((current) => ({
                        ...current,
                        [activeStage.id]: activeStage.starterCode,
                      }));
                      setResult(null);
                    }}
                    className="escape-room__link"
                  >
                    Reset code
                  </button>
                </div>

                {stageResult ? (
                  <div
                    className={`escape-room__panel mt-4 ${stageResult.passed ? "border-[#587c61]" : "border-[#8c444b]"}`}
                    role={stageResult.passed ? "status" : "alert"}
                  >
                    <p className="escape-room__mono">
                      {stageResult.passed ? "SUBSYSTEM CHECK // PASSED" : "SUBSYSTEM CHECK // FAILED"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#e6dddd]">
                      {stageResult.passed ? activeStage.successMessage : "The repair check did not pass. Inspect the source line and evidence, then try again."}
                    </p>
                    {stageResult.passed && completedCount === campaign.stages.length ? (
                      <p className="mt-3 text-xs leading-5 text-[#d6aaaa]">
                        {activeStage.nextBriefing}
                      </p>
                    ) : null}
                    {stageResult.passed && activeIndex < campaign.stages.length - 1 ? (
                      <div className="mt-4">
                        <p className="text-xs leading-5 text-[#c1b9b7]">{activeStage.nextBriefing}</p>
                        <button
                          type="button"
                          onClick={() => selectStage(campaign.stages[activeIndex + 1])}
                          className="escape-room__button mt-3"
                        >
                          Unlock next stage
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="escape-room__panel">
              <h2 className="escape-room__mono">EVIDENCE // SYSTEM LOG</h2>
              <ul className="mt-3 space-y-2">
                {activeStage?.evidence.map((line) => (
                  <li key={line} className="font-mono text-[11px] leading-5 text-[#cfc5c3]">
                    {line}
                  </li>
                ))}
              </ul>
            </section>

            <section className="escape-room__panel">
              <div className="flex items-center justify-between gap-2">
                <h2 className="escape-room__mono">INVESTIGATION NOTES</h2>
                <button
                  type="button"
                  onClick={() => setHintCount((count) => Math.min(activeStage?.hints.length ?? 0, count + 1))}
                  disabled={hintCount >= (activeStage?.hints.length ?? 0)}
                  className="text-[10px] text-[#e2a1a1] hover:text-white disabled:text-[#777]"
                >
                  {hintCount >= (activeStage?.hints.length ?? 0) ? "OPEN" : "REVEAL"}
                </button>
              </div>
              {hintCount ? (
                <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-5 text-[#d5cbca]">
                  {activeStage?.hints.slice(0, hintCount).map((hint) => <li key={hint}>{hint}</li>)}
                </ol>
              ) : (
                <p className="mt-3 text-xs leading-5 text-[#a9a09f]">Study the system log before opening a note.</p>
              )}
            </section>

            <p className="px-1 text-[10px] leading-5 text-[#827b7a]">
              This is a local learning simulation. Its displayed system statuses are fictional.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
