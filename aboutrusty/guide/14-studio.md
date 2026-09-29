---
title: 14 · Studio
---

<p class="chapter-eyebrow">Part II · Concepts and internals · Chapter 14</p>

# Studio

Every mechanism in Part II needs a person at some point. Someone reads the journal, answers the approval, and decides whether a candidate ships. Rusty Studio is where they do it: the workspace for creating agents, running work with them, seeing what happened, and stepping in when a run waits for a decision. It reads the same server API as the SDKs and renders the runtime's own evidence.

## The concept: the console is where governance meets a person

Agent frameworks ship playgrounds; platforms ship dashboards. Both often build a second copy of the system's state (copied prompts, cached statuses, summary counts), and the copy drifts from what it summarizes. When the underlying record is evidence, such as a hash-chained journal or a content-addressed version, the console has a narrower job. It shows the evidence, routes the person to the decision that is theirs, and loads the real record before it changes anything.

## Rusty: Studio

Studio is the local companion of `rusty-agent-server`. When Studio runs, the server runs on the same machine. There is no server picker and no hosted control plane. `studio/serve.py` serves the prebuilt React bundle (`studio/ui/dist`, built with `npm run build`) and proxies `/api/*` to the server, so the browser talks to one origin and no Node.js process is needed at serve time. `./scripts/dev.sh` builds the bundle when it is missing or stale and starts both on :8100 and :4400. The demo server asks you to sign in with the seeded administrator on first boot (Chapter 15).

The left strip has nine destinations (`studio/ui/src/knot/Knot.tsx`, described in `docs/studio.md`):

| Destination | What you do there |
|---|---|
| **Home** | See recent activity, the runs waiting for you, and the agents you own. Runs paused on an irreversible action show as held at the gate until someone decides. |
| **Agents** | Create, configure, test, and publish agents. Creation is a six-step wizard; the builder keeps goal, readiness, model and behavior, instructions, tools, skills, memory, triggers, and evaluation on one canvas with a test rail beside it (Chapter 16). |
| **Skills** | Manage the governed `SKILL.md` library: compose in place or import, then attach to agents (Chapter 17). |
| **Tools** | Browse what agents can call: built-ins, platform tools, and connector operations, each with an effect class (Chapter 18). |
| **Connectors** | Connect a system once. Credentials live in the broker as opaque handles, and each operation the manifest names becomes a tool (Chapter 18). |
| **Knowledge** | Manage governed sources an agent reads from, retrieved as cited chunks. |
| **Tests** | Keep versioned datasets and experiments, and the release gates a publish is measured against (Chapter 20). |
| **AI models** | Configure the providers and models the workspace uses. |
| **Activity** | See what got done, where agents wait for a person, what went wrong, the task queue, and the verifier's evidence. Opening a run shows its journaled events. |

The rule Studio follows is the one this chapter opened with: every action reloads the real record in its destination before it changes anything. A count on Home points you to a decision; it never approves one.

## The design language

Studio uses the Rusty design language: an oxidised dark canvas, glass surfaces, one ember accent, and the Outfit and IBM Plex Mono typefaces (`studio/ui/src/knot/css/theme-rusty.css`). This site borrows the same tokens.

## Where Studio came from

Studio started in R0.4 as a zero-build, single-file debug UI for the server: connect, run, stream, inspect checkpoint history, fork and replay. R0.5 added a Flight Recorder timeline with causal-path highlighting and branch compare. The current workspace, Studio v4 (unreleased on `main`), replaced that debug UI with the product workspace above. Checkpoint forking and branch diffs are still available through the server API (Chapter 15) and the SDKs. Inside Studio, you inspect a run through its journaled events in Activity and the agent's test rail.

`docs/studio.md` also describes lifecycle-rail and Team Blueprint surfaces from earlier Studio designs. They are not in the current `studio/ui` code, so this chapter does not cover them.

::: tip Key takeaways
- Studio is the local companion of the server: same machine, same origin through `serve.py`'s `/api` proxy, no hosted control plane.
- Nine destinations: Home, Agents, Skills, Tools, Connectors, Knowledge, Tests, AI models, Activity.
- Studio reads the runtime's evidence and reloads the real record before any action.
- Time-travel tools from the original debug UI now live in the server API and SDKs.
:::

**Further reading**

- [docs/studio.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio.md) — the workspace and its destinations
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — step-by-step flows through each destination
- [docs/studio-1.0-architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio-1.0-architecture.md) — route ownership, state boundaries, release gates
- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — the screenshot tour
