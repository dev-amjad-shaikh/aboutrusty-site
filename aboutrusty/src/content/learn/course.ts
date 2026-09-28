/**
 * The 11-part Learn course. Every chapter either opens a written lesson
 * (`lesson`, a slug under /learn/) or points at the book chapter that covers
 * the topic today (`book`, a path under /guide/).
 */

export interface Chapter {
  id: string;
  t: string;
  /** Slug of the lesson written for this chapter. */
  lesson?: string;
  /** A section of another lesson that covers this chapter: "slug#anchor". */
  within?: string;
  /** Book chapter under /guide/, when no lesson covers it yet. */
  book?: string;
}

export interface Part {
  title: string;
  lead: string;
  tag: string;
  chapters: Chapter[];
}

export interface Act {
  name: string;
  title: string;
  parts: Part[];
}

export const ACTS: Act[] = [
  {
    name: "Act I",
    title: "The engine",
    parts: [
      {
        title: "Foundations",
        lead: "What an agent does at runtime, how it fails, and why graphs and super-steps are the answer.",
        tag: "",
        chapters: [
          { id: "1.1", t: "What an agent does at runtime", book: "01-the-problem.html" },
          { id: "1.2", t: "How agents fail", book: "01-the-problem.html#the-five-questions" },
          { id: "1.3", t: "Graphs as a programming model", book: "02-mental-model.html#five-concepts" },
          { id: "1.4", t: "Super-steps and the Pregel idea", book: "02-mental-model.html#five-concepts" },
          { id: "1.5", t: "Where Rusty comes from", book: "01-the-problem.html#what-the-field-does-today" },
        ],
      },
      {
        title: "A run, step by step",
        lead: "Follow one super-step through the executor: channels, reducers, the barrier, the merge.",
        tag: "rusty-core",
        chapters: [
          { id: "2.1", t: "The four primitives", book: "02-mental-model.html#five-concepts" },
          { id: "2.2", t: "State channels and reducers", book: "02-mental-model.html#one-run-end-to-end" },
          { id: "2.3", t: "The super-step loop", lesson: "super-step-loop" },
          { id: "2.4", t: "Snapshot isolation and deterministic merges", book: "02-mental-model.html#five-concepts" },
          { id: "2.5", t: "Routing and fan-out", book: "02-mental-model.html#five-concepts" },
          { id: "2.6", t: "The ReAct agent as a graph", book: "02-mental-model.html#one-run-end-to-end" },
        ],
      },
      {
        title: "Pausing and resuming",
        lead: "Where state is saved, how a run waits for a person, and how you go back in time.",
        tag: "rusty-core",
        chapters: [
          { id: "3.1", t: "Checkpoints", lesson: "checkpoints" },
          { id: "3.2", t: "Interrupts", lesson: "interrupts" },
          { id: "3.3", t: "Time travel and forks", within: "checkpoints#time-travel" },
          { id: "3.4", t: "Why nodes must be idempotent", book: "10-durability.html#level-one-the-checkpointed-run" },
        ],
      },
    ],
  },
  {
    name: "Act II",
    title: "Reliability and evidence",
    parts: [
      {
        title: "Surviving failure",
        lead: "Side effects, leases, and retries: how work outlives a crash without running twice.",
        tag: "R0.6",
        chapters: [
          { id: "4.1", t: "Why checkpoints aren't enough", book: "10-durability.html#level-two-durable-work" },
          { id: "4.2", t: "Leases, heartbeats, and retries", book: "10-durability.html#level-two-durable-work" },
          { id: "4.3", t: "Idempotency keys and effect receipts", book: "10-durability.html#level-two-durable-work" },
          { id: "4.4", t: "Walkthrough: the crash_recovery test", lesson: "crash-recovery" },
        ],
      },
      {
        title: "Explaining a run",
        lead: "The Flight Recorder: journals, effect types, exact replay, and signed receipts.",
        tag: "R0.5",
        chapters: [
          { id: "5.1", t: "The run journal", book: "03-journals.html#one-recorded-fact" },
          { id: "5.2", t: "The effect taxonomy", book: "12-policy-security.html" },
          { id: "5.3", t: "Deterministic replay", lesson: "deterministic-replay" },
          { id: "5.4", t: "Comparing two runs", book: "03-journals.html#replay-the-point-of-the-exercise" },
          { id: "5.5", t: "Signed receipts", book: "07-capsules.html#cedar-and-signed-run-receipts" },
        ],
      },
      {
        title: "The server",
        lead: "How the HTTP server exposes the engine without changing its semantics.",
        tag: "rusty-server",
        chapters: [
          { id: "6.1", t: "Threads, runs, and assistants", book: "13-server-sdks.html#rusty-server-the-resource-model" },
          { id: "6.2", t: "One active run per thread", book: "13-server-sdks.html#the-two-rules-worth-remembering" },
          { id: "6.3", t: "Streaming and reconnects", book: "13-server-sdks.html#the-two-rules-worth-remembering" },
          { id: "6.4", t: "Tenants by namespace", book: "12-policy-security.html" },
          { id: "6.5", t: "Storage and graceful shutdown", book: "22-deploy-operate.html#the-production-checklist" },
        ],
      },
    ],
  },
  {
    name: "Act III",
    title: "Operating at scale",
    parts: [
      {
        title: "Many agents",
        lead: "Durable agents, mailboxes, supervision, and coordination patterns.",
        tag: "R0.7",
        chapters: [
          { id: "7.1", t: "Durable agents and mailboxes", book: "08-blueprints-agents.html#the-mailbox-is-an-addressing-discipline" },
          { id: "7.2", t: "Supervision", book: "08-blueprints-agents.html#state-scopes-and-supervision" },
          { id: "7.3", t: "Coordination patterns", book: "11-sub-agents.html#the-four-patterns" },
          { id: "7.4", t: "Delta checkpoints", within: "checkpoints#delta-checkpoints" },
        ],
      },
      {
        title: "Changing behavior safely",
        lead: "How Rusty learns from corrections without silently rewriting production.",
        tag: "R0.8",
        chapters: [
          { id: "8.1", t: "The learning rule", book: "05-learning-loop.html#the-six-stages" },
          { id: "8.2", t: "Governed memory", book: "04-memory.html#rusty-governed-memory" },
          { id: "8.3", t: "Corrections", book: "05-learning-loop.html#the-correction-loop-the-highest-trust-input" },
          { id: "8.4", t: "Promotion and rollback", book: "05-learning-loop.html#the-six-stages" },
          { id: "8.5", t: "The runtime twin", book: "05-learning-loop.html#the-policy-plane-and-an-honest-caveat" },
        ],
      },
      {
        title: "Shipping",
        lead: "Revisions, release gates, canaries, and shadows.",
        tag: "R0.12",
        chapters: [
          { id: "9.1", t: "Revisions and pointers", book: "22-deploy-operate.html#shipping-changes-the-deployment-control-plane" },
          { id: "9.2", t: "Release gates", book: "20-evaluate.html#from-report-to-release-decision" },
          { id: "9.3", t: "Canary and shadow", lesson: "canary-and-shadow" },
          { id: "9.4", t: "Artifacts and lineage", book: "22-deploy-operate.html#run-artifacts" },
        ],
      },
      {
        title: "Security",
        lead: "Deny by default: capsules, authorization, and the credential broker.",
        tag: "R0.9",
        chapters: [
          { id: "10.1", t: "Capsules", book: "07-capsules.html" },
          { id: "10.2", t: "Authorization", book: "07-capsules.html#cedar-and-signed-run-receipts" },
          { id: "10.3", t: "The credential broker", book: "09-tools-connectors.html#the-connector-standard-one-shape-no-exceptions" },
        ],
      },
      {
        title: "Why Rust",
        lead: "How Rust's type system and ownership shape the design, and what it costs.",
        tag: "",
        chapters: [
          { id: "11.1", t: "Send, Sync, and parallel nodes", book: "02-mental-model.html#five-concepts" },
          { id: "11.2", t: "Ownership as transactions", within: "super-step-loop#barrier" },
          { id: "11.3", t: "Copy-on-write state", within: "checkpoints#delta-checkpoints" },
          { id: "11.4", t: "Effects as types", book: "12-policy-security.html" },
          { id: "11.5", t: "Types that can't leak", book: "09-tools-connectors.html#the-connector-standard-one-shape-no-exceptions" },
          { id: "11.6", t: "What Rust costs", book: "00-preface.html#what-rusty-is-in-one-page" },
        ],
      },
    ],
  },
];

export const PARTS: Part[] = ACTS.flatMap((a) => a.parts);

export const CHAPTERS: (Chapter & { part: number })[] = PARTS.flatMap((p, i) =>
  p.chapters.map((c) => ({ ...c, part: i + 1 })),
);
