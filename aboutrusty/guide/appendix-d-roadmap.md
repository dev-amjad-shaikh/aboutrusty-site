---
title: Appendix D · Where it's going
---

<p class="chapter-eyebrow">Appendix D</p>

# The roadmap pointer

This book deliberately ends here. The roadmap is a living document — [docs/roadmap.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/roadmap.md) — and anything this appendix froze into prose would be stale within a cycle. What follows is the durable shape, not the schedule.

**R1.0 — Unleashed** is the only upcoming track, and it's directional, not scheduled. The headline items: a clustered executor (failover for the super-step loop, durable queues with autoscaling — today's executor, queue, and persistence are single-node by design), graphs running on a WASM target for browser and edge, an OpenAPI description of the full server surface with generated clients, a core-crate decomposition along the `rusty-api` ABI, and the maturity gates: an independent security review, a documented capacity envelope, and production-shaped case studies.

**Explicitly rejected** — the roadmap says no, in writing, so the book records it too: PyO3 / napi-rs native bindings and a `cdylib` / C ABI. The HTTP/SSE server is the polyglot interop layer; that's a commitment, not a gap.

The questions the platform has already answered — durability, evidence, governed learning, isolation, deployment — are what Parts II and III of this book cover. If you're evaluating Rusty against a roadmap item that matters to you, read the source document; if the item you need is in the rejected list, the rationale is written down there too, and it won't change quietly.
