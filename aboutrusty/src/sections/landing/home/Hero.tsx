import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

const SHOTS: { label: string; src: string; caption: string }[] = [
  { label: "Home", src: "/assets/studio/01-shot.png", caption: "Recent runs, spend, and anything that needs attention." },
  { label: "Agent builder", src: "/assets/studio/02-shot.png", caption: "Goal, readiness, model, instructions, skills, and tools." },
  { label: "Connectors", src: "/assets/studio/03-shot.png", caption: "Connect a system once. Every permitted agent can use it." },
  { label: "Skills", src: "/assets/studio/04-shot.png", caption: "Reusable procedures with the tools they need." },
  { label: "Evals", src: "/assets/studio/05-shot.png", caption: "Datasets, experiments, and release gates." },
  { label: "Observability", src: "/assets/studio/06-shot.png", caption: "Runs, latency, cost, and errors across all agents." },
  { label: "Knowledge", src: "/assets/studio/07-shot.png", caption: "Sources your agents retrieve from, with sync status." },
];

const INSTALL_CMDS = [
  { label: "Rust", cmd: "cargo add rusty-agent-runtime" },
  { label: "TS", cmd: "npm install @rusty-runtime/client" },
  { label: "Python", cmd: "pip install rusty-agent-runtime" },
];

interface Slot {
  tf: string;
  filter: string;
  op: number;
  z: number;
}

const SLOTS: Record<number, Slot> = {
  0: { tf: "translate3d(0,0,0) rotateY(-26deg) rotateX(6deg)", filter: "none", op: 1, z: 5 },
  1: { tf: "translate3d(38vw,-30px,-520px) rotateY(-34deg) rotateX(6deg)", filter: "blur(5px) brightness(.55)", op: 0.85, z: 4 },
  2: { tf: "translate3d(62vw,-50px,-1100px) rotateY(-40deg)", filter: "blur(9px) brightness(.35)", op: 0.5, z: 3 },
  [-1]: { tf: "translate3d(-700px,60px,300px) rotateY(-10deg) rotateX(4deg)", filter: "blur(14px) brightness(.4)", op: 0, z: 6 },
};

const FAR_SLOT: Slot = {
  tf: "translate3d(1100px,-60px,-1500px) rotateY(-40deg)",
  filter: "blur(10px) brightness(.3)",
  op: 0,
  z: 1,
};

const TICKS_PER_SHOT = 50; // 50 × 100ms = 5s per panel

/**
 * Home hero — release pill, light-weight headline, install tabs with copy,
 * and the 3D drifting carousel of real Studio screenshots.
 */
