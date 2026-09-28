import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { ACTS, PARTS } from "@/content/learn/course";
import { lessons } from "@/content/learn";
import { lessonHref } from "@/content/lessonLinks";
import { readDone } from "./progress";

const ROUTES = [
  { id: "new", name: "New to agent runtimes", path: "Start at part 1", target: 0 },
  { id: "lg", name: "I know graph-based agents", path: "Skip to part 4", target: 3 },
  { id: "ops", name: "I operate services", path: "Parts 3, 6, 9", target: 2 },
  { id: "rs", name: "I write Rust", path: "Part 11 alongside 2", target: 1 },
  { id: "con", name: "I want to contribute", path: "Parts 2 and 11", target: 1 },
];

function scrollToPart(index: number) {
  const el = document.getElementById("part-" + (index + 1));
  if (el) {
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 100,
      behavior: "smooth",
    });
  }
}

/** Learn hub — the 11-part course map from the reference design, with the
 * scroll-driven progress line and starting-point routes. */
export function LearnIndex() {
  const [route, setRoute] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [fill, setFill] = useState(0);

  const [done] = useState<string[]>(readDone);
  const { hash } = useLocation();

  const flat = PARTS;
  const total = flat.reduce((n, p) => n + p.chapters.length, 0);
  const lessonById = useMemo(() => new Map(lessons.map((l) => [l.id, l])), []);
  const interactive = lessons.filter((l) => l.interactive).length;
  const pct = Math.round((done.filter((id) => lessonById.has(id)).length / lessons.length) * 100);
  const nextUnread = lessons.find((l) => !done.includes(l.id));

  // Arriving from a lesson's sidebar at /learn#part-N scrolls to that part.
  useEffect(() => {
    const m = /^#part-(\d+)$/.exec(hash);
    if (m) requestAnimationFrame(() => scrollToPart(Number(m[1]) - 1));
    else window.scrollTo(0, 0);
  }, [hash]);

  useEffect(() => {
    const onScroll = () => {
      const els = [...document.querySelectorAll("[data-part]")] as HTMLElement[];
      if (!els.length) return;
      const mid = window.innerHeight * 0.45;
      let a = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top < mid) a = i;
      });
      const first = els[0].getBoundingClientRect().top;
      const last = els[els.length - 1].getBoundingClientRect().top;
      const f = Math.max(0, Math.min(1, (mid - first) / Math.max(1, last - first)));
      setActive(a);
      setFill(f);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: "rgba(236,150,96,.10)" }}
      >
        <style>{`@keyframes rglow-learn{0%,100%{opacity:.5}50%{opacity:.9}}`}</style>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 motion-reduce:animate-none"
          style={{
            background: "radial-gradient(40% 60% at 80% 40%,rgba(232,116,42,.2),rgba(0,0,0,0) 70%)",
            animation: "rglow-learn 10s ease-in-out infinite",
          }}
        />
        <div
          className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-7 pb-16 pt-20"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))" }}
        >
          <div className="flex flex-col gap-[22px]">
            <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-primary">
              Learn · a guide in 11 parts
            </span>
            <h1
              className="m-0 font-light text-[#f7ece4]"
              style={{ fontSize: "clamp(44px,5.4vw,70px)", lineHeight: 1.02, letterSpacing: "-.035em", textWrap: "balance" }}
            >
              Learn how Rusty works
            </h1>
            <p className="m-0 max-w-[540px] text-[19px] leading-[1.6] text-[#d8ccc0]" style={{ textWrap: "pretty" }}>
              One guide that follows a single agent run from the first line of
              a graph to a production rollout. Each part builds on the one
              before, with the real source code and interactive diagrams.
            </p>
            <p className="m-0 max-w-[540px] text-[15.5px] leading-[1.6] text-[#a39a91]">
              {lessons.length} chapters are written as lessons here. The rest
              link to the chapter of the Rusty book that covers the same
              ground, marked <span className="font-code text-[12px] text-[#cbb3a2]">book</span>.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {done.length > 0 && nextUnread ? (
                <Link
                  to={`/learn/${nextUnread.slug}`}
                  className="rounded-[9px] bg-primary px-[22px] py-[13px] text-[16px] font-medium text-primary-foreground no-underline transition-colors hover:bg-[#fb9a3f] hover:text-primary-foreground"
                  style={{ boxShadow: "0 10px 30px -10px rgba(240,134,43,.8)" }}
                >
                  Continue reading
                </Link>
              ) : (
                <button
                  onClick={() => scrollToPart(0)}
                  className="cursor-pointer rounded-[9px] border-0 bg-primary px-[22px] py-[13px] text-[16px] font-medium text-primary-foreground transition-colors hover:bg-[#fb9a3f]"
                  style={{ boxShadow: "0 10px 30px -10px rgba(240,134,43,.8)" }}
                >
                  Start at part 1
                </button>
              )}
              <Link
                to="/concepts"
                className="rounded-[9px] border px-5 py-[13px] text-[16px] text-[#ece0d5] no-underline transition-colors hover:border-[rgba(236,150,96,.5)] hover:text-[#fff3ea]"
                style={{ borderColor: "rgba(236,150,96,.25)" }}
              >
                Concepts &amp; glossary
              </Link>
            </div>
            <div className="flex flex-wrap gap-7 pt-1.5">
              {[
                ["11", "parts"],
                [String(total), "chapters"],
                [String(lessons.length), "lessons"],
                [String(interactive), "interactive"],
                [`${pct}%`, "read"],
              ].map(([n, label]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[28px] font-light text-[#f7ece4]">{n}</span>
                  <span className="text-[13.5px] text-[#8b837b]">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] text-[#a39a91]">Where are you starting from?</span>
            {ROUTES.map((r) => {
              const on = route === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setRoute(on ? null : r.id);
                    if (!on) scrollToPart(r.target);
                  }}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-[18px] py-3.5 text-left text-inherit transition-all"
                  style={{
                    borderColor: on ? "rgba(240,134,43,.6)" : "rgba(236,150,96,.16)",
                    background: on ? "rgba(240,134,43,.14)" : "rgba(255,236,214,.03)",
                  }}
                >
                  <span className="text-[16.5px] text-[#f7ece4]">{r.name}</span>
                  <span className="text-[14px]" style={{ color: on ? "#ffc7a6" : "#8b837b" }}>
                    {r.path}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1240px] items-start gap-12 px-7 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <aside className="sticky top-[84px] flex flex-col gap-0.5 pt-14 max-lg:hidden">
          {ACTS.map((act) => (
            <span key={act.name} className="contents">
              <span className="px-2.5 pb-1.5 pt-3.5 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">
                {act.name}
              </span>
              {act.parts.map((part) => {
                const i = flat.indexOf(part);
                const on = i === active;
                return (
                  <a
                    key={part.title}
                    href={`#part-${i + 1}`}
                    className="flex gap-2.5 rounded-[7px] px-2.5 py-1.5 text-[14px] no-underline transition-colors hover:text-[#fff3ea]"
                    style={{
                      color: on ? "#fff3ea" : "#a39a91",
                      background: on ? "rgba(240,134,43,.14)" : "transparent",
                    }}
                  >
                    <span
                      className="min-w-[18px] font-code text-[11.5px]"
                      style={{ color: on ? "#f0862b" : "#6f675f" }}
                    >
                      {i + 1}
                    </span>
                    {part.title}
                  </a>
                );
              })}
            </span>
          ))}
        </aside>

        <div className="relative min-w-0 pb-10 pt-14">
          <span
            aria-hidden="true"
            className="absolute bottom-[60px] left-[23px] top-20 w-0.5"
            style={{ background: "rgba(236,150,96,.12)" }}
          />
          <span
            aria-hidden="true"
            className="absolute left-[23px] top-20 w-0.5"
            style={{
              height: `calc((100% - 140px) * ${fill.toFixed(3)})`,
              background: "linear-gradient(180deg,#b4501f,#f0862b)",
              boxShadow: "0 0 12px rgba(240,134,43,.6)",
              transition: "height .3s linear",
            }}
          />
          {ACTS.map((act) => (
            <div key={act.name}>
              <div className="mb-1 mt-6 flex flex-col gap-1.5 pb-[18px] pl-[72px]">
                <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-primary">
                  {act.name}
                </span>
                <span className="text-[26px] font-light tracking-[-0.01em] text-[#f7ece4]">
                  {act.title}
                </span>
              </div>
              {act.parts.map((part) => {
                const i = flat.indexOf(part);
                const on = i === active;
                const hl = route !== null && ROUTES.find((r) => r.id === route)?.target === i;
                const reached = i <= active;
                const lit = on || hl;
                return (
                  <div
                    key={part.title}
                    id={`part-${i + 1}`}
                    data-part="1"
                    className="relative grid grid-cols-[48px_minmax(0,1fr)] gap-6 pb-7"
                    style={{ scrollMarginTop: 90 }}
                  >
                    <div
                      className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-full border-2 text-[17px]"
                      style={{
                        borderColor: lit ? "#f0862b" : reached ? "rgba(240,134,43,.5)" : "rgba(236,150,96,.2)",
                        background: "#0d0908",
                        color: lit ? "#fff3ea" : reached ? "#f0862b" : "#8b837b",
                        boxShadow: lit ? "0 0 24px rgba(240,134,43,.55)" : "none",
                        transition: "all .4s",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      className="flex flex-col gap-3.5 rounded-2xl border px-6 py-[22px]"
                      style={{
                        borderColor: lit ? "rgba(240,134,43,.4)" : "rgba(236,150,96,.12)",
                        background: lit
                          ? "linear-gradient(160deg,rgba(240,134,43,.09),rgba(200,110,44,.02))"
                          : "rgba(255,236,214,.02)",
                        transition: "all .4s",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 max-w-[620px] flex-1 flex-col gap-1.5">
                          <span className="text-[22px] font-normal tracking-[-0.01em] text-[#f7ece4]">
                            {part.title}
                          </span>
                          <span className="text-[16px] leading-[1.6] text-[#b8b0a8]">
                            {part.lead}
                          </span>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                          {part.tag && (
                            <span
                              className="rounded-[5px] border px-[7px] py-0.5 font-code text-[11px] text-[#cbb3a2]"
                              style={{ borderColor: "rgba(236,150,96,.2)" }}
                            >
                              {part.tag}
                            </span>
                          )}
                          <span className="font-code text-[12px] text-[#8b837b]">
                            {part.chapters.filter((c) => done.includes(c.id)).length}/{part.chapters.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        {part.chapters.map((chapter) => {
                          const lesson = chapter.lesson ? lessonById.get(chapter.id) : undefined;
                          const withinId = chapter.within
                            ? lessons.find((l) => l.slug === chapter.within!.split("#")[0])?.id
                            : undefined;
                          const href = lessonHref(chapter.id);
                          const row = (
                            <>
                              <span className="font-code text-[12.5px] text-[#8b837b]">{chapter.id}</span>
                              <span className="text-[15.5px] text-[#ece0d5]">{chapter.t}</span>
                              <span className="flex items-center justify-end gap-2">
                                {lesson?.interactive && (
                                  <span
                                    className="rounded-[5px] border px-[7px] py-0.5 font-code text-[10.5px] text-[#ffc7a6] max-sm:hidden"
                                    style={{ background: "rgba(240,134,43,.14)", borderColor: "rgba(240,134,43,.3)" }}
                                  >
                                    interactive
                                  </span>
                                )}
                                {lesson && (
                                  <span
                                    className="rounded-[5px] border px-[7px] py-0.5 font-code text-[10.5px] text-[#f7ece4]"
                                    style={{ borderColor: "rgba(240,134,43,.45)" }}
                                  >
                                    lesson
                                  </span>
                                )}
                                {withinId && (
                                  <span className="font-code text-[10.5px] text-[#cbb3a2]">in {withinId}</span>
                                )}
                                {!lesson && !withinId && (
                                  <span className="font-code text-[10.5px] uppercase tracking-[0.08em] text-[#6f675f]">
                                    book ↗
                                  </span>
                                )}
                                <span className="w-3.5 text-[13px] text-[#9fd4a8]">{done.includes(chapter.id) ? "✓" : ""}</span>
                              </span>
                            </>
                          );
                          const cls =
                            "grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-t px-2 py-2.5 text-inherit no-underline transition-colors hover:bg-[rgba(240,134,43,.08)]";
                          const style = { borderColor: "rgba(236,150,96,.08)", borderRadius: 8 };
                          return href.startsWith("/guide/") ? (
                            <a key={chapter.id} href={href} className={cls} style={style}>
                              {row}
                            </a>
                          ) : (
                            <Link key={chapter.id} to={href} className={cls} style={style}>
                              {row}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex flex-col gap-2 pl-[72px]">
            <span className="text-[17px] text-[#f7ece4]">That's the whole run.</span>
            <span className="text-[15.5px] text-[#a39a91]">
              Ready to build one? The <Link to="/docs">Docs</Link> cover
              install, setup, and deployment step by step.
            </span>
          </div>

        </div>
      </main>
    </>
  );
}
