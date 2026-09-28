---
title: 15 · Quickstart
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 15</p>

# Quickstart: server up, first run in ten minutes

Part II was theory. This part is keyboard work. The quickstart has two doors — the *product* door (server plus Studio, click around) and the *library* door (your own binary, HTTP calls) — and they're the same platform underneath. Take the first if you're evaluating, the second if you're building.

## Door one: the demo pair

```bash
git clone https://github.com/dev-amjad-shaikh/rusty.git && cd rusty
./scripts/dev.sh        # Rusty Server on :8100 + Rusty Studio on http://localhost:4400
# or: docker compose up
```

Open `http://localhost:4400`. The first boot seeds an administrator; its password lands in `data/server-demo-checkpoints/bootstrap-admin.txt` — sign in, change it, delete the file. (The in-app banner tells you the same thing.) Every agent whose behavior holds a conversation opens straight into chat, with the run's journaled evidence live in the rail beside it.

Out of the box, the demo's `react_agent` answers from a deterministic local model — no network, no credentials, no surprises. To talk to a real model, put any OpenAI-compatible endpoint in a git-ignored `.env.rusty-local` at the repo root:

```bash
RUSTY_LLM_BASE_URL=http://<host>:<port>/v1
RUSTY_LLM_MODEL=<model id>
RUSTY_LLM_API_KEY=<key>   # optional — a local vLLM/Ollama box needs none
```

The measured cold start (Apple M2 Max, warm caches): clone in seconds, workspace build about a minute and a half, Studio build about twenty seconds — call it two minutes end to end. A cold cargo cache adds the dependency compile on top; `Cargo.lock` is deliberately not committed, so the first resolution varies with registry freshness.

## Door two: ten minutes to your own served graph

The library path, condensed from `docs/server-quickstart.md` — which has every request and response body in full. The setup story is one sentence: **`Cargo.toml` is the new `langgraph.json`.** No config file declares your graphs; your `main.rs` does, checked by the compiler.

```toml
[dependencies]
rusty-agent-runtime = "0.12"
rusty-agent-server = "0.12"
tokio = { version = "1", features = ["full"] }
serde_json = "1"
```

The graph is the canonical interrupt/resume pattern — a `draft` node, an `approve` node that suspends the run until a human decision arrives:

```rust
builder.add_node("approve", |ctx: NodeContext| async move {
    match ctx.resume_value() {
        // A human decision arrived via command.resume — record it.
        Some(decision) => Ok(NodeOutput::update("approval", decision.clone())),
        // No decision yet — suspend the whole run. The payload surfaces
        // to the HTTP caller as the run's interrupt value.
        None => Err(ctx.interrupt(json!({
            "kind": "approval_request",
            "prompt": "Approve this draft for publication?",
        }))),
    }
});
```

Register and serve — the server crate adds exactly three names you'll call directly: `GraphRegistry`, `ServerConfig`, `serve`:

```rust
let mut registry = GraphRegistry::new();
registry.register("publisher", graph, spec);
let config = ServerConfig::new("0.0.0.0:8080".parse()?, "./data/checkpoints");
serve(registry, config).await?;
```

`cargo run`, then drive it over HTTP. With no API key configured the server is in dev mode — open, loopback-minded, and loud about it if you bind wider:

```bash
curl localhost:8080/ok                                  # {"ok":true}
curl localhost:8080/info                                # version, checkpointer, graphs + channels
curl -X POST localhost:8080/threads -d '{"graph":"publisher"}'   # 201 + thread_id
```

Run the thread and it executes `draft`, then parks at `approve` — the run's status is `interrupted`, with the payload and the suspension checkpoint id in the response. Resume by posting a command with the human's decision on the same thread; the run re-executes `approve` from its start, sees `resume_value()`, routes on, completes. From there the quickstart walks the whole time-travel surface with real payloads: checkpoint history, fork at a checkpoint, replay on the fork, journal inspection (`first` event is a `super_step_start`, `count` tells you the evidence length), fixture download, server-side replay verification, branch diff.

## What to poke first

Once either door is open, the five-minute tour that teaches the most:

1. **Kill it.** Seriously. Start a run with a slow stage, `kill -9` the server, boot it again, and watch the run resume from its last checkpoint. Chapter 10 explains why this is boring; experiencing it once is worth three chapters.
2. **Interrupt and resume.** The approval flow above, from curl or from Studio's decision gate on Home.
3. **Read the journal.** `GET` the run's journal or open the Flight Recorder timeline in Studio — the causal chain from Chapter 03, rendered.
4. **Fork and replay.** Branch a thread at an earlier checkpoint, change the input, diff the two branches.

::: tip Key takeaways
- `./scripts/dev.sh` boots server + Studio; the demo model is deterministic and offline by default; `.env.rusty-local` wires a real endpoint.
- The library path is one `Cargo.toml` and a `main.rs` — the registry is the graph declaration.
- Interrupt/resume, time travel, and journal inspection are all reachable with curl in the first ten minutes.
- The canonical resumable node checks `resume_value()` first and interrupts only when there's no decision yet.
:::

**Further reading**

- [docs/server-quickstart.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/server-quickstart.md) — the full ten-minute HTTP walkthrough
- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — the demo pair, the crash-resume recording, install details
- [Chapter 16 · Build an agent end to end](./16-build-an-agent.md) — the next step
