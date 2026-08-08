import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { RuntimeField, type RuntimeFieldHandle } from "./RuntimeField";
import { useMediaQuery } from "./use-media-query";

/* ------------------------------------------------------------------ */
/* Content — ported verbatim from the reference design                 */
/* ------------------------------------------------------------------ */

interface Chapter {
  index: string;
  rail: string;
  aria: string;
  kicker: string;
  title: ReactNode;
  body: string;
}

const CHAPTERS: Chapter[] = [
  {
    index: "00",
    rail: "Runtime",
    aria: "Runtime overview",
    kicker: "THE DURABLE AGENT RUNTIME · BUILT IN RUST",
    title: (
      <>
        Runs you can
        <br />
        <em className="not-italic text-primary">rewind.</em>
      </>
    ),
    body: "Define an agent as a graph over schema-declared JSON state. Rusty executes it in transactional super-steps and writes a versioned checkpoint at every step boundary — resume after a crash, pause for human approval, fork and replay from any point in history.",
  },
  {
    index: "01",
    rail: "Plan",
    aria: "Planning phase",
    kicker: "01 / PLAN",
    title: (
      <>
        Find the
        <br />
        ready work.
      </>
    ),
    body: "The scheduler reads the graph and the current state snapshot, then selects every node that can run in the next super-step.",
  },
  {
    index: "02",
    rail: "Parallel",
    aria: "Parallel phase",
    kicker: "02 / PARALLEL",
    title: (
      <>
        One snapshot.
        <br />
        Many nodes.
      </>
    ),
    body: "Ready nodes execute concurrently over the same immutable state. No node can observe another node halfway through the step.",
  },
  {
    index: "03",
    rail: "Barrier",
    aria: "Barrier phase",
    kicker: "03 / BARRIER",
    title: (
      <>
        Nothing merges
        <br />
        halfway.
      </>
    ),
    body: "Every branch must finish—or fail—before state moves forward. The barrier is the transaction boundary.",
  },
  {
    index: "04",
    rail: "Merge",
    aria: "Merge and route phase",
    kicker: "04 / MERGE + ROUTE",
    title: (
      <>
        Reducers make
        <br />
        the next state.
      </>
    ),
    body: "Declared reducers combine writes deterministically. The graph routes again from one coherent version of the world.",
  },
  {
    index: "05",
    rail: "Checkpoint",
    aria: "Checkpoint phase",
    kicker: "05 / CHECKPOINT",
    title: (
      <>
        Each saved boundary
        <br />
        is a way back.
      </>
    ),
    body: "With a checkpointer attached, Rusty persists versioned state after completed super-steps—so runs can survive crashes, pause for approval, fork, and replay.",
  },
];

const PHASE_COPY: [string, string, string][] = [
  ["00 / 05", "RUNTIME IDLE", "STATE CHANNELS / 12 ACTIVE"],
  ["01 / 05", "PLANNING", "READY NODES / 05 FOUND"],
  ["02 / 05", "EXECUTING", "PARALLEL BRANCHES / 03"],
  ["03 / 05", "AT BARRIER", "PENDING WRITES / 08"],
  ["04 / 05", "MERGING", "REDUCERS / 03 APPLIED"],
  ["05 / 05", "COMMITTED", "CHECKPOINT / VERSION 04"],
];

const CLONE_COMMAND = "git clone https://github.com/dev-amjad-shaikh/rusty.git";

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = (min: number, max: number, value: number) => {
  const t = clamp((value - min) / Math.max(0.0001, max - min));
  return t * t * (3 - 2 * t);
};

/* Deliberate-transition physics for the desktop reel:
   - CHAPTER_DWELL_MS: minimum time between chapter activations. Fast scroll
     deltas keep accumulating in `desired`, but chapters release one at a time.
   - CHAPTER_HYSTERESIS: eased progress must cross this far past a chapter
     boundary before the next chapter activates, so boundaries never flicker. */
const CHAPTER_DWELL_MS = 650;
const CHAPTER_HYSTERESIS = 0.07;

const primaryActionClass =
  "inline-flex min-h-12 shrink-0 items-center justify-center gap-4 whitespace-nowrap rounded-lg border border-primary bg-primary px-5 text-[13px] font-bold text-primary-foreground shadow-[0_10px_36px_rgba(255,107,53,.13)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-accent-foreground hover:shadow-[0_14px_42px_rgba(255,107,53,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/* ------------------------------------------------------------------ */
