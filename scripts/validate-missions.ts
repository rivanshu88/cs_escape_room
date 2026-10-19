import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { GENERATORS } from "../src/lib/generators";
import { runCases } from "../src/lib/engine";
import { SUBJECTS } from "../src/lib/catalog";
import type { Mission } from "../src/lib/types";

const root = path.join(process.cwd(), "missions");
const subjectIds = new Set<string>(SUBJECTS.map((subject) => subject.id));
const missionIds = new Set<string>();
const errors: string[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateMission(folder: string, value: unknown): value is Mission {
  if (!isRecord(value)) {
    errors.push(`${folder}: mission.json must contain an object.`);
    return false;
  }

  const id = value.id;
  if (!hasText(id)) {
    errors.push(`${folder}: mission.json must have a non-empty id.`);
    return false;
  }

  const valid =
    hasText(value.title) &&
    typeof value.subject === "string" &&
    subjectIds.has(value.subject) &&
    Number.isInteger(value.difficulty) &&
    Number(value.difficulty) >= 1 &&
    Number(value.difficulty) <= 5 &&
    hasText(value.briefing) &&
    hasText(value.symptom) &&
    hasText(value.entry) &&
    Array.isArray(value.concepts) &&
    value.concepts.every(hasText) &&
    Array.isArray(value.hints) &&
    value.hints.length >= 2 &&
    value.hints.every(hasText) &&
    Array.isArray(value.cases) &&
    value.cases.length >= 3 &&
    value.cases.every(
      (testCase) =>
        isRecord(testCase) &&
        hasText(testCase.id) &&
        Array.isArray(testCase.args) &&
        Object.hasOwn(testCase, "expected")
    );

  if (!valid) {
    errors.push(`${folder}: mission.json is missing required fields or has invalid values.`);
    return false;
  }

  if (missionIds.has(id)) {
    errors.push(`${folder}: duplicate mission id "${id}".`);
    return false;
  }
  missionIds.add(id);
  return true;
}

function checkReproduction(folder: string, code: string, entry: string, cases: Mission["cases"]) {
  const results = runCases(code, entry, cases);
  const passing = results.filter((result) => result.status === "pass").length;
  const failing = results.length - passing;
  if (passing < 1 || failing < 1) {
    errors.push(
      `${folder}: starter must have at least one passing and one failing case (found ${passing} passing, ${failing} failing).`
    );
  }
}

async function main() {
  const folders = await readdir(root, { withFileTypes: true });
  const missionFolders = folders.filter((entry) => entry.isDirectory());
  const missionsByFolder = new Map<string, Mission>();

  for (const entry of missionFolders) {
    const folder = entry.name;
    if (!/^[a-z0-9-]+$/.test(folder)) {
      errors.push(`${folder}: folder name must match /^[a-z0-9-]+$/.`);
      continue;
    }

    try {
      const missionValue: unknown = JSON.parse(
        await readFile(path.join(root, folder, "mission.json"), "utf8")
      );
      if (!validateMission(folder, missionValue)) continue;
      const mission = missionValue;

      const starter = await readFile(path.join(root, folder, "starter.js"), "utf8");
      const entryName = mission.entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const entryPattern = new RegExp(`\\bfunction\\s+${entryName}\\s*\\(`);
      if (!entryPattern.test(starter)) {
        errors.push(`${folder}: starter.js must define function ${mission.entry}().`);
        continue;
      }

      missionsByFolder.set(folder, mission);
      checkReproduction(folder, starter, mission.entry, mission.cases);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown read or parse error";
      errors.push(`${folder}: could not validate mission files (${message}).`);
    }
  }

  for (const [folder, generator] of Object.entries(GENERATORS)) {
    const mission = missionsByFolder.get(folder);
    if (!mission) {
      errors.push(`${folder}: registered generator has no valid mission folder.`);
      continue;
    }

    for (let index = 0; index < 100; index++) {
      const seed = `validation-seed-${index.toString().padStart(3, "0")}`;
      try {
        const generated = generator(seed);
        const repeated = generator(seed);
        if (JSON.stringify(generated) !== JSON.stringify(repeated)) {
          errors.push(`${folder}: generator output is not deterministic for seed ${seed}.`);
          continue;
        }
        const results = runCases(generated.starter, mission.entry, generated.cases, 60);
        const passing = results.filter((result) => result.status === "pass").length;
        const failing = results.length - passing;
        if (passing < 2 || failing < 2) {
          errors.push(
            `${folder}: seed ${seed} needs at least 2 passing and 2 failing cases (found ${passing} passing, ${failing} failing).`
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown generator error";
        errors.push(`${folder}: seed ${seed} failed generator validation (${message}).`);
      }
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${missionsByFolder.size} missions and ${Object.keys(GENERATORS).length} generators over 100 seeds each.`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown validation error";
  console.error(`Mission validation failed: ${message}`);
  process.exitCode = 1;
});
