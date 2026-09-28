import type { Release } from "@/content/releases";

/** Anchor id for a release entry on the Releases page. */
export const releaseAnchor = (tag: string) => `release-${tag.replace(/\./g, "-")}`;

/**
 * Overview strip for the Releases page: one column per release date, oldest
 * on the left, each release a chip that jumps to its entry.
 */
export function ReleaseTimeline({ releases }: { releases: Release[] }) {
  const groups: { date: string; items: Release[] }[] = [];
  [...releases].reverse().forEach((r) => {
    const date = r.date || "On main";
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(r);
    else groups.push({ date, items: [r] });
  });

  return (
    <nav aria-label="Release timeline" className="relative">
      <div className="flex items-end">
        {groups.map((g) => (
          <div key={g.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            {g.items.map((r) => {
              const main = r.tag === "main";
              return (
                <a
                  key={r.tag}
                  href={`#${releaseAnchor(r.tag)}`}
                  title={`${r.name} · ${r.version}`}
                  className="rounded-[6px] border px-1.5 py-[3px] font-code text-[10.5px] leading-none no-underline transition-colors hover:border-[rgba(240,134,43,.7)] hover:text-[#fff3ea] sm:px-2 sm:text-[12px]"
                  style={{
                    color: main ? "#f5b774" : "#f0862b",
                    borderColor: main ? "rgba(245,183,116,.35)" : "rgba(240,134,43,.3)",
                    background: main ? "transparent" : "rgba(240,134,43,.07)",
                  }}
                >
                  {r.tag}
                </a>
              );
            })}
          </div>
        ))}
      </div>
      <div className="relative mt-3 flex">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-[5px] h-px"
          style={{ background: "linear-gradient(90deg,rgba(236,150,96,.15),rgba(240,134,43,.55) 85%,rgba(245,183,116,.5))" }}
        />
        {groups.map((g) => {
          const main = g.date === "On main";
          return (
            <div key={g.date} className="relative flex min-w-0 flex-1 flex-col items-center gap-2">
              <span
                aria-hidden="true"
                className={main ? "rd-tl-pulse h-[11px] w-[11px] rounded-full border" : "h-[11px] w-[11px] rounded-full"}
                style={main ? { borderColor: "#f5b774", background: "#070506" } : { background: "#f0862b", boxShadow: "0 0 10px rgba(240,134,43,.45)" }}
              />
              <span className="whitespace-nowrap text-[11px] text-[#8b837b] sm:text-[12.5px]">
                {g.date.replace(", 2026", "")}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`.rd-tl-pulse{animation:rd-tl 2.4s ease-in-out infinite}@keyframes rd-tl{0%,100%{box-shadow:0 0 0 0 rgba(245,183,116,.0)}50%{box-shadow:0 0 0 5px rgba(245,183,116,.18)}}@media (prefers-reduced-motion: reduce){.rd-tl-pulse{animation:none}}`}</style>
    </nav>
  );
}
