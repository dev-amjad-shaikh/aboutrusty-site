import { useEffect, useRef, useState } from "react";
import { Kicker, Reveal, SectionTitle } from "./primitives";

const LAYERS: { name: string; pkg: string; desc: string }[] = [
  {
    name: "Clients",
    pkg: "npm · PyPI",
    desc: "Python and TypeScript clients with no dependencies.",
  },
  {
    name: "Studio",
    pkg: "studio/",
    desc: "Web workspace to build agents, connect your systems, and see what every run did.",
  },
  {
    name: "Eval",
    pkg: "rusty-eval",
    desc: "Test datasets, experiments, and release gates so changes are checked before they ship.",
  },
  {
    name: "Server",
    pkg: "rusty-agent-server",
    desc: "HTTP and streaming API in one binary: threads, runs, assistants, scheduled jobs, multi-tenant API keys.",
  },
  {
    name: "Runtime",
    pkg: "rusty-agent-runtime",
    desc: "The graph engine. Runs agents, saves checkpoints, handles pauses, forks, and replays.",
  },
];

/** 05 · Platform — the isometric stack of layers, auto-cycling, hover to pin. */
export function PlatformStack() {
  const [layer, setLayer] = useState(0);
  const holdRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!holdRef.current) setLayer((l) => (l + 1) % LAYERS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const current = LAYERS[layer];

  return (
    <Reveal
      className="grid items-center gap-14 border-t py-[90px]"
      style={{
        borderColor: "rgba(236,150,96,.10)",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
      }}
    >
      <div className="flex flex-col gap-[18px]">
        <Kicker>05 · Platform</Kicker>
        <SectionTitle>Everything you need to run agents</SectionTitle>
        <div className="flex min-h-[150px] flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[24px] font-light text-[#f7ece4]">
              {current.name}
            </span>
            <code
              className="rounded-md border bg-[rgba(240,134,43,.12)] px-2 py-[3px] font-code text-[12.5px] text-[#ffc7a6]"
              style={{ borderColor: "rgba(240,134,43,.28)" }}
            >
              {current.pkg}
            </code>
          </div>
          <p className="m-0 text-[17px] leading-[1.65] text-[#cfc3b8]">
            {current.desc}
          </p>
        </div>
        <span className="text-[15px] text-[#a39a91]">
          Also: <code className="font-code text-[13px] text-[#ffc7a6]">rusty-worker</code>{" "}
          to run steps on remote services,{" "}
          <code className="font-code text-[13px] text-[#ffc7a6]">rusty-otel</code>{" "}
          for OpenTelemetry tracing.
        </span>
      </div>
      <div className="flex justify-center overflow-hidden py-5" style={{ perspective: 1400 }}>
        <div
          className="relative h-[430px] w-[min(100%,460px)]"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(52deg) rotateZ(-32deg)",
          }}
        >
          {LAYERS.map((l, i) => {
            const on = i === layer;
            return (
              <button
                key={l.name}
                onMouseEnter={() => {
                  setLayer(i);
                  holdRef.current = true;
                }}
                onMouseLeave={() => {
                  holdRef.current = false;
                }}
                onClick={() => setLayer(i)}
                className="absolute inset-x-0 flex h-[150px] cursor-pointer items-end justify-between rounded-[18px] border px-[22px] py-[18px] text-inherit"
                style={{
                  top: i * 70,
                  transform: `translateZ(${on ? 60 : -i * 4}px)`,
                  borderColor: on ? "rgba(240,134,43,.7)" : "rgba(236,150,96,.2)",
                  background: on
                    ? "linear-gradient(160deg,rgba(240,134,43,.35),rgba(120,50,20,.25))"
                    : "linear-gradient(160deg,rgba(40,26,20,.92),rgba(18,12,10,.92))",
                  boxShadow: on
                    ? "0 30px 60px -10px rgba(232,116,42,.45)"
                    : "0 20px 40px -10px rgba(0,0,0,.8)",
                  transition: "all .5s cubic-bezier(.3,.7,.2,1)",
                }}
              >
                <span
                  className="text-[22px] font-normal"
                  style={{ color: on ? "#fff3ea" : "#cbb3a2" }}
                >
                  {l.name}
                </span>
                <span className="font-code text-[12px] text-[#a39a91]">
                  {l.pkg}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
