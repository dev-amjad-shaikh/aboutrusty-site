---
title: Appendix A · Glossary
---

<p class="chapter-eyebrow">Appendix A</p>

# Glossary

Terms as this book and the codebase use them. Chapter pointers go to the fullest treatment.

**Activation lease** — the per-agent record guaranteeing at most one activation of an agent at a time across workers; renewed by heartbeat, expired on death. [Ch. 08](./08-blueprints-agents.md)

**Active set** — the nodes scheduled to run in one super-step.

**Agent** — a durable triple: tenant-namespaced `AgentId`, a private thread, and a versioned capability manifest. Identity is names and records, not processes. [Ch. 08](./08-blueprints-agents.md)

**Approval token** — the scoped, attributable proof-of-explicit-decision an irreversible effect requires to execute; journaled so it survives restarts. [Ch. 12](./12-policy-security.md)

**Artifact** — two kinds, kept apart by the type system: *registry artifacts* (human-authored JSON configuration, governed by the learn pipeline) and *run artifacts* (run-produced binary outputs, governed by lineage, permissions, retention). [Ch. 22](./22-deploy-operate.md)

**Barrier** — the point where all active nodes of a super-step have finished; the only moment writes become visible. [Ch. 02](./02-mental-model.md)

**Blueprint** — a reusable, versioned agent or team structure: a catalog package kind (`BlueprintTemplate`) in the runtime, a connection-scoped shelf in Studio. [Ch. 08](./08-blueprints-agents.md)

**Candidate** — an immutable, content-addressed declaration of a proposed behavioral change (prompt, policy, memory set, tool permission); the only way learning reaches production. [Ch. 05](./05-learning-loop.md)

**Capsule** — a WASM Component Model execution unit for untrusted code, bounded by a declared manifest: capabilities, budgets, effect classes. [Ch. 07](./07-capsules.md)

**Channel** — one key of the shared state, with a reducer defining its merge semantics.

**Checkpoint** — a versioned snapshot of one thread at a super-step boundary: step, state, next-node set. The platform's single persistence primitive. [Ch. 02](./02-mental-model.md)

**Connector** — a packaged integration with an external system: one content-hashed `ConnectorManifest`, declared operations with effects, sealed secrets, a live check as the storage gate. [Ch. 09](./09-tools-connectors.md)

**Correction** — an attributed human fix that becomes a candidate memory or example — never an in-place rewrite. [Ch. 05](./05-learning-loop.md)

**Decision event** — the frozen learning contract: features, the full legal action set, the selection, its propensity, the policy version, the outcome. [Ch. 03](./03-journals.md)

**Effect** — the retry-safety taxonomy on every journaled event and task: `Pure`, `ReadOnly`, `Idempotent`, `Compensatable`, `NonIdempotent`. [Ch. 03](./03-journals.md)

**Effect class (placement)** — the *where* taxonomy on tools: `Read`, `Execute`, `Egress`, paired with a sandbox requirement. Distinct from `Effect`. [Ch. 09](./09-tools-connectors.md)

**Egress policy** — deny-by-default layer-7 control: destination × protocol × method × path × component, checked against resolved addresses. [Ch. 12](./12-policy-security.md)

**Flight Recorder** — the evidence system: the append-only, hash-chained, causally parented journal of every run, plus exact replay over it. [Ch. 03](./03-journals.md)

**Fork** — copying a thread's checkpoint history (full or truncated at a checkpoint) into a new thread id; the safe prelude to replay. [Ch. 02](./02-mental-model.md)

**Interrupt** — a node-initiated suspension of the whole run: a parked state with a checkpoint, resumable by a resume value. Not an exception. [Ch. 02](./02-mental-model.md)

**Journal** — the append-only, hash-chained event record of a run; `seq` is the total order, `parent` the causal chain. [Ch. 03](./03-journals.md)

**Mailbox** — an addressing discipline on the durable task queue (`recipient = agent:{id}`), not a separate queue; turn-sequential processing, approximate FIFO. [Ch. 08](./08-blueprints-agents.md)

**Memory record** — the governed memory unit: content-addressed, scoped, provenanced, kinded, validity-windowed, superseding — never updated in place. [Ch. 04](./04-memory.md)

**Outbox (transactional)** — committing a state change and a task emission in one transaction, so a crash can never split them. [Ch. 10](./10-durability.md)

**Promotion envelope** — the declared, per-deployment rule for what may promote automatically, what needs review, and what canaries. [Ch. 05](./05-learning-loop.md)

**Propensity** — the probability the logging policy assigned the action it took, recorded at decision time; the input correct off-policy evaluation divides by. [Ch. 03](./03-journals.md)

**Receipt (run receipt)** — an Ed25519-signed statement over a run's journal head, manifest digests, effect ledger, policy versions, and denials. [Ch. 07](./07-capsules.md)

**Reducer** — the per-channel merge function applied at the barrier: `Overwrite`, `Append`, `DeepMerge`, `AddMessages`.

**Replay (exact)** — re-driving a recorded run with every outbound effect served from the journal; mismatches fail loudly. Live and hybrid replay are designed, not yet shipped. [Ch. 03](./03-journals.md)

**Send** — the routing instruction that fans one node out over runtime-generated items, each with scoped input state; the map-reduce primitive.

**Skill** — versioned procedural knowledge: a governed `SKILL.md` package that shapes context and can only narrow a run's tool surface. [Ch. 06](./06-skills.md)

**Stand-in** — a seeded answerer for a connection's calls, so agents exercise end to end without touching the live system. [Ch. 18](./18-build-a-tool.md)

**State scope** — the reach of agent state: `Private`, `Team`, `User`, `Tenant`; memory adds `run`. Checked before I/O, journaled with effect classes. [Ch. 08](./08-blueprints-agents.md)

**Super-step** — one executor iteration: plan, parallel compute over immutable snapshots, barrier, validated merge, route, checkpoint. Transactional as a whole.

**Team trace** — the read-side assembly that stitches a multi-agent run's per-run journals into one causal tree via parent ids. [Ch. 11](./11-sub-agents.md)

**Thread** — the session id that namespaces checkpoints; stable across interrupts, resumes, replays, and forks.

**Version pointer** — the immutable `CandidateId` reference naming the active version of a surface; promotion moves it, rollback re-points it. [Ch. 05](./05-learning-loop.md)
