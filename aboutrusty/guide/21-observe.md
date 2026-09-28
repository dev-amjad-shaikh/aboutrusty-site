---
title: 21 · Observe with rusty-otel
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 21</p>

# Observe with rusty-otel

Two chapters ago the book drew a line that matters operationally: the journal is *evidence* — complete, hash-chained, replayable — and telemetry is *for humans* — sampled, approximated, watched live. This chapter is the telemetry half. Rusty's executor is already instrumented with `tracing`; `rusty-otel` is the one-call wiring that routes those spans to your logs and your collector. You write no instrumentation code of your own.

## What you get for free

The executor's span taxonomy mirrors the super-step loop, so a trace reads like the execution it records:

| Span / event | Level | Fields | Meaning |
|---|---|---|---|
| `rusty.run` | INFO | `thread_id`, `max_steps` | One per `Executor::run`; root of the trace |
| `rusty.super_step` | DEBUG | `step`, `active_nodes` | One per super-step |
| `rusty.node` | INFO | `node`, `step` | One per spawned node task |
| barrier-merge event | DEBUG | channels written | Reducer merge at each barrier |
| run-complete event | INFO | `steps`, `duration_ms` | Run finished |
| interrupt event | INFO | `node`, `step` | Run parked for a human |
| error events | WARN | `node`, `step`, `error`, `retryable` | Node and routing failures, classified |

Spans nest — `run` → `super_step` → `node` — so one `rusty.run` trace in Jaeger or Tempo fans out into the full execution tree with `thread_id`, `step`, and `node` on every span. The WARN-level error events carry the retryable classification from Chapter 10's taxonomy, which makes "their outage versus our wiring" a dashboard filter rather than a log archaeology project.

## Setup

Local development, no collector:

```rust
let _guard = rusty_otel::init_local("my-agent")?;
```

Pretty span logs go to stderr, filtered by `RUST_LOG` or the built-in default `info,rusty_agent_runtime=debug` — which surfaces the DEBUG super-step spans without flooding other crates. With a collector, one config object:

```rust
let mut guard = rusty_otel::init(rusty_otel::OTelConfig {
    service_name: "my-agent".into(),
    otlp_endpoint: Some("http://localhost:4318/v1/traces".into()),
    log_filter: None, // RUST_LOG, else the default above
})?;

// ... run graphs ...

guard.shutdown(); // flush buffered spans before exit (idempotent; also on drop)
```

Two details worth knowing before you operate it. The log filter is **per-layer**: `RUST_LOG` gates the stderr logs only and never throttles OTLP export, so a restrictive `RUST_LOG=warn` still ships the full trace tree to the collector. And `init` succeeds once per process — the subscriber is global; a second call returns `SubscriberAlreadyInstalled` rather than double-registering. The crate ships a `docker-compose.yml` and collector config for a local Jaeger loop.

## Telemetry and evidence, divided properly

Use the trace tree for the live questions: is the fleet healthy, where is latency going, which node is erroring and is it retryable. Use the journal for the accountability questions: what exactly did this run do, what did the model see, what would it do if we re-drove it. The trace tells you a run took 40 seconds; the journal tells you what it was *for*. Studio's timeline view and the `rusty.run` trace are two readings of the same execution — one for a person watching now, one for the record that outlives the process.

::: tip Key takeaways
- `rusty-otel` is wiring, not instrumentation: one call, and the executor's existing spans flow to stderr or OTLP.
- Spans nest run → super-step → node, with `thread_id` and `step` on everything.
- `RUST_LOG` gates stderr only; OTLP export is never throttled by it. `init` is once per process; `shutdown()` flushes.
- Traces answer live questions; the journal answers accountability questions. Operate both.
:::

**Further reading**

- [rusty-otel/README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-otel/README.md) — setup, the span table, the local collector compose file
- [docs/architecture.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/architecture.md) — §6, the span taxonomy in context
- [Chapter 03 · Journals & evidence](./03-journals.md) — the other half of observation
