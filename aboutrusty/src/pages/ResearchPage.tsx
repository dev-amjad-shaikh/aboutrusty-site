import { Link } from "react-router";
import { IDEAS, OPEN_QUESTIONS, PROBLEMS, READING, repoFile } from "@/content/research";
import { lessonHref } from "@/content/lessonLinks";
import { PROBLEM_DIAGRAMS } from "@/components/diagrams/research/ProblemDiagrams";
import { Kicker, SectionTitle } from "@/sections/landing/home/primitives";

const HAIRLINE = "rgba(236,150,96,.14)";

function ProblemFigure({ id }: { id: string }) {
  const Figure = PROBLEM_DIAGRAMS[id];
  if (!Figure) return null;
  return (
    <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
      <Figure />
    </div>
  );
}

/** Research — the problems Rusty solves, the work it builds on, and what is still open. */
export function ResearchPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-7">
      <section className="relative flex flex-col gap-[18px] pb-12 pt-[72px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-[-160px] h-[520px] w-[520px] rounded-full max-md:hidden"
          style={{ background: "radial-gradient(circle,rgba(232,116,42,.18),rgba(232,116,42,0) 65%)" }}
        />
        <Kicker>Research &amp; engineering</Kicker>
        <h1
          className="relative m-0 font-light text-[#f7ece4]"
          style={{ fontSize: "clamp(42px,5vw,60px)", lineHeight: 1.04, letterSpacing: "-.03em" }}
        >
          Research
        </h1>
        <p className="relative m-0 max-w-[720px] text-[18px] leading-[1.6] text-[#cfc3b8]">
          The ideas behind Rusty, where they come from, and the problems they
          solve. Each idea below is implemented in the runtime, and most are
          checked by an automated test named with it. We name the lineage for
          every idea and say where Rusty differs from it.
        </p>
      </section>

      {/* Part A */}
      <section className="flex flex-col gap-8 pb-16">
        <div className="flex flex-col gap-3">
          <Kicker>Part A</Kicker>
          <SectionTitle>Problems Rusty solves</SectionTitle>
        </div>

        <nav aria-label="Problems" className="flex flex-wrap gap-2">
          {PROBLEMS.map((p, i) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className="rounded-[9px] border px-3 py-[7px] text-[14px] text-[#d8ccc0] no-underline transition-colors hover:border-[rgba(240,134,43,.5)] hover:text-[#fff3ea]"
              style={{ borderColor: "rgba(236,150,96,.2)" }}
            >
              <span className="mr-2 font-code text-[12px] text-primary">{String(i + 1).padStart(2, "0")}</span>
              {p.title}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          {PROBLEMS.map((p, i) => (
            <article
              key={p.id}
              id={p.id}
              className="flex scroll-mt-24 flex-col gap-5 rounded-[14px] border p-5 sm:p-6 md:p-8"
              style={{ borderColor: HAIRLINE, background: "rgba(255,236,214,.025)" }}
            >
              <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="font-code text-[13px] text-primary">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="m-0 text-[24px] font-light tracking-[-0.01em] text-[#f7ece4] md:text-[26px]">
                  {p.title}
                </h3>
                {p.onMain && (
                  <span
                    className="rounded-full border px-2.5 py-0.5 font-code text-[11px] uppercase tracking-[0.12em] text-[#f5b774]"
                    style={{ borderColor: "rgba(245,183,116,.35)" }}
                  >
                    on main
                  </span>
                )}
              </header>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
              <dl className="m-0 flex flex-col gap-4">
                {p.rows.map((r) => (
                  <div key={r.label} className="grid gap-1.5 md:grid-cols-[170px_minmax(0,1fr)] md:gap-6">
                    <dt className="pt-[3px] font-code text-[11.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">
                      {r.label}
                    </dt>
                    <dd className="m-0 max-w-[820px] text-[16px] leading-[1.65] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
                      {r.text}
                    </dd>
                  </div>
                ))}
                {p.proof && (
                  <div className="grid gap-1.5 md:grid-cols-[170px_minmax(0,1fr)] md:gap-6">
                    <dt className="pt-[3px] font-code text-[11.5px] uppercase tracking-[0.14em] text-[#9fd4a8]">
                      Proof
                    </dt>
                    <dd className="m-0 flex max-w-[820px] flex-col gap-1.5">
                      <a
                        href={repoFile(p.proof.path)}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all font-code text-[13.5px] text-primary no-underline transition-colors hover:text-[#fb9a3f]"
                      >
                        {p.proof.path}
                      </a>
                      <span className="text-[16px] leading-[1.65] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
                        {p.proof.text}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
              <ProblemFigure id={p.id} />
              </div>

              {p.lessons.length > 0 && (
                <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t pt-4 text-[14.5px] text-[#a39a91]" style={{ borderColor: "rgba(236,150,96,.10)" }}>
                  <span>Learn</span>
                  {p.lessons.map((id) => (
                    <Link key={id} to={lessonHref(id)} className="font-code text-[13.5px] text-primary no-underline transition-colors hover:text-[#fb9a3f]">
                      {id}
                    </Link>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Part B */}
      <section className="flex flex-col gap-6 pb-16">
        <div className="flex flex-col gap-3">
          <Kicker>Part B</Kicker>
          <SectionTitle>Ideas Rusty builds on</SectionTitle>
        </div>
        <div className="overflow-x-auto rounded-[14px] border" style={{ borderColor: HAIRLINE }}>
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr style={{ background: "rgba(255,236,214,.03)" }}>
                {["Idea", "Source", "In Rusty"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 font-code text-[11.5px] font-normal uppercase tracking-[0.14em] text-[#cbb3a2]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IDEAS.map((r) => (
                <tr key={r.idea} className="border-t align-top" style={{ borderColor: "rgba(236,150,96,.10)" }}>
                  <td className="px-5 py-3.5 text-[15px] leading-[1.5] text-[#f7ece4]">{r.idea}</td>
                  <td className="px-5 py-3.5 text-[14.5px] leading-[1.5] text-[#b8b0a8]">{r.source}</td>
                  <td className="px-5 py-3.5 text-[14.5px] leading-[1.5] text-[#cfc3b8]">{r.inRusty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Part C */}
      <section className="grid gap-10 pb-24 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Kicker>Part C</Kicker>
          <SectionTitle>Open questions</SectionTitle>
          <ul className="m-0 flex list-none flex-col p-0">
            {OPEN_QUESTIONS.map((q) => (
              <li
                key={q}
                className="flex gap-3 border-t py-3.5 text-[16px] leading-[1.6] text-[#cfc3b8]"
                style={{ borderColor: "rgba(236,150,96,.10)" }}
              >
                <span aria-hidden="true" className="text-[#f5b774]">○</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-5">
          <Kicker>Further reading</Kicker>
          <SectionTitle>In the repo</SectionTitle>
          <ul className="m-0 flex list-none flex-col p-0">
            {READING.map((r) => (
              <li key={r.path} className="border-t" style={{ borderColor: "rgba(236,150,96,.10)" }}>
                <a
                  href={repoFile(r.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5 no-underline"
                >
                  <span className="text-[16px] text-[#ece0d5]">{r.label}</span>
                  <span className="font-code text-[12.5px] text-primary">{r.path}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
