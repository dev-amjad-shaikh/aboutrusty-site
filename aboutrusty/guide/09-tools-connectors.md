---
title: 09 · Tools & connectors
---

<p class="chapter-eyebrow">Part II · Concepts and internals · Chapter 09</p>

# Tools & connectors

A tool call is the moment an agent stops talking and starts doing. The model emits JSON — `send_email`, arguments and all — and some piece of your system turns that string into a side effect in a system you may not own, with credentials you'd rather not think about. Everything about that gap is this chapter: how tools are declared and executed, and how connectors — packaged integrations with external systems — keep the dangerous parts declared, sealed, and evidenced.

## The concept: the tool-call gap

Function calling looks trivial in the happy path, which is why the failure modes define the design space. A tool that throws shouldn't take the whole batch down with it. A model that asks for ten tool calls wants them in parallel but needs the results back in order. A tool that touches the filesystem has no business running in the same trust domain as one that reads engine state. And a credential configured against an integration must never echo back into a prompt, a journal, or a UI.

The field's answers are fragmented. Provider APIs (OpenAI's function calling and its peers) standardize the schema format but say nothing about execution. MCP — the Model Context Protocol — standardizes *discovery*: a server lists its tools, a client consumes them. But MCP's ecosystem posture is ambient authority: servers run as local processes with the user's full authority, or as remote endpoints trusted on the strength of a URL. Connector frameworks, meanwhile, tend to grow one bespoke code path per integration, which is how a hand-rolled `credentials.oauth` block once got past a "validated" connector — Rusty's connector standard exists because that bug was hit and the rule that fixes it was written down.

## Rusty: the tool system

The core is deliberately small (`rusty-core/src/tool.rs`). A `Tool` is an async callable with a JSON-Schema-described parameter surface. A `ToolRegistry` holds the tools an agent may see and emits OpenAI-format schemas for the chat API. `ToolExecutor::execute_batch` dispatches a batch of tool calls in parallel and returns one `role: "tool"` message per call, preserving call order — and isolating failure: a failing or even *panicking* tool becomes an `ERROR:` tool message in its own slot, data the model can read and recover from, never a batch abort.

Two classifications ride on every tool, and they answer different questions. `Effect` (Chapter 03's taxonomy) classifies retry safety — what may happen *again*. `EffectClass` classifies placement — *where* the tool runs: `Read` tools read engine state and may execute in-process; `Execute` tools run model-influenced code or touch the filesystem; `Egress` tools open network connections. Paired with a `SandboxRequirement` (`None` or `Required`), placement is a declaration the runtime enforces, with the sandbox backend reporting its enforcement level honestly rather than asserting it.

Tool calls journal like everything else: through the `RecordingTool` wrapper they're evidence with causal parentage, and under exact replay the `ReplayingTool` serves recorded results without ever invoking the real thing. A tool gate refusal — like Chapter 06's skill gate — returns as the tool's *result*, so even denials are replayable evidence rather than vanished log lines.

## MCP: discovery in, governance around

Rusty's MCP client (`rusty-core/src/mcp.rs`) is a JSON-RPC client over stdio — newline-delimited or `Content-Length` framing, per-request timeouts, and a 16 MiB frame cap applied *before* any length-driven allocation, because a hostile server's declared frame size is a claim, not a fact. `McpClient::into_tools()` lists a server's tools and returns them as ordinary `Tool` registrations — so MCP tools flow through the same executor, the same ReAct graph, the same journal, with zero graph changes. The R0.9 bridges (Chapter 07) complete the picture in both directions: a graph exposed *as* an MCP server runs under its declared manifest and budget, and outbound MCP calls are journaled, idempotency-keyed effects. The bridge design is honest about the boundary: it governs Rusty's own exposure; it cannot fix the ecosystem's ambient-authority posture.

## The connector standard: one shape, no exceptions

The standard's opening rule is absolute: **every connector is one shape — a `ConnectorManifest` — and there is no second way to reach an external system** (`docs/connector-standard.md`, `rusty-core/src/connector.rs`). A connector that doesn't fit the standard is a gap in the standard; the work is to close the gap, never to let one connector be the odd one out.

The manifest is one JSON document, content-hashed, registered on the server: identity fields; an https-only `base_url` templated over config; a `connection_specification` in JSON Schema — *everything* a connection needs; `operations`, each with method, path, params schema, declared effect, and ordered auth alternatives; a `check` naming a parameterless read-only GET; and a `hash` that is derived, never chosen. Three properties follow. One declaration serves every surface — Studio's form, server validation, sealed-secret extraction, the tools an agent sees, the egress policy all read the same document, so nothing drifts. Content addressing means a manifest cannot change under a connection configured against it. And **the check is the gate**: a configuration is proven against the real system before it is stored — "saved" means "answered."

The rules behind the manifest read like scar tissue, because they are:

- **The spec must constrain.** `additionalProperties: false` at every object level, including inside `oneOf`. An undeclared field is a refusal, not a silent extra. (This is the rule the stray `credentials.oauth` block broke.)
- **Alternatives are declared, not improvised.** Multiple auth methods are a `oneOf` over closed objects with a `const` discriminator. Selection is a question about shapes, answered without touching the network; once an alternative is selected, its failure is fatal and says what the other system said — no falling through to a misleading "your config was wrong."
- **Secrets are marked, sealed, and never come back.** `rusty_secret: true` on a property means Studio renders it as a secret, the server extracts it before anything persists, seals it through the credential broker, and serves the instance back with the marker in its place. The studio cannot read a saved secret, and neither can a run's journal.
- **Every operation declares its effect.** `read_only`, `idempotent`, `compensatable`, `irreversible` — this is what the gate, the approval policy, and the receipt all read. An operation without an honest effect is a governance hole, not a convenience.
- **The hash is the server's to compute.** A hand-written manifest arrives hashless and the registration door seals it. Requiring clients to canonicalize would make the connector surface Rust-only — the opposite of a standard.

Egress deserves its own sentence: connector traffic passes through a dedicated egress policy (`rusty-core/src/egress.rs`, wired in `rusty-server/src/connectors.rs`) — host-level allowlisting with DNS discipline against SSRF, so "the agent may call ServiceNow" means the *resolved address* is checked, not just the string in the manifest.

::: tip Key takeaways
- `Tool` / `ToolRegistry` / `ToolExecutor`: parallel dispatch, order-preserving results, failure isolated per call into an `ERROR:` message the model can read.
- Two taxonomies on every tool: `Effect` for retry safety, `EffectClass` + `SandboxRequirement` for execution placement.
- MCP tools are ordinary tools once listed — same executor, same journal; hostile framing is capped before allocation.
- A connector is one manifest, content-hashed, with a constraining spec, declared auth alternatives, sealed secrets, per-operation effects, and a live check as the storage gate.
- Egress is enforced at resolution, not at the string.
:::

**Further reading**

- [docs/connector-standard.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/connector-standard.md) — the manifest rules and the reasons behind them
- [rusty-core/src/tool.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/tool.rs) — the tool trait, registry, and executor
- [rusty-core/src/mcp.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/mcp.rs) — the MCP client
- [rusty-core/src/egress.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/egress.rs) — the egress policy with DNS discipline
