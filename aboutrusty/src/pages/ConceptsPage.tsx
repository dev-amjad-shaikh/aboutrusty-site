import { useMemo, useState } from "react";
import { Link } from "react-router";
import { TERMS } from "@/content/concepts";
import { ConceptMap, EDGES } from "@/components/diagrams/research/ConceptMap";
import { lessonHref } from "@/content/lessonLinks";

/** Concepts — how the core ideas depend on each other, plus the glossary. */
export function ConceptsPage() {
  const [sel, setSel] = useState("Super-step");
  const [query, setQuery] = useState("");

  const current = TERMS.find((t) => t.term === sel) ?? TERMS[0];
  const links = EDGES.filter((e) => e.from === sel || e.to === sel);
  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => !q || `${t.term} ${t.definition}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <main className="mx-auto max-w-[1240px] px-7">
      <section className="flex flex-col gap-4 pb-9 pt-[72px]">
        <Link to="/learn" className="text-[14px] text-[#b8b0a8] no-underline hover:text-[#ece0d5]">
          ← Learn
        </Link>
        <h1
          className="m-0 font-light text-[#f7ece4]"
          style={{ fontSize: "clamp(42px,5vw,60px)", lineHeight: 1.04, letterSpacing: "-.03em" }}
        >
          Concepts
        </h1>
        <p className="m-0 max-w-[640px] text-[18px] leading-[1.6] text-[#cfc3b8]">
          How Rusty's core ideas depend on each other, and a glossary of terms.
          Select a concept to see its definition and how it connects to the others.
        </p>
      </section>

      <section className="flex flex-col gap-3 pb-5">
        <div
          className="rounded-[14px] border p-2 sm:p-3"
          style={{ borderColor: "rgba(236,150,96,.14)", background: "rgba(255,236,214,.015)" }}
        >
          <ConceptMap selected={sel} onSelect={setSel} />
        </div>
        <div
          aria-live="polite"
          className="flex flex-col gap-4 rounded-[14px] border px-[22px] py-5"
          style={{ borderColor: "rgba(240,134,43,.32)", background: "rgba(240,134,43,.06)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex max-w-[760px] flex-col gap-1.5">
              <span className="text-[20px] font-normal text-[#f7ece4]">{current.term}</span>
              <span className="text-[16px] leading-[1.6] text-[#d8ccc0]">{current.definition}</span>
            </div>
            {current.lesson && (
              <Link to={lessonHref(current.lesson)} className="whitespace-nowrap text-[15px] text-primary no-underline transition-colors hover:text-[#fb9a3f]">
                Lesson {current.lesson} →
              </Link>
            )}
          </div>
          {links.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2 border-t p-0 pt-4" style={{ borderColor: "rgba(240,134,43,.18)" }}>
              {links.map((e) => {
                const other = e.from === sel ? e.to : e.from;
                return (
                  <li key={`${e.from}-${e.to}`} className="grid gap-1 text-[14.5px] leading-[1.55] sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setSel(other)}
                      className="cursor-pointer justify-self-start border-0 bg-transparent p-0 text-left font-code text-[12.5px] text-primary hover:text-[#fb9a3f]"
                    >
                      {e.from === sel ? "→ " : "← "}
                      {other}
                    </button>
                    <span className="text-[#cfc3b8]">{e.says}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-[18px] pb-20 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="m-0 text-[32px] font-light tracking-[-0.02em] text-[#f7ece4]">
            Glossary
          </h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter terms"
            aria-label="Filter glossary terms"
            className="w-full rounded-[9px] border px-3 py-[9px] text-[14.5px] text-[#f7ece4] outline-none placeholder:text-[#8b837b] focus:border-[rgba(240,134,43,.5)] sm:w-auto sm:min-w-[240px]"
            style={{ background: "rgba(255,236,214,.04)", borderColor: "rgba(236,150,96,.18)" }}
          />
        </div>
        <dl className="m-0 grid gap-x-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
          {terms.map((t) => (
            <div
              key={t.term}
              className="flex flex-col gap-[5px] border-t py-4"
              style={{ borderColor: "rgba(236,150,96,.10)" }}
            >
              <dt className="flex justify-between gap-3">
                <span className="text-[16.5px] font-normal text-[#f7ece4]">{t.term}</span>
                {t.lesson && (
                  <Link
                    to={lessonHref(t.lesson)}
                    className="font-code text-[12px] text-primary no-underline hover:text-[#fb9a3f]"
                    aria-label={`${t.term}: Learn chapter ${t.lesson}`}
                  >
                    {t.lesson}
                  </Link>
                )}
              </dt>
              <dd className="m-0 text-[15px] leading-[1.55] text-[#b8b0a8]">{t.definition}</dd>
            </div>
          ))}
          {terms.length === 0 && (
            <div className="py-4 text-[15px] text-[#8b837b]">No terms match "{query}".</div>
          )}
        </dl>
      </section>
    </main>
  );
}
