import type { Lesson } from "./types";

export const reactAsAGraph: Lesson = {
  id: "2.6",
  slug: "react-as-a-graph",
  title: "The ReAct agent as a graph",
  minutes: 14,
  source: "rusty-core/src/react.rs",
  before: ["2.3", "2.5"],
  summary:
    "`create_react_agent` builds the classic reason-and-act loop out of two nodes, one conditional edge, and one static edge. Every lap of the loop is two super-steps, so it is checkpointed and bounded by `max_steps` like any other graph. At the pinned commit, the tools node also asks a person before it runs any tool whose effect is NonIdempotent, which is every tool that doesn't say otherwise.",
  glance: {
    learn: "How agent ⇄ tools maps onto super-steps, and the two things that can stop the loop",
    try: "The react_agent example, which pauses for approval, then the same run with ReadOnly tools",
    read: "build_react_agent, Tool::effect, and the ceiling check in Executor::run",
  },
  interactive: true,
  sections: [
    {
      id: "wiring",
      title: "Two nodes and three edges",
      toc: "The wiring",
      blocks: [
        {
          type: "p",
          text: "The public constructor takes a model and a tool registry and returns an ordinary compiled `Graph`:",
        },
        {
          type: "code",
          file: "rusty-core/src/react.rs",
          symbol: "create_react_agent",
          code: `pub fn create_react_agent(model: Arc<dyn ChatModel>, tools: ToolRegistry) -> Result<Graph> {
    build_react_agent(model, tools, None, EvidenceMode::None)
}`,
        },
        {
          type: "p",
          text: "The streaming, recording, and replaying variants call the same builder. At the end of `build_react_agent` is the whole topology:",
        },
        {
          type: "code",
          file: "rusty-core/src/react.rs",
          symbol: "build_react_agent",
          code: `let mut builder = GraphBuilder::new();
builder.add_node(AGENT_NODE, agent_node);
builder.add_node(TOOLS_NODE, tools_node);
builder.set_entry_point(AGENT_NODE);

// Route on the post-barrier state: the appended assistant message decides.
builder.add_conditional_edges(AGENT_NODE, |state| async move {
    let messages = read_messages(&state)?;
    let last = messages.last();
    let needs_tools = last.map(ChatMessage::has_tool_calls).unwrap_or(false);
    // ... plan_check: a plan-check notice sends the model around again
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
          text: "Both nodes read and append to one channel, `messages`, which you declare with `Reducer::AddMessages`. `agent` calls the model with the conversation and the tool schemas and appends the reply. `tools` takes the tool calls from the last assistant message, runs them concurrently through `ToolExecutor::execute_batch`, and appends one `role: \"tool\"` message per call, in call order.",
        },
        {
          type: "p",
          text: "The router runs after the barrier, so it sees the message `agent` just appended. That is the whole decision: tool calls present means go to `tools`, absent means stop. The one extra branch sends the model around again when the loop itself added a plan-check notice.",
        },
      ],
    },
    {
      id: "laps",
      title: "Each lap is two super-steps",
      toc: "Laps and the budget",
      blocks: [
        {
          type: "p",
          text: "The module docs for the executor say it directly: a cycle like `agent → tools → agent` is nodes being re-scheduled across super-steps, which is why the guard is `max_steps` and not a stack limit. Step through a run below. Change the tool effect and the budget and watch where it stops.",
        },
        { type: "diagram", name: "react-cycle" },
        {
          type: "p",
          text: "A normal question with one round of tools takes three steps: agent, tools, agent. A model that keeps asking for tools uses two steps per lap. The default budget is `DEFAULT_MAX_STEPS = 1000`.",
        },
      ],
    },
    {
      id: "example",
      title: "Running the example",
      blocks: [
        {
          type: "p",
          text: "`rusty-core/examples/react_agent.rs` wires two toy tools, `calculator` and `echo`, to a scripted model. The first scripted reply asks for both tools. The second is a final answer that quotes their results. The examples README describes it as the full agent ⇄ tools loop with a final answer.",
        },
        {
          type: "predict",
          question: "At the pinned commit, how does `cargo run --example react_agent` end?",
          options: [
            "Done, with the final answer in the transcript",
            "Interrupted at step 1, asking for approval before any tool runs",
            "An error: the scripted model runs out of replies",
            "Interrupted at the step ceiling",
          ],
          answer: 1,
          explain:
            "Neither toy tool overrides `Tool::effect`, so both are NonIdempotent. The approval gate rides every run, and the tools node asks it before calling anything. It finds no approval tokens and interrupts.",
        },
        {
          type: "lab",
          title: "The approval pause",
          intro:
            "Run the example from the repo root. Watch step 1: the tools node starts and never ends, and neither tool prints its line.",
          commands: "cargo run --example react_agent",
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
run interrupted with payload: {"kind":"approval","requests":[{"arguments":{"a":17,"b":25,"op":"add"},"call_id":"call_1","effect_id":"a11383ab67b3de737cfb6f9e27bf653a05fa79ba51ca5f85e7f73788dd96813b","kind":"calculator","tool":"calculator"},{"arguments":{"text":"Bonjour, ReAct!"},"call_id":"call_2","effect_id":"3f619ba8d82606d05020598aaaba38c13a4df4dadda2bbf68d7bf46363371b54","kind":"echo","tool":"echo"}]}`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "In a copy of the example, add `fn effect(&self) -> Effect { Effect::ReadOnly }` to both `impl Tool` blocks.",
            predict: "How many super-steps does the run take now, and how does it end?",
            result:
              "Three steps and `Done`. Step 1 prints `[tool:calculator] 17 add 25 = 42` and `[tool:echo] -> \"Bonjour, ReAct!\"`, step 2's model call sees 4 messages (user, the tool-call request, two tool results), and the transcript ends with the scripted final answer.",
          },
        },
        {
          type: "p",
          text: "The example uses `Executor::new()`, which has no checkpointer, so this particular run can't be resumed. With a checkpointer, the interrupt writes a suspension checkpoint like any other and the thread waits for a decision.",
        },
      ],
    },
    {
      id: "gate",
      title: "The approval gate",
      blocks: [
        {
          type: "p",
          text: "The gate starts from a conservative default on the `Tool` trait:",
        },
        {
          type: "code",
          file: "rusty-core/src/tool.rs",
          symbol: "Tool::effect",
          code: `/// The default is [\`crate::record::Effect::NonIdempotent\`] — the runtime
/// cannot prove a tool call is safely repeatable, so it assumes the
/// restrictive class. Override to \`ReadOnly\` for pure lookups or
/// \`Idempotent\` for keyed writes; never declare a weaker class than the
/// tool's real behavior.
fn effect(&self) -> crate::record::Effect {
    crate::record::Effect::NonIdempotent
}`,
        },
        {
          type: "p",
          text: "`Executor::run` attaches a gate to every run, whether or not effect admission is enabled:",
        },
        {
          type: "code",
          file: "rusty-core/src/executor.rs",
          symbol: "Executor::run",
          code: `// The approval gate rides every run regardless: an irreversible
// effect is asked about before it runs, admission enabled or not.
let approval_gate = Some(
    EffectAdmissionContext::new(config.thread_id.clone())
        .with_approvals(config.effect_approvals.clone()),
);`,
        },
        {
          type: "p",
          text: "Inside the tools node, the check happens before `execute_batch`. A call needs approval when its effect is `NonIdempotent` and the run holds no token for its effect id:",
        },
        {
          type: "code",
          file: "rusty-core/src/effects.rs",
          symbol: "EffectAdmissionContext::approval_required",
          code: `pub fn approval_required(&self, request: &EffectRequest) -> Option<EffectId> {
    if !matches!(request.effect(), Effect::NonIdempotent) || self.is_shadow() {
        return None;
    }
    let effect_id = request.effect_id(self.scope());
    let held = self
        .approvals
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .contains_key(&effect_id);
    (!held).then_some(effect_id)
}`,
        },
        {
          type: "code",
          file: "rusty-core/src/react.rs",
          symbol: "build_react_agent (tools node)",
          code: `let needed: Vec<_> = match ctx.approval_gate() {
    Some(gate) if !replaying => tool_executor
        .approvals_needed(gate, &last.tool_calls)
        .into_iter()
        .filter(|n| !denied.contains_key(&n.call_id))
        .collect(),
    _ => Vec::new(),
};
if !needed.is_empty() {
    return Err(ctx.interrupt(json!({
        "kind": APPROVAL_INTERRUPT_KIND,
        "requests": needed,
    })));
}`,
        },
        {
          type: "p",
          text: "The [[Interrupt|interrupt]] payload lists each call with its `effect_id`. The id is derived from the scope (here the thread id), the call's kind, a hash of its input, and its idempotency key, so a token approves that exact call on that thread.",
        },
        {
          type: "rows",
          rows: [
            {
              label: "Approve",
              tone: "green",
              text: "Resume the thread with `RunConfig::with_effect_approvals`, carrying an `ApprovalToken::approve(effect_id, approved_by)` per request. The tools node runs again from its start, the gate finds the tokens, and the calls execute.",
            },
            {
              label: "Deny",
              tone: "red",
              text: "Resume with `{\"kind\": \"approval\", \"decision\": \"deny\", \"by\": …, \"reason\": …, \"call_ids\": […]}`. Those calls don't run. The model gets a tool result that starts with `DENIED: a person declined this action` and tells it not to retry.",
            },
            {
              label: "Exact replay",
              tone: "plain",
              text: "Never pauses. A replayed run already asked and was answered, and it serves recorded results.",
            },
          ],
        },
        {
          type: "p",
          text: "The order matters for correctness. The gate interrupts before any call runs, so when the tools node starts over on resume, nothing has happened yet that could happen twice. [3.4](/learn/idempotent-nodes) is about the nodes where that isn't true.",
        },
      ],
    },
    {
      id: "ceiling",
      title: "The step ceiling",
      blocks: [
        {
          type: "p",
          text: "At the top of every iteration, before planning a step, `Executor::run` compares the steps it has run with the budget:",
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
        "note": "the run stopped at its step ceiling with the work it had done; \\
                 resume the thread to carry on, raising RunConfig::max_steps when \\
                 the task genuinely needs more steps",
    }))
} else {
    // the spend ceiling is checked here too
};`,
        },
        {
          type: "p",
          text: "Hitting it suspends the run. The state reached so far is kept, a checkpoint is written when a checkpointer is attached, and the outcome is `Interrupted` with the payload under `rusty.halted`.",
        },
        {
          type: "lab",
          title: "Run out of budget mid-loop",
          intro:
            "Take the ReadOnly copy from the exercise above and set `.with_max_steps(2)`. The loop needs three steps, so it stops after the tools have run and before the model sees their results.",
          commands: "cargo run -q",
          output: `[step 0] active: agent
  ├─ agent start (step 0)
    [mock-llm] chat() called: 1 message(s) in context, 2 tool schema(s) offered
      ctx[0] User: What is 17 + 25? Also, echo 'Bonjour, ReAct!' back to me.
  ├─ agent end   (step 0)
  ├─ barrier merge (step 0): channels [messages]
