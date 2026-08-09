import type { Article } from "./types";

export const durableWorkFabric: Article = {
  slug: "durable-work-fabric",
  title: "Durable Work and the Agent Fabric",
  description:
    "The second and third pillars: a durable task queue with one shared retry policy, leases, an outbox, and effect receipts — then durable agent identities, typed mailboxes, supervision, and four typed coordination patterns on top.",
  readingTime: "9 min read",
  kicker: "Concepts",
  blocks: [
    {
      type: "paragraph",
      text: "Checkpoints make a run resumable and the Flight Recorder makes it explainable. Neither makes its side effects survivable: if the process dies between *the charge went through* and *the run recorded that it did*, the checkpoint alone cannot tell you whether to charge again. **R0.6 — Durable Work** (v0.7.0, 2026-08-07) closes that gap with a durable task queue, one shared retry policy, cancellation as a first-class signal, a transactional outbox, and effect receipts. **R0.7 — Agent Fabric** (v0.8.0, 2026-08-08) builds the next storey on top: durable agent identities, typed mailboxes, OTP-style supervision, and four typed coordination patterns whose guarantees the runtime enforces.",
    },
    {
      type: "callout",
      variant: "quote",
      text: "The honesty rule both releases share: at-least-once delivery plus idempotency — exactly-once *business outcomes* where the effect protocol supports it, never a pretend exactly-once execution.",
    },

    { type: "heading", level: 2, text: "The task queue: leases, not promises" },
    {
      type: "paragraph",
      text: "The unit of durable work is the `TaskEnvelope` — a serde-versioned wire contract (`TASK_ENVELOPE_FORMAT_VERSION = 1`) carrying sender, recipient, input (inline or content-addressed), deadline, attempt budget, idempotency key, and the declared `Effect` of the work. The queue itself runs on both store backends — file and Postgres — with identical semantics, and the worker-facing protocol is five verbs:",
    },
    {
      type: "table",
      head: ["Endpoint", "Semantics"],
      rows: [
        ["`POST /tasks`", "Enqueue, with idempotency-key dedupe."],
        ["`POST /tasks/outbox`", "Enqueue atomically with a checkpoint write — the transactional outbox (one Postgres transaction)."],
        ["`POST /tasks/claim`", "Claim a task as a **lease**: visibility timeout plus explicit owner identity. Not a destructive pop."],
        ["`POST /tasks/{id}/heartbeat`", "Renew the lease; the response carries the `cancel_requested` hint."],
        ["`POST /tasks/{id}/complete`", "Report completion, optionally with an effect receipt."],
        ["`POST /tasks/{id}/fail`", "Report failure — routed through the shared retry policy."],
        ["`POST /tasks/{id}/cancel`", "Cancellation propagation (see below)."],
        ["`GET /tasks/metrics`", "Queue depth, oldest-visible-task age, per-pool lease saturation — autoscaling signals, not mechanisms."],
      ],
    },
    {
      type: "paragraph",
      text: "The lease is the correctness mechanism. If a worker dies mid-attempt, the lease expires and the task becomes visible again — reaping classifies the attempt as `ErrorClass::Unknown`. Cancellation, by contrast, is only a **hint for promptness**: queued tasks terminalize immediately, leased tasks see the hint on their next heartbeat and abort promptly, but a worker that never heartbeats is still caught by lease expiry.",
    },

    { type: "heading", level: 2, text: "One retry policy, shared verbatim" },
    {
      type: "paragraph",
      text: "Every failed attempt is classified into a **closed taxonomy** — `ErrorClass`: `transient`, `rate_limited`, `timeout`, `invalid_input`, `dependency_failure`, `resource_exhausted`, `cancelled`, `unknown`. The class is declared by whoever executed the work, never inferred from logs. Exactly one function maps `(effect, class, attempt, budget)` to a decision, and it lives in `rusty-core` so the server scheduler and the worker SDK share it byte-for-byte:",
    },
    {
      type: "code",
      language: "rust",
      title: "The four gates, in order — rusty-core/src/durable.rs",
      code: `pub fn classify_retry(
    effect: Effect,
    class: ErrorClass,
    attempt: u32,
    max_attempts: u32,
    uniform: f64,
) -> RetryDecision {
    if !effect.is_freely_repeatable() || !class.is_retryable() {
        return RetryDecision::Fail;
    }
    if attempt >= max_attempts {
        return RetryDecision::Dead;
    }
    RetryDecision::Retry {
        after_ms: backoff_delay_ms(attempt, uniform),
    }
}`,
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**Effect gate** — work whose declared `Effect` is not freely repeatable is *never silently retried*. A timed-out `NonIdempotent` charge may already have happened; `classify_retry` answers `Fail` and surfaces it. An `Idempotent` declaration — with a stable idempotency key — is what unlocks automatic retry.",
        "**Class gate** — `InvalidInput` and `Cancelled` fail immediately; everything else, including `Unknown`, is retryable.",
        "**Attempt gate** — a retryable failure with the budget exhausted goes to the **dead-letter queue**: operator-visible evidence with the full attempt history, re-drivable by hand after the cause is fixed.",
        "**Backoff** — otherwise retry, with the computed delay.",
      ],
    },
    {
      type: "paragraph",
      text: "The backoff is full-jitter exponential: retry `n` draws uniformly from `[0, 1s × 2^(n−1)]`, capped at **5 minutes** — at the cap a stuck task retries at most 12 times per hour. Full jitter is what decorrelates a fleet of tasks that failed together when a shared dependency recovers. The jitter sample is an explicit parameter, so a recorded run reproduces its exact retry schedule under replay:",
    },
    {
      type: "code",
      language: "rust",
      title: "Deterministic backoff — rusty-core/src/durable.rs",
      code: `pub fn backoff_delay_ms(attempt: u32, uniform: f64) -> u64 {
    let exponent = attempt.saturating_sub(1).min(20);
    let exponential = BASE_RETRY_DELAY_MS
        .saturating_mul(1u64 << exponent)
        .min(MAX_RETRY_DELAY_MS);
    (uniform.clamp(0.0, 1.0) * exponential as f64) as u64
}`,
    },

    { type: "heading", level: 2, text: "The outbox, receipts, and the crash window" },
    {
      type: "paragraph",
      text: "A checkpoint and the task submission it implies are written as **one Postgres transaction** (`POST /tasks/outbox`), with a crash-safe relay (`FOR UPDATE SKIP LOCKED`, per-row transactions, publish idempotent on the task's idempotency key) — a relay restart can neither lose nor double a row. The file backend shares the API with documented weaker guarantees: cross-record atomicity is Postgres-only. When an `Idempotent` effect completes, its own provider confirmation is journaled as an `EffectReceipt`, causally parented, and `JournalSnapshot::find_effect_receipt` is the replay-time lookup.",
    },
    {
      type: "paragraph",
      text: "The release proof is the property, automated: `tests/crash_recovery.rs` runs a real server and worker, fsyncs an idempotent effect to an external ledger, then SIGKILLs both processes before completion is reported. On restart the lease expires, the re-attempt is a no-op at the effect — exactly one ledger invocation — and the task completes with attempt 1's receipt.",
    },
    {
      type: "paragraph",
      text: "Around the queue sit the operational controls: named **pools** with per-pool concurrency caps enforced on the claim path against live leases; tenant **quotas** (queued including pending outbox rows, in flight, DLQ depth) answering `429 quota_exceeded` at every submission surface; exact-string **worker version pinning** matched at claim, so a mid-run deploy never changes semantics under an in-flight execution; and graceful **drain** — claims stop, in-flight attempts finish inside a 25 s grace, grace-exceeded attempts return to visibility at lease expiry.",
    },

    { type: "heading", level: 2, text: "Agent Fabric: durable runs become durable teams" },
    {
      type: "paragraph",
      text: "R0.7 adds identity on top of the queue. An `AgentId` is a stable, tenant-namespaced name — names and records, not processes. Its mailbox and its private state are **addressing disciplines over stores that already exist**, not new subsystems:",
    },
    {
      type: "code",
      language: "rust",
      title: "One id, two derivations — rusty-core/src/agents.rs",
      code: `/// The queue recipient addressing this agent's mailbox:
/// \`agent:{agent_id}\`. A mailbox is an addressing discipline on the
/// existing task queue — not a new queue — so mailbox messages inherit
/// the R0.6 durability, retry, dead-letter, and cancellation machinery
/// unchanged.
pub fn mailbox_recipient(&self) -> String {
    format!("{AGENT_RECIPIENT_PREFIX}{}", self.0)
}`,
    },
    {
      type: "paragraph",
      text: "The agent's thread is `agent:{id}` over the existing checkpointer, so the checkpoint log *is* the private state and restart is re-driving it. A `CapabilityManifest` declares what the agent runs, which message kinds its mailbox accepts (send-side admission rejects the rest), which `StateScope`s it may touch (`private` / `team` / `user` / `tenant`), and a budget ceiling — with an exact-match `manifest_version` pin, the agent-level form of worker version pinning.",
    },
    {
      type: "heading", level: 3, text: "Supervision with fencing, not hope" },
    {
      type: "paragraph",
      text: "Activation is single-owner: `server_agent_leases` serializes turns and issues **fencing tokens** — a stolen activation bumps the fence, so a stale owner can never pass a later write. Supervision uses OTP's vocabulary (`permanent` / `transient` / `temporary`) with intensity/period over a sliding failure window; a restart re-drives the checkpoint log, so state survives. Escalation is a journaled `SupervisionEvent` plus an idempotency-keyed `EscalationNotice` to the supervisor's mailbox — a message, not an exit, because Rusty agents are data and runs, not processes. Root escalations dead-letter with full evidence. Cancellation composes into a tree: `POST /agents/{id}/cancel` and `POST /teams/{id}/cancel` signal children before parent, leaving zero orphan tasks.",
    },

    { type: "heading", level: 2, text: "Four typed coordination patterns" },
    {
      type: "paragraph",
      text: "A delegator submits one typed `CoordinationContract`; the runtime enforces the guarantees against that shape. Derived ids plus idempotency keys make retried drives converge:",
    },
    {
      type: "table",
      head: ["Pattern", "Endpoint", "Guarantee the runtime enforces"],
      rows: [
        ["**Delegate / handoff**", "`POST /coordination/delegate`", "Grant narrow-only; the member's settlement *is* the pattern's settlement."],
        ["**Fan-out / map**", "`POST /coordination/fan_out`", "Bounded in-flight window; byte-deterministic merge."],
        ["**Race**", "`POST /coordination/race`", "Submission-time effect gate: only freely-repeatable effects may race. Losers are cancel-signalled with wasted tokens and cost accounted; all-failed dead-letters."],
        ["**Quorum**", "`POST /coordination/quorum`", "Hard k floor, deterministic resolver; unreachable k fails open."],
      ],
    },
    {
      type: "paragraph",
      text: "The evidence does not live in one journal — the pattern's journal holds the `CoordinationStart → MailboxSend → MailboxReceive → CoordinationEnd` spine while member agents write their own run journals. **TeamTrace** is the read-side assembly that stitches the slices back into one connected causal tree, served at `GET /coordination/{id}/trace`. It is deliberately read-only and pure: it never invents links, and the same snapshots always assemble into the byte-identical trace — evidence that depends on iteration order is not evidence.",
    },

    { type: "heading", level: 2, text: "Effect kernel v2: retry safety in the type system" },
    {
      type: "paragraph",
      text: "R0.6's effect gate is a convention checked at runtime — one function call away from being ignored. The effect kernel v2 adds the compile-time half: an effect type declares its safety class by implementing a marker trait, and generic infrastructure (a retry loop, a speculator, the race pattern) can *require* a class at the type level. A declaration check rejects a marker that lies about its wire class:",
    },
    {
      type: "table",
      head: ["Marker trait", "Wire `Effect`", "What the class unlocks"],
      rows: [
        ["`PureEffect`", "`Pure`", "Caching, speculation, unrestricted retry."],
        ["`ReadOnlyEffect`", "`ReadOnly`", "Unrestricted retry; replay serves the journaled value."],
        ["`IdempotentEffect`", "`Idempotent`", "Automatic retry under a stable idempotency key."],
        ["`CompensatableEffect`", "`Compensatable`", "Execution only with a registered rollback handler."],
        ["`IrreversibleEffect`", "`NonIdempotent`", "Execution only behind an explicit `ApprovalToken`."],
      ],
    },
    {
      type: "paragraph",
      text: "Two mechanisms close the loop. **Deterministic effect ids** — `derive_effect_id` computes a SHA-256 over a versioned, domain-prefixed tuple of scope, kind, input hash, and idempotency key, so a recovered run re-derives the id of the effect it was about to perform and asks the journal whether a receipt already exists for it. **The approval boundary** — an irreversible effect executes only when presented with an `ApprovalToken` scoped to its derived effect id: approval is a value that must be constructed, not a boolean that can be silently defaulted.",
    },
    {
      type: "paragraph",
      text: "The **versioned run manifest** pins the rest of the run's semantics the same way: `CheckpointHeader` carries an optional `RunManifest` with SHA-256 digests of prompts and tool schemas, a model-plus-parameters digest, and memory/capsule version pins, declared via `RunConfig::with_manifest` and stamped into every boundary checkpoint. Old checkpoints deserialize unchanged.",
    },

    { type: "heading", level: 2, text: "The state scaling that makes this practical" },
    {
      type: "paragraph",
      text: "Durable teams multiply checkpoint volume, so R0.7 also scaled the state underneath — with a byte-identical public contract. Structurally shared state (`Arc`-backed channels, copy-on-write at channel granularity), additive delta checkpoints (chain bounded by K=32 plus a byte ratio, eager compaction on fork, pre-delta checkpoints load unchanged), and a content-addressed artifact store (`journal::ArtifactStore`, file and Postgres backends, integrity re-hashed on every read):",
    },
    {
      type: "table",
      head: ["Measurement", "Before", "After"],
      rows: [
        ["Super-step snapshot fan-out, 1 MB state", "~105 µs", "~26 ns (flat at 10 MB too, was ~1.9 ms)"],
        ["`Append` merge at 10k elements", "—", "7.6 µs unique (92×)"],
        ["On-disk checkpoints, 1000-step / 1 MB run", "1.05 GB", "33.0 MB (31.8×)"],
      ],
      caption: "Published numbers from docs/benchmarks.md, before re-measured same day on the base commit.",
    },

    { type: "heading", level: 2, text: "What shipped, and how to read it" },
    {
      type: "paragraph",
      text: "All of the above shipped in **v0.7.0** (R0.6, 2026-08-07) and **v0.8.0** (R0.7, 2026-08-08). The proofs are integration tests, not aspirations: `crash_recovery.rs` for the queue, `agent_recovery.rs` for fenced single-agent recovery, and `team_recovery.rs` — a three-agent team SIGKILLed mid-fan-out that completes after restart without duplicating any idempotent effect, with TeamTrace assembling one connected causal tree, golden-pinned.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "v0.x stability rules apply",
      text: "This is pre-1.0 surface. The stability contract (`docs/stability.md`) guarantees checkpoints keep loading within a minor line and pins wire shapes with golden-file tests, but route and signature evolution between minors is permitted — pin your worker and manifest versions, and read the changelog before upgrading.",
    },

    { type: "heading", level: 2, text: "Glossary" },
    {
      type: "table",
      head: ["Term", "Definition"],
      rows: [
        ["**TaskEnvelope**", "The serde-versioned unit of durable work: sender, recipient, input, deadline, budget, idempotency key, declared effect."],
        ["**Lease**", "A claim with a visibility timeout and explicit owner; expiry — not cancellation — is the correctness mechanism."],
        ["**ErrorClass**", "The closed taxonomy of attempt failures the shared retry policy matches on."],
        ["**DLQ**", "Dead-letter queue: retryable failures with exhausted budgets, kept as operator-visible, re-drivable evidence."],
        ["**Outbox**", "Checkpoint + task submission as one Postgres transaction, with a crash-safe, idempotent relay."],
        ["**EffectReceipt**", "A journaled provider confirmation for an `Idempotent` effect; the replay-time proof it already committed."],
        ["**AgentId**", "Stable tenant-namespaced agent identity; mailbox and thread are derivations of the one id."],
        ["**Fencing token**", "A monotonic activation token; a steal bumps the fence so stale owners can never pass."],
        ["**TeamTrace**", "Read-side assembly of a team's cross-journal events into one deterministic causal tree."],
        ["**RunManifest**", "Checkpoint-stamped SHA-256 pins for prompts, tool schemas, and model configuration."],
      ],
    },
  ],
};
