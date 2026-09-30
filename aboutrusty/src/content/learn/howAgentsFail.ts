import type { Lesson } from "./types";

export const howAgentsFail: Lesson = {
  id: "1.2",
  slug: "how-agents-fail",
  title: "How agents fail",
  minutes: 9,
  source: "rusty-core/src/executor.rs",
  before: ["1.1"],
  summary:
    "The loop from 1.1 works in a demo and breaks in five predictable ways once it runs for real. Each failure below comes with the mechanism Rusty uses against it and the lesson that covers that mechanism.",
  glance: {
    learn: "Five failure modes of a hand-written agent loop",
    try: "Killing, clobbering, and looping a run, with and without checkpoints",
    read: "The step ceiling in executor.rs",
  },
  interactive: true,
  sections: [
    {
      id: "restart",
      title: "Lost progress on restart",
      toc: "Lost progress",
      blocks: [
        {
          type: "p",
          text: "A hand-written loop keeps the conversation in a variable. When the process dies, from a deploy, an out-of-memory kill, or a node being rescheduled, the variable goes with it. The next attempt starts from the user's message and pays for every model call again.",
        },
        {
          type: "p",
          text: "Rusty saves a [[Checkpoint]] at every step boundary when a [[Checkpointer]] is attached: the step number, the full state, and the set of nodes to run next. A restart loads the latest one.",
        },
        {
          type: "predict",
          question:
            "A checkpointed run is killed while step 3, a `tools` step, is running. The process restarts and resumes the thread. What runs first?",
          options: [
            "Step 0, because the run was never finished",
            "The `tools` node of step 3, from its start",
            "The rest of the `tools` node, from where it was killed",
            "Nothing; a person has to repair the thread first",
          ],
          answer: 1,
          explain:
            "The last checkpoint was written after step 2, and its next-node set is `tools`. Checkpoints are never taken in the middle of a node, so the node runs again from its first line. Any side effect it had already performed before the kill will be performed again unless the node guards against that.",
        },
        { type: "diagram", name: "failure-compare" },
      ],
    },
    {
      id: "clobber",
      title: "Parallel writes that clobber each other",
      toc: "Clobbered state",
      blocks: [
        {
          type: "p",
          text: "Once two branches run at the same time, for example two research calls, they both want to write their result somewhere. If they write to a shared dictionary, the value depends on which finished last. The bug is silent and it changes from run to run.",
        },
        {
          type: "p",
          text: "In Rusty, nodes never write shared state while they run. They return updates, and every key is a [[State channel]] with a [[Reducer]] that says how updates merge. The default, `Overwrite`, refuses a second write in the same step and fails with `RustyError::InvalidUpdate` naming both nodes. `Append`, `DeepMerge`, and `AddMessages` accept several writes and merge them in node-name order. Pick the clobber case in the diagram above to compare. [2.2 State channels and reducers](/learn/state-channels) goes through each reducer.",
        },
      ],
    },
    {
      id: "runaway",
      title: "Runaway loops",
      blocks: [
        {
          type: "p",
          text: "The model decides when the loop ends. A confused model can keep asking for the same tool forever, and each trip costs a model call. In Rusty every trip around `agent → tools` is a new [[Super-step]], so the executor counts steps against `RunConfig::max_steps`. The check runs at the top of every step:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "Executor::run",
          code: `let ceiling = if steps_run >= config.max_steps {
    Some(serde_json::json!({
        "reason": "step_ceiling",
        "limit": config.max_steps,
        "steps_run": steps_run,
        // ...
    }))
} else {
    // ... the spend ceiling is checked the same way
};`,
        },
        {
          type: "p",
          text: "Hitting the ceiling suspends the run with its state and a checkpoint, under the interrupt key `rusty.halted`. It doesn't throw the work away. You resume the thread, with a higher `max_steps` if the task really needs more. A spend budget works the same way with the reason `budget_ceiling`.",
        },
      ],
    },
    {
      id: "duplicates",
      title: "Duplicate side effects",
      toc: "Duplicates",
      blocks: [
        {
          type: "p",
          text: "Resuming from a checkpoint fixes lost progress and creates a new risk. The node that was running when the process died runs again. If it had already sent an email or charged a card, a plain retry does it twice.",
        },
        {
          type: "p",
          text: "A checkpoint alone can't prevent this. Rusty adds three things. Every tool declares an [[Effect]], and the default is `NonIdempotent`, which is why the tools in 1.1 stopped for approval. With effect admission turned on, a tool that declares `Idempotent` must supply an idempotency key, or admission refuses the call with `MissingIdempotencyKey`. Tasks on the server's durable queue carry an idempotency key too, and `rusty-server/tests/crash_recovery.rs` kills a worker and then the server mid-effect and asserts the provider ledger holds exactly one invocation. [4.2 Leases, heartbeats, and retries](/learn/leases-and-retries) and [4.4 the crash_recovery test](/learn/crash-recovery) cover this.",
        },
      ],
    },
    {
      id: "unexplainable",
      title: "Behavior nobody can explain",
      toc: "Unexplainable",
      blocks: [
        {
          type: "p",
          text: "Someone asks why the agent emailed the wrong customer. Application logs show fragments: a prompt here, a tool result there, maybe from a different run. Re-running the agent doesn't help, because the model answers differently the second time.",
        },
        {
          type: "p",
          text: "Rusty's executor keeps a [[Run journal]] for every run: super-step boundaries, node inputs and outputs, interrupts, routing decisions, and checkpoint writes, plus model and tool calls when those are handed the journal. Every event carries its causal parent, and a SHA-256 head hash chains them so tampering shows. [[Replay]] re-runs a recorded run with model and tool results served from that journal, so it makes no outbound calls and takes the same path. [5.1 The run journal](/learn/run-journal) and [5.3 Deterministic replay](/learn/deterministic-replay) cover both.",
        },
      ],
    },
  ],
  deeper: [{ book: "01-the-problem.html#the-five-questions", label: "The five questions every agent runtime answers" }],
  sources: [
    { path: "rusty-core/src/executor.rs", what: "Step ceiling, checkpoint at each boundary, DEFAULT_MAX_STEPS" },
    { path: "rusty-core/src/state.rs", what: "StateSpec::apply_super_step and the single-write rule" },
    { path: "rusty-core/src/tool.rs", what: "Tool::effect default and idempotency_key" },
    { path: "rusty-server/tests/crash_recovery.rs", what: "SIGKILL mid-effect, exactly one provider invocation" },
  ],
};
