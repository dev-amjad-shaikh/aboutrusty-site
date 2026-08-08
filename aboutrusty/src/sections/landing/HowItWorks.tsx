import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { SectionHeading } from "./SectionHeading";

const RUST_EXAMPLE = `use rusty_agent_runtime::prelude::*;
use serde_json::json;
use std::sync::Arc;
struct Echo; // scripted ChatModel: one canned reply (see examples/react_agent.rs for tools)
#[async_trait::async_trait]
impl ChatModel for Echo {
    async fn chat(&self, _: &[ChatMessage], _: &[serde_json::Value]) -> Result<ChatResponse> {
        Ok(ChatResponse { message: ChatMessage::assistant("42"), model: None, usage: None })
    }
}
#[tokio::main]
async fn main() -> Result<()> {
    let graph = create_react_agent(Arc::new(Echo), ToolRegistry::new())?;
    let spec = StateSpec::new().channel("messages", Reducer::AddMessages);
    let mut input = State::new();
    input.insert("messages", json!([ChatMessage::user("What is 17 + 25?")]));
    let outcome = Executor::new().run(&graph, &spec, input, RunConfig::new("demo")).await?;
    assert!(matches!(outcome, ExecutionOutcome::Done(_)));
    Ok(())
}`;

const SERVER_SNIPPET = `git clone https://github.com/dev-amjad-shaikh/rusty.git && cd rusty
./scripts/dev.sh        # local: Rusty Server on :8100 + Rusty Studio on :8000
# or
docker compose up       # the same pair, containerized`;

const PYTHON_SNIPPET = `from rusty_client import RustyClient

client = RustyClient("http://127.0.0.1:8100")   # api_key="..." when auth is on

client.ok()      # True
client.info()    # {"service": "rusty-server", "graphs": [...], ...}

thread = client.create_thread("pipeline")
tid = thread["thread_id"]

# Blocking run
result = client.run_wait(tid)

# Streaming run (SSE) — frames arrive as the graph executes
for frame in client.run_stream(tid, stream_mode=["updates", "values"]):
    print(frame.event, frame.id, frame.data)`;

interface MapNode {
  glyph: string;
  title: string;
  meta: string;
}

const GRAPH_NODES: MapNode[] = [
  { glyph: "01", title: "Nodes", meta: "async work" },
  { glyph: "02", title: "Edges", meta: "routing" },
  { glyph: "03", title: "Channels", meta: "typed reducers" },
];

const TARGET_NODES: MapNode[] = [
  { glyph: "↯", title: "Embedded", meta: "one process" },
  { glyph: "↗", title: "RemoteNode", meta: "HTTP worker" },
  { glyph: "▦", title: "WasmNode", meta: "sandboxed" },
];

const CHASSIS_ROWS: { step: string; meta: string }[] = [
  { step: "plan", meta: "ready nodes" },
  { step: "parallel + barrier", meta: "immutable state" },
  { step: "merge + route", meta: "declared reducers" },
  { step: "checkpoint", meta: "when configured" },
];

const MAP_LABEL =
  "pl-1 font-code text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground";

function MapNodeCard({ node }: { node: MapNode }) {
  return (
    <div className="grid min-h-[72px] grid-cols-[28px_1fr] content-center gap-x-2.5 border bg-background/70 px-3.5">
      <span
        aria-hidden="true"
        className="row-span-2 grid h-7 w-7 place-items-center border font-code text-[10px] text-muted-foreground"
      >
        {node.glyph}
      </span>
      <strong className="self-end text-xs font-semibold">{node.title}</strong>
      <small className="font-code text-[10px] text-muted-foreground">
        {node.meta}
      </small>
    </div>
  );
}

function MapConnector({ tone }: { tone: "in" | "out" }) {
  const line =
    tone === "in"
      ? "bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      : "bg-gradient-to-r from-transparent via-success/50 to-transparent";
  const dot = tone === "in" ? "bg-primary" : "bg-success";
  return (
    <div
      aria-hidden="true"
      className="hidden lg:grid lg:grid-rows-[repeat(3,72px)] lg:gap-2.5 lg:pt-[26px]"
    >
      {CHASSIS_ROWS.slice(0, 3).map((row) => (
        <span key={row.step} className="relative self-center">
          <span className={`block h-px w-full ${line}`} />
          <i className={`absolute -left-0.5 -top-[2px] h-[5px] w-[5px] rounded-full ${dot}`} />
          <i className={`absolute -right-0.5 -top-[2px] h-[5px] w-[5px] rounded-full ${dot}`} />
        </span>
      ))}
    </div>
  );
}

interface Step {
  number: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Define the graph",
    body: "GraphBuilder wires nodes over state channels with per-key reducers. Topology is validated at compile() — before any node or paid LLM call runs.",
  },
  {
    number: "02",
    title: "Execute in super-steps",
    body: "A Pregel/BSP loop: plan → parallel over an immutable snapshot → barrier → merge via reducers → route. Each step is transactional and guarded by max_steps.",
  },
  {
    number: "03",
    title: "Checkpoint everything",
    body: "One primitive behind resume after a crash, human-in-the-loop interrupts, and fork & replay time travel — written at every step boundary, never mid-node.",
  },
];

