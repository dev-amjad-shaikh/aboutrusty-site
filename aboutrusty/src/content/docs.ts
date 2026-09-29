/**
 * Docs content: task-focused pages, one per sidebar entry (Docs.dc.html,
 * site-copy §6). Every command, route, type, and env var here was checked
 * against rusty-src; text in `backticks` renders as inline code.
 *
 * `learn` holds Learn chapter ids (the 11-part numbering); `source` holds
 * repo paths linked on GitHub.
 */

export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "meta"; text: string }
  | { type: "code"; lang: string; text: string }
  | { type: "list"; numbered?: boolean; items: { b: string; t: string }[] }
  | { type: "table"; head: string[]; rows: string[][]; cols: string }
  | { type: "links"; text: string; items: { page: string; label: string }[] }
  | { type: "diagram"; id: string };

export interface DocPage {
  title: string;
  learn?: string[];
  source?: string[];
  blocks: DocBlock[];
}

export const REPO = "https://github.com/dev-amjad-shaikh/rusty";

export const DOC_GROUPS: { name: string; items: { id: string; label: string }[] }[] = [
  {
    name: "Get started",
    items: [
      { id: "intro", label: "Introduction" },
      { id: "install", label: "Install" },
      { id: "local", label: "Run locally with Studio" },
      { id: "quickstart", label: "Quickstart: serve a graph" },
    ],
  },
  {
    name: "Configure",
    items: [
      { id: "model", label: "Connect a model" },
      { id: "storage", label: "Checkpoint storage" },
      { id: "auth", label: "Authentication and API keys" },
      { id: "env", label: "Environment variables" },
    ],
  },
  {
    name: "Build",
    items: [
      { id: "agent", label: "Build an agent in Studio" },
      { id: "graph", label: "Build a graph in Rust" },
      { id: "approval", label: "Human approval" },
      { id: "tool", label: "Add a tool" },
      { id: "connector", label: "Add a connector" },
      { id: "skill", label: "Write a skill" },
      { id: "py", label: "Python client" },
      { id: "ts", label: "TypeScript client" },
    ],
  },
  {
    name: "Test",
    items: [
      { id: "inspect", label: "Inspect a run" },
      { id: "replay", label: "Replay a run" },
      { id: "fork", label: "Fork and compare runs" },
      { id: "eval", label: "Evaluate with datasets" },
      { id: "standin", label: "Test against a stand-in" },
    ],
  },
  {
    name: "Deploy",
    items: [
      { id: "release", label: "Build a release binary" },
      { id: "docker", label: "Docker" },
      { id: "postgres", label: "Postgres" },
      { id: "envs", label: "Environments, canary, rollback" },
    ],
  },
  {
    name: "Operate",
    items: [
      { id: "backup", label: "Backup" },
      { id: "recovery", label: "Recovery" },
      { id: "otel", label: "Tracing with OpenTelemetry" },
      { id: "upgrade", label: "Upgrading and versioning" },
    ],
  },
  {
    name: "Reference",
    items: [
      { id: "api", label: "HTTP API" },
      { id: "config", label: "Server configuration" },
      { id: "features", label: "Crate features" },
      { id: "cli", label: "CLI and scripts" },
      { id: "stability", label: "Stability policy" },
    ],
  },
];

const QUICKSTART_MAIN = `use rusty_agent_runtime::prelude::*;
use rusty_agent_server::{serve, GraphRegistry, ServerConfig};
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> std::result::Result<(), Box<dyn std::error::Error>> {
    // State schema: one channel per key, each with its reducer.
    let spec = StateSpec::new()
        .channel("draft", Reducer::Overwrite)
        .channel("approval", Reducer::Overwrite);

    // Graph: draft -> approve. approve suspends the run until a person decides.
    let mut builder = GraphBuilder::new();

    builder.add_node("draft", |ctx: NodeContext| async move {
        // If the run's input seeded a draft, keep it; otherwise write one.
        let draft = ctx.state().get("draft").cloned().unwrap_or_else(|| {
            json!("Rusty Server serves durable agent graphs from one binary.")
        });
        println!("[draft] {draft}");
        Ok(NodeOutput::update("draft", draft))
    });

    builder.add_node("approve", |ctx: NodeContext| async move {
        match ctx.resume_value() {
            // Phase 2: a decision arrived via command.resume.
            Some(decision) => {
                println!("[approve] resumed with decision: {decision}");
                Ok(NodeOutput::update("approval", decision.clone()))
            }
            // Phase 1: no decision yet. Suspend the whole run.
            None => {
                let draft = ctx.state().get("draft").cloned().unwrap_or(Value::Null);
                println!("[approve] no decision — interrupting for human review");
                Err(ctx.interrupt(json!({
                    "kind": "approval_request",
                    "prompt": "Approve this draft for publication?",
                    "draft": draft,
                })))
            }
        }
    });

    builder.set_entry_point("draft");
    builder.add_edge("draft", "approve");
    let graph = builder.compile()?; // validates topology before serving anything

    // The registry: a name plus the Graph and its StateSpec.
    let mut registry = GraphRegistry::new();
    registry.register("publisher", graph, spec);

    let config = ServerConfig::new(
        "0.0.0.0:8080".parse()?,  // bind address
        "./data/checkpoints",     // JsonFileCheckpointer root
    );
    println!("listening on http://localhost:8080 (dev mode: no API key set)");
    serve(registry, config).await?;
    Ok(())
}`;

const GRAPH_MAIN = `use rusty_agent_runtime::prelude::*;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<()> {
    // 1. State schema: channel name -> reducer.
    let spec = StateSpec::new()
        .channel("messages", Reducer::AddMessages)
        .channel("done", Reducer::Overwrite);

    // 2. Nodes: async closures that return partial updates.
    let mut builder = GraphBuilder::new();
    builder.add_node("greeter", |_ctx: NodeContext| async move {
        Ok(NodeOutput::update(
            "messages",
            json!({"role": "assistant", "content": "Hello from Rusty!"}),
        ))
    });
    builder.add_node("finisher", |_ctx: NodeContext| async move {
        Ok(NodeOutput::update("done", json!(true)))
    });

    // 3. Edges: after greeter, route on the post-barrier state.
    builder.set_entry_point("greeter");
    builder.add_conditional_edges("greeter", |state| async move {
        let greeted = state
            .get("messages")
            .and_then(|m| m.as_array())
            .map(|a| !a.is_empty())
            .unwrap_or(false);
        Ok(if greeted { Route::Node("finisher".into()) } else { Route::End })
    });

    // 4. Compile: validates the entry point and every edge before running.
    let graph = builder.compile()?;

    // 5. Run.
    let outcome = Executor::new()
        .run(&graph, &spec, State::new(), RunConfig::new("thread-1"))
        .await?;
    match outcome {
        ExecutionOutcome::Done(state) => println!("final state: {}", state.to_value()),
        ExecutionOutcome::Interrupted { value, .. } => println!("suspended: {value}"),
    }
    Ok(())
}`;

const TOOL_RS = `use async_trait::async_trait;
use rusty_agent_runtime::prelude::*;
use rusty_agent_runtime::record::Effect;
use serde_json::{json, Value};

struct GetCurrentTime;

#[async_trait]
impl Tool for GetCurrentTime {
    fn name(&self) -> &str { "get_current_time" }
    fn description(&self) -> &str { "Returns the current date and time in UTC." }
    fn parameters_schema(&self) -> Value {
        json!({"type": "object", "properties": {}})
    }
    // Default is NonIdempotent. Declare the real class of the call.
    fn effect(&self) -> Effect { Effect::ReadOnly }
    async fn call(&self, _args: Value) -> Result<Value> {
        let secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| RustyError::Tool(e.to_string()))?
            .as_secs();
        Ok(json!({"unix_seconds": secs}))
    }
}`;

