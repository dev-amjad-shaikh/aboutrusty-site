---
title: 08 · Blueprints & agents
---

<p class="chapter-eyebrow">Part II · Concepts and internals · Chapter 08</p>

# Blueprints & agents

Everything in the book so far has been about *runs*: graphs executing, checkpointing, journaling. But a product doesn't think in runs. It thinks in *agents* — the researcher, the triager, the accounts-payable clerk — durable identities that survive redeploys, hold state across days, receive work while they're not running, and answer for what they did. This chapter is about giving agents that existence: identity, declared capability, and the catalog packaging that makes an agent definition something you can version, ship, and roll back. The coordination patterns — delegation, fan-out, race, quorum — get their own chapter (11); this one is about what an agent *is*.

## The concept: identity beyond the process

The distributed-systems lineage here is the actor model, and specifically the Orleans insight: an actor's identity should be names and records, not a live process — so identity survives crashes and redeploys without a directory service. Erlang gives actors per-process FIFO mailboxes in memory; Orleans gives virtual actors that activate on demand. Agent frameworks mostly give you neither: an "agent" is a prompt and a loop, its identity is whatever variable holds it, and if two things need to talk to it concurrently you invent the discipline yourself.

What a durable agent needs is a short list: a stable identity scoped to a tenant, private state that outlives any process, a mailbox that accepts work while the agent is down, declared limits on what it may touch, and supervision when it starts failing. The Agent Fabric (R0.7) builds exactly that, on primitives the earlier chapters already covered — which is the point. As with memory and learning, the argument is that the runtime already holds every piece.

## Rusty: an agent is a triple

An agent is (`docs/agent-fabric-design.md`, `rusty-core/src/agents.rs`):

1. **A stable `AgentId`**, tenant-namespaced like every other server id — `{tenant}/researcher-7` inherits the v0.5 isolation model unchanged; cross-tenant agents resolve to nothing.
2. **A thread** holding its private state, by the convention `thread_id == agent:{agent_id}`. Not a new store: the checkpointer, time travel, and fork-on-replay work on agent state unmodified, because an agent's memory of itself is just a checkpoint log.
3. **A versioned `CapabilityManifest`** — the declaration that makes everything else enforceable.

The manifest carries: `agent_kind` (the graph plus config the agent runs, as the server's assistant registry already models it); `manifest_version`, an *exact* version string — a team started against `researcher/1.4.0` pins its mailbox traffic and delegated tasks to that manifest, so a mid-team redeploy never changes semantics under an in-flight coordination (semver ranges are deferred; exact match is the only rule that cannot surprise); `accepts`, the message kinds the mailbox takes, each with an optional JSON Schema validated at submission, so an unacceptable message fails fast instead of dead-lettering after three retries; `scopes`, the declared `StateScope`s the agent may read and write, journaled at spawn and checked at every access; and `budget`, an agent-level ceiling on tokens, cost, and deadline.

## The mailbox is an addressing discipline

The genuinely opinionated decision: a mailbox is **not a new queue**. It is an addressing discipline on the durable task queue from R0.6 — `recipient = agent:{agent_id}` on a task envelope. The rejected alternatives say why: a pool per agent turns static deployment config into per-agent config; a separate mailbox table duplicates leases, retries, the dead-letter queue, quotas, deadlines, and the outbox — every mechanism the queue already proved against real SIGKILLs. One substrate, one set of invariants.

The one genuinely new mechanism is the **activation lease**: a per-agent record, renewed by heartbeat, that guarantees at most one activation of an agent at a time across all workers. A host claims the lease, drains the mailbox one message at a time, and settles each before claiming the next; a host that dies stops heartbeating, the lease expires, and another host re-activates the agent from its thread's latest checkpoint.

The honest edge on ordering: the runtime promises **turn-sequential processing** and approximate FIFO on the happy path — not total order. A retry-scheduled message re-enters visibility behind later messages. Applications needing strict order carry a sender-side sequence number; the envelope records `sender` and `parent`, so out-of-order handling is detectable in evidence. This is Orleans' promise shape, deliberately weaker than Erlang's per-process FIFO, because durability — not process memory — is the mailbox.

## State scopes and supervision

The four `StateScope`s map onto stores that already exist: **Private** is the agent's own thread (the checkpoint log *is* the private state); **Team** is a shared thread written only through mailbox-driven turns, so every mutation has a journaled author — shared mutable team state outside the turn discipline is simply not offered, because that's the shared-state bug class the channel/reducer model was built to kill; **User** and **Tenant** are the server's namespaced KV store. Two rules keep it honest: access is checked against the manifest's declared scopes before any I/O (the same shape as an undeclared channel write failing at the barrier), and every cross-scope access is journaled with its effect class. Chapter 04's memory scopes are this taxonomy extended by one member.

Supervision watches three signals that are already durable records — classified task failures on the agent's mailbox, activation-lease liveness, deadline breaches — and restarts or escalates accordingly. A crash-looping agent's attempt history is durable evidence, which is why Chapter 05's learning loop can consume it directly.

## Blueprints and the catalog: agents as versioned packages

Declaring one agent is the manifest. Declaring *reusable* agents — and teams, and tool sets — is the catalog's job (`rusty-core/src/package.rs`). Every catalog item — connector, tool pack, skill pack, **blueprint template** (`PackageKind::BlueprintTemplate`) — ships as one package with a manifest that is the authoritative contract: what the package registers, what it requires, what it may reach. A package attempting a registration or an egress destination absent from its declaration is refused. The manifest's content hash is its durable identity, and files land in the content-addressed blob store keyed by their own SHA-256, so every installed version remains retrievable for rollback and audit without duplication.

A blueprint template is the catalog form of a reusable agent or team structure: the graph kind, the roles, the scopes, the manifest pins — the shape of an agent you can stamp out more than once, versioned like everything else. Studio's Team Blueprint shelf is the working surface for this: a saved team topology you reopen, reconcile against live role and manifest drift, and version forward — revisions create new blueprint ids rather than mutating saved ones, and import/export is a strict, bounded `rusty.team-blueprint/v1` document. One scoping honesty worth keeping: Studio blueprints are connection-scoped browser artifacts today, not server-side catalog items — the catalog package kind is the runtime-side contract, and the two meet where a blueprint gets published.

Versioning throughout is the same doctrine the rest of the platform uses: exact pins, content addresses, forward-only pointers, and journaled resolutions — so a checkpoint can answer not just "which agent" but "which exact manifest revision of which blueprint build produced this state."

::: tip Key takeaways
- An agent is a triple: tenant-namespaced id, a thread as private state, and a versioned capability manifest. Identity is names and records, not processes.
- The mailbox is an addressing discipline on the durable queue — no parallel infrastructure — with an activation lease guaranteeing one turn at a time.
- Ordering honesty: turn-sequential processing and approximate FIFO, not total order; carry a sequence number if you need strictness.
- State scopes map onto existing stores, are checked before I/O, and are journaled with effect classes.
- Blueprints package reusable agent/team structure for the catalog: content-addressed, capability-declared, forward-only versioned.
:::

**Further reading**

- [docs/agent-fabric-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/agent-fabric-design.md) — the R0.7 design: manifests, mailboxes, scopes, supervision, coordination
- [rusty-core/src/agents.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/agents.rs) — `CapabilityManifest`, `StateScope`, budgets
- [rusty-core/src/package.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/package.rs) — the catalog package format and `PackageKind`
- [docs/studio.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/studio.md) — the Team Blueprint shelf and its revision rules
