import type { Lesson } from "./types";

export const idempotentNodes: Lesson = {
  id: "3.4",
  slug: "idempotent-nodes",
  title: "Why nodes must be idempotent",
  minutes: 12,
  source: "rusty-core/src/node.rs",
  before: ["3.1", "3.2"],
  summary:
    "Rusty saves state only between super-steps. When a run resumes, after an interrupt or a crash, each node scheduled for that step runs again from its first line. Anything a node did to the outside world before the pause can happen a second time. This page shows that happening in a real run and the standard way to make a repeated call harmless.",
  glance: {
    learn: "Which nodes run again on resume, and what makes a repeated side effect harmless",
    try: "An email sent twice across interrupt and resume, then once with an idempotency key",
    read: "NodeContext::interrupt and the Effect classes",
  },
  sections: [
    {
      id: "rule",
      title: "The rule",
      blocks: [
        {
          type: "p",
          text: "The doc comment on `NodeContext::interrupt` states it in one sentence, in parentheses:",
        },
        {
          type: "code",
          file: "rusty-core/src/node.rs",
          symbol: "NodeContext::interrupt",
          code: `/// Returning \`Err(ctx.interrupt(payload))\` from a node suspends the whole
/// run — not just this node. The super-step is transactional: no write of
/// the in-flight step survives, not even from sibling nodes that already
/// completed. The executor therefore persists a checkpoint that
/// re-schedules the **entire active set** of the suspended step — the
/// interrupting node plus all of its siblings — and surfaces \`payload\` in
/// [\`crate::executor::ExecutionOutcome::Interrupted\`]. On resume, every
/// node of that set re-executes from its start (node logic must be
/// idempotent), with [\`NodeContext::resume_value\`] set for the first
/// super-step.
pub fn interrupt(&self, value: Value) -> RustyError {
    RustyError::Interrupt { value }
}`,
        },
        {
          type: "p",
          text: "There is no mid-node save point. A [[Checkpoint|checkpoint]] records the state and `next_nodes` at a step boundary, and resuming means running `next_nodes` again. A crash is the same: whatever step was in flight is lost, and the last checkpoint's `next_nodes` run from the start. The node that asked the question expects this. Its siblings in the same step are the ones people forget.",
        },
      ],
    },
    {
      id: "sibling",
      title: "A sibling that sends an email",
      toc: "The sibling",
      blocks: [
        {
          type: "p",
          text: "Here is a small graph. `prepare` writes an order id. Then two nodes run in the same step: `notify` emails the ops team that the order is waiting, and `approve` interrupts until a person decides. `notify` never interrupts and never fails.",
        },
        {
          type: "code",
          lang: "rust",
          code: `b.add_node("notify", move |ctx: NodeContext| async move {
    let order = ctx.state().get("order").and_then(|v| v.as_str()).unwrap_or("?").to_owned();
    let body = format!("to=ops@example.com: {order} is waiting for approval");
    send_email(&dir, None, &body)?; // appends a line to outbox.log
    Ok(NodeOutput::update("notified", json!(true)))
});
b.add_node("approve", |ctx: NodeContext| async move {
    match ctx.resume_value() {
        Some(decision) => Ok(NodeOutput::update("approval", decision.clone())),
        None => Err(ctx.interrupt(json!({"question": "ship order-42?"}))),
    }
});
b.set_entry_point("prepare");
b.add_edge("prepare", "notify");
b.add_edge("prepare", "approve");

let executor = Executor::with_checkpointer(Arc::new(JsonFileCheckpointer::new(dir.join("checkpoints"))));`,
        },
        {
          type: "predict",
          question:
            "The program runs once and stops at the interrupt. A second process resumes thread-7 with `{\"approved\": true}`. How many emails are in the outbox?",
          options: [
            "One: notify finished before the interrupt",
            "Two: notify runs again on resume",
            "Zero: the step's work was discarded",
            "One, but only because the checkpoint remembers notified = true",
          ],
          answer: 1,
          explain:
            "The step is discarded as a unit, so notify's write of `notified = true` never reached the state. The suspension checkpoint schedules both nodes, and on resume notify sends again. Discarding the write can't unsend the email.",
        },
        {
          type: "lab",
          title: "Two processes, two emails",
          intro:
            "A scratch crate built from the code above, run as two separate processes with a `JsonFileCheckpointer`. `send_email` stands in for a mail API: it appends one line to `outbox.log` per accepted send.",
          commands: `cargo run -q -- naive start
jq -c '{step, next_nodes}' data/naive/checkpoints/thread-7/$(cat data/naive/checkpoints/thread-7/latest).json
cargo run -q -- naive resume
cat data/naive/outbox.log`,
          output: `[approve] no decision yet, interrupting
[notify] sent: to=ops@example.com: order-42 is waiting for approval
interrupted: {"question":"ship order-42?"}

{"step":1,"next_nodes":["notify","approve"]}

[approve] resumed with {"approved":true}
[notify] sent: to=ops@example.com: order-42 is waiting for approval
done: notified=true approval={"approved":true}

to=ops@example.com: order-42 is waiting for approval
to=ops@example.com: order-42 is waiting for approval`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "Pass an idempotency key to the send: `format!(\"{}:notify:{order}\", ctx.thread_id())`. The fake provider records keys it has accepted and skips a key it has seen (run it as `keyed` so it uses a fresh data directory).",
            predict: "What does notify print on resume, and how many lines are in the outbox?",
            result:
              "Phase 1 prints `[notify] key thread-7:notify:order-42 -> sent`. On resume notify still runs, and prints `[notify] key thread-7:notify:order-42 -> already sent, skipped`. The outbox has one line. The run ends `done: notified=true approval={\"approved\":true}` as before.",
          },
        },
        {
          type: "p",
          text: "Look at the first lines of the output. `approve` reached the barrier first, and `notify` still sent its email. Dropping the `JoinSet` aborts the tasks still running, but a task is only stopped at its next `.await`, and work it already did stays done. Aborting a sibling doesn't undo its side effect either.",
        },
      ],
    },
    {
      id: "what-repeats",
      title: "What repeats and what doesn't matter",
      toc: "What repeats",
      blocks: [
        {
          type: "p",
          text: "Rusty names five [[Effect|effect]] classes, defined in `rusty-api` and used by retry and replay policy. They are the right vocabulary for asking whether a node is safe to run twice:",
        },
        {
          type: "rows",
          rows: [
            { label: "Pure", tone: "green", text: "A function of its inputs. Running it again gives the same output. The default for a node." },
            { label: "ReadOnly", tone: "green", text: "Reads the outside world. Safe to repeat, though the world may have changed in between." },
            { label: "Idempotent", tone: "green", text: "Writes, but a repeat under the same idempotency key has the effect of one call. Upserts, PUTs, keyed requests." },
            { label: "Compensatable", tone: "amber", text: "A repeat duplicates the effect, and a declared compensation can undo it (charge and refund)." },
            { label: "NonIdempotent", tone: "red", text: "A repeat duplicates the effect with no safe undo. Emails, unkeyed POSTs. The default for model and tool calls." },
          ],
        },
        {
          type: "p",
          text: "Model calls belong on the list. A node that calls a model before it interrupts pays for that call again on resume and may get a different answer. The prebuilt ReAct agent avoids this for tools by asking for approval before any call runs; see [2.6](/learn/react-as-a-graph#gate).",
        },
      ],
    },
    {
      id: "fixes",
      title: "Making a node safe to run again",
      toc: "Fixes",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "Ask first, act after",
              text: "In a node that interrupts, check `ctx.resume_value()` before doing anything else, and do the side effect only on the branch that has the answer. That is the pattern in `examples/human_in_loop.rs`, and the reason its `approve` node does nothing but log before the interrupt.",
            },
            {
              label: "Keep effects out of pausing steps",
              text: "The email above ran alongside an interrupting node. Give it an edge from `approve` instead, and it runs in the step after the decision. A crash can still re-run it, so this narrows the window without closing it.",
            },
            {
              label: "Key the effect",
              text: "Derive a key from facts that are the same on every attempt (thread id, node, business id) and send it to a receiver that deduplicates. Never derive it from a clock or a random id, or each attempt gets a new key.",
            },
          ],
        },
        {
          type: "p",
          text: "The key has to be checked by whoever performs the effect. A flag the node writes to state after sending doesn't work: the write is discarded with the step, as the naive run showed. A flag the node writes to its own file after sending leaves a gap, since a crash between the send and the flag repeats the send. Mail and payment APIs that accept an idempotency key close that gap on their side.",
        },
        {
          type: "p",
          text: "One consequence of the key used in the lab: a [[Fork|fork]] runs under a new thread id, so the forked thread's keys differ and its notify sends again. Whether that is right depends on the effect. Pick the key's parts with that in mind.",
        },
      ],
    },
    {
      id: "ahead",
      title: "Where Rusty takes this further",
      toc: "Further",
      blocks: [
        {
          type: "p",
          text: "The effect kernel makes the key a requirement: admitting an `Idempotent` effect without one fails before the effect runs.",
        },
        {
          type: "code",
          file: "rusty-core/src/effects.rs",
          symbol: "EffectAdmissionContext::admit",
          code: `Effect::Idempotent => {
    if request.idempotency_key().is_none() {
        return Err(EffectViolation::MissingIdempotencyKey {
            kind: request.kind().to_owned(),
        });
    }
    (None, None)
}`,
        },
        {
          type: "p",
          text: "Durable tasks carry the same idea across process crashes. A task's envelope holds an idempotency key, the queue deduplicates on it, and the worker passes it to the external system. [4.2 Leases, heartbeats, and retries](/learn/leases-and-retries) covers how a task is retried, 4.3 covers keys and [[Effect receipt|effect receipts]], and [4.4](/learn/crash-recovery) walks through the test that kills a worker mid-effect and checks the provider saw one call.",
        },
      ],
    },
  ],
  takeaways: [
    "Resume re-runs every node of the suspended step from its first line, including siblings that finished.",
    "Discarding a step's writes can't undo what its nodes did outside the process.",
    "Check for the resume value first, and key external writes with ids that are stable across attempts.",
  ],
  deeper: [
    { book: "10-durability.html#level-one-the-checkpointed-run", label: "Level one: the checkpointed run" },
    { book: "10-durability.html#level-two-durable-work", label: "Level two: durable work" },
  ],
  sources: [
    { path: "rusty-core/src/node.rs", what: "NodeContext::interrupt, NodeContext::resume_value" },
    { path: "rusty-core/src/executor.rs", what: "the interrupt arm of the barrier: the whole active set is re-scheduled" },
    { path: "rusty-api/src/lib.rs", what: "Effect and is_freely_repeatable" },
    { path: "rusty-core/src/effects.rs", what: "admit: MissingIdempotencyKey" },
    { path: "rusty-core/examples/human_in_loop.rs", what: "the check-first interrupt pattern" },
  ],
};