export function Hero() {
  const [hero, setHero] = useState(0);
  const [heroT, setHeroT] = useState(0);
  const [play, setPlay] = useState(true);
  const [install, setInstall] = useState(0);
  const [copied, setCopied] = useState(false);
  const reduced = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (reduced.current) return;
    const tick = setInterval(() => {
      if (!play) return;
      setHeroT((t) => {
        if (t + 1 >= TICKS_PER_SHOT) {
          setHero((h) => (h + 1) % SHOTS.length);
          return 0;
        }
        return t + 1;
      });
    }, 100);
    return () => clearInterval(tick);
  }, [play]);

  const n = SHOTS.length;
  const panels = SHOTS.map((shot, i) => {
    let d = (i - hero + n) % n;
    if (d === n - 1) d = -1;
    const slot = SLOTS[d] ?? FAR_SLOT;
    return { ...shot, ...slot };
  });

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMDS[install].cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const current = SHOTS[hero];

  return (
    <section
      aria-label="Rusty — build AI agents that don't lose their work"
      className="relative overflow-hidden border-b"
      style={{ minHeight: 820, borderColor: "rgba(236,150,96,.10)" }}
    >
      <style>{`
        @keyframes rdrift{0%,100%{transform:rotateX(4deg) rotateY(-6deg) translateY(0)}50%{transform:rotateX(7deg) rotateY(-2deg) translateY(-10px)}}
        @keyframes rglow{0%,100%{opacity:.55}50%{opacity:.9}}
      `}</style>

      {/* warm glow field */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(45% 55% at 72% 48%,rgba(232,116,42,.22),rgba(232,116,42,0) 70%),radial-gradient(30% 40% at 12% 10%,rgba(150,70,34,.18),rgba(0,0,0,0) 70%)",
          animation: "rglow 9s ease-in-out infinite",
        }}
      />

      {/* copy */}
      <div className="relative z-[2] mx-auto flex max-w-[1240px] flex-col gap-[22px] px-7 pt-[88px]">
        <Link
          to="/releases"
          className="flex items-center gap-2.5 self-start rounded-full border py-[5px] pl-[5px] pr-3.5 text-[14px] text-[#ffd0b3] no-underline backdrop-blur-[10px] transition-colors hover:text-[#ffe2cb]"
          style={{ borderColor: "rgba(240,134,43,.3)", background: "rgba(20,12,9,.7)" }}
        >
          <span className="rounded-full bg-primary px-[9px] py-0.5 font-code text-[11.5px] font-medium text-primary-foreground">
            R0.12
          </span>
          Operations Plane is out. Read the release notes →
        </Link>
        <h1
          className="m-0 max-w-[640px] font-light text-[#f7ece4]"
          style={{
            fontSize: "clamp(44px,5.8vw,78px)",
            lineHeight: 1.02,
            letterSpacing: "-.035em",
            textWrap: "balance",
          }}
        >
          Build AI agents that don't lose their work.
        </h1>
        <p
          className="m-0 max-w-[520px] text-[19px] leading-[1.6] text-[#d8ccc0]"
          style={{ textWrap: "pretty" }}
        >
          Rusty is an open-source runtime and server for AI agents, written in
          Rust. It saves an agent's state after every step, so a run can
          survive a crash, pause for a person's approval, and be replayed
          exactly. You deploy it as a single binary.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/guide/15-quickstart.html"
            className="rounded-[9px] bg-primary px-[22px] py-[13px] text-[16px] font-medium text-primary-foreground no-underline transition-colors hover:bg-[#fb9a3f]"
            style={{ boxShadow: "0 10px 30px -10px rgba(240,134,43,.8)" }}
          >
            Get started
          </a>
          <Link
            to="/learn"
            className="rounded-[9px] border px-[22px] py-[13px] text-[16px] text-[#ece0d5] no-underline backdrop-blur-[10px] transition-colors hover:border-[rgba(236,150,96,.5)] hover:text-[#fff3ea]"
            style={{ borderColor: "rgba(236,150,96,.25)", background: "rgba(20,12,9,.6)" }}
          >
            Learn how it works
          </Link>
        </div>
        <div
          className="flex max-w-[520px] flex-wrap items-center gap-2.5 rounded-xl border p-1.5 backdrop-blur-[10px]"
          style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(12,8,7,.75)" }}
        >
          <div className="flex gap-0.5">
            {INSTALL_CMDS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => {
                  setInstall(i);
                  setCopied(false);
                }}
                className="cursor-pointer rounded-[7px] border-0 px-2.5 py-1.5 text-[12.5px]"
                style={{
                  background: i === install ? "rgba(240,134,43,.2)" : "transparent",
                  color: i === install ? "#ffe2cb" : "#a39a91",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-code text-[13.5px] text-[#f7ece4]">
            {INSTALL_CMDS[install].cmd}
          </code>
          <button
            onClick={copyInstall}
            className="cursor-pointer rounded-md border bg-transparent px-2.5 py-[5px] text-[12.5px] text-[#cbb3a2] transition-colors hover:text-[#fff3ea]"
            style={{ borderColor: "rgba(236,150,96,.22)" }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* 3D panel carousel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-40px] left-[44%] right-[-20%] top-[30px] z-[1] max-lg:hidden"
        style={{ perspective: 2000, perspectiveOrigin: "20% 40%" }}
      >
        <div
          className="absolute inset-0 motion-reduce:animate-none"
          style={{
            transformStyle: "preserve-3d",
            animation: "rdrift 14s ease-in-out infinite",
          }}
        >
          {panels.map((panel) => (
            <div
              key={panel.label}
              className="absolute left-0 top-[70px] aspect-[1440/900] w-[min(1000px,80vw)] overflow-hidden rounded-[18px] border bg-[#0d0a09]"
              style={{
                borderColor: "rgba(255,236,214,.14)",
                boxShadow:
                  "0 60px 120px -30px rgba(0,0,0,.95),0 0 0 1px rgba(0,0,0,.4)",
                transform: panel.tf,
                filter: panel.filter,
                opacity: panel.op,
                zIndex: panel.z,
                transition:
                  "transform 1.9s cubic-bezier(.65,0,.2,1),filter 1.9s ease,opacity 1.4s ease",
              }}
            >
              <img
                src={panel.src}
                alt=""
                className="block h-full w-full object-cover object-left-top"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(100deg,rgba(0,0,0,0) 40%,rgba(7,5,6,.55) 100%)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* fades that seat the carousel into the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-[1] w-[52%] max-lg:hidden"
        style={{ background: "linear-gradient(90deg,#0d0a09 55%,rgba(13,10,9,0))" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[220px]"
        style={{ background: "linear-gradient(180deg,rgba(13,10,9,0),#0d0a09)" }}
      />

      {/* carousel controls */}
      <div className="absolute inset-x-0 bottom-9 z-[3] max-lg:hidden">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-7">
          <button
            onClick={() => setPlay((p) => !p)}
            aria-label={play ? "Pause" : "Play"}
            className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border text-[14px] text-[#f7ece4] backdrop-blur-[12px] transition-colors hover:border-[rgba(240,134,43,.6)]"
            style={{ borderColor: "rgba(255,236,214,.2)", background: "rgba(20,14,11,.75)" }}
          >
            {play ? "❚❚" : "▶"}
          </button>
          <div className="flex min-w-[220px] flex-col gap-[3px]">
            <span className="text-[16px] text-[#f7ece4]">{current.label}</span>
            <span className="text-[14px] text-[#a39a91]">{current.caption}</span>
          </div>
          <div className="ml-auto flex gap-1.5">
            {SHOTS.map((shot, i) => (
              <button
                key={shot.label}
                onClick={() => {
                  setHero(i);
                  setHeroT(0);
                }}
                aria-label={shot.label}
                className="h-[6px] cursor-pointer overflow-hidden rounded-[3px] border-0 p-0"
                style={{
                  width: i === hero ? 34 : 14,
                  background: "rgba(255,236,214,.16)",
                  transition: "width .4s",
                }}
              >
                <span
                  className="block h-full bg-primary"
                  style={{
                    width:
                      i === hero
                        ? `${(heroT / TICKS_PER_SHOT) * 100}%`
                        : i < hero
                          ? "100%"
                          : "0%",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
