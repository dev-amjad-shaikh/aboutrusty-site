import { useEffect, useState } from "react";
import { Kicker, Reveal, SectionTitle } from "./primitives";

const GIVES: { t: string; d: string; dot: string }[] = [
  {
    t: "Runs that recover",
    d: "If the server stops, start it again and each run continues from its last saved step.",
    dot: "#9fd4a8",
  },
  {
    t: "Runs that wait",
    d: "An agent can pause for approval or input, for as long as needed, without holding a process open.",
    dot: "#f5b774",
  },
  {
    t: "Runs you can explain",
    d: "Every run has a complete journal you can inspect, replay, or fork from any step.",
    dot: "#f0862b",
  },
];

const FITS = [
  "Losing an agent's progress is not acceptable.",
  "You want to deploy one binary instead of a Python service, Redis, and an orchestrator.",
  "Parts of your agent run on other services, or run untrusted code that needs a sandbox.",
  "Your applications are written in Python or TypeScript but you want a Rust runtime behind them.",
];

/** 01 · What it is — definition plus the three things Rusty gives you. */
export function WhatItIs() {
  const [give, setGive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setGive((g) => (g + 1) % GIVES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <Reveal
      className="grid gap-16 py-[110px]"
      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))" }}
    >
      <div className="flex flex-col gap-[18px]">
        <Kicker>01 · What it is</Kicker>
        <SectionTitle>What is Rusty?</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
          An AI agent is more than one model call. It plans, calls tools, waits
          on people, and runs for minutes or hours. Most agent code keeps that
          progress in memory. When the process restarts, the work is gone and
          nobody can say exactly what the agent did.
        </p>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
          Rusty is the layer underneath the agent that keeps track of its work.
          You describe the agent as a graph of steps. Rusty runs the graph,
          saves the state after every step, and records every model call, tool
          call, and decision along the way.
        </p>
      </div>
      <div className="flex flex-col justify-center gap-3">
        {GIVES.map((g, i) => {
          const on = i === give;
          return (
            <div
              key={g.t}
              onMouseEnter={() => setGive(i)}
              className="relative flex flex-col gap-1.5 rounded-[14px] border py-[22px] pl-16 pr-6"
              style={{
                borderColor: on ? "rgba(240,134,43,.4)" : "rgba(236,150,96,.14)",
                background: on ? "rgba(240,134,43,.07)" : "rgba(255,236,214,.03)",
                transform: on ? "translateX(-6px)" : "none",
                transition: "all .35s",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute left-6 top-[26px] h-3.5 w-3.5 rounded-full"
                style={{ background: g.dot, boxShadow: `0 0 14px ${g.dot}` }}
              />
              <span className="text-[19px] font-normal text-[#f7ece4]">{g.t}</span>
              <span className="text-[16px] leading-[1.6] text-[#b8b0a8]">{g.d}</span>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}

/** 02 · Why — the motivation, and when Rusty is a good fit. */
export function WhyBuilt() {
  return (
    <Reveal
      className="grid gap-16 border-t py-[90px]"
      style={{
        borderColor: "rgba(236,150,96,.10)",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
      }}
    >
      <div className="flex flex-col gap-[18px]">
        <Kicker>02 · Why</Kicker>
        <SectionTitle>Why we built Rusty</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
          Graphs with checkpoints are a proven way to build reliable agents.
          Running them in production usually means operating a Python service
          with its own persistence and infrastructure.
        </p>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
          We wanted the same execution model as a Rust library and a single
          server binary. Teams can embed it in their own services, ship it as
          one static executable, and call it from any language over HTTP.
        </p>
      </div>
      <div className="flex flex-col gap-3.5">
        <span className="text-[17px] font-normal text-[#f7ece4]">
          Rusty is a good fit when:
        </span>
        <div className="flex flex-col">
          {FITS.map((fit) => (
            <div
              key={fit}
              className="group flex gap-3.5 border-t py-[15px]"
              style={{ borderColor: "rgba(236,150,96,.10)" }}
            >
              <span className="text-primary transition-all group-hover:translate-x-1">
                →
              </span>
              <span className="text-[16.5px] leading-[1.55] text-[#d8ccc0]">
                {fit}
              </span>
            </div>
          ))}
        </div>
        <p
          className="m-0 border-t pt-3 text-[15px] leading-[1.6] text-[#a39a91]"
          style={{ borderColor: "rgba(236,150,96,.10)" }}
        >
          If you want the largest Python ecosystem or a fully managed platform
          today, Python-first frameworks are further along.
        </p>
      </div>
    </Reveal>
  );
}
