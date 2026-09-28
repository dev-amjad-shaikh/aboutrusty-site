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
  FileClock,
  ListChecks,
  Users,
  ShieldCheck,
  Package,
  Cable,
  BookOpen,
  Fingerprint,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Kicker, Reveal, SectionTitle } from "./home/primitives";

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
    icon: FileClock,
    title: "Flight Recorder",
    body: "Every run journaled as replayable evidence — canonical RunEvent contracts and a causal effect journal with a tamper-evident hash-chained head. Exact replay re-drives a run with zero outbound calls; portable fixtures carry replay into CI — GET /runs/{id}/events, GET /runs/{id}/fixture, POST /runs/replay, GET /runs/diff.",
  },
  {
    icon: ListChecks,
    title: "Durable Work",
    body: "A durable task queue on file or Postgres backends: leases with heartbeats, the closed ErrorClass retry taxonomy with jittered backoff capped at 5 minutes, DLQ, cancellation propagation, and a transactional outbox. Effect receipts make recovery honest — at-least-once delivery plus idempotency, never pretend exactly-once.",
  },
  {
    icon: Users,
    title: "Agent Fabric",
    body: "Durable agent identities (AgentId) with typed mailboxes and capability manifests, OTP-style supervision with fencing tokens, and four typed coordination patterns — delegate/handoff, fan-out/map, race, quorum. TeamTrace assembles one cross-journal causal tree per team.",
  },
  {
    icon: ShieldCheck,
    title: "Effect kernel v2",
    body: "Retry safety enforced at compile time — marker traits PureEffect, ReadOnlyEffect, IdempotentEffect, CompensatableEffect, and IrreversibleEffect, with approval tokens gating irreversible effects. A versioned run manifest SHA-256-pins prompts, tool schemas, and model config into every checkpoint.",
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
    icon: Package,
    title: "Skill plane",
    body: "Governed SKILL.md packages: fail-closed parsing, mandatory provenance, a deterministic security scan, and immutable content-addressed versions. Progressive disclosure in three tiers — metadata, body, then references/assets one member at a time. Served over /skills.",
  },
  {
    icon: Cable,
    title: "Connector plane",
    body: "Lifecycle-managed providers of tools: content-addressed manifests, per-tenant instances (pending → connecting → healthy | degraded | failed, plus disabled), credentials injected as broker handles — never raw bytes — and tool catalogs pinned by generation, never “latest”. MCP stdio and HTTP search providers; /connectors API.",
  },
  {
    icon: BookOpen,
    title: "Knowledge plane",
    body: "Governed sources with mandatory provenance and retention policies, deterministic chunking into content-addressed chunks, and hybrid retrieval that returns cited chunks, never bare text. Corrections mint superseding versions; sweeps tombstone sources so old citations still resolve. /knowledge API.",
  },
  {
    icon: Fingerprint,
    title: "Resolved capability sets",
    body: "One immutable, content-addressed composition (cs-<sha256>) per agent version, resolved at admission: config.capability_set or a bare config.tool_allowlist — mutually exclusive — validated against the graph's executable catalog before the run starts. The set id pins into the run manifest; replay re-resolves and fails closed on a missing member.",
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
    <section className="mx-auto max-w-[1240px] px-7">
      <Reveal
        className="flex flex-col gap-10 border-t py-[90px]"
        style={{ borderColor: "rgba(236,150,96,.10)" }}
      >
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <Kicker>06 · Capabilities</Kicker>
          <SectionTitle>One engine, one server, the whole platform.</SectionTitle>
          <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
            State graph, durable checkpointing, interrupts, and resumable
            execution as first-class engine primitives — plus remote and
            sandboxed WASM nodes, a full server surface, and zero-dependency
            SDKs.
          </p>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-[14px] border p-5 transition-colors"
              style={{ borderColor: "rgba(236,150,96,.14)", background: "rgba(255,236,214,.03)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(240,134,43,.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(236,150,96,.14)";
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-code text-[10px] font-medium tracking-[0.14em] text-[#6f675f]">
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
                <h3 className="m-0 text-[16px] font-normal leading-snug text-[#f7ece4]">
                  {feature.title}
                </h3>
                <p className="mb-0 mt-2 text-[14px] leading-[1.6] text-[#b8b0a8]">
                  {feature.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="m-0 text-center">
          <Link
            to="/learn/architecture"
            className="inline-flex items-center gap-1.5 text-[15px] text-primary no-underline transition-colors hover:text-[#fb9a3f]"
          >
            The execution model underneath it all — the anatomy of a run
            <ArrowRight size={14} />
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
