import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { BOOK_CHAPTERS, BOOK_PARTS, loadChapter, type RenderedChapter } from "@/content/book";
import { CHAPTERS } from "@/content/learn/course";
import { lessonHref } from "@/content/lessonLinks";

/** Mermaid in the site's palette, loaded only when a chapter has a diagram. */
async function renderMermaid(root: HTMLElement) {
  const nodes = [...root.querySelectorAll<HTMLElement>(".bk-mermaid:not([data-done])")];
  if (!nodes.length) return;
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: "IBM Plex Mono, ui-monospace, monospace",
    themeVariables: {
      darkMode: true,
      background: "#0d0a09",
      fontSize: "13px",
      primaryColor: "#1f140e",
      primaryTextColor: "#f7ece4",
      primaryBorderColor: "#b4501f",
      secondaryColor: "#170f0b",
      secondaryTextColor: "#ece0d5",
      secondaryBorderColor: "#6b3a1e",
      tertiaryColor: "#120c09",
      tertiaryTextColor: "#ece0d5",
      tertiaryBorderColor: "#4a2c1c",
      lineColor: "#c8793f",
      textColor: "#ece0d5",
      mainBkg: "#1f140e",
      nodeBorder: "#b4501f",
      clusterBkg: "#120c09",
      clusterBorder: "#4a2c1c",
      titleColor: "#f7ece4",
      edgeLabelBackground: "#0d0a09",
      actorBkg: "#1f140e",
      actorBorder: "#f0862b",
      actorTextColor: "#f7ece4",
      actorLineColor: "#6b4a38",
      signalColor: "#cbb3a2",
      signalTextColor: "#ece0d5",
      labelBoxBkgColor: "#1f140e",
      labelBoxBorderColor: "#b4501f",
      labelTextColor: "#f7ece4",
      loopTextColor: "#cbb3a2",
      noteBkgColor: "#2a1a10",
      noteTextColor: "#f7ece4",
      noteBorderColor: "#b4501f",
      activationBkgColor: "#3a2415",
      activationBorderColor: "#f0862b",
      sequenceNumberColor: "#2a1000",
    },
  });
  for (const [i, el] of nodes.entries()) {
    el.dataset.done = "1";
    try {
      const { svg } = await mermaid.render(`bk-m-${Date.now()}-${i}`, el.dataset.src ?? "");
      el.innerHTML = svg;
    } catch {
      el.innerHTML = `<pre class="bk-mermaid-fallback">${el.dataset.src ?? ""}</pre>`;
    }
  }
}

