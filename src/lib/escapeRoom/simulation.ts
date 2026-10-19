import type { EscapeStage, SimulationResult } from "./types";

function containsSourceLine(codeLines: string[], expectedLine: string): boolean {
  const expected = expectedLine.trim();

  return codeLines.some((line) => {
    const candidate = line.trim();
    if (candidate === expected) return true;
    if (!candidate.startsWith(expected)) return false;

    return /^\s+(?:\/\/|#)/.test(candidate.slice(expected.length));
  });
}

export function simulateStage(
  stage: EscapeStage,
  editedCode: string
): SimulationResult {
  const lines = editedCode.split(/\r?\n/).map((line) => line.trim());
  const repairPresent = containsSourceLine(lines, stage.repairLine);
  const faultPresent = containsSourceLine(lines, stage.faultyLine);

  return {
    passed: repairPresent && !faultPresent,
    trace: [
      "SIMULATION MODE // No C++, Python, or Java code is executed.",
      `Inspecting ${stage.id} against the lab's deterministic repair check.`,
      repairPresent
        ? "Expected repair detected in the source."
        : "Expected repair is not present as a complete source line.",
      faultPresent
        ? "Original failing line is still present."
        : "Original failing line is no longer present.",
      repairPresent && !faultPresent
        ? "Subsystem check passed."
        : "Subsystem remains unstable. Compare the source with the evidence.",
    ],
  };
}
