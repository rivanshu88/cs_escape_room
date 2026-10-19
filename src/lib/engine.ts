import type { CaseResult, TestCase, TraceEvent } from "./types";

export const DEFAULT_MAX_STEPS = 500;

class StepLimitError extends Error {}

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Pure logic (no worker globals) so it can be unit-tested anywhere. */
export function runCases(
  code: string,
  entry: string,
  cases: TestCase[],
  maxSteps = DEFAULT_MAX_STEPS
): CaseResult[] {
  return cases.map((tc): CaseResult => {
    const trace: TraceEvent[] = [];

    // The mission author places probe({...}) calls in the starter code.
    // Each call records a snapshot and also acts as an infinite-loop guard.
    const probe = (state: Record<string, unknown>) => {
      if (trace.length >= maxSteps) throw new StepLimitError("Too many steps: possible infinite loop");
      trace.push({ step: trace.length, label: "probe", state: structuredClone(state) });
    };

    try {
      const fn = new Function("probe", `${code}\nreturn ${entry};`)(probe);
      const actual = fn(...structuredClone(tc.args));
      return sameValue(actual, tc.expected)
        ? { caseId: tc.id, status: "pass", actual, expected: tc.expected, trace }
        : { caseId: tc.id, status: "fail", actual, expected: tc.expected, trace };
    } catch (err) {
      const isLimit = err instanceof StepLimitError;
      return {
        caseId: tc.id,
        status: isLimit ? "step_limit" : "error",
        expected: tc.expected,
        message: (err as Error).message,
        trace,
      };
    }
  });
}
