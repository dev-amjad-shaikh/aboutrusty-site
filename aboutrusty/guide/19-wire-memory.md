---
title: 19 · Wire memory
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 19</p>

# Wire memory

Chapter 04 covered the governed memory model. This chapter is the practical version: how to give an agent memory that stays scoped, attributable, and erasable — and the two or three mistakes that make memory systems untrustworthy, which the write path exists to prevent.

## What you actually configure

Memory in Rusty is not a store you wire up; it's a capability you *declare* and a surface you operate. The moving parts:

**Scopes in the manifest.** An agent writes only the memory scopes its capability manifest declares — the same declaration that governs state scopes (Chapter 08). Deciding the scopes is the real design work, and the questions are product questions: does this agent learn per-conversation (`run`), per-identity (`agent`), per-team (`team`), per-end-user (`user`), or per-organization (`tenant`)? Each wider scope is a wider blast radius for a wrong record, so start narrow. `user` scope is where most product memory belongs; `tenant` scope is configuration-grade and writable by operators, not agents.

**Kinds with intent.** Records are `fact`, `preference`, `example`, or `summary`. The kind is not metadata decoration — it drives consolidation (summaries name their sources), correction handling (examples are the correction loop's output), and retrieval filtering. Write `preference` for "Alex wants concise answers," `fact` for "the invoice cutoff is the 25th," and let corrections produce `example` records rather than hand-authoring them.

**Retrieval budgets.** Assembly into a prompt is token-bounded through a `ContextBudget` — max tokens plus an overflow policy, packed by deterministic rank (priority, confidence, recency). Set the budget from your model's context window and your prompt's other sections; memory competes with instructions and conversation for the same tokens, and the budget makes that competition explicit rather than a silent truncation.

## The rules that keep it trustworthy

Three disciplines, all enforced before I/O, all worth internalizing because they're what separate this from a vector store in a prompt template:

1. **Provenance is mandatory.** Every record names who wrote it and from what evidence. When an agent acts on a memory, you can walk the record back to the run, correction, or distiller that produced it. If you find yourself wanting to write a record without provenance, that's the design pushing back — listen.
2. **Confidence is a claim, not a measurement.** A human correction defaults to 1.0; a distilled record carries the distiller's estimate; nothing in the runtime computes confidence for you. Retrieval filters on it, so treat low-confidence records as candidates for review, not as facts.
3. **Writes never rewrite behavior.** A memory write changes what future retrievals return — full stop. If the intent is to change a prompt, policy, or permission, the change goes through the candidate pipeline (Chapter 05). The fastest way to corrupt a memory system is to let it become a back channel for config edits.

## Corrections: the feature your users will love

The memory flow with the best return on effort is the correction loop (Chapter 05): a user says "no, the report goes to finance@, not accounting@," and that becomes an attributed correction — `human:{author}` provenance, confidence 1.0 — landing as a candidate. At run scope it's adopted directly; wider, it's evaluated before promotion, and the corrected case joins the eval dataset as a regression test. Wire your product's UI to capture corrections explicitly (a "that's wrong" affordance beats a thousand implicit signals), and the correction carries its own test into the pipeline.

## Erasure and expiry

For privacy requests, `forget_scope` removes a user's records *and their dependents* — summaries that named them as sources are re-derived or invalidated — and journals a tombstone with the reason. For ordinary hygiene, `expires_at` TTLs make staleness a retrieval filter rather than a cleanup cron. Both are operations with receipts; neither is a silent reaper. One boundary to respect in product design: memory records are erasable derived state; run journals are not. Don't put anything in a journal-bound payload you'd need to erase.

## Testing memory behavior

Because reads journal as `MemoryRead` and the assembly is journaled, memory behavior is replay-testable: record a run, replay it exactly, and the retrieval is served from evidence. A memory regression test is a dataset case with a `state` assertion over what the agent did with what it remembered — Chapter 20's machinery, applied to the prompts memory shaped.

::: tip Key takeaways
- Declare scopes narrowly; widen deliberately. `user` scope carries most product memory.
- Retrieval is token-budgeted and deterministic — set the budget explicitly.
- Corrections are the highest-trust memory input; capture them explicitly in your UI.
- Erasure deletes dependents and journals a tombstone; journals themselves are never erased — design payloads accordingly.
- Memory behavior is replay-testable because retrieval is journaled.
:::

**Further reading**

- [Chapter 04 · Memory](./04-memory.md) — the record model and write path
- [docs/learn-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/learn-design.md) — retrieval, budgets, consolidation, forgetting
- [rusty-core/src/memory.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/memory.rs) — `MemoryRecord`, `MemoryQuery`, `ContextBudget`
