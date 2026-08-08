import { Link } from "react-router";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Database,
  Layers,
  Save,
  Hand,
  History,
  KeyRound,
  Network,
  Box,
  Plug,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Database,
    title: "Versioned state channels",
    body: "Every state key is a versioned channel: Overwrite, Append, DeepMerge, or AddMessages (ID-aware message upsert). Writes to undeclared channels are rejected.",
  },
  {
    icon: Layers,
    title: "Super-step executor",
    body: "Pregel/BSP execution — plan → parallel → barrier → merge → route — with each step transactional and a max_steps guard on cycles.",
  },
  {
    icon: Save,
    title: "Checkpoints",
    body: "Memory, JSON-file, or Postgres backends behind one Checkpointer trait — the core checkpoints only when you attach one, so dev stays in-memory and prod goes to Postgres with a feature flag.",
  },
  {
    icon: Hand,
    title: "Interrupts + human-in-the-loop",
    body: "ctx.interrupt(payload) suspends a run durably; resume with a human decision via command.resume — over Rust or over HTTP.",
  },
  {
    icon: History,
    title: "Fork & replay time travel",
    body: "Branch any thread at any historical checkpoint and replay from it. Fork first, replay on the fork.",
  },
  {
    icon: Network,
    title: "RemoteNode over HTTP",
    body: "Execute graph steps on remote worker services. HITL interrupts cross the wire — a remote node can suspend the whole run.",
  },
  {
    icon: Box,
    title: "WasmNode sandbox",
    body: "Run untrusted WebAssembly modules as nodes in a Wasmtime sandbox with fuel and memory caps — same Node trait, no worker fleet.",
  },
  {
    icon: Plug,
    title: "MCP client",
    body: "Call any MCP server's tools from Rusty Tool impls over stdio; MCP servers register into the ToolRegistry like native tools.",
  },
  {
    icon: Bot,
    title: "Assistants API",
    body: "Named, reusable graph configurations on the server — create an assistant once, then launch runs against its assistant_id from any client.",
  },
  {
    icon: CalendarClock,
    title: "Cron runs",
    body: "Scheduled executions built into the server — a tenancy-aware cron scheduler fires graph runs on a timer, no external job runner needed.",
  },
  {
    icon: Store,
    title: "KV store",
    body: "A server-side key-value store reachable across threads — kv_put / kv_get / kv_delete / kv_list over the same HTTP API as runs.",
  },
  {
    icon: KeyRound,
    title: "Multi-tenant auth",
    body: "API keys scoped per tenant with namespaced resources — cross-tenant access answers 404, never 403, so existence is never leaked.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="Capabilities"
        title="One engine, one server, the whole platform."
        description="State graph, durable checkpointing, interrupts, and resumable execution as first-class engine primitives — plus remote and sandboxed WASM nodes, a full server surface, and zero-dependency SDKs."
      />
      <div className="mt-14 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className="flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-input"
          >
            <div className="flex items-center justify-between">
              <span className="font-code text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <feature.icon
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-primary"
              />
            </div>
            <div>
              <h3 className="font-display text-base font-bold leading-snug">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center">
        <Link
          to="/learn/architecture"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          The execution model underneath it all — the anatomy of a run
          <ArrowRight size={14} />
        </Link>
      </p>
    </section>
  );
}
