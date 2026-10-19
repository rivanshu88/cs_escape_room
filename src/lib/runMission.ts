import type { CaseResult, Mission, WorkerResponse } from "./types";

/**
 * Runs learner code in a Web Worker. The worker is killed after timeoutMs, which
 * catches infinite loops that never call probe().
 */
export function runMission(code: string, mission: Mission, timeoutMs = 3000): Promise<CaseResult[]> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./runner.worker.ts", import.meta.url), { type: "module" });

    const timer = setTimeout(() => {
      worker.terminate();
      resolve(
        mission.cases.map((c) => ({
          caseId: c.id, status: "timeout" as const, expected: c.expected,
          message: "Execution timed out", trace: [],
        }))
      );
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data.results);
    };

    worker.postMessage({ code, entry: mission.entry, cases: mission.cases });
  });
}
