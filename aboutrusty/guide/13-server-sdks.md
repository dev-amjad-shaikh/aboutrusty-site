---
title: 13 · The server & the SDKs
---

<p class="chapter-eyebrow">Part II · Concepts and internals · Chapter 13</p>

# The server & the SDKs

Rusty Core has no HTTP. That sentence from Chapter 02 is a design commitment, and this chapter is about its other half: the server is the one network face of the platform, and everything that isn't Rust — your product backend, your data tooling, your front end — talks to it over HTTP and SSE. No PyO3, no napi-rs, no C ABI; those were considered and rejected. One protocol, tested once, spoken by everything.

## The concept: one wire, many languages

Polyglot interop for a native library has three classic shapes. Native bindings put every consumer language inside your process — fast, and a maintenance nightmare multiplied by each language's packaging story. A C ABI is the lowest common denominator with all the safety margins removed. A network protocol costs you a serialization boundary and buys you everything else: one implementation, one conformance target, and clients in any language that can open a socket — verified against the real server, not against a mock of it.

Agent systems have converged on what to expose: threads, runs, streaming. LangGraph Platform's API is the reference shape; Rusty implements an Agent-Protocol subset of it, so the mental model transfers and the SDK calls read the way you'd expect.

## Rusty Server: the resource model

`rusty-agent-server` is an axum *library* crate — you call `rusty_agent_server::serve(registry, config)` from your own `main.rs`, register your compiled graphs, and deploy the result as one static binary. It adds nothing to execution semantics; it exposes them. A run request authenticates, schedules against a per-thread slot, and drives the same `Executor` over the same checkpointer, translating graph events into SSE frames as it goes.

| Resource | What it is |
|---|---|
| **Threads** | A session bound to a registered graph; namespaces all checkpoints. `GET /threads/{id}/state`, `POST .../history`, `POST .../fork` expose the checkpoint log directly. |
| **Runs** | One execution of the thread's graph. Three submission modes: background (`202` + run id), blocking (`runs/wait`), streaming (`runs/stream`). |
| **Assistants** | Named graph aliases with config metadata; a run can reference `assistant_id` and inherit its recursion limit. |
| **Crons** | Recurring runs of a graph on an interval or a five-field cron expression. |
| **KV store** | Namespaced JSON documents (`PUT/GET/DELETE /store/{ns}/{key}`) for application state that isn't graph state. |

Beyond the core five, the same surface carries the later planes: run journals and fixture download (Chapter 03), replay and branch diff endpoints, signed receipts (`GET /runs/{id}/receipt`, `POST /receipts/verify`), connectors, skills, memory, and evaluation. `GET /info` is the introspection endpoint — version, checkpointer backend, registered graphs with their channels — and it's what Studio boots against. The full surface is published as an OpenAPI 3.1 spec under `docs/api/`.

## The two rules worth remembering

**One active run per thread.** Concurrency on a thread is a single rule enforced by the `RunManager` (`rusty-server/src/runs.rs`): a second submission on a busy thread is either rejected with 409 (`multitask_strategy: "reject"`) or appended to a per-thread FIFO that drains as runs finish (the default `enqueue`, depth-capped). Two writers on one conversation is not a race the platform tolerates.

**SSE frames are resumable.** Frame ids have the form `{checkpoint_id}:{step}:{seq}`. The attach endpoint `GET /runs/{id}/stream` honors `Last-Event-ID` by replaying the run's bounded event log from that sequence and then following the live broadcast — a dropped connection resumes where it left off. The run-create endpoint deliberately ignores the header: a fresh run starts a fresh frame sequence.

Persistence defaults to JSON files on local disk; the `postgres` feature moves checkpoints and the whole platform surface into auto-migrated Postgres tables. `docs/server-quickstart.md` walks the whole surface in ten minutes — create, interrupt, resume over SSE, fork, replay, journal inspection — with real request and response bodies.

## The SDKs: thin and verified

Two clients, both zero-dependency, both thin over the wire protocol:

- **Python** — `pip install rusty-agent-runtime`, imported as `rusty_client` (`sdks/python/`, on PyPI).
- **TypeScript** — `npm install @rusty-runtime/client` (`sdks/typescript/`, on npm).

Thin is the design: no codegen, no native modules, so what you can do from Rust you can do from any language with an HTTP client. The confidence comes from how they're tested — each SDK has an e2e suite that boots the real server binary and drives it. The SDKs don't reimplement semantics; they expose them, and the e2e harness keeps that honest. (One telling detail from the git history: when the demo server hardened its auth defaults, the SDK e2e harnesses had to opt back into dev mode explicitly — the suites assume nothing about the server they boot.)

```python
from rusty_client import RustyClient

client = RustyClient("http://127.0.0.1:8100")
thread = client.threads.create(graph="publisher")
run = client.runs.stream(thread["thread_id"], input={"messages": [...]})
for event in run:
    ...  # SSE frames: metadata, updates, values, messages
```

## What this layer is for

If you're embedding agents inside a Rust service, skip the server entirely — the core is the product. The server exists for everything else: multi-tenant APIs for web and mobile clients, the Studio workspace, SDK-driven product code, and the operational surface (crons, KV, receipts) that a product around agents inevitably needs. Part III's quickstart starts here, because ten minutes with the server teaches the platform's shape faster than any chapter.

::: tip Key takeaways
- The server is a library crate; your `main.rs` calls `serve(registry, config)` and ships as one static binary.
- The resource model is threads / runs / assistants / crons / KV, plus journals, replay, receipts, connectors, skills, memory, and evaluation on the same surface.
- One active run per thread; SSE streams resume via `Last-Event-ID`.
- The SDKs are zero-dependency and e2e-verified against the real server binary — thin by design.
- The full API is published as OpenAPI 3.1 in `docs/api/`.
:::

**Further reading**

- [docs/server-quickstart.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/server-quickstart.md) — zero to interrupt/resume over HTTP in ten minutes
- [docs/rusty-server-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/rusty-server-design.md) — endpoint mapping and SSE semantics
- [docs/api/](https://github.com/dev-amjad-shaikh/rusty/tree/main/docs/api) — the OpenAPI 3.1 spec
- [sdks/python/](https://github.com/dev-amjad-shaikh/rusty/tree/main/sdks/python) and [sdks/typescript/](https://github.com/dev-amjad-shaikh/rusty/tree/main/sdks/typescript) — the clients
