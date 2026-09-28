/**
 * Docs hub content — task-oriented how-tos, transcribed from the site design
 * (Docs.dc.html). Pages the design left as stubs point at the guide chapter
 * that covers the topic today.
 */

export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "meta"; text: string }
  | { type: "code"; lang: string; text: string }
  | { type: "list"; numbered?: boolean; items: { b: string; t: string }[] }
  | { type: "table"; head: string[]; rows: string[][]; cols: string }
  | { type: "links"; text: string; items: { page: string; label: string }[] };

export interface DocPage {
  title: string;
  learn?: { label: string; href: string };
  blocks: DocBlock[];
}

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

/** Where a not-yet-written docs page is covered today: repo file + guide chapter. */
export const DOC_STUBS: Record<string, { source: string; guide: string; guideLabel: string }> = {
  model: { source: "rusty-core/README.md", guide: "/guide/15-quickstart.html", guideLabel: "Guide 15 · Quickstart" },
  storage: { source: "docs/architecture.md", guide: "/guide/10-durability.html", guideLabel: "Guide 10 · Durability" },
  auth: { source: "rusty-server/README.md", guide: "/guide/12-policy-security.html", guideLabel: "Guide 12 · Policy & security" },
  env: { source: "rusty-server/README.md", guide: "/guide/13-server-sdks.html", guideLabel: "Guide 13 · The server & the SDKs" },
  graph: { source: "rusty-core/README.md", guide: "/guide/16-build-an-agent.html", guideLabel: "Guide 16 · Build an agent" },
  approval: { source: "docs/server-quickstart.md", guide: "/guide/16-build-an-agent.html", guideLabel: "Guide 16 · Build an agent" },
  tool: { source: "docs/how-to.md", guide: "/guide/18-build-a-tool.html", guideLabel: "Guide 18 · Build a tool" },
  py: { source: "sdks/python/README.md", guide: "/guide/13-server-sdks.html", guideLabel: "Guide 13 · The server & the SDKs" },
  ts: { source: "sdks/typescript/README.md", guide: "/guide/13-server-sdks.html", guideLabel: "Guide 13 · The server & the SDKs" },
  eval: { source: "rusty-eval/README.md", guide: "/guide/20-evaluate.html", guideLabel: "Guide 20 · Evaluate with rusty-eval" },
  standin: { source: "docs/how-to.md", guide: "/guide/20-evaluate.html", guideLabel: "Guide 20 · Evaluate with rusty-eval" },
  docker: { source: "docker-compose.yml", guide: "/guide/22-deploy-operate.html", guideLabel: "Guide 22 · Deploy & operate" },
  postgres: { source: "rusty-server/README.md", guide: "/guide/22-deploy-operate.html", guideLabel: "Guide 22 · Deploy & operate" },
  envs: { source: "docs/operations-plane-design.md", guide: "/guide/22-deploy-operate.html", guideLabel: "Guide 22 · Deploy & operate" },
  backup: { source: "docs/backup.md", guide: "/guide/22-deploy-operate.html", guideLabel: "Guide 22 · Deploy & operate" },
  recovery: { source: "docs/recovery.md", guide: "/guide/22-deploy-operate.html", guideLabel: "Guide 22 · Deploy & operate" },
  otel: { source: "rusty-otel/README.md", guide: "/guide/21-observe.html", guideLabel: "Guide 21 · Observe with rusty-otel" },
  upgrade: { source: "docs/versioning.md", guide: "/guide/22-deploy-operate.html", guideLabel: "Guide 22 · Deploy & operate" },
  config: { source: "rusty-server/README.md", guide: "/guide/13-server-sdks.html", guideLabel: "Guide 13 · The server & the SDKs" },
  features: { source: "rusty-core/Cargo.toml", guide: "/guide/13-server-sdks.html", guideLabel: "Guide 13 · The server & the SDKs" },
  cli: { source: "scripts/", guide: "/guide/22-deploy-operate.html", guideLabel: "Guide 22 · Deploy & operate" },
  stability: { source: "docs/stability.md", guide: "/guide/appendix-c-releases.html", guideLabel: "Appendix C · Release history" },
};

