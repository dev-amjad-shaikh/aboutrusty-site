---
title: Appendix D · Where it's going
---

<p class="chapter-eyebrow">Appendix D</p>

# The roadmap pointer

The roadmap is a living document: [docs/roadmap.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/roadmap.md). Anything this appendix copied would go stale within a cycle, so it records only the shape. Read the source for current status.

**R1.0 · Unleashed** is the next release track, the stable platform. Its items:

- **Stability.** Stable public APIs, event schema, checkpoint format, capsule manifest, and migration policy.
- **Clustered execution.** Executor failover and a distributed durable queue with autoscaling. Today the executor, queue, and persistence are single-node. The roadmap calls this the last architectural gap to a horizontally scalable runtime and the R1.0 critical path.
- **Core decomposition and a spec-first API.** Split `rusty-agent-runtime` along the `rusty-api` ABI (engine, effects, evidence, learning), and publish an OpenAPI description of the server with generated, versioned clients. A hand-written OpenAPI 3.1 spec of the core surface (56 of 295 routes) already exists at `docs/api/openapi.yaml`; generating it from code is R1.0 work.
- **Provider breadth by integration.** Integrate an external provider and vector layer instead of hand-building adapters, with Rusty's receipts and effect governance carried into those calls.
- **Maturity gates.** An independent security review, a documented capacity envelope with supported deployment topologies, at least three production-shaped case studies (durability, multi-agent coordination, sandboxed execution), and no unresolved critical CI, data-loss, replay-integrity, or tenant-isolation defect.
- **Also in scope.** A hosted multi-tenant control plane and graphs on a WASM target for browser and edge. Registry publishing to crates.io, npm, and PyPI is already done.

[docs/stability.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/stability.md) lists the gates that must close before 1.0. After R1.0 the roadmap lists candidate breadth planes, such as realtime sessions and enterprise administration, as under consideration.

**Explicitly rejected.** The roadmap says no, in writing, to PyO3 and napi-rs native bindings and to a `cdylib` / C ABI. The HTTP/SSE server is the interop layer for other languages (Chapter 13).

Parts II and III of this book cover what the platform already does: durability, evidence, governed learning, isolation, and deployment. If you are evaluating Rusty against a roadmap item, read the source document. If the item you need is on the rejected list, the reasoning is written there too.
