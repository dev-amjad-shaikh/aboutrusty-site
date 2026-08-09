import type { Article } from "./types";

export const flightRecorder: Article = {
  slug: "flight-recorder",
  title: "The Flight Recorder: every run is evidence",
  description:
    "RunEvent contracts, a causal effect journal with a hash-chained head, exact replay with zero outbound calls, portable CI fixtures, and branch diff — the four Flight Recorder endpoints.",
  readingTime: "8 min read",
  kicker: "Concepts",
  blocks: [
    {
      type: "callout",
      variant: "quote",
      text: "Observability systems record so humans can look. The Flight Recorder records so a runtime can learn — and prove what it learned from.",
    },
    {
      type: "paragraph",
      text: "Every run is journaled as replayable evidence: canonical `RunEvent` contracts (`rusty-core/src/record.rs`), a causal effect journal (`journal.rs`), and a tamper-evident, SHA-256 hash-chained head over every event. What gets recorded is what the run **did to the world** — model calls, tool calls, interrupts, routing decisions, checkpoint writes — not spans for a human to eyeball.",
    },

    { type: "heading", level: 2, text: "One recorded fact: RunEvent" },
    {
      type: "paragraph",
      text: "The atomic evidence unit is `RunEvent`: deterministic id (`{run_id}:{seq}`), `run_id`, `thread_id`, `node_id`, a monotonic `seq`, a closed `kind` enum (super-step start/end, node input/output, model call, tool call, remote call, WASM call, interrupt, resume, routing decision, checkpoint written), an `effect` class, input/output as `PayloadRef` (inline ≤ 4 KiB, `ArtifactRef` with SHA-256 content hash above), `latency_ms`, `tokens`, `cost_usd`, `status`, and a causal `parent` event id.",
    },
    {
      type: "paragraph",
      text: "Two properties make it evidence rather than logs. **`seq` is the total order** — wall time is just an attribute. And **`parent` forms the causal chain**: a node input's parent is its super-step start; a model call's parent is the invocation that made it (delivered to node code via the reserved `NodeConfig::extra` key `rusty.parent_event`); a checkpoint write's parent is the routing decision that ended the step.",
    },
    {
      type: "paragraph",
      text: "Every journaled event also declares the **effect class** of whatever produced it — declared at production time, because \"was that call safe to retry?\" is not answerable after the fact from a log line:",
    },
    {
      type: "table",
      head: ["Effect class", "Re-execution", "Retry / replay guarantee"],
      rows: [
        ["`Pure`", "safe and equivalent", "unconstrained; output may be re-derived or reused"],
        ["`ReadOnly`", "safe, not equivalent", "exact replay serves the journaled output; live replay re-reads"],
        ["`Idempotent`", "safe under a stable key", "retry with the same idempotency key; replay may serve the receipt"],
        ["`Compensatable`", "duplicates the effect", "retry only with care; rollback pairs effect with compensation"],
        ["`NonIdempotent`", "duplicates, no compensation", "never silently retried or replayed; re-execution is explicit"],
      ],
      caption: "Defaults are honest and conservative: plain nodes are `Pure`; models, tools, remote and WASM nodes are `NonIdempotent`. Override via `Node::effect`, `Tool::effect`, `ChatModel::effect`.",
    },

    { type: "heading", level: 2, text: "The journal: append-only, hash-chained" },
    {
      type: "paragraph",
      text: "`Journal` is append-only, in-memory, cheap to clone, thread-safe. The executor writes super-step boundaries, node inputs/outputs, interrupts, resumes, routing decisions, and checkpoint writes; nodes record their own model, tool, remote, and WASM calls through the same journal. The journal assigns `seq` and ids, promotes oversized payloads into a content-addressed artifact map, and chains a SHA-256 head hash over every event. `Executor::journal()` exposes the most recent run's journal — **evidence of a failed run is still evidence**.",
    },
    {
      type: "paragraph",
      text: "`JournalSnapshot` is the serde-complete export — events + artifacts + head hash — and the unit portable replay fixtures are built from. `Journal::from_snapshot` re-verifies the head hash on load, so edited or corrupt evidence **fails at the boundary**, not deep inside a replay.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Determinism is a seam, not a property",
      text: "Time and randomness are injectable providers, configured per run: `Clock::logical(start_ms, tick_ms)` and `RngSource::seeded(u64)` replace the system defaults. With both seams set, two drives of the same graph produce **byte-identical journal snapshots** — which is what makes exact replay verifiable.",
    },

    { type: "heading", level: 2, text: "Exact replay: zero outbound calls" },
    {
      type: "callout",
      variant: "quote",
      text: "Exact replay re-drives a recorded run with zero outbound calls — models and tools are served from the journal, never executed.",
    },
    {
      type: "paragraph",
      text: "The seam is a pair of wrapper types per effect kind, so the **same graph code** runs in both modes. On record, `RecordingChatModel` / `RecordingTool` wrap the real implementations, journal each call in a canonical request/response shape, and return the real response. On replay, `ReplayingChatModel` / `ReplayingTool` wrap the same implementations but **never invoke them** — there is no code path from `chat`/`call` to the wrapped value, so replaying against panic-on-call sentinels or credential-less clients is safe.",
    },
    {
      type: "paragraph",
      text: "Each call is matched against the journal **by sequence and request hash** through a shared `ReplaySource` cursor, answered with the recorded response, and re-journaled into the replay run's journal — so the replayed evidence reproduces the recorded evidence byte-for-byte. Mismatch fails loudly with `RustyError::Replay`: divergence (request hash disagrees), order violation (effects out of journaled sequence), exhaustion (more work issued than recorded), or shortfall (recorded effects never served). Interrupts need no serving — node logic re-derives the same interrupt from deterministic effects, checkpoint id included.",
    },
    {
      type: "paragraph",
      text: "`ExactReplay::new` re-verifies the snapshot up front (chained head hash, artifact integrity, dangling references — tampered journals are rejected at the boundary), and `run_and_verify` requires the replayed journal to equal the recorded one event-for-event. Byte-identity requires the recorded run's determinism seams: logical clock parameters and RNG seed.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Resumed runs are not exact-replayable",
      text: "A journal that begins with a resume event starts mid-run against checkpointed state the journal does not carry; `ExactReplay::new` rejects it. Replay the original run's journal instead.",
    },

    { type: "heading", level: 2, text: "Portable fixtures: replay it anywhere" },
    {
      type: "paragraph",
      text: "`ReplayFixture` bundles a recorded run for CI: `format_version`, the graph's topology hash, the journal snapshot, the final checkpoint, and metadata (name, logical-clock parameters, RNG seed). `export`/`import` are the JSON wire boundary — import re-verifies format version and journal integrity — and `replay_in_ci` replays the bundle end to end: topology check, byte-identical journal verification, final-state comparison. A checked-in example lives at `rusty-core/tests/fixtures/exact_replay_agent_tools.json`.",
    },
    {
      type: "paragraph",
      text: "Export a run from the server, check it in, replay it on another machine:",
    },
    {
      type: "code",
      language: "bash",
      title: "terminal",
      code: `# Download the run as a portable fixture
curl -s localhost:8080/runs/$RUN_ID/fixture > fixture.json

# In CI (Rust): ReplayFixture::import(&json)?.replay_in_ci(&graph)?`,
    },
    {
      type: "callout",
      variant: "note",
      title: "Two fixture caveats",
      text: "A run that never reached a checkpoint boundary answers `409` — the fixture would be empty evidence. And server runs record under the system clock and OS entropy, so the fixture carries no logical-clock / RNG-seed parameters: `exact_replay` sessions work, but byte-identical CI replay requires runs recorded with the determinism seams set.",
    },

    { type: "heading", level: 2, text: "Diff: compare two runs" },
    {
      type: "paragraph",
      text: "`BranchDiff::between(base, branch)` diffs two journal snapshots — typically two continuations of one forked history. Events compare **logically** (kind, node, seq, effect class, resolved payloads, latency, tokens, cost, status; identity/timing fields excluded, since branches are separate runs). The diff reports the first divergent `seq`, the events added and removed from the divergence onward, per-super-step state-channel value diffs, and per-branch token/cost totals.",
    },
    {
      type: "code",
      language: "bash",
      title: "terminal",
      code: `curl -s "localhost:8080/runs/diff?base=$BASE_RUN&branch=$BRANCH_RUN"
# { "first_divergent_seq": 7, "added": […], "removed": […],
#   "step_diffs": […], "base_totals": {…}, "branch_totals": {…} }`,
    },

    { type: "heading", level: 2, text: "The HTTP surface" },
    {
      type: "table",
      head: ["Endpoint", "Returns"],
      rows: [
        ["`GET /runs/{id}/events`", "`{run_id, events, complete}` — the journaled evidence; survives run eviction and restart via the store fallback"],
        ["`GET /runs/{id}/fixture`", "The run as a portable `ReplayFixture` (409 before the first checkpoint boundary)"],
        ["`POST /runs/replay`", "Body `{\"run_id\": \"…\"}` → `{verified, expected_events, actual_events, first_divergence}`"],
        ["`GET /runs/diff`", "`?base=<run_id>&branch=<run_id>` → core's `BranchDiff` shape as-is"],
      ],
      caption: "Unknown and cross-tenant runs answer 404, exactly like `GET /runs/{id}` — 404, never 403.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Server-side replay cannot serve effects",
      text: "`POST /runs/replay` re-executes the registered graph code, so it answers `409` for runs that journaled model, tool, remote, or WASM calls — there is nothing in the server process to serve them from. Download the fixture and replay it in CI with `ReplayFixture`, where the replaying wrappers serve every recorded effect from the journal.",
    },

    { type: "heading", level: 2, text: "A guaranteed-stable surface" },
    {
      type: "paragraph",
      text: "Flight Recorder evidence formats are one of the **three surfaces that carry a stability guarantee at v0.x** (alongside the remote-execution wire protocol and the checkpoint format). The `RunEvent` / `Effect` / `DecisionEvent` wire shapes, the `CheckpointHeader` stamped into every checkpoint (`format_version` 1), the `JournalSnapshot` export form, and the `ReplayFixture` envelope (`FIXTURE_FORMAT_VERSION` = 1) are pinned by golden-file tests under `rusty-core/tests/golden/` — accidental drift fails CI.",
    },
    {
      type: "paragraph",
      text: "Within a `rusty-agent-runtime` minor line the shapes evolve **additively via serde defaults**: journals, fixtures, and checkpoint headers written by one release in the line deserialize under every other release in the line (pre-R0.5 checkpoints load with a default header — that fallback is part of the contract). `ReplayFixture::import` rejects an unsupported `format_version` at the boundary rather than misreading it; a non-additive change is a minor-release event with a CHANGELOG entry and a migration path.",
    },

    { type: "heading", level: 2, text: "See it in Studio" },
    {
      type: "paragraph",
      text: "[Rusty Studio](/learn/studio) renders `GET /runs/{id}/events` as a scrubbable **Flight Recorder timeline** — super-steps grouped on per-node lanes, with effect class, status, latency, tokens, and cost per event. The **causal path** toggle highlights the selected event's ancestor chain back to its super-step start, and **branch compare** calls `GET /runs/diff`, then renders both journals side by side with per-branch totals from the diff. The timeline auto-loads when a run reaches a terminal state; you can also paste any run id.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Why evidence comes first",
      text: "The roadmap's sequencing rule is replay before learning: no learning mechanism ships before the run evidence it learns from can be faithfully recorded, evaluated, and rolled back. The Flight Recorder is what makes that rule implementable — see [Roadmap and the stability contract](/learn/roadmap-and-stability).",
    },
  ],
};
