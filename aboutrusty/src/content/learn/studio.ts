import type { Article } from "./types";

export const studio: Article = {
  slug: "studio",
  title: "Rusty Studio: the zero-build debug UI",
  description:
    "Two UIs, one server: the v4 React app (studio/ui) — ten screens from Command Center to Operations — and the zero-build single-file debug console: live event feeds, checkpoint timelines, fork/replay as buttons, a Flight Recorder with causal paths, and a governed-memory ledger.",
  readingTime: "8 min read",
  kicker: "Guide",
  blocks: [
    {
      type: "callout",
      variant: "quote",
      text: "Rusty Studio is two UIs in one repo: the v4 React app (`studio/ui`) and the zero-build, single-file debug console (`studio/index.html`) — vanilla JS + CSS, no npm, no framework, no bundler — open it and point it at a running server. The v4 app first; the legacy console below.",
    },
    {
      type: "code",
      language: "text",
      title: "studio/",
      code: `studio/
├── ui/          ← the v4 React app (ten screens, lifecycle navigation)
├── index.html   ← the legacy zero-build console (open this)
├── serve.py     ← optional same-origin static host + API proxy
└── test-*.mjs   ← node unit-test suites for the UI helpers (test-all.mjs runs them all)`,
    },

    { type: "heading", level: 2, text: "Studio v4: the React app (studio/ui)" },
    {
      type: "paragraph",
      text: "Alongside the legacy single-file console, `studio/ui` is a React application with a lifecycle-oriented navigation model (`studio/ui/src/app/navigation.ts`). Both ship in the repo and both talk to the same server; the legacy console documented below remains the zero-build debug surface — per `docs/versioning.md`, the v4 app's typed wire schemas and committed production bundle are validated in CI against the same-cycle server contract, and the legacy console is a temporary advanced compatibility surface.",
    },
    {
      type: "table",
      head: ["Lifecycle group", "Screens (routes)"],
      rows: [
        ["Oversee", "Command Center (`/`) · Agent Portfolio (`/agents`)"],
        ["Build", "Agent Builder (`/agents/new`) · Prompt Library (`/agents/prompts`) · Skills & Tools (`/skills`) · Knowledge (`/knowledge`)"],
        ["Prove", "Run & Evaluate (`/work`)"],
        ["Operate", "Memory (`/memory`) · Connectors (`/connectors`) · Operations (`/operations`)"],
      ],
      caption: "Ten screens, four lifecycle groups — as routed at main @ d1d1b87.",
    },
    {
      type: "paragraph",
      text: "The **Command Center** is the root route and answers three questions from evidence the server can prove now: what work is moving or recently finished, what needs attention, and what can I do next. Its board groups the current Studio session's recent work by server status — queued (`pending`), working (`running`), needs you (`interrupted` plus current operational exceptions), stuck (`error`), done (`success`) — and joins exceptions from the Operations projection into the needs-you column. If an evidence source is unavailable, the Command Center names it as unavailable; it never presents missing evidence as healthy.",
    },
    {
      type: "paragraph",
      text: "The design contract (`docs/studio-v4-command-center-design.md`) sets the rules: a persistent lifecycle rail on desktop (an in-flow expandable navigator on mobile), every route on a shared page header — one lifecycle context, one task name, one orientation line — and the v4 industrial design language (graphite canvas, rust/copper signal color, compact mono evidence labels). The Skills & Tools, Knowledge, Memory, and Connectors screens front the capability-plane APIs described in [Skills, connectors, and knowledge](/learn/capability-planes).",
    },

    { type: "heading", level: 2, text: "The legacy console: what it can do" },
    {
      type: "list",
      items: [
        "**Connect bar** — server base URL (default `http://127.0.0.1:8100`) plus an optional API key (`X-Api-Key` header). Connect calls `GET /info` and shows service version, checkpointer kind, and every registered graph with channel names. URL, key, and thread list persist in `localStorage`.",
        "**Graphs panel** — one card per registered graph, each with a **New thread** button (`POST /threads`).",
        "**Agent workbench** — a catalog for durable assistants on top of `POST /assistants` / `GET /assistants`: create an agent from a registered behavior, inspect its configuration contract (separating what the server actually executes from catalog metadata and preserved unknown fields), safely **duplicate** an agent without carrying over identity or run history, and import/export a bounded, versioned `rusty.assistant/v1` manifest. A connection-scoped **recent run ledger** in the browser keeps only safe run metadata (identity, status, timing, error category) — prompts and result payloads are deliberately not stored.",
        "**Governed memory ledger** — a tenant-wide, read-only audit surface over `POST /memory/query` and `POST /memory/conflicts`: active, candidate, expired, and superseded records with scope/kind/lifecycle filters, a **provenance spine** connecting each record to its author (human, agent, distiller, or system) and the run, correction, candidate, or journal evidence that produced it, plus a **conflict inbox** that isolates peer records claiming the same key for side-by-side review — the UI never silently picks a winner.",
        "**Durable task queue** — a tenant-wide view (it belongs to no thread) over `GET /tasks?status=…`: kind, status, attempt counter, retry schedule, and pool per task, with a detail card showing the full envelope, lease, and settled result/receipt. **Cancel task** calls `POST /tasks/{id}/cancel`; terminal tasks show the button disabled with the reason.",
        "**Threads panel (local-only)** — the server API (as of v0.7) has **no list-threads endpoint**, so threads live in the browser, keyed by server URL. **Attach by id** re-connects a thread the server already knows (and can re-create it with the same id after a server restart so on-disk checkpoints re-attach). ✕ *forget* only removes the local entry; nothing is deleted server-side.",
        "**Current state** — `GET /threads/{id}/state`, pretty-printed JSON grouped by channel, with `next` nodes and the current checkpoint ref (step, id, timestamp).",
        "**Checkpoint history** — `POST /threads/{id}/history` as a newest-first clickable timeline (step, timestamp, checkpoint id, next nodes).",
        "**Run (background)** — `POST /threads/{id}/runs` + live-polls `GET /runs/{run_id}` with a pulsing status badge until terminal state.",
        "**Run & wait** — `POST /threads/{id}/runs/wait`; terminal JSON (`output` / `interrupt` / `error`) rendered as a result card.",
        "**Interrupt/resume helper** — when a run ends `interrupted`, the interrupt payload is shown with a resume input; the value goes back as `{\"command\": {\"resume\": <value>}}` (parsed as JSON when possible), via *wait* or *stream*.",
        "**Status badges** — `pending` / `running` / `success` / `interrupted` / `error`.",
      ],
    },

    { type: "heading", level: 2, text: "A colored SSE event feed" },
    {
      type: "paragraph",
      text: "**Stream run** — `POST /threads/{id}/runs/stream` via `fetch` + `ReadableStream` (because EventSource can't POST) — renders as a live colored event feed, each frame tagged with its `{checkpoint}:{step}:{seq}` id:",
    },
    {
      type: "table",
      head: ["Event family", "Color in the feed"],
      rows: [
        ["`metadata`", "grey"],
        ["`updates`", "amber"],
        ["`values`", "sage"],
        ["`messages`", "clay"],
        ["`error`", "red"],
        ["`end`", "rust"],
      ],
    },
    {
      type: "paragraph",
      text: "`stream_mode` checkboxes and a `multitask_strategy` selector map straight onto the run payload.",
    },

    { type: "heading", level: 2, text: "Flight Recorder: the run journal as a timeline" },
    {
      type: "paragraph",
      text: "**Load events** fetches `GET /runs/{run_id}/events` (the run id auto-fills from any run you start) and renders the journaled evidence as a scrubbable timeline: one lane per node plus a run-wide lane for super-step boundaries, routing decisions, and checkpoint writes, with event chips colored by `kind` and super-step grouping rows. Click an event for the detail panel — effect-classification badge with its retry/replay meaning, causal parent (click to jump), latency, token usage, cost, and payloads (artifact refs shown as `sha256` + byte size). The **causal path** toggle highlights the selected event's ancestor chain via `parent` links; the scrub slider walks the journal in `seq` order.",
    },
    {
      type: "paragraph",
      text: "**Replay** is exact replay: `POST /runs/replay` re-drives the run from its persisted journal and renders the verdict as a banner — *verified* (every journaled event reproduced byte-for-byte) or *mismatch* (expected vs actual event counts, with the `first_divergence` seq as a jump link into the timeline). **Fork compare** takes two run ids, calls `GET /runs/diff?base=…&branch=…`, and renders both journals side by side aligned by `seq`: the identical prefix is dimmed, the first divergent seq is marked, and column headers carry per-branch event, token, and cost totals.",
    },

    { type: "heading", level: 2, text: "Fork and replay, as buttons" },
    {
      type: "paragraph",
      text: "**Fork at a checkpoint** calls the real `POST /threads/{id}/fork` with `{new_thread_id, checkpoint_id}`; the server copies history up to and including the selected checkpoint into a new thread (`{thread_id}-fork-{step}`), returning `201 {thread_id, checkpoints_copied}`. **Replay & run from a checkpoint** is a background run whose payload carries `\"checkpoint\": {\"checkpoint_id\": …}`; the executor replays from that checkpoint's state and next-node set.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Built-in guardrail",
      text: "The UI itself advises: “Prefer replaying on a fork.”",
    },

    { type: "heading", level: 2, text: "Three ways to open it" },
    {
      type: "list",
      ordered: true,
      items: [
        "**Option A — `serve.py` (same-origin static host + proxy).** Run the demo server and the studio side by side (below), open `http://127.0.0.1:8000/`, and connect with base URL **`/api`**. The proxy forwards `/api/*` to `127.0.0.1:8100`; it also flushes SSE per chunk and sets `X-Accel-Buffering: no` so streams render live.",
        "**Option B — any static host.** `cd studio && python3 -m http.server 8000`, then connect to `http://127.0.0.1:8100`. Works cross-origin because `rusty-server` v0.3+ sends permissive CORS headers.",
        "**Option C — double-click `index.html` (file://).** Works too: the page runs from `file://` (origin `null`) and the server's permissive CORS layer answers those cross-origin calls as well.",
      ],
    },
    {
      type: "code",
      language: "bash",
      title: "Option A — two terminals",
      code: `# terminal 1: the demo server
cargo run --example server_demo          # http://127.0.0.1:8100

# terminal 2: the studio
python3 studio/serve.py                  # http://127.0.0.1:8000/`,
    },
    {
      type: "callout",
      variant: "note",
      title: "Which port: 8100 or 8080?",
      text: "Both appear in the docs, in different contexts — not a typo. The demo server (`examples/server_demo`) and `serve.py`'s proxy target use `127.0.0.1:8100`; the server-quickstart article's hand-rolled `main.rs` binds `0.0.0.0:8080`.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Restrict CORS in production",
      text: "`rusty-server` v0.3+ layers `tower_http::cors::CorsLayer::permissive()` as the outermost middleware — every response carries `access-control-allow-origin: *`, and OPTIONS preflights are answered before the API-key middleware. **Production deployments should restrict this** (the permissive layer is a dev convenience).",
    },

    { type: "heading", level: 2, text: "Honest limitations" },
    {
      type: "list",
      items: [
        "Thread list is local-only (still no `GET /threads` list endpoint server-side; thread records themselves are durable — one JSON file per record under `store_path`, `server_threads` on Postgres — and the server reloads them at boot). The **Attach** flow re-connects a thread the server already knows by id.",
        "Replay on the original thread appends history (checkpoint history is append-only); fork first to branch. Rollback of a finished run (`DELETE /threads/{id}/runs/{run_id}`) exists server-side but is **not** exposed in the UI.",
        "Pre-v0.3 servers: fork falls back to client-side composition; the replay `checkpoint` field is silently ignored — upgrade the server for real replay.",
        "Flight Recorder, exact replay, and fork compare need an R0.5+ server build (`GET /runs/{id}/events`, `POST /runs/replay`, `GET /runs/diff`); the task queue needs R0.6+ (`GET /tasks`, `POST /tasks/{id}/cancel`). Against older builds the panels explain the missing route and stay inert instead of erroring.",
        "Exact replay only accepts fully deterministic journals: runs containing model, tool, remote, WASM, or resume effects are refused — replay the original run instead.",
        "SSE resume (`Last-Event-ID`, honored by `GET /runs/{id}/stream`) is implemented server-side but not surfaced in the UI — reload the page and the live feed starts fresh.",
        "The memory ledger is read-only by design: corrections, candidate approval, conflict resolution, and forgetting stay server-governed operations.",
        "Single-process server with in-memory run registry: background-run polling (and Flight Recorder events) 404s for runs created before a server restart.",
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "The demo server",
      text: "The demo (`examples/server_demo`) registers two graphs on `127.0.0.1:8100`: `pipeline` (channel `log`, nodes `first → second`, no network) and `react_agent` (channel `messages`, scripted model + echo tool, no network).",
    },
  ],
};
