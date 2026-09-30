import type { Lesson } from "./types";

export const runJournal: Lesson = {
  id: "5.1",
  slug: "run-journal",
  title: "The run journal",
  minutes: 14,
  source: "rusty-core/src/journal.rs",
  before: ["2.3"],
  summary:
    "Every run writes a journal: an append-only list of events covering each step, each node's input and output, each model and tool call, each routing decision and checkpoint. Events carry a sequence number, a causal parent, and a declared effect, and the journal chains a SHA-256 hash over all of them, so an edited record is detectable.",
  glance: {
    learn: "What a RunEvent holds, and how seq, parent, and the head hash fit together",
    try: "Recording a run event by event, following parents, then editing an event",
    read: "Journal::record, RunEvent, and the server's events endpoint",
  },
  interactive: true,
  sections: [
    {
      id: "event",
      title: "One event",
      blocks: [
        {
          type: "p",
          text: "A log tells you what a process printed. To explain an agent run you need the exact order things happened in, which step caused which call, what each call received and returned, and some assurance the record wasn't changed afterwards. The executor writes a [[Run journal|run journal]] as the run happens, and the same record drives replay, run comparison, and signed receipts.",
        },
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
          text: "`effect` is one of five [[Effect|classes]]: `pure`, `read_only`, `idempotent`, `compensatable`, `non_idempotent`. It says what kind of side effect produced the event, which is what replay and retry policy read. Model and tool calls default to `non_idempotent`, because the runtime can't prove otherwise. [5.2 The effect taxonomy](/guide/12-policy-security.html) goes further.",
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
          text: "The enum is much larger than that list. At fedbb3a it has 68 variants, added as the platform grew: agent lifecycle and mailboxes, memory reads and writes, learning candidates, capsule calls, connections and credentials, artifacts, deployments, approvals, inbox intake, cancellation, and streamed assistant chunks. Each one is recorded through the same journal, so it gets the same ordering and hashing.",
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
          text: "`seq` tells you when; `parent` tells you why.",
        },
        {
          type: "predict",
          question: "The ReAct `agent` node calls the model. Which event becomes the `model_call`'s parent?",
          options: ["The step's `super_step_start`", "The `agent` invocation's `node_input`", "Whatever event was recorded just before it"],
          answer: 1,
          explain: "A call is caused by the node invocation that made it, so it points at that invocation's `node_input`. Position in the sequence is `seq`'s job.",
        },
        {
          type: "p",
          text: "The executor assigns parents with fixed rules:",
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
        {
          type: "lab",
          title: "Read a real journal",
          intro:
            "Start the demo server in open mode, run the `react_agent` graph once, and print one line per event: `seq`, kind, node, effect, and the `seq` of its parent. The demo's default model is a deterministic local model, so no key is needed.",
          commands: `# terminal 1
RUSTY_OPEN=1 cargo run -p rusty-agent-server --example server_demo

# terminal 2
REACT=$(curl -s -X POST localhost:8100/threads \\
  -H 'content-type: application/json' -d '{"graph": "react_agent"}' | jq -r .thread_id)
RUN_ID=$(curl -s -X POST localhost:8100/threads/$REACT/runs/wait \\
  -H 'content-type: application/json' \\
  -d '{"input": {"messages": [{"role": "user", "content": "say pong"}]}}' | jq -r .run_id)

curl -s localhost:8100/runs/$RUN_ID/events \\
  | jq -r '.events[] | "\\(.seq)\\t\\(.kind)\\t\\(.node_id // "-")\\t\\(.effect)\\tparent=\\(.parent // "-" | split(":") | last)"'`,
          output: `0	run_config_declared	-	pure	parent=-
1	super_step_start	-	pure	parent=-
2	node_input	agent	pure	parent=1
3	memory_read	-	read_only	parent=context_pipeline
4	memory_read	-	read_only	parent=context_pipeline
5	model_call	agent	non_idempotent	parent=2
6	node_output	agent	pure	parent=2
7	super_step_end	-	pure	parent=6
8	routing_decision	-	pure	parent=7
9	checkpoint_written	-	idempotent	parent=8
10	super_step_start	-	pure	parent=8
11	node_input	tools	pure	parent=10
12	tool_call	tools	pure	parent=11
13	tool_call	tools	pure	parent=11
14	tool_call	tools	pure	parent=11
15	tool_call	tools	read_only	parent=11
16	tool_call	tools	read_only	parent=11
17	node_output	tools	pure	parent=11
18	super_step_end	-	pure	parent=17
19	routing_decision	-	pure	parent=18
20	checkpoint_written	-	idempotent	parent=19
21	super_step_start	-	pure	parent=19
22	node_input	agent	pure	parent=21
23	memory_read	-	read_only	parent=context_pipeline
24	memory_read	-	read_only	parent=context_pipeline
25	model_call	agent	non_idempotent	parent=22
26	node_output	agent	pure	parent=22
27	super_step_end	-	pure	parent=26
28	routing_decision	-	pure	parent=27
29	checkpoint_written	-	idempotent	parent=28`,
          capturedAt: "fedbb3a · 2026-09-29",
        },
        {
          type: "p",
          text: "Three super-steps: agent, tools, agent. Each follows the parent rules above. Two kinds come from outside the executor's list: `run_config_declared` at seq 0, and `memory_read` events recorded by the server's context pipeline, whose parent is the pipeline's own id `rusty:context_pipeline` (the `jq` filter prints the part after the last colon). The demo's tools declare `pure` and `read_only` effects, so their calls are recorded with those classes.",
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
          type: "predict",
          question: "In a stored 30-event journal, someone edits the output of seq 9. Which head hashes change?",
          options: ["Only the head after seq 9", "The heads after seq 9 and every later event", "All 30, including those before seq 9"],
          answer: 1,
          explain: "Each head folds in the previous head, so the edit changes H at seq 9 and every head after it. The heads before seq 9 don't depend on it.",
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
          text: "So changing, removing, or reordering any event changes every head after it. `Journal::from_snapshot` recomputes the chain from the events and refuses a snapshot whose stored head doesn't match. The test `snapshot_roundtrip_reverifies_head` flips one event's status and checks the load fails.",
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
      title: "Limits",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "In memory during the run.",
              text: "The core journal lives in memory. The server persists it at checkpoint boundaries and at the end of the run, so a crash can lose events recorded since the last boundary.",
            },
            {
              label: "Tamper-evident only.",
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
  quiz: [
    {
      q: "Two parallel nodes record model calls at the same instant. What decides their order in the journal?",
      a: "`seq`, which the journal assigns under its lock at record time. Timestamps are an attribute; they don't define the order.",
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
  deeper: [
    { book: "03-journals.html#rusty-the-flight-recorder", label: "Journals & evidence: the Flight Recorder" },
    { book: "03-journals.html#one-recorded-fact", label: "Journals & evidence: one recorded fact" },
  ],
  related: [{ label: "5.3 Deterministic replay", href: "/learn/deterministic-replay" }],
};
