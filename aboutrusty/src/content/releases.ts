/**
 * Release timeline, written from rusty-src/CHANGELOG.md. Newest first.
 * `lessons` are chapter ids in the Learn course's 11-part numbering.
 * `proof` is the test the changelog names as the release's proof, relative to the repo root.
 */

export interface Release {
  tag: string;
  version: string;
  date: string;
  name: string;
  body: string;
  proof?: string;
  lessons: string[];
}

export const REPO = "https://github.com/dev-amjad-shaikh/rusty";
export const CHANGELOG_URL = `${REPO}/blob/main/CHANGELOG.md`;

export const RELEASES: Release[] = [
  {
    tag: "main",
    version: "Unreleased",
    date: "",
    name: "On main",
    body:
      "Connectors defined by one JSON Schema document, governed SKILL.md skills, knowledge sources with cited retrieval, and durable goals. The gap ledger records what agents could not do, typed repair records log every automated repair, and the verifier suite measures the verifier against people's judgments. Intelligence campaigns, Rusty Studio v4, and MSRV raised to Rust 1.87.",
    lessons: [],
  },
  {
    tag: "R0.12",
    version: "v0.13.0",
    date: "Aug 11, 2026",
    name: "Operations Plane",
    body:
      "Run outputs become content-addressed artifacts with versions, previews, retention, and lineage back to the effect that produced them. Deployments become immutable revisions that each environment promotes and rolls back by pointer, with release gates, seeded canaries, effect-restricted shadows, encrypted environment secrets, and GET /deployments/health.",
    proof: "rusty-server/tests/operations_release.rs",
    lessons: ["9.1", "9.2", "9.3", "9.4"],
  },
  {
    tag: "R0.11",
    version: "v0.12.0",
    date: "Aug 10, 2026",
    name: "Extension Plane",
    body:
      "Prompts, tool contracts, model settings, memory configurations, and middleware become versioned registry artifacts, promoted per environment tag and pinned by each run at admission. A credential broker keeps secrets encrypted and gives tools short-lived, scope-checked handles. OAuth flows refresh tokens without a redeploy.",
    proof: "rusty-server/tests/extension_release.rs",
    lessons: ["10.3"],
  },
  {
    tag: "R0.10",
    version: "v0.11.0",
    date: "Aug 9, 2026",
    name: "Adaptation",
    body:
      "Retry and timeout decisions become learnable policies. Each candidate policy is tested in the runtime twin, which re-executes recorded runs under seeded faults, before it can be promoted. static-v0 stays the default and the fallback, and GET /policy/drift reports drift.",
    proof: "rusty-server/tests/adaptation_release.rs",
    lessons: ["8.5"],
  },
  {
    tag: "R0.9",
    version: "v0.10.0",
    date: "Aug 9, 2026",
    name: "Capsules",
    body:
      "Untrusted code runs as WebAssembly capsules that reach only what their manifest grants, within declared budgets. Cedar policies decide admission. Runs get Ed25519-signed receipts that cover denied actions, and the runtime speaks MCP and A2A as both server and client.",
    proof: "rusty-server/tests/capsules_release.rs",
    lessons: ["10.1", "10.2", "5.5"],
  },
  {
    tag: "R0.8",
    version: "v0.9.0",
    date: "Aug 9, 2026",
    name: "Rusty Learn",
    body:
      "Scoped, attributed memory with journaled reads and writes, consolidation, and forgetting. A person's correction becomes a candidate that is evaluated against recorded runs, promoted inside a declared envelope, and rolled back by pointer. Adds the executor policy registry and rusty-eval.",
    proof: "rusty-server/tests/learn_release.rs",
    lessons: ["8.1", "8.2", "8.3", "8.4"],
  },
  {
    tag: "R0.7",
    version: "v0.8.0",
    date: "Aug 8, 2026",
    name: "Agent Fabric",
    body:
      "Durable agents with persistent mailboxes, supervision, and four coordination patterns: delegate, fan-out, race, and quorum. Effect classes become marker traits checked at compile time. Delta checkpoints shrink a 1000-step, 1 MB run from 1.05 GB to 33 MB on disk.",
    proof: "rusty-server/tests/team_recovery.rs",
    lessons: ["7.1", "7.2", "7.3", "7.4", "11.4"],
  },
  {
    tag: "R0.6",
    version: "v0.7.0",
    date: "Aug 7, 2026",
    name: "Durable Work",
    body:
      "A durable task queue with leases, heartbeats, one shared retry policy, and a dead-letter queue. Adds cancellation, a transactional outbox, effect receipts, graceful drain, and the rusty-worker ActivityWorker. A crash between an effect and its completion report no longer runs the effect twice.",
    proof: "rusty-server/tests/crash_recovery.rs",
    lessons: ["4.1", "4.2", "4.3", "4.4"],
  },
  {
    tag: "R0.5",
    version: "v0.6.0",
    date: "Aug 7, 2026",
    name: "Flight Recorder",
    body:
      "Every run records a hash-chained journal. An injectable clock and seeded RNG make runs reproducible, exact replay re-drives a run from its journal with zero outbound calls, and BranchDiff compares two runs. The server gains endpoints for events, fixtures, replay, and diff, and Studio gains the Recorder.",
    lessons: ["5.1", "5.2", "5.3", "5.4"],
  },
  {
    tag: "v0.5",
    version: "v0.5.0",
    date: "Aug 5, 2026",
    name: "SDKs and tenancy",
    body:
      "Zero-dependency Python and TypeScript clients for threads, runs, streaming, time travel, assistants, crons, and the KV store. API keys map to tenants, and each tenant's data is isolated. This cycle has no R-number.",
    lessons: ["6.4"],
  },
  {
    tag: "R0.4",
    version: "v0.4.0",
    date: "Aug 5, 2026",
    name: "Time Travel",
    body:
      "Fork a thread from any checkpoint and replay a run from it, in the core and through POST /threads/{id}/fork. Also adds WASM nodes, a Postgres store for the server, the rusty-otel crate for OpenTelemetry export, and the first Rusty Studio.",
    lessons: ["3.3"],
  },
  {
    tag: "R0.3",
    version: "v0.3.0",
    date: "Aug 5, 2026",
    name: "Interop",
    body:
      "An MCP client that calls any MCP server's tools, and remote nodes that run on worker services over HTTP through the new rusty-worker crate. The server API gains runs, assistants, crons, and the KV store, and the executor gains tracing spans.",
    lessons: ["6.1"],
  },
  {
    tag: "R0.2",
    version: "runtime 0.2.0 · server 0.1.0",
    date: "Aug 5, 2026",
    name: "Persistence",
    body:
      "A Postgres checkpointer and token streaming from OpenAI-compatible endpoints. rusty-server ships as the HTTP and SSE face of the engine: threads, runs, streaming, interrupt and resume, one active run per thread, and API-key auth.",
    lessons: ["3.1", "6.1", "6.2", "6.3"],
  },
  {
    tag: "R0.1",
    version: "runtime 0.1.0",
    date: "Jul 31, 2026",
    name: "Ignition",
    body:
      "The execution core: state channels with reducers, graphs validated at compile(), and the super-step executor. In-memory and JSON-file checkpointers, human-in-the-loop interrupts, routing and fan-out, a typed event stream, an OpenAI-compatible client, and a prebuilt ReAct agent.",
    lessons: ["2.1", "2.2", "2.3", "2.5", "2.6", "3.2"],
  },
];
