import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Mission } from "./types";
import { loadMissionBundle, type MissionBundle } from "./loadMission";

export const SUBJECTS = [
  { id: "DSA", name: "Data Structures & Algorithms", blurb: "Broken searches, stuck sorts, leaking structures." },
  { id: "OS", name: "Operating Systems", blurb: "Deadlocks, schedulers, and memory that will not let go." },
  { id: "DBMS", name: "Databases", blurb: "Lost updates, phantom reads, query plans gone wrong." },
  { id: "Networks", name: "Computer Networks", blurb: "Packets that vanish, handshakes that never finish." },
  { id: "Compilers", name: "Compiler Design", blurb: "Parsers that reject valid programs and emit garbage IR." },
  { id: "AIML", name: "AI / ML", blurb: "Models that overfit, leak labels, or fail in production." },
] as const;

let productionMissionBundles: Promise<MissionBundle[]> | undefined;

async function readMissionBundles(): Promise<MissionBundle[]> {
  const root = path.join(process.cwd(), "missions");
  let folders: string[] = [];
  try {
    folders = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }

  const bundles = await Promise.all(folders.map((folder) => loadMissionBundle(folder).catch(() => null)));
  return bundles.filter((bundle): bundle is MissionBundle => bundle !== null);
}

export function listMissionBundles(): Promise<MissionBundle[]> {
  if (process.env.NODE_ENV !== "production") return readMissionBundles();
  productionMissionBundles ??= readMissionBundles();
  return productionMissionBundles;
}

export function missionsBySubject(missions: Mission[]) {
  return SUBJECTS.map((subject) => ({
    ...subject,
    missions: missions.filter((mission) => mission.subject === subject.id),
  }));
}
