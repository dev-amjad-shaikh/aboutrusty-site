import type { Lesson } from "./types";

export const agentAtRuntime: Lesson = {
  id: "1.1",
  slug: "agent-at-runtime",
  title: "What an agent does at runtime",
  minutes: 8,
  source: "rusty-core/examples/react_agent.rs",
  summary:
    "An agent is a loop: call a model, run the tools it asks for, call the model again. Run Rusty's ReAct example and you can watch each part of that loop happen, including the part demos skip: the run stopping to wait for a person.",
  glance: {
    learn: "The five things a running agent spends its time on",
    try: "Running react_agent and making it finish without an approval",
    read: "The ChatModel trait and the example's real output",
  },
  sections: [
    {
      id: "loop",
      title: "The loop",
      blocks: [
        {
          type: "p",
          text: "Strip an agent down and you get a loop. Send the conversation to a model. If the reply asks for tools, run them, append their results to the conversation, and send it again. Stop when the model answers without asking for anything.",
        },
        {
          type: "p",
          text: "In Rusty the model side of that loop is one trait. Anything that can turn a conversation and a list of tool schemas into the next assistant message is a model:",
        },
        {
          type: "code",
          file: "rusty-core/src/llm.rs",
          symbol: "ChatModel",
          code: `#[async_trait]
pub trait ChatModel: Send + Sync {
    /// Produce the next assistant message for the conversation.
    async fn chat(&self, messages: &[ChatMessage], tools: &[Value]) -> Result<ChatResponse>;
    // ...
}`,
        },
        {
          type: "p",
          text: "`rusty-core/examples/react_agent.rs` plugs a scripted model into this trait, so it runs with no network and no API key. The script has two replies. The first asks for two tool calls, `calculator` and `echo`. The second is the final answer. Both tools are ordinary Rust structs that implement `Tool` and declare nothing else.",
        },
        {
          type: "predict",
          question:
            "The model's first reply asks for `calculator` and `echo`. Neither tool declares anything about its side effects. What does the run do next?",
          options: [
            "Runs both tools in parallel, calls the model again, and prints the final answer",
            "Runs the tools one after the other, then calls the model again",
            "Stops before running either tool and returns a request for approval",
            "Fails, because the tools are missing a required method",
          ],
          answer: 2,
          explain:
            "A tool that declares no effect is treated as `NonIdempotent`: the runtime can't prove a repeat is safe, so it assumes the worst. The executor attaches an approval gate to every run, and an irreversible call is asked about before it runs. So the run suspends inside the `tools` node before either tool executes.",
        },
      ],
    },
    {
      id: "lab",
      title: "Run it",
      blocks: [
        {
          type: "lab",
          title: "The prebuilt ReAct agent",
          intro:
            "Run the example and follow the step lines. Watch where the model is called, where the tools node starts, and what the run returns.",
          commands: `git clone https://github.com/dev-amjad-shaikh/rusty
cd rusty && git checkout fedbb3a
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
run interrupted with payload: {"kind":"approval","requests":[{"arguments":{"a":17,"b":25,"op":"add"},"call_id":"call_1","effect_id":"a11383ab67b3de737cfb6f9e27bf653a05fa79ba51ca5f85e7f73788dd96813b","kind":"calculator","tool":"calculator"},{"arguments":{"text":"Bonjour, ReAct!"},"call_id":"call_2","effect_id":"3f619ba8d82606d05020598aaaba38c13a4df4dadda2bbf68d7bf46363371b54","kind":"echo","tool":"echo"}]}`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "In `rusty-core/examples/react_agent.rs`, add `fn effect(&self) -> Effect { Effect::ReadOnly }` to both `impl Tool` blocks (`Effect` is in the prelude). Run the example again.",
            predict: "Does the run still stop? If it finishes, how many times is the model called?",
            result:
              "The run finishes. Declared `ReadOnly`, the calls pass the approval gate, so step 1 prints `[tool:calculator] 17 add 25 = 42` and `[tool:echo] -> \"Bonjour, ReAct!\"`. Step 2 calls the model a second time with 4 messages in context, and the transcript ends with the scripted answer. Two model calls, three steps, outcome `Done`.",
          },
        },
      ],
    },
    {
      id: "what-happened",
      title: "What the run spent its time on",
      toc: "What happened",
      blocks: [
        {
          type: "p",
          text: "Five kinds of activity show up in that output. A real agent has the same five; only the durations change.",
        },
        {
          type: "rows",
          rows: [
            {
              label: "Model calls",
              text: "The `agent` node calls `ChatModel::chat` with the whole conversation. With a hosted model this is the slow, billed part of each turn, and it is `NonIdempotent` by default: calling it twice costs twice and can answer differently.",
            },
            {
              label: "Tool calls",
              text: "The `tools` node runs every call from the last assistant message as one batch. `ToolExecutor::execute_batch` runs them concurrently and returns results in the order the model asked for them.",
            },
            {
              label: "The loop",
              text: "`tools → agent` is an edge, and each hop is a new numbered step. Step 0 was the model, step 1 the tools, step 2 the model again. Nothing bounds how many times the model asks for tools, so the executor counts steps against `max_steps` (default 1000).",
            },
            {
              label: "Waiting on a person",
              tone: "amber",
              text: "The approval payload lists each call with its arguments and an `effect_id`. The run is suspended at that point. Some person or system has to answer before it can continue.",
            },
            {
              label: "Long durations",
              text: "That answer might come in a minute or next week. A process can't keep a suspended run in memory that long, through deploys and restarts, so the run's state has to live somewhere durable.",
            },
          ],
        },
        {
          type: "p",
          text: "With the tools declared `ReadOnly` (the exercise above), the run gets past the gate and you can see the loop close. The model's second call receives everything the loop appended:",
        },
        {
          type: "code",
          lang: "text",
          code: `[step 2] active: agent
  ├─ agent start (step 2)
    [mock-llm] chat() called: 4 message(s) in context, 2 tool schema(s) offered
      ctx[0] User: What is 17 + 25? Also, echo 'Bonjour, ReAct!' back to me.
      ctx[1] Assistant: tool_calls x2
      ctx[2] Tool: 42.0
      ctx[3] Tool: Bonjour, ReAct!`,
        },
        {
          type: "p",
          text: "One line is missing from the output: no `checkpoint` line appears after any step. The example builds a plain `Executor::new()` with no checkpointer, so the suspended run exists only in this process. When it exits, the run is gone. Add a checkpointer and the executor saves the state at every step boundary, which is what lets a run wait out a restart. [1.2 How agents fail](/learn/how-agents-fail) covers what goes wrong without that, and [3.2 Interrupts](/learn/interrupts) covers resuming a suspended run.",
        },
      ],
    },
  ],
  deeper: [{ book: "01-the-problem.html", label: "The problem: why agents need a runtime" }],
  sources: [
    { path: "rusty-core/examples/react_agent.rs", what: "The scripted ReAct demo used in the lab" },
    { path: "rusty-core/src/llm.rs", what: "ChatModel, and its NonIdempotent default effect" },
    { path: "rusty-core/src/tool.rs", what: "Tool::effect default, ToolExecutor::execute_batch, approvals_needed" },
    { path: "rusty-core/src/react.rs", what: "create_react_agent: the agent and tools nodes, the approval interrupt" },
    { path: "rusty-core/src/executor.rs", what: "The approval gate attached to every run" },
  ],
};
