import { useEffect, useRef, useState } from "react";
import { Kicker, Reveal, SectionTitle } from "./primitives";

const VIEWS: { label: string; key: string; caption: string }[] = [
  { label: "Home", key: "home", caption: "Recent runs, spend, and anything that needs attention." },
  { label: "Agent builder", key: "agents", caption: "Goal, readiness, model, instructions, skills, tools, and a test panel." },
  { label: "Connectors", key: "connectors", caption: "Systems your agents work in. Connect once, share across agents." },
  { label: "Skills", key: "skills", caption: "Reusable procedures that bundle instructions with the tools they need." },
  { label: "Evals", key: "evals", caption: "Datasets, experiments, and release gates." },
  { label: "Knowledge", key: "knowledge", caption: "Sources your agents retrieve from, with sync status." },
  { label: "Observability", key: "analytics", caption: "Runs, latency, cost, and errors across all agents." },
];

/** 06 · Studio — the real workspace mock in a tilting browser frame. */
export function StudioShowcase() {
  const [view, setView] = useState(0);
  const [scale, setScale] = useState(0.6);
  const [inView, setInView] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      if (w > 0) setScale(w / 1440);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Reveal
      className="flex flex-col gap-7 border-t pb-10 pt-[90px]"
      style={{ borderColor: "rgba(236,150,96,.10)" }}
    >
      <div className="flex max-w-[640px] flex-col gap-3.5">
        <Kicker>06 · Studio</Kicker>
        <SectionTitle>See what your agents are doing</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.6] text-[#cfc3b8]">
          Rusty Studio is where you build agents, connect systems, and review
          runs. This is the real workspace. Click around.
        </p>
      </div>
      <div
        className="flex flex-wrap items-center gap-1 self-start rounded-[11px] border p-1"
        style={{
          borderColor: "rgba(236,150,96,.16)",
          background: "rgba(255,236,214,.03)",
        }}
      >
        {VIEWS.map((v, i) => (
          <button
            key={v.key}
            onClick={() => setView(i)}
            className="cursor-pointer rounded-lg border-0 px-3.5 py-2 text-[14px]"
            style={{
              background: i === view ? "rgba(240,134,43,.2)" : "transparent",
              color: i === view ? "#fff3ea" : "#b8b0a8",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div ref={wrapRef} style={{ perspective: 2000 }}>
        <div
          ref={frameRef}
          className="relative aspect-[1440/900] w-full overflow-hidden rounded-2xl border bg-[#0d0a09]"
          style={{
            borderColor: "rgba(236,150,96,.22)",
            boxShadow:
              "0 50px 110px -30px rgba(0,0,0,.9),0 0 80px -30px rgba(232,116,42,.45)",
            transform: inView
              ? "rotateX(0deg) scale(1)"
              : "rotateX(24deg) scale(.9) translateY(40px)",
            transformOrigin: "50% 100%",
            transition: "transform 1.2s cubic-bezier(.2,.7,.2,1)",
          }}
        >
          <iframe
            src={`/studio-mock/Studio.html#view=${VIEWS[view].key}`}
            title="Rusty Studio"
            className="absolute left-0 top-0 h-[900px] w-[1440px] border-0"
            style={{ transformOrigin: "0 0", transform: `scale(${scale})` }}
          />
        </div>
      </div>
      <p className="m-0 text-center text-[15.5px] text-[#b8b0a8]">
        {VIEWS[view].caption}
      </p>
    </Reveal>
  );
}
