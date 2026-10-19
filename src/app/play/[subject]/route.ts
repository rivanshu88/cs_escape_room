import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { listMissionBundles, SUBJECTS } from "@/lib/catalog";
import { GENERATORS } from "@/lib/generators";
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

  const previous = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("last-random-incident="))
    ?.slice("last-random-incident=".length);

  let seed = randomBytes(4).toString("hex");
  let chosen = pick(makeRng(seed), bundles);
  let generated = GENERATORS[chosen.folder]?.(seed);
  let incidentKey = `${chosen.folder}-${generated?.variant ?? "static"}`;

  for (let attempt = 0; attempt < 16 && previous === incidentKey; attempt++) {
    seed = randomBytes(4).toString("hex");
    chosen = pick(makeRng(seed), bundles);
    generated = GENERATORS[chosen.folder]?.(seed);
    incidentKey = `${chosen.folder}-${generated?.variant ?? "static"}`;
  }

  const response = NextResponse.redirect(
    new URL(`/missions/${chosen.folder}?seed=${seed}`, request.url)
  );
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.cookies.set("last-random-incident", incidentKey, {
    httpOnly: true,
    sameSite: "lax",
    path: "/play",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
