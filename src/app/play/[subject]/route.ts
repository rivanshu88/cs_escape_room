import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { listMissionBundles, SUBJECTS } from "@/lib/catalog";
import { makeRng, pick } from "@/lib/random";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject } = await params;
  const wing = SUBJECTS.find((s) => s.id.toLowerCase() === subject.toLowerCase());
  const home = new URL("/", request.url);
  if (!wing) return NextResponse.redirect(home);

  const bundles = (await listMissionBundles()).filter((b) => b.mission.subject === wing.id);
  if (bundles.length === 0) return NextResponse.redirect(home);

  const seed = randomBytes(4).toString("hex");   // fresh seed every visit
  const chosen = pick(makeRng(seed), bundles);   // the same seed also picks the mission
  return NextResponse.redirect(new URL(`/missions/${chosen.folder}?seed=${seed}`, request.url));
}
