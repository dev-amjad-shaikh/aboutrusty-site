import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { DOC_GROUPS, DOC_PAGES, DOC_STUBS } from "@/content/docs";
import type { DocBlock } from "@/content/docs";

const HAIRLINE = "rgba(236,150,96,.14)";

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
          {block.text}
        </p>
      );
    case "h":
      return (
        <h2 className="mb-0 mt-[18px] text-[22px] font-normal text-[#f7ece4]">
          {block.text}
        </h2>
      );
    case "meta":
      return (
        <div
          className="rounded-[9px] border px-3.5 py-2.5 text-[15px] text-[#a39a91]"
          style={{ borderColor: HAIRLINE }}
        >
          {block.text}
        </div>
      );
    case "code":
      return <CodeCard block={block} />;
    case "list":
      return (
        <div className="flex flex-col gap-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-3 text-[16.5px] leading-[1.6] text-[#cfc3b8]">
              <span className="min-w-[18px] pt-[3px] font-code text-[13px] text-primary">
                {block.numbered ? i + 1 : "•"}
              </span>
              <span>
                <span className="font-normal text-[#f7ece4]">{item.b}</span>
                {item.t}
              </span>
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-[11px] border" style={{ borderColor: HAIRLINE }}>
          <div
            className="grid min-w-[520px]"
            style={{ gridTemplateColumns: block.cols, background: "rgba(255,236,214,.03)" }}
          >
            {block.head.map((h) => (
              <span key={h} className="px-3.5 py-2.5 text-[13.5px] font-normal text-[#cbb3a2]">
                {h}
              </span>
            ))}
          </div>
          {block.rows.map((row, i) => (
            <div
              key={i}
              className="grid min-w-[520px] border-t"
              style={{ gridTemplateColumns: block.cols, borderColor: "rgba(236,150,96,.10)" }}
            >
              {row.map((cell, k) => (
                <span
                  key={k}
                  className={`px-3.5 py-2.5 text-[14.5px] text-[#ddd0c4] ${
                    k === 0 || (block.head[1] === "Path" && k === 1) ? "font-code" : ""
                  }`}
                >
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    case "links":
      return (
        <div
          className="mt-2 flex flex-wrap gap-2.5 border-t pt-2.5"
          style={{ borderColor: "rgba(236,150,96,.10)" }}
        >
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

/**
 * Docs hub — task-oriented how-tos with a searchable grouped sidebar,
 * transcribed from the reference design's Docs page.
 */
export function DocsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("p") ?? "intro";
  const known = DOC_GROUPS.some((g) => g.items.some((i) => i.id === requested));
  const pageId = known ? requested : "intro";
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOC_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => !q || item.label.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const go = (id: string) => {
    setParams(id === "intro" ? {} : { p: id });
    window.scrollTo(0, 0);
  };

  const page = DOC_PAGES[pageId];
  const stub = DOC_STUBS[pageId];
  const groupName = DOC_GROUPS.find((g) => g.items.some((i) => i.id === pageId))?.name ?? "";
  const title = page?.title ?? DOC_GROUPS.flatMap((g) => g.items).find((i) => i.id === pageId)?.label ?? "";

  return (
    <div className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-12 px-7">
      <aside
        className="sticky top-[76px] flex max-h-[calc(100vh-90px)] min-w-[220px] flex-[0_1_250px] flex-col gap-[18px] overflow-auto py-8 max-md:static max-md:max-h-none max-md:flex-1"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs"
          className="rounded-[9px] border px-3 py-[9px] text-[14.5px] text-[#f7ece4] outline-none placeholder:text-[#8b837b]"
          style={{ background: "rgba(255,236,214,.04)", borderColor: "rgba(236,150,96,.18)" }}
        />
        {groups.map((group) => (
          <div key={group.name} className="flex flex-col gap-0.5">
            <span className="px-2.5 pb-1.5 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">
              {group.name}
            </span>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className="cursor-pointer rounded-[7px] border-0 px-2.5 py-1.5 text-left text-[14.5px] transition-colors"
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
      </aside>

      <article className="flex min-w-0 max-w-[780px] flex-[1_1_600px] flex-col gap-[18px] pb-16 pt-10">
        <span className="text-[13.5px] text-[#8b837b]">Docs / {groupName}</span>
        <h1
          className="m-0 mb-1 font-light text-[#f7ece4]"
          style={{ fontSize: "clamp(34px,4vw,46px)", lineHeight: 1.1, letterSpacing: "-.02em" }}
        >
          {title}
        </h1>
        {page
          ? page.blocks.map((block, i) => <Block key={i} block={block} go={go} />)
          : stub && (
              <>
                <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
                  This page is being written from{" "}
                  <code className="font-code text-[15px] text-[#ffc7a6]">{stub.source}</code>{" "}
                  in the rusty repository. Until it lands, the guide covers the
                  same ground in depth.
                </p>
                <a
                  href={stub.guide}
                  className="mt-3 flex flex-col gap-1 rounded-xl border px-[18px] py-4 text-inherit no-underline transition-colors"
                  style={{ borderColor: "rgba(240,134,43,.28)", background: "rgba(240,134,43,.06)" }}
                >
                  <span className="text-[13px] text-[#cbb3a2]">Read today</span>
                  <span className="text-[16px] text-[#f7ece4]">{stub.guideLabel} →</span>
                </a>
              </>
            )}
        {page?.learn && (
          <a
            href={page.learn.href}
            className="mt-3 flex flex-col gap-1 rounded-xl border px-[18px] py-4 text-inherit no-underline transition-colors hover:border-[rgba(240,134,43,.5)]"
            style={{ borderColor: "rgba(240,134,43,.28)", background: "rgba(240,134,43,.06)" }}
          >
            <span className="text-[13px] text-[#cbb3a2]">How it works</span>
            <span className="text-[16px] text-[#f7ece4]">{page.learn.label} →</span>
          </a>
        )}
      </article>
    </div>
  );
}
