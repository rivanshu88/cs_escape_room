import Link from "next/link";
import { notFound } from "next/navigation";
import { MissionLab } from "@/components/MissionLab";
import { loadMissionBundle } from "@/lib/loadMission";
import { SEED_PATTERN } from "@/lib/random";

export default async function MissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seed?: string | string[] }>;
}) {
  const { id } = await params;
  const { seed: seedValue } = await searchParams;
  const seed = typeof seedValue === "string" && SEED_PATTERN.test(seedValue) ? seedValue : undefined;

  let bundle;
  try {
    bundle = await loadMissionBundle(id, seed);
  } catch {
    notFound();
  }

  const { mission, starter } = bundle;

  return (
    <main className="flex min-h-0 flex-1 flex-col pb-10">
      <section className="border-b border-[var(--stroke)] py-6 sm:py-8">
        <Link
          href="/#missions"
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ← All missions
        </Link>
        <p className="mt-6 text-sm text-[var(--muted)]">
          {mission.subject} <span aria-hidden="true">·</span> Difficulty {mission.difficulty}/5
        </p>
        <h1 className="mt-2 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          {mission.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">{mission.briefing}</p>
        <p className="mt-3 text-sm">
          <span className="font-medium">Observed:</span>{" "}
          <span className="text-[var(--muted)]">{mission.symptom}</span>
        </p>
        {mission.variant ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Random incident: {mission.variant.replaceAll("-", " ")}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-[var(--muted)]">
          Concepts: {mission.concepts.join(", ")}
        </p>
      </section>

      <MissionLab mission={mission} starter={starter} folder={id} />
    </main>
  );
}
