import type { Lesson } from "./types";

export const interrupts: Lesson = {
  id: "3.2",
  slug: "interrupts",
  title: "Interrupts",
  minutes: 12,
  source: "rusty-core/src/node.rs",
  before: ["2.3", "3.1"],
  summary:
    "An interrupt pauses a run so a person can decide something, then continues it with their answer. The pause can last seconds or weeks and can outlive the process, because nothing is running while the person thinks: the run is stopped at a saved checkpoint.",
  glance: {
    learn: "How a run parks and resumes around a checkpoint",
    try: "Stepping through park and resume, call by call",
    read: "The approve node from human_in_loop.rs",
  },
  interactive: true,
  sections: [
    {
      id: "asking",
      title: "How a node asks",
      toc: "Asking",
      blocks: [
        {
          type: "p",
          text: "Some steps need a person: approving a payment, publishing a draft, confirming a destructive command. A node pauses the run for that by returning the error built by `ctx.interrupt(payload)`, an [[Interrupt|interrupt]]. The payload is any JSON you want the person to see. On resume, the same node runs again and `ctx.resume_value()` returns their answer. So the node checks for an answer first and only asks when there isn't one:",
        },
        {
          type: "code",
          file: "rusty-core/examples/human_in_loop.rs",
          symbol: "approve node",
          code: `builder.add_node("approve", |ctx: NodeContext| async move {
    match ctx.resume_value() {
        Some(decision) => {
            println!("[approve] resumed with human decision: {decision}");
            Ok(NodeOutput::update("approval", decision.clone()))
        }
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
          text: "The graph in that example is `draft → approve → publish`, with a `JsonFileCheckpointer`. The program calls `Executor::run` twice on the same thread: once without an answer, once with one.",
        },
        {
          type: "predict",
          question: "In the second call, which nodes print a line before `publish`?",
          options: ["`draft` and `approve`", "Only `approve`", "None: the run continues after the interrupt call"],
          answer: 1,
          explain:
            "The run resumes from the checkpoint saved at the suspension, whose next node is `approve`. `draft` already ran in an earlier step and is not repeated. `approve` runs again from its first line, so the `match` sees `Some(decision)` this time.",
        },
        {
          type: "lab",
          title: "Suspend, then resume",
          intro: "Run the approval example and follow the two phases, then check your prediction against the first line of phase 2.",
          commands: `cd rusty-core
cargo run --example human_in_loop`,
          output: `=== human_in_loop: interrupt/resume with JsonFileCheckpointer ===

checkpoint dir: …/rusty-core/target/examples-checkpoints/human-in-loop

--- PHASE 1: initial run (expect interrupt) ---
[draft] wrote draft: "Rusty makes cyclic, resumable agent graphs safe in Rust."
[approve] no decision available — interrupting for human review
[phase 1] run suspended at \`approve\`
[phase 1] review payload surfaced to the human: {"draft":"Rusty makes cyclic, resumable agent graphs safe in Rust.","kind":"approval_request","prompt":"Approve this draft for publication?"}
[phase 1] durable checkpoint id: c89a1a75-95d6-4f9c-96cb-93ab157d3ab4

--- PHASE 2: resume with human approval ---
[approve] resumed with human decision: {"approved":true,"comment":"ship it","reviewer":"alice"}
[publish] "published"
[phase 2] run completed after resume
published channel: {
  "approved": true,
  "draft": "Rusty makes cyclic, resumable agent graphs safe in Rust.",
  "status": "published"
}`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "In phase 2, resume under a different thread: `RunConfig::new(\"another-thread\").with_resume(human_decision.clone())`.",
            predict: "Does phase 2 start a fresh run from `draft`, or something else?",
            result:
              "Neither. Phase 1 behaves as before, then phase 2 fails at once with `Error: Checkpoint(...)`: cannot resume thread `another-thread`: no checkpoint found. A resume value means \"continue this thread\", and the thread id is the handle to the saved run.",
          },
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
          type: "predict",
          question: "Nodes A and B run in the same step. A finishes and returns its writes, then B interrupts. On resume, which nodes run?",
          options: ["Only B", "A and B", "Neither: the run continues at the next step"],
          answer: 1,
          explain: "An interrupt discards the step like a failure does, including A's writes, so the suspension checkpoint schedules the whole active set.",
        },
        {
          type: "p",
          text: "At the barrier, an interrupt is handled like a failure: the step is discarded. That includes writes from sibling nodes that finished before the interrupt arrived. Siblings still running are aborted when the JoinSet is dropped. So the suspension checkpoint schedules every node of the step, including the siblings of the node that asked:",
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
          text: "Two consequences follow. First, the resume value is broadcast: every node in the first step after a resume sees `resume_value()` return `Some`, including nodes that never asked. A node that should react only to its own question has to check its own state. Second, everything a node does before calling `interrupt` happens again on resume, so that part must be safe to repeat.",
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
          text: "You can see it in the in-process ReAct example. Its scripted model asks for two tools at once, and neither tool declares an effect, so both default to `NonIdempotent`.",
        },
        {
          type: "lab",
          title: "An approval interrupt",
          intro: "Run the prebuilt ReAct agent with its scripted model. Watch where the run stops.",
          commands: `cd rusty-core
cargo run --example react_agent`,
          output: `=== Rusty Core: prebuilt ReAct agent demo ===

graph compiled: 2 nodes, entry point \`agent\`

user: What is 17 + 25? Also, echo 'Bonjour, ReAct!' back to me.

[step 0] active: agent
  ├─ agent start (step 0)
    [mock-llm] chat() called: 1 message(s) in context, 2 tool schema(s) offered
      ctx[0] User: What is 17 + 25? Also, echo 'Bonjour, ReAct!' back to me.
  ├─ agent end   (step 0)
  ├─ barrier merge (step 0): channels [messages]
[step 1] active: tools
  ├─ tools start (step 1)
run interrupted with payload: {"kind":"approval","requests":[{"arguments":{"a":17,"b":25,"op":"add"},"call_id":"call_1","effect_id":"a11383ab…","kind":"calculator","tool":"calculator"},{"arguments":{"text":"Bonjour, ReAct!"},"call_id":"call_2","effect_id":"3f619ba8…","kind":"echo","tool":"echo"}]}`,
          capturedAt: "fedbb3a · 2026-09-29",
        },
        {
          type: "p",
          text: "The `tools` node never calls either tool. One interrupt carries both requests, each with an `effect_id` that an approval is scoped to. On the server, a person answers with `POST /approvals/{run_id}/decide` and `{\"decision\": \"approve\"}` or `\"deny\"`. Approving mints one token scoped to that request's effect id and resumes the run with it. Denying resumes the run with the refusal, which the model reads as a tool result. `GET /approvals` lists what is waiting.",
        },
      ],
    },
    {
      id: "trade-offs",
      title: "Costs",
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
  sources: [
    { path: "rusty-core/src/node.rs", what: "NodeContext::interrupt, resume_value" },
    { path: "rusty-core/src/executor.rs", what: "suspension checkpoint, ExecutionOutcome::Interrupted" },
    { path: "rusty-core/examples/human_in_loop.rs", what: "draft → approve → publish" },
    { path: "rusty-server/src/approvals.rs", what: "POST /approvals/{run_id}/decide" },
    { path: "docs/server-quickstart.md", what: "Interrupt and resume over HTTP" },
  ],
  deeper: [{ book: "10-durability.html#pause-resume-and-the-human-timescale", label: "Durability: pause, resume, and the human timescale" }],
};
