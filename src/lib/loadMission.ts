import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Mission } from "./types";

export interface MissionBundle {
  folder: string;
  mission: Mission;
  starter: string;
}

export async function loadMissionBundle(folder: string): Promise<MissionBundle> {
  const dir = path.join(process.cwd(), "missions", folder);
  const raw = await readFile(path.join(dir, "mission.json"), "utf8");
  const mission = JSON.parse(raw) as Mission;
  const starter = await readFile(path.join(dir, "starter.js"), "utf8");
  return { folder, mission, starter };
}
