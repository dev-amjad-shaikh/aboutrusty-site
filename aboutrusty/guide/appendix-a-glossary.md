---
title: Appendix A · Glossary
---

<p class="chapter-eyebrow">Appendix A</p>

# Glossary

Terms as this book and the codebase use them. Chapter links point to the fullest treatment.

**Activation lease** — the per-agent record that allows at most one activation of an agent at a time across workers. It carries an owner, an expiry, and a fencing ordinal that increments on every claim, and it is renewed by heartbeat. [Ch. 08](./08-blueprints-agents.md)

**Active set** — the nodes scheduled to run in one super-step.

**Agent (durable)** — an identity that survives crashes: a tenant-scoped `AgentId` with a pinned, versioned `CapabilityManifest`, a private checkpoint thread, and a mailbox address on the task queue. [Ch. 08](./08-blueprints-agents.md)

**Approval token** — `ApprovalToken`, the value an irreversible effect must be given before it runs. It is scoped to that effect's derived id and records `approved_by`. The server keeps durable approval records alongside it. [Ch. 12](./12-policy-security.md)

**Artifact** — two kinds, kept apart by the type system. *Registry artifacts* are versioned configuration (prompts, tool contracts, model settings) governed by the candidate pipeline, under `/registry/artifacts`. *Run artifacts* are files, images, audio, or datasets a run produced, content-addressed with lineage and retention, under `/artifacts`. [Ch. 22](./22-deploy-operate.md)

**Barrier** — the point where all active nodes of a super-step have finished; the only moment their writes become visible. [Ch. 02](./02-mental-model.md)

**Blueprint** — a reusable agent or team structure, shipped in the catalog as the `BlueprintTemplate` package kind. [Ch. 08](./08-blueprints-agents.md)

**Candidate** — an immutable, content-addressed proposal to change behavior. `CandidateKind` covers prompts, policies, memory sets, tool permissions, tool contracts, model settings, memory configurations, middleware compositions, context policies, and skills. Candidates reach production only through evaluation and promotion. [Ch. 05](./05-learning-loop.md)

**Canary** — a revision bound to a declared fraction of new runs by a seeded draw, so each run's assignment is reproducible. [Ch. 22](./22-deploy-operate.md)

**Capsule** — a WebAssembly component bounded by a declared manifest of capabilities, budgets, and effect classes. [Ch. 07](./07-capsules.md)

**Channel** — one key of the shared state, with a reducer that defines how writes merge.

**Checkpoint** — a versioned snapshot of one thread at a super-step boundary: step, state, and the next nodes to run. Runs resume from the latest one. [Ch. 02](./02-mental-model.md)

**Connector** — an integration with an external system, defined by one content-hashed `ConnectorManifest` (a JSON Schema connection specification plus operations with declared effects). Secrets are sealed in the broker; the manifest's `check` operation tests the connection. [Ch. 09](./09-tools-connectors.md)

**Coordination** — one run of a typed multi-agent pattern (delegate, fan-out, race, quorum), with its own journal. [Ch. 11](./11-sub-agents.md)

**Correction** — an attributed human fix. At run scope it applies directly; at wider scopes it becomes a candidate, and a corrected run event also yields an `example` record for the evaluation dataset. [Ch. 05](./05-learning-loop.md)

**Decision event** — the learning contract recorded at a decision point: `features`, the full set of `legal_actions`, the `selected` action, its `propensity`, the `policy_version`, and the `outcome`. [Ch. 03](./03-journals.md)

**Effect** — the retry-safety class on every journaled event and task: `Pure`, `ReadOnly`, `Idempotent`, `Compensatable`, `NonIdempotent`. The typed API calls the last one `IrreversibleEffect`. [Ch. 03](./03-journals.md)

**EffectClass (placement)** — the *where* taxonomy on tools in `rusty-core/src/tool.rs`: `Read`, `Execute`, `Egress`, paired with a sandbox requirement that resolves to in-process or sandboxed placement. Distinct from `Effect`. [Ch. 09](./09-tools-connectors.md)

**Egress policy** — the layer-7 allow-list for outbound connector traffic: destination, method, path, and originating component, checked against the resolved address. The server derives it from the configured connections plus the operator's additions, under a deployment-wide egress ceiling. [Ch. 12](./12-policy-security.md)

**Environment** — a deployment target record such as `dev`, `staging`, or `prod`, with a pointer to the revision it serves. [Ch. 22](./22-deploy-operate.md)

