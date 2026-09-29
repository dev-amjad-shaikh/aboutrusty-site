import type { Lesson } from "./types";

export const graphs: Lesson = {
  id: "1.3",
  slug: "graphs",
  title: "Graphs as a programming model",
  minutes: 6,
  source: "rusty-core/src/graph.rs",
  before: ["1.1"],
  summary:
    "In Rusty you write an agent as a graph: named nodes, edges between them, and one entry point. The loop from 1.1 becomes two nodes and two edges. Because the engine can see that structure, it can check it before anything runs and decide where to save, pause, and run things in parallel.",
  glance: {
    learn: "Nodes, static edges, conditional edges, and what compile() checks",
    try: "Guessing which graph shapes compile() rejects",
    read: "The ReAct agent's wiring in react.rs",
  },
  sections: [
    {
      id: "react-as-graph",
      title: "The ReAct loop as a graph",
      toc: "ReAct as a graph",
      blocks: [
        {
          type: "p",
          text: "Here is how `create_react_agent` wires the agent you ran in 1.1. The two closures that call the model and run the tools are defined above this excerpt; what remains is the shape:",
        },
        {
          type: "code",
          file: "rusty-core/src/react.rs",
          symbol: "create_react_agent",
          code: `let mut builder = GraphBuilder::new();
builder.add_node(AGENT_NODE, agent_node);
builder.add_node(TOOLS_NODE, tools_node);
builder.set_entry_point(AGENT_NODE);

// Route on the post-barrier state: the appended assistant message decides.
builder.add_conditional_edges(AGENT_NODE, |state| async move {
    // ...
    Ok(if needs_tools {
        Route::Node(TOOLS_NODE.to_owned())
    } else if plan_check {
        Route::Node(AGENT_NODE.to_owned())
    } else {
        Route::End
    })
});
builder.add_edge(TOOLS_NODE, AGENT_NODE);

builder.compile()`,
        },
        {
          type: "p",
          text: "Three kinds of thing appear. A **node** is an async function that reads the state and returns updates. A **static edge** (`add_edge`) always activates its target next. A **conditional edge** (`add_conditional_edges`) is a router: an async function that reads the state after the step and returns a `Route`, which is one node, a fan-out of `Send`s, or `Route::End`.",
        },
        {
          type: "p",
          text: "The `while` loop from a hand-written agent is gone. The cycle `agent → tools → agent` is data: an edge back to `agent`, plus a router that decides when to leave.",
        },
      ],
    },
    {
      id: "compile",
      title: "What compile() checks",
      toc: "compile()",
      blocks: [
        {
          type: "p",
          text: "`GraphBuilder::compile()` freezes the builder into an immutable `Graph` and validates its structure before any node or model call runs. A typo in an edge fails when you call `compile()`, before the first model call is paid for.",
        },
        {
          type: "predict",
          question: "Which of these graphs does `compile()` reject?",
          options: [
            "A router that might return the name of a node that doesn't exist",
            "A node with both a static edge and a conditional edge",
            "A cycle: `agent → tools → agent`",
            "A node with no outgoing edges",
          ],
          answer: 1,
          explain:
            "With both kinds of edge on one node, routing would be ambiguous, so `compile()` refuses it. A router's return value depends on runtime state, so its targets are checked when the run reaches them, and an unknown one fails the run with `RustyError::Graph`. Cycles are how agents loop, and a node with no outgoing edges simply ends the run when nothing else is active.",
        },
        {
          type: "p",
          text: "The full list from the module docs in `graph.rs`:",
        },
        {
          type: "list",
          items: [
            "the graph has at least one node, and an entry point that names a known node",
            "every edge endpoint names a known node",
            "no node is named `__end__` or anything starting with `__`, the engine's reserved names",
            "no duplicate `from → to` edge, which would activate the target twice in one step",
            "at most one conditional edge per node, and no node mixes static and conditional edges",
          ],
        },
      ],
    },
    {
      id: "why",
      title: "What the engine gets from a graph",
      toc: "Why a graph",
      blocks: [
        {
          type: "p",
          text: "A loop you write yourself is opaque to any framework: it can't tell where one unit of work ends and the next begins. A graph gives the engine those boundaries. Each time a set of nodes finishes, the engine has a natural place to merge their writes, save a [[Checkpoint]], stop for an [[Interrupt]], or count a step against the budget.",
        },
        {
          type: "p",
          text: "Parallelism comes from the same structure. Two static edges out of one node activate both targets in the next step, and a router returning `Route::Send` activates one invocation per item. You describe what can run together, and the engine runs it. [1.4 Super-steps and the Pregel idea](/learn/pregel) is about how those rounds are scheduled, and [2.5 Routing and fan-out](/learn/routing) covers routers in detail.",
        },
      ],
    },
  ],
  deeper: [{ book: "02-mental-model.html#five-concepts", label: "Five concepts: a graph is your agent's program" }],
  sources: [
    { path: "rusty-core/src/graph.rs", what: "GraphBuilder, Route, Send, compile() validation" },
    { path: "rusty-core/src/react.rs", what: "create_react_agent wiring" },
  ],
};
