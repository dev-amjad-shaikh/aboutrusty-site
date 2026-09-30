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
  /** End-of-part check: questions that span the part's chapters. */
  recap?: { q: string; a: string }[];
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
          { id: "1.1", t: "What an agent does at runtime", lesson: "agent-at-runtime" },
          { id: "1.2", t: "How agents fail", lesson: "how-agents-fail" },
          { id: "1.3", t: "Graphs as a programming model", lesson: "graphs" },
          { id: "1.4", t: "Super-steps and the Pregel idea", lesson: "pregel" },
          { id: "1.5", t: "Where Rusty comes from", lesson: "where-rusty-comes-from" },
        ],
        recap: [
          {
            q: "`react_agent` stops in step 1 with an approval payload, even though its tools only add numbers and echo text. Why?",
            a: "Neither tool declares an [[Effect]], so both default to `NonIdempotent`. Every run carries an approval gate, and it asks about irreversible calls before they run.",
          },
          {
            q: "A checkpointed run dies in the middle of a node. What is lost, and what does that require of the node?",
            a: "Only the step in flight. The run resumes from the checkpoint written at the last step boundary and runs that node again from its start, so the node must be safe to repeat.",
          },
          {
            q: "Where does an agent's loop live in a Rusty graph, and what stops it running forever?",
            a: "In the edges: a router on `agent` returns `tools` or `Route::End`, and `tools → agent` is a static edge. Each trip is a new [[Super-step]], counted against `max_steps` (default 1000). At the ceiling the run suspends with a checkpoint.",
          },
          {
            q: "In a fan-out, what does the barrier guarantee to the node that runs next, and what does it cost?",
            a: "The next node sees every write from the step, merged. The cost is that the step lasts as long as its slowest node.",
          },
        ],
      },
      {
        title: "A run, step by step",
        lead: "Follow one super-step through the executor: channels, reducers, the barrier, the merge.",
        tag: "rusty-core",
        chapters: [
          { id: "2.1", t: "The four primitives", lesson: "four-primitives" },
          { id: "2.2", t: "State channels and reducers", lesson: "state-channels" },
          { id: "2.3", t: "The super-step loop", lesson: "super-step-loop" },
          { id: "2.4", t: "Snapshot isolation and deterministic merges", lesson: "snapshot-isolation" },
          { id: "2.5", t: "Routing and fan-out", lesson: "routing" },
          { id: "2.6", t: "The ReAct agent as a graph", lesson: "react-as-a-graph" },
        ],
        recap: [
          {
            q: "Four `Send`s target `process_item`, and each invocation writes `results`. Which reducer must `results` have, and what happens with `Overwrite`?",
            a: "A multi-write reducer such as `Append`. With `Overwrite` the merge fails with `InvalidUpdate` naming `process_item` as both writers, and no write from the step is applied.",
          },
          {
            q: "One node in a step fails after its siblings finished. What reaches the state, and what does the next resume run?",
            a: "Nothing from that step. The error aborts the step, the state stays at the previous boundary, and the last checkpoint still lists the step's nodes to run.",
          },
          {
            q: "A router returns `Route::Node(\"sumarize\")` with a typo. When do you find out?",
            a: "At run time, when that branch is taken: the executor fails with `RustyError::Graph`. `compile()` checks only static structure, because router targets are data.",
          },
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
          { id: "3.4", t: "Why nodes must be idempotent", lesson: "idempotent-nodes" },
        ],
        recap: [
          {
            q: "A run suspends at an interrupt and is resumed a day later. Which nodes run first, and from where in their code?",
            a: "Every node of the interrupted step, from its first line. The suspension checkpoint schedules the whole active set, and the resume value is visible to all of them.",
          },
          {
            q: "How do you try a different answer from step 2 without changing the original thread's history?",
            a: "Fork the thread at that checkpoint and run the fork with `with_checkpoint_id`. Replaying on the original thread appends a newer timeline that the next resume would continue.",
          },
          {
            q: "A `JsonFileCheckpointer` thread directory holds a checkpoint whose `state` is `{}` and whose `base` names another file. Is it corrupt?",
            a: "No. It is a delta: nothing changed since its base. Reads fold the chain and always return a full checkpoint.",
          },
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
          { id: "4.2", t: "Leases, heartbeats, and retries", lesson: "leases-and-retries" },
          { id: "4.3", t: "Idempotency keys and effect receipts", book: "10-durability.html#level-two-durable-work" },
          { id: "4.4", t: "Walkthrough: the crash_recovery test", lesson: "crash-recovery" },
        ],
        recap: [
          {
            q: "A worker sends an email and is killed before reporting. Which mechanism brings the task back, and which one stops a second email?",
            a: "The [[Lease]] expires and another worker claims the task as attempt 2. The idempotency key, passed to the provider, makes the repeat a no-op.",
          },
          {
            q: "A task declared `non_idempotent` fails with `timeout` on attempt 1 of 3. What happens?",
            a: "It fails outright with `next_attempt_at` null and never enters the dead-letter queue. The effect gate runs before the class and attempt gates.",
          },
          {
            q: "Worker A's lease expired and worker B holds the task. A calls `complete`. What does A get?",
            a: "409. Heartbeat, complete, and fail check lease ownership atomically with the change.",
          },
        ],
      },
      {
        title: "Explaining a run",
        lead: "The Flight Recorder: journals, effect types, exact replay, and signed receipts.",
        tag: "R0.5",
        chapters: [
          { id: "5.1", t: "The run journal", lesson: "run-journal" },
          { id: "5.2", t: "The effect taxonomy", book: "12-policy-security.html" },
          { id: "5.3", t: "Deterministic replay", lesson: "deterministic-replay" },
          { id: "5.4", t: "Comparing two runs", book: "03-journals.html#replay-the-point-of-the-exercise" },
          { id: "5.5", t: "Signed receipts", book: "07-capsules.html#cedar-and-signed-run-receipts" },
        ],
        recap: [
          {
            q: "Two parallel nodes record model calls at the same moment. What orders them in the journal, and what links each call to its cause?",
            a: "`seq`, assigned by the journal under its lock, gives the order. `parent` points at the calling invocation's `node_input` event.",
          },
          {
            q: "You change a tool's description and replay an old recording. What happens?",
            a: "Tool schemas are part of the model request, so the request hash differs. Replay stops with a divergence at that call's recorded `seq` and makes no outbound call.",
          },
          {
            q: "How do you tell whether a stored journal was edited after the run?",
            a: "Recompute the chained head hash. `Journal::from_snapshot` does this and refuses a snapshot whose stored head doesn't match; the server checks before serving events.",
          },
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
        recap: [
          {
            q: "Months later, how do you prove which revision served a given run under a 10% canary?",
            a: "Recompute the seeded draw from the environment, the canary revision id, and the run id, all journaled. The run's journaled resolution must equal it.",
          },
          {
            q: "A shadow run asks to send an email the recorded run never sent. What happens?",
            a: "The effect is refused and journaled as `ShadowEffectRefused`, and the verdict counts it as unserved: the candidate diverged from production.",
          },
        ],
      },
      {
        title: "Security",
        lead: "Deny by default: capsules, authorization, and the credential broker.",
        tag: "R0.9",
        chapters: [
          { id: "10.1", t: "Capsules", lesson: "capsules" },
          { id: "10.2", t: "Authorization", book: "07-capsules.html#cedar-and-signed-run-receipts" },
          { id: "10.3", t: "The credential broker", book: "09-tools-connectors.html#the-connector-standard-one-shape-no-exceptions" },
        ],
        recap: [
          {
            q: "A capsule's manifest grants network to `api.example.com` and it tries `evil.example.com`. Where is that stopped, and what is left behind?",
            a: "Inside the linked `fetch` import, before any socket opens. The refusal is journaled as a `CapsuleDenial` naming the absent grant.",
          },
          {
            q: "Can a tenant overlay give a capsule a host its manifest didn't declare?",
            a: "No. The effective grants are the intersection of manifest and overlay. A same-kind pair with nothing in common drops out.",
          },
        ],
      },
      {
        title: "Why Rust",
        lead: "How Rust's type system and ownership shape the design, and what it costs.",
        tag: "",
        chapters: [
          { id: "11.1", t: "Send, Sync, and parallel nodes", lesson: "send-sync" },
          { id: "11.2", t: "Ownership as transactions", within: "super-step-loop#barrier" },
          { id: "11.3", t: "Copy-on-write state", within: "checkpoints#delta-checkpoints" },
          { id: "11.4", t: "Effects as types", book: "12-policy-security.html" },
          { id: "11.5", t: "Types that can't leak", book: "09-tools-connectors.html#the-connector-standard-one-shape-no-exceptions" },
          { id: "11.6", t: "What Rust costs", book: "00-preface.html#what-rusty-is-in-one-page" },
        ],
        recap: [
          {
            q: "A node closure captures an `Rc`. When and where is it rejected?",
            a: "At compile time, on the `add_node` call: `Rc` is neither `Send` nor `Sync`, so the closure and its future fail the `N: Node + 'static` bound.",
          },
          {
            q: "Why is giving every node its own copy of a 10 MB state cheap?",
            a: "`State` is an `Arc` over a map of `Arc`'d values. A clone is one atomic increment, and writes copy only the channels they touch, at the barrier.",
          },
          {
            q: "What does dropping the JoinSet do when a node fails?",
            a: "It aborts every node task still running. Ownership makes the rollback of a failed step need no cleanup code.",
          },
        ],
      },
    ],
  },
];

export const PARTS: Part[] = ACTS.flatMap((a) => a.parts);

export const CHAPTERS: (Chapter & { part: number })[] = PARTS.flatMap((p, i) =>
  p.chapters.map((c) => ({ ...c, part: i + 1 })),
);
