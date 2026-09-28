import type { Lesson } from "./types";

export const interrupts: Lesson = {
  id: "3.2",
  slug: "interrupts",
  title: "Interrupts",
  minutes: 12,
  source: "rusty-core/src/node.rs",
  before: ["2.3", "3.1"],
  summary:
    "An interrupt pauses a run so a person can decide something, then continues it with their answer. The pause can last seconds or weeks and can outlive the process. This lesson shows how a node asks, what the executor saves, and what happens on resume.",
  glance: {
    learn: "How a run parks and resumes around a checkpoint",
    try: "Stepping through park and resume, call by call",
    read: "The approve node from human_in_loop.rs",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "The problem",
      blocks: [
        {
          type: "p",
          text: "Some steps need a person: approving a payment, publishing a draft, confirming a destructive command. Waiting for them inside a running task doesn't work. The task holds memory for hours, and a restart loses the question and the work around it.",
        },
        {
          type: "p",
          text: "Rusty treats the wait as a stopped run with a saved checkpoint. Nothing runs while the person thinks. Their answer starts the run again from that checkpoint.",
        },
      ],
    },
    {
      id: "asking",
      title: "How a node asks",
      toc: "Asking",
      blocks: [
        {
          type: "p",
          text: "A node pauses the run by returning the error built by `ctx.interrupt(payload)`. The payload is any JSON you want the person to see. On resume, the same node runs again and `ctx.resume_value()` returns their answer. So the node checks for an answer first and only asks when there isn't one:",
        },
        {
          type: "code",
          file: "rusty-core/examples/human_in_loop.rs",
          symbol: "approve node",
          code: `builder.add_node("approve", |ctx: NodeContext| async move {
    match ctx.resume_value() {
        Some(decision) => Ok(NodeOutput::update("approval", decision.clone())),
        None => {
            let draft = ctx.state().get("draft").cloned().unwrap_or(Value::Null);
            Err(ctx.interrupt(json!({
                "kind": "approval_request",
                "prompt": "Approve this draft for publication?",
                "draft": draft,
            })))
        }
    }
});`,
        },
        {
          type: "p",
          text: "The graph in that example is `draft → approve → publish`, with a `JsonFileCheckpointer`. Run it with `cd rusty-core && cargo run --example human_in_loop`.",
        },
      ],
    },
    {
      id: "park-resume",
      title: "Park and resume",
      toc: "Park and resume",
      blocks: [
        { type: "p", text: "Step through both calls to `Executor::run`. The first one parks; the second one, with the same thread id, resumes:" },
        { type: "diagram", name: "interrupt-sequence" },
        {
          type: "p",
          text: "The first call returns `ExecutionOutcome::Interrupted { value, state, checkpoint_id }`. To resume, call `run` again with the same thread id and `RunConfig::new(thread_id).with_resume(decision)`. The executor loads the latest checkpoint for the thread, restores its state and next nodes, and delivers the resume value to the first step.",
        },
      ],
    },
    {
      id: "whole-step",
      title: "The whole step runs again",
      toc: "Whole step",
      blocks: [
        {
          type: "p",
          text: "An interrupt is handled like a failure at the barrier: the step is discarded. That includes writes from sibling nodes that finished before the interrupt arrived. Siblings still running are aborted when the JoinSet is dropped. So the suspension checkpoint schedules every node of the step, not only the one that asked:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "execute_super_step",
          code: `drop(join_set);
// ...
let pending: Vec<String> = active.iter().map(|t| t.name.clone()).collect();
// ...
let checkpoint = recorder.mint_checkpoint(
    config.thread_id.clone(),
    step,
    state.clone(),
    pending,
    stamp,
);`,
        },
        {
          type: "p",
          text: "Two consequences follow. First, the resume value is broadcast: every node in the first step after a resume sees `resume_value()` return `Some`, not only the node that asked. A node that should react only to its own question has to check its own state. Second, everything a node does before calling `interrupt` happens again on resume, so that part must be safe to repeat.",
        },
      ],
    },
    {
      id: "server",
      title: "Over HTTP",
      blocks: [
        {
          type: "p",
          text: "The server exposes the same mechanism. A run that interrupts ends with status `interrupted` and returns the payload. Using the `publisher` graph from docs/server-quickstart.md:",
        },
        {
          type: "code",
          lang: "shell",
          code: `curl -s -X POST localhost:8080/threads/$TID/runs/wait \\
  -H 'Content-Type: application/json' \\
  -d '{"input": {"draft": "Rust agents, one binary."}}'
# {"status": "interrupted",
#  "interrupt": {"kind": "approval_request", ...},
#  "checkpoint_id": "a94f…", ...}

curl -s localhost:8080/threads/$TID/state
# {"values": {...}, "next": ["approve"], ...}`,
        },
        {
          type: "p",
          text: "There is no separate resume endpoint. You start another run on the same thread with `command.resume`, on any of `runs`, `runs/wait`, or `runs/stream`:",
        },
        {
          type: "code",
          lang: "shell",
          code: `curl -N -X POST localhost:8080/threads/$TID/runs/stream \\
  -H 'Content-Type: application/json' \\
  -d '{"command": {"resume": {"approved": true, "reviewer": "alice"}},
       "stream_mode": ["updates", "values"]}'`,
        },
        {
          type: "p",
          text: "The checkpoint is on disk, so the server can restart between the two calls. The resumed run's journal starts with a `resume` event that names the checkpoint it continued from.",
        },
      ],
    },
    {
      id: "approvals",
      title: "Approvals for irreversible effects",
      toc: "Approvals",
      blocks: [
        {
          type: "p",
          text: "The prebuilt ReAct agent uses the same mechanism for tool calls it can't make without permission. Before it executes a call whose effect is `NonIdempotent` and that has no approval token, the tools node raises an interrupt of kind `approval` (`APPROVAL_INTERRUPT_KIND` in rusty-core/src/react.rs). The run goes `interrupted`.",
        },
        {
          type: "p",
          text: "On the server, a person answers with `POST /approvals/{run_id}/decide` and `{\"decision\": \"approve\"}` or `\"deny\"`. Approving mints one token scoped to that request's effect id and resumes the run with it. Denying resumes the run with the refusal, which the model reads as a tool result. `GET /approvals` lists what is waiting.",
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
              label: "Work before the question repeats.",
              text: "The asking node, and every sibling in its step, runs again from the start on resume.",
            },
            {
              label: "Resume needs a checkpointer.",
              text: "Without one the run still suspends, but nothing is saved and the returned checkpoint id can't be resumed.",
            },
            {
              label: "One pending question per thread.",
              text: "A thread has one latest checkpoint. The server runs one active run per thread, so resumes on a thread are ordered.",
            },
          ],
        },
      ],
    },
  ],
  takeaways: [
    "A node asks with `Err(ctx.interrupt(payload))` and reads the answer with `ctx.resume_value()`.",
    "The interrupted step is discarded and every node in it is scheduled again.",
    "Resume is another run on the same thread with a resume value, in Rust or over HTTP.",
    "Code before the `interrupt` call runs twice, so it must be safe to repeat.",
  ],
  quiz: [
    {
      q: "Nodes A and B run in the same step. A finishes, then B interrupts. On resume, which nodes run?",
      a: "Both. A's writes were discarded with the step, and the suspension checkpoint schedules the whole active set.",
    },
    {
      q: "Why does the approve node check `resume_value()` before calling `interrupt`?",
      a: "Because on resume the node runs again from the top. Checking first is how it tells the second run from the first.",
    },
    {
      q: "The server restarts while a run is interrupted. Is the question lost?",
      a: "No. The suspension checkpoint is stored, and a new run on the thread with `command.resume` continues from it.",
    },
  ],
  sources: [
    { path: "rusty-core/src/node.rs", what: "NodeContext::interrupt, resume_value" },
    { path: "rusty-core/src/executor.rs", what: "suspension checkpoint, ExecutionOutcome::Interrupted" },
    { path: "rusty-core/examples/human_in_loop.rs", what: "draft → approve → publish" },
    { path: "rusty-server/src/approvals.rs", what: "POST /approvals/{run_id}/decide" },
    { path: "docs/server-quickstart.md", what: "Interrupt and resume over HTTP" },
  ],
  related: [{ label: "Book: Pause, resume, and the human timescale", href: "/guide/10-durability.html#pause-resume-and-the-human-timescale" }],
};
