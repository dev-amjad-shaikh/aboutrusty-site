---
title: 04 · Memory
---

<p class="chapter-eyebrow">Part II · Concepts and internals · Chapter 04</p>

# Memory

An agent that remembers nothing starts every conversation as a stranger. An agent that remembers everything wrong is worse — it confidently acts on stale facts, leaks one user's context into another's, and nobody can say where a belief came from. Memory is the chapter where "the model saw what we put in the prompt" meets "the system persists things across runs," and the field has strong opinions about how. Rusty's opinion is stronger: memory is governed runtime state, not a vector store wired into a prompt template.

## The concept: what the field settled on, and what it lost

The research lineage is worth naming, because Rusty adopts from it deliberately and rejects from it deliberately.

**MemGPT / Letta** gave agent memory its operating-system analogy: a small core tier always in context, an archival tier outside it, and the agent paging between them through explicit tool calls. The discipline to keep is *explicit operations* — memory writes are declared, not side effects. The part to reject is the self-editing pattern: an agent calling `memory_replace` rewrites production behavior in place, with no candidate, no evaluation, and no way back but a database restore.

**Zep / Graphiti** made memory temporal: facts carry validity windows and bitemporal annotation — when the fact was true versus when the system learned it — so contradiction is handled by time rather than deletion.

**Mem0** industrialized extraction: pipelines that pull facts from conversations, detect conflicts, and organize by user / session / agent scope.

Build memory at framework level and you lose three things, and the learn design names them precisely (`docs/learn-design.md`). **Scope** becomes a convention — nothing stops a support agent's write from landing in the pool every agent reads, because "user memory" and "team memory" are strings in application code. **Provenance** is absent — a record cannot answer who wrote it, from which run's evidence, against which superseded fact, so when behavior changes there is nothing to audit. **Mutation is silent** — the self-editing pattern again.

The tiered-memory idea — working memory in context, episodic memory of what happened, semantic memory of what's true — shows up in Rusty too, but not as three named stores. Rusty models the same distinctions through *scopes* (how far a record reaches) and *kinds* (what sort of thing it claims), with the conversation state itself playing the working tier's role. One record model, orthogonal axes.

## Rusty: governed memory

One serde-versioned struct, `MemoryRecord`, additive-evolution only, golden-pinned (`rusty-core/src/memory.rs`). Every field exists because a downstream operation needs it:

- **`memory_id`** is a content address — SHA-256 over the canonical serialization of content plus provenance. Identity is integrity: a changed record is a new id, and a tampered record fails its own address.
- **`kind`** is a closed enum: `fact`, `preference`, `example`, `summary`. `example` is the correction loop's output (a corrected input/output pair); `summary` names its source records, which is what makes dependent-summary invalidation computable.
- **`scope`** is a closed enum — `run`, `agent`, `team`, `user`, `tenant` — plus the concrete scope id. The taxonomy maps onto the Agent Fabric's `StateScope`s with one honest addition: run scope, memory whose lifetime is bound to one run's thread. An agent manifest's declared scopes translate one-to-one into the memory it may write.
- **`provenance`** is mandatory: who wrote it (`agent:{id}`, `human:{id}`, `distiller:{name}`, `system`), from what evidence (run id, journal event ids, a correction id, source record ids), and when. A record that cannot name its origin cannot be audited, so origin is not optional.
- **`confidence`** is an `f64` declared by the writer — a human correction defaults to 1.0, a distilled record carries the distiller's estimate. Nothing in the runtime *computes* confidence. That's deliberate honesty: confidence is a claim, not a measurement.
- **`validity`** is a window — the interval the record claims to be true — kept distinct from `created_at`, when the system learned it. Zep's bitemporal split as two plain timestamps.
- **`expires_at`**, an optional TTL, is a retrieval filter and a forgetting trigger — not a silent reaper.
- **`supersedes`** chains records: the superseded record is retained as evidence but filtered from default retrieval. There is no in-place update anywhere in the model.
- **`content`** is a `PayloadRef` — the journal's own discipline: inline up to 4 KiB, content-addressed artifact storage above.

## The write path: governed three ways

Every write is checked before any I/O happens.

