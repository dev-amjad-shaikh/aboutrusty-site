import type { Lesson } from "./types";

export const superStepLoop: Lesson = {
  id: "2.3",
  slug: "super-step-loop",
  title: "The super-step loop",
  minutes: 15,
  source: "rusty-core/src/executor.rs",
  before: ["2.1", "2.2"],
  summary:
    "Rusty runs a graph in rounds called super-steps. In each round, a set of nodes runs in parallel on a frozen copy of the state. Their outputs are merged only after all of them finish. This lesson follows one super-step through the executor.",
  glance: {
    learn: "The six stages every step goes through",
    try: "Breaking a step with a failure or a write conflict",
    read: "Four excerpts from executor.rs and state.rs",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "The problem",
      blocks: [
        {
          type: "p",
          text: "Agents do things in parallel: several tool calls at once, or a research step that fans out over many sources. If parallel nodes write to shared state directly, the result depends on timing. Two nodes can overwrite each other's values, and the bug may not surface until several steps later.",
        },
        { type: "p", text: "Rusty avoids this by never letting nodes write to shared state while they run." },
      ],
    },
    {
      id: "loop",
      title: "The loop",
      blocks: [
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
          text: "So each super-step has six stages: plan, spawn, barrier, merge, route, and checkpoint. Step through them below with a real graph, then turn on a failure to see how each stage reacts.",
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [{ type: "diagram", name: "super-step" }],
    },
    {
      id: "spawn",
      title: "Spawn: each node gets its own snapshot",
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
          text: "Because every node has a private copy, two nodes in the same step cannot see each other's writes. The isolation comes from how the code is structured, so nodes don't have to follow a convention to get it.",
        },
      ],
    },
    {
      id: "barrier",
      title: "Barrier: all or nothing",
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
              text: "The executor returns an error: `node `research_b` failed at super-step 1`. Returning drops the JoinSet, which aborts any nodes still running. Every write from this step is discarded.",
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
          text: "Aborting the stragglers needs no cleanup code. The JoinSet owns its tasks, and dropping it aborts them. This is Rust ownership doing the work of a transaction rollback.",
        },
        {
          type: "p",
          text: "A step either applies completely or not at all. The state never holds a partially applied step, and the last checkpoint still describes the step boundary before the failure.",
        },
      ],
    },
    {
      id: "merge",
      title: "Merge: validate first, then apply",
      toc: "Merge",
      blocks: [
        {
          type: "p",
          text: "`StateSpec::apply_super_step` receives every write from the step. It checks all of them before changing anything: each channel must be declared in the `StateSpec`, an `Append` or `AddMessages` channel must currently hold an array, and an `Overwrite` channel may receive at most one write. If any check fails, the state is left untouched.",
        },
        {
          type: "p",
          text: "Writes from parallel tasks arrive in whatever order the tasks finished. To make the result the same on every run, they're sorted by node name before merging:",
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
          text: "If two nodes write to an `Overwrite` channel in the same step, the merge fails with `RustyError::InvalidUpdate`. The message names both nodes and suggests a multi-write reducer:",
        },
        {
          type: "code",
          lang: "text",
          code: "channel `summary` can receive only one value per super-step (reducer: overwrite); already written by node `research_a`, second write from node `research_b`. Use a multi-write reducer (Append/DeepMerge/AddMessages) to handle concurrent writes.",
        },
        {
          type: "p",
          text: "The run journal follows the same rule. Node outputs are recorded in active-set order, not in the order the tasks finished, so two recordings of the same run line up event for event.",
        },
      ],
    },
    {
      id: "route",
      title: "Route: what runs next",
      toc: "Route",
      blocks: [
        {
          type: "p",
          text: "Routing reads the merged state. If any node returned a `Command::goto`, those targets are the next step and static edges are skipped. Otherwise each node that ran has its outgoing edges evaluated: a direct edge activates its target, and a conditional edge calls a router that returns `Route::Node`, `Route::Send` (one invocation per item, each with its own scoped state), or `Route::End`.",
        },
        {
          type: "p",
          text: "Pick a case below to see which branch the executor takes:",
        },
        { type: "diagram", name: "routing" },
        {
          type: "p",
          text: "A target that doesn't exist fails the run with a `RustyError::Graph` error naming the node. `GraphBuilder::compile()` catches most of these earlier, before any node runs.",
        },
      ],
    },
    {
      id: "checkpoint",
      title: "Checkpoint: the boundary",
      toc: "Checkpoint",
      blocks: [
        {
          type: "p",
          text: "When a checkpointer is attached, the executor saves the step number, the full state, and the next-node set:",
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
      title: "Why loops don't overflow the stack",
      toc: "Why loops are safe",
      blocks: [
        {
          type: "p",
          text: "A ReAct agent loops: `agent → tools → agent`. In Rusty, that loop is not a function calling itself. Each hop is a new super-step with its own plan, barrier, merge, route, and checkpoint. That's why the guard against runaway loops is a step budget (`max_steps`) rather than a stack limit, and why every iteration of an agent loop is checkpointed.",
        },
        {
          type: "p",
          text: "Reaching the budget doesn't throw the work away. The run suspends at that boundary, writes a checkpoint, and returns an interrupt payload under `rusty.halted`. Resume the thread to continue, with a higher `max_steps` if the task needs it. The test `max_steps_guard_suspends_infinite_cycles_at_the_ceiling` in executor.rs runs a self-loop with `with_max_steps(5)` and checks exactly this.",
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
  takeaways: [
    "Nodes in a step run in parallel on a frozen snapshot, so they can't see each other's writes.",
    "A step applies completely or not at all. One failure discards every write in the step.",
    "Writes are validated, sorted by node name, then merged, so results are identical on every run.",
    "Checkpoints are written only at step boundaries, never in the middle of a node.",
  ],
  quiz: [
    {
      q: "Two nodes in the same step both write to `summary`, declared with `Reducer::Overwrite`. What happens?",
      a: "The merge fails with `RustyError::InvalidUpdate` before any state changes. The message names both nodes.",
    },
    {
      q: "Node B finishes successfully and node C fails in the same step. Is B's output kept?",
      a: "No. The whole step's writes are discarded and the run returns an error naming C and the step.",
    },
    {
      q: "Why are writes sorted by node name before merging?",
      a: "So the merged state, and the checkpoints built from it, are identical on every run regardless of task timing.",
    },
    {
      q: "A run reaches `max_steps`. Is its work lost?",
      a: "No. The run suspends with a checkpoint and a `rusty.halted` payload. You resume the thread to continue.",
    },
  ],
  sources: [
    { path: "rusty-core/src/executor.rs", what: "Executor::run, execute_super_step" },
    { path: "rusty-core/src/state.rs", what: "StateSpec::apply_super_step, Reducer" },
    { path: "rusty-core/src/graph.rs", what: "Route, Send, GraphBuilder::compile" },
    { path: "rusty-core/src/checkpoint.rs", what: "Checkpoint, Checkpointer" },
  ],
  related: [
    { label: "Example: parallel_fanout.rs", href: "https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/examples/parallel_fanout.rs" },
    { label: "Book: The Rusty mental model", href: "/guide/02-mental-model.html" },
  ],
};
