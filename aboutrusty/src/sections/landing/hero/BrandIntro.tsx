import { HeroCanvas } from "./HeroCanvas";

/**
 * Brand introduction — the first screen of the site, BEFORE the reel.
 * A pure Rusty moment: wordmark, one-line definition, scroll cue.
 * Entrance animation is a one-time masked rise on load (CSS-only,
 * disabled under prefers-reduced-motion).
 */
export function BrandIntro() {
  return (
    <section
      aria-label="Rusty — the durable agent runtime built in Rust"
      className="relative flex min-h-screen flex-col items-center overflow-hidden"
    >
      <style>{`
        @keyframes rzMask {
          from { transform: translate3d(0, 108%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes rzFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rzScroll {
          0% { transform: scaleY(0); transform-origin: 50% 0%; opacity: 0; }
          12% { opacity: 1; }
          48% { transform: scaleY(1); transform-origin: 50% 0%; opacity: 1; }
          52% { transform: scaleY(1); transform-origin: 50% 100%; opacity: 1; }
          92% { transform: scaleY(0); transform-origin: 50% 100%; opacity: 0; }
          100% { transform: scaleY(0); transform-origin: 50% 100%; opacity: 0; }
        }
      `}</style>

      <HeroCanvas />

      {/* Main content — centered, flex-1 pushes the scroll cue to the bottom */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-0 pt-[30px] text-center">
        {/* Wordmark mask — clips the rzMask rise */}
        <div
          className="overflow-hidden"
          style={{ padding: "0.12em 0.14em", margin: "0 -0.14em" }}
        >
          <h1
            aria-label="rusty."
            className="flex animate-[rzMask_1300ms_cubic-bezier(.16,1,.3,1)_220ms_both] items-center justify-center font-display text-[clamp(62px,11.5vw,232px)] font-extrabold leading-[0.8] tracking-[0.02em] motion-reduce:animate-none"
            style={{ color: "#ECEEEA" }}
          >
            {/* Rust-in-a-box badge with torn edges + crumb specks */}
            <span
              aria-hidden="true"
              className="relative flex"
              style={{ width: "0.9em", height: "0.9em", marginRight: "0.09em" }}
            >
              <span
                className="flex h-full w-full items-center justify-center font-display font-extrabold"
                style={{
                  color: "#14100e",
                  background:
                    "linear-gradient(148deg, #FF8049 0%, #FE6B35 44%, #DC5628 78%, #F4763F 100%)",
                  clipPath:
                    "polygon(11% 0%, 34% 1%, 39% 5%, 52% 2%, 58% 0%, 81% 1%, 88% 7%, 100% 3%, 100% 20%, 91% 28%, 100% 35%, 99% 57%, 93% 64%, 99% 70%, 96% 87%, 87% 100%, 64% 99%, 56% 93%, 47% 100%, 37% 92%, 25% 100%, 9% 99%, 0% 88%, 1% 70%, 7% 64%, 1% 58%, 3% 39%, 0% 32%, 1% 11%)",
                }}
              >
                R
              </span>
              <span
                className="absolute"
                style={{
                  bottom: "0.23em",
                  left: "-0.085em",
                  width: "0.045em",
                  height: "0.032em",
                  background: "#FE6B35",
                  opacity: 0.75,
                  transform: "rotate(-14deg)",
                }}
              />
              <span
                className="absolute"
                style={{
                  bottom: "-0.07em",
                  left: "0.31em",
                  width: "0.038em",
                  height: "0.026em",
                  background: "#DC5628",
                  transform: "rotate(9deg)",
                }}
              />
              <span
                className="absolute"
                style={{
                  top: "-0.055em",
                  left: "0.58em",
                  width: "0.028em",
                  height: "0.028em",
                  background: "#FE6B35",
                  opacity: 0.6,
                  transform: "rotate(24deg)",
                }}
              />
            </span>

            <span aria-hidden="true">USTY</span>

            {/* Torn-edge period */}
            <span
              aria-hidden="true"
              className="self-end"
              style={{
                width: "0.12em",
                height: "0.115em",
                marginLeft: "0.06em",
                marginBottom: "0.055em",
                background: "#FE6B35",
                clipPath:
                  "polygon(15% 0%, 74% 5%, 100% 1%, 95% 43%, 100% 74%, 71% 100%, 33% 90%, 5% 99%, 0% 55%, 6% 24%)",
              }}
            />
          </h1>
        </div>

        {/* Tagline mask */}
        <div
          className="mt-[26px] overflow-hidden"
          style={{ padding: "0.2em 0 0.3em" }}
        >
          <p
            className="m-0 animate-[rzMask_1100ms_cubic-bezier(.16,1,.3,1)_460ms_both] text-[clamp(16px,1.45vw,21px)] font-normal tracking-[-0.005em] motion-reduce:animate-none"
            style={{ color: "#979d9a" }}
          >
            The durable agent runtime, built in Rust.
          </p>
        </div>
      </div>

      {/* Scroll cue — in normal flow, sits at the bottom */}
      <div
        aria-hidden="true"
        className="relative z-10 flex animate-[rzFade_1200ms_ease-out_950ms_both] flex-col items-center gap-[13px] px-6 pb-[44px] pt-0 motion-reduce:animate-none"
      >
        <span
          className="font-code text-[9px] uppercase tracking-[0.3em]"
          style={{ color: "#4f5451" }}
        >
          Scroll
        </span>
        <span
          className="block h-[34px] w-px animate-[rzScroll_2600ms_cubic-bezier(.65,0,.35,1)_infinite] motion-reduce:animate-none"
          style={{ background: "#FE6B35", opacity: 0.85 }}
        />
      </div>
    </section>
  );
}
