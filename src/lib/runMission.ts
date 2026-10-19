import type { CaseResult, Mission, WorkerResponse } from "./types";

/**
 * Runs learner code in a Web Worker. The worker is killed after timeoutMs, which
 * catches infinite loops that never call probe().
 */
export function runMission(code: string, mission: Mission, timeoutMs = 3000): Promise<CaseResult[]> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./runner.worker.ts", import.meta.url), { type: "module" });
    let settled = false;

    const finish = (results: CaseResult[]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(results);
    };

    const unavailable = (status: "timeout" | "error", message: string) =>
      mission.cases.map((c) => ({
        caseId: c.id,
        status,
        expected: c.expected,
        message,
        trace: [],
      }));

    const timer = setTimeout(() => {
      finish(unavailable("timeout", "Execution timed out"));
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      finish(e.data.results);
    };

    worker.onerror = () => {
      finish(unavailable("error", "The execution worker could not run this case"));
    };

    worker.postMessage({ code, entry: mission.entry, cases: mission.cases });
  });
}
