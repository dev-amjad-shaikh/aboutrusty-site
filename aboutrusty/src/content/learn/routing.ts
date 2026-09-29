import type { Lesson } from "./types";

export const routing: Lesson = {
  id: "2.5",
  slug: "routing",
  title: "Routing and fan-out",
  minutes: 15,
  source: "rusty-core/src/graph.rs",
  before: ["2.2", "2.3"],
  summary:
    "After the barrier merges a step's writes, the executor decides which nodes run next. It has three sources for that decision: static edges, a conditional router, and a Command returned by a node. A router can also fan out, running one node once per item with its own input.",
  glance: {
    learn: "How the next active set is built, and when a goto overrides edges",
    try: "Switching routing kinds, then running a Send map-reduce",
    read: "Route, Send, the routing block in executor.rs, and compile()",
  },
  interactive: true,
  sections: [
    {
      id: "sources",
      title: "Three ways to say what runs next",
      toc: "Three sources",
      blocks: [
        {
          type: "p",
          text: "An agent's next move depends on data: whether the model asked for a tool, how many sub-questions a planner produced, whether a check passed. Rusty checks the shape of the [[Graph|graph]] once, when you call `GraphBuilder::compile()`, and runs the data-dependent part at every step boundary against the merged state. The result is recorded in the journal as a `routing_decision` event.",
        },
        {
          type: "rows",
          rows: [
            {
              label: "Static edge",
              tone: "green",
              text: "`add_edge(from, to)`. Whenever `from` ran in this step, `to` runs in the next one.",
            },
            {
              label: "Router",
              tone: "amber",
              text: "`add_conditional_edges(from, router)`. An async function reads the merged state and returns a `Route`.",
            },
            {
              label: "Command",
              tone: "red",
              text: "A node returns `Command::goto(node)` with its output. It replaces edge evaluation for the whole step.",
            },
          ],
        },
        { type: "p", text: "A router answers with one of three variants:" },
        {
          type: "code",
          file: "rusty-core/src/graph.rs",
          symbol: "Route",
          code: `pub enum Route {
    /// Activate exactly one node next.
    Node(String),
    /// Dynamic fan-out (LangGraph \`Send\` API): activate one node invocation
    /// per item, each with its own scoped input state.
    Send(Vec<Send>),
    /// Terminate the run.
    End,
}`,
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [
        {
          type: "p",
          text: "A node called `plan` has just run. Switch between routing kinds to see the next active set and the `RoutingDecision` the executor journals. The last three cases fail: one at run time, two at compile time.",
        },
        { type: "diagram", name: "routing-lab" },
      ],
    },
    {
      id: "edges",
      title: "Static edges",
      blocks: [
        {
          type: "p",
          text: "Several edges out of one node activate all their targets, which then run in parallel. Several edges into one node activate it once: the executor keeps a `planned` set while routing, so a target reached from two nodes that ran in the same step is scheduled once. That is how a fan-in node like `summarize` runs a single time after its parallel sources.",
        },
        {
          type: "p",
          text: "Edges are evaluated only for nodes that actually ran in the step. A node that didn't run contributes nothing, even if it has edges.",
        },
      ],
    },
    {
      id: "router",
      title: "Conditional routers",
      toc: "Routers",
      blocks: [
        {
          type: "p",
          text: "A router is any `Fn(State) -> impl Future<Output = Result<Route>>`. This is the shape of the ReAct loop's router, from the doc example on `add_conditional_edges`:",
        },
        {
          type: "code",
          file: "rusty-core/src/graph.rs",
          symbol: "GraphBuilder::add_conditional_edges",
          code: `builder.add_conditional_edges("agent", |state| async move {
    let needs_tools = state.get("messages")
        .and_then(|m| m.as_array())
        .and_then(|a| a.last())
        .map(|m| m.get("tool_calls").is_some())
        .unwrap_or(false);
    Ok(if needs_tools { Route::Node("tools".into()) } else { Route::End })
});`,
        },
        {
          type: "p",
          text: "The router gets a clone of the post-barrier state, so it sees every write from the step. It is called once per source node per step, even if that node ran several times through a fan-out.",
        },
        {
          type: "p",
          text: "Router targets are data, so `compile()` can't check them. The executor checks each one while routing. An unknown name fails the run with `RustyError::Graph` naming the router's source node and the missing target.",
        },
      ],
    },
    {
      id: "goto",
      title: "Command::goto overrides edges",
      toc: "Command::goto",
      blocks: [
        {
          type: "p",
          text: "A node can decide the next step itself by attaching a command to its output: `NodeOutput::route(Command::goto(\"answer\"))`, or `.with_command(...)` on an output that also carries updates. `Command::goto_many` activates several nodes in parallel.",
        },
        {
          type: "predict",
          question: "Node `plan` has a static edge to `tools`. In the same step it returns `Command::goto(\"answer\")`. What runs next?",
          options: ["`tools` and `answer`, in parallel", "Only `answer`", "Only `tools`", "Nothing: compile() rejects the graph"],
          answer: 1,
          explain:
            "A goto anywhere in the step replaces edge evaluation for every node that ran. compile() can't see a goto, because it is returned at run time, so the graph compiles.",
        },
        {
          type: "p",
          text: "If any node in the step returned a non-empty goto, the executor uses the goto targets and skips edge evaluation entirely, for every node that ran:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `// -- route: Command::goto overrides the static edge set;
//    otherwise evaluate outgoing edges of every node that ran
//    against the post-barrier state.
if !commands.is_empty() {
    for command in &commands {
        for target in &command.goto {
            if !graph.has_node(target) {
                return Err(RustyError::Graph(format!(
                    "Command::goto references unknown node \`{target}\`"
                )));
            }
            if planned.insert(target.clone()) {
                next.push(ActiveTask { name: target.clone(), scoped: None });
            }
        }
    }
} else {
    // static edges and routers of every node that ran
}`,
        },
        {
          type: "note",
          title: "The builder's doc comment is out of date",
          text: "The doc comment on `GraphBuilder::add_edge` says that when a node with static edges also returns a goto, both paths execute. The executor code above does not do that: a goto anywhere in the step replaces all edge evaluation. This lesson follows the executor, and so does `docs/architecture.md`.",
        },
      ],
    },
    {
      id: "send",
      title: "Send fan-out",
      toc: "Send fan-out",
      blocks: [
        {
          type: "p",
          text: "`Route::Send` is the map step of map-reduce. The router returns one `Send` per item, and each becomes its own invocation in the next step, even when they all target the same node. Edges and goto targets are deduplicated; Sends are kept one per item.",
        },
        {
          type: "p",
          text: "Each `Send` carries a JSON object. Before the node runs, the executor lays that object over the invocation's private copy of the snapshot:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `let mut node_state = snapshot.clone();
if let Some(scoped) = &task.scoped {
    match scoped {
        Value::Object(map) => {
            for (channel, value) in map {
                node_state.insert(channel.clone(), value.clone());
            }
        }
        other => {
            return Err(RustyError::InvalidUpdate(format!(
                "Send scoped state for node \`{}\` must be a JSON object, \\
                 got {other}",
                task.name
            )));
        }
    }
}`,
        },
        {
          type: "predict",
          question: "Four Sends target `process_item`, each with `{\"item\": topic}`. After the step, what does the shared `item` channel hold?",
          options: ["The last topic to finish", "An array of all four topics", "Whatever it held before the step"],
          answer: 2,
          explain:
            "The scoped object is laid over each invocation's private snapshot and goes no further. Only the updates a node returns are merged at the barrier.",
        },
        {
          type: "p",
          text: "So each invocation reads its own `item`, and the scoped values never reach the shared state. What does reach it is each invocation's output, and several invocations writing one channel in one step need a multi-write reducer on that channel. Step through the fan-out example below, then declare `results` as `Overwrite` to see what happens without one:",
        },
        { type: "diagram", name: "send-fanout" },
        {
          type: "lab",
          title: "A Send fan-out, and a typo",
          intro:
            "The router in `parallel_fanout.rs` returns one `Send` per topic. Watch the router line, then four invocations of the same node, all at step 1.",
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
…`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "In the router, misspell the target: `Send::new(\"process_items\", json!({ \"item\": t }))`. Run again.",
            predict: "Does `builder.compile()?` catch the typo, or does the run start?",
            result:
              "It compiles and the run starts. `generate_topics` runs and the router prints its line, then the run fails with `Error: Graph(...)`: Route::Send from `generate_topics` targets unknown node `process_items`. Send targets are data, so they are checked while routing.",
          },
        },
      ],
    },
    {
      id: "compile",
      title: "What compile() rejects",
      toc: "compile()",
      blocks: [
        {
          type: "p",
          text: "`GraphBuilder::compile()` freezes the graph and checks its structure before any node or model call runs. Every failure is a `RustyError::Graph`:",
        },
        {
          type: "list",
          items: [
            "no nodes registered",
            "no entry point, or an entry point that isn't a node",
            "an edge whose source, or a static edge whose target, isn't a node",
            "a node named `__end__` or anything starting with `__`, which is the engine's reserved namespace",
            "the same static edge twice, which would activate its target twice in one step",
            "more than one conditional edge on one source node",
            "a source node with both static and conditional edges",
          ],
        },
        {
          type: "p",
          text: "The last two rules exist so that each node has exactly one routing rule: either a fixed set of edges or a single router. Dynamic choices go inside the router, where you can read and test them. Router targets, `Send` targets, and goto targets are checked at run time, because they come from data.",
        },
      ],
    },
    {
      id: "ending",
      title: "How a run ends",
      toc: "Ending",
      blocks: [
        {
          type: "p",
          text: "There is no end node. A run finishes when routing produces an empty next set: every router that ran returned `Route::End`, and no node that ran has static edges or a goto. The executor still writes the boundary checkpoint, then returns `ExecutionOutcome::Done` with the final state.",
        },
        {
          type: "p",
          text: "One exception: when the run has a durable inbox with follow-up messages queued, an empty next set starts another turn at the entry point instead of finishing.",
        },
      ],
    },
    {
      id: "limits",
      title: "Things to watch",
      toc: "Watch for",
      blocks: [
        {
          type: "list",
          items: [
            "A misspelled router or Send target compiles and fails only when that branch is taken, as in the lab. Test routers directly, or cover each branch in a test run.",
            "One goto in a step turns off edge evaluation for every node in it, including siblings that expected their edges to fire.",
            "Invocations of one node share its name, so their writes to an Append channel land in the order they reached the barrier. Include a key in each item if order matters.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      q: "`search` and `fetch` both ran and both have an edge to `summarize`. How many times does `summarize` run next step?",
      a: "Once. The executor tracks planned targets and schedules each edge target a single time.",
    },
    {
      q: "Can you give node `plan` both `add_edge(\"plan\", \"search\")` and a conditional edge?",
      a: "No. compile() rejects a source node with both static and conditional edges. Put the choice inside the router.",
    },
  ],
  sources: [
    { path: "rusty-core/src/graph.rs", what: "Route, Send, Edge, GraphBuilder::compile" },
    { path: "rusty-core/src/executor.rs", what: "Scoped Send state and the routing block in execute_super_step" },
    { path: "rusty-core/src/node.rs", what: "Command::goto, Command::goto_many, NodeOutput::route" },
    { path: "rusty-core/examples/parallel_fanout.rs", what: "Map-reduce with Route::Send and Reducer::Append" },
  ],
  deeper: [{ book: "02-mental-model.html#five-concepts", label: "The Rusty mental model: five concepts" }],
  related: [
    { label: "2.2 State channels and reducers", href: "/learn/state-channels" },
    { label: "Architecture: routing", href: "https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/architecture.md" },
  ],
};
