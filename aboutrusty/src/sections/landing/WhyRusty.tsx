import type { ReactNode } from "react";
import { SectionHeading } from "./SectionHeading";

interface Reason {
  index: string;
  title: string;
  body: string;
  viz: ReactNode;
}

const VIZ_DOT = "relative z-10 h-2 w-2 rounded-full border-2 border-card bg-muted-foreground/40";

function CheckpointViz() {
  const labels = ["boot", "plan", "tool", "saved", "resume"];
  return (
    <div aria-hidden="true" className="mt-auto pt-10">
      <div className="relative flex items-center justify-between">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        {labels.map((label, i) => (
          <span
            key={label}
            className={
              i === 3
                ? "relative z-10 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_16px_rgba(255,107,53,0.55)]"
                : VIZ_DOT
            }
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-between font-code text-[10px] text-muted-foreground">
        {labels.map((label) => (
          <span key={label} className={label === "saved" ? "text-accent-foreground" : undefined}>
            {label}
          </span>
        ))}
      </div>
      <div className="ml-auto mt-5 w-44 border-l-2 border-l-primary bg-accent/40 p-2.5 font-code">
        <span className="block text-[9px] uppercase tracking-[0.14em] text-accent-foreground">
          checkpoint_04
        </span>
        <strong className="mt-1 block text-[10px] font-medium text-foreground/80">
          state persisted
        </strong>
        <code className="mt-0.5 block text-[9px] text-muted-foreground">
          step boundary · resumable
        </code>
      </div>
    </div>
  );
}

function SpanBarsViz() {
  const bars: { width: string; label: string; meta: string }[] = [
    { width: "88%", label: "cargo build", meta: "--release" },
    { width: "56%", label: "single binary", meta: "static" },
    { width: "72%", label: "deploy", meta: "no runtime" },
  ];
  return (
    <div aria-hidden="true" className="mt-auto grid gap-2 pt-10">
      {bars.map((bar) => (
        <span
          key={bar.label}
          style={{ width: bar.width }}
          className="grid h-8 grid-cols-[10px_1fr_auto] items-center gap-2 border bg-background/60 px-2.5 font-code text-[10px] text-muted-foreground"
        >
          <i className="h-1.5 w-1.5 rounded-full bg-primary/70" />
          <b className="font-normal">{bar.label}</b>
          <code className="text-muted-foreground">{bar.meta}</code>
        </span>
      ))}
    </div>
  );
}

function TargetsViz() {
  const targets: { glyph: string; label: string; meta: string }[] = [
    { glyph: "⌁", label: "embedded", meta: "IN-PROCESS" },
    { glyph: "↗", label: "remote node", meta: "OVER HTTP" },
    { glyph: "▦", label: "wasm node", meta: "SANDBOXED" },
  ];
  return (
    <div aria-hidden="true" className="mt-auto grid grid-cols-3 gap-2 pt-10">
      {targets.map((target) => (
        <span
          key={target.label}
          className="flex min-h-[68px] flex-col justify-between border bg-background/60 p-2.5 font-code text-[10px] text-muted-foreground"
        >
          <i className="text-sm not-italic text-primary">{target.glyph}</i>
          <span>
            {target.label}
            <b className="mt-1 block text-[9px] font-medium tracking-[0.12em] text-muted-foreground">
              {target.meta}
            </b>
          </span>
        </span>
      ))}
    </div>
  );
}

function MetricRowViz() {
  const metrics: { value: string; unit: string; label: string }[] = [
    { value: "HTTP", unit: "/SSE", label: "server api" },
    { value: "PY", unit: "sdk", label: "zero-dep client" },
    { value: "TS", unit: "sdk", label: "zero-dep client" },
  ];
  return (
    <div aria-hidden="true" className="mt-auto grid grid-cols-3 pt-10">
      {metrics.map((metric) => (
        <div key={metric.label} className="border-l pl-4">
          <strong className="block font-display text-2xl font-extrabold leading-none sm:text-3xl">
            {metric.value}
            <small className="ml-1 font-code text-[9px] font-medium tracking-normal text-primary">
              {metric.unit}
            </small>
          </strong>
          <span className="mt-2 block font-code text-[10px] text-muted-foreground">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function EvidenceChainViz() {
  const events: { seq: string; label: string; hash: string }[] = [
    { seq: "0041", label: "model_call", hash: "9f2e…" },
    { seq: "0042", label: "tool_effect", hash: "4ab7…" },
    { seq: "0043", label: "checkpoint", hash: "c41a…" },
  ];
  return (
    <div aria-hidden="true" className="mt-auto grid gap-1.5 pt-10">
      {events.map((event) => (
        <span
          key={event.seq}
          className="grid grid-cols-[34px_1fr_auto] items-center gap-2 border bg-background/60 px-2.5 py-1.5 font-code text-[10px] text-muted-foreground"
        >
          <b className="font-normal text-primary/80">#{event.seq}</b>
          <span>{event.label}</span>
          <code className="text-muted-foreground">{event.hash}</code>
        </span>
      ))}
      <span className="mt-1.5 flex items-center justify-between font-code text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>sha-256 head · chained</span>
        <span className="text-accent-foreground">replay: zero outbound calls</span>
      </span>
    </div>
  );
}

function SurvivesViz() {
  const states = ["leased", "retry", "dlq"];
  const patterns = ["delegate", "fan-out", "race", "quorum"];
  return (
    <div aria-hidden="true" className="mt-auto pt-10">
      <div className="flex items-center gap-1.5">
        {states.map((state, i) => (
          <span key={state} className="flex items-center gap-1.5">
            <span
              className={
                state === "dlq"
                  ? "border border-primary/50 bg-accent/40 px-2.5 py-1.5 font-code text-[10px] text-accent-foreground"
                  : "border bg-background/60 px-2.5 py-1.5 font-code text-[10px] text-muted-foreground"
              }
            >
              {state}
            </span>
            {i < states.length - 1 && (
              <span className="font-code text-[10px] text-muted-foreground">→</span>
            )}
          </span>
        ))}
        <span className="ml-auto font-code text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          task lifecycle
        </span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {patterns.map((pattern) => (
          <span
            key={pattern}
            className="border bg-background/60 px-2 py-1.5 text-center font-code text-[10px] text-muted-foreground"
          >
            {pattern}
          </span>
        ))}
      </div>
    </div>
  );
}

const REASONS: Reason[] = [
  {
    index: "01 / DURABILITY",
    title: "Durability is a requirement, not a nicety.",
    body: "Every super-step boundary is checkpointed — resume after a crash, suspend for human approval, fork and replay any historical step.",
    viz: <CheckpointViz />,
  },
  {
    index: "02 / ONE BINARY",
    title: "Deployment should be one binary.",
    body: "Your graphs compile into your server: no Python runtime, no Redis, no orchestration config file. cargo build --release is the entire deployment pipeline.",
    viz: <SpanBarsViz />,
  },
  {
    index: "03 / DISTRIBUTED NODES",
    title: "Your nodes aren't all in one place.",
    body: "Remote nodes execute graph steps on remote services over HTTP (interrupts cross the wire), and WasmNode runs untrusted modules in a Wasmtime sandbox with fuel and memory caps.",
    viz: <TargetsViz />,
  },
  {
    index: "04 / POLYGLOT CLIENTS",
    title: "Your clients aren't Rust.",
    body: "The server is the interop layer: zero-dependency Python and TypeScript SDKs talk HTTP/SSE to it.",
    viz: <MetricRowViz />,
  },
  {
    index: "05 / EVIDENCE, NOT LOGS",
    title: "A run should leave evidence, not logs.",
    body: "The Flight Recorder journals every run as a tamper-evident, hash-chained event log. Exact replay re-drives a run with zero outbound calls, and portable fixtures make CI replayable.",
    viz: <EvidenceChainViz />,
  },
  {
    index: "06 / WORK THAT SURVIVES",
    title: "Work should outlive its workers.",
    body: "Leased tasks with heartbeats, a retry taxonomy with a dead-letter queue, and effect receipts — the same queue carries durable agent identities under supervision, with typed coordination: delegate, fan-out, race, quorum.",
    viz: <SurvivesViz />,
  },
];

export function WhyRusty() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="Why Rusty exists"
        title="Agent runs are fragile. Rusty is the fix."
        description="Crashes lose work, human approval is bespoke glue, and runaway loops burn tokens. Rusty answers with its own engineering: state channels with reducers, transactional Pregel/BSP super-steps, and a versioned checkpoint at every step boundary — durability, human-in-the-loop, and time travel from one primitive, all on tokio. The direction from there: a verifiable, adaptive Agent OS, built one plane at a time."
      />
      <div className="mt-14 grid gap-3.5 sm:grid-cols-2">
        {REASONS.map((reason) => (
          <article
            key={reason.title}
            className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border bg-card p-6 transition-colors hover:border-input sm:p-7"
          >
            <span className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {reason.index}
            </span>
            <div className="mt-9">
              <h3 className="font-display text-2xl font-bold leading-[1.08]">
                {reason.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {reason.body}
              </p>
            </div>
            {reason.viz}
          </article>
        ))}
      </div>
    </section>
  );
}
