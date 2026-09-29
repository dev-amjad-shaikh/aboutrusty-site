---
title: Appendix C · Release history
---

<p class="chapter-eyebrow">Appendix C</p>

# Release history, in short

[CHANGELOG.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/CHANGELOG.md) is the full, authoritative history. This appendix gives one line per release so you can see the order the book refers to. Each platform release has a version (v0.1 to v0.13) and a release name (R0.1 to R0.12). They diverge at v0.5, an SDK and multi-tenancy cycle with no R-number, so R0.5 shipped as v0.6. Packages version independently of both ([docs/versioning.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/versioning.md)); after R0.12 the crates are at 0.12.x.

| Version | Release | Date | Headline |
|---|---|---|---|
| v0.1 | R0.1 · Ignition | 2026-07-31 | `rusty-agent-runtime` 0.1.0: channels and reducers, the super-step executor, in-memory and JSON-file checkpointers, interrupts, `Send`, the prebuilt ReAct agent |
| v0.2 | R0.2 · Persistence | 2026-08-05 | Postgres checkpointer, token streaming, and `rusty-server` 0.1.0 with the Phase A endpoints, SSE, and API-key auth |
| v0.3 | R0.3 · Interop | 2026-08-05 | MCP client, remote nodes and the `rusty-worker` SDK, assistants, crons, and the KV store, executor tracing |
| v0.4 | R0.4 · Time Travel | 2026-08-05 | Fork and replay end to end, WASM nodes, the Postgres server store, `rusty-otel`, the first Studio debug UI |
| v0.5 | (no R-number) | 2026-08-05 | Zero-dependency Python and TypeScript SDKs, multi-tenant auth |
| v0.6 | R0.5 · Flight Recorder | 2026-08-07 | Run and decision events, the hash-chained journal, determinism seams, exact replay, branch diff, portable replay fixtures |
| v0.7 | R0.6 · Durable Work | 2026-08-07 | The durable task queue: leases, the shared retry taxonomy, idempotency keys, the transactional outbox, graceful drain, pools, quotas, version pinning |
| v0.8 | R0.7 · Agent Fabric | 2026-08-08 | Effect kernel v2, the versioned run manifest, durable agents with typed mailboxes, supervision, the cancellation tree, four coordination patterns |
| v0.9 | R0.8 · Rusty Learn | 2026-08-09 | Governed memory, the correction loop, candidates and the promotion gate, the executor policy plane, `rusty-eval` |
| v0.10 | R0.9 · Capsules | 2026-08-09 | WASM capsules with a declared manifest, the capability host, Cedar tenant overlays, signed run receipts, MCP and A2A bridges |
| v0.11 | R0.10 · Adaptation | 2026-08-09 | The headroom experiment, the runtime digital twin, learned retry and timeout policies with `static-v0` as the floor, the drift endpoint |
| v0.12 | R0.11 · Extension Plane | 2026-08-10 | The prompt and configuration registry, admission-time pinning, the credential broker, OAuth lifecycle and middleware composition |
| v0.13 | R0.12 · Operations Plane | 2026-08-11 | Run artifacts with lineage, previews, and retention; deployment revisions, environments, eval-gated canary and shadow, byte-exact rollback |
| — | Unreleased | on `main` | Connectors, skills, knowledge, goals, the gap ledger and induction, repair records, the verifier suite, campaigns, Studio v4 |

The Unreleased cycle has no version yet; it will be versioned and named with the next release. It also raised the MSRV to Rust 1.87 (the `genai` feature needs 1.88 and `capsules` 1.89). The changelog also records an unversioned quality and documentation review pass between R0.5 and R0.6.

Read the table in three blocks. R0.1 to R0.4 built the engine and its interop. R0.5 to R0.7 built evidence and durability: the journal first, then durable work, then agent teams. R0.8 onward added learning, isolation, and operations on top of that evidence. Learning needs recorded evidence to evaluate against, which is why the Flight Recorder came first (Chapter 03).
