import type { Lesson } from "./types";

export const fourPrimitives: Lesson = {
  id: "2.1",
  slug: "four-primitives",
  title: "The four primitives",
  minutes: 6,
  source: "rusty-core/src/executor.rs",
  summary:
    "Everything in Part 2 is built from four pieces: channels hold the state, nodes compute updates to it, super-steps decide when those updates land, and checkpoints save the result at each boundary. This page names each one, shows where it lives in rusty-core, and runs a four-node graph so you can see all of them in one trace.",
  glance: {
    learn: "Channels, nodes, super-steps, and checkpoints, and how they fit",
    try: "A four-node graph with a parallel step, then a reducer change that breaks it",
    read: "StateSpec, the Node trait, and the Checkpoint struct",
  },
  sections: [
    {
      id: "map",
      title: "The map",
      blocks: [
        {
          type: "p",
          text: "A Rusty agent is a graph. Running it takes four things, and each chapter of Part 2 zooms in on one or two of them:",
        },
        {
          type: "rows",
          rows: [
            {
              label: "Channels",
              text: "Named fields of the run's state, each with a [[Reducer]] that says how writes combine. [2.2](/learn/state-channels)",
            },
            {
              label: "Nodes",
              text: "Async functions that read a copy of the state and return partial updates. They never write shared state directly. [2.4](/learn/snapshot-isolation)",
            },
            {
              label: "Super-steps",
              text: "Rounds of execution. Every scheduled node runs in parallel, then all writes merge at a barrier, then routing picks the next set. [2.3](/learn/super-step-loop), [2.5](/learn/routing)",
            },
            {
              label: "Checkpoints",
              text: "A saved copy of the state and the next nodes, written at every step boundary. Resume, time travel, and forks all start from one. [3.1](/learn/checkpoints)",
            },
          ],
        },
        {
          type: "p",
          text: "The module docs at the top of `rusty-core/src/executor.rs` describe one super-step as six stages: plan, compute, barrier, merge, route, checkpoint. Channels are what merge writes into. Nodes are what compute runs. Checkpoints are the last stage.",
        },
      ],
    },
    {
      id: "channels",
      title: "Channels",
      blocks: [
        {
          type: "p",
          text: "You declare the state's shape up front in a `StateSpec`. Each call adds one channel and its reducer:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "StateSpec::channel",
          code: `/// Builder-style: declare a channel with the given reducer.
pub fn channel(mut self, name: impl Into<String>, reducer: Reducer) -> Self {
    self.channels.insert(name.into(), reducer);
    self
}`,
        },
        {
          type: "p",
          text: "A write to a channel that isn't declared fails the step with `RustyError::InvalidUpdate`. So the spec is also the list of everything a node is allowed to change.",
        },
      ],
    },
    {
      id: "nodes",
      title: "Nodes",
      blocks: [
        {
          type: "p",
          text: "A node implements one async method. Most graphs pass closures to `GraphBuilder::add_node`, which wraps them in this trait:",
        },
        {
          type: "code",
          file: "rusty-core/src/node.rs",
          symbol: "trait Node",
          code: `pub trait Node: Send + Sync {
    fn name(&self) -> &str {
        "anonymous"
    }

    fn effect(&self) -> crate::record::Effect {
        crate::record::Effect::Pure
    }

    /// Execute the node against a super-step state snapshot.
    async fn run(&self, ctx: NodeContext) -> Result<NodeOutput>;
}`,
        },
        {
          type: "p",
          text: "`ctx.state()` is the node's own copy of the state as it was when the step started. The return value is a `NodeOutput`: a map of channel updates plus an optional `Command` for routing. The `effect()` declaration matters later, when retries and replay have to decide whether running the node again is safe.",
        },
      ],
    },
    {
      id: "super-steps",
      title: "Super-steps",
      blocks: [
        {
          type: "p",
          text: "The executor never runs one node and then immediately the next. It collects the whole set of nodes scheduled for this round, runs them together, waits for all of them, and only then applies their updates. A cycle such as `agent → tools → agent` is the same node being scheduled again in a later round, which is why the loop guard is a step count, `RunConfig::max_steps`.",
        },
        {
          type: "predict",
          question:
            "In the graph below, `research_a` and `research_b` run in the same step and both append to `notes`. The next node, `write`, counts the notes. How many does it see?",
          options: [
            "One: whichever research node finished first",
            "Two: `write` runs in the next step, after both writes merged",
            "Zero: `write` starts before the research nodes finish",
            "It depends on the order the tasks finished",
          ],
          answer: 1,
          explain:
            "`write` is scheduled for step 2, and step 2 starts only after the barrier at the end of step 1 has merged both appends. It reads a state that already contains both notes.",
        },
      ],
    },
    {
      id: "checkpoints",
      title: "Checkpoints",
      blocks: [
        {
          type: "p",
          text: "When an executor has a [[Checkpointer]], it saves one of these after every step:",
        },
        {
          type: "code",
          file: "rusty-core/src/checkpoint.rs",
          symbol: "struct Checkpoint",
          code: `pub struct Checkpoint {
    pub id: String,
    pub thread_id: String,
    /// Zero-based super-step index at whose boundary this snapshot was taken.
    pub step: usize,
    /// The full channel state at the boundary.
    pub state: State,
    /// The node set scheduled to run in the *next* super-step.
    pub next_nodes: Vec<String>,
    pub created_at: DateTime<Utc>,
    // ... delta base and Flight Recorder provenance
}`,
        },
        {
          type: "p",
          text: "`next_nodes` is what makes resume possible. Loading a checkpoint gives the executor both the state and the exact set of nodes to run next, so it continues as if it had never stopped.",
        },
      ],
    },
    {
      id: "run",
      title: "All four in one run",
      toc: "Run it",
      blocks: [
        {
          type: "p",
          text: "This graph uses every primitive: three channels, four closure nodes, a step where two nodes run in parallel, and an in-memory checkpointer you can list afterwards.",
        },
        {
          type: "code",
          lang: "rust",
          code: `let spec = StateSpec::new()
    .channel("topic", Reducer::Overwrite)
    .channel("notes", Reducer::Append)
    .channel("report", Reducer::Overwrite);

let mut b = GraphBuilder::new();
b.add_node("plan", |_ctx: NodeContext| async move {
    Ok(NodeOutput::update("topic", json!("checkpoints")))
});
b.add_node("research_a", |_ctx: NodeContext| async move {
    Ok(NodeOutput::update("notes", json!("a: saved at step boundaries")))
});
b.add_node("research_b", |_ctx: NodeContext| async move {
    Ok(NodeOutput::update("notes", json!("b: resume re-runs whole nodes")))
});
b.add_node("write", |ctx: NodeContext| async move {
    let n = ctx.state().get("notes").and_then(|v| v.as_array()).map_or(0, Vec::len);
    Ok(NodeOutput::update("report", json!(format!("{n} notes"))))
});
b.set_entry_point("plan");
b.add_edge("plan", "research_a");
b.add_edge("plan", "research_b");
b.add_edge("research_a", "write");
b.add_edge("research_b", "write");

let checkpointer = Arc::new(InMemoryCheckpointer::new());
let executor = Executor::with_checkpointer(checkpointer.clone());
// run with an event channel that prints SuperStep and StateUpdate events,
// then print checkpointer.list("four") sorted by step`,
        },
        {
          type: "lab",
          title: "Watch the four primitives in one trace",
          intro:
            "Build the graph above in a scratch crate that depends on your rusty checkout. Watch for step 1, where two nodes run and one barrier merges both writes, and for one checkpoint per step.",
          commands: `cargo new four && cd four
cargo add rusty-agent-runtime --path ../rusty/rusty-core
cargo add tokio --features full
cargo add serde_json
# put the program above in src/main.rs
cargo run -q`,
          output: `[step 0] active: plan
  barrier (step 0) merged: topic
[step 1] active: research_a, research_b
  barrier (step 1) merged: notes
[step 2] active: write
  barrier (step 2) merged: report

final state: {"notes":["a: saved at step boundaries","b: resume re-runs whole nodes"],"report":"2 notes","topic":"checkpoints"}

checkpoints on thread \`four\`:
  step 0 -> next_nodes ["research_a", "research_b"]
  step 1 -> next_nodes ["write"]
  step 2 -> next_nodes []`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change: "Declare `notes` with `Reducer::Overwrite` instead of `Reducer::Append`.",
            predict: "What happens at the end of step 1?",
            result:
              "The run stops at the step 1 barrier with an `InvalidUpdate` error: channel `notes` can receive only one value per super-step (reducer: overwrite); already written by node `research_a`, second write from node `research_b`. Step 2 never starts, and the only checkpoint written is the one from step 0.",
          },
        },
        {
          type: "p",
          text: "Read the last three lines together with the step trace. The checkpoint for step 0 says the next step runs both research nodes, which is exactly what step 1 did. The final checkpoint has no next nodes, which is how a finished run looks on disk.",
        },
      ],
    },
  ],
  deeper: [{ book: "02-mental-model.html#five-concepts", label: "Five concepts" }],
  sources: [
    { path: "rusty-core/src/executor.rs", what: "module docs: the six stages of a super-step" },
    { path: "rusty-core/src/state.rs", what: "StateSpec, Reducer, State" },
    { path: "rusty-core/src/node.rs", what: "Node, NodeContext, NodeOutput" },
    { path: "rusty-core/src/checkpoint.rs", what: "Checkpoint, Checkpointer, InMemoryCheckpointer" },
  ],
};
