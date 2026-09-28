import type { Lesson } from "./types";

export const deterministicReplay: Lesson = {
  id: "5.3",
  slug: "deterministic-replay",
  title: "Deterministic replay",
  minutes: 15,
  source: "rusty-core/src/replay.rs",
  before: ["2.3"],
  summary:
    "Every run records a journal of what happened: each step, each node's input and output, each model and tool call. Exact replay runs the graph again and answers every model and tool call from that journal, making no outbound calls. If the replayed run asks for something the recording doesn't have, it fails at the first difference. This lesson covers how that works and what it takes.",
  glance: {
    learn: "What makes a run reproducible, and where it can't be",
    try: "Replaying a run, then changing a prompt to make it diverge",
    read: "The divergence check in replay.rs and the record/replay example",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "The problem",
      blocks: [
        {
          type: "p",
          text: "An agent gave a wrong answer yesterday. To debug it you want to run it again and watch. But the model won't return the same text twice, the tools read a world that has changed, and timestamps and ids differ on every run. Running it again gives you a different run.",
        },
        {
          type: "p",
          text: "Exact replay removes each source of difference: recorded answers for model and tool calls, a logical clock, and a seeded random number generator.",
        },
      ],
    },
    {
      id: "journal",
      title: "What the journal records",
      toc: "The journal",
      blocks: [
        {
          type: "p",
          text: "The journal is a list of `RunEvent`s. Each has a deterministic id `{run_id}:{seq}`, a `kind`, the node, the input and output, the declared `effect`, a status, and a `parent` that points at the event that caused it. Kinds include `SuperStepStart`, `NodeInput`, `NodeOutput`, `ModelCall`, `ToolCall`, `RoutingDecision`, `CheckpointWritten`, `Interrupt`, and `Resume`.",
        },
        {
          type: "p",
          text: "The journal keeps a running hash over its events. Each event is folded into the previous head hash, so changing, removing, or reordering any event changes the head:",
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
          text: "Checkpoints store the journal head at their boundary (`journal_ref`), so a saved state is tied to the events that produced it.",
        },
      ],
    },
    {
      id: "seams",
      title: "Clock and randomness",
      toc: "Seams",
      blocks: [
        {
          type: "p",
          text: "Everything the executor timestamps or mints reads through two seams on `RunConfig`. The defaults are the system clock and OS entropy. For a reproducible run, set both:",
        },
        {
          type: "code",
          file: "rusty-core/examples/react_record_replay.rs",
          code: `let journal = Journal::new(
    "run-react-demo",
    "react-record-replay",
    Clock::logical(CLOCK_START_MS, CLOCK_TICK_MS),
);
// ...
RunConfig::new("react-record-replay")
    .with_journal(journal.clone())
    .with_rng(RngSource::seeded(RNG_SEED))`,
        },
        {
          type: "p",
          text: "`Clock::logical(start_ms, tick_ms)` advances by `tick_ms` on every read, so time depends only on how many times it was read. `RngSource::seeded(seed)` is a ChaCha8 stream, so checkpoint ids and run ids come out the same.",
        },
      ],
    },
    {
      id: "replay",
      title: "Serving calls from the journal",
      toc: "Replay",
      blocks: [
        { type: "p", text: "Step through a replay of a two-turn ReAct run, then change the prompt and replay again:" },
        { type: "diagram", name: "replay" },
        {
          type: "p",
          text: "Only four kinds of event are served from the recording: `ModelCall`, `ToolCall`, `RemoteCall`, and `WasmCall`. Everything else, including state merges and routing, is recomputed by the executor and must come out the same. The replaying wrappers `ReplayingChatModel` and `ReplayingTool` wrap the real model and tools but have no code path that calls them.",
        },
        {
          type: "p",
          text: "Each served call is matched by position, kind, and a hash of the canonical request. If the replayed run asks for something else, replay stops with a `RustyError::Replay`:",
        },
        {
          type: "code",
          file: "rusty-core/src/replay.rs",
          symbol: "ReplaySource::serve",
          code: `if recorded_hash != issued_hash {
    return Err(replay_error(format!(
        "replay divergence at recorded seq {} ({:?}): the run issued a request whose \\
         canonical hash is {issued_hash}, but the journaled request hashes to \\
         {recorded_hash} — the replayed run has diverged from its evidence",
        event.seq, event.kind
    )));
}`,
        },
        {
          type: "p",
          text: "After the run, `run_and_verify` compares the replayed journal with the recording event by event, including the head hash. A replay that stops early fails too, because recorded calls were left unserved.",
        },
      ],
    },
    {
      id: "try",
      title: "Run it",
      blocks: [
        {
          type: "p",
          text: "The example records a ReAct run with a scripted model and an echo tool, then replays it over models and tools that panic if called:",
        },
        { type: "code", lang: "shell", code: `cd rusty-core
cargo run --example react_record_replay` },
        {
          type: "p",
          text: "It prints the sentinel call counts (zero) and whether the two journals are byte-identical. `rusty-core/tests/replay.rs` asserts the same in `exact_replay_reproduces_journal_and_state_byte_identically`, and `divergent_graph_fails_loudly_with_sequence_and_hashes` covers the failure path.",
        },
        {
          type: "p",
          text: "To keep a run as a regression test, `ReplayFixture` bundles the journal, the final checkpoint, and the clock and RNG parameters into one JSON file. A checked-in example lives at `rusty-core/tests/fixtures/exact_replay_agent_tools.json`. On the server, `GET /runs/{run_id}/fixture` downloads one for a finished run.",
        },
      ],
    },
    {
      id: "limits",
      title: "Limits",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "Resumed runs",
              text: "`ExactReplay::new` refuses a journal that contains a `Resume` event. The state before the resume lives in a checkpoint the journal doesn't carry. Replay the original run's journal instead.",
            },
            {
              label: "Parallel steps",
              text: "Byte-identical journals are guaranteed for runs whose steps run one node at a time. Parallel nodes in one step read the logical clock in scheduling order.",
            },
            {
              label: "Server replay",
              text: "`POST /runs/replay` re-executes node code on the server and compares journals more loosely, since server runs use the system clock. It refuses journals that contain model or tool calls, because it can't serve them; download the fixture and replay it in CI.",
            },
            {
              label: "Changed code",
              text: "Replay proves the recorded run is reproducible under the recorded code. If you change a prompt or a tool schema, the request hash changes and replay reports where.",
            },
          ],
        },
      ],
    },
  ],
  takeaways: [
    "The journal records every step and every model, tool, remote, and WASM call, chained by a head hash.",
    "Exact replay serves those four call kinds from the journal and recomputes everything else.",
    "A logical clock and a seeded RNG make timestamps and ids reproducible.",
    "A different request fails loudly at the first recorded sequence number that doesn't match.",
  ],
  quiz: [
    {
      q: "During exact replay, does the executor recompute state merges or read them from the journal?",
      a: "It recomputes them. Only model, tool, remote, and WASM calls are served. The recomputed events must match the recording.",
    },
    {
      q: "You edit a tool's description and replay an old run. What happens?",
      a: "Tool schemas are part of the model request, so the request hash differs and replay fails with a divergence at that call's sequence number.",
    },
    {
      q: "Why can't you exact-replay a run that was resumed after an interrupt?",
      a: "Its journal starts from a checkpoint's state, which the journal doesn't contain. Replay the original run instead.",
    },
  ],
  sources: [
    { path: "rusty-core/src/replay.rs", what: "ExactReplay, ReplaySource, BranchDiff, ReplayFixture" },
    { path: "rusty-core/src/journal.rs", what: "Journal, Clock, RngSource, head hash" },
    { path: "rusty-core/src/record.rs", what: "RunEvent, RunEventKind" },
    { path: "rusty-core/examples/react_record_replay.rs", what: "Record, then replay with panic sentinels" },
    { path: "rusty-core/tests/replay.rs", what: "Determinism and divergence tests" },
  ],
  related: [{ label: "Book: Journals & evidence", href: "/guide/03-journals.html" }],
};