type TabId = "embedded" | "server" | "python";

interface Tab {
  id: TabId;
  label: string;
  code: string;
  language: string;
  title: string;
}

const TABS: Tab[] = [
  {
    id: "embedded",
    label: "Embedded (Rust)",
    code: RUST_EXAMPLE,
    language: "rust",
    title: "rusty-core/examples/react_agent.rs — condensed",
  },
  {
    id: "server",
    label: "Server (HTTP/SSE)",
    code: SERVER_SNIPPET,
    language: "bash",
    title: "README — try it in one command",
  },
  {
    id: "python",
    label: "Python SDK",
    code: PYTHON_SNIPPET,
    language: "python",
    title: "rusty_client — sdks/python quickstart",
  },
];

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<TabId>("embedded");
  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <section className="border-y bg-card">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHeading
          eyebrow="How it works"
          title="Plan, parallel, barrier, merge, route."
          description="A ReAct agent over a scripted model — no network, deterministic output. The same compiled graph runs embedded, behind the HTTP/SSE server, or across remote and WASM nodes."
        />

        {/* system map: graph definition → rusty core → execution targets */}
        <div
          aria-label="Rusty system architecture"
          className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_36px_minmax(0,1.3fr)_36px_minmax(0,0.8fr)] lg:gap-0"
        >
          <div className="grid content-start gap-2.5">
            <div className={MAP_LABEL}>GRAPH DEFINITION</div>
            {GRAPH_NODES.map((node) => (
              <MapNodeCard key={node.title} node={node} />
            ))}
          </div>

          <MapConnector tone="in" />

          <div className="grid content-start gap-2.5">
            <div className={MAP_LABEL}>RUSTY CORE</div>
            <div className="rounded-xl border border-primary/30 bg-gradient-to-b from-accent/40 to-background p-4 shadow-[inset_0_0_50px_rgba(255,107,53,0.03),0_30px_70px_rgba(0,0,0,0.3)]">
              <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b px-2.5 pb-3.5">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-lg bg-primary font-display text-lg font-extrabold text-primary-foreground"
                >
                  R
                </span>
                <div>
                  <strong className="block text-sm font-semibold">
                    Super-step executor
                  </strong>
                  <small className="mt-1 block font-code text-[10px] text-muted-foreground">
                    transactional · tokio · durable
                  </small>
                </div>
                <i className="font-code text-[9px] font-medium uppercase tracking-[0.14em] not-italic text-success">
                  RUNNING
                </i>
              </div>
              {CHASSIS_ROWS.map((row) => (
                <div
                  key={row.step}
                  className="flex min-h-[44px] items-center justify-between border-b px-2.5 font-code text-[11px] text-foreground/80"
                >
                  <span>{row.step}</span>
                  <code className="text-muted-foreground">{row.meta}</code>
                </div>
              ))}
              <div
                aria-hidden="true"
                className="flex justify-end gap-1.5 px-2.5 pt-3.5"
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <i
                    key={i}
                    className={
                      i === 6
                        ? "h-1 w-1 rounded-full bg-success"
                        : (i + 1) % 3 === 0
                          ? "h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(255,107,53,0.7)]"
                          : "h-1 w-1 rounded-full bg-secondary"
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <MapConnector tone="out" />

          <div className="grid content-start gap-2.5">
            <div className={MAP_LABEL}>EXECUTION TARGETS</div>
            {TARGET_NODES.map((node) => (
              <MapNodeCard key={node.title} node={node} />
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-accent-foreground">
                {step.number}
              </span>
              <h3 className="font-display text-xl font-bold">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <div
            role="tablist"
            aria-label="Usage paths"
            className="mb-5 flex justify-center"
          >
            <div className="inline-flex flex-wrap justify-center gap-1 rounded-lg border bg-background/70 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3.5 py-2 font-code text-[10px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <CodeBlock
            code={current.code}
            language={current.language}
            title={current.title}
          />
          {current.id === "embedded" && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Swap <code className="font-code">Echo</code> for{" "}
              <code className="font-code">OpenAiCompatibleClient</code> to talk
              to OpenAI, vLLM, Ollama, LM Studio, or a compatible gateway.
            </p>
          )}
          {current.id === "server" && (
            <p className="mt-3 text-center">
              <Link
                to="/learn/server-quickstart"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Serve your first graph over HTTP/SSE
                <ArrowRight size={14} />
              </Link>
            </p>
          )}
          {current.id === "python" && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Zero-dependency, stdlib-only — install{" "}
              <code className="font-code">rusty-agent-runtime</code> or copy{" "}
              <code className="font-code">sdks/python/rusty_client</code> into
              your project.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
