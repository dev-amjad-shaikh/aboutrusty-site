import { Link } from "react-router";

/** Research & engineering — a quiet coming-soon page with the ember glow. */
export function ResearchPage() {
  return (
    <main
      className="relative flex items-center justify-center overflow-hidden px-7 py-[120px]"
      style={{ minHeight: "calc(100vh - 360px)" }}
    >
      <style>{`
        @keyframes rglow-research{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}}
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -ml-[360px] -mt-[360px] h-[720px] w-[720px] rounded-full motion-reduce:animate-none"
        style={{
          background: "radial-gradient(circle,rgba(232,116,42,.28),rgba(232,116,42,0) 65%)",
          animation: "rglow-research 8s ease-in-out infinite",
        }}
      />
      <div className="relative flex max-w-[620px] flex-col items-center gap-5 text-center">
        <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-primary">
          Research &amp; engineering
        </span>
        <h1
          className="m-0 font-light text-[#f7ece4]"
          style={{ fontSize: "clamp(44px,6vw,76px)", lineHeight: 1.02, letterSpacing: "-.035em" }}
        >
          Coming soon
        </h1>
        <p className="m-0 text-[18px] leading-[1.6] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
          Engineering posts and research notes from the team building Rusty.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href="https://github.com/dev-amjad-shaikh/rusty"
            target="_blank"
            rel="noreferrer"
            className="rounded-[9px] bg-primary px-5 py-3 text-[15.5px] font-medium text-primary-foreground no-underline transition-colors hover:bg-[#fb9a3f]"
          >
            Watch on GitHub
          </a>
          <Link
            to="/guide"
            className="rounded-[9px] border px-5 py-3 text-[15.5px] text-[#ece0d5] no-underline transition-colors hover:border-[rgba(236,150,96,.5)] hover:text-[#fff3ea]"
            style={{ borderColor: "rgba(236,150,96,.25)" }}
          >
            Read the guide
          </Link>
        </div>
      </div>
    </main>
  );
}
