---
title: 01 · The problem — why agents need a runtime
---

<p class="chapter-eyebrow">Part I · Orientation · Chapter 01</p>

# The problem: why agents need a runtime

An agent, stripped to its skeleton, is embarrassingly small. Call a model with the conversation so far. If the model asks for a tool, run the tool, append the result, call the model again. Stop when it stops asking. A competent engineer writes this loop in an afternoon, and for a demo it works beautifully.

Then it has to be a product. A customer runs it and the process crashes forty minutes into a job. A regulator asks why the agent emailed that invoice. A human approver gets around to the pending decision on Tuesday, and your server restarted twice since Friday. Marketing wants the new prompt rolled out to five percent of traffic, with a way back. None of these are model problems. The model was fine all along.

This chapter is about those questions. We count five, and our claim is simple: any system that runs agents for real has to answer all five, and the only question is whether you answer them once, in a runtime, or accidentally, in application code, one incident at a time.

## The five questions

### 1. How do you build the model's input?

Everything the model knows, it knows because you put it in the prompt. The conversation, sure — but also the agent's instructions, the tools on offer, the memories retrieved for this user, the summaries of what happened last week, the output of three parallel branches that need merging into one coherent state. Context assembly is a data-flow problem with a token budget, and it is where most agent bugs live. Two branches of a parallel fan-out both write `messages`? Congratulations, one of them silently won, and you'll find out from a corrupted conversation three steps later.

A runtime treats this as a systems question. State needs a schema. Concurrent writes need merge rules — reducers — and a discipline for what happens when two writers collide. Retrieval needs to be reconstructible afterward: "what did the model actually see" cannot depend on re-running a query against a store that has since mutated.

### 2. How do you authorize and execute what the model asks for?

The model emits JSON that says "call `send_email` with these arguments." Somewhere between that string and the side effect, you need policy: is this agent allowed this tool? Is this tool allowed this egress? Does a human need to approve first? What credentials does the call carry, and whose?

Frameworks mostly leave this to you — wrap your function, check something, hope. Managed platforms gate the account level, which stops strangers from using your deployment but does nothing about what the agent itself may do. The failure mode we're guarding against is not exotic: a capable model, a broad toolset, and one prompt injection away from an action you'd have to explain. Authorization has to be structural — denied by construction unless declared — not a convention in a system prompt.

### 3. How do you keep the account?

When the agent does something surprising — and it will — someone asks what happened. Not the vibe of what happened: the actual sequence. Which model call, with which prompt, producing which tool call, with what result, at what cost, caused by which earlier event. The off-policy evaluation literature has a harder version of this requirement: if you ever want to compare a new policy against the one that logged your data, the log must carry the legal action set and the propensity of the action taken, recorded at decision time, never reconstructed.

So the account is not logs. Logs are a debugging aid you grep. The account is evidence: append-only, hash-chained, replayable, and written by the same component that executes the work — because a parallel telemetry system will quietly disagree with reality exactly when you need it most.

### 4. How do you survive time?

Demos are synchronous and short. Products are neither. Runs crash. Machines get rescheduled. A human approval takes a week, and in that week you ship two deploys. The naive answers all leak: keep it in memory (lost on restart), keep it in a job queue (the job is the queue's idea of work, not the run's), catch the exception (the interesting case isn't an exception, it's a suspension — a run that is fine, merely parked).

Durable execution engines — Temporal is the one everyone knows — solved the general version of this years ago: persist the workflow's history, replay it on recovery. Agents need the same trick with a twist. An agent's state is not just program counters; it's the conversation, the tool outputs, the branch results. And "replay" for an agent has to be able to re-serve recorded model and tool calls, because re-issuing them costs money and changes answers. Durability for agents is a checkpoint at every step boundary plus evidence good enough to re-drive from it.

### 5. How do you change it safely?

