---
title: 14 · Studio
---

<p class="chapter-eyebrow">Part II · Concepts and internals · Chapter 14</p>

# Studio

Every mechanism in Part II has a human-facing question attached: the journal is evidence, but who reads it? The decision gate holds approvals, but who clicks approve? Candidates promote through envelopes, but who sees the diff? Studio is Rusty's answer — the operator-facing half of the platform, a product workspace that renders the runtime's evidence rather than a parallel model of it.

## The concept: the console is where governance meets a person

Agent frameworks ship playgrounds; platforms ship dashboards. Both tend to make the same mistake: they build a second, denormalized model of the system's state — copied prompts, cached statuses, summary counts — and the copy drifts from the truth it summarizes. When the truth is evidence (hash-chained journals, content-addressed versions), the console's job is narrower and harder: present the evidence, route the human to the one decision that's theirs, and never let a summary approve a mutation.

## Rusty: Studio

Rusty Studio is the local companion of `rusty-agent-server` — when Studio runs, the backend runs on the same machine; there is no server picker and no hosted control plane. `studio/serve.py` hosts the prebuilt React bundle and proxies `/api/*` to the server for same-origin use — no Node.js needed at serve time. One workspace, nine destinations on the left strip (`docs/studio.md`):

- **Home** — the front door: recent runs, the decision gate holding irreversible actions, the agents you own.
- **Agents** — create, configure, test, publish. Creation is a six-step wizard; the builder keeps goal, readiness, model & behavior, instructions, tools, skills, memory, triggers, and evaluation on one canvas with a test rail beside it.
- **Skills** — the governed `SKILL.md` library: compose in place, import a repository, or browse the registry, then attach to any agent.
- **Tools** — the catalog of what agents can call: built-ins, platform tools, connector operations, each carrying its effect class.
- **Connectors** — connect a system once; credentials live in the broker as opaque handles, never raw values, and every operation the manifest names becomes a tool any allowed agent can use.
- **Knowledge** — governed sources an agent reads from, retrieved as cited chunks.
- **Tests** — versioned datasets, experiments, and the release gates an agent's publish is measured against.
- **AI models** — the providers and models the workspace thinks with.
- **Activity** — what got done, where agents wait for a person, what went wrong, and the verifier's own evidence.

Underneath the destinations runs one six-stage lifecycle rail — **Shape → Run → Inspect → Evaluate → Govern → Operate** — and its discipline is the interesting part. The rail derives bounded identities (agent, version, thread, run) from existing workspace state; it *never* copies prompts, payloads, results, credentials, or evaluation inputs into a second model. Inspection becomes available only when a complete exact Recorder envelope proves it; evaluation follows inspection rather than restarting from a catalog screen. The progressive mission dossier under the rail turns the current context into one decision at a time — evidence in hand, proof still missing, the next safe move — and every action still reloads evidence in the destination; nothing approves a mutation from summary state.

That discipline extends to the collaborative surfaces. Team Blueprints (Chapter 08) save reusable team structures with strict, byte-preserving import/export; reopening a blueprint reconciles it against live role and manifest drift; revising creates a *new* blueprint id with a fresh acknowledgement — never a silent mutation of a saved structure. The pattern is the same one the runtime teaches: immutable versions, forward-only pointers, receipts for decisions.

## The design language

Studio renders in the Rusty design language: oxidised dark canvas, glass surfaces, one ember accent, Outfit and IBM Plex Mono. If this book's site looks like a quieter sibling of the product, that's deliberate — the guide borrows the same tokens, because the book and the console are one project speaking to two reading postures.

There's also a debugging genealogy worth knowing: Studio began as a zero-build debug UI — connect, run, stream, inspect checkpoints, fork and replay, walk the Flight Recorder timeline with causal path and branch compare — and the v4 workspace grew around that core. The debug surface is still there under the product shell; the timeline view of a run's journaled evidence is the same journal Chapter 03 describes, rendered.

::: tip Key takeaways
- Studio is the local companion of the server: same machine, same origin, no hosted control plane.
- Nine destinations cover the whole product surface — agents, skills, tools, connectors, knowledge, tests, models, activity, and the decision gate at Home.
- The lifecycle rail derives identities but never copies evidence; summaries never approve mutations.
- Studio's collaboration artifacts (blueprints) follow runtime rules: immutable versions, explicit revision, byte-preserving export.
- The debug lineage — checkpoints, fork/replay, the Flight Recorder timeline — is still the core under the product shell.
:::

**Further reading**

- [docs/studio.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio.md) — the workspace, its views, and its evidence rules
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — step-by-step flows through each destination
- [docs/studio-1.0-architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-1.0-architecture.md) — route ownership, state boundaries, release gates
- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — the screenshot tour
