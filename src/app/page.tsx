import Link from "next/link";
import { listMissionBundles, missionsBySubject } from "@/lib/catalog";

export default async function Home() {
  const bundles = await listMissionBundles();
  const wings = missionsBySubject(bundles.map((bundle) => bundle.mission));
  const liveCount = bundles.length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10">
      <section className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">Incident training ground</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">
          You do not submit answers. You investigate failures.
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          CS Escape Lab turns course topics into missions. Code arrives broken, systems hang, and
          traces tell you why. {liveCount} live mission{liveCount === 1 ? "" : "s"} in the DSA wing.
          Other labs are mapped and waiting for cases.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {wings.map((wing) => (
          <article key={wing.id} className="border border-[var(--stroke)] bg-[var(--panel)] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-[var(--ink)]">{wing.name}</h2>
              <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {wing.missions.length ? `${wing.missions.length} live` : "offline"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{wing.blurb}</p>
            <ul className="mt-4 space-y-2">
              {wing.missions.length ? (
                wing.missions.map((mission) => {
                  const bundle = bundles.find((item) => item.mission.id === mission.id);
                  return (
                    <li key={mission.id}>
                      <Link
                        href={`/missions/${bundle?.folder}`}
                        className="block border border-[var(--stroke)] bg-[var(--panel-2)] px-3 py-2 hover:border-[var(--accent)]"
                      >
                        <p className="text-sm text-[var(--ink)]">{mission.title}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{mission.symptom}</p>
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-[var(--muted)]">No cases filed yet.</li>
              )}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
