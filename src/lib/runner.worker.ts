import { runCases } from "./engine";
import type { WorkerRequest, WorkerResponse } from "./types";

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { code, entry, cases, maxSteps } = e.data;
  const response: WorkerResponse = { results: runCases(code, entry, cases, maxSteps) };
  (self as unknown as Worker).postMessage(response);
};
