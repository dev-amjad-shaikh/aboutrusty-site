import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { articles } from "@/content/learn";

interface Chapter {
  id: string;
  t: string;
  interactive?: boolean;
  href: string;
}

interface Part {
  title: string;
  lead: string;
  tag: string;
  chapters: Chapter[];
  href: string;
}

interface Act {
  name: string;
  title: string;
  parts: Part[];
}

const G = (path: string) => `/guide/${path}`;

/** The 11-part course from the design, with each chapter pointing at the
 * guide chapter that teaches it today. */
const ACTS: Act[] = [
  {
    name: "Act I",
    title: "The engine",
    parts: [
      {
        title: "Foundations",
        lead: "What an agent does at runtime, how it fails, and why graphs and super-steps are the answer.",
        tag: "",
        href: G("01-the-problem.html"),
        chapters: [
          { id: "1.1", t: "What an agent does at runtime", href: G("01-the-problem.html") },
          { id: "1.2", t: "How agents fail", href: G("01-the-problem.html") },
          { id: "1.3", t: "Graphs as a programming model", href: G("02-mental-model.html") },
          { id: "1.4", t: "Super-steps and the Pregel idea", href: G("02-mental-model.html") },
          { id: "1.5", t: "Where Rusty comes from", href: G("00-preface.html") },
        ],
      },
      {
        title: "A run, step by step",
        lead: "Follow one super-step through the executor: channels, reducers, the barrier, the merge.",
        tag: "rusty-core",
        href: G("02-mental-model.html"),
        chapters: [
          { id: "2.1", t: "The four primitives", href: G("02-mental-model.html") },
          { id: "2.2", t: "State channels and reducers", href: G("02-mental-model.html") },
          { id: "2.3", t: "The super-step loop", interactive: true, href: G("02-mental-model.html") },
          { id: "2.4", t: "Snapshot isolation and deterministic merges", href: G("02-mental-model.html") },
          { id: "2.5", t: "Routing and fan-out", interactive: true, href: G("02-mental-model.html") },
          { id: "2.6", t: "The ReAct agent as a graph", href: G("02-mental-model.html") },
        ],
      },
      {
        title: "Pausing and resuming",
        lead: "Where state is saved, how a run waits for a person, and how you go back in time.",
        tag: "rusty-core",
        href: G("10-durability.html"),
        chapters: [
          { id: "3.1", t: "Checkpoints", interactive: true, href: G("10-durability.html") },
          { id: "3.2", t: "Interrupts", interactive: true, href: G("10-durability.html") },
          { id: "3.3", t: "Time travel and forks", href: G("10-durability.html") },
          { id: "3.4", t: "Why nodes must be idempotent", href: G("10-durability.html") },
        ],
      },
    ],
  },
  {
    name: "Act II",
    title: "Reliability and evidence",
    parts: [
      {
        title: "Surviving failure",
        lead: "Side effects, leases, and retries: how work outlives a crash without running twice.",
        tag: "R0.6",
        href: G("10-durability.html"),
        chapters: [
          { id: "4.1", t: "Why checkpoints aren't enough", href: G("10-durability.html") },
          { id: "4.2", t: "Leases, heartbeats, and retries", href: G("10-durability.html") },
          { id: "4.3", t: "Idempotency keys and effect receipts", href: G("10-durability.html") },
          { id: "4.4", t: "Walkthrough: the crash_recovery test", interactive: true, href: G("10-durability.html") },
        ],
      },
      {
        title: "Explaining a run",
        lead: "The Flight Recorder: journals, effect types, exact replay, and signed receipts.",
        tag: "R0.5",
        href: G("03-journals.html"),
        chapters: [
          { id: "5.1", t: "The run journal", href: G("03-journals.html") },
          { id: "5.2", t: "The effect taxonomy", href: G("12-policy-security.html") },
          { id: "5.3", t: "Deterministic replay", interactive: true, href: G("03-journals.html") },
          { id: "5.4", t: "Comparing two runs", href: G("03-journals.html") },
          { id: "5.5", t: "Signed receipts", href: G("12-policy-security.html") },
        ],
      },
      {
        title: "The server",
        lead: "How the HTTP server exposes the engine without changing its semantics.",
        tag: "rusty-server",
        href: G("13-server-sdks.html"),
        chapters: [
          { id: "6.1", t: "Threads, runs, and assistants", href: G("13-server-sdks.html") },
          { id: "6.2", t: "One active run per thread", href: G("13-server-sdks.html") },
          { id: "6.3", t: "Streaming and reconnects", href: G("13-server-sdks.html") },
          { id: "6.4", t: "Tenants by namespace", href: G("12-policy-security.html") },
          { id: "6.5", t: "Storage and graceful shutdown", href: G("22-deploy-operate.html") },
        ],
      },
    ],
  },
  {
    name: "Act III",
    title: "Operating at scale",
    parts: [
      {
        title: "Many agents",
        lead: "Durable agents, mailboxes, supervision, and coordination patterns.",
        tag: "R0.7",
        href: G("11-sub-agents.html"),
        chapters: [
          { id: "7.1", t: "Durable agents and mailboxes", href: G("11-sub-agents.html") },
          { id: "7.2", t: "Supervision", interactive: true, href: G("11-sub-agents.html") },
          { id: "7.3", t: "Coordination patterns", href: G("11-sub-agents.html") },
          { id: "7.4", t: "Delta checkpoints", href: G("10-durability.html") },
        ],
      },
      {
        title: "Changing behavior safely",
        lead: "How Rusty learns from corrections without silently rewriting production.",
        tag: "R0.8",
        href: G("05-learning-loop.html"),
        chapters: [
          { id: "8.1", t: "The learning rule", href: G("05-learning-loop.html") },
          { id: "8.2", t: "Governed memory", href: G("04-memory.html") },
          { id: "8.3", t: "Corrections", href: G("05-learning-loop.html") },
          { id: "8.4", t: "Promotion and rollback", href: G("05-learning-loop.html") },
          { id: "8.5", t: "The runtime twin", href: G("20-evaluate.html") },
        ],
      },
      {
        title: "Shipping",
        lead: "Revisions, release gates, canaries, and shadows.",
        tag: "R0.12",
        href: G("22-deploy-operate.html"),
        chapters: [
          { id: "9.1", t: "Revisions and pointers", href: G("22-deploy-operate.html") },
          { id: "9.2", t: "Release gates", href: G("20-evaluate.html") },
          { id: "9.3", t: "Canary and shadow", interactive: true, href: G("22-deploy-operate.html") },
          { id: "9.4", t: "Artifacts and lineage", href: G("22-deploy-operate.html") },
        ],
      },
      {
        title: "Security",
        lead: "Deny by default: capsules, authorization, and the credential broker.",
        tag: "R0.9",
        href: G("12-policy-security.html"),
        chapters: [
          { id: "10.1", t: "Capsules", href: G("07-capsules.html") },
          { id: "10.2", t: "Authorization", href: G("12-policy-security.html") },
          { id: "10.3", t: "The credential broker", href: G("12-policy-security.html") },
        ],
      },
      {
        title: "Why Rust",
        lead: "How Rust's type system and ownership shape the design, and what it costs.",
        tag: "",
        href: G("02-mental-model.html"),
        chapters: [
          { id: "11.1", t: "Send, Sync, and parallel nodes", href: G("02-mental-model.html") },
          { id: "11.2", t: "Ownership as transactions", href: G("02-mental-model.html") },
          { id: "11.3", t: "Copy-on-write state", href: G("02-mental-model.html") },
          { id: "11.4", t: "Effects as types", href: G("12-policy-security.html") },
          { id: "11.5", t: "Types that can't leak", href: G("07-capsules.html") },
          { id: "11.6", t: "What Rust costs", href: G("00-preface.html") },
        ],
      },
    ],
  },
];

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

  const flat = useMemo(() => ACTS.flatMap((a) => a.parts), []);
  const total = flat.reduce((n, p) => n + p.chapters.length, 0);
  const interactive = flat.reduce(
    (n, p) => n + p.chapters.filter((c) => c.interactive).length,
    0,
  );

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

  let partIndex = -1;

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
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => scrollToPart(0)}
                className="cursor-pointer rounded-[9px] border-0 bg-primary px-[22px] py-[13px] text-[16px] font-medium text-primary-foreground transition-colors hover:bg-[#fb9a3f]"
                style={{ boxShadow: "0 10px 30px -10px rgba(240,134,43,.8)" }}
              >
                Start at part 1
              </button>
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
                [String(interactive), "interactive"],
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
                partIndex += 1;
                const i = partIndex;
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
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex max-w-[620px] flex-col gap-1.5">
                          <a
                            href={part.href}
                            className="text-[22px] font-normal tracking-[-0.01em] text-[#f7ece4] no-underline hover:text-[#ffd0b3]"
                          >
                            {part.title}
                          </a>
                          <span className="text-[16px] leading-[1.6] text-[#b8b0a8]">
                            {part.lead}
                          </span>
                        </div>
                        {part.tag && (
                          <span
                            className="rounded-[5px] border px-[7px] py-0.5 font-code text-[11px] text-[#cbb3a2]"
                            style={{ borderColor: "rgba(236,150,96,.2)" }}
                          >
                            {part.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        {part.chapters.map((chapter) => (
                          <a
                            key={chapter.id}
                            href={chapter.href}
                            className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-t px-2 py-2.5 text-inherit no-underline transition-colors hover:bg-[rgba(240,134,43,.08)]"
                            style={{ borderColor: "rgba(236,150,96,.08)", borderRadius: 8 }}
                          >
                            <span className="font-code text-[12.5px] text-[#8b837b]">
                              {chapter.id}
                            </span>
                            <span className="text-[15.5px] text-[#ece0d5]">{chapter.t}</span>
                            <span className="flex items-center gap-2">
                              {chapter.interactive && (
                                <span
                                  className="rounded-[5px] border px-[7px] py-0.5 font-code text-[10.5px] text-[#ffc7a6]"
                                  style={{
                                    background: "rgba(240,134,43,.14)",
                                    borderColor: "rgba(240,134,43,.3)",
                                  }}
                                >
                                  interactive
                                </span>
                              )}
                            </span>
                          </a>
                        ))}
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

          <div className="mt-16 flex flex-col gap-3.5 pl-[72px]">
            <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-primary">
              Deep dives
            </span>
            <span className="text-[15.5px] text-[#a39a91]">
              Long-form articles written against the source, each traced to the
              docs it draws from.
            </span>
            <div className="mt-2 flex flex-col">
              {articles.map((article, i) => (
                <Link
                  key={article.slug}
                  to={`/learn/${article.slug}`}
                  className="group grid gap-1 border-t py-4 text-inherit no-underline sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"
                  style={{ borderColor: "rgba(236,150,96,.10)" }}
                >
                  <span className="font-code text-[12.5px] text-[#8b837b]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-[16.5px] text-[#f7ece4] transition-colors group-hover:text-[#ffd0b3]">
                      {article.title}
                    </span>
                    <span className="text-[14.5px] leading-[1.55] text-[#a39a91]">
                      {article.description}
                    </span>
                  </span>
                  <span className="text-[13px] text-[#8b837b]">{article.readingTime}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
