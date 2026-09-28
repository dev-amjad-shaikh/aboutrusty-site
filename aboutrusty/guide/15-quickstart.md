---
title: 15 · Quickstart
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 15</p>

# Quickstart: server up, first run in ten minutes

There are two ways in. The demo pair gives you Rusty Server and Rusty Studio with one command, so you can click through the product. The library path has you write your own `main.rs`, serve a graph, and drive it with `curl`. Both run the same platform. Take the demo pair to evaluate Rusty; take the library path to build on it.

## Door one: the demo pair

```bash
git clone https://github.com/dev-amjad-shaikh/rusty.git && cd rusty
./scripts/dev.sh        # Rusty Server on :8100 + Rusty Studio on http://localhost:4400
# or
docker compose up       # the same pair in containers: Studio on http://localhost:8000 (base URL /api), API on :8100
```

Open Studio (`http://localhost:4400` for `dev.sh`, `http://localhost:8000` for Compose). The first boot seeds an administrator and writes its password to `data/server-demo-checkpoints/bootstrap-admin.txt`. Sign in with it, change it, and delete the file. The in-app banner says the same. To run without sign-in on a laptop or in a test harness, start the demo with `RUSTY_OPEN=1`. A production boot refuses that mode regardless (`rusty-server/examples/server_demo.rs`).

An agent whose behavior holds a conversation opens straight into chat, with the run's journaled evidence in the rail beside it. By default the demo's `react_agent` answers from a deterministic local model: no network, no credentials. To use a real model, put any OpenAI-compatible endpoint in a git-ignored `.env.rusty-local` at the repo root:

```bash
RUSTY_LLM_BASE_URL=http://<host>:<port>/v1
RUSTY_LLM_MODEL=<model id>
RUSTY_LLM_API_KEY=<key>   # optional; a local vLLM/Ollama box needs none
# optional provider extensions, merged into every request
RUSTY_LLM_EXTRA_BODY='{"chat_template_kwargs":{"enable_thinking":false},"max_tokens":2048}'
```

Expect about two minutes from clone to a chat-ready Studio. The README's measurement (Apple M2 Max, warm cargo and npm caches) is a few seconds to clone, about 1.5 minutes for the workspace build, and about 20 seconds for the Studio build. A cold cargo cache adds the dependency compile. `Cargo.lock` is not committed, so the first build resolves dependencies fresh and its time varies.

## Door two: ten minutes to your own served graph

This path condenses [docs/server-quickstart.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/server-quickstart.md), which shows every request and response in full. No config file declares your graphs. Your `main.rs` does, and the compiler checks it.

Create a binary crate and add the dependencies. The crates are on crates.io; the repo's quickstart uses `path =` dependencies to a sibling checkout instead, which works the same way.

```bash
cargo new agent-server-demo && cd agent-server-demo
```

```toml
[dependencies]
rusty-agent-runtime = "0.12"
rusty-agent-server = "0.12"
tokio = { version = "1", features = ["full"] }
serde_json = "1"
```

Replace `src/main.rs` with a two-node graph, `draft → approve`. The `approve` node suspends the run until a human decision arrives:

```rust
use rusty_agent_runtime::prelude::*;
use rusty_agent_server::{serve, GraphRegistry, ServerConfig};
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> std::result::Result<(), Box<dyn std::error::Error>> {
    // One channel per key, each with its reducer.
    let spec = StateSpec::new()
        .channel("draft", Reducer::Overwrite)
        .channel("approval", Reducer::Overwrite);

    let mut builder = GraphBuilder::new();

    builder.add_node("draft", |ctx: NodeContext| async move {
        let draft = ctx.state().get("draft").cloned().unwrap_or_else(|| {
            json!("Rusty Server serves durable agent graphs from one binary.")
        });
        Ok(NodeOutput::update("draft", draft))
    });

    builder.add_node("approve", |ctx: NodeContext| async move {
        match ctx.resume_value() {
            // A human decision arrived via `command.resume`.
            Some(decision) => Ok(NodeOutput::update("approval", decision.clone())),
            // No decision yet: suspend the whole run. The payload reaches
            // the HTTP caller as the run's `interrupt` value.
            None => {
                let draft = ctx.state().get("draft").cloned().unwrap_or(Value::Null);
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
    let graph = builder.compile()?; // validates topology before anything runs

    let mut registry = GraphRegistry::new();
    registry.register("publisher", graph, spec);

    // Bind address + JsonFileCheckpointer root.
    let config = ServerConfig::new("0.0.0.0:8080".parse()?, "./data/checkpoints");
    serve(registry, config).await?;
    Ok(())
}
```