[step 1] active: tools
  ├─ tools start (step 1)
    [tool:calculator] 17 add 25 = 42
    [tool:echo] -> "Bonjour, ReAct!"
  ├─ tools end   (step 1)
  ├─ barrier merge (step 1): channels [messages]
run interrupted with payload: {"rusty.halted":{"limit":2,"note":"the run stopped at its step ceiling with the work it had done; resume the thread to carry on, raising RunConfig::max_steps when the task genuinely needs more steps","reason":"step_ceiling","steps_run":2}}`,
          capturedAt: "fedbb3a · 2026-09-29",
        },
        {
          type: "p",
          text: "The agent node has a second, narrower guard of its own. `STUCK_TURN_LIMIT` is 3: the second identical tool call in a turn (same tool, same arguments) is refused with a notice in place of the result, and the third fails the run with a \"no progress\" error. The step budget catches loops that make different calls each lap. The stuck-turn limit catches the model asking the same question over and over.",
        },
      ],
    },
  ],
  deeper: [
    { book: "02-mental-model.html#one-run-end-to-end", label: "One run, end to end" },
    { book: "09-tools-connectors.html#rusty-the-tool-system", label: "The tool system" },
    { book: "12-policy-security.html#layer-five-where-a-human-must-say-yes", label: "Where a human must say yes" },
  ],
  sources: [
    { path: "rusty-core/src/react.rs", what: "create_react_agent, build_react_agent, STUCK_TURN_LIMIT, denied_calls" },
    { path: "rusty-core/src/tool.rs", what: "Tool::effect, ToolExecutor::approvals_needed, execute_batch" },
    { path: "rusty-core/src/effects.rs", what: "approval_required, ApprovalToken" },
    { path: "rusty-core/src/executor.rs", what: "the approval gate and the step ceiling in Executor::run" },
    { path: "rusty-core/examples/react_agent.rs", what: "the scripted example run above" },
  ],
  related: [{ label: "5.3 Deterministic replay of this agent", href: "/learn/deterministic-replay" }],
};
