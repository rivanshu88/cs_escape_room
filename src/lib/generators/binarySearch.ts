import { runCases } from "../engine";
import { makeRng, pick, randInt, type Rng } from "../random";
import type { TestCase } from "../types";

export interface Generated {
  variant: string;
  symptom: string;
  hints: string[];
  starter: string;
  cases: TestCase[];
}

const HEADER = `// The "Lighthouse Index" should find a ship's ID in a sorted list of IDs.
// Something is wrong. Investigate it, then fix it.
`;

const build = (loop: string, whenSmall: string, whenBig: string) => `${HEADER}function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (${loop}) {
    const mid = Math.floor((lo + hi) / 2);
    probe({ lo, hi, mid, value: arr[mid] });
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) ${whenSmall};
    else ${whenBig};
  }
  return -1;
}
`;

// Each variant plants a different bug. Add more here to widen the pool.
const VARIANTS = [
  {
    id: "stuck-lo",
    symptom: "Most lookups work, but searches for IDs near the end of the list sometimes never return.",
    hints: [
      "Find a case that hangs and watch lo and hi in its trace. Does the range keep shrinking?",
      "Look at what lo becomes when the value at mid is too small.",
      "mid has already been checked and rejected. Why should the new lo still include it?",
    ],
    starter: build("lo <= hi", "lo = mid", "hi = mid - 1"),
  },
  {
    id: "stuck-hi",
    symptom: "IDs that exist are found, but looking up an ID that is not in the list never returns.",
    hints: [
      "Compare a case that passes with one that hangs. What differs about the target?",
      "In the hanging trace, which pointer stops moving once lo and hi meet?",
      "When the value at mid is too big, mid is already ruled out. Should hi still include it?",
    ],
    starter: build("lo <= hi", "lo = mid + 1", "hi = mid"),
  },
  {
    id: "skip-last",
    symptom: "Some ships that are definitely in the list are reported as missing.",
    hints: [
      "Find a failing case and check whether the wanted ID is in the list. Where is it?",
      "In the trace, what are lo and hi on the last step before the search gives up?",
      "What does the loop condition do when lo equals hi? Is one item still unchecked?",
    ],
    starter: build("lo < hi", "lo = mid + 1", "hi = mid - 1"),
  },
] as const;

function randomCases(rng: Rng): TestCase[] {
  const cases: TestCase[] = [];
  for (let i = 0; i < 6; i++) {
    const size = i === 0 ? 0 : randInt(rng, 1, 12);
    const values = new Set<number>();
    while (values.size < size) values.add(randInt(rng, 1, 60));
    const arr = [...values].sort((a, b) => a - b);

    let target: number;
    if (arr.length > 0 && rng() < 0.5) {
      target = arr[randInt(rng, 0, arr.length - 1)];
    } else {
      do target = randInt(rng, 0, 61);
      while (values.has(target));
    }
    cases.push({ id: `c${i + 1}`, args: [arr, target], expected: arr.indexOf(target) });
  }
  return cases;
}

/**
 * Builds one random mission from a seed. Expected answers come from indexOf, so they are
 * always right. We also run the buggy starter on the cases and re-roll until at least two
 * cases fail and two pass, so every generated mission is solvable and teaches the bug.
 */
export function generateBinarySearch(seed: string): Generated {
  const rng = makeRng(seed);
  const variant = pick(rng, VARIANTS);

  let best: TestCase[] = [];
  let bestFails = -1;
  for (let attempt = 0; attempt < 50; attempt++) {
    const cases = randomCases(rng);
    const results = runCases(variant.starter, "binarySearch", cases, 60);
    const fails = results.filter((r) => r.status !== "pass").length;
    if (fails >= 2 && results.length - fails >= 2) {
      best = cases;
      break;
    }
    if (fails > bestFails) {
      best = cases;
      bestFails = fails;
    }
  }

  return {
    variant: variant.id,
    symptom: variant.symptom,
    hints: [...variant.hints],
    starter: variant.starter,
    cases: best,
  };
}
