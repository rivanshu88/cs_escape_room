// Core contracts for CS Escape Lab. Every engine, visualizer and grader speaks these types.

/** One recorded moment of a run. Visualizers and time-travel replay read these. */
export interface TraceEvent {
  step: number;                       // 0-based order of the event
  label: string;                      // e.g. "probe", "lock-acquired"
  state: Record<string, unknown>;     // snapshot, e.g. { lo: 0, hi: 4, mid: 2 }
}

export interface TestCase {
  id: string;
  args: unknown[];                    // arguments passed to the entry function
  expected: unknown;
}

export interface Mission {
  id: string;
  title: string;
  subject: "DSA" | "OS" | "DBMS" | "Networks" | "Compilers" | "AIML";
  difficulty: 1 | 2 | 3 | 4 | 5;
  briefing: string;                   // the story
  symptom: string;                    // what the learner observes
  entry: string;                      // function the harness calls
  concepts: string[];
  hints: string[];                    // ordered, vaguest first
  cases: TestCase[];
}

export type CaseStatus = "pass" | "fail" | "error" | "step_limit" | "timeout";

export interface CaseResult {
  caseId: string;
  status: CaseStatus;
  actual?: unknown;
  expected: unknown;
  message?: string;
  trace: TraceEvent[];
}

export interface WorkerRequest { code: string; entry: string; cases: TestCase[]; maxSteps?: number }
export interface WorkerResponse { results: CaseResult[] }