export const DOC_PAGES: Record<string, DocPage> = {
  intro: {
    title: "Introduction",
    learn: { label: "Guide 02 · The Rusty mental model", href: "/guide/02-mental-model.html" },
    blocks: [
      { type: "p", text: "Rusty is a runtime and server for AI agents. You define an agent as a graph, Rusty runs it and saves its state after every step, and you use that saved state to resume, pause, and replay runs." },
      { type: "h", text: "Choose how you want to start" },
      {
        type: "list",
        items: [
          { b: "Try Rusty Studio. ", t: "Run the server and Studio locally and build an agent in the browser." },
          { b: "Serve a graph from Rust. ", t: "Write a graph, serve it over HTTP, and call it with curl." },
          { b: "Call Rusty from Python or TypeScript. ", t: "Install a client and connect to a running server." },
        ],
      },
      {
        type: "links",
        text: "Go to:",
        items: [
          { page: "local", label: "Run locally with Studio" },
          { page: "quickstart", label: "Quickstart" },
          { page: "py", label: "Python client" },
          { page: "ts", label: "TypeScript client" },
        ],
      },
    ],
  },
  install: {
    title: "Install",
    blocks: [
      { type: "h", text: "Requirements" },
      {
        type: "list",
        items: [
          { b: "", t: "Rust 1.87 or later (rustup). The genai feature needs 1.88. The capsules feature needs 1.89." },
          { b: "", t: "For Postgres storage: a Postgres database and the postgres feature." },
        ],
      },
      { type: "h", text: "Rust crates" },
      {
        type: "code",
        lang: "Cargo.toml",
        text: '[dependencies]\nrusty-agent-runtime = "0.12"\ntokio = { version = "1", features = ["full"] }\nasync-trait = "0.1"\nserde_json = "1"',
      },
      { type: "p", text: "Or add them from the command line:" },
      { type: "code", lang: "bash", text: "cargo add rusty-agent-runtime\ncargo add rusty-agent-server" },
      { type: "h", text: "Optional features" },
      {
        type: "table",
        head: ["Feature", "Adds"],
        rows: [
          ["postgres", "Postgres checkpoint storage"],
          ["wasm", "Sandboxed WASM nodes"],
          ["genai", "One client for OpenAI, Anthropic, Gemini, Ollama, and others"],
        ],
        cols: "160px 1fr",
      },
      { type: "h", text: "Clients" },
      {
        type: "code",
        lang: "bash",
        text: "npm install @rusty-runtime/client   # TypeScript / JavaScript\npip install rusty-agent-runtime     # Python, imported as rusty_client",
      },
      { type: "h", text: "Packages" },
      {
        type: "table",
        head: ["Package", "Registry", "Version"],
        rows: [
          ["rusty-agent-runtime", "crates.io", "0.12.0"],
          ["rusty-agent-server", "crates.io", "0.12.0"],
          ["rusty-worker", "crates.io", "0.3.6"],
          ["rusty-otel", "crates.io", "0.1.7"],
          ["rusty-eval", "crates.io", "0.1.5"],
          ["@rusty-runtime/client", "npm", "0.5.0"],
          ["rusty-agent-runtime", "PyPI", "0.5.0"],
        ],
        cols: "1.4fr 1fr 1fr",
      },
    ],
  },
  local: {
    title: "Run locally with Studio",
    blocks: [
      { type: "p", text: "Run the Rusty server and Rusty Studio on your machine." },
      { type: "h", text: "1. Clone and start" },
      {
        type: "code",
        lang: "bash",
        text: "git clone https://github.com/dev-amjad-shaikh/rusty.git\ncd rusty\n./scripts/dev.sh",
      },
      { type: "p", text: "This starts the server on port 8100 and Studio on http://localhost:4400. To use containers instead, run docker compose up." },
      { type: "h", text: "2. Sign in" },
      { type: "p", text: "The first start creates an administrator account. The password is saved to data/server-demo-checkpoints/bootstrap-admin.txt. Sign in, change the password, then delete the file." },
      { type: "h", text: "3. Chat with the demo agent" },
      { type: "p", text: "Open http://localhost:4400. The demo agent uses a local test model, so it works without a network connection or API key." },
      { type: "h", text: "4. Use a real model (optional)" },
      { type: "p", text: "Create .env.rusty-local in the repo root. This file is ignored by git." },
      {
        type: "code",
        lang: ".env.rusty-local",
        text: "RUSTY_LLM_BASE_URL=http://<host>:<port>/v1\nRUSTY_LLM_MODEL=<model id>\nRUSTY_LLM_API_KEY=<key>      # not needed for a local vLLM or Ollama server",
      },
      { type: "p", text: "Any OpenAI-compatible endpoint works. Restart ./scripts/dev.sh to apply." },
      { type: "meta", text: "On an Apple M2 Max with warm caches, the first start takes about 2 minutes: 1.5 minutes for the workspace and 20 seconds for Studio. A cold cargo cache takes longer. sccache speeds up rebuilds." },
      { type: "links", text: "Next:", items: [{ page: "agent", label: "Build an agent in Studio" }] },
    ],
  },
  quickstart: {
    title: "Quickstart: serve a graph",
    learn: { label: "Guide 15 · Quickstart", href: "/guide/15-quickstart.html" },
    blocks: [
      { type: "meta", text: "Time: 10 minutes. You need Rust and curl. No database or Docker." },
      { type: "p", text: "You will create a Rust project, define a two-step graph with an approval step, serve it over HTTP, run it until it pauses, resume it, then list its checkpoints and fork it." },
      { type: "h", text: "1. Create the project" },
      { type: "code", lang: "bash", text: "cargo new agent-server-demo\ncd agent-server-demo" },
      { type: "p", text: "Add rusty-agent-runtime, rusty-agent-server, tokio (features full), and serde_json to Cargo.toml." },
      { type: "h", text: "2. Define the graph" },
      { type: "p", text: "The graph has two nodes: draft writes a draft, and approve pauses the run until a person responds. The full main.rs is in docs/server-quickstart.md. The key calls are StateSpec, GraphBuilder, ctx.interrupt(), ctx.resume_value(), GraphRegistry, ServerConfig, and serve()." },
      { type: "h", text: "3. Start the server" },
      { type: "code", lang: "bash", text: 'cargo run\ncurl localhost:8080/ok        # {"ok":true}' },
      { type: "p", text: 'No API key is set, so the server runs without authentication. To require one, use ServerConfig::new(...).with_api_key("secret") and send X-Api-Key: secret with each request.' },
      { type: "h", text: "4. Create a thread" },
      {
        type: "code",
        lang: "bash",
        text: "curl -s -X POST localhost:8080/threads \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"graph\": \"publisher\"}'",
      },
      { type: "p", text: "Save the returned thread_id as TID." },
      { type: "h", text: "5. Run until approval" },
      {
        type: "code",
        lang: "bash",
        text: "curl -s -X POST localhost:8080/threads/$TID/runs/wait \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"input\": {\"draft\": \"Rust agents, one binary.\"}}'",
      },
      { type: "p", text: 'The response has "status": "interrupted" and the approval request. The run\'s state is saved. Check where it stopped:' },
      { type: "code", lang: "bash", text: 'curl -s localhost:8080/threads/$TID/state     # "next": ["approve"]' },
      { type: "h", text: "6. Resume with a decision" },
      {
        type: "code",
        lang: "bash",
        text: "curl -N -X POST localhost:8080/threads/$TID/runs/stream \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"command\": {\"resume\": {\"approved\": true}}, \"stream_mode\": [\"updates\", \"values\"]}'",
      },
      { type: "p", text: 'Events stream over SSE until event: end with "status": "success".' },
      { type: "h", text: "7. List checkpoints" },
      {
        type: "code",
        lang: "bash",
        text: "curl -s -X POST localhost:8080/threads/$TID/history \\\n  -H 'Content-Type: application/json' -d '{\"limit\": 10}'",
      },
      { type: "h", text: "8. Fork from a checkpoint" },
      {
        type: "code",
        lang: "bash",
        text: "curl -s -X POST localhost:8080/threads/$TID/fork \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"new_thread_id\": \"branch-a\", \"checkpoint_id\": \"<id>\"}'",
      },
      {
        type: "links",
        text: "Next:",
        items: [
          { page: "inspect", label: "Inspect a run" },
          { page: "replay", label: "Replay a run" },
          { page: "release", label: "Build a release binary" },
        ],
      },
    ],
  },
  agent: {
    title: "Build an agent in Studio",
    blocks: [
      { type: "meta", text: "Before you start: Run locally with Studio." },
      {
        type: "list",
        numbered: true,
        items: [
          { b: "Go to Home → New agent. ", t: "The wizard has six steps: Template, Identity, Goal, Instructions, Model & tools, Review." },
          { b: "Template. ", t: "Choose Blank agent, or a starter: Data analyst, Coding agent, Research assistant." },
          { b: "Identity. ", t: "Enter a name, a handle (@slug), a description, a color, and an icon." },
          { b: "Goal. ", t: "Write one sentence that a teammate could check, and set a metric and target." },
          { b: "Instructions. ", t: "Write the system prompt: what the agent does, how it works, and what it must not do." },
          { b: "Model & tools. ", t: "Pick a model and the tools the agent can call. Add model providers under AI models." },
          { b: "Review. ", t: "Save the agent as a draft. The readiness card lists what's needed before you can publish." },
          { b: "Test. ", t: "Use the test panel next to the builder to run the agent. Results appear in the Test tab." },
          { b: "Publish ", t: "when the readiness card is clear." },
        ],
      },
    ],
  },
  connector: {
    title: "Add a connector",
    learn: { label: "Guide 09 · Tools & connectors", href: "/guide/09-tools-connectors.html" },
    blocks: [
      {
        type: "list",
        numbered: true,
        items: [
          { b: "Go to Connectors → Browse all.", t: "" },
          { b: "Choose a system, ", t: "or choose Custom protocol and paste an OpenAPI document." },
          { b: "Sign in ", t: "with the method the connector uses: API key, OAuth, or none. Credentials are stored in the broker. Agents and logs never see the raw values." },
          { b: "The connector's operations appear in Tools. ", t: "Grant them to an agent from its builder." },
          { b: "Optional: ", t: "create a stand-in under Connectors → New stand-in to test with seeded data instead of the live system." },
        ],
      },
    ],
  },
  skill: {
    title: "Write a skill",
    learn: { label: "Guide 06 · Skills", href: "/guide/06-skills.html" },
    blocks: [
      {
        type: "list",
        numbered: true,
        items: [
          { b: "Go to Skills → New skill.", t: "" },
          { b: "Name the skill.", t: "" },
          { b: "Fill in When to use it. ", t: 'The agent reads this to decide whether the skill applies. Describe the trigger, for example: "Use when the user asks for a weekly summary."' },
          { b: "Write the procedure in Markdown. ", t: "Reference tools as `tool_name`. The editor records them as the skill's allowed tools." },
          { b: "Save, ", t: "then attach the skill to an agent from its Skills section." },
        ],
      },
      { type: "p", text: "You can also import skills from the library or from a git repository that contains SKILL.md files." },
    ],
  },
  inspect: {
    title: "Inspect a run",
    learn: { label: "Guide 03 · Journals & evidence", href: "/guide/03-journals.html" },
    blocks: [
      { type: "p", text: "Every run has a journal of steps, calls, interrupts, and checkpoint writes." },
      { type: "code", lang: "bash", text: "curl -s localhost:8080/runs/$RUN_ID/events" },
      { type: "p", text: "Download the run as a replay fixture for CI:" },
      { type: "code", lang: "bash", text: "curl -s localhost:8080/runs/$RUN_ID/fixture -o fixture.json" },
    ],
  },
  replay: {
    title: "Replay a run",
    learn: { label: "Guide 03 · Journals & evidence", href: "/guide/03-journals.html" },
    blocks: [
      { type: "p", text: "Replay re-runs a recorded run against the current graph code, with no outbound calls, and checks the result against the journal." },
      {
        type: "code",
        lang: "bash",
        text: "curl -s -X POST localhost:8080/runs/replay \\\n  -H 'Content-Type: application/json' -d '{\"run_id\": \"'$RUN_ID'\"}'",
      },
      { type: "p", text: '"verified": true means the run reproduced. If false, first_divergence shows where it changed.' },
      {
        type: "table",
        head: ["Status", "Meaning"],
        rows: [
          ["404", "Unknown run"],
          ["409", "Run still active"],
          ["422", "Graph not registered, or the run contains model or tool calls. Replay those with the fixture in CI."],
        ],
        cols: "100px 1fr",
      },
    ],
  },
  fork: {
    title: "Fork and compare runs",
    learn: { label: "Guide 03 · Journals & evidence", href: "/guide/03-journals.html" },
    blocks: [
      { type: "code", lang: "bash", text: 'curl -s "localhost:8080/runs/diff?base=$RUN_ID&branch=$FORK_RUN_ID"' },
      { type: "p", text: "Returns the first step where the runs differ, added and removed events, and which state changed at each step. Also available as replay_run and diff_runs in Python, and replayRun and diffRuns in TypeScript." },
    ],
  },
  release: {
    title: "Build a release binary",
    blocks: [
      { type: "code", lang: "bash", text: "cargo build --release" },
      { type: "p", text: "Produces one static binary. See the FROM scratch Dockerfile and the ServerConfig reference in rusty-server/README.md." },
      { type: "h", text: "Production checklist" },
      {
        type: "list",
        items: [
          { b: "", t: "Set RUSTY_ENV=production. The server will not start without authentication." },
          { b: "", t: "Configure API keys." },
          { b: "", t: "Use Postgres storage (postgres feature) instead of local JSON files." },
          { b: "", t: "If a browser client on another origin calls the server, set with_cors_allowed_origin." },
          { b: "", t: "Make node logic safe to repeat. A node interrupted mid-step runs again on resume." },
        ],
      },
    ],
  },
  api: {
    title: "HTTP API",
    blocks: [
      { type: "p", text: "The OpenAPI 3.1 spec is in docs/api/. Endpoint groups: Threads, Runs, Assistants, Crons, Store (KV), Tasks, Connectors, Skills, Knowledge, Memory, Learn, Deployments, Artifacts, Receipts." },
      { type: "h", text: "Common endpoints" },
      {
        type: "table",
        head: ["Method", "Path", "Purpose"],
        rows: [
          ["POST", "/threads", "Create a thread"],
          ["POST", "/threads/{id}/runs", "Start a background run (returns 202)"],
          ["POST", "/threads/{id}/runs/wait", "Run and wait for the result"],
          ["POST", "/threads/{id}/runs/stream", "Run and stream events over SSE"],
          ["GET", "/threads/{id}/state", "Current state and next step"],
          ["POST", "/threads/{id}/history", "List checkpoints"],
          ["POST", "/threads/{id}/fork", "Fork a thread"],
          ["GET", "/runs/{id}/events", "Run journal"],
          ["POST", "/runs/replay", "Replay a run"],
          ["GET", "/runs/diff", "Compare two runs"],
          ["GET", "/runs/{id}/receipt", "Signed run receipt"],
        ],
        cols: "80px 1.3fr 1.4fr",
      },
    ],
  },
};
