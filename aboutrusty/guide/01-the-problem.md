---
title: 01 · The problem — why agents need a runtime
---

<p class="chapter-eyebrow">Part I · Orientation · Chapter 01</p>

# The problem: why agents need a runtime

An agent loop is small. Call a model with the conversation so far. If the model asks for a tool, run it, append the result, and call the model again. Stop when it stops asking. You can write this in an afternoon, and it works for a demo.

Then it has to run as a product. A job crashes forty minutes in. Someone asks why the agent emailed an invoice. An approver answers a pending decision on Tuesday, and the server has restarted twice since Friday. A new prompt needs to go to five percent of traffic with a way back. The model is not the problem in any of these cases.

This chapter groups those problems into five questions. Any system that runs agents in production answers all five. You can answer them once, in a runtime, or piecemeal in application code as incidents arrive.

## The five questions

### 1. Building the model's input

The model knows only what you put in the prompt: the conversation, the agent's instructions, the tools on offer, memories retrieved for this user, summaries of earlier work, and the merged output of parallel branches. Context assembly is a data-flow problem with a token budget, and many agent bugs start here. If two parallel branches both write `messages` and nothing arbitrates, one write wins silently and the conversation is corrupted a few steps later.

A runtime treats this as a systems problem. State needs a schema. Concurrent writes need merge rules (reducers) and a defined outcome when two writers collide. Retrieval must be reconstructible afterward: what the model saw cannot depend on re-running a query against a store that has changed since.

### 2. Authorizing and executing what the model asks for

The model emits JSON that says to call `send_email` with some arguments. Between that string and the side effect you need policy. Is this agent allowed this tool? Is the tool allowed to reach this host? Does a human approve first? Whose credentials does the call carry?

Frameworks usually leave this to your wrapper code. Hosted platforms authenticate who may call the deployment, which says nothing about what the agent may do once running. The failure case is ordinary: a capable model, a broad toolset, and one prompt injection. Authorization has to be structural, so that an undeclared capability is unavailable rather than discouraged in a system prompt.

### 3. Keeping the account

When the agent does something surprising, someone asks what happened. They need the actual sequence: which model call, with which prompt, produced which tool call, with what result and cost, caused by which earlier event. If you ever want to evaluate a new policy against logged decisions, the off-policy evaluation literature adds a requirement: the log must record the set of legal actions and the probability of the action taken, at decision time.

Logs you grep do not meet that bar. The account needs to be append-only, tamper-evident, replayable, and written by the component that executes the work. A separate telemetry pipeline can disagree with what actually ran.

### 4. Surviving time

Demos are short and synchronous. Products are neither. Processes crash, machines get rescheduled, and a human approval can take a week that spans two deploys. Keeping run state in memory loses it on restart. A job queue tracks the job, not the run's internal state. Catching an exception does not model the common case, which is a run that is healthy and waiting.

Durable execution engines such as Temporal solved the general version: persist the workflow history and replay it on recovery. Agents need a variant. An agent's state includes the conversation, tool outputs, and branch results. Replaying an agent must serve recorded model and tool calls, because re-issuing them costs money and returns different answers. So agent durability needs a checkpoint at every step boundary plus a record detailed enough to re-drive from.

### 5. Changing it safely

The agent you ship is not the agent you run three months later. Prompts change, models change, and users correct the agent and expect the correction to stick. Editing a config file and restarting gives you no candidate, no evaluation, no attribution, and no rollback short of a restore. Versioned deployments cover code and say nothing about learned behavior.

Governed change means a change is proposed as an immutable candidate, evaluated against recorded evidence, promoted within declared limits, and reversible in one operation. That is release engineering applied to agent behavior.

## What the field does today

Each existing category answers some of the five questions well.

**Agent frameworks** (LangChain, LangGraph, the Rust frameworks) answer question 1 in part. State channels with reducers are LangGraph's core contribution, along with super-step parallelism and checkpoints that give durability, human-in-the-loop, and time travel from one primitive. Rusty adopts that execution model. The README states the reason: the model is proven, and Rusty offers it without operating a Python service.

**Hosted platforms** (LangGraph Platform and similar) answer question 4 operationally, since persistence is managed for you, and question 5 for code deployments. The trade is control. The record, the policy layer, and any learning loop live in the vendor's service.

**Durable execution engines** answer question 4 in general but know nothing about models: no context assembly, no tool authorization, no decision records. Teams that combine one with an agent framework maintain the integration themselves.

**Application code** gets whatever is left, and answers it inconsistently.

## Rusty's answer

Rusty answers all five questions in one engine, and the same few mechanisms recur across them.

| Question | Rusty's mechanism | Where it is covered |
|---|---|---|
| Build the model's input | Schema-declared state channels with reducers; governed memory with scopes, provenance, and token-bounded assembly | [Ch. 02](./02-mental-model.md#five-concepts), [Ch. 04](./04-memory.md) |
| Authorize and execute | Capability manifests, a tool executor that contains failures per call, capsules where an ungranted import does not exist | [Ch. 07](./07-capsules.md), [Ch. 09](./09-tools-connectors.md) |
| Keep the account | The Flight Recorder: a hash-chained journal of every run, and exact replay from it | [Ch. 03](./03-journals.md) |
| Survive time | A versioned checkpoint at every super-step boundary; an interrupt is a state the run parks in | [Ch. 02](./02-mental-model.md#one-run-end-to-end), [Ch. 10](./10-durability.md) |
| Change it safely | Immutable candidates, replay-backed evaluation, promotion envelopes, rollback by pointer | [Ch. 05](./05-learning-loop.md) |

The checkpoint row makes the others cheaper. When every step boundary persists state and the journal records how that state came about, resume starts from the latest checkpoint, replay walks the recorded sequence, a fork branches it, human-in-the-loop is a checkpoint waiting on input, and evaluating a candidate reuses replay.

The README lists what Rusty does not do yet. The executor is single-node: remote nodes distribute node work, but the executor itself is not clustered and has no failover. Persistence is in memory, JSON files, or Postgres, with no replication. Checkpoints happen at step boundaries, so a resumed node re-executes from its start and must be idempotent. If you need a managed multi-region control plane today, the README points you to LangGraph Platform.

::: tip Key takeaways
- An agent loop is easy. A product also has to answer five questions: context assembly, authorization, the account, time, and change.
- Frameworks, hosted platforms, and durable execution engines each answer a subset; the rest lands in application code.
- Rusty answers all five in one engine, and checkpoints plus the journal do most of the work.
- Rusty is v0.x with a single-node executor and no replication, and the README lists these limits.
:::

**Further reading**

- [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md): what Rusty is, and the product-building path
- [docs/architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/architecture.md): how one run flows through the engine
- [docs/learn-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/learn-design.md): the argument for learning from recorded evidence, with its research lineage
- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md): the comparison table and "Production readiness — known limitations"
