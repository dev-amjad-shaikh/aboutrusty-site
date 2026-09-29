import type { Lesson } from "./types";

export const superStepLoop: Lesson = {
  id: "2.3",
  slug: "super-step-loop",
  title: "The super-step loop",
  minutes: 15,
  source: "rusty-core/src/executor.rs",
  before: ["2.1", "2.2"],
  summary:
    "Rusty runs a graph in rounds called super-steps. In each round, a set of nodes runs in parallel on a frozen copy of the state, and their outputs are merged only after all of them finish. Here you follow one super-step through the executor.",
  glance: {
    learn: "The six stages every step goes through",
    try: "Breaking a step with a failure or a write conflict",
    read: "Four excerpts from executor.rs and state.rs",
  },
  interactive: true,
  sections: [
    {
      id: "loop",
      title: "The loop",
      blocks: [
        {
          type: "p",
          text: "Agents do things in parallel: several tool calls at once, or a research step that fans out over many sources. If parallel nodes wrote to shared state directly, the result would depend on timing. Rusty never lets a node write shared state while it runs. Each round of work is a [[Super-step|super-step]], and the state changes only between rounds.",
        },
        {
          type: "p",
          text: "`Executor::run` loads or creates the state, then calls `execute_super_step` repeatedly until one of these happens:",
        },
        {
          type: "list",
          items: [
            "routing returns no next nodes, and the run finishes with `ExecutionOutcome::Done`",
            "a node interrupts, and the run suspends with `ExecutionOutcome::Interrupted`",
            "the step budget `RunConfig::max_steps` (default 1000) is used up, and the run also suspends, with the reason `step_ceiling`",
          ],
        },
        {
          type: "p",
          text: "Here is the whole run as a conversation between the parts of the engine. Each super-step repeats the middle of this sequence:",
        },
        { type: "diagram", name: "run-sequence" },
        {
          type: "p",
          text: "Each super-step has six stages: plan, spawn, barrier, merge, route, and checkpoint.",
        },
        {
          type: "lab",
          title: "Watch the steps",
          intro:
            "The fan-out example has three steps: one node emits four topics, four copies of `process_item` run in parallel, then `summarize` runs once. Each `process_item` line prints its step number.",
          commands: `cd rusty-core
cargo run --example parallel_fanout`,
          output: `=== parallel_fanout: dynamic map-reduce via Route::Send ===

[generate_topics] emitting 4 topics
[router] fanning out 4 Sends to \`process_item\`
[process_item] (step 1) processed "super-step scheduling" -> checksum 2142
[process_item] (step 1) processed "channel reducers" -> checksum 1622
[process_item] (step 1) processed "checkpoint persistence" -> checksum 2285
[process_item] (step 1) processed "interrupt/resume" -> checksum 1709
[summarize] fan-in complete: 4 results merged, total checksum 7758

=== run finished (Done) ===
final summary: "fan-in complete: 4 results merged, total checksum 7758"
results channel: [
…
]`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "In the `process_item` node, right after `topic` is read, add `if topic == \"channel reducers\" { return Err(RustyError::Node(\"simulated tool failure\".into())); }` and run again.",
            predict: "Three of the four invocations succeed. Does `summarize` run over their three results?",
            result:
              "No. The three other `process_item` lines print, then the program exits with `Error: Node(...)` and the message node `process_item` failed at super-step 1: node error: simulated tool failure. `summarize` never runs and no result from step 1 is kept.",
          },
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [
        {
          type: "predict",
          question: "Node B finishes successfully and node C fails in the same step. What happens to B's writes?",
          options: [
            "They are merged; only C's are dropped",
            "They are kept until C is retried",
            "They are discarded with the rest of the step",
          ],
          answer: 2,
          explain:
            "The barrier treats the step as one unit. Any failure returns an error before the merge, so no write from that step reaches the state, including writes from nodes that finished.",
        },
        {
          type: "p",
          text: "Step through the stages below with a real graph, then turn on a failure to see how each stage reacts.",
        },
        { type: "diagram", name: "super-step" },
      ],
    },
    {
      id: "spawn",
      title: "Spawn",
      toc: "Spawn",
      blocks: [
        {
          type: "p",
          text: "Active nodes run in a `tokio::task::JoinSet`. Each one is spawned with its own clone of the start-of-step state and its own tracing span:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `let mut node_state = snapshot.clone();
// ...
let node_span = tracing::info_span!("rusty.node", node = %name, step = step);
// ...
join_set.spawn(
    async move {
        // runs the node on node_state
        (index, name, result, latency_ms)
    }
    .instrument(node_span),
);`,
        },
        {
          type: "p",
          text: "Every node has a private copy, so two nodes in the same step cannot see each other's writes. The isolation comes from the structure of the code. Nodes don't have to follow a convention to get it.",
        },
      ],
    },
    {
      id: "barrier",
      title: "Barrier",
      toc: "Barrier",
      blocks: [
        { type: "p", text: "The barrier drains the JoinSet with `join_next()`. Each node ends in one of three ways:" },
        {
          type: "rows",
          rows: [
            { label: "Success", tone: "green", text: "Its updates and any `Command::goto` are collected." },
            {
              label: "Failure",
              tone: "red",
              text: "The executor returns an error naming the node and the step, as in the lab: node `process_item` failed at super-step 1. Returning drops the JoinSet, which aborts any nodes still running. Every write from this step is discarded.",
            },
            {
              label: "Interrupt",
              tone: "amber",
              text: "The run suspends. Writes from this step are discarded here too, and the whole active set is scheduled to run again on resume. [3.2 Interrupts](/learn/interrupts) covers this.",
            },
          ],
        },
        {
          type: "p",
          text: "Aborting the stragglers needs no cleanup code. The JoinSet owns its tasks, and dropping it aborts them. Rust ownership does the work of a transaction rollback here.",
        },
        {
          type: "p",
          text: "The state never holds a partially applied step, and the last checkpoint still describes the step boundary before the failure.",
        },
      ],
    },
    {
      id: "merge",
      title: "Merge",
      toc: "Merge",
      blocks: [
        {
          type: "p",
          text: "`StateSpec::apply_super_step` receives every write from the step and checks all of them before changing anything: each channel must be declared in the `StateSpec`, an `Append` or `AddMessages` channel must currently hold an array, and an `Overwrite` channel may receive at most one write. If any check fails, the state is left untouched.",
        },
        {
          type: "p",
          text: "Writes from parallel tasks arrive in whatever order the tasks finished. They're sorted by node name before merging, so writes from differently named nodes always merge in the same order:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "StateSpec::apply_super_step",
          code: `let mut collected: Vec<(String, HashMap<String, Value>)> = writes
    .into_iter()
    .map(|(node, updates)| (node.as_ref().to_owned(), updates))
    .collect();
collected.sort_by(|a, b| a.0.cmp(&b.0));`,
        },
        {
          type: "p",
          text: "The sort is stable and keys on the name alone. Invocations of one node from a `Send` fan-out share a name, so among them the order is still the order they finished in. [2.2](/learn/state-channels#order) shows it in the fan-out example.",
        },
        {
          type: "p",
          text: "Two writes to one `Overwrite` channel in the same step fail the merge with `RustyError::InvalidUpdate`. [2.2](/learn/state-channels#single-write) shows the message and a lab that triggers it.",
        },
        {
          type: "p",
          text: "The [[Run journal|run journal]] follows the same rule. Node outputs are recorded in active-set order, whatever order the tasks finished in, so two recordings of the same run line up event for event.",
        },
      ],
    },
    {
      id: "route",
      title: "Route",
      toc: "Route",
      blocks: [
        {
          type: "p",
          text: "Routing reads the merged state. If any node returned a `Command::goto`, those targets are the next step and static edges are skipped. Otherwise each node that ran has its outgoing edges evaluated: a direct edge activates its target, and a conditional edge calls a router that returns `Route::Node`, `Route::Send` (one invocation per item, each with its own scoped state), or `Route::End`.",
        },
        { type: "p", text: "Pick a case below to see which branch the executor takes:" },
        { type: "diagram", name: "routing" },
        {
          type: "p",
          text: "A target that doesn't exist fails the run with a `RustyError::Graph` error naming the node. `GraphBuilder::compile()` catches most of these earlier, before any node runs. [2.5 Routing](/learn/routing) covers the rest.",
        },
      ],
    },
    {
      id: "checkpoint",
      title: "Checkpoint",
      toc: "Checkpoint",
      blocks: [
        {
          type: "p",
          text: "When a [[Checkpointer|checkpointer]] is attached, the executor saves the step number, the full state, and the next-node set:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `let next_names: Vec<String> = next.iter().map(|t| t.name.clone()).collect();
// ...
let checkpoint = recorder.mint_checkpoint(
    config.thread_id.clone(),
    step,
    state.clone(),
    next_names,
    stamp,
);
checkpointer.put(checkpoint).await?;`,
        },
        {
          type: "p",
          text: "Checkpoints are written only at step boundaries: here, after routing, and when a run suspends. Nothing is saved in the middle of a node. On resume, the executor loads the checkpoint, restores the state, and runs its `next_nodes`. [3.1 Checkpoints](/learn/checkpoints) covers storage and time travel.",
        },
      ],
    },
    {
      id: "loops",
      title: "Loops and the step budget",
      toc: "Step budget",
      blocks: [
        {
          type: "p",
          text: "A ReAct agent loops: `agent → tools → agent`. Each hop is a new super-step with its own plan, barrier, merge, route, and checkpoint, so the loop never grows the call stack. The guard against runaway loops is a step budget, `max_steps`, and every iteration of an agent loop is checkpointed.",
        },
        {
          type: "predict",
          question: "You run the fan-out example with `RunConfig::new(\"fanout-demo\").with_max_steps(2)`. It needs three steps. What happens?",
          options: [
            "An error after step 1; the four results are lost",
            "The run suspends after step 1, with the four results in its state",
            "The limit is ignored because steps 0 and 1 are short",
          ],
          answer: 1,
          explain:
            "We ran it. Steps 0 and 1 run and all four `process_item` lines print. `summarize` never starts, and `run` returns `ExecutionOutcome::Interrupted` (the example prints \"unexpected outcome\") with `results` holding four records and no `summary`. Reaching the budget suspends at a boundary; it doesn't throw work away.",
        },
        {
          type: "p",
          text: "The suspended run writes a checkpoint and returns an interrupt payload under `rusty.halted`. Resume the thread to continue, with a higher `max_steps` if the task needs it. The test `max_steps_guard_suspends_infinite_cycles_at_the_ceiling` in executor.rs runs a self-loop with `with_max_steps(5)` and checks exactly this.",
        },
      ],
    },
    {
      id: "costs",
      title: "Costs",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "A slow node holds up the step.",
              text: "The barrier waits for every active node, so a step takes as long as its slowest node.",
            },
            {
              label: "Nodes must be safe to repeat.",
              text: "A failed or interrupted step is discarded and runs again later, from the start of each node.",
            },
            {
              label: "One executor process.",
              text: "The loop for a run executes in a single process. Remote and WASM nodes move node work elsewhere, but the loop itself is not distributed.",
            },
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      q: "Why are writes sorted by node name before merging?",
      a: "So writes from differently named nodes merge in the same order on every run, whatever the task timing. Invocations of one node from a Send fan-out share a name, so their relative order still follows finish order.",
    },
    {
      q: "When is a checkpoint written?",
      a: "After routing at the end of each step, and when a run suspends. Never in the middle of a node.",
    },
  ],
  deeper: [
    { book: "02-mental-model.html#one-run-end-to-end", label: "The Rusty mental model: one run, end to end" },
    { book: "10-durability.html#level-one-the-checkpointed-run", label: "Durability: the checkpointed run" },
  ],
  sources: [
    { path: "rusty-core/src/executor.rs", what: "Executor::run, execute_super_step" },
    { path: "rusty-core/src/state.rs", what: "StateSpec::apply_super_step, Reducer" },
    { path: "rusty-core/src/graph.rs", what: "Route, Send, GraphBuilder::compile" },
    { path: "rusty-core/src/checkpoint.rs", what: "Checkpoint, Checkpointer" },
    { path: "rusty-core/examples/parallel_fanout.rs", what: "The example used in the lab" },
  ],
};
