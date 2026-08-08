import { SectionHeading } from "./SectionHeading";

const STAT_CALLOUTS: { value: string; label: string }[] = [
  { value: "Checkpoint at every super-step boundary", label: "Durability" },
  { value: "Single static binary; library or server", label: "Deployment" },
  { value: "MIT OR Apache-2.0", label: "License" },
];

interface Differentiator {
  index: string;
  title: string;
  body: string;
}

const DIFFERENTIATORS: Differentiator[] = [
  {
    index: "01 / DEPLOYMENT",
    title: "One binary is the platform.",
    body: "Your graphs compile into the server itself: no Python runtime, no Redis, no orchestration config file. cargo build --release produces the whole deployable artifact.",
  },
  {
    index: "02 / EXECUTION TARGETS",
    title: "Code runs anywhere.",
    body: "RemoteNode executes graph steps on remote services over HTTP — interrupts cross the wire, so a remote node can suspend the whole run. WasmNode runs untrusted modules in a Wasmtime sandbox with fuel and memory caps.",
  },
  {
    index: "03 / SERVER SURFACE",
    title: "A server, not just a library.",
    body: "Threads, background / blocking / streaming runs, checkpoint history, fork + replay, assistants, crons, a KV store, and multi-tenant API-key auth — all served over HTTP/SSE from the same binary.",
  },
  {
    index: "04 / INTEROP",
    title: "Polyglot without bindings.",
    body: "Zero-dependency Python and TypeScript SDKs drive the server over HTTP/SSE. PyO3, napi-rs, and a cdylib / C ABI were deliberately rejected — the wire protocol is the interop layer.",
  },
  {
    index: "05 / OBSERVABILITY",
    title: "Observable from the start.",
    body: "rusty-otel wires up a one-call tracing subscriber with optional OTLP span export, so executor instrumentation reaches your existing telemetry stack.",
  },
];

export function Comparison() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="Differentiators"
        title="Where Rusty stands apart."
        description="Rusty is its own platform: a durable graph engine, a full server surface, remote and sandboxed execution, and zero-dependency SDKs — all in Rust, all in one deployment unit."
      />
      <div className="mt-14 grid gap-3.5 sm:grid-cols-3">
        {STAT_CALLOUTS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-2.5 rounded-xl border bg-card px-4 py-7 text-center"
          >
            <span className="font-display text-lg font-extrabold leading-snug sm:text-xl">
              {stat.value}
            </span>
            <span className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {DIFFERENTIATORS.map((item) => (
          <article
            key={item.title}
            className="flex flex-col rounded-xl border bg-card p-6 transition-colors hover:border-input"
          >
            <span className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {item.index}
            </span>
            <h3 className="mt-5 font-display text-xl font-bold leading-[1.1]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </article>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        If you want a batteries-included Python ecosystem or a fully managed
        control plane today, LangGraph Platform is further along — Rusty is the
        choice when durability, one-binary deployment, and remote/sandboxed
        execution are the requirements.
      </p>
    </section>
  );
}
