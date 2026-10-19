import Link from "next/link";
import { notFound } from "next/navigation";
import { MissionLab } from "@/components/MissionLab";
import { loadMissionBundle } from "@/lib/loadMission";

export default async function MissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let bundle;
  try {
    bundle = await loadMissionBundle(id);
  } catch {
    notFound();
  }

  const { mission, starter } = bundle;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <section className="border-b border-[var(--stroke)] bg-[var(--panel)] px-6 py-5">
        <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--ink)]">
          ← HQ
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
              {mission.subject} · difficulty {mission.difficulty}/5
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{mission.title}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{mission.briefing}</p>
            <p className="mt-2 text-sm text-[var(--warn)]">Symptom: {mission.symptom}</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {mission.concepts.map((concept) => (
              <li
                key={concept}
                className="border border-[var(--stroke)] px-2 py-1 text-[11px] uppercase tracking-wide text-[var(--muted)]"
              >
                {concept}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <MissionLab mission={mission} starter={starter} />
    </main>
  );
}
