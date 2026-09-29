import type { Lesson } from "./types";

export const whereRustyComesFrom: Lesson = {
  id: "1.5",
  slug: "where-rusty-comes-from",
  title: "Where Rusty comes from",
  minutes: 7,
  source: "README.md",
  before: ["1.4"],
  summary:
    "Rusty takes LangGraph's execution model and rebuilds it in Rust on tokio. If you know LangGraph, most of the vocabulary carries over. This lesson maps the names, lists what Rusty changes, and says where LangGraph is further along.",
  glance: {
    learn: "Which LangGraph ideas Rusty keeps, and what it changes",
    try: "Predicting what a long loop does under each runtime's defaults",
    read: "The README comparison and the LangGraph notes in rusty-core",
  },
  sections: [
    {
      id: "lineage",
      title: "The lineage",
      blocks: [
        {
          type: "p",
          text: "The README states the relationship in two sentences:",
        },
        {
          type: "note",
          text: "LangGraph proved the execution model: state channels with reducers, super-step parallelism, and checkpoints that turn durability, human-in-the-loop, and time travel into one primitive. Rusty rebuilds that model on tokio for teams who want it without operating a Python service.",
        },
        {
          type: "p",
          text: "So the parts you met in 1.3 and 1.4 are LangGraph's design. The source says so where it matters: doc comments in `rusty-core` name the LangGraph analog of each piece.",
        },
      ],
    },
    {
      id: "same",
      title: "What carries over",
      blocks: [
        {
          type: "rows",
          rows: [
            { label: "`LastValue`, `add_messages`", text: "`Reducer::Overwrite` and `Reducer::AddMessages` (state.rs has the full table, including `Append` for list concatenation)." },
            { label: "`InvalidUpdateError`", text: "`RustyError::InvalidUpdate`, for the same class of bug: two writes to a single-value channel in one step." },
            { label: "`START` edge", text: "`GraphBuilder::set_entry_point`." },
            { label: "`Send` API", text: "`Route::Send` with one `Send` per item." },
            { label: "`Command`", text: "`Command`, with `goto` to choose the next nodes and `resume` to carry a resume value." },
            { label: "`RunnableConfig`", text: "`RunConfig` for the run, and `NodeConfig` inside each node." },
            { label: "`BaseCheckpointSaver`", text: "The `Checkpointer` trait." },
            { label: "`interrupt` and resume", text: "`ctx.interrupt(payload)` and `RunConfig::with_resume(value)`. The interrupted node re-runs from its start, as in LangGraph." },
            { label: "`create_react_agent`", text: "`create_react_agent`, the same name. react.rs describes it as parity with LangGraph's." },
            { label: "`langgraph.json`", text: "`Cargo.toml`. Your graphs compile into your server binary." },
          ],
        },
      ],
    },
    {
      id: "different",
      title: "What Rusty changes",
      blocks: [
        {
          type: "p",
          text: "Rust and tokio are the obvious change. Each super-step spawns its nodes into a `tokio::task::JoinSet`, and the barrier drains it. `ChatModel` and `Tool` must be `Send + Sync`, so the compiler checks that models and tools can be shared across the tasks running a step. [11.1 Send, Sync, and parallel nodes](/learn/send-sync) goes into that.",
        },
        {
          type: "p",
          text: "Some defaults differ too. The step limit is one of them:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "DEFAULT_MAX_STEPS",
          code: `/// Default super-step limit. Deliberately far above LangGraph's default
/// \`recursion_limit\` of 25: ReAct-style loops burn one super-step per
/// agent/tool hop, so long tool chains legitimately exceed 25.
pub const DEFAULT_MAX_STEPS: usize = 1000;`,
        },
        {
          type: "predict",
          question:
            "An agent needs 40 trips around `agent → tools`, about 80 super-steps. You run it on Rusty with the default `RunConfig`. What happens?",
          options: [
            "It stops at step 25 with an error, as it would under LangGraph's default",
            "It finishes normally",
            "It suspends at the ceiling and waits to be resumed",
          ],
          answer: 1,
          explain:
            "80 steps is well under the default of 1000, so the run finishes. A run that does reach the ceiling suspends with a checkpoint and a `rusty.halted` payload instead of failing, so you can resume it with a higher limit.",
        },
        {
          type: "p",
          text: "The other differences listed in the README and visible in the source:",
        },
        {
          type: "list",
          items: [
            "**Deployment.** One static binary: the engine, your graphs, and the axum HTTP/SSE server. No Python runtime and no Redis.",
            "**Remote and sandboxed nodes.** A `RemoteNode` runs a node on another service over HTTP, with interrupts crossing the wire. A `WasmNode` runs a WebAssembly module in Wasmtime with fuel and memory caps (feature `wasm`).",
            "**Effects and approvals.** Every tool and model declares an [[Effect]], defaulting to `NonIdempotent`, and every run carries an approval gate. That is why `react_agent` stopped for approval in 1.1.",
            "**The Flight Recorder.** A hash-chained [[Run journal]] for each run, and exact [[Replay]] from it with zero outbound calls.",
            "**Other languages go through HTTP.** There are no Python or Node bindings; the README lists PyO3 and napi-rs as deliberately rejected. The Python and TypeScript SDKs talk to the server.",
          ],
        },
      ],
    },
    {
      id: "further-along",
      title: "Where LangGraph is further along",
      toc: "Honest limits",
      blocks: [
        {
          type: "p",
          text: "The README is direct about this. If you want a batteries-included Python ecosystem or a fully managed control plane today, it points you to LangGraph and LangGraph Platform. Its known-limitations section adds the specifics for Rusty v0.x:",
        },
        {
          type: "list",
          items: [
            "The executor is single-node. Remote nodes distribute node work, but the loop itself isn't clustered and has no failover.",
            "Persistence is single-node: in memory, JSON files, or Postgres (feature `postgres`), with no replication.",
            "Checkpoints happen only at step boundaries, so a resumed node re-executes from its start and must be idempotent.",
          ],
        },
        {
          type: "p",
          text: "Rusty's comparison table is dated 2026-09-26 and marks anything it hasn't verified about other projects with a dash. Read it in the [README](https://github.com/dev-amjad-shaikh/rusty/blob/fedbb3a8bb249fbb981bd55ab15d92a11da5aac0/README.md#how-rusty-compares) before you choose.",
        },
      ],
    },
  ],
  deeper: [
    { book: "01-the-problem.html#what-the-field-does-today", label: "What the field does today" },
    { book: "01-the-problem.html#rusty-s-answer", label: "Rusty's answer" },
  ],
  sources: [
    { path: "README.md", what: "Why Rusty exists, How Rusty compares, known limitations" },
    { path: "rusty-core/src/state.rs", what: "Reducer table with LangGraph analogs" },
    { path: "rusty-core/src/executor.rs", what: "RunConfig, DEFAULT_MAX_STEPS, the JoinSet per step" },
    { path: "rusty-core/src/react.rs", what: "create_react_agent parity note" },
    { path: "rusty-core/src/checkpoint.rs", what: "Checkpointer, the BaseCheckpointSaver analog" },
  ],
};
