import { HeroCanvas } from "./HeroCanvas";

/**
 * Rust-in-a-box badge scaled to the hero wordmark's cap height.
 * Em-based so it tracks the clamp() font size exactly.
 */
function HeroBadge() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-[0.78em] w-[0.78em] shrink-0 self-center rounded-[0.13em] bg-primary p-[0.09em] fill-primary-foreground"
    >
      <path d="M7 6h11.5C23.7 6 27 9.1 27 13.7c0 3.2-1.6 5.6-4.2 6.8L27 27h-7l-3.1-5.4H13V27H7V6Zm6 5v5.6h4.8c2 0 3.1-1 3.1-2.8 0-1.8-1.1-2.8-3.1-2.8H13Z" />
    </svg>
  );
}

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

      <HeroCanvas />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <h1
          aria-label="rusty."
          className="flex animate-[brand-rise_.8s_cubic-bezier(.22,.8,.24,1)_.12s_both] items-center justify-center gap-[0.07em] font-display text-[clamp(4.5rem,13vw,10.5rem)] font-bold leading-[.9] tracking-[-0.03em] text-foreground motion-reduce:animate-none"
        >
          <HeroBadge />
          <span aria-hidden="true">
            USTY<span className="text-primary">.</span>
          </span>
        </h1>

        <p className="mt-8 max-w-md animate-[brand-rise_.8s_cubic-bezier(.22,.8,.24,1)_.3s_both] text-lg leading-relaxed text-muted-foreground motion-reduce:animate-none">
          The durable agent runtime, built in Rust.
        </p>
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