**ErrorClass** — the closed failure taxonomy for durable tasks: `transient`, `rate_limited`, `timeout`, `invalid_input`, `dependency_failure`, `resource_exhausted`, `cancelled`, `unknown`. [Ch. 10](./10-durability.md)

**Flight Recorder** — the evidence system added in R0.5: the append-only, hash-chained, causally parented journal of every run, plus exact replay and branch diff over it. [Ch. 03](./03-journals.md)

**Fork** — copying a thread's checkpoint history, in full or up to a chosen checkpoint, into a new thread id. The safe first step before replay. [Ch. 02](./02-mental-model.md)

**Interrupt** — a node-initiated suspension of the whole run: a parked state with a checkpoint, resumed with a resume value. Not an exception. [Ch. 02](./02-mental-model.md)

**Journal** — the append-only, hash-chained event record of a run. `seq` is the total order; `parent` is the causal chain. [Ch. 03](./03-journals.md)

**Lease** — a worker's time-limited claim on a durable task, extended by heartbeat. When it expires the task becomes claimable again. [Ch. 10](./10-durability.md)

**Mailbox** — an addressing rule on the durable task queue (`recipient = agent:{id}`), not a separate queue. The runtime persists and retries its messages like any task, and the activation lease makes processing turn-sequential. [Ch. 08](./08-blueprints-agents.md)

**Memory record** — the governed memory unit: content-addressed, scoped, with provenance, a kind, and a validity window. It is superseded or forgotten, never updated in place. [Ch. 04](./04-memory.md)

**Outbox (transactional)** — committing a state change and the tasks it emits in one transaction, so a crash cannot separate them. [Ch. 10](./10-durability.md)

**Promotion envelope** — the declared, per-deployment rule for what may promote automatically, what needs review, and what canaries. [Ch. 05](./05-learning-loop.md)

**Propensity** — the probability the acting policy gave the action it took, recorded at decision time. Correct off-policy evaluation divides by it. [Ch. 03](./03-journals.md)

**Receipt (signed run receipt)** — an Ed25519 signature over a run's journal head, manifest digests, effect ledger, policy versions, and denials. [Ch. 07](./07-capsules.md)

**Reducer** — the per-channel merge function applied at the barrier: `Overwrite` (the default), `Append`, `DeepMerge`, `AddMessages`.

**Replay** — re-driving a recorded run from its journal. *Exact* replay serves every model and tool result from the journal, makes zero outbound calls, and fails on any mismatch. *Hybrid* replay, used by R0.10's counterfactual forks and R0.12's shadow deployments, serves recorded outcomes for effects it will not execute. Live replay is not shipped. [Ch. 03](./03-journals.md)

**Revision** — an immutable, content-addressed `DeploymentRevision` that freezes its configuration pins when it is created. [Ch. 22](./22-deploy-operate.md)

**Send** — the routing instruction that fans one node out over items generated at runtime, each with its own input state; the map step of map-reduce.

**Shadow deployment** — a revision run against recorded traffic with only `Pure` and `ReadOnly` effects admitted; where it needs a refused effect, it gets the recorded outcome. [Ch. 22](./22-deploy-operate.md)

**Skill** — versioned procedural knowledge: a governed `SKILL.md` package that shapes context and can only narrow a run's tools. [Ch. 06](./06-skills.md)

**Stand-in** — Studio's name for a *world*: the server's resettable copy of a connected system that answers a connector's calls from seeded records. [Ch. 18](./18-build-a-tool.md)

**State scope** — the reach of agent state: `Private`, `Team`, `User`, `Tenant`, checked before any I/O. Memory scopes map onto these (`Private` becomes `agent`) and add the runtime-only `run` scope. [Ch. 08](./08-blueprints-agents.md)

**Super-step** — one executor iteration: plan, run the active set in parallel over an immutable snapshot, reach the barrier, merge with validation, route, and checkpoint.

**Team trace** — the read-time assembly (`TeamTrace`) that stitches a coordination's journal and its members' journals into one causal tree through parent ids. [Ch. 11](./11-sub-agents.md)

**Tenant** — an isolated namespace on one server. API keys map to tenants, and cross-tenant probes answer `404`. [Ch. 12](./12-policy-security.md)

**Thread** — the session id that groups checkpoints; stable across interrupts, resumes, replays, and forks.

**Version pointer** — `VersionPointer`: for one surface, the active `CandidateId` and an optional canary binding. Promotion moves it forward; rollback moves it back to the previous version, byte-exact. The candidates it points at are immutable. [Ch. 05](./05-learning-loop.md)
