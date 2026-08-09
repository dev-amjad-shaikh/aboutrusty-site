import type { Article } from "./types";

export const roadmapAndStability: Article = {
  slug: "roadmap-and-stability",
  title: "Roadmap, versioning, and stability",
  description:
    "Named releases, independently versioned crates, the three surfaces that are stable today, what R1.0 changes — and the integrations Rusty rejected on the record.",
  readingTime: "9 min read",
  kicker: "Reference",
  blocks: [
    {
      type: "paragraph",
      text: "Rusty's releases are named, but its packages are versioned independently: `rusty-agent-runtime`, `rusty-server`, `rusty-worker`, `rusty-otel`, `rusty-eval`, plus the Python and TypeScript SDKs. The named releases are a branding and history layer — a named release does not imply a shared version number.",
    },
    {
      type: "callout",
      variant: "quote",
      text: "There is no single “Rusty version.”",
    },

    { type: "heading", level: 2, text: "Release timeline" },
    {
      type: "table",
      head: ["Packages (versions)", "Date", "Codename", "Headline"],
      rows: [
        [
          "rusty-agent-runtime 0.1.0",
          "2026-07-31",
          "R0.1 — Ignition",
          "Execution core, checkpointing, HITL interrupts, LLM & tool layer",
        ],
        [
          "rusty-agent-runtime 0.2.0 + rusty-server 0.1.0",
          "2026-08-05",
          "R0.2 — Persistence",
          "Postgres checkpointer, token streaming, HTTP/SSE server crate",
        ],
        [
          "rusty-agent-runtime 0.3.0 + rusty-server 0.2.0 + rusty-worker 0.1.0",
          "2026-08-05",
          "R0.3 — Interop",
          "MCP client, remote nodes + `rusty-worker`, server API completion, tracing",
        ],
        [
          "rusty-agent-runtime 0.4.0 + rusty-server 0.3.0 + rusty-otel 0.1.0",
          "2026-08-05",
          "R0.4 — Time Travel",
          "WASM nodes, time travel (fork/replay), Postgres server store, `rusty-otel`, Rusty Studio, CORS",
        ],
        [
          "rusty-server 0.4.0 + Python/TypeScript SDKs 0.1.0",
          "2026-08-05",
          "(pre-1.0 cycle)",
          "Both SDKs, multi-tenant auth, live-LLM validation",
        ],
        [
          "rusty-agent-runtime 0.5.0 + rusty-server 0.5.0",
          "2026-08-07",
          "R0.5 — Flight Recorder",
          "RunEvent/Effect/DecisionEvent contracts, hash-chained effect journal, determinism seams, exact replay, branch diff, portable replay fixtures",
        ],
        [
          "rusty-agent-runtime 0.6.0 + rusty-server 0.6.0 + rusty-worker 0.3.0 + SDKs 0.2.0",
          "2026-08-07",
          "R0.6 — Durable Work",
          "Durable task queue + leases, one shared retry taxonomy, cancellation propagation, transactional outbox, effect receipts, pools/quotas, crash-recovery release proof",
        ],
        [
          "rusty-agent-runtime 0.7.0 + rusty-server 0.7.0 + rusty-worker 0.3.1",
          "2026-08-08",
          "R0.7 — Agent Fabric",
          "Durable agent teams: typed mailboxes, supervision, coordination patterns + TeamTrace; effect kernel v2; versioned run manifest; copy-on-write state + delta checkpoints",
        ],
        [
          "(landing now — no CHANGELOG entry yet)",
          "—",
          "R0.8 — Rusty Learn (in flight)",
          "Governed memory with provenance/scopes, correction loop, candidate distillation + shadow evaluation, promotion/rollback by version pointer, executor policy plane v1",
        ],
      ],
    },

    { type: "heading", level: 2, text: "The forward shape" },
    {
      type: "paragraph",
      text: "Rusty is becoming a verifiable, adaptive Agent OS — not merely a faster agent graph framework. Five planes, each mapped to releases: the **Trust Kernel** (typed effects, policies, versioning), the **Evidence Layer** (events, checkpoints, signed receipts), the **Execution OS** (budgets, scheduling, backpressure), the **Agent Fabric** (durable agent teams), and the **Adaptive Plane** (candidates evaluated in the digital twin, promoted through governance, never self-rewriting). The sequencing rule is replay before learning: no learning mechanism ships before the run evidence it learns from can be faithfully recorded, evaluated, and rolled back.",
    },
    {
      type: "list",
      items: [
        "**R0.8 — Rusty Learn** (in flight) — governed memory (records with provenance, confidence, validity, expiration, supersession, and scope), the correction loop (human corrections become attributed candidates, never in-place rewrites), the learning loop (observe → distill → evaluate → promote → monitor → roll back), and the executor policy plane v1 over the closed action sets R0.5 froze.",
        "**R0.9 — Capsules** — WASM Component Model capsules (WIT worlds as language-neutral contracts), a deny-by-default capability host with resource budgets, Cedar policies and tenant overlays, signed run receipts over the hash-chained journal, and protocol bridges: MCP server bridge, A2A server/client with durable tasks and artifacts.",
        "**R0.10 — Adaptation** — executor policy learning (retry, timeout/stopping, worker placement, concurrency/backpressure, checkpoint placement) behind a runtime digital twin: replay with recorded effects, fault/schedule injection, and counterfactual branches for offline + shadow evaluation, drift detection, and revert-to-default.",
        "**R1.0 — Unleashed** — the stability release: stable public APIs, event schema, checkpoint format, capsule manifest, and migration policy; an independent security review; a documented capacity envelope and supported deployment topologies; production-shaped case studies.",
      ],
    },

    { type: "heading", level: 2, text: "R1.0 — Unleashed" },
    {
      type: "callout",
      variant: "warning",
      title: "Directional, not scheduled",
      text: "R1.0 — Unleashed is the upcoming v1.0 track. It is directional, not scheduled — it has no date.",
    },
    {
      type: "paragraph",
      text: "Three ambitions:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**Hosted multi-tenant service** — the server crate operated as a managed platform: tenant isolation, durable queues, autoscaling workers. **Partially started:** the v0.5 pre-1.0 cycle implemented the tenant-isolation brick (per-tenant API keys, namespaced storage, 404-on-cross-tenant semantics) in `rusty-server` v0.4.0, and R0.6 landed durable queues in `rusty-server` v0.6.0; autoscaling remains open.",
        "**WASM target** — run graphs themselves in the browser or edge runtimes (sans native checkpointers).",
        "**Edge deployment** — single-digit-MB agent services on edge runtimes, leaning on Rust's footprint and the static-binary story.",
      ],
    },
    {
      type: "paragraph",
      text: "Also in scope at R1.0: **registry publishing across crates.io / npm / PyPI**. Until then nothing is published anywhere — every package installs as a git dependency against the repo.",
    },

    { type: "heading", level: 2, text: "Versioning policy" },
    {
      type: "list",
      items: [
        "**Pre-1.0 SemVer.** All packages are `0.x`. A **minor** bump (`0.x.0 → 0.x+1.0`) may contain breaking changes (each recorded in the CHANGELOG); a **patch** bump is fixes only — no API or wire-format changes.",
        "**The remote-execution wire protocol versions separately.** `PROTOCOL_VERSION` (in `rusty-core/src/remote.rs`) is a single `u32`, currently **`1`**, governing `RemoteNode` ↔ `rusty-worker` (`POST /execute`, `NodeTask` / `TaskResult`). Evolution within v1 is additive-only; workers must reject tasks with an unsupported `protocol_version`; responses are accepted regardless of their version field (newer workers serve older clients). A non-additive change bumps the protocol to 2.",
        "**Server↔SDK compatibility is not yet versioned by a constant** — no numeric protocol version on the HTTP/SSE API today. Rule: an SDK `0.x.y` is tested against the same-cycle server release; cross-cycle pairing may work where overlap is additive but is unvalidated.",
        "**MSRV = Rust 1.86** for every crate in the workspace, declared once in `[workspace.package]` (`rust-version = \"1.86\"`) and inherited workspace-wide; enforced in CI per-crate. Pre-1.0, an MSRV bump may land in any minor release.",
      ],
    },
    { type: "heading", level: 3, text: "Current versions (as of 2026-08-09)" },
    {
      type: "table",
      head: ["Package", "Registry", "Source", "Version"],
      rows: [
        ["`rusty-agent-runtime`", "git dependency", "`rusty-core/`", "0.7.0"],
        ["`rusty-server`", "git dependency", "`rusty-server/`", "0.7.0"],
        ["`rusty-worker`", "git dependency", "`rusty-worker/`", "0.3.1"],
        ["`rusty-otel`", "git dependency", "`rusty-otel/`", "0.1.2"],
        ["`rusty-eval`", "git dependency", "`rusty-eval/`", "0.1.0"],
        ["`@rusty-runtime/client`", "git dependency", "`sdks/typescript/`", "0.2.0"],
        [
          "`rusty-agent-runtime` (import: `rusty_client`)",
          "git dependency",
          "`sdks/python/`",
          "0.2.0",
        ],
      ],
    },
    {
      type: "paragraph",
      text: "`rusty-eval` is the newest crate: **Agent TestOps** — versioned evaluation datasets, deterministic assertions over recorded runs, baseline-vs-candidate comparison, statistical regression detection, a model-judge seam, and deterministic release gates, built directly on the executor and the Flight Recorder journal.",
    },
    {
      type: "paragraph",
      text: "**Nothing is published to crates.io, npm, or PyPI.** Install every package as a git dependency against the repo; registry publishing is an R1.0 — Unleashed item. Versions above reflect the source manifests.",
    },
    {
      type: "paragraph",
      text: "**Name-collision note (by design):** the Rust core crate and the Python SDK both carry the package name `rusty-agent-runtime` (intended for crates.io and PyPI respectively). Different packages, independent version numbers; the Python SDK is imported as `rusty_client`.",
    },

    { type: "heading", level: 2, text: "Stability guarantees" },
    {
      type: "callout",
      variant: "quote",
      text: "This document is a contract, not an aspiration: if something is not listed under “stable”, assume it can change in the next minor release.",
    },
    {
      type: "paragraph",
      text: "Stable today — three surfaces, treated as protocol-level:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**The remote-execution wire protocol (v1)** — additive-only within v1.",
        "**The checkpoint format, within a minor version line** — a checkpoint written by any `rusty-agent-runtime` `0.x.*` release is readable by every other `0.x.*` in that same minor line, including restore, `get_by_id` replay, and `fork_thread` time-travel forks. Across a minor bump the struct may change (the CHANGELOG will say so and ship a migration path where one exists); no cross-minor guarantee in either direction.",
        "**The Flight Recorder evidence formats (format_version 1)** — the `record.rs` wire shapes (`RunEvent` with `RunEventKind`, `EventStatus`, `PayloadRef`, `ArtifactRef`; the `Effect` taxonomy; `DecisionEvent`; the `CheckpointHeader`), the `JournalSnapshot` export form, and the `ReplayFixture` envelope (`FIXTURE_FORMAT_VERSION` = 1), pinned by golden-file tests so accidental drift fails CI. Within a minor line these shapes evolve additively via serde defaults — pre-R0.5 checkpoints deserialize into `CheckpointHeader::default()`, and that fallback is part of the contract. `ReplayFixture::import` rejects an unsupported `format_version` at the boundary rather than misreading it.",
      ],
    },
    {
      type: "paragraph",
      text: "**Not stable** (may change in any 0.x minor release): the Rust API surface of all five crates (pin `=0.x.y` if rebuilds must not break); HTTP request/response JSON fields; SSE event families and payload fields (clients must ignore unknown events/fields; `metadata`, `error`, `end` always emitted; default `stream_mode` is `[\"values\", \"updates\"]`); SDK class/function shapes (`RustyClient` / `RustyError` / `SSEEvent`, `@rusty-runtime/client` exports); Rusty Studio internals; tenant-isolation internals (the `{tenant}/` prefix layout is an implementation detail — but 404-never-403 is intended behavior).",
    },
    {
      type: "paragraph",
      text: "**Deprecation at 0.x** is a CHANGELOG commitment, not a code mechanism; removal lands no sooner than the following minor release where feasible (security/correctness fixes excepted). No `#[deprecated]` lint guarantee — the CHANGELOG is the channel.",
    },
    {
      type: "paragraph",
      text: "**What changes at R1.0 — Unleashed:** full SemVer across crates, HTTP/SSE API, and both SDKs; the HTTP/SSE API becomes a versioned, stable surface (the same-cycle pairing rule goes away); checkpoint migrations guaranteed (a 1.x runtime reads any earlier 1.x checkpoint; migration path across the 0.x → 1.0 boundary); MSRV bumps become minor-release-only events; deprecation gains teeth (`#[deprecated]` warnings for ≥ 1 minor release before removal).",
    },
    {
      type: "callout",
      variant: "quote",
      text: "R1.0 — Unleashed flips the default from “may break” to “must not break” for the public surface.",
    },

    { type: "heading", level: 2, text: "Explicitly rejected" },
    {
      type: "paragraph",
      text: "Two integration paths were considered and rejected, on the record:",
    },
    {
      type: "callout",
      variant: "note",
      title: "napi-rs / PyO3 bindings — REJECTED",
      text: "“They'd freeze a trait surface that's still moving and split maintenance across three ecosystems; the HTTP/SSE server is the polyglot interop layer instead.”",
    },
    {
      type: "callout",
      variant: "note",
      title: "cdylib / C ABI — REJECTED",
      text: "“A C ABI over async tokio graphs leaks runtime-ownership and panic-safety problems across the boundary for near-zero demand; embed the Rust crate directly or talk HTTP.”",
    },
    {
      type: "callout",
      variant: "quote",
      text: "The server is the polyglot interop layer by design.",
    },
  ],
};
