---
title: Appendix B · Design-doc index
---

<p class="chapter-eyebrow">Appendix B</p>

# Design-doc index

The repository's `docs/` directory is the design record — every release has a design document that names its lineage, states its rule precisely, and lists what it deliberately does not build. This book cites them throughout; here they are in one place. All links go to the repository.

## Orientation

- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — what Rusty is, the honest comparison, known limitations
- [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md) — the developer-guide orientation layer
- [docs/architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/architecture.md) — the anatomy deep-dive: one run through the engine, eight diagrams, named failure modes

## Release designs, in the order they shipped

- [docs/flight-recorder-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/flight-recorder-design.md) — R0.5: contracts, determinism seams, the effect journal, exact replay → [Ch. 03](./03-journals.md)
- [docs/durable-work-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/durable-work-design.md) — R0.6: the durable task queue, retry taxonomy, outbox → [Ch. 10](./10-durability.md)
- [docs/agent-fabric-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/agent-fabric-design.md) — R0.7: durable agents, mailboxes, supervision, coordination patterns → [Ch. 08](./08-blueprints-agents.md), [Ch. 11](./11-sub-agents.md)
- [docs/learn-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/learn-design.md) — R0.8: governed memory, the correction loop, the learning loop, the policy plane → [Ch. 04](./04-memory.md), [Ch. 05](./05-learning-loop.md)
- [docs/capsules-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/capsules-design.md) — R0.9: the capsule manifest, capability host, Cedar, signed receipts, protocol bridges → [Ch. 07](./07-capsules.md)
- [docs/adaptation-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/adaptation-design.md) — R0.10: the runtime digital twin, learned mechanical policies, drift detection
- [docs/extension-plane-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/extension-plane-design.md) — R0.11: the prompt/configuration registry, the credential broker, OAuth lifecycle
- [docs/operations-plane-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/operations-plane-design.md) — R0.12: run artifacts and the deployment control plane → [Ch. 22](./22-deploy-operate.md)

## The product cycle on main

- [docs/rusty-capability-harness-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/rusty-capability-harness-design.md) — the tools-action / skills-context vocabulary → [Ch. 06](./06-skills.md)
- [docs/connector-standard.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/connector-standard.md) — one manifest shape, no exceptions → [Ch. 09](./09-tools-connectors.md)
- [docs/studio.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio.md) and the Studio design series (`studio-1.0-architecture`, `studio-v4-*`) — the workspace and its evidence rules → [Ch. 14](./14-studio.md)

## Operations and reference

- [docs/server-quickstart.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/server-quickstart.md) — ten minutes over HTTP → [Ch. 15](./15-quickstart.md)
- [docs/rusty-server-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/rusty-server-design.md) — endpoint mapping, SSE semantics → [Ch. 13](./13-server-sdks.md)
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — the Studio step-by-steps → [Ch. 16](./16-build-an-agent.md)–[18](./18-build-a-tool.md)
- [docs/backup.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/backup.md) · [docs/recovery.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/recovery.md) — operational runbooks → [Ch. 22](./22-deploy-operate.md)
- [docs/versioning.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/versioning.md) · [docs/stability.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/stability.md) · [docs/releasing.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/releasing.md) — the compatibility contracts
- [docs/benchmarks.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/benchmarks.md) — what checkpointing costs, measured
- [docs/api/](https://github.com/dev-amjad-shaikh/rusty/tree/main/docs/api) — the server's HTTP surface as OpenAPI 3.1
- [docs/roadmap.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/roadmap.md) — phases, rejections, and what's next → [Appendix D](./appendix-d-roadmap.md)
- [CHANGELOG.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/CHANGELOG.md) — the full history → [Appendix C](./appendix-c-releases.md)