export const DOC_PAGES: Record<string, DocPage> = {
  /* ------------------------------------------------------------ Get started */
  intro: {
    title: "Introduction",
    learn: ["2.1"],
    source: ["README.md"],
    blocks: [
      { type: "p", text: "Rusty is a runtime and server for AI agents. You define an agent as a graph, Rusty runs it and saves its state after every step, and you use that saved state to resume, pause, and replay runs." },
      { type: "diagram", id: "pieces" },
      { type: "table", head: ["Piece", "Package", "What it does"], cols: "1fr 1.3fr 2fr", rows: [
        ["Rusty Core", "rusty-agent-runtime", "Runs graphs in super-steps, writes checkpoints, handles interrupts, journals every run."],
        ["Rusty Server", "rusty-agent-server", "Serves your graphs over HTTP and SSE: threads, runs, history, fork, replay."],
        ["Rusty Studio", "studio/", "The browser workspace: agents, connectors, skills, tests, runs."],
        ["Clients", "rusty_client · @rusty-runtime/client", "Python and TypeScript clients for the server API."],
      ] },
      { type: "h", text: "Choose how you want to start" },
      { type: "list", items: [
        { b: "Try Rusty Studio. ", t: "Run the server and Studio locally and build an agent in the browser." },
        { b: "Serve a graph from Rust. ", t: "Write a graph, serve it over HTTP, and call it with curl." },
        { b: "Call Rusty from Python or TypeScript. ", t: "Install a client and connect to a running server." },
      ] },
      { type: "links", text: "Next:", items: [
        { page: "local", label: "Run locally with Studio" },
        { page: "quickstart", label: "Quickstart" },
        { page: "py", label: "Python client" },
        { page: "ts", label: "TypeScript client" },
      ] },
    ],
  },

  install: {
    title: "Install",
    source: ["README.md", "docs/versioning.md", "Cargo.toml"],
    blocks: [
      { type: "p", text: "Add the Rust crates to your project, or install a client for Python or TypeScript." },
      { type: "h", text: "Requirements" },
      { type: "list", items: [
        { b: "Rust 1.87 or later ", t: "(`rustup`). The `genai` feature needs 1.88. The `capsules` feature needs 1.89." },
        { b: "Postgres storage: ", t: "a Postgres database and the `postgres` feature. The default JSON-file storage needs nothing." },
      ] },
      { type: "h", text: "Rust crates" },
      { type: "code", lang: "Cargo.toml", text: '[dependencies]\nrusty-agent-runtime = "0.12"\nrusty-agent-server = "0.12"   # only if you serve over HTTP\ntokio = { version = "1", features = ["full"] }\nasync-trait = "0.1"\nserde_json = "1"' },
      { type: "p", text: "Or add them from the command line:" },
      { type: "code", lang: "bash", text: "cargo add rusty-agent-runtime\ncargo add rusty-agent-server" },
      { type: "h", text: "Optional features" },
      { type: "table", head: ["Feature", "Crate", "Adds"], cols: "120px 1.2fr 2fr", rows: [
        ["postgres", "runtime, server", "Postgres checkpoint and server storage"],
        ["wasm", "runtime", "Sandboxed WASM nodes (Wasmtime)"],
        ["genai", "runtime", "One client for OpenAI, Anthropic, Gemini, Ollama, and others"],
        ["capsules", "server", "Capsule authorization policy (Cedar); turns on `wasm`"],
      ] },
      { type: "h", text: "Clients" },
      { type: "code", lang: "bash", text: "npm install @rusty-runtime/client   # TypeScript / JavaScript, Node 18+\npip install rusty-agent-runtime     # Python 3.8+, imported as rusty_client" },
      { type: "h", text: "Packages" },
      { type: "table", head: ["Package", "Registry", "Version"], cols: "1.4fr 1fr 1fr", rows: [
        ["rusty-agent-runtime", "crates.io", "0.12.0"],
        ["rusty-agent-server", "crates.io", "0.12.0"],
        ["rusty-worker", "crates.io", "0.3.6"],
        ["rusty-otel", "crates.io", "0.1.7"],
        ["rusty-eval", "crates.io", "0.1.5"],
        ["@rusty-runtime/client", "npm", "0.5.0"],
        ["rusty-agent-runtime", "PyPI", "0.5.0"],
      ] },
      { type: "meta", text: "Registry versions checked on 2026-09-28 with cargo search, npm view, and pip install. The Quickstart builds against these crates.io versions with Rust 1.97." },
      { type: "meta", text: "The Rust core crate and the Python client share the name rusty-agent-runtime on different registries. They are separate packages. The Python client is imported as rusty_client." },
      { type: "links", text: "Next:", items: [
        { page: "local", label: "Run locally with Studio" },
        { page: "quickstart", label: "Quickstart" },
      ] },
    ],
  },

  local: {
    title: "Run locally with Studio",
    source: ["scripts/dev.sh", "README.md", "rusty-server/examples/server_demo.rs"],
    blocks: [
      { type: "meta", text: "Tested against rusty main @ fedbb3a on 2026-09-28 (macOS, Rust 1.97, Node 25, Python 3.9)." },
      { type: "p", text: "Run Rusty Server and Rusty Studio on your machine. You need `cargo`, `python3`, `npm`, and `curl`. The script runs `npm ci` and builds Studio on the first start." },
      { type: "h", text: "1. Clone and start" },
      { type: "code", lang: "bash", text: "git clone https://github.com/dev-amjad-shaikh/rusty.git\ncd rusty\n./scripts/dev.sh" },
      { type: "p", text: "The script builds `server_demo`, builds Studio, waits for the server's `/ok`, then prints both addresses. The server listens on http://127.0.0.1:8100 and Studio on http://127.0.0.1:4400. Ctrl-C stops both. If a port is taken, set `RUSTY_SERVER_PORT` or `RUSTY_STUDIO_PORT`:" },
      { type: "code", lang: "bash", text: "RUSTY_STUDIO_PORT=4410 ./scripts/dev.sh" },
      { type: "h", text: "2. Sign in" },
      { type: "p", text: "The first start creates an administrator named `admin` and writes its password to `data/server-demo-checkpoints/bootstrap-admin.txt` (file mode 0600). Until you sign in, API routes answer `401`; `/ok`, `/health`, `/me`, and the sign-in routes stay open. Sign in to Studio with `admin` and that password, change the password under your name, then delete the file." },
      { type: "code", lang: "bash", text: "cat data/server-demo-checkpoints/bootstrap-admin.txt\n\n# the same sign-in from a terminal\ncurl -s -c /tmp/rusty-cookies.txt -X POST localhost:8100/auth/login \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"username\": \"admin\", \"password\": \"<from the file>\"}'\ncurl -s -b /tmp/rusty-cookies.txt localhost:8100/info" },
      { type: "p", text: "To run without sign-in on your laptop, start with `RUSTY_OPEN=1`. It only skips creating the administrator, so it needs a store with no users. If you already started once without it, point the server at a fresh store:" },
      { type: "code", lang: "bash", text: "RUSTY_OPEN=1 RUSTY_DEMO_STORE=./data/open-store ./scripts/dev.sh\ncurl -s localhost:8100/me    # {\"principal\": {\"id\": \"dev\", \"name\": \"Developer (open mode)\", …}}" },
      { type: "p", text: "A production server (`RUSTY_ENV=production`) refuses to boot without authentication." },
      { type: "h", text: "3. Chat with the demo agent" },
      { type: "p", text: "Open http://localhost:4400. The demo `react_agent` answers from a deterministic local model, so it works with no network connection and no API key." },
      { type: "h", text: "4. Use a real model (optional)" },
      { type: "p", text: "Create `.env.rusty-local` in the repo root. Git ignores it. `dev.sh` loads it on start." },
      { type: "code", lang: ".env.rusty-local", text: "RUSTY_LLM_BASE_URL=http://<host>:<port>/v1\nRUSTY_LLM_MODEL=<model id>\nRUSTY_LLM_API_KEY=<key>            # not needed for a local vLLM or Ollama server\nRUSTY_LLM_EXTRA_BODY='{\"chat_template_kwargs\":{\"enable_thinking\":false}}'   # optional" },
      { type: "p", text: "Any OpenAI-compatible endpoint works. Restart `./scripts/dev.sh` to apply." },
      { type: "meta", text: "Measured on an Apple M2 Max, 2026-09-28, with an empty target directory and crates already downloaded: 1 minute 41 seconds to build `server_demo`, under 10 seconds for `npm ci` and the Studio build, about 2 minutes 10 seconds until both are up. Later starts skip both builds when nothing changed." },
      { type: "p", text: "To run the same pair in containers, see Docker. Compose serves Studio on port 8000, not 4400." },
      { type: "links", text: "Next:", items: [
        { page: "agent", label: "Build an agent in Studio" },
        { page: "model", label: "Connect a model" },
        { page: "docker", label: "Docker" },
      ] },
    ],
  },

  quickstart: {
    title: "Quickstart: serve a graph",
    learn: ["3.1", "3.2", "3.3"],
    source: ["docs/server-quickstart.md", "rusty-core/examples/human_in_loop.rs"],
    blocks: [
      { type: "meta", text: "Time: 10 minutes. You need Rust and curl. No database, no Docker. Tested on 2026-09-28 with the crates.io 0.12.0 release and with path dependencies on rusty main @ fedbb3a; the first `cargo build` took 39 seconds on an Apple M2 Max." },
      { type: "p", text: "You will create a Rust project, define a two-step graph with an approval step, serve it over HTTP, run it until it pauses, resume it, then list its checkpoints and fork it." },
      { type: "diagram", id: "quickstart-sequence" },
      { type: "h", text: "1. Create the project" },
      { type: "code", lang: "bash", text: "cargo new agent-server-demo\ncd agent-server-demo" },
      { type: "code", lang: "Cargo.toml", text: '[dependencies]\nrusty-agent-runtime = "0.12"\nrusty-agent-server = "0.12"\ntokio = { version = "1", features = ["full"] }\nserde_json = "1"' },
      { type: "p", text: "There is no separate config file for graphs. Your `main.rs` declares them and the compiler checks them." },
      { type: "h", text: "2. Define the graph" },
      { type: "p", text: "Replace `src/main.rs`. The graph has two nodes: `draft` writes a draft, and `approve` pauses the run until a person responds." },
      { type: "code", lang: "src/main.rs", text: QUICKSTART_MAIN },
      { type: "p", text: "The server crate adds three names you call: `GraphRegistry`, `ServerConfig`, and `serve`. Use `router(registry, config)` instead of `serve` to mount the routes in a larger axum app." },
      { type: "h", text: "3. Start the server" },
      { type: "code", lang: "bash", text: 'cargo run\n# listening on http://localhost:8080 (dev mode: no API key set)\n\n# in another terminal\ncurl localhost:8080/ok        # {"ok":true}\ncurl localhost:8080/info      # {"checkpointer":"json_file","graphs":[{"channels":["approval","draft"],"name":"publisher"}],…}' },
      { type: "p", text: 'No API key is set, so the server runs without authentication. To require one, use `ServerConfig::new(…).with_api_key("secret")` and send `-H "X-Api-Key: secret"` with every request.' },
      { type: "h", text: "4. Create a thread" },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/threads \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"graph\": \"publisher\", \"metadata\": {\"owner\": \"quickstart\"}}'\n# 201 {\"thread_id\": \"3f2b9c4e-…\", \"graph\": \"publisher\", …}\n\nTID=<paste the thread_id here>" },
      { type: "h", text: "5. Run until approval" },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/threads/$TID/runs/wait \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"input\": {\"draft\": \"Rust agents, one binary.\"}}'" },
      { type: "code", lang: "response", text: '{\n  "run_id": "7c1e…",\n  "thread_id": "3f2b9c4e-…",\n  "status": "interrupted",\n  "interrupt": {\n    "kind": "approval_request",\n    "prompt": "Approve this draft for publication?",\n    "draft": "Rust agents, one binary."\n  },\n  "checkpoint_id": "a94f…",\n  "state": { "draft": "Rust agents, one binary." }\n}' },
      { type: "p", text: "Built from rusty main, the response also carries a `spend` object. The run is parked inside `approve` and its checkpoint is on disk. Check where it stopped:" },
      { type: "code", lang: "bash", text: 'curl -s localhost:8080/threads/$TID/state\n# {"checkpoint": {"checkpoint_id": "a94f…", "step": 1, …}, "next": ["approve"], "values": {"draft": "Rust agents, one binary."}}' },
      { type: "h", text: "6. Resume with a decision, streamed over SSE" },
      { type: "code", lang: "bash", text: "curl -N -X POST localhost:8080/threads/$TID/runs/stream \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"command\": {\"resume\": {\"approved\": true, \"reviewer\": \"alice\"}},\n       \"stream_mode\": [\"updates\", \"values\"]}'" },
      { type: "code", lang: "response", text: 'event: metadata\nid: -:0:1\ndata: {"attempt":2,"graph":"publisher","metadata":null,"run_id":"ab7b…","thread_id":"3f2b9c4e-…"}\n\nevent: updates\nid: -:1:2\ndata: {"step":1,"updates":{"approval":{"approved":true,"reviewer":"alice"}}}\n\nevent: values\nid: a8de…:1:3\ndata: {"approval":{"approved":true,"reviewer":"alice"},"draft":"Rust agents, one binary."}\n\nevent: end\nid: a8de…:1:4\ndata: {"status":"success"}' },
      { type: "p", text: "`-N` turns off curl's buffering, which SSE needs. The server restored the checkpoint and ran `approve` again from its start with `ctx.resume_value()` set. The terminal running the server prints `[approve] resumed with decision: …`." },
      { type: "h", text: "7. List checkpoints" },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/threads/$TID/history \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"limit\": 10}'" },
      { type: "p", text: "Checkpoints come back newest first. This thread has three: the finished run (`next: []`), the parked run at step 1 (`next: [\"approve\"]`), and step 0. To undo a finished run, delete its checkpoints with `DELETE /threads/$TID/runs/$RUN_ID`; the answer reports `deleted_checkpoints` and `remaining_checkpoints`." },
      { type: "h", text: "8. Fork and replay from a checkpoint" },
      { type: "p", text: "Fork at the parked checkpoint, the second entry in the history, and give the branch a different decision." },
      { type: "code", lang: "bash", text: "CP_ID=<the checkpoint_id whose next is [\"approve\"] and step is 1>\n\ncurl -s -X POST localhost:8080/threads/$TID/fork \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"new_thread_id\": \"branch-a\", \"checkpoint_id\": \"'$CP_ID'\"}'\n# 201 {\"checkpoints_copied\": 2, \"thread_id\": \"branch-a\"}\n\n# replay from that checkpoint on the branch: it parks at approve again\ncurl -s -X POST localhost:8080/threads/branch-a/runs/wait \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"checkpoint\": {\"checkpoint_id\": \"'$CP_ID'\"}}'\n# {\"status\": \"interrupted\", \"thread_id\": \"branch-a\", …}\n\ncurl -s -X POST localhost:8080/threads/branch-a/runs/wait \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"command\": {\"resume\": {\"approved\": false, \"reviewer\": \"bob\"}}}'\n# {\"output\": {\"approval\": {\"approved\": false, \"reviewer\": \"bob\"}, …}, \"status\": \"success\", …}" },
      { type: "p", text: "The fork copies the history up to and including the checkpoint you name, so `checkpoints_copied` is 2 here. The branch gets its own thread id and history, and the original timeline is left alone. Fork and compare runs shows how to diff the two decisions." },
      { type: "links", text: "Next:", items: [
        { page: "inspect", label: "Inspect a run" },
        { page: "replay", label: "Replay a run" },
        { page: "fork", label: "Fork and compare runs" },
        { page: "release", label: "Build a release binary" },
      ] },
    ],
  },

  /* -------------------------------------------------------------- Configure */
  model: {
    title: "Connect a model",
    learn: ["2.6"],
    source: ["README.md", "docs/provider-layer-design.md", "rusty-core/src/llm.rs", "rusty-core/src/provider_genai.rs", "rusty-server/src/llm_providers.rs"],
    blocks: [
      { type: "p", text: "Point Rusty at a model. The local demo reads environment variables; your own Rust code builds a `ChatModel` and passes it to a graph." },
      { type: "h", text: "In the local demo and Studio" },
      { type: "p", text: "Without configuration, the demo agent uses a deterministic local model. To use a real one, put any OpenAI-compatible endpoint in `.env.rusty-local` at the repo root and restart `./scripts/dev.sh`." },
      { type: "table", head: ["Variable", "Required", "Meaning"], cols: "1.6fr 90px 2fr", rows: [
        ["RUSTY_LLM_BASE_URL", "yes", "OpenAI-compatible base URL, e.g. http://localhost:11434/v1"],
        ["RUSTY_LLM_MODEL", "yes", "Model id sent with each request"],
        ["RUSTY_LLM_API_KEY", "no", "Bearer key. A local vLLM or Ollama server needs none."],
        ["RUSTY_LLM_EXTRA_BODY", "no", "JSON object merged into every request (provider extensions)"],
        ["RUSTY_LLM_PRICE_INPUT_PER_M", "no", "USD per million input tokens; with the output price, runs record cost"],
        ["RUSTY_LLM_PRICE_OUTPUT_PER_M", "no", "USD per million output tokens"],
        ["RUSTY_LLM_FALLBACK_*", "no", "Same suffixes (BASE_URL, MODEL, …) for a fallback provider"],
      ] },
      { type: "p", text: "When the server's store holds no model providers yet, it seeds them from these variables. After that, manage providers in Studio under AI models. Changes there take effect without a restart." },
      { type: "h", text: "In Rust: any OpenAI-compatible endpoint" },
      { type: "p", text: "`OpenAiCompatibleClient` works with OpenAI, vLLM, Ollama, LM Studio, and compatible gateways. It is always available; no feature flag." },
      { type: "code", lang: "rust", text: 'use std::sync::Arc;\nuse rusty_agent_runtime::prelude::*;\n\n// Reads the key from OPENAI_API_KEY; logs a warning if it is unset.\nlet model: Arc<dyn ChatModel> = Arc::new(OpenAiCompatibleClient::from_env(\n    "https://api.openai.com/v1",\n    "OPENAI_API_KEY",\n    "gpt-4o-mini",\n));\n\n// Or pass the key directly: OpenAiCompatibleClient::new(base_url, Some(key), model)\n// Optional: .with_extra_body(map)\n// On rusty main (not in 0.12.0): .with_pricing(ModelPricing::new(0.20, 0.60))\n\nlet graph = create_react_agent(model, ToolRegistry::new())?;' },
      { type: "h", text: "In Rust: native providers with the genai feature" },
      { type: "p", text: "The `genai` feature adds `GenaiChatModel`, which talks to OpenAI, Anthropic, Gemini, Ollama, and other providers through their native protocols. The model string picks the provider. Keys come from each provider's usual variable. Needs Rust 1.88." },
      { type: "code", lang: "Cargo.toml", text: 'rusty-agent-runtime = { version = "0.12", features = ["genai"] }' },
      { type: "code", lang: "rust", text: 'let model: Arc<dyn ChatModel> = Arc::new(GenaiChatModel::new("claude-haiku-4-5"));' },
      { type: "table", head: ["Model string", "Provider", "Key"], cols: "1.3fr 1fr 1.4fr", rows: [
        ["gpt-…", "OpenAI", "OPENAI_API_KEY"],
        ["claude-…", "Anthropic", "ANTHROPIC_API_KEY"],
        ["gemini-…", "Gemini", "GEMINI_API_KEY"],
        ["ollama::llama3.1", "Local Ollama", "none"],
      ] },
      { type: "h", text: "Try it with the examples" },
      { type: "code", lang: "bash", text: "# One OpenAI-compatible endpoint (defaults to a local Ollama at localhost:11434)\nRUSTY_BASE_URL=https://api.openai.com/v1 RUSTY_API_KEY=sk-… RUSTY_MODEL=gpt-4o-mini \\\n  cargo run -p rusty-agent-runtime --example live_agent\n\n# Native providers through genai\nANTHROPIC_API_KEY=… GENAI_MODEL=claude-haiku-4-5 \\\n  cargo run -p rusty-agent-runtime --example genai_live --features genai" },
      { type: "links", text: "Next:", items: [
        { page: "tool", label: "Add a tool" },
        { page: "env", label: "Environment variables" },
      ] },
    ],
  },

  storage: {
    title: "Checkpoint storage",
    learn: ["3.1", "6.5"],
    source: ["rusty-core/README.md", "rusty-core/src/checkpoint.rs", "rusty-server/README.md", "docs/architecture.md"],
    blocks: [
      { type: "p", text: "Rusty saves a checkpoint of the run's state at every super-step boundary. Choose where those checkpoints live." },
      { type: "diagram", id: "checkpoint-stores" },
      { type: "table", head: ["Checkpointer", "Use for", "Where it writes"], cols: "1.5fr 1.2fr 1.6fr", rows: [
        ["InMemoryCheckpointer", "Tests and experiments", "Process memory. Lost on restart."],
        ["JsonFileCheckpointer", "One node, no database", "One JSON file per checkpoint under a directory"],
        ["PostgresCheckpointer", "Shared state, several replicas", "Table rusty_checkpoints (feature postgres)"],
      ] },
      { type: "h", text: "In the library" },
      { type: "p", text: "`Executor::new()` runs without persistence. Attach a checkpointer to make runs durable:" },
      { type: "code", lang: "rust", text: 'use std::sync::Arc;\nuse rusty_agent_runtime::prelude::*;\n\nlet executor = Executor::with_checkpointer(Arc::new(\n    JsonFileCheckpointer::new("./data/checkpoints"),\n));\n\n// Postgres (feature "postgres"): connects and creates the table if needed.\n// let pg = rusty_agent_runtime::checkpoint_postgres::PostgresCheckpointer::connect(\n//     "postgres://user:pass@localhost/rusty").await?;\n// let executor = Executor::with_checkpointer(Arc::new(pg));' },
      { type: "p", text: "The thread id in `RunConfig::new(\"thread-42\")` names the checkpoint history. Use the same thread id to resume." },
      { type: "h", text: "In the server" },
      { type: "p", text: "`ServerConfig::new(bind_addr, store_path)` wires a `JsonFileCheckpointer` at `store_path` (default `./data/checkpoints`). Threads, assistants, crons, KV items, and run journals are stored under the same directory. Call `.with_postgres(url)` to move all of it to Postgres. See Postgres." },
      { type: "h", text: "Rules to know" },
      { type: "list", items: [
        { b: "Checkpoints happen between steps, never mid-node. ", t: "On resume, an interrupted node runs again from its start, so node logic must be safe to repeat." },
        { b: "Compatibility is per minor line. ", t: "Checkpoints written by one `0.x` runtime line are readable by that same minor line. Read the CHANGELOG before a minor upgrade." },
        { b: "Every checkpoint is a handle. ", t: "`get_by_id` fetches one, `fork_thread` copies a history to a new thread, and `RunConfig::with_checkpoint_id` replays from it." },
      ] },
      { type: "links", text: "Next:", items: [
        { page: "postgres", label: "Postgres" },
        { page: "approval", label: "Human approval" },
        { page: "backup", label: "Backup" },
      ] },
    ],
  },

  auth: {
    title: "Authentication and API keys",
    learn: ["10.2", "6.4"],
    source: ["rusty-server/README.md", "rusty-server/src/auth.rs", "rusty-server/src/users.rs", "rusty-server/src/lib.rs"],
    blocks: [
      { type: "meta", text: "Tested against rusty main @ fedbb3a on 2026-09-28: tenant keys, cross-tenant 404s, RUSTY_PRINCIPALS, sign-in, password change, and the production refusal." },
      { type: "p", text: "Decide who can call the server. A server with no keys and no users runs open, which is for development only." },
      { type: "table", head: ["Mode", "How to set it", "Callers authenticate with"], cols: "1fr 1.6fr 1.4fr", rows: [
        ["Open (dev)", "No keys, no users (the ServerConfig default)", "Nothing. Every call runs as tenant default."],
        ["Single key", "ServerConfig::with_api_key(\"…\")", "X-Api-Key header"],
        ["Tenants", "with_tenant_key(tenant, key), repeatable", "X-Api-Key; data isolated per tenant"],
        ["Principals", "with_principal(tenant, Principal { id, name, kind, roles }, key)", "X-Api-Key; scopes come from roles"],
        ["People", "with_bootstrap_admin(true), then users", "Sign-in session cookie (rusty_session)"],
      ] },
      { type: "h", text: "API keys" },
      { type: "code", lang: "rust", text: 'let config = ServerConfig::new("0.0.0.0:8080".parse()?, "./data/checkpoints")\n    .with_tenant_key("acme", "sk-acme-…")\n    .with_tenant_key("globex", "sk-globex-…")\n    .with_api_key("sk-ops-…"); // optional: this key maps to tenant default' },
      { type: "code", lang: "bash", text: 'curl localhost:8080/threads/$TID/state -H "X-Api-Key: sk-acme-…"' },
      { type: "p", text: "A missing or unknown key gets `401` with a problem body: `{\"type\": \"https://rusty.dev/problems/admission-refused\", \"title\": \"Admission refused\", \"status\": 401, \"reason\": \"Unauthorized\"}`. Another tenant's thread, run, assistant, cron, or KV item returns `404`, never `403`, so ids do not leak across tenants. The `with_api_key` key is tenant `default`, so it cannot see `acme`'s threads either. `GET /ok` and `GET /health` answer without a key." },
      { type: "h", text: "Roles" },
      { type: "p", text: "A principal holds roles, and roles grant scopes. The roles are `admin`, `builder`, `operator`, and `auditor`. The demo server reads principals from `RUSTY_PRINCIPALS`:" },
      { type: "code", lang: "bash", text: 'RUSTY_PRINCIPALS="amjad:user:admin:KEY1;nightly-kb:service:operator+builder:KEY2" \\\n  ./scripts/dev.sh\n# format: id:kind:roles:key, kind is user or service, roles joined with +\n\ncurl -s localhost:8100/me -H "X-Api-Key: KEY2"\n# {\"principal\": {\"id\": \"nightly-kb\", \"kind\": \"service\", \"roles\": [\"operator\", \"builder\"], …}, \"scopes\": [\"assistants:read\", …]}' },
      { type: "p", text: "Setting `RUSTY_PRINCIPALS` turns authentication on, even with `RUSTY_OPEN=1`: a request without a key answers `401`." },
      { type: "h", text: "People and sign-in" },
      { type: "p", text: "With `with_bootstrap_admin(true)`, the first boot on an empty store creates the user `admin` and writes its password to `bootstrap-admin.txt` in the store directory (file mode 0600). The demo server and `./scripts/dev.sh` turn this on. `RUSTY_OPEN=1` turns it off, which only matters on an empty store: once a user exists, sign-in stays required." },
      { type: "code", lang: "bash", text: "curl -c cookies.txt -X POST localhost:8100/auth/login \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"username\": \"admin\", \"password\": \"…\"}'\ncurl -b cookies.txt localhost:8100/me" },
      { type: "code", lang: "bash", text: "curl -b cookies.txt -X POST localhost:8100/auth/password \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"current\": \"…\", \"new\": \"…\"}'    # 204" },
      { type: "p", text: "For single sign-on, Studio's Config → Sign-in takes an OIDC issuer. `scripts/oidc-idp-demo.py` is a development identity provider for trying it; never use it in production." },
      { type: "h", text: "Production" },
      { type: "list", items: [
        { b: "Set RUSTY_ENV=production. ", t: "The server refuses to start unless keys, principals, or users are configured. It exits with `refusing to serve production without authentication`. A demo server with the bootstrap administrator boots, because the administrator is a user." },
        { b: "CORS is same-origin in production. ", t: "Add `.with_cors_allowed_origin(\"https://studio.example.com\")` for each browser origin that calls the API. Development servers allow any origin." },
        { b: "Set the public URL. ", t: "`RUSTY_PUBLIC_URL` (or `with_public_url`) is where OAuth and OIDC callbacks return. `RUSTY_STUDIO_URL` names where Studio lives." },
      ] },
      { type: "links", text: "Next:", items: [
        { page: "env", label: "Environment variables" },
        { page: "release", label: "Build a release binary" },
      ] },
    ],
  },

  env: {
    title: "Environment variables",
    source: ["rusty-server/src/lib.rs", "rusty-server/src/llm_providers.rs", "rusty-server/examples/server_demo.rs", "scripts/dev.sh"],
    blocks: [
      { type: "p", text: "Every variable below is read somewhere in rusty-src. The `ServerConfig` builder is the main configuration surface; most variables exist so the demo server can set builder options without code." },
      { type: "h", text: "Read by rusty-agent-server" },
      { type: "p", text: "These apply to any binary built on the server crate." },
      { type: "table", head: ["Variable", "Default", "Effect"], cols: "1.5fr 1.2fr 2fr", rows: [
        ["RUSTY_ENV", "unset (dev)", "production refuses to boot without authentication and serves same-origin only"],
        ["RUSTY_PUBLIC_URL", "http://127.0.0.1:8100", "The URL callbacks (OAuth grants, OIDC sign-in) return to"],
        ["RUSTY_STUDIO_URL", "public URL on port 4400", "Where Studio lives, for sign-in redirects"],
        ["RUSTY_LLM_BASE_URL · _MODEL · _API_KEY", "unset", "Seeds the model provider list when the store has none"],
        ["RUSTY_LLM_EXTRA_BODY · _NAME", "unset", "Extra JSON merged into requests; provider display name"],
        ["RUSTY_LLM_PRICE_INPUT_PER_M · _OUTPUT_PER_M · _CACHED_INPUT_PER_M", "unset", "Prices in USD per million tokens"],
        ["RUSTY_LLM_FALLBACK_*", "unset", "The same suffixes for a fallback provider"],
      ] },
      { type: "h", text: "Read by the demo server" },
      { type: "p", text: "`server_demo` is what `./scripts/dev.sh` and `docker compose` run (`rusty-server/examples/server_demo.rs`)." },
      { type: "table", head: ["Variable", "Default", "Effect"], cols: "1.5fr 1.2fr 2fr", rows: [
        ["RUSTY_DEMO_ADDR", "127.0.0.1:8100", "Bind address"],
        ["RUSTY_DEMO_STORE", "./data/server-demo-checkpoints", "Store directory"],
        ["RUSTY_OPEN", "unset", "1 skips creating the administrator; no sign-in on a store with no users"],
        ["RUSTY_PRINCIPALS", "unset", "id:kind:roles:key entries separated by ;. Turns authentication on"],
        ["RUSTY_BACKUP_DIR", "{store}-backups beside the store", "Where estate backups are written"],
        ["RUSTY_RESTORE_FROM", "unset", "Backup archive to restore into an empty store at boot"],
        ["RUSTY_MCP_STDIO", "unset", "1 allows the server to spawn stdio MCP servers"],
        ["RUSTY_EGRESS_ALLOW", "unset", "Comma-separated hosts allowed beyond existing connections"],
        ["RUSTY_CONTEXT_BUDGET_TOKENS", "32000", "Context window budget for model calls; 0 turns assembly off"],
        ["RUSTY_VERIFY_OUTCOMES", "on", "0 turns off the judge that checks finished runs"],
        ["RUSTY_ASK_WAIT_SECS", "150", "How long one agent waits for another (5 to 3600)"],
        ["RUSTY_SWEEP_AT", "unset", "HH:MM (UTC) for a nightly run of every test suite"],
        ["RUSTY_LLM_*", "unset", "The demo agent's model (see Connect a model)"],
        ["RUSTY_DEMO_STAGE_DELAY_MS", "75000", "Stage length of the deep-dive demo graph"],
      ] },
      { type: "h", text: "Read by scripts and examples" },
      { type: "table", head: ["Variable", "Read by", "Effect"], cols: "1.5fr 1.2fr 2fr", rows: [
        ["RUSTY_SERVER_PORT", "scripts/dev.sh", "Server port (default 8100)"],
        ["RUSTY_STUDIO_PORT", "scripts/dev.sh", "Studio port (default 4400)"],
        ["RUSTY_BASE_URL · RUSTY_API_KEY · RUSTY_MODEL", "live_agent example", "Endpoint, key, and model (default: local Ollama, llama3.1)"],
        ["GENAI_MODEL", "genai_live example", "Provider-selecting model string (default gpt-4o-mini)"],
        ["OTEL_DEMO_ENDPOINT", "otel_demo example", "OTLP endpoint; unset logs to stderr only"],
        ["RUST_LOG", "rusty-otel", "Log filter for stderr output"],
        ["DATABASE_URL", "Postgres tests", "Database for the gated Postgres test suites"],
      ] },
      { type: "links", text: "Next:", items: [
        { page: "config", label: "Server configuration" },
        { page: "auth", label: "Authentication and API keys" },
      ] },
    ],
  },

  /* ------------------------------------------------------------------ Build */
  agent: {
    title: "Build an agent in Studio",
    learn: ["2.6"],
    source: ["docs/how-to.md", "docs/studio.md"],
    blocks: [
      { type: "meta", text: "Before you start: Run locally with Studio." },
      { type: "p", text: "Create an agent in Studio's six-step wizard, test it, and publish it." },
      { type: "list", numbered: true, items: [
        { b: "Go to Home → New agent ", t: "(or Agents → New agent). The steps are Template, Identity, Goal, Instructions, Model & tools, and Review. You can go back to any step." },
        { b: "Template. ", t: "Blank agent starts empty. Data analyst, Coding agent, and Research assistant pre-fill instructions, starter tools, a goal, and a reasoning-steps budget." },
        { b: "Identity. ", t: "Enter a name, a handle (`@slug`), a one-line description, a color, and an icon. Runs and evaluations refer to the agent by its handle." },
        { b: "Goal. ", t: "Write one sentence a teammate could check, and set a primary metric and target. The goal is measured on the agent's runs over a rolling seven days, and on publish." },
        { b: "Instructions. ", t: "Write the system prompt: who the agent is, how it works, and what it must never do." },
        { b: "Model & tools. ", t: "The workspace default model is preselected. Add providers under AI models. Choose the tools the agent may call; each carries an effect class." },
        { b: "Review. ", t: "Save. The agent lands as a draft. The readiness card lists what is left before publish, such as a goal, a skill, a trigger, or a passing evaluation." },
        { b: "Test. ", t: "The panel beside the builder runs the agent with real tool calls. The Test tab records what happened." },
        { b: "Publish ", t: "when readiness is clear. Each publish is measured against the agent's test suites." },
      ] },
      { type: "links", text: "Next:", items: [
        { page: "connector", label: "Add a connector" },
        { page: "skill", label: "Write a skill" },
        { page: "standin", label: "Test against a stand-in" },
      ] },
    ],
  },

  graph: {
    title: "Build a graph in Rust",
    learn: ["2.1", "2.2", "2.5"],
    source: ["rusty-core/README.md", "rusty-core/examples/"],
    blocks: [
      { type: "p", text: "Define state channels, add nodes and edges, compile, and run. This is the embedded library; no server is involved." },
      { type: "h", text: "A two-node graph" },
      { type: "code", lang: "src/main.rs", text: GRAPH_MAIN },
      { type: "h", text: "Reducers" },
      { type: "p", text: "Each state key is a channel with a reducer that decides how writes merge. Writes to undeclared channels are rejected." },
      { type: "table", head: ["Reducer", "Behavior"], cols: "150px 1fr", rows: [
        ["Overwrite", "Last value wins. One writer per super-step."],
        ["Append", "Appends each write to a list. Use for fan-in."],
        ["DeepMerge", "Merges JSON objects key by key."],
        ["AddMessages", "Upserts chat messages by id."],
      ] },
      { type: "h", text: "Routing" },
      { type: "table", head: ["Call", "Use it to"], cols: "1.3fr 1.7fr", rows: [
        ["add_edge(\"a\", \"b\")", "Always go from a to b"],
        ["add_conditional_edges(\"a\", router)", "Decide the next node from state: Route::Node, Route::End"],
        ["Route::Send(vec![Send::new(node, state), …])", "Fan out one task per item, in parallel"],
        ["NodeOutput::route(Command::goto(…))", "Let a node pick the next node itself"],
      ] },
      { type: "h", text: "A ReAct agent in one call" },
      { type: "code", lang: "rust", text: 'let graph = create_react_agent(model, tools)?;\nlet spec = StateSpec::new().channel("messages", Reducer::AddMessages);' },
      { type: "h", text: "Runnable examples" },
      { type: "p", text: "Run these from a clone of the rusty repo. The two-node graph above compiles and prints `final state: {\"done\":true,\"messages\":[…\"Hello from Rusty!\"…]}` against both 0.12.0 and main. The examples below were run on main @ fedbb3a, 2026-09-28." },
      { type: "table", head: ["Command", "Shows"], cols: "1.6fr 1.4fr", rows: [
        ["cargo run -p rusty-agent-runtime --example react_agent", "The prebuilt ReAct loop with a scripted model, no network. On main it stops at a tool-approval interrupt (`{\"kind\": \"approval\", \"requests\": […]}`) before the tools run"],
        ["cargo run -p rusty-agent-runtime --example parallel_fanout", "Route::Send fan-out and Append fan-in"],
        ["cargo run -p rusty-agent-runtime --example human_in_loop", "Interrupt, file checkpoint, resume; ends with the published draft"],
        ["cargo run -p rusty-agent-runtime --example react_record_replay", "Record a run, replay it with zero outbound calls; prints journals byte-identical: true"],
        ["cargo run -p rusty-agent-runtime --example live_agent", "A ReAct agent against a real endpoint (not run: needs a model endpoint)"],
      ] },
      { type: "links", text: "Next:", items: [
        { page: "approval", label: "Human approval" },
        { page: "storage", label: "Checkpoint storage" },
        { page: "quickstart", label: "Serve it over HTTP" },
      ] },
    ],
  },

  approval: {
    title: "Human approval",
    learn: ["3.2", "3.4"],
    source: ["rusty-core/examples/human_in_loop.rs", "docs/server-quickstart.md"],
    blocks: [
      { type: "p", text: "Pause a run until a person decides, then continue it with their answer. The run's state is saved while it waits, so the wait can span restarts." },
      { type: "diagram", id: "approval-timeline" },
      { type: "h", text: "1. Write the node" },
      { type: "p", text: "Check `ctx.resume_value()` first. Interrupt only when there is no decision yet." },
      { type: "code", lang: "rust", text: 'builder.add_node("approve", |ctx: NodeContext| async move {\n    match ctx.resume_value() {\n        Some(decision) => Ok(NodeOutput::update("approval", decision.clone())),\n        None => {\n            let draft = ctx.state().get("draft").cloned().unwrap_or(Value::Null);\n            Err(ctx.interrupt(json!({\n                "kind": "approval_request",\n                "prompt": "Approve this draft for publication?",\n                "draft": draft,\n            })))\n        }\n    }\n});' },
      { type: "h", text: "2. Run, then resume (library)" },
      { type: "code", lang: "rust", text: 'let executor = Executor::with_checkpointer(Arc::new(JsonFileCheckpointer::new(dir)));\n\n// Phase 1: suspends at approve.\nlet outcome = executor.run(&graph, &spec, State::new(), RunConfig::new("hitl-demo-thread")).await?;\nif let ExecutionOutcome::Interrupted { value, checkpoint_id, .. } = outcome {\n    // show `value` to a person\n}\n\n// Phase 2: same thread id, with the decision.\nlet done = executor\n    .run(&graph, &spec, State::new(),\n         RunConfig::new("hitl-demo-thread").with_resume(json!({"approved": true})))\n    .await?;' },
      { type: "h", text: "2. Run, then resume (HTTP)" },
      { type: "code", lang: "bash", text: "# The run parks: {\"status\": \"interrupted\", \"interrupt\": {…}, \"checkpoint_id\": …}\ncurl -s -X POST localhost:8080/threads/$TID/runs/wait \\\n  -H 'Content-Type: application/json' -d '{\"input\": {}}'\n\n# Resume with the decision\ncurl -s -X POST localhost:8080/threads/$TID/runs/wait \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"command\": {\"resume\": {\"approved\": true}}}'" },
      { type: "p", text: "From the clients: `client.run_wait(tid, command={\"resume\": {\"approved\": True}})` in Python, `client.runWait(tid, { command: { resume: { approved: true } } })` in TypeScript." },
      { type: "h", text: "Rules" },
      { type: "list", items: [
        { b: "Use the same thread id. ", t: "It names the checkpoint history the resume restores." },
        { b: "The node runs again from its start. ", t: "Anything before the interrupt must be safe to repeat." },
        { b: "The interrupt payload is yours. ", t: "It comes back to the caller as the run's `interrupt` value. Put what the person needs to decide in it." },
      ] },
      { type: "code", lang: "bash", text: "cargo run -p rusty-agent-runtime --example human_in_loop" },
      { type: "links", text: "Next:", items: [
        { page: "storage", label: "Checkpoint storage" },
        { page: "inspect", label: "Inspect a run" },
      ] },
    ],
  },

  tool: {
    title: "Add a tool",
    learn: ["5.2", "4.3"],
    source: ["docs/how-to.md", "rusty-core/src/tool.rs", "rusty-core/examples/genai_live.rs"],
    blocks: [
      { type: "p", text: "Give an agent something it can call. In Studio, tools come from connections. In Rust, you implement the `Tool` trait." },
      { type: "h", text: "In Studio" },
      { type: "p", text: "Tools → New tool offers three paths:" },
      { type: "list", numbered: true, items: [
        { b: "From a connection. ", t: "Connect a service under Connectors. Every operation its manifest names becomes a tool with an effect class." },
        { b: "From an OpenAPI document. ", t: "Connectors → Browse all → Custom protocol, then paste the spec. Each operation becomes a tool." },
        { b: "As a skill. ", t: "A procedure over existing tools is a skill, not a tool. See Write a skill." },
      ] },
      { type: "p", text: "Grant a tool to an agent from its builder → Tools, and add a note on when to use it." },
      { type: "h", text: "In Rust" },
      { type: "code", lang: "rust", text: TOOL_RS },
      { type: "code", lang: "rust", text: 'let mut tools = ToolRegistry::new();\ntools.register(GetCurrentTime);\nlet graph = create_react_agent(model, tools.clone())?;\n\n// Serving it: register_with_tools also lists the tools in GET /info.\n// On rusty main only; 0.12.0 has register(name, graph, spec).\nregistry.register_with_tools("my_agent", graph, spec, &tools)?;' },
      { type: "h", text: "Effect classes" },
      { type: "p", text: "The effect class tells the runtime whether a call is safe to retry or replay. The default is `NonIdempotent`. Never declare a weaker class than the tool's real behavior." },
      { type: "table", head: ["Effect", "Meaning"], cols: "150px 1fr", rows: [
        ["Pure", "No side effects"],
        ["ReadOnly", "Reads outside state, changes nothing"],
        ["Idempotent", "A keyed write; repeating it is safe"],
        ["Compensatable", "A write that can be undone"],
        ["NonIdempotent", "A write that must not run twice"],
      ] },
      { type: "links", text: "Next:", items: [
        { page: "connector", label: "Add a connector" },
        { page: "skill", label: "Write a skill" },
      ] },
    ],
  },

  connector: {
    title: "Add a connector",
    learn: ["10.3"],
    source: ["docs/how-to.md", "docs/connector-standard.md"],
    blocks: [
      { type: "p", text: "Connect a system your agents work in, such as GitHub, HubSpot, Jira, or any REST API. Connect once; every agent you allow can use it." },
      { type: "list", numbered: true, items: [
        { b: "Go to Connectors → Browse all.", t: "" },
        { b: "Choose a system, ", t: "or choose Custom protocol and paste an OpenAPI document." },
        { b: "Sign in ", t: "with the method the connector declares: API key, OAuth, or none. Credentials go into the broker and reach tools as short-lived handles. Agents, prompts, and logs never see the raw values." },
        { b: "Use the operations as tools. ", t: "They appear in Tools with their effect classes. Grant them to an agent from its builder." },
        { b: "Optional: ", t: "create a stand-in under Connectors → New stand-in to test against seeded data instead of the live system." },
      ] },
      { type: "h", text: "Over HTTP" },
      { type: "table", head: ["Method", "Path", "Purpose"], cols: "80px 1.4fr 1.6fr", rows: [
        ["POST", "/connectors/openapi", "Build a connector manifest from an OpenAPI document"],
        ["POST", "/connectors/check", "Test a connector config without saving anything"],
        ["POST", "/connectors/instances", "Create a connection; secrets are sealed"],
        ["PUT", "/connectors/instances/{id}", "Rotate a connection's credentials"],
        ["DELETE", "/connectors/instances/{id}", "Revoke a connection; sealed secrets are destroyed"],
      ] },
      { type: "links", text: "Next:", items: [
        { page: "standin", label: "Test against a stand-in" },
        { page: "tool", label: "Add a tool" },
      ] },
    ],
  },

  skill: {
    title: "Write a skill",
    source: ["docs/how-to.md"],
    blocks: [
      { type: "p", text: "A skill is a procedure written once, bundled with the tools it needs, and attachable to any agent. Skills are versioned `SKILL.md` packages." },
      { type: "list", numbered: true, items: [
        { b: "Go to Skills → New skill ", t: "(or, from an agent's builder, Compose a skill; the skill is attached on save)." },
        { b: "Name the skill, ", t: "for example Weekly notice." },
        { b: "Fill in When to use it. ", t: 'The agent reads this to decide whether the skill applies. Describe the trigger, for example: "Use when the user asks for a weekly summary."' },
        { b: "Write the procedure in Markdown. ", t: "Reference tools as `tool_name`. The editor records them as the skill's allowed tools." },
        { b: "Save, ", t: "then attach the skill to an agent from its Skills section." },
      ] },
      { type: "h", text: "Import skills" },
      { type: "list", items: [
        { b: "Browse library ", t: "imports packages from the registry." },
        { b: "From a repository ", t: "pulls `SKILL.md` files from a git URL. The report lists what was found, imported, and skipped, with reasons." },
      ] },
      { type: "links", text: "Next:", items: [
        { page: "agent", label: "Build an agent in Studio" },
        { page: "eval", label: "Evaluate with datasets" },
      ] },
    ],
  },

  py: {
    title: "Python client",
    source: ["sdks/python/README.md"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28: rusty-agent-runtime 0.5.0 from PyPI on Python 3.9, against the demo server on rusty main @ fedbb3a." },
      { type: "p", text: "Call a Rusty server from Python. The client uses only the standard library and runs on Python 3.8+." },
      { type: "code", lang: "bash", text: "pip install rusty-agent-runtime     # imported as rusty_client" },
      { type: "h", text: "Connect and run" },
      { type: "code", lang: "python", text: 'from rusty_client import RustyClient, RustyError\n\nclient = RustyClient("http://127.0.0.1:8100", api_key="...")   # omit api_key on an open server\n\nclient.ok()                                  # True\ntid = client.create_thread("react_agent")["thread_id"]\n\nresult = client.run_wait(tid, input={"messages": [{"role": "user", "content": "What is 17 + 25?"}]})\nprint(result["status"])                      # success\n\nfor frame in client.run_stream(tid, stream_mode=["updates", "values"]):\n    print(frame.event, frame.id, frame.data)   # metadata, updates, values, end\n\nclient.run_wait(tid, command={"resume": {"approved": True}})   # resume an interrupted run' },
      { type: "p", text: "The demo server behind `./scripts/dev.sh` requires sign-in. For scripts against it, start it on a fresh store with `RUSTY_OPEN=1` (see Run locally with Studio), or give it a key through `RUSTY_PRINCIPALS` and pass that key as `api_key`." },
      { type: "h", text: "Methods" },
      { type: "table", head: ["Method", "HTTP"], cols: "1.5fr 1.5fr", rows: [
        ["ok() · info()", "GET /ok · GET /info"],
        ["create_thread(graph, thread_id=None, metadata=None)", "POST /threads"],
        ["get_state(thread_id) · update_state(…)", "GET · POST /threads/{id}/state"],
        ["history(thread_id, limit=None, before=None)", "POST /threads/{id}/history"],
        ["fork(thread_id, checkpoint_id=None, new_thread_id=None)", "POST /threads/{id}/fork"],
        ["run(…) · run_wait(…) · run_stream(…)", "POST /threads/{id}/runs[/wait|/stream]"],
        ["run_status(run_id)", "GET /runs/{id}"],
        ["run_events · get_fixture · replay_run · diff_runs", "Flight Recorder endpoints"],
        ["delete_run(thread_id, run_id)", "DELETE /threads/{id}/runs/{run_id}"],
        ["create_assistant · list_assistants · get_assistant", "/assistants"],
        ["create_cron · list_crons · delete_cron", "/crons"],
        ["kv_put · kv_get · kv_delete · kv_list", "/store/{ns}/{key}"],
        ["tasks.enqueue · get · list · cancel · cancel_run_tasks", "/tasks"],
      ] },
      { type: "p", text: "Run options: `input`, `command`, `checkpoint_id`, `multitask_strategy`, `config`, `metadata`, `assistant_id`. `run_stream` also takes `stream_mode` and `last_event_id` to resume a dropped stream." },
      { type: "h", text: "Errors" },
      { type: "p", text: "Every non-2xx response raises `RustyError` with `.status` (HTTP code, `None` for transport failures) and `.body` (the response text)." },
      { type: "links", text: "Next:", items: [
        { page: "ts", label: "TypeScript client" },
        { page: "api", label: "HTTP API" },
      ] },
    ],
  },

  ts: {
    title: "TypeScript client",
    source: ["sdks/typescript/README.md"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28: @rusty-runtime/client 0.5.0 from npm on Node 25, against the demo server on rusty main @ fedbb3a." },
      { type: "p", text: "Call a Rusty server from Node.js 18+ or a modern browser. The client has no dependencies and ships its own type declarations. ESM only." },
      { type: "code", lang: "bash", text: "npm install @rusty-runtime/client" },
      { type: "h", text: "Connect and run" },
      { type: "code", lang: "ts", text: "import { RustyClient } from '@rusty-runtime/client';\n\nconst client = new RustyClient('http://localhost:8100', {\n  // apiKey: '…',     // sent as X-Api-Key\n  // timeout: 30_000, // ms per request (default); 0 disables\n});\n\nconst { thread_id } = await client.createThread('react_agent');\nconst terminal = await client.runWait(thread_id, {\n  input: { messages: [{ role: 'user', content: 'What is 17 + 25?' }] },\n});\nconsole.log(terminal.status, terminal.output);\n\nlet lastId;\nfor await (const frame of client.runStream(thread_id, { input: {} }, { streamMode: ['updates', 'values'] })) {\n  lastId = frame.id;               // \"{checkpoint_id}:{step}:{seq}\"\n  if (frame.event === 'end') console.log('done:', frame.data.status);\n}" },
      { type: "p", text: "From CommonJS, use `await import('@rusty-runtime/client')`. To resume a dropped stream, pass `{ lastEventId }` in the stream options." },
      { type: "h", text: "Methods" },
      { type: "table", head: ["Method", "HTTP"], cols: "1.5fr 1.5fr", rows: [
        ["ok() · info()", "GET /ok · GET /info"],
        ["createThread(graph, { metadata?, threadId? })", "POST /threads"],
        ["getState(threadId) · updateState(…)", "GET · POST /threads/{id}/state"],
        ["history(threadId, { limit?, before? })", "POST /threads/{id}/history"],
        ["fork(threadId, { newThreadId?, checkpointId? })", "POST /threads/{id}/fork"],
        ["run · runWait · runStream", "POST /threads/{id}/runs[/wait|/stream]"],
        ["runStatus(runId)", "GET /runs/{id}"],
        ["runEvents · getFixture · replayRun · diffRuns", "Flight Recorder endpoints"],
        ["deleteRun(threadId, runId)", "DELETE /threads/{id}/runs/{run_id}"],
        ["createAssistant · listAssistants · getAssistant", "/assistants"],
        ["createCron · listCrons · deleteCron", "/crons"],
        ["kvGet · kvPut · kvDelete · kvList", "/store/{ns}/{key}"],
        ["tasks.enqueue · get · list · cancel · cancelRunTasks", "/tasks"],
      ] },
      { type: "h", text: "Errors and aborts" },
      { type: "list", items: [
        { b: "RustyError ", t: "for non-2xx responses, with `.status` and `.body`. A JSON error body arrives parsed, for example `{ error: 'not_found', message: '…' }`." },
        { b: "RustyTimeoutError ", t: "when the client timeout fires (`.status === 0`, `.timeoutMs` set). For `runStream` the timeout covers opening the stream only." },
        { b: "Abort ", t: "any call with your own `AbortController` by passing `{ signal }`." },
      ] },
      { type: "links", text: "Next:", items: [
        { page: "py", label: "Python client" },
        { page: "api", label: "HTTP API" },
      ] },
    ],
  },

  /* ------------------------------------------------------------------- Test */
  inspect: {
    title: "Inspect a run",
    learn: ["5.1", "5.2"],
    source: ["docs/server-quickstart.md", "rusty-server/README.md"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28 against the Quickstart server (crates.io 0.12.0 and rusty main @ fedbb3a) and the demo server on main." },
      { type: "p", text: "Read what a run did. Every run has a journal of super-steps, node inputs and outputs, model and tool calls, interrupts, routing decisions, and checkpoint writes. `$RUN_ID` is the `run_id` from a `runs/wait` answer or the `metadata` frame of a stream." },
      { type: "h", text: "Status and journal" },
      { type: "code", lang: "bash", text: "curl -s localhost:8080/runs/$RUN_ID            # status, plus output/error/interrupt when finished\ncurl -s localhost:8080/runs/$RUN_ID/events     # {run_id, events, complete}" },
      { type: "p", text: "Events are ordered by `seq` and linked by `parent`. Each has a `kind`: a plain two-node run journals `super_step_start`, `node_input`, `node_output`, `super_step_end`, `routing_decision`, and `checkpoint_written` per step, and a resumed run starts with `resume`. `complete: true` means the run is finished and this is its final journal. A run still in its first step answers `{\"complete\": false, \"events\": []}`. Journals are stored, so they stay readable after a restart." },
      { type: "h", text: "Download a replay fixture" },
      { type: "code", lang: "bash", text: "curl -s localhost:8080/runs/$RUN_ID/fixture -o fixture.json" },
      { type: "p", text: "The fixture's top-level keys are `format_version`, `graph_hash`, `graph_version`, `journal`, `final_checkpoint`, and `metadata`. Load it in Rust with `rusty_agent_runtime::replay::ReplayFixture::import(&json)` to replay the run in CI. A run with nothing persisted yet returns `409`; an unknown run returns `404`." },
      { type: "h", text: "Other views" },
      { type: "table", head: ["Endpoint", "Returns"], cols: "1.4fr 1.6fr", rows: [
        ["GET /runs", "Recent runs, latest first. On rusty main; 0.12.0 answers 404"],
        ["GET /runs/{id}/stream", "Attach to a run's SSE stream; honors Last-Event-ID"],
        ["GET /runs/{id}/receipt", "The run's signed receipt: journal_head (event count and sha256), signer, signature"],
      ] },
      { type: "p", text: "In Studio, a run's journaled evidence shows in the rail beside the chat." },
      { type: "links", text: "Next:", items: [
        { page: "replay", label: "Replay a run" },
        { page: "fork", label: "Fork and compare runs" },
      ] },
    ],
  },

  replay: {
    title: "Replay a run",
    learn: ["5.3"],
    source: ["docs/server-quickstart.md", "rusty-server/README.md", "rusty-core/examples/react_record_replay.rs"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28 against the Quickstart server (crates.io 0.12.0 and rusty main @ fedbb3a) and the demo server on main. The example output is the Quickstart's first run." },
      { type: "p", text: "Check that the current graph code still makes the same decisions as a recorded run. The server re-runs the journaled run with no outbound calls, on a throwaway checkpointer, and compares the result with the journal." },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/runs/replay \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"run_id\": \"'$RUN_ID'\"}'\n# {\"actual_events\": 10, \"expected_events\": 10, \"first_divergence\": null,\n#  \"run_id\": \"7c1e…\", \"verified\": true}" },
      { type: "p", text: "`verified: true` means the run reproduced. If `false`, `first_divergence` is the journal `seq` where the replay differed. Your real checkpoint history is not touched." },
      { type: "table", head: ["Status", "Meaning"], cols: "100px 1fr", rows: [
        ["404", "Unknown run, or another tenant's"],
        ["409", "The run is still executing or has no journal yet"],
        ["422", "The graph is not registered in this process, the journal holds model or tool calls, or the run resumed from a checkpoint"],
      ] },
      { type: "p", text: "A resume is a run that starts from a checkpoint, so it answers `422`. In the Quickstart, replay the first run (the one that stopped at `approve`); the resume run and a run started on a fork answer `422` with `resumed from a checkpoint … replay the original run's journal instead`. A ReAct run answers `422` and points you to its fixture." },
      { type: "h", text: "Runs with model or tool calls" },
      { type: "p", text: "Replay those from the fixture in CI. In Rust, `create_react_agent_with_recording` journals every model and tool call, and `create_react_agent_replaying` answers them from the journal:" },
      { type: "code", lang: "bash", text: "cargo run -p rusty-agent-runtime --example react_record_replay" },
      { type: "links", text: "Next:", items: [
        { page: "fork", label: "Fork and compare runs" },
        { page: "eval", label: "Evaluate with datasets" },
      ] },
    ],
  },

  fork: {
    title: "Fork and compare runs",
    learn: ["3.3", "5.4"],
    source: ["docs/server-quickstart.md", "rusty-server/README.md"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28 with the Quickstart's publisher graph on crates.io 0.12.0 and on rusty main @ fedbb3a. The steps continue from Quickstart step 6: `$TID` is its thread, `$CP_ID` the parked checkpoint (step 1, `next: [\"approve\"]`), and `$RESUME_RUN_ID` the run_id from step 6's `metadata` frame." },
      { type: "p", text: "Branch a thread at an earlier checkpoint, run the branch, and see where the two runs differ." },
      { type: "h", text: "1. Fork" },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/threads/$TID/fork \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"new_thread_id\": \"branch-a\", \"checkpoint_id\": \"'$CP_ID'\"}'\n# 201 {\"checkpoints_copied\": 2, \"thread_id\": \"branch-a\"}" },
      { type: "p", text: "The fork copies the history up to and including `$CP_ID`. Omit `checkpoint_id` to copy the full history; omit `new_thread_id` to get a generated id. Built from main, the answer also carries `seed_length`. Errors: `404` unknown thread or checkpoint, `400` the source has no checkpoints, `409` the new thread id is taken." },
      { type: "h", text: "2. Run the branch" },
      { type: "code", lang: "bash", text: "# replay from the parked checkpoint: it stops at approve again\ncurl -s -X POST localhost:8080/threads/branch-a/runs/wait \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"checkpoint\": {\"checkpoint_id\": \"'$CP_ID'\"}}'\n# {\"status\": \"interrupted\", …}\n\n# decide differently on the branch; save this run_id as FORK_RUN_ID\ncurl -s -X POST localhost:8080/threads/branch-a/runs/wait \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"command\": {\"resume\": {\"approved\": false, \"reviewer\": \"bob\"}}}'" },
      { type: "h", text: "3. Compare" },
      { type: "p", text: "Diff the two runs that made the decision: the original resume and the branch's resume." },
      { type: "code", lang: "bash", text: 'curl -s "localhost:8080/runs/diff?base=$RESUME_RUN_ID&branch=$FORK_RUN_ID"' },
      { type: "code", lang: "response", text: '{\n  "first_divergent_seq": 0,\n  "added": [ …7 events… ],\n  "removed": [ …7 events… ],\n  "step_diffs": [\n    { "step": 1, "channels": [\n      { "channel": "approval",\n        "base":   { "approved": true,  "reviewer": "alice" },\n        "branch": { "approved": false, "reviewer": "bob" } }\n    ] }\n  ],\n  "base_totals":   { "events": 7, "tokens": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }, "cost_usd": 0.0 },\n  "branch_totals": { "events": 7, "tokens": { … }, "cost_usd": 0.0 }\n}' },
      { type: "p", text: "The divergence is at `seq` 0 because each run's first event, `resume`, carries its own decision. An unknown run id answers `404`." },
      { type: "table", head: ["Field", "Meaning"], cols: "180px 1fr", rows: [
        ["first_divergent_seq", "Where the runs parted; null when they match"],
        ["added / removed", "Events from the divergence on, in branch and base"],
        ["step_diffs", "Which state channels changed at which super-step"],
        ["base_totals / branch_totals", "Token and cost totals"],
      ] },
      { type: "p", text: "Also available as `replay_run` and `diff_runs` in Python, and `replayRun` and `diffRuns` in TypeScript. Studio's compare view reads the same endpoints." },
      { type: "links", text: "Next:", items: [
        { page: "eval", label: "Evaluate with datasets" },
      ] },
    ],
  },

  eval: {
    title: "Evaluate with datasets",
    learn: ["9.2"],
    source: ["rusty-eval/README.md", "rusty-eval/src/lib.rs"],
    blocks: [
      { type: "p", text: "Run an agent over a versioned dataset, check each run with deterministic assertions, and compare a candidate against a baseline. `rusty-eval` is a library; no live model is required." },
      { type: "code", lang: "Cargo.toml", text: 'rusty-eval = "0.1"' },
      { type: "h", text: "1. Write a dataset" },
      { type: "p", text: "JSONL. Line 1 is the header; each following line is a case with `id`, `input`, `expect`, and `tags`." },
      { type: "code", lang: "evals/math_tools_v1.jsonl", text: '{"kind":"header","format_version":1,"name":"math-tools","version":"1.0.0"}\n{"kind":"case","id":"add-two","input":{"messages":[{"role":"user","content":"2+3?"}]},"expect":{"tool_trajectory":[{"name":"calculator","args":{"/op":"add"}}],"state":[{"pointer":"/messages/3/content","expected":"the answer is 5"}]},"tags":["smoke"]}' },
      { type: "h", text: "2. Run an experiment" },
      { type: "code", lang: "rust", text: 'use rusty_eval::{compare, CompareThresholds, Dataset, ExperimentConfig, ExperimentRunner, PreparedRun};\n\nlet dataset = Dataset::load("evals/math_tools_v1.jsonl")?;\nlet runner = ExperimentRunner::new(ExperimentConfig::new().with_runs_per_case(3));\n\nlet baseline = runner\n    .run(&dataset, |case, journal| {\n        // Build the agent for this run. Wire the journal into a recording\n        // graph so model and tool calls become evidence.\n        let graph = create_react_agent_with_recording(model(), tools(), journal.clone())?;\n        Ok(PreparedRun::new(graph, spec()))\n    })\n    .await?;' },
      { type: "h", text: "3. Compare" },
      { type: "code", lang: "rust", text: "let verdict = compare(&baseline, &candidate, &CompareThresholds::default());\nif verdict.regressed {\n    for r in &verdict.regressions { eprintln!(\"{r:?}\"); }\n}" },
      { type: "h", text: "Assertions" },
      { type: "table", head: ["Assertion", "Checks"], cols: "170px 1fr", rows: [
        ["tool_call_order", "Expected calls appear in order, with argument matchers"],
        ["tool_call_count", "Exact number of calls to one tool"],
        ["state[…]", "Final-state value at a JSON pointer"],
        ["no_tool_call", "Forbidden tools are never called"],
        ["max_cost / max_latency", "Run totals within bounds"],
      ] },
      { type: "p", text: "For a statistical check, `detect_pass_rate_regression` pairs outcomes by case and repetition and reports `insufficient_evidence` when the sample is too small. `cluster_failures` groups failed runs by cause. `ModelJudge` adapts any `ChatModel` into a structured judge; `RuleBasedJudge` needs no model." },
      { type: "p", text: "In Studio, the Tests view holds datasets, experiments, and release gates. Over HTTP they are under `/datasets` and `/experiments` (see HTTP API)." },
      { type: "links", text: "Next:", items: [
        { page: "standin", label: "Test against a stand-in" },
        { page: "envs", label: "Environments, canary, rollback" },
      ] },
    ],
  },

  standin: {
    title: "Test against a stand-in",
    source: ["docs/how-to.md", "rusty-server/src/routes.rs"],
    blocks: [
      { type: "p", text: "A stand-in answers a connection's calls from a seeded dataset, in the system's own dialect, so you can run an agent end to end without touching the live system. Reset it to the seed between tests." },
      { type: "meta", text: "Before you start: add a connector. A stand-in needs an existing connection whose connector has a dialect." },
      { type: "list", numbered: true, items: [
        { b: "Go to Connectors → New stand-in ", t: "(in the Stand-ins section)." },
        { b: "Pick the connection. ", t: "The seed starts from the dialect's starter data." },
        { b: "Check the connection against it. ", t: "Open the connection and choose Test against <stand-in name>." },
        { b: "Run the agent against it. ", t: "In the agent's test panel, choose Stand-in · <name> as the target." },
        { b: "Reset ", t: "the stand-in to its seed when you want a clean run. Test suites can reset it for you." },
      ] },
      { type: "h", text: "Over HTTP" },
      { type: "table", head: ["Method", "Path", "Purpose"], cols: "80px 1.3fr 1.7fr", rows: [
        ["GET", "/worlds", "List stand-ins"],
        ["GET", "/worlds/dialects", "Dialects that can stand in for a connector"],
        ["GET", "/worlds/starter", "A dialect's starter seed"],
        ["POST", "/worlds", "Create a stand-in"],
        ["POST", "/worlds/{id}/reset", "Reset to the seed"],
        ["DELETE", "/worlds/{id}", "Delete a stand-in"],
      ] },
      { type: "links", text: "Next:", items: [
        { page: "eval", label: "Evaluate with datasets" },
        { page: "connector", label: "Add a connector" },
      ] },
    ],
  },

  /* ----------------------------------------------------------------- Deploy */
  release: {
    title: "Build a release binary",
    learn: ["6.5"],
    source: ["rusty-server/README.md", "docs/server-quickstart.md"],
    blocks: [
      { type: "p", text: "Your graphs compile into your server. Build one binary and ship it." },
      { type: "code", lang: "bash", text: "cargo build --release\n# -> target/release/<your-binary>" },
      { type: "p", text: "The demo server in the Rusty repo builds the same way: `cargo build --release -p rusty-agent-server --example server_demo` writes `target/release/examples/server_demo`." },
      { type: "meta", text: "Tested on 2026-09-28 at rusty main @ fedbb3a: the release build of server_demo took 2 minutes 25 seconds on an Apple M2 Max with crates already downloaded, and produced a 44 MB binary. With `RUSTY_ENV=production` and `RUSTY_OPEN=1` it exits with `refusing to serve production without authentication`; with the bootstrap administrator it boots and requires sign-in." },
      { type: "h", text: "Production checklist" },
      { type: "list", items: [
        { b: "Set RUSTY_ENV=production. ", t: "The server will not start without authentication." },
        { b: "Configure keys or users. ", t: "See Authentication and API keys." },
        { b: "Choose storage. ", t: "Use Postgres (`postgres` feature) for shared state; JSON files are for a single node." },
        { b: "Allow browser origins. ", t: "If a browser client on another origin calls the server, add `with_cors_allowed_origin`." },
        { b: "Make nodes safe to repeat. ", t: "A node interrupted mid-step runs again from its start on resume." },
        { b: "Behind a proxy, don't buffer SSE. ", t: "For nginx, send `X-Accel-Buffering: no` and flush per event." },
      ] },
      { type: "h", text: "Shutdown" },
      { type: "p", text: "`serve` drains on SIGINT and SIGTERM. It stops accepting connections, cancels in-flight runs at their next super-step boundary (where a checkpoint was just saved), and answers new runs with `503`. The drain is bounded by `with_shutdown_grace`, 25 seconds by default. A later start resumes the work from its checkpoints." },
      { type: "links", text: "Next:", items: [
        { page: "docker", label: "Docker" },
        { page: "postgres", label: "Postgres" },
      ] },
    ],
  },

  docker: {
    title: "Docker",
    source: ["docker-compose.yml", "scripts/studio_container.py", "rusty-server/README.md"],
    blocks: [
      { type: "p", text: "Run the demo stack in containers, or package your own server in a small image." },
      { type: "h", text: "Demo stack with docker compose" },
      { type: "diagram", id: "docker-topology" },
      { type: "p", text: "The Studio container serves `studio/ui/dist` from your checkout, which git does not track. Build it once first:" },
      { type: "code", lang: "bash", text: "cd studio/ui && npm ci && npm run build && cd ../..\ndocker compose up --build" },
      { type: "meta", text: "Tested on 2026-09-28 at rusty main @ fedbb3a: the server image build fails with failed to read `/app/rusty-api/Cargo.toml`. The inline Dockerfile in docker-compose.yml copies four of the eight workspace crates, and the server also embeds files from catalog/. Until the repo fixes it, use ./scripts/dev.sh, or add the lines below after `COPY rusty-otel/ rusty-otel/` in docker-compose.yml. With them the build loads the workspace and compiles; a full image build was not completed during testing." },
      { type: "code", lang: "docker-compose.yml", text: "        COPY rusty-api/ rusty-api/\n        COPY rusty-eval/ rusty-eval/\n        COPY rusty-store/ rusty-store/\n        COPY rusty-store-conformance/ rusty-store-conformance/\n        COPY catalog/ catalog/" },
      { type: "table", head: ["Service", "Address", "Notes"], cols: "1fr 1.2fr 2fr", rows: [
        ["Rusty Studio", "http://localhost:8000/", "If Studio asks for a server, use base URL /api"],
        ["Rusty API", "http://localhost:8100/", "Try curl localhost:8100/ok; other routes need sign-in"],
        ["Data", "volume server-data", "Mounted at /app/data in the server container"],
      ] },
      { type: "p", text: "The server image is a debug build of `server_demo` on `rust:1-slim`, meant for demos. The first boot creates the administrator; read the password with:" },
      { type: "code", lang: "bash", text: "docker compose exec server cat /app/data/server-demo-checkpoints/bootstrap-admin.txt" },
      { type: "h", text: "Your own server image" },
      { type: "code", lang: "Dockerfile", text: 'FROM rust:1-bookworm AS build\nWORKDIR /app\nCOPY . .\nRUN cargo build --release\n\n# the binary links glibc, so use a glibc base, not scratch\nFROM gcr.io/distroless/cc-debian12\nCOPY --from=build /app/target/release/my-agent /my-agent\nENTRYPOINT ["/my-agent"]' },
      { type: "p", text: "Replace `my-agent` with your binary's name. Bind to `0.0.0.0` inside the container, as the Quickstart does. Mount a volume at your `store_path`, or use Postgres, so checkpoints outlive the container. This Dockerfile was not built during testing." },
      { type: "links", text: "Next:", items: [
        { page: "postgres", label: "Postgres" },
        { page: "release", label: "Production checklist" },
      ] },
    ],
  },

  postgres: {
    title: "Postgres",
    learn: ["6.5"],
    source: ["rusty-server/README.md", "rusty-server/src/server_store.rs", "rusty-core/src/checkpoint_postgres.rs"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28 at rusty main @ fedbb3a with a throwaway postgres:16-alpine container: the Quickstart graph with `with_postgres`, the tables below, the `409` on rollback, and the Postgres test suite (6 passed, about 2 minutes including the compile)." },
      { type: "p", text: "Move checkpoints and all server records from JSON files to Postgres, for shared state or several replicas." },
      { type: "h", text: "1. Turn on the feature" },
      { type: "code", lang: "Cargo.toml", text: 'rusty-agent-server = { version = "0.12", features = ["postgres"] }' },
      { type: "h", text: "2. Point the server at a database" },
      { type: "code", lang: "rust", text: 'let config = ServerConfig::new("0.0.0.0:8080".parse()?, "./data/checkpoints")\n    .with_postgres(std::env::var("DATABASE_URL")?);\n// e.g. postgres://user:pass@localhost/rusty' },
      { type: "p", text: "The server does not read `DATABASE_URL` itself; read it in your `main.rs` as above. The demo server has no Postgres switch." },
      { type: "h", text: "What changes" },
      { type: "table", head: ["Data", "Default", "With Postgres"], cols: "1fr 1.5fr 1.3fr", rows: [
        ["Checkpoints", "{store_path}/{thread_id}/…", "rusty_checkpoints"],
        ["Threads", "{store_path}/threads/", "server_threads"],
        ["Assistants, crons", "{store_path}/assistants/, crons/", "server_assistants, server_crons"],
        ["KV store", "{store_path}/store/", "server_kv"],
        ["Run journals", "{store_path}/journals/", "server_journals"],
      ] },
      { type: "p", text: "Other server records (tasks, memory, deployments, sessions, and more) move to their own `server_*` tables too. Tables are created on first connect (`CREATE TABLE IF NOT EXISTS`). Connections open lazily, so the server starts even if the database is briefly down; calls fail with `500` until it is back. `GET /info` reports `\"checkpointer\": \"postgres\"`." },
      { type: "h", text: "One difference" },
      { type: "p", text: "Rollback (`DELETE /threads/{id}/runs/{run_id}`) answers `409` on Postgres. Fork, replay, crons, journals, and restarts work the same on both backends." },
      { type: "h", text: "Run the Postgres tests" },
      { type: "p", text: "Use a scratch database. To start one in Docker:" },
      { type: "code", lang: "bash", text: "docker run -d --rm --name rusty-pg -e POSTGRES_USER=rusty -e POSTGRES_PASSWORD=pw \\\n  -e POSTGRES_DB=rusty_test -p 127.0.0.1:55432:5432 postgres:16-alpine\n\n# from a clone of the rusty repo\nDATABASE_URL=postgres://rusty:pw@127.0.0.1:55432/rusty_test \\\n  cargo test -p rusty-agent-server --features postgres --test postgres_store -- --ignored\n# test result: ok. 6 passed\n\ndocker stop rusty-pg" },
      { type: "links", text: "Next:", items: [
        { page: "backup", label: "Backup" },
        { page: "envs", label: "Environments, canary, rollback" },
      ] },
    ],
  },

  envs: {
    title: "Environments, canary, rollback",
    learn: ["9.1", "9.2", "9.3"],
    source: ["docs/operations-plane-design.md", "rusty-server/src/deploy.rs", "rusty-server/tests/deployments.rs"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28 against the Quickstart server built from rusty main @ fedbb3a: declare, revision, promote, canary set and clear, rollback, pointer, health, and journal." },
      { type: "p", text: "Promote a graph through dev, staging, and prod, send a fraction of new runs to a canary, and roll back to the previous revision. All of it runs in one server; environments are records, not separate processes." },
      { type: "diagram", id: "environments" },
      { type: "list", items: [
        { b: "Revision: ", t: "an immutable, content-addressed record of what may serve: the graph, its topology hash, and the pinned configuration." },
        { b: "Environment: ", t: "a named pointer with an `active` slot and a `canary` slot, plus an optional gate and approval rule." },
        { b: "Runs bind at admission. ", t: "A new run takes the revision its environment points to. Runs already in flight keep theirs." },
      ] },
      { type: "p", text: "Every mutation needs an `author`, for example `{\"type\": \"human\", \"human_id\": \"amjad\"}`. With authentication on, add your `X-Api-Key` header." },
      { type: "h", text: "1. Declare environments" },
      { type: "code", lang: "bash", text: "AUTHOR='{\"type\": \"human\", \"human_id\": \"amjad\"}'\n\nfor env in dev staging prod; do\n  curl -s -X POST localhost:8080/deployments/environments \\\n    -H 'Content-Type: application/json' \\\n    -d '{\"name\": \"'$env'\", \"author\": '\"$AUTHOR\"'}'\ndone" },
      { type: "p", text: "Add `\"approval_required\": true` or a `\"gate\": {\"policy\": …, \"dataset_version\": …}` to guard promotions into an environment." },
      { type: "h", text: "2. Create a revision" },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/deployments/revisions \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"graph\": \"publisher\", \"source_environment\": \"dev\", \"author\": '\"$AUTHOR\"'}'\n# 201 {\"created\": true, \"revision\": {\"revision_id\": \"…\", …}}" },
      { type: "p", text: "Revisions are content-addressed. Posting the same content again returns the existing revision with `\"created\": false`. A second revision needs different content, for example another `source_environment`. Promote, canary, and rollback answer `201` with `{\"applied\": true, \"journaled\": true, \"pointer\": {…}}`." },
      { type: "h", text: "3. Promote" },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/deployments/environments/staging/promote \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"revision_id\": \"'$REV'\", \"author\": '\"$AUTHOR\"'}'" },
      { type: "p", text: "Promotion sets `active` and clears any canary. In a gated environment, the gate evaluates the revision against the named dataset version first. A comparison with too little evidence refuses the promotion." },
      { type: "h", text: "4. Canary" },
      { type: "code", lang: "bash", text: "curl -s -X PUT localhost:8080/deployments/environments/staging/canary \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"revision_id\": \"'$REV2'\", \"fraction\": 0.1, \"author\": '\"$AUTHOR\"'}'\n\n# clear it\ncurl -s -X DELETE localhost:8080/deployments/environments/staging/canary \\\n  -H 'Content-Type: application/json' -d '{\"author\": '\"$AUTHOR\"'}'" },
      { type: "p", text: "Each new run is assigned by a seeded draw, so a recorded run can show which slot it got. There is no automatic traffic controller; you change the fraction explicitly." },
      { type: "h", text: "5. Roll back" },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8080/deployments/environments/prod/rollback \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"author\": '\"$AUTHOR\"', \"cause\": \"error rate after promote\"}'" },
      { type: "p", text: "Rollback points `active` back at the revision that served before. The restored revision is the same immutable record, byte for byte." },
      { type: "h", text: "Watch it" },
      { type: "table", head: ["Method", "Path", "Returns"], cols: "80px 1.6fr 1.4fr", rows: [
        ["GET", "/deployments/environments/{name}/pointer", "Active and canary revisions"],
        ["GET", "/deployments/health", "Per environment: pointer, canary, last gate decision, recent outcomes"],
        ["GET", "/deployments/journal", "Every deployment act, in order"],
        ["POST", "/deployments/shadows", "Run a revision on recorded traffic without real side effects"],
        ["PUT · GET", "/deployments/secrets", "Environment-scoped secrets (stored encrypted)"],
      ] },
      { type: "links", text: "Next:", items: [
        { page: "eval", label: "Evaluate with datasets" },
        { page: "backup", label: "Backup" },
      ] },
    ],
  },

  /* ---------------------------------------------------------------- Operate */
  backup: {
    title: "Backup",
    source: ["rusty-server/src/estate.rs", "docs/backup.md"],
    blocks: [
      { type: "meta", text: "Tested on 2026-09-28 against the demo server on rusty main @ fedbb3a: a backup, a restore into an empty store, and verify-log." },
      { type: "p", text: "Take a copy of everything the server holds, while it runs. How depends on the storage backend." },
      { type: "h", text: "JSON-file store: estate backups" },
      { type: "p", text: "An estate backup is a gzipped tar of the store directory with a `manifest.json` that records when it was taken, by whom, from which server version, and what it holds. Records are written atomically, so each file in the archive is whole." },
      { type: "code", lang: "bash", text: "curl -s -X POST localhost:8100/estate/backups -b cookies.txt     # or -H \"X-Api-Key: …\"\ncurl -s localhost:8100/estate -b cookies.txt                      # holdings, backups, last restore" },
      { type: "code", lang: "response", text: '{\n  "name": "estate-20260928T233950Z.tar.gz",\n  "path": "./data/server-demo-checkpoints-backups/estate-20260928T233950Z.tar.gz",\n  "bytes": 313948,\n  "manifest": { "taken_at": "…", "by": { … }, "server_version": "0.12.0",\n                "counts": { "agents": 3, "threads": 2, "runs": 5, … }, "files": 100, … },\n  "person_keys": "estate-20260928T233950Z-person-keys.tar.gz"\n}' },
      { type: "p", text: "`POST /estate/backups` answers `201`. On the demo server a backup took well under a second." },
      { type: "list", items: [
        { b: "Where: ", t: "`{store}-backups` beside the store directory, never inside it. Set `with_backup_dir` or `RUSTY_BACKUP_DIR` (demo server) to change it." },
        { b: "Files: ", t: "`estate-….tar.gz` and a sibling `estate-…-person-keys.tar.gz`. Keep them together; without the person keys, people's records read as absent after restore." },
        { b: "Secrets: ", t: "the archive contains the broker master key. Store it as carefully as the store itself." },
        { b: "Scope: ", t: "`POST /estate/backups` needs the `estate:write` scope; `GET /estate` needs `estate:read`." },
      ] },
      { type: "h", text: "Postgres: back up the database" },
      { type: "p", text: "With `with_postgres`, the data lives in Postgres, so the estate archive is not a full backup. Use Postgres's own tools. The reference topology in `docs/backup.md`:" },
      { type: "table", head: ["What", "How"], cols: "1fr 2fr", rows: [
        ["Base backups", "pg_basebackup on a schedule, uploaded to an S3-compatible object store"],
        ["WAL", "Continuous archiving through archive_command"],
        ["Zero loss for committed writes", "synchronous_commit = remote_apply"],
        ["Blob store", "Bucket versioning, set on the bucket, not in Rusty"],
      ] },
      { type: "h", text: "Verify a backup" },
      { type: "p", text: "`rustyness verify-log` checks a journal snapshot: the `journal` object of a run's replay fixture. The journal files inside the store are sealed, so export the snapshot through the API from a server running on the restored store:" },
      { type: "code", lang: "bash", text: "curl -s localhost:8100/runs/$RUN_ID/fixture -b cookies.txt | jq .journal > journal.json\n\n# from a clone of the rusty repo\ncargo run -p rusty-agent-server --bin rustyness -- verify-log journal.json\n# {\"passed\": true, \"findings\": [], \"event_count\": 10}\ncargo run -p rusty-agent-server --bin rustyness -- verify-log journal.json --artifacts <store dir>" },
      { type: "p", text: "It checks for gap-free positions, paired turn events, and structural integrity; with `--artifacts` it also checks that every artifact reference resolves. It exits `0` when the journal passes and `2` when the file cannot be parsed, for example a sealed journal file or the raw `/runs/{id}/events` output." },
      { type: "links", text: "Next:", items: [
        { page: "recovery", label: "Recovery" },
      ] },
    ],
  },

  recovery: {
    title: "Recovery",
    learn: ["4.4"],
    source: ["rusty-server/src/estate.rs", "docs/recovery.md", "rusty-server/tests/crash_recovery.rs"],
    blocks: [
      { type: "p", text: "Bring a deployment back after a crash or a lost machine." },
      { type: "h", text: "After a crash" },
      { type: "p", text: "Start the server again on the same store. Checkpoints, thread records, and queued runs are on disk. Work cut off mid-run continues from its last checkpoint when the thread runs again, and a run waiting for a person is still waiting. `rusty-server/tests/crash_recovery.rs` kills the server with SIGKILL and checks this path in CI. To run it yourself, build the examples first; the test starts them as separate processes:" },
      { type: "code", lang: "bash", text: "cargo build --workspace --examples\ncargo test -p rusty-agent-server --test crash_recovery\n# test result: ok. 1 passed" },
      { type: "h", text: "Restore an estate backup" },
      { type: "list", numbered: true, items: [
        { b: "Start from an empty store directory. ", t: "A restore never overwrites a store that already holds data; it is recorded as skipped." },
        { b: "Put both archives side by side: ", t: "`estate-….tar.gz` and `estate-…-person-keys.tar.gz`." },
        { b: "Boot with the archive named. ", t: "`with_restore_from(path)` in code, or `RUSTY_RESTORE_FROM` for the demo server." },
        { b: "Check the result. ", t: "`GET /estate` reports it under `restore` (the archive, the file count, the manifest, and `outcome: restored`) and `restored_from` (when it ran and the person-keys archive it used)." },
      ] },
      { type: "code", lang: "bash", text: "# the demo server: point it at a new, empty store directory\nRUSTY_DEMO_STORE=./data/restored \\\n  RUSTY_RESTORE_FROM=$PWD/data/server-demo-checkpoints-backups/estate-….tar.gz \\\n  ./scripts/dev.sh\n\ncurl -s localhost:8100/estate -b cookies.txt | jq .restore.outcome    # \"restored\"" },
      { type: "p", text: "The person-keys archive is found beside the main archive. Booting again with the same settings leaves the store alone: `outcome` is `skipped` and `reason` says the store is not empty." },
      { type: "h", text: "Restore Postgres" },
      { type: "list", numbered: true, items: [
        { b: "Restore the latest base backup.", t: "" },
        { b: "Replay archived WAL ", t: "to the point in time you want." },
        { b: "Verify journals ", t: "with `rustyness verify-log` (see Backup)." },
        { b: "Start the server ", t: "and confirm a paused run resumes." },
      ] },
      { type: "p", text: "A restore counts only when the journals verify. Checkpoints and derived views can be recomputed; the journal is the record." },
      { type: "links", text: "Next:", items: [
        { page: "backup", label: "Backup" },
        { page: "otel", label: "Tracing with OpenTelemetry" },
      ] },
    ],
  },

  otel: {
    title: "Tracing with OpenTelemetry",
    source: ["rusty-otel/README.md", "rusty-otel/examples/otel_demo.rs"],
    blocks: [
      { type: "p", text: "Send the executor's spans to any OpenTelemetry backend. The runtime is already instrumented; `rusty-otel` installs the subscriber and the exporter in one call." },
      { type: "code", lang: "Cargo.toml", text: 'rusty-otel = "0.1"' },
      { type: "h", text: "Local logs only" },
      { type: "code", lang: "rust", text: 'let _guard = rusty_otel::init_local("my-agent")?;' },
      { type: "h", text: "Export to a collector" },
      { type: "code", lang: "rust", text: 'let mut guard = rusty_otel::init(rusty_otel::OTelConfig {\n    service_name: "my-agent".into(),\n    otlp_endpoint: Some("http://localhost:4318/v1/traces".into()),\n    log_filter: None, // RUST_LOG, else "info,rusty_agent_runtime=debug"\n})?;\n\n// ... run graphs ...\n\nguard.shutdown(); // flush before exit; also runs on drop' },
      { type: "list", items: [
        { b: "Call init once per process. ", t: "A second call returns `OTelError::SubscriberAlreadyInstalled`." },
        { b: "Keep the guard alive. ", t: "Dropping it early loses batched spans." },
        { b: "The log filter gates stderr only. ", t: "`RUST_LOG=warn` still exports the full trace." },
      ] },
      { type: "h", text: "What you get" },
      { type: "table", head: ["Span", "Fields"], cols: "170px 1fr", rows: [
        ["rusty.run", "thread_id, max_steps, resume, replay. One per run; the trace root."],
        ["rusty.super_step", "step, active_nodes (a count; DEBUG level)"],
        ["rusty.node", "node, step. One per node task."],
        ["events", "barrier merge, run complete, interrupt, errors"],
      ] },
      { type: "h", text: "Try it with Jaeger" },
      { type: "code", lang: "bash", text: "cd rusty-otel\ndocker compose up -d            # OTel Collector on 4317/4318 + Jaeger\nOTEL_DEMO_ENDPOINT=http://localhost:4318/v1/traces cargo run --example otel_demo\nopen http://localhost:16686     # service: rusty-otel-demo\ndocker compose down" },
      { type: "meta", text: "Tested on 2026-09-28 with rusty main @ fedbb3a: Jaeger listed the service rusty-otel-demo with rusty.run, rusty.super_step, and rusty.node spans." },
      { type: "links", text: "Next:", items: [
        { page: "inspect", label: "Inspect a run" },
        { page: "upgrade", label: "Upgrading and versioning" },
      ] },
    ],
  },

  upgrade: {
    title: "Upgrading and versioning",
    source: ["docs/versioning.md", "docs/stability.md", "CHANGELOG.md"],
    blocks: [
      { type: "p", text: "Each package has its own version. Before 1.0, a minor bump may break things; a patch bump never does." },
      { type: "table", head: ["Bump", "May contain"], cols: "180px 1fr", rows: [
        ["0.x.y → 0.x.y+1", "Fixes only. No API or wire-format changes."],
        ["0.x → 0.x+1", "Breaking changes, each listed in CHANGELOG.md"],
      ] },
      { type: "h", text: "Before you upgrade" },
      { type: "list", numbered: true, items: [
        { b: "Read the CHANGELOG ", t: "section for every package whose version moves." },
        { b: "Check checkpoints. ", t: "Checkpoints are readable within one minor line. Across a minor bump, look for a format note and migration path in the CHANGELOG." },
        { b: "Upgrade server and clients together. ", t: "The tested pairing is client 0.5.x with server 0.12.x. The clients do not check the protocol version yet." },
        { b: "Upgrade workers before callers ", t: "if the remote-execution protocol changes." },
        { b: "Pin exact versions ", t: "(`=0.12.0`) if rebuilds must not change behavior." },
      ] },
      { type: "h", text: "Compatibility checks" },
      { type: "table", head: ["Between", "Governed by", "Current"], cols: "1.5fr 1.4fr 80px", rows: [
        ["Server and clients", "api_protocol_version in GET /info", "1"],
        ["RemoteNode and rusty-worker", "PROTOCOL_VERSION (rusty-core/src/remote.rs)", "1"],
        ["Checkpoint writer and reader", "rusty-agent-runtime minor version", "0.12"],
      ] },
      { type: "code", lang: "bash", text: "curl -s localhost:8080/info    # includes version, and api_protocol_version on main" },
      { type: "p", text: "`api_protocol_version` is on rusty main and not in the 0.12.0 release: a 0.12.0 server's `/info` returns `service`, `version`, `checkpointer`, `server_store`, `store_path`, and `graphs`." },
      { type: "p", text: "MSRV is Rust 1.87, checked in CI per crate. Before 1.0, an MSRV bump can land in a minor release." },
      { type: "links", text: "Next:", items: [
        { page: "stability", label: "Stability policy" },
      ] },
    ],
  },

  /* -------------------------------------------------------------- Reference */
  api: {
    title: "HTTP API",
    source: ["docs/api/openapi.yaml", "docs/api/README.md", "rusty-server/src/routes.rs"],
    blocks: [
      { type: "p", text: "The server's HTTP surface. `docs/api/openapi.yaml` is an OpenAPI 3.1 spec of the core routes (56 operations); the server's scope table on main @ fedbb3a declares 335 routes (docs/api/README.md still says 295). Handler errors are `{\"error\": <kind>, \"message\": <detail>}`. Two other shapes exist: a refused key or session answers `401` with a problem body (`type`, `title`, `status`, `reason`), and a request body that does not parse answers `422` with a plain-text message. With authentication on, send `X-Api-Key` or a session cookie." },
      { type: "meta", text: "Tested on 2026-09-28: every route in the tables below answered on the demo server built from rusty main @ fedbb3a (a handler reply, not a missing route). GET /runs and api_protocol_version are on main only; the 0.12.0 release answers GET /runs with 404." },
      { type: "h", text: "Health and auth" },
      { type: "table", head: ["Method", "Path", "Purpose"], cols: "80px 1.4fr 1.6fr", rows: [
        ["GET", "/ok", "Liveness probe"],
        ["GET", "/health", "Readiness: checks backing stores"],
        ["GET", "/info", "Version, api_protocol_version, checkpointer, graphs"],
        ["POST", "/auth/login", "Sign in; sets the rusty_session cookie"],
        ["POST", "/auth/logout", "Sign out"],
        ["POST", "/auth/password", "Change your password"],
        ["GET", "/me", "Who is signed in"],
      ] },
      { type: "h", text: "Threads" },
      { type: "table", head: ["Method", "Path", "Purpose"], cols: "80px 1.4fr 1.6fr", rows: [
        ["POST", "/threads", "Create a thread bound to a graph"],
        ["GET", "/threads/{id}", "Fetch a thread"],
        ["GET", "/threads/{id}/state", "Latest checkpoint: values, next, checkpoint"],
        ["POST", "/threads/{id}/state", "Write a new checkpoint"],
        ["POST", "/threads/{id}/history", "List checkpoints, newest first"],
        ["POST", "/threads/{id}/fork", "Copy checkpoints onto a new thread"],
        ["POST", "/threads/{id}/regenerate", "Drop the thread's checkpoints, keep the record"],
        ["DELETE", "/threads/{id}/runs/{run_id}", "Roll back a finished run's checkpoints"],
      ] },
      { type: "h", text: "Runs" },
      { type: "table", head: ["Method", "Path", "Purpose"], cols: "80px 1.4fr 1.6fr", rows: [
        ["POST", "/threads/{id}/runs", "Start a background run (202, status running)"],
        ["POST", "/threads/{id}/runs/wait", "Run and wait, up to one hour (504 after)"],
        ["POST", "/threads/{id}/runs/stream", "Run and stream frames over SSE"],
        ["GET", "/runs", "Recent runs, latest first"],
        ["GET", "/runs/{id}", "Status and result"],
        ["POST", "/runs/{id}/cancel", "Cancel a running run"],
        ["GET", "/runs/{id}/stream", "Attach to a run's SSE; honors Last-Event-ID"],
        ["GET", "/runs/{id}/events", "The run journal"],
        ["GET", "/runs/{id}/fixture", "Portable replay fixture"],
        ["POST", "/runs/replay", "Replay a journaled run and verify it"],
        ["GET", "/runs/diff?base=&branch=", "Diff two runs' journals"],
        ["GET", "/runs/{id}/receipt", "Signed run receipt"],
      ] },
      { type: "h", text: "Assistants, connectors, skills" },
      { type: "table", head: ["Method", "Path", "Purpose"], cols: "80px 1.4fr 1.6fr", rows: [
        ["POST · GET", "/assistants", "Create or list assistants (named graph configs)"],
        ["GET", "/assistants/{id}", "Fetch one"],
        ["POST", "/assistants/{id}/archive · /restore", "Archive or restore"],
        ["POST · GET", "/connectors/instances", "Create or list connections"],
        ["PUT · DELETE", "/connectors/instances/{id}", "Rotate credentials or revoke"],
        ["POST", "/connectors/check", "Test a config without saving"],
        ["POST", "/connectors/describe · /openapi", "Draft or build a manifest from OpenAPI"],
        ["GET", "/skills/library", "Installable skills"],
        ["GET · DELETE", "/skills/{name}", "Fetch or remove a skill"],
        ["POST", "/skills/{name}/promote", "Promote a learned revision to active"],
      ] },
      { type: "h", text: "Knowledge, memory, evaluation" },
      { type: "table", head: ["Method", "Path", "Purpose"], cols: "80px 1.4fr 1.6fr", rows: [
        ["GET · POST", "/knowledge/sources", "List or register sources"],
        ["GET", "/knowledge/sources/{id}", "Fetch one source"],
        ["POST", "/knowledge/query", "Query the knowledge base"],
        ["POST", "/memory · /memory/query", "Write or query durable memory"],
        ["POST", "/memory/conflicts · /memory/forget", "List conflicts; forget one memory"],
        ["GET", "/memory/{id}", "Fetch one memory"],
        ["GET · DELETE", "/datasets/{name}", "Fetch or delete a dataset"],
        ["POST", "/datasets/sweep", "Register changed dataset files"],
        ["POST · GET", "/experiments", "Run or list experiments"],
        ["GET", "/experiments/{id} · /report", "Fetch one; its judged report"],
        ["POST", "/experiments/{id}/cancel", "Cancel a running experiment"],
        ["GET", "/experiments/compare", "Compare two experiments"],
      ] },
      { type: "h", text: "Served but not yet in the spec" },
      { type: "p", text: "These are verified in `rusty-server/src/routes.rs`: crons (`/crons`), the KV store (`/store/{ns}/{key}`), tasks (`/tasks`), deployments (`/deployments/…`), estate and backups (`/estate`), stand-ins (`/worlds`), and receipts (`/receipts/verify`). The spec will cover them as it grows." },
      { type: "links", text: "Next:", items: [
        { page: "py", label: "Python client" },
        { page: "ts", label: "TypeScript client" },
        { page: "config", label: "Server configuration" },
      ] },
    ],
  },

  config: {
    title: "Server configuration",
    source: ["rusty-server/src/lib.rs", "rusty-server/README.md"],
    blocks: [
      { type: "p", text: "Configure the server in code with `ServerConfig::new(bind_addr, store_path)` and builder methods, then pass it to `serve(registry, config)`. The example below compiles against rusty main @ fedbb3a (checked 2026-09-28)." },
      { type: "code", lang: "rust", text: 'let config = ServerConfig::new("0.0.0.0:8080".parse()?, "./data/checkpoints")\n    .with_api_key("sk-…")\n    .with_cors_allowed_origin("https://studio.example.com")\n    .with_shutdown_grace(std::time::Duration::from_secs(25));\nserve(registry, config).await?;' },
      { type: "h", text: "Core" },
      { type: "table", head: ["Builder", "Default", "Purpose"], cols: "1.5fr 1fr 1.8fr", rows: [
        ["new(bind_addr, store_path)", "0.0.0.0:8080, ./data/checkpoints", "Listen address; JSON-file store root"],
        ["with_postgres(url)", "JSON files", "Checkpoints and records in Postgres (feature postgres)"],
        ["with_max_concurrent_runs_per_thread(n)", "1", "Queue depth per thread; one run is active at a time"],
        ["with_event_log_capacity(n)", "1000", "SSE frames kept per run for reconnects (min 16)"],
        ["with_shutdown_grace(d)", "25 s", "Bound on the graceful drain"],
        ["in_production(bool)", "RUSTY_ENV", "Refuse to boot without authentication"],
      ] },
      { type: "h", text: "Access" },
      { type: "table", head: ["Builder", "Default", "Purpose"], cols: "1.5fr 1fr 1.8fr", rows: [
        ["with_api_key(key)", "none (open)", "One key for tenant default"],
        ["with_tenant_key(tenant, key)", "none", "Map a key to a tenant"],
        ["with_principal(tenant, principal, key)", "none", "Bind a key to a named principal with roles"],
        ["with_bootstrap_admin(bool)", "off", "Create the first administrator on an empty store"],
        ["with_cors_allowed_origin(origin)", "any in dev; none in prod", "Allow a browser origin (repeatable)"],
        ["with_public_url(url)", "RUSTY_PUBLIC_URL", "Where callbacks return"],
      ] },
      { type: "h", text: "Operations" },
      { type: "table", head: ["Builder", "Default", "Purpose"], cols: "1.5fr 1fr 1.8fr", rows: [
        ["with_backup_dir(dir)", "{store}-backups", "Where estate backups go"],
        ["with_restore_from(archive)", "none", "Restore an empty store at boot"],
        ["with_pool_limit(pool, n)", "uncapped", "Cap in-flight tasks in a worker pool"],
        ["with_task_quota(quota)", "uncapped", "Default per-tenant task quota (429 over it)"],
        ["with_tenant_quota(tenant, quota)", "none", "Per-tenant override"],
        ["with_default_environment_tag(tag)", "none", "Environment a run resolves against when its binding names none"],
        ["with_egress_policy(policy)", "none", "Extra hosts tools may call; hosts without a policy are denied"],
        ["with_mcp_stdio(bool)", "off", "Allow spawning stdio MCP servers"],
      ] },
      { type: "h", text: "Built-in limits" },
      { type: "table", head: ["Limit", "Value", "Behavior"], cols: "1.2fr 1fr 2fr", rows: [
        ["Finished runs kept in memory", "1024", "Older ones drop from GET /runs/{id}; journals stay readable"],
        ["Blocking wait", "3600 s", "/runs/wait answers 504; the run keeps going"],
        ["Cron interval", "1 year max", "Longer intervals answer 400"],
      ] },
      { type: "p", text: "`router(registry, config)` returns an axum `Router` instead of binding, for embedding or tests. `serve_with_shutdown(registry, config, future)` takes your own shutdown signal." },
      { type: "links", text: "Next:", items: [
        { page: "env", label: "Environment variables" },
        { page: "features", label: "Crate features" },
      ] },
    ],
  },

  features: {
    title: "Crate features",
    source: ["rusty-core/Cargo.toml", "rusty-server/Cargo.toml", "Cargo.toml"],
    blocks: [
      { type: "p", text: "Cargo features declared in each crate's `[features]` table. No feature is on by default." },
      { type: "table", head: ["Crate", "Feature", "Turns on", "MSRV"], cols: "1.3fr 100px 2fr 70px", rows: [
        ["rusty-agent-runtime", "postgres", "PostgresCheckpointer (sqlx)", "1.87"],
        ["rusty-agent-runtime", "wasm", "WasmNode and the capsule host (Wasmtime)", "1.87"],
        ["rusty-agent-runtime", "genai", "GenaiChatModel: native providers through genai", "1.88"],
        ["rusty-agent-server", "postgres", "with_postgres; also runtime/postgres", "1.87"],
        ["rusty-agent-server", "capsules", "Cedar authorization for capsules; also runtime/wasm", "1.89"],
      ] },
      { type: "p", text: "`rusty-worker`, `rusty-otel`, and `rusty-eval` declare no features. A server built without `capsules` answers the capsule policy routes with `503 capsule_policy_unavailable`." },
      { type: "code", lang: "Cargo.toml", text: 'rusty-agent-server = { version = "0.12", features = ["postgres", "capsules"] }' },
      { type: "links", text: "Next:", items: [
        { page: "install", label: "Install" },
        { page: "cli", label: "CLI and scripts" },
      ] },
    ],
  },

  cli: {
    title: "CLI and scripts",
    source: ["scripts/", "rusty-server/src/bin/rustyness.rs", "studio/serve.py"],
    blocks: [
      { type: "p", text: "Everything you run from the repo root." },
      { type: "meta", text: "Tested on 2026-09-28 at rusty main @ fedbb3a: dev.sh, rustyness verify-log, server_demo, the rusty-core examples, and otel_demo were run. durability-bench.sh and load-envelope.sh were not run; their flags are from the scripts' headers." },
      { type: "h", text: "Scripts" },
      { type: "table", head: ["Command", "Does"], cols: "1.4fr 2fr", rows: [
        ["./scripts/dev.sh", "Builds and starts the demo server (:8100) and Studio (:4400); loads .env.rusty-local; RUSTY_SERVER_PORT and RUSTY_STUDIO_PORT change the ports"],
        ["./scripts/durability-bench.sh [--json path]", "Checkpoint overhead, memory growth, and resume-vs-restart benchmarks, offline"],
        ["./scripts/load-envelope.sh [--json path]", "Capacity load test; WITH_POSTGRES=1 adds Postgres runs (needs Docker)"],
        ["python3 scripts/oidc-idp-demo.py --port 8300", "A development OIDC identity provider. Never for production."],
        ["python3 studio/serve.py --port 8000 --target http://127.0.0.1:8100", "Serves the built Studio and proxies /api to a server"],
        ["scripts/studio_container.py", "Studio entrypoint used by docker compose"],
      ] },
      { type: "h", text: "The rustyness binary" },
      { type: "code", lang: "bash", text: "cargo run -p rusty-agent-server --bin rustyness -- verify-log <journal.json> [--artifacts <dir>]" },
      { type: "p", text: "Verifies a journal snapshot, the `journal` object of a run's fixture (`GET /runs/{id}/fixture | jq .journal`): gap-free positions, paired turn events, structure, and, with `--artifacts`, that every artifact reference resolves. It prints `{\"passed\": …, \"findings\": […], \"event_count\": …}`. The first `cargo run` builds the binary; the built one is `target/debug/rustyness`." },
      { type: "h", text: "Examples" },
      { type: "table", head: ["Command", "Does"], cols: "1.8fr 1.4fr", rows: [
        ["cargo run -p rusty-agent-server --example server_demo", "The demo server behind dev.sh and compose"],
        ["cargo run -p rusty-agent-runtime --example <name>", "react_agent, parallel_fanout, human_in_loop, react_record_replay, live_agent, genai_live"],
        ["cargo run -p rusty-worker --example worker_demo", "A remote node worker"],
        ["cargo run -p rusty-otel --example otel_demo", "Span export demo"],
      ] },
      { type: "links", text: "Next:", items: [
        { page: "env", label: "Environment variables" },
        { page: "local", label: "Run locally with Studio" },
      ] },
    ],
  },

  stability: {
    title: "Stability policy",
    source: ["docs/stability.md", "docs/versioning.md"],
    blocks: [
      { type: "p", text: "What Rusty promises not to break at v0.x. Anything not listed as stable can change in the next minor release." },
      { type: "h", text: "Stable today" },
      { type: "table", head: ["Surface", "Promise"], cols: "1.2fr 2fr", rows: [
        ["Remote-execution protocol v1", "Additive only. Workers reject versions they don't support. A breaking change bumps PROTOCOL_VERSION to 2."],
        ["Checkpoint format", "Readable across releases in the same 0.x minor line"],
        ["Flight Recorder formats", "RunEvent, Effect, DecisionEvent, CheckpointHeader, JournalSnapshot, ReplayFixture: additive within a minor line, pinned by golden files"],
      ] },
      { type: "h", text: "Not stable at 0.x" },
      { type: "list", items: [
        { b: "Rust APIs ", t: "of every crate: types, traits, signatures, feature flags." },
        { b: "HTTP JSON fields. ", t: "Paths have been additive; fields may change at a minor bump." },
        { b: "SSE families and payloads. ", t: "Clients must ignore unknown events and fields." },
        { b: "Client method shapes ", t: "in both SDKs." },
        { b: "Studio, ", t: "which is a UI, not an API." },
        { b: "Tenant storage layout. ", t: "Cross-tenant 404s are intended behavior; the prefix scheme is internal." },
      ] },
      { type: "h", text: "Deprecation" },
      { type: "p", text: "At 0.x, a deprecation is announced in the CHANGELOG, and removal lands no sooner than the next minor release where feasible. Security and correctness fixes may change behavior immediately. Don't rely on compiler warnings; the CHANGELOG is the channel." },
      { type: "h", text: "At 1.0" },
      { type: "list", items: [
        { b: "Full SemVer ", t: "on the Rust crates, the HTTP/SSE API, and the SDKs." },
        { b: "Checkpoint migrations ", t: "across 1.x, and a path across the 0.x to 1.0 boundary." },
        { b: "MSRV bumps ", t: "only in minor releases." },
        { b: "Deprecations ", t: "get at least one minor release of warnings." },
      ] },
      { type: "p", text: "1.0 ships when its gates close: an HTTP API version (done on main, unreleased: api_protocol_version 1), a durable pending-run queue (done), a published capacity envelope, an integrated provider layer, an independent security review, and three production case studies." },
      { type: "links", text: "Next:", items: [
        { page: "upgrade", label: "Upgrading and versioning" },
      ] },
    ],
  },
};

/** Sidebar order, flattened, for prev/next navigation. */
export const DOC_ORDER = DOC_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.name })));

/** Plain text of a page, for sidebar search. */
export function docText(id: string): string {
  const page = DOC_PAGES[id];
  if (!page) return "";
  return [
    page.title,
    ...page.blocks.map((b) => {
      switch (b.type) {
        case "p":
        case "h":
        case "meta":
          return b.text;
        case "code":
          return b.text;
        case "list":
          return b.items.map((i) => i.b + i.t).join(" ");
        case "table":
          return [...b.head, ...b.rows.flat()].join(" ");
        default:
          return "";
      }
    }),
  ]
    .join(" ")
    .toLowerCase();
}
