---
title: Appendix B · Design-doc index
---

<p class="chapter-eyebrow">Appendix B</p>

# Design-doc index

The repository's `docs/` directory is the design record. From R0.5 onward, each release has a design document that names its lineage, states its rules, and lists what it deliberately leaves out. The earlier releases are covered by the server design and the changelog. This book cites these documents throughout; this page lists them in one place. All links go to the repository.

## Orientation

- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — what Rusty is, the comparison with other frameworks, known limitations
- [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md) — the developer guide: five concepts and the six-stage product path → [Ch. 16](./16-build-an-agent.md)
- [docs/architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/architecture.md) — the anatomy deep-dive: one run through the engine, eight diagrams, named failure modes

## Release designs, in the order they shipped

- [docs/rusty-server-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/rusty-server-design.md) — R0.2 onward: the server's endpoint mapping, SSE semantics, and phases → [Ch. 13](./13-server-sdks.md)
- [docs/flight-recorder-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/flight-recorder-design.md) — R0.5: contracts, determinism seams, the effect journal, exact replay → [Ch. 03](./03-journals.md)
- [docs/durable-work-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/durable-work-design.md) — R0.6: the durable task queue, retry taxonomy, outbox → [Ch. 10](./10-durability.md)
- [docs/agent-fabric-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/agent-fabric-design.md) — R0.7: durable agents, mailboxes, supervision, coordination patterns → [Ch. 08](./08-blueprints-agents.md), [Ch. 11](./11-sub-agents.md)
- [docs/learn-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/learn-design.md) — R0.8: governed memory, the correction loop, candidates, the policy plane → [Ch. 04](./04-memory.md), [Ch. 05](./05-learning-loop.md)
- [docs/capsules-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/capsules-design.md) — R0.9: the capsule manifest, capability host, Cedar, signed receipts, protocol bridges → [Ch. 07](./07-capsules.md)
- [docs/adaptation-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/adaptation-design.md) — R0.10: the runtime digital twin, learned retry and timeout policies, drift detection → [Ch. 05](./05-learning-loop.md)
- [docs/extension-plane-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/extension-plane-design.md) — R0.11: the prompt and configuration registry, the credential broker, OAuth lifecycle
- [docs/operations-plane-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/operations-plane-design.md) — R0.12: run artifacts and the deployment control plane → [Ch. 22](./22-deploy-operate.md)

## The product cycle on main (unreleased)

- [docs/rusty-capability-harness-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/rusty-capability-harness-design.md) — the vocabulary: tools provide action, skills and knowledge provide context → [Ch. 06](./06-skills.md)
- [docs/connector-standard.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/connector-standard.md) — one manifest shape and its rules → [Ch. 09](./09-tools-connectors.md), [Ch. 18](./18-build-a-tool.md)
- [docs/agent-core-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/agent-core-design.md) — the agent core: memory organization, context assembly, tool selection, skill activation → [Ch. 17](./17-build-a-skill.md)
- [docs/gap-ledger-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/gap-ledger-design.md) — the demand-side learning loop: the gap ledger and induction
- [docs/provider-layer-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/provider-layer-design.md) — the provider layer (the `genai` feature), accepted as an R1.0 gate

## Studio

- [docs/studio.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio.md) — the workspace and its destinations → [Ch. 14](./14-studio.md)
- [docs/studio-experience-roadmap.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-experience-roadmap.md) — the experience roadmap
- [docs/studio-1.0-architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-1.0-architecture.md) and [docs/studio-1.0-acceptance.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-1.0-acceptance.md) — route ownership, state boundaries, and the acceptance bar
- [docs/studio-v4-command-center-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-v4-command-center-design.md) and [docs/studio-v4-creation-journey-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-v4-creation-journey-design.md) — the v4 shell and the creation journey
- [docs/studio-release-workspace-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-release-workspace-design.md), [docs/studio-artifact-native-work-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-artifact-native-work-design.md), and [docs/studio-evaluation-experiment-workbench-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-evaluation-experiment-workbench-design.md) — the release, artifact, and evaluation workspace phases
- [docs/evidence/](https://github.com/dev-amjad-shaikh/rusty/tree/main/docs/evidence) — captured feature evidence against the demo server

## Operations and reference

- [docs/server-quickstart.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/server-quickstart.md) — ten minutes over HTTP → [Ch. 15](./15-quickstart.md)
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — the Studio step-by-steps → [Ch. 16](./16-build-an-agent.md)–[18](./18-build-a-tool.md)
- [docs/api/](https://github.com/dev-amjad-shaikh/rusty/tree/main/docs/api) — `openapi.yaml`, OpenAPI 3.1 for the core server surface (56 of 295 routes), and its coverage plan
- [docs/backup.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/backup.md) · [docs/recovery.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/recovery.md) — operational runbooks → [Ch. 22](./22-deploy-operate.md)
- [docs/versioning.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/versioning.md) · [docs/stability.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/stability.md) · [docs/releasing.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/releasing.md) — the compatibility contracts
- [docs/benchmarks.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/benchmarks.md) — what checkpointing costs, measured, and the R0.10 headroom experiment
- [docs/roadmap.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/roadmap.md) — phases, rejections, and what is next → [Appendix D](./appendix-d-roadmap.md)
- [CHANGELOG.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/CHANGELOG.md) — the full history → [Appendix C](./appendix-c-releases.md)

## Research references

- [docs/langgraph_platform_api.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/langgraph_platform_api.md) — the LangGraph Platform HTTP API, used as the design reference for the server
- [docs/rust_server_plugin_patterns.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/rust_server_plugin_patterns.md) — precedent research on plugin patterns for Rust servers
