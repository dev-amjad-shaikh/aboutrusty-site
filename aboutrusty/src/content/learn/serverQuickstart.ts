import type { Article } from "./types";

export const serverQuickstart: Article = {
  slug: "server-quickstart",
  title: "Zero to a served graph in ten minutes",
  description:
    "Scaffold, define, serve, and drive a graph over HTTP — ten minutes, one process, no Docker, no database.",
  readingTime: "8 min read · 10 min hands-on",
  kicker: "Tutorial",
  blocks: [
    {
      type: "callout",
      variant: "quote",
      text: "Cargo.toml is the whole control plane.",
    },
    {
      type: "paragraph",
      text: "There is no config file declaring your graphs — the declaration is your `main.rs`, checked by the compiler. **Prerequisites:** a Rust toolchain (`rustup`), `curl`, and ~10 minutes. No Docker, no database, no Redis — everything runs in one process.",
    },

    { type: "heading", level: 2, text: "The flow at a glance" },
    {
      type: "table",
      head: ["Step", "Time", "What happens"],
      rows: [
        ["1. Create the project", "1 min", "`cargo new agent-server-demo`; add path deps"],
        [
          "2. Define the graph",
          "3 min",
          "Two-node graph `draft → approve` with a human-in-the-loop interrupt",
        ],
        [
          "3. Run it",
          "1 min",
          "`cargo run`; server on `localhost:8080`, dev mode, no API key",
        ],
        [
          "4–5. Create thread → run to the interrupt",
          "~2 min",
          "All via curl — steps 4–5 below",
        ],
        [
          "6–8. Resume over SSE, history, fork & replay",
          "~4 min",
          "Continued in [Interrupts, resume, and time travel](/learn/human-in-the-loop)",
        ],
      ],
    },

    { type: "heading", level: 2, text: "Step 1 — Create the project" },
    {
      type: "code",
      language: "bash",
      title: "terminal",
      code: `cargo new agent-server-demo
cd agent-server-demo`,
    },
    {
      type: "paragraph",
      text: "Add the dependencies to `Cargo.toml`. The `path` deps assume you created `agent-server-demo` as a **sibling** of the `rusty-core` and `rusty-server` checkouts — adjust the `path =` values if your layout differs.",
    },
    {
      type: "code",
      language: "toml",
      title: "Cargo.toml",
      code: `[dependencies]
rusty-agent-runtime = { path = "../rusty-core" }
rusty-server = { path = "../rusty-server" }
tokio = { version = "1", features = ["full"] }
serde_json = "1"`,
    },

    { type: "heading", level: 2, text: "Step 2 — Define the graph" },
    {
      type: "paragraph",
      text: "The quickstart graph is two nodes — `draft` and `approve` — over two channels, `draft` and `approval`, both `Reducer::Overwrite`. Each channel here has exactly one writer node, so Overwrite (last-value) semantics are correct everywhere.",
    },
    {
      type: "code",
      language: "rust",
      title: "src/main.rs — the whole server",
      code: `use rusty_agent_runtime::prelude::*;
use rusty_server::{serve, GraphRegistry, ServerConfig};
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> std::result::Result<(), Box<dyn std::error::Error>> {
    // -----------------------------------------------------------------
    // State schema: one channel per key, each with its reducer. Each
    // channel here has exactly one writer node, so Overwrite (last-value)
    // semantics are correct everywhere.
    // -----------------------------------------------------------------
    let spec = StateSpec::new()
        .channel("draft", Reducer::Overwrite)
        .channel("approval", Reducer::Overwrite);

    // -----------------------------------------------------------------
    // Graph: draft -> approve. \`approve\` suspends the run until a human
    // decision arrives — the canonical interrupt/resume pattern: check
    // \`ctx.resume_value()\` FIRST; only interrupt when there is none.
    // -----------------------------------------------------------------
    let mut builder = GraphBuilder::new();

    builder.add_node("draft", |ctx: NodeContext| async move {
        // If the run's \`input\` seeded a draft, keep it; otherwise write one.
        let draft = ctx.state().get("draft").cloned().unwrap_or_else(|| {
            json!("Rusty Server serves durable agent graphs from one binary.")
        });
        println!("[draft] {draft}");
        Ok(NodeOutput::update("draft", draft))
    });

    builder.add_node("approve", |ctx: NodeContext| async move {
        match ctx.resume_value() {
            // Phase 2: a human decision arrived via \`command.resume\`.
            Some(decision) => {
                println!("[approve] resumed with decision: {decision}");
                Ok(NodeOutput::update("approval", decision.clone()))
            }
            // Phase 1: no decision yet — suspend the whole run. The payload
            // is surfaced to the HTTP caller as the run's \`interrupt\` value.
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

    // -----------------------------------------------------------------
    // The registry: GraphRegistry maps names to the two things the
    // executor needs — Graph + StateSpec.
    // -----------------------------------------------------------------
    let mut registry = GraphRegistry::new();
    registry.register("publisher", graph, spec);

    // -----------------------------------------------------------------
    // Serve. Blocks on the axum/tokio runtime. The bind address and the
    // checkpoint store directory are code; a JsonFileCheckpointer rooted
    // at \`store_path\` is wired in for you.
    // -----------------------------------------------------------------
    let config = ServerConfig::new(
        "0.0.0.0:8080".parse()?,  // bind address
        "./data/checkpoints",     // JsonFileCheckpointer root
    );
    println!("listening on http://localhost:8080 (dev mode: no API key set)");
    serve(registry, config).await?;
    Ok(())
}`,
    },
    {
      type: "list",
      items: [
        "**The canonical interrupt/resume pattern:** check `ctx.resume_value()` FIRST; only interrupt when there is none. Phase 1: no decision → `ctx.interrupt(...)` suspends the run and the payload surfaces to the HTTP caller as the run's `interrupt` value. Phase 2: the decision arrives via `command.resume`.",
        "`builder.compile()?` — validates topology before serving anything.",
        "`GraphRegistry` maps names to the two things the executor needs — Graph + StateSpec.",
        "`ServerConfig::new(\"0.0.0.0:8080\".parse()?, \"./data/checkpoints\")` — bind address and checkpoint store directory are code; a `JsonFileCheckpointer` rooted at `store_path` is wired in automatically. `serve(registry, config).await?` blocks on the axum/tokio runtime.",
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "The whole server API",
      text: "The server crate adds exactly three names you call directly: `GraphRegistry`, `ServerConfig`, `serve` (plus `router` if you want to embed the routes in a larger axum app). Everything else is the same `rusty-agent-runtime` API as the library examples.",
    },

    { type: "heading", level: 2, text: "Step 3 — Run it" },
    {
      type: "code",
      language: "bash",
      title: "terminal",
      code: `cargo run
# listening on http://localhost:8080 (dev mode: no API key set)

curl localhost:8080/ok
# {"ok":true}

curl localhost:8080/info
# {"service":"rusty-server","version":"0.4.0","checkpointer":"json_file",
#  "store_path":"./data/checkpoints",
#  "graphs":[{"channels":["approval","draft"],"name":"publisher"}]}`,
    },
    {
      type: "paragraph",
      text: "To turn auth on: `ServerConfig::new(…).with_api_key(\"secret\")` — then add `-H \"X-Api-Key: secret\"` to every request.",
    },

    { type: "heading", level: 2, text: "Step 4 — Create a thread" },
    {
      type: "paragraph",
      text: "A thread binds to one registered graph at creation:",
    },
    {
      type: "code",
      language: "bash",
      title: "terminal",
      code: `curl -s -X POST localhost:8080/threads \\
  -H 'Content-Type: application/json' \\
  -d '{"graph": "publisher", "metadata": {"owner": "quickstart"}}'
# 201 {"thread_id": "3f2b9c4e-…", "graph": "publisher",
#      "metadata": {"owner": "quickstart"}, "created_at": "2026-08-05T…Z"}

TID=<paste the thread_id here>`,
    },

    { type: "heading", level: 2, text: "Step 5 — Run to the interrupt" },
    {
      type: "paragraph",
      text: "`POST /threads/{id}/runs/wait` blocks until the run finishes — or suspends:",
    },
    {
      type: "code",
      language: "bash",
      title: "terminal",
      code: `curl -s -X POST localhost:8080/threads/$TID/runs/wait \\
  -H 'Content-Type: application/json' \\
  -d '{"input": {"draft": "Rust agents, one binary."}}'`,
    },
    {
      type: "code",
      language: "json",
      title: "Terminal response",
      code: `{
  "run_id": "7c1e…",
  "thread_id": "3f2b9c4e-…",
  "status": "interrupted",
  "interrupt": {
    "kind": "approval_request",
    "prompt": "Approve this draft for publication?",
    "draft": "Rust agents, one binary."
  },
  "checkpoint_id": "a94f…",
  "state": { "draft": "Rust agents, one binary." }
}`,
    },
    {
      type: "callout",
      variant: "note",
      title: "Durable by default",
      text: "The run suspended inside `approve`, and the executor persisted a checkpoint for the thread — this is durable, so you could restart the server right now and lose nothing. (Thread records live in memory; checkpoints are durable on disk — re-create the thread with the same `thread_id` after a restart.)",
    },
    {
      type: "paragraph",
      text: "Inspect the parked state:",
    },
    {
      type: "code",
      language: "bash",
      title: "terminal",
      code: `curl -s localhost:8080/threads/$TID/state
# {"values": {"draft": "Rust agents, one binary."}, "next": ["approve"],
#  "checkpoint": {"checkpoint_id": "a94f…", "thread_id": "3f2b…", "step": 1,
#                 "created_at": "…"}}`,
    },
    {
      type: "callout",
      variant: "quote",
      text: "`next: [\"approve\"]` tells you exactly where the run is parked.",
    },
    {
      type: "paragraph",
      text: "Next: resume this run over SSE, then rewind and branch its timeline — covered in [Interrupts, resume, and time travel](/learn/human-in-the-loop).",
    },
  ],
};
