import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Mission } from "./types";
import { GENERATORS } from "./generators";

export interface MissionBundle {
  folder: string;
  mission: Mission;
  starter: string;
}

const FOLDER_PATTERN = /^[a-z0-9-]{1,60}$/i;

export async function loadMissionBundle(folder: string, seed?: string): Promise<MissionBundle> {
  if (!FOLDER_PATTERN.test(folder)) throw new Error("Invalid mission folder");

  const dir = path.join(process.cwd(), "missions", folder);
  const raw = await readFile(path.join(dir, "mission.json"), "utf8");
  const mission = JSON.parse(raw) as Mission;
  const starter = await readFile(path.join(dir, "starter.js"), "utf8");

  const generate = GENERATORS[folder];
  if (!generate || !seed) return { folder, mission, starter };

  const generated = generate(seed);
  return {
    folder,
    starter: generated.starter,
    mission: {
      ...mission,
      symptom: generated.symptom,
      hints: generated.hints,
      cases: generated.cases,
      seed,
      variant: generated.variant,
    },
  };
}