function useHeaderHeight() {
  const [h, setH] = useState(61);
  useEffect(() => {
    const el = document.querySelector("header");
    if (!el) return;
    const update = () => setH(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return h;
}

function Sidebar({ current }: { current?: string }) {
  return (
    <aside className="sticky top-[84px] hidden max-h-[calc(100vh-100px)] w-[240px] shrink-0 flex-col gap-4 overflow-auto pb-10 pt-10 lg:flex">
      <Link to="/learn" className="text-[14px] text-[#b8b0a8] no-underline hover:text-[#fff3ea]">
        ← Learn
      </Link>
      <Link to="/guide" className="text-[15px] font-normal text-[#f7ece4] no-underline">
        Inside Rusty
      </Link>
      {BOOK_PARTS.map((p) => (
        <div key={p.title} className="flex flex-col">
          <span className="pb-1.5 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#8b837b]">{p.title}</span>
          <div className="flex flex-col border-l" style={{ borderColor: "rgba(236,150,96,.14)" }}>
            {p.chapters.map((c) => {
              const on = c.file === current;
              return (
                <Link
                  key={c.file}
                  to={`/guide/${c.file}.html`}
                  className="relative flex gap-2 py-[5px] pl-3.5 pr-2 text-[13.5px] leading-[1.4] no-underline hover:text-[#fff3ea]"
                  style={{ color: on ? "#fff3ea" : "#a39a91" }}
                >
                  <span className="absolute -left-px bottom-1 top-1 w-0.5" style={{ background: on ? "#f0862b" : "transparent" }} />
                  <span className="min-w-[20px] pt-px font-code text-[11px]" style={{ color: on ? "#f0862b" : "#6f675f" }}>
                    {c.n}
                  </span>
                  <span className="flex-1">{c.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

function BookIndex() {
  useEffect(() => window.scrollTo({ top: 0, behavior: "instant" }), []);
  return (
    <div className="mx-auto flex max-w-[1240px] items-start gap-12 px-4 sm:px-7">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-10 pb-24 pt-14">
        <div className="flex max-w-[680px] flex-col gap-4">
          <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-[#f0862b]">The book</span>
          <h1 className="m-0 text-[clamp(40px,5vw,60px)] font-light leading-[1.05] tracking-[-0.03em] text-[#f7ece4]">
            Inside Rusty
          </h1>
          <p className="m-0 text-[18px] leading-[1.65] text-[#cfc3b8]">
            The long-form companion to the lessons. Concepts first, then the code, with every mechanism tied to the file that
            implements it. Chapters in the Learn course that don't have a lesson yet link here.
          </p>
        </div>
        {BOOK_PARTS.map((p) => (
          <div key={p.title} className="flex flex-col gap-3">
            <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-[#cbb3a2]">{p.title}</span>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,260px),1fr))" }}>
              {p.chapters.map((c) => (
                <Link
                  key={c.file}
                  to={`/guide/${c.file}.html`}
                  className="flex items-baseline gap-3 rounded-xl border px-4 py-3.5 text-[#e6d9cd] no-underline transition-colors hover:border-[rgba(240,134,43,.45)] hover:text-[#fff3ea]"
                  style={{ borderColor: "rgba(236,150,96,.14)", background: "rgba(255,236,214,.02)" }}
                >
                  <span className="font-code text-[12px] text-[#f0862b]">{c.n}</span>
                  <span className="text-[15.5px] leading-[1.4]">{c.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookChapterView({ file }: { file: string }) {
  const [doc, setDoc] = useState<RenderedChapter | null | undefined>(undefined);
  const [read, setRead] = useState(0);
  const [sec, setSec] = useState<string>();
  const body = useRef<HTMLDivElement>(null);
  const { hash } = useLocation();
  const navigate = useNavigate();
  const headerH = useHeaderHeight();

  const idx = BOOK_CHAPTERS.findIndex((c) => c.file === file);
  const meta = BOOK_CHAPTERS[idx];
  const prev = BOOK_CHAPTERS[idx - 1];
  const next = BOOK_CHAPTERS[idx + 1];
  const covers = CHAPTERS.filter((c) => c.book?.split("#")[0] === `${file}.html`);

  useEffect(() => {
    let live = true;
    setDoc(undefined);
    loadChapter(file).then((d) => live && setDoc(d));
    return () => {
      live = false;
    };
  }, [file]);

  // After render: draw diagrams, then land on the URL's anchor.
  useEffect(() => {
    if (!doc || !body.current) return;
    const land = () => {
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
      return !!target;
    };
    if (!land()) window.scrollTo({ top: 0, behavior: "instant" });
    // Diagrams above the anchor change the layout once drawn; land again.
    renderMermaid(body.current).then(() => {
      if (hash) land();
    });
  }, [doc, hash]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setRead(Math.round(Math.max(0, Math.min(1, window.scrollY / Math.max(1, h))) * 100));
      let cur: string | undefined;
      document.querySelectorAll<HTMLElement>(".book-prose h2[id]").forEach((el) => {
        if (el.getBoundingClientRect().top < 140) cur = el.id;
      });
      setSec(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [doc]);

  // Links inside the chapter body stay in the app.
  const onBodyClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
    const href = a.getAttribute("href") ?? "";
    if (href.startsWith("/")) {
      e.preventDefault();
      navigate(href);
    }
  };

  if (!meta || doc === null)
    return (
      <div className="mx-auto max-w-[640px] px-7 py-32 text-center text-[17px] text-[#cfc3b8]">
        That chapter doesn't exist. <Link to="/guide">See all chapters</Link>.
      </div>
    );

  return (
    <>
      <div className="sticky z-40 h-0.5" style={{ top: headerH, background: "rgba(236,150,96,.08)" }}>
        <div className="h-0.5" style={{ width: `${read}%`, background: "linear-gradient(90deg,#b4501f,#f0862b)", boxShadow: "0 0 10px rgba(240,134,43,.7)" }} />
      </div>
      <div className="mx-auto flex max-w-[1240px] items-start gap-12 px-4 sm:px-7">
        <Sidebar current={file} />

        <article className="flex min-w-0 max-w-[760px] flex-1 flex-col gap-6 pb-20 pt-10">
          <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-[#8b837b]">
            <Link to="/learn" className="text-[#a39a91] no-underline hover:text-[#fff3ea]">
              Learn
            </Link>
            <span>/</span>
            <Link to="/guide" className="text-[#a39a91] no-underline hover:text-[#fff3ea]">
              Inside Rusty
            </Link>
            <span>/</span>
            <span className="text-[#cbb3a2]">{meta.n}</span>
          </div>

          <div className="flex flex-col gap-3">
            {doc?.eyebrow && <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-[#f0862b]">{doc.eyebrow}</span>}
            <h1 className="m-0 text-[clamp(34px,4.4vw,52px)] font-light leading-[1.08] tracking-[-0.03em] text-[#f7ece4]">
              {doc?.title || meta.title}
            </h1>
          </div>

          {covers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(240,134,43,.25)", background: "rgba(240,134,43,.05)" }}>
              <span className="text-[14px] text-[#cbb3a2]">Covers Learn</span>
              {covers.map((c) => (
                <Link
                  key={c.id}
                  to={lessonHref(c.id)}
                  className="rounded-md border px-2 py-[2px] text-[13px] no-underline"
                  style={{ borderColor: "rgba(240,134,43,.3)", color: "#ffd0b3" }}
                  title={c.t}
                >
                  <span className="font-code text-[11.5px] text-[#f0862b]">{c.id}</span> {c.t}
                </Link>
              ))}
            </div>
          )}

          {doc === undefined ? (
            <div className="flex flex-col gap-3 pt-4">
              {[90, 100, 76, 95, 60].map((w, i) => (
                <div key={i} className="h-4 animate-pulse rounded" style={{ width: `${w}%`, background: "rgba(255,236,214,.05)" }} />
              ))}
            </div>
          ) : (
            <div ref={body} className="book-prose" onClick={onBodyClick} dangerouslySetInnerHTML={{ __html: doc.html }} />
          )}

          <div className="grid gap-3 border-t pt-8" style={{ borderColor: "rgba(236,150,96,.12)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
            {prev ? (
              <Link to={`/guide/${prev.file}.html`} className="flex flex-col gap-1 rounded-xl border px-4 py-3.5 no-underline hover:border-[rgba(240,134,43,.45)]" style={{ borderColor: "rgba(236,150,96,.16)" }}>
                <span className="text-[12.5px] text-[#8b837b]">← Previous</span>
                <span className="text-[15.5px] text-[#f7ece4]">
                  <span className="font-code text-[12px] text-[#f0862b]">{prev.n}</span> {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/guide/${next.file}.html`} className="flex flex-col items-end gap-1 rounded-xl border px-4 py-3.5 text-right no-underline hover:border-[rgba(240,134,43,.45)]" style={{ borderColor: "rgba(236,150,96,.16)" }}>
                <span className="text-[12.5px] text-[#8b837b]">Next →</span>
                <span className="text-[15.5px] text-[#f7ece4]">
                  <span className="font-code text-[12px] text-[#f0862b]">{next.n}</span> {next.title}
                </span>
              </Link>
            )}
          </div>
        </article>

        {doc && doc.toc.length > 1 && (
          <nav className="sticky top-[100px] hidden w-[200px] shrink-0 flex-col gap-1 pt-12 xl:flex" aria-label="On this page">
            <span className="pb-2 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#8b837b]">On this page</span>
            {doc.toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${t.id}`);
                }}
                className="border-l py-1 pl-3 text-[13px] leading-[1.35] no-underline"
                style={{ borderColor: sec === t.id ? "#f0862b" : "rgba(236,150,96,.14)", color: sec === t.id ? "#fff3ea" : "#a39a91" }}
              >
                {t.t}
              </a>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}

/** /guide and /guide/<file>.html — the book, inside the site. */
export function BookPage() {
  const { file } = useParams();
  if (!file || /^index(\.html)?$/.test(file)) return <BookIndex />;
  return <BookChapterView file={file.replace(/\.html$/, "")} />;
}