The server crate adds three names you call directly: `GraphRegistry`, `ServerConfig`, and `serve`. Use `router` instead of `serve` to mount the routes inside a larger axum app. Everything else is the same runtime API the library examples use, such as `rusty-core/examples/human_in_loop.rs`.

Start it with `cargo run`. With no API key configured the server runs in dev mode: every request is allowed. Because this config binds `0.0.0.0`, the server logs a warning that it is serving without authentication on a non-loopback address. Bind `127.0.0.1` or add `.with_api_key("secret")` (then send `-H "X-Api-Key: secret"`) to silence it. In another terminal:

```bash
curl localhost:8080/ok
# {"ok":true}
curl localhost:8080/info
# service, version, checkpointer ("json_file"), store_path, graphs with their channels, ...
curl -s -X POST localhost:8080/threads \
  -H 'Content-Type: application/json' \
  -d '{"graph": "publisher"}'
# 201 {"thread_id": "3f2b9c4e-…", "graph": "publisher", ...}
TID=<the thread_id>
```

Run the thread with the blocking endpoint. It executes `draft`, then parks at `approve`:

```bash
curl -s -X POST localhost:8080/threads/$TID/runs/wait \
  -H 'Content-Type: application/json' \
  -d '{"input": {"draft": "Rust agents, one binary."}}'
# {"run_id": "…", "status": "interrupted", "interrupt": {"kind": "approval_request", ...},
#  "checkpoint_id": "…", "state": {"draft": "Rust agents, one binary."}}
```

`GET /threads/$TID/state` now reports `"next": ["approve"]`, which is where the run is parked. Resume it with the human's decision, streamed over SSE (`-N` turns off curl's buffering):

```bash
curl -N -X POST localhost:8080/threads/$TID/runs/stream \
  -H 'Content-Type: application/json' \
  -d '{"command": {"resume": {"approved": true, "reviewer": "alice"}},
       "stream_mode": ["updates", "values"]}'
```

You get `metadata`, `updates`, `values`, and `end` frames. The executor restores the checkpoint and re-executes `approve` from its start with `ctx.resume_value()` set, then the run completes. That re-execution is why everything a node does before its interrupt must be safe to repeat.

The quickstart then covers the time-travel and evidence surface, each with real payloads:

| Step | Request |
|---|---|
| Checkpoint history, newest first | `POST /threads/{id}/history` with `{"limit": 10}` |
| Undo a finished run | `DELETE /threads/{id}/runs/{run_id}` |
| Fork at a checkpoint | `POST /threads/{id}/fork` with `{"new_thread_id", "checkpoint_id"}` |
| Replay from a checkpoint | any run endpoint with `"checkpoint": {"checkpoint_id": …}` |
| Read the run's journal | `GET /runs/{run_id}/events` (the first event is a `super_step_start`) |
| Download a replay fixture | `GET /runs/{run_id}/fixture` |
| Verify a replay server-side | `POST /runs/replay` with `{"run_id"}` |
| Diff two branches | `GET /runs/diff?base=…&branch=…` |

## What to try first

Once either door is open, these four exercises teach the most in the least time:

1. **Kill the server.** The README's crash-resume recording ([docs/screenshots/crash-resume.gif](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/screenshots/crash-resume.gif)) is the demo server: a run finishes two stages and parks on a decision, the server gets `kill -9`, a fresh process boots against the same store, and the decision resumes with one command. Reproduce it with the library path: run to the interrupt, kill the process, restart it, and resume. Chapter 10 explains why this works.
2. **Interrupt and resume.** Use the approval flow above from `curl`, or answer a parked decision in Studio.
3. **Read the journal.** `GET /runs/{id}/events`, or open the run's timeline in Studio. It is the causal record from Chapter 03.
4. **Fork and replay.** Fork a thread at an earlier checkpoint, replay on the fork, and diff the two branches.

::: tip Key takeaways
- `./scripts/dev.sh` starts Server (:8100) and Studio (:4400); `docker compose up` serves Studio on :8000. The first boot seeds an administrator; `RUSTY_OPEN=1` opts out.
- The demo model is deterministic and offline. `.env.rusty-local` points it at a real OpenAI-compatible endpoint.
- The library path is a `Cargo.toml` and a `main.rs`: `GraphRegistry`, `ServerConfig`, `serve`.
- A resumable node checks `ctx.resume_value()` first and interrupts only when no decision has arrived.
- History, fork, replay, journals, fixtures, and branch diffs are all reachable with `curl`.
:::

**Further reading**

- [docs/server-quickstart.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/server-quickstart.md) — the full HTTP walkthrough with request and response bodies
- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — install, the demo pair, the crash-resume recording
- [Chapter 16 · Build an agent end to end](./16-build-an-agent.md) — the next step
