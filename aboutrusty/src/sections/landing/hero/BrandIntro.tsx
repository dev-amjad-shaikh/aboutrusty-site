import { BrandMark } from "@/components/layout/SiteLayout";

/**
 * Brand introduction — the first screen of the site, BEFORE the reel.
 * A pure Rusty moment: wordmark, one-line definition, scroll cue.
 * Entrance animation is a one-time staggered rise on load (CSS-only,
 * disabled under prefers-reduced-motion).
 */
export function BrandIntro() {
  return (
    <section
      aria-label="Rusty — the durable agent runtime built in Rust"
      className="relative flex min-h-[92svh] items-center justify-center"
    >
      <style>{`
        @keyframes brand-rise {
          from { opacity: 0; transform: translateY(26px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes brand-cue {
          0%, 100% { transform: scaleY(0.25); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
        }
      `}</style>

      <div className="flex flex-col items-center px-6 text-center">
        <div className="animate-[brand-rise_.7s_cubic-bezier(.22,.8,.24,1)_.05s_both] motion-reduce:animate-none">
          <BrandMark size={46} />
        </div>

        <h1 className="mt-8 animate-[brand-rise_.8s_cubic-bezier(.22,.8,.24,1)_.18s_both] font-display text-[clamp(4.5rem,13vw,10.5rem)] font-bold leading-[.9] tracking-[-0.03em] text-foreground motion-reduce:animate-none">
          rusty<span className="text-primary">.</span>
        </h1>

        <p className="mt-7 max-w-md animate-[brand-rise_.8s_cubic-bezier(.22,.8,.24,1)_.34s_both] text-lg leading-relaxed text-muted-foreground motion-reduce:animate-none">
          The durable agent runtime, built in Rust.
        </p>

        <div className="mt-9 flex animate-[brand-rise_.8s_cubic-bezier(.22,.8,.24,1)_.48s_both] items-center gap-4 font-code text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground motion-reduce:animate-none">
          <span>MIT OR Apache-2.0</span>
          <span aria-hidden="true" className="text-border">·</span>
          <span>MSRV 1.86</span>
          <span aria-hidden="true" className="text-border">·</span>
          <span>v0.x</span>
        </div>
      </div>

      {/* Scroll cue — hands off into the reel */}
      <div
        aria-hidden="true"
        className="absolute bottom-9 left-1/2 flex -translate-x-1/2 animate-[brand-rise_.8s_ease_.7s_both] flex-col items-center gap-3 motion-reduce:animate-none"
      >
        <span className="font-code text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Scroll
        </span>
        <span className="block h-10 w-px animate-[brand-cue_1.8s_ease-in-out_infinite] bg-primary/70 motion-reduce:animate-none" />
      </div>
    </section>
  );
}
