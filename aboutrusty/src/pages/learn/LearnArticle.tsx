import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { getLesson, LEGACY_SLUGS } from "@/content/learn";
import { CHAPTERS, PARTS } from "@/content/learn/course";
import type { Block, Lesson } from "@/content/learn/types";
import { lessonHref, lessonKind, lessonTitle } from "@/content/lessonLinks";
import { LESSON_DIAGRAMS } from "./diagrams";
import { readDone, writeDone } from "./progress";

const GH = "https://github.com/dev-amjad-shaikh/rusty/blob/main/";
const CODE_INK = "#ffc7a6";

/** A link that uses the router for site pages and a plain anchor for the
 * book (a separate static site) and GitHub. */
function SmartLink({ href, className, style, children }: { href: string; className?: string; style?: React.CSSProperties; children: ReactNode }) {
  if (href.startsWith("/") && !href.startsWith("/guide/")) {
    return (
      <Link to={href} className={className} style={style}>
        {children}
      </Link>
    );
  }
  const external = /^https?:\/\//.test(href);
  return (
    <a href={href} className={className} style={style} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {children}
    </a>
  );
}

/** Inline `code`, **bold**, and [label](href) markers. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((seg, i) => {
        if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4)
          return (
            <strong key={i} className="font-normal text-[#f7ece4]">
              {seg.slice(2, -2)}
            </strong>
          );
        if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2)
          return (
            <code key={i} className="break-words font-code text-[0.88em]" style={{ color: CODE_INK }}>
              {seg.slice(1, -1)}
            </code>
          );
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(seg);
        if (m) return <SmartLink key={i} href={m[2]}>{m[1]}</SmartLink>;
        return seg;
      })}
    </>
  );
}

const RUST_KW =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(let|mut|async|move|await|fn|pub|match|if|else|return|struct|impl|trait|for|in|use|Some|None|Ok|Err|Self|self|const|as|where|loop|while|true|false)\b|\b(\d[\d_]*(?:\.\d+)?)\b/gm;

function highlight(code: string, lang: string): ReactNode[] {
  if (lang === "text" || lang === "json") return [code];
  const re = lang === "shell" ? /(#.*$)|('(?:[^'\\]|\\.)*')|\b(curl|cargo|cd)\b|(\$\w+)/gm : RUST_KW;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [tok, comment, str, kw, num] = m;
    const color = comment ? "#8b837b" : str ? "#9fd4a8" : kw ? "#f0862b" : num ? "#f5b774" : undefined;
    out.push(
      <span key={k++} style={{ color }}>
        {tok}
      </span>,
    );
    last = m.index + tok.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function CodeExcerpt({ file, symbol, code, lang = "rust" }: { file?: string; symbol?: string; code: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(8,5,4,.75)" }}>
      {(file || symbol) && (
        <div
          className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b px-3.5 py-2"
          style={{ borderColor: "rgba(236,150,96,.10)", background: "rgba(255,236,214,.02)" }}
        >
          {file ? (
            <a href={GH + file} target="_blank" rel="noreferrer" className="break-all font-code text-[11.5px] text-[#cbb3a2] hover:text-[#ffd0b3]">
              {file}
            </a>
          ) : (
            <span />
          )}
          {symbol && <span className="font-code text-[11.5px] text-[#6f675f]">{symbol}</span>}
        </div>
      )}
      <pre
        className="m-0 overflow-x-auto px-[18px] py-4 font-code text-[13px] leading-[1.7] text-[#ddd0c4]"
        style={{ borderLeft: "2px solid rgba(240,134,43,.5)" }}
      >
        <code>{highlight(code, lang)}</code>
      </pre>
    </div>
  );
}

const TONE: Record<string, string> = { green: "#9fd4a8", red: "#f09a80", amber: "#f5b774" };
const P = "m-0 text-[17px] leading-[1.75] text-[#cfc3b8]";

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return (
        <p className={P} style={{ textWrap: "pretty" }}>
          <Inline text={block.text} />
        </p>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={`m-0 flex flex-col gap-1.5 pl-5 text-[17px] leading-[1.6] text-[#cfc3b8] ${block.ordered ? "list-decimal" : "list-disc"} marker:text-[#f0862b]`}>
          {block.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </Tag>
      );
    }
    case "code":
      return <CodeExcerpt file={block.file} symbol={block.symbol} code={block.code} lang={block.lang} />;
    case "rows":
      return (
        <div className="flex flex-col border-t" style={{ borderColor: "rgba(236,150,96,.10)" }}>
          {block.rows.map((r) =>
            r.tone ? (
              <div
                key={r.label}
                className="grid gap-x-4 gap-y-1 border-b py-3 sm:grid-cols-[100px_minmax(0,1fr)]"
                style={{ borderColor: "rgba(236,150,96,.10)" }}
              >
                <span className="text-[16px]" style={{ color: TONE[r.tone] ?? "#f7ece4" }}>
                  {r.label}
                </span>
                <span className="text-[16px] leading-[1.6] text-[#cfc3b8]">
                  <Inline text={r.text} />
                </span>
              </div>
            ) : (
              <div key={r.label} className="border-b py-3.5 text-[16.5px] leading-[1.6] text-[#cfc3b8]" style={{ borderColor: "rgba(236,150,96,.10)" }}>
                <span className="font-normal text-[#f7ece4]">
                  <Inline text={r.label} />
                </span>{" "}
                <Inline text={r.text} />
              </div>
            ),
          )}
        </div>
      );
    case "note":
      return (
        <div className="rounded-xl border px-5 py-4" style={{ borderColor: "rgba(240,134,43,.3)", background: "rgba(240,134,43,.06)" }}>
          {block.title && <div className="mb-1 text-[15.5px] text-[#f7ece4]">{block.title}</div>}
          <div className="text-[15.5px] leading-[1.6] text-[#cfc3b8]">
            <Inline text={block.text} />
          </div>
        </div>
      );
    case "diagram": {
      const C = LESSON_DIAGRAMS[block.name];
      return C ? <C /> : null;
    }
  }
}

/** Measured height of the sticky site header, so the reading bar sits under it. */
function useHeaderHeight() {
  const [h, setH] = useState(61);
  useEffect(() => {
    const el = document.querySelector("header");
    if (!el) return;
    const update = () => setH(el.getBoundingClientRect().height);
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  return h;
}

function LessonPage({ lesson }: { lesson: Lesson }) {
  const { hash } = useLocation();
  const headerH = useHeaderHeight();
  const [read, setRead] = useState(0);
  const [sec, setSec] = useState(lesson.sections[0]?.id);
  const [quiz, setQuiz] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(() => readDone().includes(lesson.id));

  const chapter = CHAPTERS.find((c) => c.id === lesson.id)!;
  const partIndex = chapter.part - 1;
  const part = PARTS[partIndex];
  const idx = CHAPTERS.findIndex((c) => c.id === lesson.id);
  const prev = CHAPTERS[idx - 1];
  const next = CHAPTERS[idx + 1];
  const toc = [...lesson.sections.map((s) => ({ id: s.id, t: s.toc ?? s.title })), { id: "check", t: "Check yourself" }];

  // Scroll to the anchor in the URL, or to the top when the lesson changes.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [lesson.slug, hash]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setRead(Math.round(Math.max(0, Math.min(1, window.scrollY / Math.max(1, h))) * 100));
      let cur = toc[0].id;
      document.querySelectorAll<HTMLElement>("[data-sec]").forEach((el) => {
        if (el.getBoundingClientRect().top < 140) cur = el.id;
      });
      setSec(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.slug]);

  // Sections below the fold fade in as they arrive, as in the design.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "none";
            io.unobserve(el);
          }
        }),
      { threshold: 0.05 },
    );
    document.querySelectorAll<HTMLElement>("[data-sec]").forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.style.opacity = "0";
        el.style.transform = "translateY(28px)";
        el.style.transition = "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)";
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, [lesson.slug]);

  const toggleDone = () => {
    const cur = readDone();
    writeDone(done ? cur.filter((x) => x !== lesson.id) : [...new Set([...cur, lesson.id])]);
    setDone(!done);
  };

  const chapterLink = (id: string, children: ReactNode, className: string, style?: React.CSSProperties) => (
    <SmartLink key={id} href={lessonHref(id)} className={className} style={style}>
      {children}
    </SmartLink>
  );

  return (
    <>
      <div className="sticky z-40 h-0.5" style={{ top: headerH, background: "rgba(236,150,96,.08)" }}>
        <div
          className="h-0.5"
          style={{ width: `${read}%`, background: "linear-gradient(90deg,#b4501f,#f0862b)", boxShadow: "0 0 10px rgba(240,134,43,.7)" }}
        />
      </div>

      <div className="mx-auto flex max-w-[1240px] items-start gap-12 px-4 sm:px-7">
        <aside className="sticky top-[84px] hidden max-h-[calc(100vh-100px)] w-[230px] shrink-0 flex-col gap-3.5 overflow-auto pt-10 lg:flex">
          <Link to="/learn" className="text-[14px] text-[#b8b0a8] no-underline hover:text-[#fff3ea]">
            ← The guide
          </Link>
          <div className="flex flex-col gap-0.5">
            {PARTS.map((p, i) => {
              const open = i === partIndex;
              return (
                <div key={p.title} className="flex flex-col">
                  <Link
                    to={`/learn#part-${i + 1}`}
                    className="flex gap-2.5 rounded-[7px] px-2 py-[7px] text-[14px] no-underline hover:text-[#fff3ea]"
                    style={{ color: open ? "#fff3ea" : "#a39a91", background: open ? "rgba(240,134,43,.12)" : "transparent" }}
                  >
                    <span className="min-w-[18px] font-code text-[11.5px]" style={{ color: open ? "#f0862b" : "#6f675f" }}>
                      {i + 1}
                    </span>
                    {p.title}
                  </Link>
                  {open && (
                    <div className="mb-2 ml-[17px] mt-1 flex flex-col border-l" style={{ borderColor: "rgba(236,150,96,.14)" }}>
                      {p.chapters.map((c) => {
                        const on = c.id === lesson.id;
                        const kind = lessonKind(c.id);
                        return chapterLink(
                          c.id,
                          <>
                            <span className="absolute -left-px bottom-1 top-1 w-0.5" style={{ background: on ? "#f0862b" : "transparent" }} />
                            <span className="min-w-[24px] pt-px font-code text-[11px]" style={{ color: on ? "#f0862b" : "#6f675f" }}>
                              {c.id}
                            </span>
                            <span className="flex-1">{c.t}</span>
                            {kind === "book" && <span className="pt-0.5 font-code text-[9.5px] uppercase tracking-[0.08em] text-[#6f675f]">book</span>}
                          </>,
                          "relative flex gap-2 py-[5px] pl-3.5 pr-2.5 text-[13.5px] leading-[1.4] no-underline hover:text-[#fff3ea]",
                          { color: on ? "#fff3ea" : "#a39a91" },
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <article className="flex min-w-0 max-w-[700px] flex-1 flex-col gap-[30px] pb-16 pt-10">
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap gap-2 text-[13.5px] text-[#8b837b]">
              <Link to="/learn" className="text-[#b8b0a8]">
                Learn
              </Link>
              <span>/</span>
              <Link to={`/learn#part-${partIndex + 1}`} className="text-[#8b837b] hover:text-[#fff3ea]">
                Part {partIndex + 1} · {part.title}
              </Link>
              <span>/</span>
              <span className="text-[#ffd0b3]">{lesson.id}</span>
            </div>
            <h1 className="m-0 font-light text-[#f7ece4]" style={{ fontSize: "clamp(34px,4.6vw,54px)", lineHeight: 1.06, letterSpacing: "-.025em" }}>
              {lesson.id} {lesson.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-[14px] text-[#a39a91]">
              <span>{lesson.minutes} min</span>
              {lesson.interactive && (
                <>
                  <span>·</span>
                  <span
                    className="rounded-[5px] border px-[7px] py-0.5 font-code text-[11px] text-[#ffc7a6]"
                    style={{ background: "rgba(240,134,43,.14)", borderColor: "rgba(240,134,43,.3)" }}
                  >
                    interactive
                  </span>
                </>
              )}
              <span>·</span>
              <span className="min-w-0 break-all">
                Source:{" "}
                <a href={GH + lesson.source} target="_blank" rel="noreferrer" className="font-code text-[13px]">
                  {lesson.source}
                </a>
              </span>
            </div>
            {lesson.before && (
              <span className="text-[14.5px] text-[#a39a91]">
                Before this:{" "}
                {lesson.before.map((id, i) => (
                  <span key={id}>
                    {i > 0 && ", "}
                    <SmartLink href={lessonHref(id)}>
                      {id} {lessonTitle(id)}
                    </SmartLink>
                  </span>
                ))}
              </span>
            )}
          </div>

          <p className="m-0 text-[19px] leading-[1.65] text-[#d8ccc0]" style={{ textWrap: "pretty" }}>
            {lesson.summary}
          </p>

          <div
            className="grid gap-px overflow-hidden rounded-[14px] border"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
              borderColor: "rgba(236,150,96,.16)",
              background: "rgba(236,150,96,.12)",
            }}
          >
            {(
              [
                ["You'll learn", lesson.glance.learn],
                ["You'll try", lesson.glance.try],
                ["You'll read", lesson.glance.read],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1.5 px-[18px] py-4" style={{ background: "#100b09" }}>
                <span className="font-code text-[10.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">{k}</span>
                <span className="text-[15px] leading-[1.5] text-[#ece0d5]">{v}</span>
              </div>
            ))}
          </div>

          {lesson.sections.map((s) => (
            <section key={s.id} id={s.id} data-sec="1" className="flex flex-col gap-3.5" style={{ scrollMarginTop: headerH + 24 }}>
              <h2 className="m-0 text-[27px] font-normal tracking-[-0.01em] text-[#f7ece4]">{s.title}</h2>
              {s.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}
            </section>
          ))}

          <div
            className="flex flex-col gap-2.5 rounded-[14px] border px-6 py-[22px]"
            style={{ borderColor: "rgba(240,134,43,.3)", background: "linear-gradient(160deg,rgba(240,134,43,.10),rgba(200,110,44,.02))" }}
          >
            <span className="text-[17px] font-normal text-[#f7ece4]">Key takeaways</span>
            {lesson.takeaways.map((t) => (
              <span key={t} className="text-[16px] leading-[1.6] text-[#d8ccc0]">
                • <Inline text={t} />
              </span>
            ))}
          </div>

          <section id="check" data-sec="1" className="flex flex-col gap-3.5" style={{ scrollMarginTop: headerH + 24 }}>
            <h2 className="m-0 text-[27px] font-normal tracking-[-0.01em] text-[#f7ece4]">Check your understanding</h2>
            {lesson.quiz.map((q, i) => (
              <div
                key={i}
                className="flex flex-col gap-2.5 rounded-xl border px-5 py-[18px]"
                style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(255,236,214,.03)" }}
              >
                <span className="text-[16.5px] leading-[1.55] text-[#f7ece4]">
                  {i + 1}. <Inline text={q.q} />
                </span>
                {quiz[i] && (
                  <span className="text-[15.5px] leading-[1.6] text-[#9fd4a8]">
                    <Inline text={q.a} />
                  </span>
                )}
                <button
                  onClick={() => setQuiz((x) => ({ ...x, [i]: !x[i] }))}
                  className="cursor-pointer self-start border-0 bg-transparent p-0 text-[14.5px] text-[#f0862b]"
                  aria-expanded={!!quiz[i]}
                >
                  {quiz[i] ? "Hide answer" : "Show answer"}
                </button>
              </div>
            ))}
          </section>

          <div className="flex flex-col gap-3 rounded-[14px] border px-[22px] py-5" style={{ borderColor: "rgba(236,150,96,.16)" }}>
            <span className="text-[17px] font-normal text-[#f7ece4]">Source</span>
            {lesson.sources.map((s) => (
              <div key={s.path} className="flex flex-wrap gap-x-3 gap-y-0.5 text-[14.5px]">
                <a href={GH + s.path} target="_blank" rel="noreferrer" className="break-all font-code text-[13.5px]">
                  {s.path}
                </a>
                <span className="text-[#a39a91]">{s.what}</span>
              </div>
            ))}
            {lesson.related && (
              <span className="border-t pt-1.5 text-[14.5px] text-[#a39a91]" style={{ borderColor: "rgba(236,150,96,.10)" }}>
                Related:{" "}
                {lesson.related.map((r, i) => (
                  <span key={r.href}>
                    {i > 0 && " · "}
                    <SmartLink href={r.href}>{r.label}</SmartLink>
                  </span>
                ))}
              </span>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={toggleDone}
              className="cursor-pointer rounded-[9px] border px-[18px] py-[11px] text-[15px]"
              style={{
                borderColor: done ? "rgba(95,191,127,.45)" : "rgba(236,150,96,.25)",
                background: done ? "rgba(95,191,127,.08)" : "transparent",
                color: done ? "#9fd4a8" : "#ece0d5",
              }}
            >
              {done ? "✓ Marked as read" : "Mark as read"}
            </button>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
            {prev ? (
              chapterLink(
                prev.id,
                <>
                  <span className="text-[13px] text-[#8b837b]">← Previous{lessonKind(prev.id) === "book" ? " · in the book" : ""}</span>
                  <span className="text-[16px] text-[#ece0d5]">
                    {prev.id} {prev.t}
                  </span>
                </>,
                "flex flex-col gap-1 rounded-xl border px-5 py-[18px] text-inherit no-underline transition-all hover:border-[rgba(236,150,96,.45)] hover:bg-[rgba(255,236,214,.03)]",
                { borderColor: "rgba(236,150,96,.18)" },
              )
            ) : (
              <span />
            )}
            {next &&
              chapterLink(
                next.id,
                <>
                  <span className="text-[13px] text-[#cbb3a2]">{lessonKind(next.id) === "book" ? "In the book · " : ""}Next →</span>
                  <span className="text-[16px] text-[#f7ece4]">
                    {next.id} {next.t}
                  </span>
                </>,
                "flex flex-col items-end gap-1 rounded-xl border px-5 py-[18px] text-right text-inherit no-underline transition-all hover:border-[rgba(240,134,43,.6)] hover:bg-[rgba(240,134,43,.1)]",
                { borderColor: "rgba(240,134,43,.35)", background: "rgba(240,134,43,.06)" },
              )}
          </div>
        </article>

        <aside className="sticky top-[84px] hidden w-[190px] shrink-0 flex-col gap-1 pt-[120px] min-[1180px]:flex">
          <span className="px-3 pb-2 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">On this page</span>
          {toc.map((t) => {
            const on = sec === t.id;
            return (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${t.id}`);
                }}
                className="border-l-2 px-3 py-[5px] text-[13.5px] leading-[1.4] no-underline hover:text-[#fff3ea]"
                style={{ color: on ? "#fff3ea" : "#8b837b", borderColor: on ? "#f0862b" : "rgba(236,150,96,.12)" }}
              >
                {t.t}
              </a>
            );
          })}
        </aside>
      </div>
    </>
  );
}

/** /learn/:slug — a written lesson, or a redirect for an old article slug. */
export function LearnArticle() {
  const { slug } = useParams<{ slug: string }>();
  const lesson = getLesson(slug);
  const legacy = slug ? LEGACY_SLUGS[slug] : undefined;

  useEffect(() => {
    if (!lesson && legacy?.startsWith("/guide/")) window.location.replace(legacy);
  }, [lesson, legacy]);

  if (lesson) return <LessonPage key={lesson.slug} lesson={lesson} />;
  if (legacy && !legacy.startsWith("/guide/")) return <Navigate to={legacy} replace />;
  if (legacy) return null;

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-4 px-4 py-20 sm:px-7">
      <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-[#f0862b]">Learn</span>
      <h1 className="m-0 text-[36px] font-light text-[#f7ece4]">No lesson at this address</h1>
      <p className="m-0 text-[17px] text-[#cfc3b8]">
        The lessons are listed on the <Link to="/learn">Learn</Link> page, with the rest of each part in the book.
      </p>
    </div>
  );
}
