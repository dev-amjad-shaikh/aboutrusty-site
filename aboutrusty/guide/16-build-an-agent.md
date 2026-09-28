---
title: 16 · Build an agent end to end
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 16</p>

# Build an agent end to end

"Build an agent" in Rusty can mean two things, and a real product usually does both: **the graph** — the compiled program, written in Rust — and **the agent** — the configured, governed identity around it, assembled in Studio. This chapter walks both, in the order that works, which is also the order `docs/building-agentic-products.md` lays out: model the graph locally, make it durable, serve it, drive it from your product, then observe and gate it.

## Stage 1: model the graph locally

Start from the prebuilt ReAct agent and the examples, not from a blank file. `rusty-core/examples/` has five runnable programs: `react_agent` (scripted model, zero network), `parallel_fanout` (dynamic fan-out via `Send`), `human_in_loop` (interrupt + resume from a JSON-file checkpointer), `react_record_replay` (journal a run, replay it with zero outbound calls), and `live_agent` (a real OpenAI-compatible endpoint).

```bash
cd rusty-core
cargo run --example human_in_loop
```

When you outgrow the prebuilt loop, write the graph yourself. The discipline from Chapter 02 applies: channels with reducers, nodes as async closures over immutable snapshots, `compile()` validating topology before anything runs. And one habit that pays for itself immediately — **test against a scripted model first**. A scripted `ChatModel` is deterministic, offline, and free; your graph's routing, reducers, and interrupts are all testable before you spend a token on a live endpoint. Swap in `OpenAiCompatibleClient` when the shape is right.

## Stage 2: make it durable

Durability is one constructor argument: swap `InMemoryCheckpointer` (dev/test — loses state on restart, and says so) for `JsonFileCheckpointer`, or `PostgresCheckpointer` behind the `postgres` feature. Same code path, no graph changes.

This is also the stage where you place interrupts deliberately. Approvals, budget limits, missing-input cases — anywhere a run should park and wait for the world. The pattern never changes: check `ctx.resume_value()` first, interrupt only when the answer isn't there yet, and keep everything before the interrupt idempotent, because resume re-executes the node from its start. Get this right and a run you can interrupt for a week is not a special case; it's the normal case.

## Stage 3: serve it

Move the graph into a `main.rs` that calls `rusty_agent_server::serve` — Chapter 15's quickstart is the template. You get threads, three run modes, SSE streaming, checkpoint history, fork + replay, crons, KV, and auth as one static binary. Stage 4 follows naturally: drive it from your product with the Python or TypeScript SDK (Chapter 13) — create threads, stream runs, resume interrupts from wherever your application lives.

## Stage 5: the agent around the graph

Now the Studio half — the governed identity a team operates day to day (`docs/how-to.md`). Creation is a six-step wizard, and you can click back to any earlier step:

1. **Template.** *Blank agent* starts empty; the starting templates (data analyst, coding agent, research assistant) pre-fill instructions, a starter tool set, a goal, and a reasoning-steps budget.
2. **Identity.** Name, `@handle` (how runs and evaluations refer to the agent), description, color, icon.
3. **Goal.** One sentence a teammate could verify, plus a primary metric and target. The goal is measured two ways: live, on the agent's runs over a rolling seven days; and on publish, where test suites gate activation.
4. **Instructions.** The system prompt — who the agent is, how it works, what it must never do. This is the behavior contract; everything else is plumbing.
5. **Model & tools.** Pick the model, then the tools it may call. Each tool carries an effect class, so the runtime knows what it's allowed to do without asking a person.
6. **Review and save.** The agent lands as a **draft**.

The builder then keeps everything on one canvas — goal, readiness, model & behavior, instructions, tools, skills, memory, triggers, evaluation — with a test rail beside it that runs the agent against real tool calls. The **readiness** card is the honest part: it lists exactly what separates the draft from publish (set a goal, attach a skill, add a trigger, pass an evaluation goal). Publish when readiness is clean; every publish is measured against the test suites.

## The loop you'll actually live in

In practice, building an agent is a cycle, not a ladder: adjust instructions → run it in the test rail → read the journal timeline when it misbehaves → add the failing case to a dataset → publish behind the gate. Chapters 17 through 21 give each spoke its due — skills, tools and connectors, memory, evaluation, observability. The spine is already familiar: everything the agent does is checkpointed and journaled, so every iteration starts from evidence rather than vibes.

::: tip Key takeaways
- Graph first, locally, against a scripted model — then durability as a constructor swap, then the server, then the SDK.
- Interrupts are placed deliberately: `resume_value()` first, idempotent prefix, no exceptions.
- In Studio, the wizard produces a draft; the readiness card and the test rail stand between draft and publish.
- The working loop is instructions → test → journal → dataset → gated publish.
:::

**Further reading**

- [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md) — the six-stage product path
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — the Studio flows, with screenshots
- [rusty-core/examples/](https://github.com/dev-amjad-shaikh/rusty/tree/main/rusty-core/examples) — the five runnable starting points
- [docs/server-quickstart.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/server-quickstart.md) — the serving stage in detail
