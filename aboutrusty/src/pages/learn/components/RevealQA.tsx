import { useState } from "react";
import { CHAPTERS, PARTS } from "@/content/learn/course";
import { Inline } from "./Inline";

/** Questions whose answers stay hidden until asked for. */
export function RevealQA({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <>
      {items.map((q, i) => (
        <div
          key={i}
          className="flex flex-col gap-2.5 rounded-xl border px-5 py-[18px]"
          style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(255,236,214,.03)" }}
        >
          <span className="text-[16.5px] leading-[1.55] text-[#f7ece4]">
            {i + 1}. <Inline text={q.q} />
          </span>
          {open[i] && (
            <span className="text-[15.5px] leading-[1.6] text-[#9fd4a8]">
              <Inline text={q.a} />
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((x) => ({ ...x, [i]: !x[i] }))}
            className="cursor-pointer self-start border-0 bg-transparent p-0 text-[14.5px] text-[#f0862b] hover:text-[#fb9a3f]"
            aria-expanded={!!open[i]}
          >
            {open[i] ? "Hide answer" : "Show answer"}
          </button>
        </div>
      ))}
    </>
  );
}

/** The end-of-part check for part `n` (1-based), or null when it has none. */
export function PartCheck({ n, compact = false }: { n: number; compact?: boolean }) {
  const part = PARTS[n - 1];
  const [open, setOpen] = useState(!compact);
  if (!part?.recap?.length) return null;
  const chapters = CHAPTERS.filter((c) => c.part === n);
  const intro = (
    <span className="text-[15px] leading-[1.6] text-[#a39a91]">
      Questions that span {part.title.toLowerCase()}, chapters {chapters[0].id} to {chapters[chapters.length - 1].id}.
    </span>
  );

  if (compact)
    return (
      <div className="flex flex-col gap-2.5 border-t pt-3" style={{ borderColor: "rgba(236,150,96,.10)" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-2 py-1 text-left text-[15px] text-[#ffc7a6] hover:text-[#fff3ea]"
        >
          <span>
            Part {n} check <span className="text-[#8b837b]">· {part.recap.length} questions</span>
          </span>
          <span aria-hidden="true" className="font-code text-[12px] text-[#8b837b]">
            {open ? "▴" : "▾"}
          </span>
        </button>
        {open && (
          <div className="flex flex-col gap-2.5">
            <RevealQA items={part.recap} />
          </div>
        )}
      </div>
    );

  return (
    <>
      {intro}
      <RevealQA items={part.recap} />
    </>
  );
}
