import Link from "next/link";
import { listMissionBundles, missionsBySubject } from "@/lib/catalog";

export default async function Home() {
  const bundles = await listMissionBundles();
  const wings = missionsBySubject(bundles.map((bundle) => bundle.mission));
  const featured = bundles[0];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 pb-12">
      <section className="grid gap-10 border-b border-[var(--stroke)] py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-20">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">A hands-on computer science lab</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl">
            Learn by finding out what went wrong.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
            Investigate a broken program, follow the evidence, and fix the underlying problem.
            Each mission turns a CS concept into a debugging exercise.
          </p>
          <Link
            href={featured ? `/play/${featured.mission.subject}` : "#missions"}
            prefetch={false}
            className="mt-7 inline-flex rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {featured ? "Start a random mission" : "Browse missions"}
          </Link>
        </div>

        {featured ? (
          <div className="border-l-2 border-[var(--accent)] pl-5 sm:pl-7">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              Inside the lab
            </p>
            <h2 className="mt-3 text-xl font-medium">{featured.mission.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{featured.mission.symptom}</p>
            <p className="mt-5 font-mono text-sm text-[var(--ink)]">
              {featured.mission.entry}() · {featured.mission.cases.length} test cases
            </p>
          </div>
        ) : null}
      </section>

      <section id="subjects" className="scroll-mt-8 border-b border-[var(--stroke)] py-8 sm:py-10">
        <h2 className="text-xl font-medium tracking-tight">Choose a subject</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {wings.map((wing) => (
            <li key={wing.id} className="flex items-stretch gap-2">
              <Link
                href={`/subjects/${wing.id}`}
                className="flex min-h-12 flex-1 items-center justify-between border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <span>{wing.name}</span>
                <span aria-hidden="true" className="text-[var(--muted)]">→</span>
              </Link>
              {wing.missions.length ? (
                <Link
                  href={`/play/${wing.id}`}
                  prefetch={false}
                  className="inline-flex items-center rounded-md border border-[var(--stroke)] bg-white px-3 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Random mission
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section id="missions" className="scroll-mt-8 py-10 sm:py-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-medium tracking-tight">Missions</h2>
          <span className="text-sm text-[var(--muted)]">
            {bundles.length} {bundles.length === 1 ? "mission" : "missions"}
          </span>
        </div>

        {bundles.length ? (
          <ul className="mt-5 divide-y divide-[var(--stroke)] border-y border-[var(--stroke)]">
            {bundles.map(({ folder, mission }) => (
              <li key={mission.id}>
                <Link
                  href={`/missions/${folder}`}
                  className="grid gap-2 py-5 transition-colors hover:bg-[rgba(104,118,83,0.04)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-3"
                >
                  <div>
                    <h3 className="font-medium text-[var(--ink)]">{mission.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{mission.symptom}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {mission.subject} <span aria-hidden="true">·</span> Difficulty {mission.difficulty}/5
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 border-y border-[var(--stroke)] py-5 text-sm text-[var(--muted)]">
            There are no missions available yet.
          </p>
        )}
      </section>
    </main>
  );
}
