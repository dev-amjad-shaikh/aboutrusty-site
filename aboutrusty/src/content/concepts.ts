/**
 * Concepts page content: the four-layer concept map and the glossary.
 * Definitions are checked against rusty-src (CHANGELOG.md, docs/, rusty-core/src).
 * `lesson` is a chapter id in the Learn course's 11-part numbering; terms with
 * no chapter yet carry none.
 */

export interface Term {
  term: string;
  definition: string;
  lesson?: string;
}

export const TERMS: Term[] = [
  { term: "Agent (durable)", definition: "An agent with a stable ID, private state, and a persistent mailbox. Its state survives crashes and restarts.", lesson: "7.1" },
  { term: "Artifact", definition: "A file, image, audio clip, or dataset a run produced. Stored by content hash, with lineage back to the run and the effect that produced it.", lesson: "9.4" },
  { term: "Candidate", definition: "A proposed change to a prompt, policy, memory set, or tool permission. Candidates are immutable and content-addressed, and reach production only through evaluation and promotion.", lesson: "8.1" },
  { term: "Canary deployment", definition: "A revision serves a declared fraction of new runs. Assignment is a seeded draw, so each run's assignment can be reproduced from its journal.", lesson: "9.3" },
  { term: "Capsule", definition: "A WebAssembly component with a manifest that declares its capabilities and resource budgets. A capability the manifest does not grant does not exist inside the capsule.", lesson: "10.1" },
  { term: "Checkpoint", definition: "A saved copy of a thread's state, written at the boundary after each super-step. Runs resume from the latest one.", lesson: "3.1" },
  { term: "Checkpointer", definition: "The storage backend for checkpoints: InMemoryCheckpointer, JsonFileCheckpointer, or PostgresCheckpointer.", lesson: "3.1" },
  { term: "Connector", definition: "A connection to an external system, defined by one JSON Schema document. Credentials reach it as broker handles, never raw bytes." },
  { term: "Correction", definition: "A person's fix to an agent's output, with the corrector named. Run-scope corrections apply directly. Wider scopes become candidate memory, plus an example for the evaluation dataset.", lesson: "8.3" },
  { term: "Credential broker", definition: "Holds connection secrets encrypted at rest and gives tools short-lived, scope-checked handles instead of raw credentials.", lesson: "10.3" },
  { term: "Durable task", definition: "A unit of work in the server's queue. It is claimed under a lease, retried by one shared policy, and dead-lettered when retries run out.", lesson: "4.2" },
  { term: "Effect", definition: "The side-effect class of a call or node: Pure, ReadOnly, Idempotent, Compensatable, or NonIdempotent (irreversible). The class decides what may be retried, cached, or needs approval.", lesson: "5.2" },
  { term: "Effect receipt", definition: "A provider's confirmation that an idempotent effect committed, written to the journal. On recovery Rusty checks it before running the effect again.", lesson: "4.3" },
  { term: "Environment", definition: "A deployment target such as dev, staging, or prod. Each has a pointer to the revision it serves.", lesson: "9.1" },
  { term: "Evaluation", definition: "Checking a candidate or revision against recorded runs and a named dataset version before it can be promoted.", lesson: "9.2" },
  { term: "Flight Recorder", definition: "The run journal, exact replay, and run comparison, added in R0.5.", lesson: "5.1" },
  { term: "Fork", definition: "Copy a thread's checkpoints up to a chosen checkpoint into a new thread, then run from there. POST /threads/{id}/fork on the server.", lesson: "3.3" },
  { term: "Goal", definition: "A durable, revisioned objective an agent works toward across steps, turns, and restarts." },
  { term: "Graph", definition: "Nodes and edges that define an agent. Built with GraphBuilder and validated when you call compile().", lesson: "1.3" },
  { term: "Interrupt", definition: "A node calls ctx.interrupt(payload) to pause the run, usually to wait for a person. Resume with a value and the run continues from its checkpoint.", lesson: "3.2" },
  { term: "Knowledge source", definition: "Content added for retrieval, with provenance and a retention policy. Retrieval returns cited chunks." },
  { term: "Lease", definition: "A worker's time-limited claim on a durable task, kept alive by heartbeats. If the worker dies, the lease expires and the task becomes claimable again.", lesson: "4.2" },
  { term: "Mailbox", definition: "A persistent, typed message queue for a durable agent. The runtime stores and retries its messages.", lesson: "7.1" },
  { term: "Promotion", definition: "Making a candidate or revision the active version, inside a declared envelope and with any required approval. It is a journaled step.", lesson: "8.4" },
  { term: "Reducer", definition: "The rule that merges writes to a state channel: Overwrite, Append, DeepMerge, or AddMessages.", lesson: "2.2" },
  { term: "Release gate", definition: "A check that must pass before a revision is promoted into a gated environment. It replays the revision against a recorded dataset and compares it with the serving revision.", lesson: "9.2" },
  { term: "Remote node", definition: "A node whose work runs on a worker service over HTTP. Workers are built with the rusty-worker crate." },
  { term: "Replay", definition: "Re-running a recorded run with model and tool results served from its journal. Exact replay makes zero outbound calls.", lesson: "5.3" },
  { term: "Revision", definition: "An immutable, content-addressed deployment version that freezes the configuration it runs with.", lesson: "9.1" },
  { term: "Rollback", definition: "Moving a version pointer back to the previous version. The prior content is restored byte for byte.", lesson: "9.1" },
  { term: "Run", definition: "One execution of a graph on a thread.", lesson: "6.1" },
  { term: "Run journal", definition: "The hash-chained record of every event in a run: super-steps, model and tool calls, interrupts, and decisions, each with its causal parent.", lesson: "5.1" },
  { term: "Shadow deployment", definition: "A revision runs beside production with only Pure and ReadOnly effects allowed. Where it needs a refused effect, it gets the recorded outcome.", lesson: "9.3" },
  { term: "Signed receipt", definition: "An Ed25519 signature over a run's journal head, manifest digests, effect ledger, policy versions, and denied actions.", lesson: "5.5" },
  { term: "Skill", definition: "A reusable procedure packaged as a SKILL.md file, scanned and versioned by content before use." },
  { term: "State channel", definition: "A named, schema-declared field in a run's state. Each channel has a reducer.", lesson: "2.2" },
  { term: "Super-step", definition: "One round of execution: every scheduled node runs in parallel on the same snapshot, then their writes merge at a barrier.", lesson: "2.3" },
  { term: "Supervision", definition: "Restart policy for durable agents: permanent, transient, or temporary, with a limit on failures per period. Failures past the limit escalate to the supervisor.", lesson: "7.2" },
  { term: "Tenant", definition: "An isolated namespace on one server. API keys map to tenants, and cross-tenant reads answer 404.", lesson: "6.4" },
  { term: "Thread", definition: "The identity that groups a conversation's checkpoints. You resume and fork by thread.", lesson: "6.1" },
  { term: "WASM node", definition: "A graph node that runs a WebAssembly module in a Wasmtime sandbox (feature wasm)." },
];