/* Copy-command chip — real clipboard copy with feedback               */
/* ------------------------------------------------------------------ */

function CopyCommandChip({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CLONE_COMMAND);
      setCopied(true);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1700);
    } catch {
      /* clipboard unavailable — leave the command visible */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy command: ${CLONE_COMMAND}`}
      className={`inline-flex min-h-12 max-w-full items-center overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-card/75 px-4 font-code text-[11px] text-muted-foreground transition-colors [scrollbar-width:none] hover:border-input hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <span className={`mr-[7px] ${copied ? "text-success" : "text-primary"}`} aria-hidden="true">
        {copied ? "✓" : "$"}
      </span>
      <span>{copied ? "copied to clipboard" : CLONE_COMMAND}</span>
      <span className="ml-3.5 text-[9px] text-muted-foreground" aria-hidden="true">
        ⌘C
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Shared chapter body                                                 */
/* ------------------------------------------------------------------ */

function ChapterActions() {
  return (
    <>
      <Link to="/playground" className={primaryActionClass}>
        Enter the Playground <span aria-hidden="true">→</span>
      </Link>
      <CopyCommandChip />
    </>
  );
}

function ExploreRuntimeButton({ reduceMotion }: { reduceMotion: boolean }) {
  const jump = () => {
    document
      .getElementById("runtime")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };
  return (
    <button type="button" onClick={jump} className={primaryActionClass}>
      Explore the runtime <span aria-hidden="true">↓</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop: sticky scroll-driven reel (lg+)                            */
/* ------------------------------------------------------------------ */

function ReelDesktop({ reduceMotion }: { reduceMotion: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<RuntimeFieldHandle | null>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const railRefs = useRef<(HTMLElement | null)[]>([]);
  const progressRef = useRef({ target: 0, smooth: 0, ready: false });
  const reelRef = useRef({
    active: 0, // last chapter actually activated (±1 per release)
    desired: 0, // where the scroll position wants to be (accumulates fast deltas)
    lastActivation: Number.NEGATIVE_INFINITY, // first release is immediate
  });
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const progress = progressRef.current;
    const reel = reelRef.current;
    let raf = 0;

    const renderFrame = (p: number) => {
      const count = CHAPTERS.length - 1;
      const rawPosition = p * count;
      // While a chapter change is pending, hold the visuals at the boundary
      // of the activated chapter — a hard flick can't run the reel past the
      // chapter the driver has actually released.
      const holdSpan = 0.5 + CHAPTER_HYSTERESIS;
      const position =
        !reduceMotion && reel.active !== reel.desired
          ? clamp(rawPosition, reel.active - holdSpan, reel.active + holdSpan)
          : rawPosition;
      fieldRef.current?.setPhase(reduceMotion ? reel.active : position);
      stickyRef.current?.style.setProperty("--reel-progress", p.toFixed(5));

      chapterRefs.current.forEach((el, index) => {
        if (!el) return;
        const distance = index - position;
        const absolute = Math.abs(distance);
        const active = index === reel.active;
        const opacity = reduceMotion
          ? active
            ? 1
            : 0
          : 1 - smoothstep(0.14, 0.98, absolute);
        const travel = Math.min(520, window.innerWidth * 0.38);
        const x = reduceMotion ? 0 : distance * travel;
        const y = reduceMotion ? 0 : Math.min(absolute, 1) * 10;
        const scale = reduceMotion ? 1 : 1 - Math.min(absolute, 1) * 0.022;
        const blur = reduceMotion ? 0 : Math.max(0, absolute - 0.14) * 2.6;

        el.style.setProperty("--chapter-opacity", opacity.toFixed(4));
        el.style.setProperty("--chapter-x", `${x.toFixed(2)}px`);
        el.style.setProperty("--chapter-y", `${y.toFixed(2)}px`);
        el.style.setProperty("--chapter-scale", scale.toFixed(4));
        el.style.setProperty("--chapter-blur", `${blur.toFixed(2)}px`);
        el.style.visibility = opacity > 0.015 ? "visible" : "hidden";
        el.style.pointerEvents = active && opacity > 0.68 ? "auto" : "none";
      });

      railRefs.current.forEach((el, index) => {
        if (!el) return;
        const fill = clamp(1 - Math.abs(index - position) * 1.35, 0.16, 1);
        el.style.transform = `scaleX(${(0.72 + fill * 0.63).toFixed(3)})`;
        el.style.background = `color-mix(in srgb, hsl(var(--primary)) ${Math.round(fill * 100)}%, hsl(var(--border)))`;
        el.style.boxShadow = `0 0 ${(fill * 10).toFixed(1)}px hsl(var(--primary) / ${(fill * 0.55).toFixed(3)})`;
      });
    };

    // Release at most one chapter per call, and only when (a) the eased
    // progress has crossed the hysteresis threshold into the next chapter's
    // zone and (b) the dwell since the last activation has elapsed. Fast
    // scroll deltas accumulate in `desired` and drain one chapter at a time.
    const stepReel = () => {
      const count = CHAPTERS.length - 1;
      const rawPosition = progress.smooth * count;
      reel.desired = clamp(Math.round(rawPosition), 0, count);
      if (reel.active === reel.desired) return;
      const direction = Math.sign(reel.desired - reel.active);
      const crossed =
        direction > 0
          ? rawPosition > reel.active + 0.5 + CHAPTER_HYSTERESIS
          : rawPosition < reel.active - 0.5 - CHAPTER_HYSTERESIS;
      const dwelled = performance.now() - reel.lastActivation >= CHAPTER_DWELL_MS;
      if (crossed && dwelled) {
        reel.active += direction; // clamped to ±1 chapter per release
        reel.lastActivation = performance.now();
        setActivePhase(reel.active);
      }
    };

    const updateFromScroll = () => {
      const start = section.offsetTop;
      const range = Math.max(1, section.offsetHeight - window.innerHeight);
      progress.target = clamp((window.scrollY - start) / range);
      if (!progress.ready || reduceMotion) {
        progress.smooth = progress.target;
        progress.ready = true;
        if (reduceMotion) {
          // Reduced-motion fallback: snap straight to the chapter, no dwell.
          const count = CHAPTERS.length - 1;
          const nearest = clamp(Math.round(progress.smooth * count), 0, count);
          reel.active = nearest;
          reel.desired = nearest;
          reel.lastActivation = performance.now();
          setActivePhase(nearest);
        }
        renderFrame(progress.smooth);
      }
    };

    const animate = () => {
      progress.smooth += (progress.target - progress.smooth) * 0.095;
      if (Math.abs(progress.target - progress.smooth) < 0.00002) progress.smooth = progress.target;
      stepReel();
      renderFrame(progress.smooth);
      raf = window.requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    updateFromScroll();
    if (!reduceMotion) raf = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
      window.cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  const jumpToPhase = (phase: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const range = section.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: section.offsetTop + range * (phase / (CHAPTERS.length - 1)),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const [phaseNumber, phaseState, phaseTelemetry] = PHASE_COPY[activePhase];

  return (
    <section
      ref={sectionRef}
      aria-label="Rusty execution model"
      className="relative h-[760svh] bg-background"
    >
      <div
        ref={stickyRef}
        className="sticky top-0 isolate h-[100svh] min-h-[680px] w-full overflow-hidden"
      >
        <RuntimeField ref={fieldRef} reduceMotion={reduceMotion} />

        {/* Faint grid, parallaxed by scroll progress */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-10 z-[1] bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[calc(.34+var(--reel-progress,0)*.1)] [mask-image:radial-gradient(circle_at_62%_45%,black_0%,rgba(0,0,0,.9)_38%,transparent_88%)] [transform:translate3d(calc(var(--reel-progress,0)*-28px),calc(var(--reel-progress,0)*-18px),0)] [will-change:transform,opacity]"
        />
        {/* Ink shade to keep chapter copy legible */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_62%_44%,transparent_0_24%,hsl(var(--background)/.08)_48%,hsl(var(--background)/.82)_96%),linear-gradient(90deg,hsl(var(--background)/.96)_0%,hsl(var(--background)/.48)_32%,transparent_62%,hsl(var(--background)/.24)_100%)]"
        />

        {/* Telemetry readouts */}
        <div className="absolute left-[max(2.5rem,calc((100vw-1200px)/2))] top-[104px] z-[4] flex gap-[18px] font-code text-[10px] font-medium tracking-[.12em] text-muted-foreground">
          <span className="flex items-center gap-[7px]">
            <i
              aria-hidden="true"
              className="inline-block h-[6px] w-[6px] rounded-full bg-success shadow-[0_0_9px_hsl(var(--success)/.42)] animate-pulse motion-reduce:animate-none"
            />
            EXECUTOR ONLINE
          </span>
          <span className="flex items-center gap-[7px]">THREAD_DEMO / RUN_7F2C</span>
        </div>
        <div className="absolute right-[max(2.5rem,calc((100vw-1200px)/2))] top-[104px] z-[4] flex gap-[18px] font-code text-[10px] font-medium tracking-[.12em] text-muted-foreground">
          <span className="flex items-center gap-[7px] text-primary">{phaseNumber}</span>
          <span className="flex items-center gap-[7px]">{phaseState}</span>
        </div>

        {/* Chapters */}
        <div aria-live="polite" className="pointer-events-none absolute inset-0 z-[3]">
          {CHAPTERS.map((chapter, index) => {
            const Heading = index === 0 ? "h1" : "h2";
            return (
              <article
                key={chapter.index}
                ref={(el) => {
                  chapterRefs.current[index] = el;
                }}
                aria-hidden={index !== activePhase}
                style={
                  {
                    "--chapter-opacity": index === 0 ? "1" : "0",
                    "--chapter-x": index === 0 ? "0px" : "72px",
                    "--chapter-y": index === 0 ? "0px" : "24px",
                    "--chapter-scale": index === 0 ? "1" : ".975",
                    "--chapter-blur": index === 0 ? "0px" : "7px",
                  } as CSSProperties
                }
                className={`absolute bottom-[105px] left-[max(2.5rem,calc((100vw-1200px)/2))] w-[min(570px,46vw)] opacity-[var(--chapter-opacity,0)] [filter:blur(var(--chapter-blur,7px))] [transform:translate3d(var(--chapter-x,72px),var(--chapter-y,24px),0)_scale(var(--chapter-scale,.975))] [transform-origin:left_bottom] [will-change:opacity,transform,filter] ${
                  index === 0 ? "visible" : "invisible"
                } ${index === 0 ? "pointer-events-auto" : "pointer-events-none"}`}
              >
                <div className="mb-[22px] font-code text-[10px] font-medium tracking-[.17em] text-muted-foreground">
                  {chapter.kicker}
                </div>
                <Heading
                  className={`m-0 font-display font-medium leading-[.86] tracking-[-.075em] text-foreground ${
                    index === 0
                      ? "text-[clamp(4rem,7.25vw,7rem)]"
                      : "text-[clamp(3.375rem,6.2vw,5.75rem)]"
                  }`}
                >
                  {chapter.title}
                </Heading>
                <p className="mt-[27px] max-w-[520px] text-[15px] leading-[1.7] text-muted-foreground">
                  {chapter.body}
                </p>
                {index === 0 && (
                  <div className="mt-[29px] flex items-center gap-2.5">
                    <ChapterActions />
                  </div>
                )}
                {index === CHAPTERS.length - 1 && (
                  <div className="mt-[30px]">
                    <ExploreRuntimeButton reduceMotion={reduceMotion} />
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Phase rail */}
        <nav
          aria-label="Execution chapters"
          className="absolute right-[max(1.875rem,calc((100vw-1320px)/2))] top-1/2 z-[5] grid -translate-y-1/2 gap-3"
        >
          {CHAPTERS.map((chapter, index) => (
            <button
              key={chapter.index}
              type="button"
              onClick={() => jumpToPhase(index)}
              aria-label={chapter.aria}
              aria-current={index === activePhase}
              className={`grid h-8 w-[150px] grid-cols-[24px_1fr_72px] items-center gap-2 text-left font-code text-[10px] font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                index === activePhase
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-right">{chapter.index}</span>
              <i
                ref={(el) => {
                  railRefs.current[index] = el;
                }}
                aria-hidden="true"
                className="block h-px origin-right bg-border [will-change:transform,background]"
              />
              <b className="font-medium tracking-[.08em]">{chapter.rail}</b>
            </button>
          ))}
        </nav>

        {/* Field note */}
        <div
          aria-hidden="true"
          className="absolute bottom-[67px] right-[max(2.5rem,calc((100vw-1200px)/2))] z-[4] flex items-center gap-3 font-code text-[10px] font-medium tracking-[.12em] text-muted-foreground"
        >
          <span>MOVE TO DISTURB</span>
          <i className="relative block h-px w-9 overflow-hidden bg-border">
            <span className="absolute h-px w-3 bg-primary shadow-[0_0_8px_rgba(255,107,53,.7)] [transform:translateX(calc(-12px+var(--reel-progress,0)*48px))]" />
          </i>
          <span>SCROLL TO EXECUTE</span>
        </div>

        {/* Footer telemetry */}
        <div className="absolute inset-x-0 bottom-0 z-[4] flex h-[39px] items-center justify-between border-t border-border bg-background/40 px-[max(2.5rem,calc((100vw-1200px)/2))] font-code text-[10px] font-medium tracking-[.1em] text-muted-foreground">
          <div
            aria-hidden="true"
            className="absolute -top-px left-0 h-px w-[calc(var(--reel-progress,0)*100%)] bg-gradient-to-r from-primary to-success shadow-[0_0_8px_rgba(255,107,53,.45)]"
          />
          <span>V0.X · ACTIVE DEVELOPMENT</span>
          <span className="text-muted-foreground">{phaseTelemetry}</span>
          <span>MSRV 1.86</span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile / tablet fallback: stacked, non-sticky layout (< lg)         */
/* ------------------------------------------------------------------ */

function ReelStacked({ reduceMotion }: { reduceMotion: boolean }) {
  const overview = CHAPTERS[0];
  const phases = CHAPTERS.slice(1);

  return (
    <section aria-label="Rusty execution model" className="bg-background">
      {/* Chapter 00 as a normal hero */}
      <div className="px-6 pb-14 pt-28">
        <div className="mb-4 font-code text-[10px] font-medium tracking-[.17em] text-muted-foreground">
          {overview.kicker}
        </div>
        <h1 className="m-0 font-display text-[clamp(3rem,13vw,4.5rem)] font-medium leading-[.9] tracking-[-.06em] text-foreground">
          {overview.title}
        </h1>
        <p className="mt-5 max-w-[520px] text-[15px] leading-[1.7] text-muted-foreground">
          {overview.body}
        </p>
        <div className="mt-7 flex flex-col items-stretch gap-2.5">
          <ChapterActions />
        </div>
      </div>

      {/* Phases 01–05 as a simple vertical list */}
      <ol className="border-t border-border">
        {phases.map((chapter) => (
          <li key={chapter.index} className="border-b border-border px-6 py-8">
            <div className="mb-3 flex items-baseline gap-3 font-code text-[10px] font-medium tracking-[.17em] text-muted-foreground">
              <span className="text-primary">{chapter.index}</span>
              <span>{chapter.kicker.split("/")[1]?.trim()}</span>
            </div>
            <h2 className="m-0 font-display text-[clamp(1.9rem,7.5vw,2.75rem)] font-medium leading-[.95] tracking-[-.05em] text-foreground">
              {chapter.title}
            </h2>
            <p className="mt-3 max-w-[520px] text-sm leading-[1.7] text-muted-foreground">
              {chapter.body}
            </p>
            {chapter.index === "05" && (
              <div className="mt-5">
                <ExploreRuntimeButton reduceMotion={reduceMotion} />
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* Telemetry row */}
      <div className="flex items-center justify-between px-6 py-3 font-code text-[10px] font-medium tracking-[.1em] text-muted-foreground">
        <span>V0.X · ACTIVE DEVELOPMENT</span>
        <span>MSRV 1.86</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

/**
 * Immersive runtime-reel hero. On lg+ it renders the sticky, scroll-driven
 * chapter reel with the canvas particle field; below lg it falls back to a
 * stacked, non-sticky layout. Honors prefers-reduced-motion throughout.
 */
export function ReelHero() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  return isDesktop ? (
    <ReelDesktop reduceMotion={reduceMotion} />
  ) : (
    <ReelStacked reduceMotion={reduceMotion} />
  );
}
