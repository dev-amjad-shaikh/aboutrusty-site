import { lessonHref, lessonKind, lessonTitle } from "@/content/lessonLinks";
import { isChapterRead } from "../progress";
import { SmartLink } from "./Inline";

/** "You'll need": the chapters to read first, with this browser's read state. */
export function Prereqs({ ids, done }: { ids: string[]; done: string[] }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(255,236,214,.02)" }}>
      <span className="pb-1 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">You'll need</span>
      {ids.map((id) => {
        const kind = lessonKind(id);
        const read = isChapterRead(id, done);
        return (
          <SmartLink
            key={id}
            href={lessonHref(id)}
            className="-mx-2 grid grid-cols-[36px_minmax(0,1fr)_auto] items-baseline gap-2 rounded-lg px-2 py-1.5 text-inherit no-underline transition-colors hover:bg-[rgba(240,134,43,.08)]"
          >
            <span className="font-code text-[12px] text-[#8b837b]">{id}</span>
            <span className="text-[15px] text-[#ece0d5]">{lessonTitle(id) ?? "Unknown chapter"}</span>
            <span className="font-code text-[11px]" style={{ color: read ? "#9fd4a8" : "#8b837b" }}>
              {read ? "✓ read" : kind === "book" ? "book ↗" : "not read"}
            </span>
          </SmartLink>
        );
      })}
    </div>
  );
}
