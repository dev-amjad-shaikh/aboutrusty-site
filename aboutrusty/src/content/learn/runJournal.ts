import type { Lesson } from "./types";

export const runJournal: Lesson = {
  id: "5.1",
  slug: "run-journal",
  title: "The run journal",
  minutes: 14,
  source: "rusty-core/src/journal.rs",
  before: ["2.3"],
  summary:
    "Every run writes a journal: an append-only list of events covering each step, each node's input and output, each model and tool call, each routing decision and checkpoint. Events carry a sequence number, a causal parent, and a declared effect, and the journal chains a SHA-256 hash over all of them. This lesson covers what an event holds, how parents are assigned, and how the hash makes the record tamper-evident.",
  glance: {
    learn: "What a RunEvent holds, and how seq, parent, and the head hash fit together",
    try: "Recording a run event by event, following parents, then editing an event",
    read: "Journal::record, RunEvent, and the server's events endpoint",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "The problem",
      blocks: [
        {
          type: "p",
          text: "A log tells you what a process printed. To explain an agent run you need more: the exact order things happened in, which step caused which call, what each call received and returned, and some assurance the record wasn't changed afterwards. Timestamps can't give you order across parallel tasks, and a text log can be edited without a trace.",
        },
        {
          type: "p",
          text: "Rusty's journal is built to answer those questions. It is written by the executor as the run happens, and the same record drives replay, run comparison, and signed receipts.",
        },
      ],
    },
    {
      id: "event",
      title: "One event",
      blocks: [
        {
          type: "p",
          text: "The unit is a `RunEvent`. Trimmed to its fields:",
        },
        {
          type: "code",
          file: "rusty-core/src/record.rs",
          symbol: "RunEvent",
          code: `pub struct RunEvent {
    pub id: String,              // "{run_id}:{seq}"
    pub run_id: String,
    pub thread_id: String,
    pub node_id: Option<String>, // None for run-wide events
    pub seq: u64,                // assigned by the journal
    pub kind: RunEventKind,
    pub effect: Effect,
    pub input: Option<PayloadRef>,
    pub output: Option<PayloadRef>,
    pub latency_ms: Option<u64>,
    pub tokens: Option<Usage>,
    pub cost_usd: Option<f64>,
    pub status: EventStatus,     // ok | error | interrupted
    pub parent: Option<String>,  // id of the event that caused this one
    pub recorded_at: DateTime<Utc>,
}`,
        },
        {
          type: "p",
          text: "Code that records an event builds an `EventDraft` with the kind, effect, node, payloads, and parent. The journal fills in the rest: `recorded_at` from the run's clock, then, under its lock, the next `seq` and the id `{run_id}:{seq}`. Because `seq` is assigned in one place, it is a total order even when parallel nodes record at the same moment.",
        },
        {
          type: "p",
          text: "`effect` is one of five classes: `pure`, `read_only`, `idempotent`, `compensatable`, `non_idempotent`. It says what kind of side effect produced the event, which is what replay and retry policy read. Model and tool calls default to `non_idempotent`, because the runtime can't prove otherwise. [5.2 The effect taxonomy](/guide/12-policy-security.html) goes further.",
        },
      ],
    },
    {
      id: "kinds",
      title: "Event kinds",
      toc: "Kinds",
      blocks: [
        {
          type: "p",
          text: "`RunEventKind` is a closed enum, and replay code matches on it exhaustively. The executor writes these for every run:",
        },
        {
          type: "rows",
          rows: [
            { label: "`super_step_start` / `super_step_end`", text: "Step boundaries. The start lists the active nodes; the end carries the channel values after the reducers ran." },
            { label: "`node_input` / `node_output`", text: "One pair per invocation: the state snapshot it received (with any Send scope), then its updates and command. A failed node gets an output with status `error`." },
            { label: "`routing_decision`", text: "The next active set, with scoped state for Send fan-outs, and any goto targets." },
            { label: "`checkpoint_written`", text: "The checkpoint id and step, after the checkpointer stored it." },
            { label: "`interrupt` / `resume`", text: "A node suspended the run; a later run resumed it from a checkpoint." },
            { label: "`model_call` / `tool_call`", text: "Recorded by the recording model and tool wrappers when the run has a journal attached. `remote_call` and `wasm_call` cover A2A delegations and WASM capsule invocations the same way." },
          ],
        },
        {
          type: "p",
          text: "The enum is much larger than that list. On main it has 68 variants, added as the platform grew: agent lifecycle and mailboxes, memory reads and writes, learning candidates, capsule calls, connections and credentials, artifacts, deployments, approvals, inbox intake, cancellation, and streamed assistant chunks. Each one is recorded through the same journal, so it gets the same ordering and hashing.",
        },
      ],
    },
    {
      id: "parents",
      title: "Causal parents",
      toc: "Parents",
      blocks: [
        {
          type: "p",
          text: "`seq` tells you when; `parent` tells you why. The executor assigns parents with fixed rules:",
        },
        {
          type: "list",
          items: [
            "`node_input` → the step's `super_step_start`",
            "`model_call`, `tool_call` → the invocation's `node_input`",
            "`node_output` → its own `node_input`",
            "`super_step_end` → the step's last `node_output`",
            "`routing_decision` → the `super_step_end`",
            "`checkpoint_written` → the `routing_decision`, or the `interrupt` for a suspension checkpoint",
            "the next `super_step_start` → the previous `routing_decision`, or the `resume` event",
          ],
        },
        {
          type: "p",
          text: "Nodes can't see the journal's ids on their own, so the executor passes the invocation's `node_input` id to the node in its config under the key `rusty.parent_event` (`PARENT_EVENT_KEY`). The prebuilt ReAct nodes read it to parent their model and tool calls, and refuse to record an unparented call.",
        },
        {
          type: "p",
          text: "Order matters here too. Parallel nodes finish in any order, but their `node_output` events are recorded in active-set order after the barrier, so two recordings of the same run have the same sequence.",
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [
        {
          type: "p",
          text: "Here is the journal of a two-turn ReAct run with a checkpointer: the agent asks for a tool, the tool answers, the agent replies. Record it event by event, select any event to highlight its chain of parents, then edit an event after the fact.",
        },
        { type: "diagram", name: "journal-explorer" },
      ],
    },
    {
      id: "head-hash",
      title: "The head hash",
      blocks: [
        {
          type: "p",
          text: "The journal keeps one running hash over everything it has recorded:",
        },
        {
          type: "code",
          file: "rusty-core/src/journal.rs",
          symbol: "JournalInner",
          code: `/// Running chained head hash: \`H_0 = sha256("")\`,
/// \`H_n = sha256(H_{n-1} || canonical_json(event_n))\`.
head_hash: String,`,
        },
        {
          type: "p",
          text: "`Journal::record` extends it on every append, over the event with its payload keys sorted, so the same content always hashes the same:",
        },
        {
          type: "code",
          file: "rusty-core/src/journal.rs",
          symbol: "Journal::record",
          code: `match serde_json::to_vec(&canonicalized_for_hash(&event)) {
    Ok(bytes) => {
        inner.head_hash = sha256_hex(&[inner.head_hash.as_bytes(), &bytes].concat());
    }
    // ...
}
inner.events.push(event);`,
        },
        {
          type: "p",
          text: "Changing, removing, or reordering any event changes every head after it. `Journal::from_snapshot` recomputes the chain from the events and refuses a snapshot whose stored head doesn't match. The test `snapshot_roundtrip_reverifies_head` flips one event's status and checks the load fails.",
        },
        {
          type: "p",
          text: "Checkpoints carry the head too. Each one stores a `journal_ref`: the number of events and the head hash at the moment it was minted. That ties a saved state to the exact evidence that produced it. Signed run receipts build on the same head.",
        },
      ],
    },
    {
      id: "payloads",
      title: "Large payloads",
      blocks: [
        {
          type: "p",
          text: "A payload of up to 4096 serialized bytes (`INLINE_PAYLOAD_MAX_BYTES`) is stored inline in the event. A larger one is stored once in the journal's artifact map under its SHA-256, and the event holds a reference with the hash and size. Scanning events stays cheap, and a payload repeated across events is stored once. The snapshot still contains the bytes, so a journal export is self-contained.",
        },
      ],
    },
    {
      id: "read",
      title: "Reading a journal",
      toc: "Reading",
      blocks: [
        {
          type: "p",
          text: "On the server, every run is journaled. `GET /runs/{run_id}/events` returns `{run_id, events, complete}`, where `complete` is true once the run has finished. The server saves the journal at each checkpoint boundary and when the run ends, and it re-verifies the head hash before serving it. The journal stays readable by run id after a restart. On a dev server started with `RUSTY_OPEN=1`:",
        },
        {
          type: "code",
          lang: "shell",
          code: `curl -s localhost:8100/runs/$RUN_ID/events \\
  | jq '{complete, count: (.events | length), first: .events[0].kind}'`,
        },
        {
          type: "p",
          text: "The SDKs wrap the same call: `client.run_events(run_id)` in Python and `client.runEvents(runId)` in TypeScript. A payload that was too large to inline is at `GET /runs/{run_id}/payloads/{sha256}`.",
        },
        {
          type: "p",
          text: "In-process, attach a journal with `RunConfig::with_journal` and read it back with `journal.events()`, or export it with `journal.snapshot()`. `rusty-core/examples/react_record_replay.rs` records a run this way before replaying it.",
        },
      ],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "In memory during the run.",
              text: "The core journal lives in memory. The server persists it at checkpoint boundaries and at the end of the run, so a crash can lose events recorded since the last boundary.",
            },
            {
              label: "Tamper-evident, not tamper-proof.",
              text: "The chain detects an edited journal. Someone who rewrites every event and the stored head can produce a consistent fake. Signed receipts close that gap by signing the head.",
            },
            {
              label: "Payloads are kept.",
              text: "Inputs and outputs are recorded in full, which is what makes replay possible. Treat journals as sensitive data and plan retention for them.",
            },
          ],
        },
      ],
    },
  ],
  takeaways: [
    "Every run journals RunEvents: step boundaries, node inputs and outputs, routing, checkpoints, and model and tool calls.",
    "seq is the total order, assigned by the journal; parent links each event to the one that caused it.",
    "A SHA-256 head hash is chained over every event, and loading a snapshot re-verifies it.",
    "Checkpoints store the head in journal_ref, binding saved state to its evidence.",
    "GET /runs/{id}/events serves the journal, re-verified, with a complete flag.",
  ],
  quiz: [
    {
      q: "Two parallel nodes record model calls at the same instant. What decides their order in the journal?",
      a: "`seq`, which the journal assigns under its lock at record time. Timestamps are an attribute, not the order.",
    },
    {
      q: "What is the causal parent of a `tool_call` made by the ReAct tools node?",
      a: "The tools node's `node_input` event for that invocation, passed to the node under `rusty.parent_event`.",
    },
    {
      q: "Someone edits the output of seq 9 in a stored journal. Where is that caught?",
      a: "When the snapshot is loaded: `Journal::from_snapshot` recomputes the head chain and rejects the mismatch. The server runs this check before serving events.",
    },
    {
      q: "A model call's request is 20 KB. Where is it stored?",
      a: "In the journal's artifact map under its SHA-256. The event holds a reference; the server serves the bytes at `/runs/{run_id}/payloads/{sha256}`.",
    },
  ],
  sources: [
    { path: "rusty-core/src/journal.rs", what: "Journal, EventDraft, record, head hash, JournalSnapshot" },
    { path: "rusty-core/src/record.rs", what: "RunEvent, RunEventKind, PayloadRef, JournalRef" },
    { path: "rusty-core/src/executor.rs", what: "Which events each super-step records, and their parents" },
    { path: "rusty-api/src/lib.rs", what: "Effect, the five effect classes" },
    { path: "rusty-server/src/routes.rs", what: "GET /runs/{run_id}/events and /payloads/{sha256}" },
  ],
  related: [
    { label: "5.3 Deterministic replay", href: "/learn/deterministic-replay" },
    { label: "Book: Journals & evidence", href: "/guide/03-journals.html" },
  ],
};
