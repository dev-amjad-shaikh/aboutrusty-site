import type { Lesson } from "./types";

export const snapshotIsolation: Lesson = {
  id: "2.4",
  slug: "snapshot-isolation",
  title: "Snapshot isolation and deterministic merges",
  minutes: 12,
  source: "rusty-core/src/executor.rs",
  before: ["2.2", "2.3"],
  summary:
    "Nodes in the same super-step can't see each other's writes, and their writes merge in an order that doesn't depend on which task finished first. Both properties come from a few lines in the executor and the state module. There is one exception worth knowing: several Send invocations of the same node merge in the order they finished.",
  glance: {
    learn: "Where each node's private copy comes from, and how the merge order is fixed",
    try: "Two nodes with and without isolation, then a real run with timed Send invocations",
    read: "execute_super_step and StateSpec::apply_super_step",
  },
  interactive: true,
  sections: [
    {
      id: "two-nodes",
      title: "Two nodes, one step",
      blocks: [
        {
          type: "p",
          text: "Take a step with two nodes. `zeta` sleeps 5 ms and writes `n = 1`. `alpha` sleeps 40 ms and then reads `n`, which started the step at 0. By the time `alpha` looks, `zeta` has been finished for 35 ms.",
        },
        {
          type: "predict",
          question: "What value of `n` does `alpha` read?",
          options: [
            "1, because zeta finished first",
            "0, the value at the start of the step",
            "Either one, depending on scheduling",
          ],
          answer: 1,
          explain:
            "Each node runs on its own clone of the state taken when the step began. zeta's write sits in the executor's list of pending writes until the barrier, so alpha's copy still holds 0. The lab further down shows this in a real run.",
        },
        {
          type: "p",
          text: "Switch between the two modes below. In the shared-map mode, the design Rusty avoids, the same graph gives two different answers depending on timing.",
        },
        { type: "diagram", name: "snapshot-isolation" },
      ],
    },
    {
      id: "clone",
      title: "Where the private copy comes from",
      toc: "The clone",
      blocks: [
        {
          type: "p",
          text: "At the start of the compute stage, the executor clones the state once. Then, for every scheduled invocation, it clones that snapshot again and hands the copy to the node's task:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `// -- compute. Scoped (Send) state is overlaid onto each invocation's
//    private copy of the start-of-step snapshot, so fan-out items
//    never collide in the shared state.
let snapshot = state.clone();
// ...
for (index, task) in active.iter().enumerate() {
    // ...
    let mut node_state = snapshot.clone();
    if let Some(scoped) = &task.scoped {
        match scoped {
            Value::Object(map) => {
                for (channel, value) in map {
                    node_state.insert(channel.clone(), value.clone());
                }
            }
            // a non-object Send payload fails with InvalidUpdate
        }
    }`,
        },
        {
          type: "p",
          text: "A node's output never touches `state` while it runs. It comes back through the `JoinSet` as a `NodeOutput`, and the barrier collects it into a list. Nothing in `node_state` is shared with any other task, so there is nothing to lock and nothing to race on.",
        },
        {
          type: "p",
          text: "A clone per node sounds expensive for large state. It isn't, because each channel sits behind an `Arc` and a clone copies pointers. [2.2](/learn/state-channels) covers the copy-on-write merge. The executor also drops `snapshot` right before merging, so channels no checkpoint still shares can be merged in place.",
        },
        {
          type: "p",
          text: "The same copy is where a `Send`'s scoped input lands. Each fan-out invocation gets its item written into its private copy, so three invocations can each read a different `item` without the channel ever holding more than the start-of-step value.",
        },
      ],
    },
    {
      id: "merge-order",
      title: "Arrival order and merge order",
      toc: "Merge order",
      blocks: [
        {
          type: "p",
          text: "The barrier drains the `JoinSet` with `join_next()`, which yields tasks as they finish. Writes are pushed in that order:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `while let Some(joined) = join_set.join_next().await {
    let (index, name, result, latency_ms) = joined.map_err(/* ... */)?;
    match result {
        Ok(output) => {
            // ...
            ran_nodes.push(name.clone());
            writes.push((name, output.updates));
        }
        // interrupt and error arms
    }
}`,
        },
        {
          type: "p",
          text: "Finish order changes from run to run, so `apply_super_step` puts the writes into a canonical order before it validates or applies anything:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "StateSpec::apply_super_step",
          code: `// Collect up front so the whole super-step is validated before a
// single channel is touched — that is what makes failure
// all-or-nothing. Also canonicalize the merge order: executors feed
// writes in task-completion order, which is nondeterministic.
let mut collected: Vec<(String, HashMap<String, Value>)> = writes
    .into_iter()
    .map(|(node, updates)| (node.as_ref().to_owned(), updates))
    .collect();
collected.sort_by(|a, b| a.0.cmp(&b.0));`,
        },
        {
          type: "p",
          text: "For reducers where order matters, that sort is what makes the result repeatable. `Append` and `AddMessages` build arrays, so `alpha`'s entry always comes before `zeta`'s. `DeepMerge` lets a later write win on a conflicting key, so the node whose name sorts later wins, on every run.",
        },
      ],
    },
    {
      id: "send-caveat",
      title: "The exception: one node, many invocations",
      toc: "Send caveat",
      blocks: [
        {
          type: "p",
          text: "The sort key is the node name. When a router returns `Route::Send` with three items for `item`, the step has three invocations that all carry the name `item`. `sort_by` on a slice is stable, so writes with equal keys keep the order they already had, and that order is barrier arrival.",
        },
        {
          type: "predict",
          question:
            "A router sends three items to `item`, in the order a, b, c. The invocations sleep 30 ms, 10 ms, and 20 ms, then append their item to `log`. What order does `log` end up in?",
          options: ["a, b, c (Send order)", "b, c, a (finish order)", "a, b, c, sorted by value", "It fails: three writes from one node"],
          answer: 1,
          explain:
            "All three writes sort equal on the node name, and the stable sort leaves them in the order join_next() returned them. b finished first, then c, then a. Append accepts multiple writes per step, so nothing fails.",
        },
        {
          type: "lab",
          title: "Isolation and merge order in a real run",
          intro:
            "A scratch crate with the alpha/zeta step from the top of this page, followed by a three-way Send fan-out with different delays. Compare the timestamps with the final `log`.",
          commands: `# scratch crate depending on rusty-core (as in 2.1), code below in src/main.rs
cargo run -q`,
          output: `[step 0] active: start
[step 1] active: alpha, zeta
[  8 ms] zeta  finishes, writes n = 1
[ 43 ms] alpha finishes, reads n = 0
[step 2] active: fan
[step 3] active: item, item, item
[ 59 ms] item b finishes after 10 ms
[ 68 ms] item c finishes after 20 ms
[ 78 ms] item a finishes after 30 ms
[step 4] active: report

final n   = 1
final log = ["alpha saw n=0","zeta","item b","item c","item a"]`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change: "Make `zeta` sleep 80 ms instead of 5 ms, so it finishes after `alpha`.",
            predict: "Does the start of `log` change? Does alpha still read 0?",
            result:
              "The timestamps flip (alpha at 43 ms, zeta at 83 ms) and nothing else changes: alpha still reads n = 0, and log still starts \"alpha saw n=0\", \"zeta\". Only the item entries follow finish order.",
          },
        },
        {
          type: "code",
          lang: "rust",
          code: `let spec = StateSpec::new()
    .channel("n", Reducer::Overwrite)
    .channel("log", Reducer::Append)
    .channel("item", Reducer::Overwrite)
    .channel("delay", Reducer::Overwrite);

b.add_node("zeta", |_ctx: NodeContext| async move {
    tokio::time::sleep(Duration::from_millis(5)).await;
    Ok(NodeOutput::update("n", json!(1)).with_update("log", json!("zeta")))
});
b.add_node("alpha", |ctx: NodeContext| async move {
    tokio::time::sleep(Duration::from_millis(40)).await;
    let n = ctx.state().get("n").cloned().unwrap_or_default();
    Ok(NodeOutput::update("log", json!(format!("alpha saw n={n}"))))
});
b.add_node("item", |ctx: NodeContext| async move {
    let item = ctx.state().get("item").and_then(|v| v.as_str()).unwrap_or("?").to_owned();
    let delay = ctx.state().get("delay").and_then(|v| v.as_u64()).unwrap_or(0);
    tokio::time::sleep(Duration::from_millis(delay)).await;
    Ok(NodeOutput::update("log", json!(format!("item {item}"))))
});
// start -> alpha, zeta -> fan; fan's router:
b.add_conditional_edges("fan", |_state| async move {
    Ok(Route::Send(vec![
        Send::new("item", json!({"item": "a", "delay": 30})),
        Send::new("item", json!({"item": "b", "delay": 10})),
        Send::new("item", json!({"item": "c", "delay": 20})),
    ]))
});
b.add_edge("item", "report");
// initial state: n = 0. The printlns with timestamps are left out here.`,
        },
        {
          type: "p",
          text: "Two details in that output are worth a second look. `item` and `delay` are declared channels, yet the final state never holds them: the Send payloads went into each invocation's private copy only. And `report` ran once, even though three invocations each had the edge `item → report`, because the next step's plan holds each node name once.",
        },
      ],
    },
    {
      id: "living-with-it",
      title: "When fan-out order matters",
      toc: "Living with it",
      blocks: [
        {
          type: "p",
          text: "If the downstream node needs results in item order, don't rely on the array order. Put the item's key or index into what each invocation writes and sort or look up by it in the next step. The `parallel_fanout` example writes a record per topic with the topic in it, which is the same idea.",
        },
        {
          type: "p",
          text: "The [[Run journal|run journal]] is already ordered for you. After the barrier, finished invocations are sorted by their index in the active set before their `NodeOutput` events are recorded, so two recordings of the same run list outputs in the same order even when the merged array differs:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `// Journal node outputs in active-set order, not JoinSet finish
// order: the finish order is scheduling-dependent, and the journal's
// sequence is evidence — replay compares it.
completed.sort_by_key(|(index, ..)| *index);`,
        },
      ],
    },
  ],
  deeper: [{ book: "02-mental-model.html#one-run-end-to-end", label: "One run, end to end" }],
  sources: [
    { path: "rusty-core/src/executor.rs", what: "execute_super_step: snapshot clone, Send overlay, barrier, journal order" },
    { path: "rusty-core/src/state.rs", what: "StateSpec::apply_super_step: the sort and the validation pass" },
    { path: "rusty-core/src/graph.rs", what: "Route::Send, Send::new" },
    { path: "rusty-core/examples/parallel_fanout.rs", what: "a Send fan-out that writes keyed records" },
  ],
};
