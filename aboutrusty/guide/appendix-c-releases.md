---
title: Appendix C · Release history
---

<p class="chapter-eyebrow">Appendix C</p>

# Release history, in short

The full, authoritative history lives in [CHANGELOG.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/CHANGELOG.md) — this appendix is the map, one line per release, so you can see the sequencing logic the book keeps referring to: *evidence before learning, replay before adaptation*. Packages version independently ([docs/versioning.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/versioning.md)); the R-numbers are the platform cycles.

| Release | Name | Shipped | Headline |
|---|---|---|---|
| R0.1 | Ignition | 2026-07-31 | The core kernel: channels, reducers, the super-step executor, checkpoints, interrupts, `Send`, the prebuilt ReAct agent |
| R0.2 | Persistence | 2026-08-05 | Postgres checkpointer, token streaming, server Phase A |
| R0.3 | Interop | 2026-08-05 | MCP client, remote nodes + the worker SDK, server API completion, executor tracing |
| R0.4 | Time Travel | 2026-08-05 | Fork + replay end to end, WASM nodes, Postgres server store, rusty-otel, Studio's first UI |
| — | v0.5 pre-1.0 | 2026-08-05 | Python + TypeScript SDKs, multi-tenant auth |
| R0.5 | Flight Recorder | 2026-08-07 | Canonical run/decision events, the hash-chained effect journal, determinism seams, exact replay, branch diff, portable fixtures |
| R0.6 | Durable Work | 2026-08-08 | The durable task queue: leases, heartbeats, the retry taxonomy, idempotency keys, the transactional outbox, drain, pools, quotas, version pinning |
| R0.7 | Agent Fabric | 2026-08-08 | Durable agent identities, capability manifests, typed mailboxes, supervision, the effect kernel v2, the versioned run manifest |
| R0.8 | Rusty Learn | 2026-08-09 | Governed memory with provenance, the correction loop, candidate distillation, promotion envelopes, rollback by version pointer |
| R0.9 | Capsules | 2026-08-09 | WASM Component Model capsules, the deny-by-default capability host, Cedar policy overlays, signed run receipts, MCP and A2A bridges |
| R0.10 | Adaptation | 2026-08-09 | The runtime digital twin, learned retry/timeout policies through the policy plane, twin-gated promotion, revert-to-floor |
| R0.11 | Extension Plane | 2026-08-10 | The prompt/configuration registry, the credential/connection broker, OAuth lifecycle, admission-time resolution with journaled pins |
| R0.12 | Operations Plane | 2026-08-11 | Content-addressed run artifacts with lineage and retention; deployment revisions, dev/staging/prod environments, canary + shadow wired to eval gates, byte-exact rollback |
| Post-R0.12 | product cycle | on `main` | Schema-driven connectors, governed `SKILL.md` skills, the knowledge plane with cited retrieval, durable goals, the verifier trust suite, intelligence campaigns, Studio v4 — unreleased; crates stay 0.12.x |

Two things to notice reading the table. The first four cycles built the engine and its interop; the next four built evidence and durability *before* learning and isolation — the sequencing rule the Flight Recorder chapter explains; and the last four turned the governed runtime into a product surface. Nothing later could have been honest without R0.5 landing when it did.
