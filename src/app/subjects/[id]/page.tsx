import Link from "next/link";
import { notFound } from "next/navigation";
import { listMissionBundles, SUBJECTS } from "@/lib/catalog";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = SUBJECTS.find((item) => item.id === id);

  if (!subject) notFound();

  const bundles = await listMissionBundles();
  const missions = bundles.filter((bundle) => bundle.mission.subject === subject.id);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 pb-12">
      <section className="border-b border-[var(--stroke)] py-10 sm:py-14">
        <Link
          href="/#subjects"
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ← All subjects
        </Link>
        <p className="mt-7 text-sm font-medium text-[var(--accent)]">Subject</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{subject.name}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">{subject.blurb}</p>
      </section>

      <section className="py-8">
        <h2 className="text-xl font-medium tracking-tight">Missions</h2>
        {missions.length ? (
          <ul className="mt-4 divide-y divide-[var(--stroke)] border-y border-[var(--stroke)]">
            {missions.map(({ folder, mission }) => (
              <li key={mission.id}>
                <Link
                  href={`/missions/${folder}`}
                  className="block py-5 hover:bg-[rgba(104,118,83,0.04)] sm:px-3"
                >
                  <h3 className="font-medium">{mission.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{mission.symptom}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Difficulty {mission.difficulty}/5
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-y border-[var(--stroke)] py-5 text-sm leading-6 text-[var(--muted)]">
            This subject is coming soon. Missions for {subject.name} are being prepared.
          </p>
        )}
      </section>
    </main>
  );
}