The one certainty is that the agent you ship is not the agent you run in three months. Prompts get tuned. Models get swapped. A user corrects the agent and you'd like that correction to stick. The framework answer — edit a config file, restart — has no candidate, no evaluation, no attribution, and no way back short of a database restore. The managed-platform answer versions your deployment, which helps with code and says nothing about learned behavior.

The question is whether change is a governed transition or an act of hope. Governance means: a change is proposed as an immutable candidate, evaluated against recorded evidence, promoted inside a declared envelope, and reversible in one operation. That is release engineering, applied to behavior.

## What the field does today

These five questions are not our invention, and the honest survey shows every existing system answering some subset well.

**Agent frameworks** (LangChain, LangGraph, the Rust frameworks) answer question 1 partially — state and reducers are LangGraph's core contribution — and question 2 barely. LangGraph deserves the credit it gets: state channels with reducers, super-step parallelism, and checkpoints that fold durability, human-in-the-loop, and time travel into one primitive. Rusty exists because that execution model is proven and we wanted it without operating a Python service.

**Managed platforms** (LangGraph Platform and its peers) answer question 4 operationally — persistence is someone else's problem — and question 5 for code deployments. You rent the runtime. The trade is control: the evidence plane, the policy plane, and the learning loop live in their service, shaped their way.

**Durable execution engines** answer question 4 in full generality but know nothing about models: no context assembly, no tool authorization, no decision evidence. Teams wire the two together and end up maintaining the seam.

**Your application code** is where the unanswered questions go, and it answers them the way application code always does: inconsistently, under time pressure, one incident at a time.

## Rusty's answer

Rusty is the position that these five questions share one implementation. Not five subsystems with five config formats — one engine where the same mechanism keeps recurring, because the questions turn out to be the same question wearing different hats.

| The question | Rusty's mechanism | Deep dive |
|---|---|---|
| Build the model's input | Schema-declared state channels with reducers; governed memory with scopes, provenance, and token-bounded assembly | Ch. 02, and Part II |
| Authorize and execute | Capability manifests, a tool executor that isolates failures, WASM sandboxing, structural denial | Part II |
| Keep the account | The Flight Recorder: a hash-chained journal of every run, exact replay from evidence | Part II |
| Survive time | A versioned checkpoint at every super-step boundary; interrupt is a state, not an exception | Ch. 02, and Part II |
| Change it safely | The learning loop: immutable candidates, replay-gated evaluation, promotion envelopes, one-step rollback | Part II |

The checkpoint row deserves the emphasis, because it is the one that makes the others cheap. When every step boundary persists state *and* the journal records how that state came to be, resume is starting from the latest checkpoint, replay is walking the sequence, forking is branching it, human-in-the-loop is a checkpoint with a pending question, and a learning candidate's evaluation is a replay with the policy swapped. One primitive, five features that are usually five products.

This is also where we're honest about scope. Rusty's executor is single-node — remote nodes distribute node *work*, but the executor itself is not clustered. Persistence is single-node: memory, JSON files, or Postgres, no replication. These are stated limitations, not oversights, and the README keeps the full list current. If you need a managed multi-region control plane today, the honest comparison points at LangGraph Platform. If you want to own the runtime — the evidence, the policy, the learning loop — as one static binary, keep reading.

::: tip Key takeaways
- An agent loop is an afternoon's work; a product has to answer five questions the loop doesn't: context assembly, authorization, evidence, time, and change.
- Every existing system answers a subset — frameworks, managed platforms, durable execution engines — and the unanswered remainder lands in your application code.
- Rusty's bet: one engine answers all five, and the checkpoint-plus-journal primitive does most of the work.
- Rusty is single-node and v0.x; the limitations are stated, not hidden.
:::

**Further reading**

- [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md) — what Rusty is precisely, and the product-building path
- [docs/architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/architecture.md) — the anatomy deep-dive this chapter gestures at
- [docs/learn-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/learn-design.md) — the evidence-native learning argument, with its research lineage named
- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — the honest comparison and the known-limitations list
