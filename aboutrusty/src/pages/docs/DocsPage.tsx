import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { DOC_GROUPS, DOC_ORDER, DOC_PAGES, REPO, docText } from "@/content/docs";
import type { DocBlock } from "@/content/docs";
import { lessonHref, lessonTitle } from "@/content/lessonLinks";
import { DocDiagram } from "@/components/diagrams/docs";

const HAIRLINE = "rgba(236,150,96,.14)";

/** Render `backticked` spans as inline code. */
function Inline({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-[5px] px-[5px] py-px font-code text-[0.86em] text-[#ffc7a6]"
            style={{ background: "rgba(255,236,214,.05)", overflowWrap: "anywhere" }}
          >
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function CodeCard({ block }: { block: Extract<DocBlock, { type: "code" }> }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(block.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };
  return (
    <div
      className="overflow-hidden rounded-[11px] border"
      style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(8,5,4,.72)" }}
    >
      <div
        className="flex items-center justify-between border-b py-[7px] pl-4 pr-3"
        style={{ borderColor: "rgba(236,150,96,.10)" }}
      >
        <span className="font-code text-[11.5px] text-[#8b837b]">{block.lang}</span>
        <button
          onClick={copy}
          className="cursor-pointer border-0 bg-transparent text-[12.5px] text-[#cbb3a2] transition-colors hover:text-[#fff3ea]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto px-4 py-3.5 font-code text-[13px] leading-[1.7] text-[#ece0d5]">
        {block.text}
      </pre>
    </div>
  );
}

function Block({ block, go }: { block: DocBlock; go: (page: string) => void }) {
  switch (block.type) {
    case "p":
      return (
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
          <Inline text={block.text} />
        </p>
      );
    case "h":
      return <h2 className="mb-0 mt-[18px] text-[22px] font-normal text-[#f7ece4]">{block.text}</h2>;
    case "meta":
      return (
        <div className="rounded-[9px] border px-3.5 py-2.5 text-[15px] text-[#a39a91]" style={{ borderColor: HAIRLINE }}>
          <Inline text={block.text} />
        </div>
      );
    case "code":
      return <CodeCard block={block} />;
    case "diagram":
      return <DocDiagram id={block.id} />;
    case "list":
      return (
        <div className="flex flex-col gap-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-3 text-[16.5px] leading-[1.6] text-[#cfc3b8]">
              <span className="min-w-[18px] pt-[3px] font-code text-[13px] text-primary">
                {block.numbered ? i + 1 : "•"}
              </span>
              <span className="min-w-0">
                <span className="font-normal text-[#f7ece4]">
                  <Inline text={item.b} />
                </span>
                <Inline text={item.t} />
              </span>
            </div>
          ))}
        </div>
      );
    case "table": {
      const monoCol = (k: number) => k === 0 || (block.head[1] === "Path" && k === 1);
      return (
        <div className="overflow-x-auto rounded-[11px] border" style={{ borderColor: HAIRLINE }}>
          <div className="grid min-w-[560px]" style={{ gridTemplateColumns: block.cols, background: "rgba(255,236,214,.03)" }}>
            {block.head.map((h) => (
              <span key={h} className="px-3.5 py-2.5 text-[13.5px] font-normal text-[#cbb3a2]">
                {h}
              </span>
            ))}
          </div>
          {block.rows.map((row, i) => (
            <div
              key={i}
              className="grid min-w-[560px] border-t"
              style={{ gridTemplateColumns: block.cols, borderColor: "rgba(236,150,96,.10)" }}
            >
              {row.map((cell, k) => (
                <span
                  key={k}
                  className={`min-w-0 px-3.5 py-2.5 text-[14.5px] text-[#ddd0c4] ${monoCol(k) ? "font-code text-[13px]" : ""}`}
                  style={{ overflowWrap: "anywhere" }}
                >
                  {monoCol(k) ? cell : <Inline text={cell} />}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    }
    case "links":
      return (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t pt-2.5" style={{ borderColor: "rgba(236,150,96,.10)" }}>
          <span className="text-[15px] text-[#a39a91]">{block.text}</span>
          {block.items.map((item) => (
            <button
              key={item.page}
              onClick={() => go(item.page)}
              className="cursor-pointer border-0 bg-transparent p-0 text-[15px] text-primary transition-colors hover:text-[#fb9a3f]"
            >
              {item.label}
            </button>
          ))}
        </div>
      );
  }
}

function LearnCard({ id }: { id: string }) {
  const href = lessonHref(id);
  const title = lessonTitle(id);
  const body: ReactNode = (
    <>
      <span className="text-[13px] text-[#cbb3a2]">How it works</span>
      <span className="text-[16px] text-[#f7ece4]">
        Learn {id}
        {title ? ` · ${title}` : ""} →
      </span>
    </>
  );
  const className =
    "flex flex-col gap-1 rounded-xl border px-[18px] py-4 text-inherit no-underline transition-colors hover:border-[rgba(240,134,43,.5)]";
  const style = { borderColor: "rgba(240,134,43,.28)", background: "rgba(240,134,43,.06)" };
  return href.startsWith("/learn") ? (
    <Link to={href} className={className} style={style}>
      {body}
    </Link>
  ) : (
    <a href={href} className={className} style={style}>
      {body}
    </a>
  );
}

function sourceUrl(path: string) {
  return `${REPO}/${path.endsWith("/") ? "tree" : "blob"}/main/${path.replace(/\/$/, "")}`;
}

/**
 * Docs hub: task-focused pages with a searchable grouped sidebar,
 * transcribed from the reference design's Docs page. Pages deep-link as
 * /docs?p=<id>.
 */
export function DocsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("p") ?? "intro";
  const pageId = DOC_PAGES[requested] ? requested : "intro";
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOC_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !q || item.label.toLowerCase().includes(q) || docText(item.id).includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const go = (id: string) => {
    setParams(id === "intro" ? {} : { p: id });
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const page = DOC_PAGES[pageId];
  const index = DOC_ORDER.findIndex((d) => d.id === pageId);
  const entry = DOC_ORDER[index];
  const prev = DOC_ORDER[index - 1];
  const next = DOC_ORDER[index + 1];
  const searching = query.trim().length > 0;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-x-12 px-7 max-md:px-4">
      <aside className="sticky top-[76px] flex max-h-[calc(100vh-90px)] min-w-[220px] flex-[0_1_250px] flex-col gap-[18px] overflow-auto py-8 max-md:static max-md:max-h-none max-md:flex-[1_1_100%] max-md:gap-3 max-md:pb-0 max-md:pt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs"
          aria-label="Search docs"
          className="rounded-[9px] border px-3 py-[9px] text-[14.5px] text-[#f7ece4] outline-none placeholder:text-[#8b837b]"
          style={{ background: "rgba(255,236,214,.04)", borderColor: "rgba(236,150,96,.18)" }}
        />
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen || searching}
          className="hidden cursor-pointer items-center justify-between rounded-[9px] border bg-transparent px-3 py-[9px] text-left text-[14.5px] text-[#cbb3a2] max-md:flex"
          style={{ borderColor: "rgba(236,150,96,.18)" }}
        >
          <span>
            {entry?.group} / <span className="text-[#f7ece4]">{entry?.label}</span>
          </span>
          <span className="font-code text-[12px]">{menuOpen || searching ? "Close" : "All pages"}</span>
        </button>
        <nav
          className={`flex flex-col gap-[18px] ${menuOpen || searching ? "" : "max-md:hidden"}`}
          aria-label="Docs pages"
        >
          {groups.map((group) => (
            <div key={group.name} className="flex flex-col gap-0.5">
              <span className="px-2.5 pb-1.5 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">
                {group.name}
              </span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  aria-current={item.id === pageId ? "page" : undefined}
                  className="cursor-pointer rounded-[7px] border-0 px-2.5 py-1.5 text-left text-[14.5px] transition-colors hover:text-[#f7ece4]"
                  style={{
                    background: item.id === pageId ? "rgba(240,134,43,.14)" : "transparent",
                    color: item.id === pageId ? "#fff3ea" : "#b8b0a8",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
          {groups.length === 0 && <span className="px-2.5 text-[14px] text-[#8b837b]">No page matches “{query}”.</span>}
        </nav>
      </aside>

      <article className="flex min-w-0 max-w-[780px] flex-[1_1_600px] flex-col gap-[18px] pb-16 pt-10 max-md:pt-6">
        <span className="text-[13.5px] text-[#8b837b]">Docs / {entry?.group}</span>
        <h1
          className="m-0 mb-1 font-light text-[#f7ece4]"
          style={{ fontSize: "clamp(34px,4vw,46px)", lineHeight: 1.1, letterSpacing: "-.02em" }}
        >
          {page.title}
        </h1>
        {page.blocks.map((block, i) => (
          <Block key={`${pageId}-${i}`} block={block} go={go} />
        ))}

        {page.learn && page.learn.length > 0 && (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {page.learn.map((id) => (
              <LearnCard key={id} id={id} />
            ))}
          </div>
        )}

        {page.source && page.source.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 text-[14px]">
            <span className="text-[#8b837b]">Source</span>
            {page.source.map((path) => (
              <a
                key={path}
                href={sourceUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="font-code text-[13px] text-[#cbb3a2] transition-colors hover:text-[#fb9a3f]"
              >
                {path}
              </a>
            ))}
          </div>
        )}

        <nav
          className="mt-6 grid grid-cols-2 gap-3 border-t pt-5"
          style={{ borderColor: "rgba(236,150,96,.10)" }}
          aria-label="Previous and next page"
        >
          {prev ? (
            <button
              onClick={() => go(prev.id)}
              className="flex cursor-pointer flex-col items-start gap-1 rounded-xl border bg-transparent px-4 py-3 text-left transition-colors hover:border-[rgba(240,134,43,.4)]"
              style={{ borderColor: HAIRLINE }}
            >
              <span className="text-[12.5px] text-[#8b837b]">← Previous</span>
              <span className="text-[15px] text-[#f7ece4]">{prev.label}</span>
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button
              onClick={() => go(next.id)}
              className="flex cursor-pointer flex-col items-end gap-1 rounded-xl border bg-transparent px-4 py-3 text-right transition-colors hover:border-[rgba(240,134,43,.4)]"
              style={{ borderColor: HAIRLINE }}
            >
              <span className="text-[12.5px] text-[#8b837b]">Next →</span>
              <span className="text-[15px] text-[#f7ece4]">{next.label}</span>
            </button>
          )}
        </nav>
      </article>
    </div>
  );
}
