import type { Lesson } from "./types";

export const pregel: Lesson = {
  id: "1.4",
  slug: "pregel",
  title: "Super-steps and the Pregel idea",
  minutes: 9,
  source: "rusty-core/src/executor.rs",
  before: ["1.3"],
  summary:
    "Rusty runs a graph in rounds. Every active node in a round runs in parallel, then all of them stop at a barrier and their writes merge before the next round starts. The idea comes from bulk-synchronous parallel computing, by way of Google's Pregel.",
  glance: {
    learn: "Bulk-synchronous rounds, the barrier, and where the idea comes from",
    try: "Slowing and failing one branch of a fan-out",
    read: "The executor's module docs and parallel_fanout.rs",
  },
  interactive: true,
  sections: [
    {
      id: "origins",
      title: "Where the idea comes from",
      toc: "Origins",
      blocks: [
        {
          type: "p",
          text: "Bulk-synchronous parallel (BSP) is a model for parallel programs proposed by Leslie Valiant in 1990. Work proceeds in rounds. In each round, every processor computes on its local data and sends messages. Then all of them wait at a barrier. Messages sent in one round are delivered at the start of the next, so no processor ever reads another's half-finished work.",
        },
        {
          type: "p",
          text: "Google's Pregel ([Malewicz et al., SIGMOD 2010](https://doi.org/10.1145/1807167.1807184)) applied BSP to graph processing at scale. Each vertex of a large graph runs a user function once per round, which the paper calls a superstep. The function reads the messages sent to that vertex in the previous superstep, updates the vertex's value, and sends messages along its edges for the next one. A vertex that has nothing more to do votes to halt, and the computation ends when every vertex has halted and no messages are in flight.",
        },
        {
          type: "p",
          text: "LangGraph borrowed this schedule for agents, and Rusty's executor follows it. Its module docs open with the lineage:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          code: `//! The executor: a Pregel/BSP-inspired super-step run loop.
//!
//! Execution proceeds in discrete **super-steps** (Google Pregel /
//! Bulk-Synchronous-Parallel), each super-step being:`,
        },
      ],
    },
    {
      id: "mapping",
      title: "The mapping",
      blocks: [
        {
          type: "rows",
          rows: [
            { label: "Vertex", text: "A node in your graph. Pregel has millions of vertices; an agent graph usually has a handful of nodes." },
            { label: "Superstep", text: "A [[Super-step]]: the set of nodes active this round, all spawned as tasks at once." },
            {
              label: "Messages",
              text: "Updates to [[State channel|state channels]]. A node returns them instead of writing, and they merge at the barrier, so every node in the round reads the same snapshot.",
            },
            {
              label: "Barrier",
              text: "The executor waits for every active node before merging. If any node fails, the step's writes are discarded.",
            },
            {
              label: "Vote to halt",
              text: "Routing produces no next nodes, or a router returns `Route::End`. The run finishes with `ExecutionOutcome::Done`.",
            },
          ],
        },
        {
          type: "p",
          text: "The biggest difference is what the graph means. In Pregel the graph is the data, a web graph or a social network, spread over many machines. In an agent runtime the graph is the program, and one process runs the whole loop. What survives the translation is the discipline: parallel work within a round, a hard barrier between rounds, and a consistent state at every barrier. That last property is what makes each barrier a safe place to save a [[Checkpoint]].",
        },
      ],
    },
    {
      id: "rounds",
      title: "Rounds in a real run",
      toc: "Rounds",
      blocks: [
        {
          type: "p",
          text: "`rusty-core/examples/parallel_fanout.rs` runs three rounds. `generate_topics` emits four topics, a router fans out one `process_item` invocation per topic, and `summarize` adds up the results. Step through it, then slow one invocation or make one fail.",
        },
        { type: "diagram", name: "bsp-rounds" },
        {
          type: "predict",
          question:
            "In the real example, make the first `process_item` invocation sleep for 500 ms before it writes. What does `summarize` see?",
          options: [
            "Three results, then it runs again when the fourth arrives",
            "All four results, after waiting for the slow one",
            "Whatever has merged by the time it starts, since it runs alongside the others",
          ],
          answer: 1,
          explain:
            "`summarize` is only activated by routing after step 1's barrier, and the barrier waits for every invocation in the step. So it runs once, in step 2, over the merged array. The cost is latency: the whole step takes as long as its slowest invocation.",
        },
        {
          type: "lab",
          title: "Fan out, then slow one branch",
          intro:
            "Run the fan-out example. Every `process_item` line says `step 1`: all four invocations belong to one round. `summarize` runs in the next.",
          commands: `cd rusty && git checkout fedbb3a
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
  {
    "chars": 21,
    "checksum": 2142,
    "topic": "super-step scheduling"
  },
  …
]`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "In `process_item`, before the checksum line, add `if topic == \"super-step scheduling\" { tokio::time::sleep(std::time::Duration::from_millis(500)).await; }` and run it again.",
            predict: "`summarize` still sees four results. Where does the slow topic land in the `results` array?",
            result:
              "It lands last, on each of three runs. `summarize` still reports `4 results merged, total checksum 7758`, but the `process_item` lines and the `results` array now list `\"super-step scheduling\"` fourth. The merge sorts writes by node name, and all four writes come from the node `process_item`, so they keep the order the tasks finished in. The barrier guarantees that every write is present, and here the order within one node's fan-out follows timing.",
          },
        },
      ],
    },
  ],
  deeper: [{ book: "02-mental-model.html#one-run-end-to-end", label: "One run, end to end" }],
  sources: [
    { path: "rusty-core/src/executor.rs", what: "Module docs: the six stages of a super-step" },
    { path: "rusty-core/src/state.rs", what: "apply_super_step: validate, sort by node name, merge" },
    { path: "rusty-core/examples/parallel_fanout.rs", what: "The fan-out used in the diagram and lab" },
  ],
  related: [
    { label: "2.3 The super-step loop", href: "/learn/super-step-loop" },
    { label: "Pregel: A System for Large-Scale Graph Processing (SIGMOD 2010)", href: "https://doi.org/10.1145/1807167.1807184" },
  ],
};
