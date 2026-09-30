import type { Lesson } from "./types";

export const stateChannels: Lesson = {
  id: "2.2",
  slug: "state-channels",
  title: "State channels and reducers",
  minutes: 14,
  source: "rusty-core/src/state.rs",
  before: ["2.1"],
  summary:
    "A graph's state is a set of named channels, and each channel declares a reducer that says how writes merge into it. Nodes never modify state directly. They return partial updates, and the executor merges them at the end of the step.",
  glance: {
    learn: "What each of the four reducers does with one write and with several",
    try: "Firing writes from two parallel nodes into one channel",
    read: "Reducer, StateSpec::apply_super_step, and the add_messages upsert",
  },
  interactive: true,
  sections: [
    {
      id: "channels",
      title: "Channels and the StateSpec",
      toc: "Channels",
      blocks: [
        {
          type: "p",
          text: "Two nodes run in the same step and both return a value for `results`. Either one of them wins or the values are combined. If a framework picks silently, you find out later from a wrong answer. Rusty makes you pick up front, per key: every key in the state is a [[State channel|channel]], and every channel has a [[Reducer|reducer]].",
        },
        {
          type: "p",
          text: "`State` is a JSON object: channel name to value. A `StateSpec` is the schema that goes with it: channel name to `Reducer`. You build one with the `channel` builder and pass it to `Executor::run` next to the graph. This is the spec from the fan-out example:",
        },
        {
          type: "code",
          file: "rusty-core/examples/parallel_fanout.rs",
          code: `let spec = StateSpec::new()
    .channel("topics", Reducer::Overwrite)
    .channel("item", Reducer::Overwrite)
    .channel("results", Reducer::Append)
    .channel("summary", Reducer::Overwrite);`,
        },
        {
          type: "p",
          text: "A node reads the whole state from its snapshot and returns only the channels it changes, for example `NodeOutput::update(\"results\", record)`. Two nodes that touch different channels never interact.",
        },
        {
          type: "p",
          text: "Values are untyped JSON at this layer. To work with a concrete type, deserialize a channel with `state.get_as::<T>(\"channel\")`.",
        },
      ],
    },
    {
      id: "reducers",
      title: "The four reducers",
      toc: "Reducers",
      blocks: [
        {
          type: "p",
          text: "A reducer is a function from the current value and one update to the new value. Before reading it, commit to an answer:",
        },
        {
          type: "predict",
          question: "A `DeepMerge` channel holds `{\"tools\": [\"search\"]}` and receives `{\"tools\": [\"fetch\"]}`. What does it hold afterwards?",
          options: [
            "`{\"tools\": [\"search\", \"fetch\"]}`",
            "`{\"tools\": [\"fetch\"]}`",
            "`{\"tools\": [\"search\"]}`",
            "An InvalidUpdate error",
          ],
          answer: 1,
          explain:
            "DeepMerge recurses only while both sides are objects. Two arrays are not objects, so the update replaces the old value. If you want the lists joined, the list needs its own `Append` channel.",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "Reducer::apply",
          code: `pub fn apply(&self, current: Option<&Value>, update: Value) -> Value {
    match self {
        Reducer::Overwrite => update,
        Reducer::Append => match current {
            Some(Value::Array(existing)) => {
                let mut out = existing.clone();
                append_in_place(&mut out, update);
                Value::Array(out)
            }
            _ => match update {
                Value::Array(items) => Value::Array(items),
                single => Value::Array(vec![single]),
            },
        },
        Reducer::DeepMerge => match current {
            Some(cur) => deep_merge(cur, &update),
            None => update,
        },
        Reducer::AddMessages => add_messages(current, update),
    }
}`,
        },
        {
          type: "rows",
          rows: [
            {
              label: "`Overwrite`",
              text: "The update replaces the value. It is the default for any channel, and it accepts at most one write per super-step.",
            },
            {
              label: "`Append`",
              text: "List concatenation. An array update is extended onto the current array; any other value is pushed as one element. A missing value starts as `[]`.",
            },
            {
              label: "`DeepMerge`",
              text: "Objects merge key by key, recursively. Any pair that isn't two objects resolves to the update, so an array inside the object is replaced.",
            },
            {
              label: "`AddMessages`",
              text: "A message list with ID-aware upsert. A message whose `id` matches an existing one replaces it in place; anything else is appended.",
            },
          ],
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [
        {
          type: "predict",
          question: "`research_a` and `research_b` run in the same step and both write `summary`, declared `Overwrite`. `research_b` finishes last. What is in `summary` after the step?",
          options: [
            "`research_b`'s value, because it finished last",
            "`research_a`'s value, because it sorts first",
            "Both values, as an array",
            "Nothing changes: the step fails",
          ],
          answer: 3,
          explain:
            "A second write to an `Overwrite` channel in one step is an error, `RustyError::InvalidUpdate`, raised before any channel changes. Picking a winner would make the result depend on task timing.",
        },
        {
          type: "p",
          text: "Check it below. Pick a reducer and change who writes and who finishes first. The merge runs the same checks and produces the same error text as `apply_super_step`.",
        },
        { type: "diagram", name: "reducer-lab" },
      ],
    },
    {
      id: "single-write",
      title: "The single-write rule",
      toc: "Single-write rule",
      blocks: [
        {
          type: "p",
          text: "Only one reducer refuses a second write in the same step, and the check is one line:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "Reducer::allows_multiple_writes",
          code: `pub fn allows_multiple_writes(self) -> bool {
    !matches!(self, Reducer::Overwrite)
}`,
        },
        {
          type: "p",
          text: "For `Overwrite`, \"last write wins\" would mean \"whichever task finished last wins\", which changes from run to run. Rusty treats a second write as a bug in the graph and fails the step with `RustyError::InvalidUpdate`. The message names both writers:",
        },
        {
          type: "code",
          lang: "text",
          code: "invalid state update: channel `summary` can receive only one value per super-step (reducer: overwrite); already written by node `research_a`, second write from node `research_b`. Use a multi-write reducer (Append/DeepMerge/AddMessages) to handle concurrent writes.",
        },
        {
          type: "p",
          text: "The fix is almost always a reducer that aggregates. If the channel really should hold one value, make sure only one node in the step writes it, for example by routing the parallel results into a node that picks one.",
        },
        {
          type: "lab",
          title: "Break the fan-in",
          intro:
            "The fan-out example runs `process_item` four times in one step, and all four write `results`. Run it as shipped and look at the `results` channel it prints.",
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
  {
    "chars": 21,
    "checksum": 2142,
    "topic": "super-step scheduling"
  },
  {
    "chars": 22,
    "checksum": 2285,
    "topic": "checkpoint persistence"
  },
  {
    "chars": 16,
    "checksum": 1622,
    "topic": "channel reducers"
  },
  {
    "chars": 16,
    "checksum": 1709,
    "topic": "interrupt/resume"
  }
]`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "In `examples/parallel_fanout.rs`, declare the fan-in channel as `.channel(\"results\", Reducer::Overwrite)` and run the example again.",
            predict: "Does the run finish? If not, which node names does the error mention?",
            result:
              "All four `process_item` lines still print, because the nodes run before the merge. Then the program exits with `Error: InvalidUpdate(...)`: the channel can receive only one value per super-step, already written by node `process_item`, second write from node `process_item`. Both writers carry the same name because the four Send invocations share one node. `summarize` never runs.",
          },
        },
      ],
    },
    {
      id: "validation",
      title: "Validate everything, then merge",
      toc: "Validation",
      blocks: [
        {
          type: "p",
          text: "`StateSpec::apply_super_step` receives every node's updates for the step and checks all of them before it changes any channel. Three checks run for each write:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "The channel is declared in the spec. A write to anything else fails, and the message tells you to declare the channel in the StateSpec.",
            "For `Append` and `AddMessages`, the current value, if there is one, is an array. A non-array value is a type bug in the graph, so the write fails instead of silently replacing it.",
            "For `Overwrite`, this is the channel's first write in the step.",
          ],
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "StateSpec::apply_super_step",
          code: `for (node, updates) in &collected {
    for channel in updates.keys() {
        let Some(reducer) = self.try_reducer_for(channel) else {
            return Err(RustyError::InvalidUpdate(/* undeclared channel */));
        };
        // Append / AddMessages: the current value must be an array
        // ...
        let count = write_counts.entry(channel.as_str()).or_insert(0);
        *count += 1;
        first_writer.entry(channel.as_str()).or_insert(node.as_str());
        if *count > 1 && !reducer.allows_multiple_writes() {
            return Err(RustyError::InvalidUpdate(/* names both writers */));
        }
    }
}
// only now: apply every update through its reducer`,
        },
        {
          type: "p",
          text: "The loop returns before the merge loop starts, so a failure leaves the state exactly as it was at the start of the step. The executor then aborts the step and no write from it survives. [2.3 The super-step loop](/learn/super-step-loop#barrier) covers what happens to the run.",
        },
      ],
    },
    {
      id: "order",
      title: "Merge order",
      blocks: [
        {
          type: "p",
          text: "Node tasks finish in whatever order the scheduler produces, and for `Append` the order is visible in the result. So before validating, `apply_super_step` sorts the writes by node name:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "StateSpec::apply_super_step",
          code: `collected.sort_by(|a, b| a.0.cmp(&b.0));`,
        },
        {
          type: "p",
          text: "The test `fan_in_merge_order_is_deterministic` feeds the same two writes in both orders and asserts identical state. The sort also decides which node an error message calls the first writer: the one whose name sorts first.",
        },
        {
          type: "note",
          title: "Invocations of the same node",
          text: "The sort is stable, and it sorts by name. When a `Send` fan-out runs one node several times in a step, those invocations share a name, so their writes keep the order in which they reached the barrier. In the lab above, `results` came back in a different order from the log lines. If the order of fanned-in items matters, sort them in the node that reads them, or include a key in each item.",
        },
      ],
    },
    {
      id: "add-messages",
      title: "AddMessages",
      toc: "AddMessages",
      blocks: [
        {
          type: "p",
          text: "Chat history is the channel every agent has. `AddMessages` treats it as a list of message objects and upserts by the `id` field:",
        },
        {
          type: "code",
          file: "rusty-core/src/state.rs",
          symbol: "upsert_messages_in_place",
          code: `for msg in incoming {
    let msg_id = msg.get("id").and_then(Value::as_str).map(str::to_owned);
    match msg_id.as_deref().and_then(|id| index_of.get(id).copied()) {
        Some(i) => messages[i] = msg,
        None => {
            if let Some(id) = msg_id {
                index_of.insert(id, messages.len());
            }
            messages.push(msg);
        }
    }
}`,
        },
        {
          type: "p",
          text: "A node can rewrite an earlier message, for example to replace a streaming draft with the final text, by returning a message with the same `id`. Messages without an `id` are always appended, and so are messages whose `id` is not a string: `{\"id\": 123}` never matches anything.",
        },
      ],
    },
    {
      id: "copy-on-write",
      title: "What a merge costs",
      toc: "Cost",
      blocks: [
        {
          type: "p",
          text: "Every node gets its own copy of the state, and every checkpoint keeps one. That would be expensive with deep copies. Each channel value sits behind an `Arc`, so cloning a `State` is two reference-count bumps. At the barrier the snapshot is dropped first, so a channel no checkpoint still shares is merged in place, and a shared one is copied alone. Channels nobody wrote stay shared between the old and new state, which is also what delta checkpoints diff against. [3.1 Checkpoints](/learn/checkpoints#delta-checkpoints) covers that side.",
        },
      ],
    },
    {
      id: "limits",
      title: "Limits",
      blocks: [
        {
          type: "list",
          items: [
            "Every channel a node writes must be declared. Adding a field to a node's output means adding it to the spec too.",
            "Channels hold JSON. Type checks happen when a node deserializes a channel with `get_as`, after the graph compiles.",
            "There is no custom reducer function. Anything more specific than append or merge is done by a node that reads the channel and writes the result.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      q: "An `AddMessages` channel receives `{\"id\": \"m2\", \"content\": \"final\"}` and already holds a message with id `m2`. Where does the new message go?",
      a: "It replaces the existing `m2` in place, keeping its position in the list.",
    },
    {
      q: "A node writes a channel that isn't in the spec. What happens?",
      a: "InvalidUpdate: the node wrote to an undeclared channel. The spec is the complete schema.",
    },
  ],
  deeper: [{ book: "02-mental-model.html#five-concepts", label: "The Rusty mental model: five concepts" }],
  sources: [
    { path: "rusty-core/src/state.rs", what: "State, Reducer, StateSpec::apply_super_step, add_messages" },
    { path: "rusty-core/src/node.rs", what: "NodeOutput::update, partial updates" },
    { path: "rusty-core/src/error.rs", what: "RustyError::InvalidUpdate" },
    { path: "rusty-core/examples/parallel_fanout.rs", what: "A spec with Overwrite and Append channels" },
  ],
  related: [{ label: "2.3 The super-step loop", href: "/learn/super-step-loop" }],
};
