import type { Article } from "./types";

export const roadmapAndStability: Article = {
  slug: "roadmap-and-stability",
  title: "Roadmap, versioning, and stability",
  description:
    "Named releases, independently versioned packages on crates.io / npm / PyPI, the three surfaces stable today, the seven-surface R1.0 freeze inventory — and the integrations Rusty rejected on the record.",
  readingTime: "9 min read",
  kicker: "Reference",
  blocks: [
    {
      type: "paragraph",
      text: "Rusty's releases are named, but its packages are versioned independently: `rusty-agent-runtime`, `rusty-agent-server`, `rusty-worker`, `rusty-otel`, `rusty-eval`, plus the Python and TypeScript SDKs. The named releases are a branding and history layer — a named release does not imply a shared version number.",
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
          "rusty-agent-runtime 0.8.0 + rusty-server 0.8.0 + rusty-eval 0.1.1",
          "2026-08-09",
          "R0.8 — Rusty Learn",
          "Governed memory with provenance/scopes, the correction loop, content-addressed candidates + promotion gate, executor policy plane v1, rusty-eval joins the server",
        ],
        [
          "rusty-agent-runtime 0.9.0 + rusty-server 0.9.0",
          "2026-08-09",
          "R0.9 — Capsules",
          "Content-addressed capsule manifests, WASM capability host with Cedar policies + tenant overlays, signed run receipts (Ed25519), MCP and A2A protocol bridges in both directions",
        ],
        [
          "rusty-agent-runtime 0.10.0 + rusty-server 0.10.0 + rusty-worker 0.3.4 + SDKs 0.3.0",
          "2026-08-09",
          "R0.10 — Adaptation",
          "Headroom experiment, runtime digital twin with fault schedules + counterfactual forks, learned retry/timeout policies promoted through governance, `GET /policy/drift`",
        ],
        [
          "rusty-agent-runtime 0.11.0 + rusty-server 0.11.0 + rusty-worker 0.3.5 + SDKs 0.4.0",
          "2026-08-10",
          "R0.11 — Extension Plane",
          "Prompt/configuration registry over the candidate pipeline, admission-time resolution + manifest pinning, envelope-encrypted credential broker (tools hold handles, never raw credentials), middleware compositions",
        ],
        [
          "rusty-agent-runtime 0.12.0 + rusty-agent-server 0.12.0 + rusty-worker 0.3.6 + rusty-otel 0.1.7 + rusty-eval 0.1.5 + SDKs 0.5.0",
          "2026-08-11",
          "R0.12 — Operations Plane",
          "Content-addressed run artifacts with lineage, deployment control plane: immutable revisions, dev/staging/prod environments, canary + shadow deployments gated by `rusty-eval`, byte-exact rollback",
        ],
      ],
      caption:
        "Landed on main since R0.12 (2026-08-15, not yet in a numbered release): the capability planes — governed skills, connectors, knowledge, and resolved capability sets. See [the capability planes](/learn/capability-planes).",
    },

    { type: "heading", level: 2, text: "The forward shape" },
    {
      type: "paragraph",
      text: "Rusty is becoming a verifiable, adaptive Agent OS — not merely a faster agent graph framework. Five planes, each mapped to releases: the **Trust Kernel** (typed effects, policies, versioning), the **Evidence Layer** (events, checkpoints, signed receipts), the **Execution OS** (budgets, scheduling, backpressure), the **Agent Fabric** (durable agent teams), and the **Adaptive Plane** (candidates evaluated in the digital twin, promoted through governance, never self-rewriting). The sequencing rule is replay before learning: no learning mechanism ships before the run evidence it learns from can be faithfully recorded, evaluated, and rolled back.",
    },
    {
      type: "list",
      items: [
        "**R0.8 — Rusty Learn** (shipped 2026-08-09) — governed memory (records with provenance, confidence, validity, expiration, supersession, and scope), the correction loop (human corrections become attributed candidates, never in-place rewrites), the learning loop (observe → distill → evaluate → promote → monitor → roll back), and the executor policy plane v1 over the closed action sets R0.5 froze.",
        "**R0.9 — Capsules** (shipped 2026-08-09) — WASM Component Model capsules (WIT worlds as language-neutral contracts), a deny-by-default capability host with resource budgets, Cedar policies and tenant overlays, signed run receipts over the hash-chained journal, and protocol bridges: MCP server bridge, A2A server/client with durable tasks and artifacts.",
        "**R0.10 — Adaptation** (shipped 2026-08-09) — executor policy learning (retry, timeout/stopping, worker placement, concurrency/backpressure, checkpoint placement) behind a runtime digital twin: replay with recorded effects, fault/schedule injection, and counterfactual branches for offline + shadow evaluation, drift detection, and revert-to-default.",
        "**R0.11 — Extension Plane** (shipped 2026-08-10) — every configuration that can influence a run (prompts, tool contracts, model settings, memory configurations, middleware compositions) becomes a versioned, content-addressed, promotable artifact resolved and pinned at admission; credentials live in one envelope-encrypted broker, issued to tools as short-lived opaque handles.",
        "**R0.12 — Operations Plane** (shipped 2026-08-11) — every run output becomes an operable, lineage-carrying artifact, and every deployment a frozen, evaluable, reversible revision: immutable revisions, first-class environments, promotion/rollback by pointer move, canary and shadow deployments gated by `rusty-eval`.",
        "**R1.0 — Unleashed** (upcoming) — the stability release: stable public APIs, event schema, checkpoint format, capsule manifest, and migration policy; an independent security review; a documented capacity envelope and supported deployment topologies; production-shaped case studies.",
      ],
    },

    { type: "heading", level: 2, text: "R1.0 — Unleashed" },
    {
      type: "callout",
      variant: "warning",
      title: "Directional, not scheduled",
      text: "R1.0 — Unleashed is the upcoming v1.0 track. It is directional, not scheduled — it has no date, and it has not shipped.",
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
      text: "**Registry publishing — once scoped to R1.0 — has already landed.** All seven packages are published: five crates on crates.io, the TypeScript client on npm, the Python client on PyPI. Install with `cargo add`, `npm install`, and `pip install`; no git dependencies required.",
    },
    {
      type: "paragraph",
      text: "**The R1.0 freeze inventory** (`docs/stability.md`) enumerates concretely what R1.0 freezes — seven surfaces, each pinned by golden-file tests where a pin exists:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**Evidence and record formats** — `RunEvent` / `RunEventKind` (59 variants today), `EventStatus`, `PayloadRef`, `ArtifactRef`, the `Effect` taxonomy, `DecisionEvent`, `CheckpointHeader`, `JournalSnapshot`, and the `ReplayFixture` envelope; format constants (`CURRENT_FORMAT_VERSION`, `FIXTURE_FORMAT_VERSION`, `RECEIPT_FORMAT_VERSION`, `TASK_ENVELOPE_FORMAT_VERSION`, `SEALED_FORMAT_VERSION` — all currently 1) stay frozen as boundary checks.",
        "**Checkpoint format** — the `Checkpoint` struct with its `CheckpointHeader`, the delta-checkpoint chain encoding, and the Postgres `rusty_checkpoints` / `rusty_artifacts` tables; a 1.x runtime reads any earlier 1.x checkpoint, with a documented migration path across the 0.x → 1.0 boundary.",
        "**Capsule manifest** — `CapsuleManifest` content-addressed by `derive_capsule_id`; the WIT world string (`WORLD_V1 = \"rusty:capsule/world@0.1.0\"`) is the interface contract, and new worlds arrive as new strings, never by mutating an existing one.",
        "**Remote-execution wire protocol** — already stable at v1; its rules do not change at R1.0.",
        "**HTTP/SSE API** — the full route surface (133 paths across 21 groups today) freezes additive-only within HTTP API v1; the SSE families `metadata`, `values`, `updates`, `error`, and `end` become frozen names.",
        "**SDK surfaces** — frozen at 1.0 for the groups both SDKs cover today (threads, runs, assistants, crons, the KV store, tasks); the advanced groups stay HTTP-only at 1.0 and gain typed SDK methods additively in 1.x minors.",
        "**Rust crate APIs** — full SemVer on all five crates from 1.0.0, removals preceded by at least one minor release of `#[deprecated]` warnings.",
      ],
    },
    {
      type: "paragraph",
      text: "**Gates before R1.0** — the inventory is necessary but not sufficient; six gates guard the release. Two landed 2026-08-12: the `API_PROTOCOL_VERSION` constant reported by `GET /info`, and the durable pending-run queue (queued runs persist on both store backends and resume draining after a restart). Four remain open: the capacity envelope (load-test harness plus published numbers), provider-layer integration, an independent security review, and three production-shaped case studies. Until R1.0 ships, the v0.x rules below are the whole contract — the inventory and gates are the plan, not yet the promise.",
    },

    { type: "heading", level: 2, text: "Versioning policy" },
    {
      type: "list",
      items: [
        "**Pre-1.0 SemVer.** All packages are `0.x`. A **minor** bump (`0.x.0 → 0.x+1.0`) may contain breaking changes (each recorded in the CHANGELOG); a **patch** bump is fixes only — no API or wire-format changes.",
        "**The remote-execution wire protocol versions separately.** `PROTOCOL_VERSION` (in `rusty-core/src/remote.rs`) is a single `u32`, currently **`1`**, governing `RemoteNode` ↔ `rusty-worker` (`POST /execute`, `NodeTask` / `TaskResult`). Evolution within v1 is additive-only; workers must reject tasks with an unsupported `protocol_version`; responses are accepted regardless of their version field (newer workers serve older clients). A non-additive change bumps the protocol to 2.",
        "**Server↔SDK compatibility is versioned by `API_PROTOCOL_VERSION`** (`rusty-server/src/lib.rs`, currently `1`), reported by `GET /info` as `api_protocol_version` alongside the crate `version`. Within API v1 evolution is additive-only: new routes, optional request fields, response fields, and SSE event families may appear in minor releases; a removal, rename, or meaning change requires bumping to 2. Neither SDK enforces the handshake yet — the same-cycle pairing (SDK 0.5.x ↔ server 0.12.x) remains the tested configuration, and cross-cycle use is unvalidated rather than refused.",
        "**MSRV = Rust 1.86** for every crate in the workspace, declared once in `[workspace.package]` (`rust-version = \"1.86\"`) and inherited workspace-wide; enforced in CI per-crate. Pre-1.0, an MSRV bump may land in any minor release.",
      ],
    },
    { type: "heading", level: 3, text: "Current versions (as of 2026-08-11 — v0.13.0 / R0.12 — Operations Plane)" },
    {
      type: "table",
      head: ["Package", "Registry", "Source", "Version"],
      rows: [
        ["`rusty-agent-runtime`", "crates.io", "`rusty-core/`", "0.12.0"],
        ["`rusty-agent-server`", "crates.io", "`rusty-server/`", "0.12.0"],
        ["`rusty-worker`", "crates.io", "`rusty-worker/`", "0.3.6"],
        ["`rusty-otel`", "crates.io", "`rusty-otel/`", "0.1.7"],
        ["`rusty-eval`", "crates.io", "`rusty-eval/`", "0.1.5"],
        ["`@rusty-runtime/client`", "npm", "`sdks/typescript/`", "0.5.0"],
        [
          "`rusty-agent-runtime` (import: `rusty_client`)",
          "PyPI",
          "`sdks/python/`",
          "0.5.0",
        ],
      ],
    },
    {
      type: "paragraph",
      text: "`rusty-eval` is the newest crate: **Agent TestOps** — versioned evaluation datasets, deterministic assertions over recorded runs, baseline-vs-candidate comparison, statistical regression detection, a model-judge seam, and deterministic release gates, built directly on the executor and the Flight Recorder journal.",
    },
    {
      type: "paragraph",
      text: "**All seven packages are published** — five crates on crates.io, the TypeScript client on npm, the Python client on PyPI — through the repo's Release workflow (see `docs/releasing.md`). The versions above reflect the source manifests.",
    },
    {
      type: "paragraph",
      text: "**Name-collision note (by design):** the Rust core crate and the Python SDK are both published as `rusty-agent-runtime` (crates.io and PyPI respectively). Different packages, independent version numbers; the Python SDK is imported as `rusty_client`.",
    },

    { type: "heading", level: 2, text: "Stability guarantees" },
    {
      type: "callout",
      variant: "quote",
      text: "This document is a contract, not an aspiration: if something is not listed under “stable”, assume it can change in the next minor release.",
    },
    {
      type: "paragraph",
      text: "Stable today — three surfaces, treated as protocol-level (the seven-surface list above is the R1.0 freeze inventory — the plan, not yet the promise):",
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
