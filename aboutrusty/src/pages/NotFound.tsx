import { Link } from "react-router";

/**
 * Catch-all 404 page for unmatched routes.
 */
export function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col items-start gap-5 px-7 py-24">
      <span className="font-code text-[11px] uppercase tracking-[0.16em] text-[#cbb3a2]">
        404 · off the map
      </span>
      <h1
        className="m-0 font-light text-[#f7ece4]"
        style={{
          fontSize: "clamp(34px,4.6vw,52px)",
          lineHeight: 1.05,
          letterSpacing: "-.03em",
        }}
      >
        Page not found.
      </h1>
      <p className="m-0 max-w-[440px] text-[16.5px] leading-[1.6] text-[#b8b0a8]">
        There is nothing at this address — it may have moved, or never existed.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-primary px-4 py-2.5 text-[14.5px] font-medium text-primary-foreground no-underline transition-colors hover:bg-[#fb9a3f]"
        >
          Back to Overview
        </Link>
        <Link
          to="/docs"
          className="rounded-lg border px-4 py-2.5 text-[14.5px] font-light text-[#ece0d5] no-underline transition-colors hover:border-[rgba(236,150,96,0.45)] hover:bg-[rgba(255,236,214,0.03)]"
          style={{ borderColor: "rgba(236, 150, 96, 0.22)" }}
        >
          Browse the docs
        </Link>
      </div>
    </div>
  );
}
