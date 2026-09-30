import type { Lesson } from "./types";

export const sendSync: Lesson = {
  id: "11.1",
  slug: "send-sync",
  title: "Send, Sync, and parallel nodes",
  minutes: 13,
  source: "rusty-core/src/node.rs",
  before: ["2.3"],
  summary:
    "Rusty runs the nodes of a super-step as tokio tasks, possibly on different threads, each with its own copy of the state. Two marker traits, Send and Sync, let the compiler check that this is safe before the program runs, and reference counting makes each node's copy of a large state cost a few nanoseconds.",
  glance: {
    learn: "Why Node is Send + Sync, and how State is shared without copying",
    try: "Stepping through the Arc structure of State across a super-step",
    read: "The Node trait, the spawn site, and a real rustc error",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "What parallel nodes need",
      toc: "Requirements",
      blocks: [
        {
          type: "p",
          text: "Parallel nodes need two things. Each node's code and data must be safe to move to another thread and to use from several threads at once. And each node needs its own view of the state, so one node's writes can't leak into another's in the middle of a step.",
        },
        {
          type: "p",
          text: "In a dynamic language, the first is a convention you hope everyone follows, and the second usually means a deep copy per node. A deep copy of a 10 MB state, four nodes wide, every step, is real time. Rust handles the first with the type system and makes the second cheap with reference counting.",
        },
      ],
    },
    {
      id: "traits",
      title: "Send and Sync",
      toc: "Send and Sync",
      blocks: [
        {
          type: "p",
          text: "`Send` means a value can be moved to another thread. `Sync` means a shared reference to it can be used from several threads at once (`T` is `Sync` exactly when `&T` is `Send`). The compiler implements both automatically for types whose parts all have them. `Rc<T>` has neither, because its reference count isn't atomic. `Arc<T>` is both when `T: Send + Sync`, because its count is.",
        },
      ],
    },
    {
      id: "bounds",
      title: "Where the bounds sit",
      toc: "The bounds",
      blocks: [
        {
          type: "p",
          text: "The `Node` trait requires both:",
        },
        {
          type: "code",
          file: "rusty-core/src/node.rs",
          symbol: "Node",
          code: `#[async_trait]
pub trait Node: Send + Sync {
    // ...
    async fn run(&self, ctx: NodeContext) -> Result<NodeOutput>;
}

#[async_trait]
impl<F, Fut> Node for F
where
    F: Fn(NodeContext) -> Fut + Send + Sync,
    Fut: Future<Output = Result<NodeOutput>> + Send,
{
    async fn run(&self, ctx: NodeContext) -> Result<NodeOutput> {
        (self)(ctx).await
    }
}`,
        },
        {
          type: "p",
          text: "`#[async_trait]` turns `run` into a method returning a boxed future that is `Send`. The blanket impl is what lets you pass an async closure to `add_node`: the closure must be `Send + Sync`, and the future it returns must be `Send`.",
        },
        {
          type: "p",
          text: "Each bound has a reason in the executor. The graph stores nodes as `Arc<dyn Node>`, and `Arc<T>` is only `Send` when `T` is `Send + Sync`. The same node can run several times in one step (a `Route::Send` fan-out), each invocation calling `run(&self)` from its own task, so the node must be safe to share. And the future `run` returns is handed to `JoinSet::spawn`, which requires `Send + 'static` because tokio's multi-threaded runtime may poll it on any worker thread.",
        },
      ],
    },
    {
      id: "spawn",
      title: "The spawn site",
      toc: "Spawn",
      blocks: [
        {
          type: "p",
          text: "Here is what crosses into each task, trimmed from `execute_super_step`:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `let snapshot = state.clone();
// ...
let mut join_set: JoinSet<(usize, String, Result<NodeOutput>, u64)> = JoinSet::new();
// ...
for (index, task) in active.iter().enumerate() {
    let node = graph.node(&task.name).ok_or_else(|| { /* ... */ })?;

    let mut node_state = snapshot.clone();
    // ...
    join_set.spawn(
        async move {
            // ... node.run(NodeContext::new(node_state, node_config) ...).await
            (index, name, result, latency_ms)
        }
        .instrument(node_span),
    );
}`,
        },
        {
          type: "p",
          text: "The `async move` block owns everything it touches: an `Arc<dyn Node>` clone, its own `State`, the config, and clones of the journal and gate handles. Nothing is borrowed from the executor's stack, which is what `'static` asks for. If any captured value weren't `Send`, this line wouldn't compile, and the executor could never run a node on another thread by mistake.",
        },
      ],
    },
    {
      id: "error",
      title: "What the compiler says",
      toc: "The compile error",
      blocks: [
        {
          type: "lab",
          title: "Capture an Rc in a node",
          intro:
            "Make a scratch crate that depends on `rusty-agent-runtime` and `serde_json`, and put this in `src/main.rs`. The node closure captures an `Rc`. Build it.",
          commands: `cat > src/main.rs <<'EOF'
use std::rc::Rc;

use rusty_agent_runtime::prelude::*;
use serde_json::json;

fn main() {
    let label = Rc::new(String::from("draft"));
    let mut builder = GraphBuilder::new();
    builder.add_node("write", move |_ctx: NodeContext| {
        let label = Rc::clone(&label);
        async move { Ok(NodeOutput::update("draft", json!(*label))) }
    });
}
EOF
cargo build`,
          output: `error[E0277]: \`Rc<std::string::String>\` cannot be sent between threads safely
   --> src/main.rs:9:31
    |
  9 |       builder.add_node("write", move |_ctx: NodeContext| {
    |               --------          ^-----------------------
    |               |                 |
    |  _____________|_________________within this \`{closure@src/main.rs:9:31: 9:55}\`
    | |             |
    | |             required by a bound introduced by this call
 10 | |         let label = Rc::clone(&label);
 11 | |         async move { Ok(NodeOutput::update("draft", json!(*label))) }
 12 | |     });
    | |_____^ \`Rc<std::string::String>\` cannot be sent between threads safely
    |
    = help: within \`{closure@src/main.rs:9:31: 9:55}\`, the trait \`std::marker::Send\` is not implemented for \`Rc<std::string::String>\`
…
note: required by a bound in \`rusty_agent_runtime::graph::GraphBuilder::add_node\`
   --> …/rusty-core/src/graph.rs:253:12
    |
251 |     pub fn add_node<N>(&mut self, name: impl Into<String>, node: N) -> &mut Self
    |            -------- required by a bound in this associated function
252 |     where
253 |         N: Node + 'static,
    |            ^^^^ required by this bound in \`GraphBuilder::add_node\`

error[E0277]: \`Rc<std::string::String>\` cannot be shared between threads safely
…
error: future cannot be sent between threads safely
…
error: could not compile \`sendsync\` (bin "sendsync") due to 3 previous errors`,
          capturedAt: "fedbb3a · 2026-09-29 · rustc 1.97.1",
          exercise: {
            change: "Replace `std::rc::Rc` with `std::sync::Arc`, and `Rc::new` and `Rc::clone` with `Arc::new` and `Arc::clone`. Build again.",
            predict: "Does it compile now, or does one of the three errors remain?",
            result: "It compiles, with no warnings. `Arc<String>` is `Send + Sync` because its count is atomic and `String` is both, so the closure and its future satisfy every bound.",
          },
        },
        {
          type: "p",
          text: "Three errors: the closure isn't `Send`, the closure isn't `Sync`, and the future isn't `Send`. Each one points at the `add_node` call, where you wrote the node, and names the `N: Node + 'static` bound in `graph.rs`. You find out at compile time, before the executor ever spawns the node.",
        },
        {
          type: "predict",
          question: "Now the node counts its calls through `Arc<Cell<u32>>`, bumping it with `calls.set(calls.get() + 1)`. `Arc` is the thread-safe pointer. Does it compile?",
          options: ["Yes: Arc makes anything shareable", "No: Cell isn't Sync, so Arc<Cell<u32>> isn't Send", "It compiles but panics when two invocations overlap"],
          answer: 1,
          explain:
            "We built it: two errors, the first being that `Cell<u32>` cannot be shared between threads safely. `Arc<T>` is `Send` only when `T` is `Send + Sync`. rustc suggests `std::sync::RwLock` or `std::sync::atomic::AtomicU32` instead. `Arc` makes the count safe; what it points to still has to be.",
        },
      ],
    },
    {
      id: "state",
      title: "Sharing state across tasks",
      toc: "Arc-shared state",
      blocks: [
        {
          type: "p",
          text: "Every node gets its own `State`, and the executor also keeps a start-of-step snapshot and a checkpoint copy. If each of those were a deep copy, parallelism would cost memory bandwidth in proportion to the state's size. `State` avoids that with two layers of `Arc`:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "State",
          code: `type ChannelMap = BTreeMap<String, Arc<Value>>;

#[derive(Debug, Clone, Default, PartialEq)]
pub struct State {
    inner: Arc<ChannelMap>,
}`,
        },
        {
          type: "p",
          text: "`#[derive(Clone)]` clones the outer `Arc`: one atomic increment, whatever is inside. All the clones point at the same map and the same channel values. They're also `Send + Sync` for free, because `Arc`, `BTreeMap`, `String`, and `serde_json::Value` all are. That's what makes it legal to hand one to each task.",
        },
        {
          type: "p",
          text: "Sharing is safe here because nothing writes to a shared value. Writes happen once, at the barrier, and go through copy-on-write:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "StateSpec::apply_super_step",
          code: `// Copy-on-write merge: the channel is taken OUT of the map
// first, so a value no snapshot or checkpoint shares has
// refcount 1 here and the reducer merges into it in place;
// a shared value is cloned by the reducer — that channel
// alone, never the whole state.
let current = Arc::make_mut(&mut state.inner).remove(&channel);
let merged = reducer.apply_shared(current, update);
state.insert_shared(channel, merged);`,
        },
        {
          type: "p",
          text: "`Arc::make_mut` clones the map only if someone else holds it, and then only shallowly: one pointer per channel. Inside `apply_shared`, an `Append` calls `Arc::get_mut` on the channel value. If this state is the only owner it pushes onto the existing array; if a checkpoint still holds the value, it copies that one array. Channels no node wrote are never touched and stay shared with the previous checkpoint. Just before merging, the executor runs `drop(snapshot)` so the step's own snapshot doesn't force a copy.",
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [
        {
          type: "p",
          text: "Two nodes run in one step: `research_a` appends to `notes`, `research_b` overwrites `summary`. Step through and watch which allocations are shared, copied, or replaced. Turn off the checkpoint to see the in-place merge a non-durable run gets.",
        },
        { type: "diagram", name: "cow-snapshot" },
      ],
    },
    {
      id: "numbers",
      title: "The numbers",
      blocks: [
        {
          type: "p",
          text: "`docs/benchmarks.md` measured this change (R0.7 wave 4) before and after, same day, same machine (Apple M2 Max, rustc 1.97.1, Criterion 0.5.1). The `superstep_snapshot_clones` group times the executor's actual per-step fan-out: the pre-step snapshot, four node clones, and the checkpoint copy.",
        },
        {
          type: "rows",
          rows: [
            { label: "State::clone(), 1 MB", tone: "green", text: "17.16 µs before, 3.88 ns after." },
            { label: "State::clone(), 10 MB", tone: "green", text: "312.78 µs before, 3.95 ns after." },
            { label: "6-clone fan-out, 1 MB and 10 MB", tone: "green", text: "About 105 µs and 1.9 ms per step before, **about 26 ns** after, flat in payload size." },
            { label: "Append to 10,000 elements", tone: "amber", text: "696.79 µs before. 7.57 µs when the merge owns the channel; 496.67 µs when a live checkpoint forces the copy." },
          ],
        },
        {
          type: "p",
          text: "Serialization didn't get faster. Writing a 1 MB checkpoint still walks the whole value (about 470 µs either way). Copy-on-write removes clone cost; delta checkpoints, which store only the channels whose `Arc` changed, address the write cost. [3.1 Checkpoints](/learn/checkpoints#delta-checkpoints) covers those.",
        },
      ],
    },
    {
      id: "trade-offs",
      title: "What it costs",
      toc: "Trade-offs",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "Owned data only.",
              text: "A node can't borrow from your stack. Anything it uses is moved in or shared through `Arc`, which is why node closures are written `move |ctx| …` with `Arc::clone` inside.",
            },
            {
              label: "Shared mutation needs a lock.",
              text: "A node that keeps its own mutable state across calls needs a `Mutex` or an atomic, because the same node may run in parallel with itself. Most nodes shouldn't: state belongs in channels, and nodes must be safe to re-run.",
            },
            {
              label: "Durable merges still copy.",
              text: "With a checkpointer attached, the previous checkpoint shares every channel, so each written channel is copied once at the merge. The cost grows with the number of written channels, whatever the size of the state.",
            },
            {
              label: "Long error messages.",
              text: "Trait-bound errors through async closures are verbose, as above. The first line and the `required by a bound` note are the parts to read.",
            },
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      q: "Why does Node need Sync as well as Send?",
      a: "The graph holds nodes as Arc<dyn Node>, which is only Send if the node is Send + Sync, and one node can run several times in a step, sharing &self across tasks.",
    },
    {
      q: "Four nodes run on a 10 MB state. Roughly how much does giving each one a snapshot cost?",
      a: "About 26 ns for the whole six-clone fan-out: each clone is one reference-count increment, independent of size.",
    },
    {
      q: "In a durable run, research_a appends to notes. Which channels does the merge copy?",
      a: "Only notes, because the previous checkpoint still shares it. The map is copied shallowly; untouched channels stay shared.",
    },
  ],
  sources: [
    { path: "rusty-core/src/node.rs", what: "The Node trait and its blanket impl" },
    { path: "rusty-core/src/executor.rs", what: "execute_super_step: JoinSet, per-node snapshot, drop(snapshot)" },
    { path: "rusty-core/src/state.rs", what: "State, apply_super_step, Reducer::apply_shared" },
    { path: "rusty-core/src/graph.rs", what: "GraphBuilder::add_node" },
    { path: "docs/benchmarks.md", what: "State scaling, R0.7 wave 4 before/after" },
  ],
  deeper: [{ book: "02-mental-model.html#one-run-end-to-end", label: "The Rusty mental model: one run, end to end" }],
  related: [{ label: "2.3 The super-step loop", href: "/learn/super-step-loop" }],
};