1. **Scope authorization.** An agent may write only the scopes its `CapabilityManifest` declares; an undeclared scope write fails fast, the same shape as writing an undeclared channel at the barrier. Run scope is written by the runtime on the run's behalf. Tenant scope is configuration-grade — writable by operators, never by agents — and tenant isolation stays the `{tenant}/` id-namespacing the server already enforces: another tenant's memories don't exist in your namespace, 404 never 403.
2. **Effect classification.** A memory write is an `Effect::Idempotent` under a derived key (`memory:{scope}:{memory_id}`), so retried submissions converge, and it's journaled with causal parentage into the writing run (`MemoryWrite`). A read is `Effect::ReadOnly` journaled as `MemoryRead` — which is what makes candidate evaluation reproducible: exact replay serves the journaled retrieval instead of re-querying the store, the same rule the Flight Recorder applies to model and tool calls.
3. **No silent behavioral rewrites.** A memory write changes what future retrievals return — nothing else. If the write is meant to change a prompt, a policy, or a permission, it enters the candidate pipeline of Chapter 05. This is the learning rule enforced at the type level of a write path.

## Retrieval: structural, budgeted, journaled

`MemoryQuery` is deliberately structural: scope, kind, key/tag equality, validity-at-time, minimum confidence, exclude-expired, exclude-superseded, authored-by. **No similarity search.** Vector retrieval is deferred, and the design is plain about the consequence: structured filters answer "what is current, scoped, attributed, and tagged" but cannot answer "what is semantically similar to this situation" — no amount of filtering fakes that. Writers must key and tag deliberately, and readers should treat absence of a hit as absence of a key, not absence of a fact. The record model reserves an additive `embedding` field so vectors slot in without a wire change when the deferral lifts.

Assembly for a prompt is token-bounded: a `ContextBudget` packs filtered records by deterministic rank — explicit priority, then confidence, then recency — until the budget runs out, and the assembly itself is journaled: the record ids and their order ride in the `MemoryRead` event's output payload. Two properties follow. Determinism: equal store state and equal budget produce byte-equal assemblies. Auditability: the prompt the model saw is reconstructable from the journal, not from re-running a query against a store that has since changed.

## The maintenance operations

Consolidation, conflict detection, and forgetting are runtime operations with evidence — none is a background daemon with invisible effects.

**Consolidation** distills N records into one `summary` naming its sources in provenance and superseding them. It runs as a durable task — leased, retried, journaled — because consolidation over a large scope is exactly the work that must survive a crash mid-pass.

**Conflict detection** flags records that share a key, overlap in validity, and contradict. It flags; it never auto-resolves. Zep and Mem0 resolve contradictions inside the ingestion pipeline with a model, which is precisely the silent-mutation pattern the learning rule forbids. Detection is evidence; resolution is governance.

**Forgetting** is real deletion with a receipt. `forget(memory_id)` — or `forget_scope` for an erasure request — removes the record, walks `supersedes` in reverse to invalidate summaries that named it as a source, clears derived caches, and journals a tombstone: the id, the scope, the reason (`expired` / `retracted` / `erasure_request`), the dependent invalidations — metadata, never the forgotten content. The machine-unlearning literature's point applies directly: erasing the row while leaving derived artifacts is not forgetting. One boundary is drawn openly: memory records are derived state and erasable; run journals are the system's own hash-chained evidence and are not.

::: tip Key takeaways
- Memory is governed runtime state: scope, provenance, and no-silent-rewrite are enforced by the write path, not by convention.
- `MemoryRecord` is content-addressed and immutable; change is supersession, never in-place update.
- Tiers are expressed as scopes (`run`/`agent`/`team`/`user`/`tenant`) and kinds (`fact`/`preference`/`example`/`summary`), not separate stores.
- Retrieval is structural and token-budgeted with journaled assembly; vector search is deferred and the design says what that costs.
- Forgetting deletes dependents and journals a tombstone; erasure is auditable.
:::

**Further reading**

- [docs/learn-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/learn-design.md) — the R0.8 design: record model, write path, retrieval, and the named research lineage
- [rusty-core/src/memory.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/memory.rs) — `MemoryRecord`, `MemoryQuery`, `ContextBudget`, `Correction`
- [docs/agent-fabric-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/agent-fabric-design.md) — the `StateScope` taxonomy memory scopes extend
