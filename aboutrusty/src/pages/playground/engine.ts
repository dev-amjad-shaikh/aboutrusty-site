/**
 * A deterministic, in-browser model of Rusty's executor. No backend and no
 * randomness. The rules follow rusty-core and rusty-server on main:
 *
 * - rusty-core/src/executor.rs: zero-based super-steps (plan, spawn,
 *   barrier, merge, route, checkpoint); a failed node aborts the step and
 *   discards every write; an interrupt discards the step's writes and the
 *   suspension checkpoint reschedules the whole active set; resume re-runs
 *   those nodes with the resume value broadcast to the first step; a run
 *   restored from a checkpoint starts at `step = checkpoint.step`;
 *   `max_steps` (default 1000) suspends the run with `rusty.halted`.
 * - rusty-core/src/state.rs: `apply_super_step` sorts writes by node name,
 *   validates the whole step before touching state, and rejects a second
 *   write to an Overwrite channel with InvalidUpdate.
 * - rusty-core/src/checkpoint.rs: `fork_thread` copies history up to and
 *   including the chosen checkpoint; `get_latest` recency is insertion order.
 * - rusty-server/src/runs.rs: SSE frames `metadata`, `updates`, `values`,
 *   `error`, `end`, ids `{checkpoint_id}:{step}:{seq}`, one sink per run.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScenarioId = "react" | "fanout" | "approval";
export type ReducerName = "overwrite" | "append" | "add_messages";
export type ChannelState = Record<string, unknown>;

export interface Channel {
  name: string;
  reducer: ReducerName;
}

export interface Checkpoint {
  id: string;
  thread_id: string;
  step: number;
  state: ChannelState;
  next_nodes: string[];
  /** Insertion counter, the stand-in for created_at. */
  created: number;
  /** Why it was written. "boundary" is the normal end-of-step checkpoint. */
  kind: "boundary" | "interrupt" | "ceiling";
  /** Interrupt payload for suspension checkpoints. */
  interrupt?: unknown;
}

export interface SimFrame {
  id: string;
  event: "metadata" | "updates" | "values" | "error" | "end";
  data: unknown;
}

export type ThreadStatus = "ready" | "running" | "interrupted" | "done" | "error";

/** How the next run on a thread starts (the RunConfig the caller would send). */
export interface Launch {
  checkpointId?: string;
  resume?: { value: unknown };
}

export interface ActiveRun {
  attempt: number;
  seq: number;
  /** Checkpoint component of the next frame id; "-" until this run writes one. */
  lastCp: string;
  /** Step of the most recently pushed frame (the server's current_step). */
  lastStep: number;
  stepsRun: number;
  /** Resume value for the first super-step only. */
  resume?: { value: unknown };
  launch: Launch;
}

export interface ThreadSim {
  id: string;
  scenario: ScenarioId;
  fork: boolean;
  forkedFrom?: { thread: string; checkpoint: string; step: number };
  status: ThreadStatus;
  state: ChannelState;
  next: string[];
  step: number;
  attempts: number;
  checkpoints: Checkpoint[];
  frames: SimFrame[];
  run: ActiveRun | null;
  /** RunConfig for the next run when the thread is not running. */
  launch: Launch;
  interrupt?: unknown;
  error?: { kind: string; message: string };
}

export interface Options {
  maxSteps: number;
  /** search_code returns an error (fanout scenario). */
  failNode: boolean;
  /** findings is declared Overwrite instead of Append (fanout scenario). */
  singleWrite: boolean;
}

export const DEFAULT_OPTIONS: Options = { maxSteps: 1000, failNode: false, singleWrite: false };

export type LaneStatus = "ok" | "interrupted" | "failed" | "discarded" | "aborted";

export interface Lane {
  node: string;
  /** Simulated run time; decides finish order at the barrier. */
  ms: number;
  status: LaneStatus;
  /** 1-based finish order, when the node reported before the barrier closed. */
  finished?: number;
  writes?: Record<string, unknown>;
  error?: string;
  resumeSeen: boolean;
}

export interface StepResult {
  kind: "step" | "ceiling";
  step: number;
  active: string[];
  lanes: Lane[];
  /** Nodes whose writes merged, in merge order (sorted by name). */
  mergeOrder: string[];
  before: ChannelState;
  after: ChannelState;
  next: string[];
  routes: { from: string; to: string }[];
  checkpoint?: Checkpoint;
  /** Frames pushed at the merge (updates) and at the end of the step. */
  mergeFrames: SimFrame[];
  endFrames: SimFrame[];
  outcome: "continue" | "done" | "interrupted" | "error";
  interrupt?: unknown;
  error?: { kind: string; message: string };
  /** Last stage the animation reaches: 2 barrier, 3 merge, 5 checkpoint. */
  lastStage: number;
  run: ActiveRun;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  conditional?: boolean;
  label?: string;
  /** Perpendicular bend, for the two edges of a cycle. */
  bend?: number;
}

type NodeResult =
  | { kind: "ok"; writes: Record<string, unknown> }
  | { kind: "interrupt"; payload: unknown }
  | { kind: "error"; error: string };

interface NodeCtx {
  resume?: { value: unknown };
  fork: boolean;
  opts: Options;
}

interface ScenarioDef {
  id: ScenarioId;
  graph: string;
  label: string;
  summary: string;
  entry: string;
  channels: (opts: Options) => Channel[];
  initial: () => ChannelState;
  nodes: GraphNode[];
  edges: GraphEdge[];
  ms: Record<string, number>;
  run: (node: string, state: ChannelState, ctx: NodeCtx) => NodeResult;
  /** Outgoing targets of a node that ran, against the merged state. "END" ends. */
  route: (node: string, state: ChannelState) => string[];
}

export const END = "END";

// ----- ReAct ---------------------------------------------------------------

interface Msg {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; name: string; args: Record<string, unknown> }[];
  tool_call_id?: string;
}

const TOOL_PLAN = [
  { name: "get_current_time", args: {} },
  { name: "calculator", args: { a: 128, b: 46, op: "multiply" } },
  { name: "word_count", args: { text: "the quick brown fox jumps over the lazy dog" } },
];

function toolResult(name: string): string {
  if (name === "get_current_time") return "2026-09-28 09:14:03 UTC";
  if (name === "calculator") return "5888";
  return JSON.stringify({ words: 9, characters: 43 });
}

function messages(state: ChannelState): Msg[] {
  const m = state.messages;
  return Array.isArray(m) ? (m as Msg[]) : [];
}

/**
 * The scripted model. On the original thread it asks for all three tools at
 * once. On a fork it asks for one tool per turn and checks the arithmetic
 * once more before answering, so a replay from any checkpoint takes a
 * different path through the same graph.
 */
function modelReply(msgs: Msg[], fork: boolean): Msg {
  const answered = new Set(msgs.filter((m) => m.role === "tool").map((m) => m.tool_call_id));
  const id = `a${msgs.filter((m) => m.role === "assistant").length + 1}`;
  const pending = TOOL_PLAN.map((t, i) => ({ ...t, id: `call_${i}` })).filter((t) => !answered.has(t.id));
  if (pending.length === 0) {
    if (fork && !answered.has("call_check")) {
      return {
        id,
        role: "assistant",
        content: "",
        tool_calls: [{ id: "call_check", name: "calculator", args: { a: 46, b: 128, op: "multiply" } }],
      };
    }
    return {
      id,
      role: "assistant",
      content: `It is 09:14 UTC. 128 × 46 = 5888${fork ? " (checked twice)" : ""}. The sentence has 9 words.`,
    };
  }
  const batch = fork ? pending.slice(0, 1) : pending;
  return {
    id,
    role: "assistant",
    content: "",
    tool_calls: batch.map(({ id: callId, name, args }) => ({ id: callId, name, args })),
  };
}

const REACT: ScenarioDef = {
  id: "react",
  graph: "react_agent",
  label: "ReAct agent",
  summary: "agent and tools in a loop over one messages channel.",
  entry: "agent",
  channels: () => [{ name: "messages", reducer: "add_messages" }],
  initial: () => ({
    messages: [
      {
        id: "u1",
        role: "user",
        content: "What time is it in UTC? Multiply 128 by 46. Count the words in 'the quick brown fox jumps over the lazy dog'.",
      },
    ],
  }),
  nodes: [
    { id: "agent", x: 120, y: 92 },
    { id: "tools", x: 370, y: 92 },
    { id: END, x: 245, y: 190 },
  ],
  edges: [
    { from: "agent", to: "tools", conditional: true, label: "tool calls", bend: -40 },
    { from: "tools", to: "agent", bend: -40 },
    { from: "agent", to: END, conditional: true, label: "answer" },
  ],
  ms: { agent: 120, tools: 80 },
  run(node, state, ctx) {
    const msgs = messages(state);
    if (node === "agent") return { kind: "ok", writes: { messages: [modelReply(msgs, ctx.fork)] } };
    const last = [...msgs].reverse().find((m) => m.role === "assistant");
    const results: Msg[] = (last?.tool_calls ?? []).map((c) => ({
      id: `t_${c.id}`,
      role: "tool",
      tool_call_id: c.id,
      content: toolResult(c.name),
    }));
    return { kind: "ok", writes: { messages: results } };
  },
  route(node, state) {
    if (node === "tools") return ["agent"];
    const last = messages(state).at(-1);
    return last?.tool_calls?.length ? ["tools"] : [END];
  },
};

// ----- Parallel fan-out ----------------------------------------------------

const SOURCES: Record<string, string> = {
  search_changelog: "CHANGELOG.md",
  search_code: "rusty-core/src/checkpoint.rs",
  search_docs: "docs/architecture.md",
};

const FANOUT: ScenarioDef = {
  id: "fanout",
  graph: "research",
  label: "Parallel fan-out",
  summary: "three searches run in one step and merge at the barrier.",
  entry: "plan",
  channels: (opts) => [
    { name: "question", reducer: "overwrite" },
    { name: "findings", reducer: opts.singleWrite ? "overwrite" : "append" },
    { name: "summary", reducer: "overwrite" },
  ],
  initial: () => ({ question: "Where does Rusty write checkpoints?" }),
  nodes: [
    { id: "plan", x: 46, y: 110 },
    { id: "search_changelog", x: 205, y: 40 },
    { id: "search_code", x: 205, y: 110 },
    { id: "search_docs", x: 205, y: 180 },
    { id: "summarize", x: 364, y: 110 },
    { id: END, x: 452, y: 110 },
  ],
  edges: [
    { from: "plan", to: "search_changelog" },
    { from: "plan", to: "search_code" },
    { from: "plan", to: "search_docs" },
    { from: "search_changelog", to: "summarize" },
    { from: "search_code", to: "summarize" },
    { from: "search_docs", to: "summarize" },
    { from: "summarize", to: END },
  ],
  // search_docs finishes first and search_code last, so finish order and
  // merge order (sorted by name) differ.
  ms: { plan: 60, search_docs: 70, search_changelog: 110, search_code: 160, summarize: 90 },
  run(node, state, ctx) {
    if (node === "plan") return { kind: "ok", writes: {} };
    if (node === "summarize") {
      const f = Array.isArray(state.findings) ? state.findings : state.findings ? [state.findings] : [];
      const files = (f as { file: string }[]).map((x) => x.file);
      return { kind: "ok", writes: { summary: `${files.length} source(s): ${files.join(", ")}` } };
    }
    if (node === "search_code" && ctx.opts.failNode) {
      return { kind: "error", error: "tool error: code index returned 503" };
    }
    return { kind: "ok", writes: { findings: { source: node.replace("search_", ""), file: SOURCES[node] } } };
  },
  route(node) {
    if (node === "plan") return ["search_changelog", "search_code", "search_docs"];
    if (node === "summarize") return [END];
    return ["summarize"];
  },
};

// ----- Human approval ------------------------------------------------------

function approved(state: ChannelState): boolean {
  const a = state.approval as { approved?: boolean } | undefined;
  return a?.approved === true;
}

const APPROVAL: ScenarioDef = {
  id: "approval",
  graph: "publisher",
  label: "Human approval",
  summary: "approve waits for a person while log_request runs beside it.",
  entry: "draft",
  channels: () => [
    { name: "draft", reducer: "overwrite" },
    { name: "audit", reducer: "append" },
    { name: "approval", reducer: "overwrite" },
    { name: "published", reducer: "overwrite" },
  ],
  initial: () => ({}),
  nodes: [
    { id: "draft", x: 50, y: 110 },
    { id: "approve", x: 196, y: 58 },
    { id: "log_request", x: 196, y: 172 },
    { id: "publish", x: 350, y: 58 },
    { id: END, x: 350, y: 172 },
  ],
  edges: [
    { from: "draft", to: "approve" },
    { from: "draft", to: "log_request" },
    { from: "approve", to: "publish", conditional: true, label: "approved" },
    { from: "approve", to: END, conditional: true, label: "rejected" },
    { from: "log_request", to: END },
    { from: "publish", to: END },
  ],
  // log_request finishes before approve reaches the barrier.
  ms: { draft: 60, log_request: 40, approve: 120, publish: 70 },
  run(node, state, ctx) {
    if (node === "draft") return { kind: "ok", writes: { draft: "Release notes for v0.13" } };
    if (node === "log_request") {
      return { kind: "ok", writes: { audit: { event: "approval_requested", resume_seen: ctx.resume !== undefined } } };
    }
    if (node === "approve") {
      if (ctx.resume === undefined) {
        return { kind: "interrupt", payload: { question: "Publish this draft?", draft: state.draft ?? null } };
      }
      return { kind: "ok", writes: { approval: ctx.resume.value } };
    }
    return { kind: "ok", writes: { published: { draft: state.draft ?? null } } };
  },
  route(node, state) {
    if (node === "draft") return ["approve", "log_request"];
    if (node === "approve") return approved(state) ? ["publish"] : [END];
    return [END];
  },
};

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = { react: REACT, fanout: FANOUT, approval: APPROVAL };

export const RESUME_SNIPPET = `// Check resume_value() first; interrupt only when there is no decision yet.
// On resume the node runs again from the top, so it must be idempotent.
match ctx.resume_value() {
    Some(decision) => Ok(NodeOutput::update("approval", decision.clone())),
    None => Err(ctx.interrupt(json!({ "question": "Publish this draft?" }))),
}`;

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

let created = 0;

/** Short deterministic stand-in for the executor's UUID checkpoint ids. */
function nextCheckpointId(): string {
  created += 1;
  return ((0x3f9a2c1e + created * 0x9e3779b1) >>> 0).toString(16).padStart(8, "0");
}

function frame(run: ActiveRun, step: number, event: SimFrame["event"], data: unknown): SimFrame {
  run.seq += 1;
  run.lastStep = step;
  return { id: `${run.lastCp}:${step}:${run.seq}`, event, data };
}

// ---------------------------------------------------------------------------
// Reducers and the merge (StateSpec::apply_super_step)
// ---------------------------------------------------------------------------

function reduce(reducer: ReducerName, current: unknown, update: unknown): unknown {
  if (reducer === "overwrite") return update;
  const base = Array.isArray(current) ? [...current] : [];
  const incoming = Array.isArray(update) ? update : [update];
  if (reducer === "append") return [...base, ...incoming];
  for (const msg of incoming as { id?: unknown }[]) {
    const i = typeof msg.id === "string" ? base.findIndex((m) => (m as { id?: unknown }).id === msg.id) : -1;
    if (i >= 0) base[i] = msg;
    else base.push(msg);
  }
  return base;
}

type MergeResult = { ok: true; state: ChannelState; order: string[] } | { ok: false; message: string };

function merge(state: ChannelState, writes: [string, Record<string, unknown>][], channels: Channel[]): MergeResult {
  const sorted = [...writes].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const reducerOf = new Map(channels.map((c) => [c.name, c.reducer]));
  const firstWriter = new Map<string, string>();
  for (const [node, updates] of sorted) {
    for (const channel of Object.keys(updates)) {
      const reducer = reducerOf.get(channel);
      if (!reducer) {
        return { ok: false, message: `node \`${node}\` wrote to undeclared channel \`${channel}\`; declare it in the StateSpec` };
      }
      const first = firstWriter.get(channel);
      if (first !== undefined && reducer === "overwrite") {
        return {
          ok: false,
          message:
            `channel \`${channel}\` can receive only one value per super-step (reducer: ${reducer}); ` +
            `already written by node \`${first}\`, second write from node \`${node}\`. ` +
            "Use a multi-write reducer (Append/DeepMerge/AddMessages) to handle concurrent writes.",
        };
      }
      if (first === undefined) firstWriter.set(channel, node);
    }
  }
  const next = { ...state };
  for (const [, updates] of sorted) {
    for (const [channel, value] of Object.entries(updates)) {
      next[channel] = reduce(reducerOf.get(channel)!, next[channel], value);
    }
  }
  return { ok: true, state: next, order: sorted.filter(([, u]) => Object.keys(u).length > 0).map(([n]) => n) };
}

// ---------------------------------------------------------------------------
// Threads and runs
// ---------------------------------------------------------------------------

export function createThread(scenario: ScenarioId, id: string): ThreadSim {
  return {
    id,
    scenario,
    fork: false,
    status: "ready",
    state: SCENARIOS[scenario].initial(),
    next: [SCENARIOS[scenario].entry],
    step: 0,
    attempts: 0,
    checkpoints: [],
    frames: [],
    run: null,
    launch: {},
  };
}

/**
 * Executor::run with the thread's pending RunConfig. A resume without a
 * checkpoint id loads get_latest (the last checkpoint inserted); with a
 * checkpoint id it loads that one. Either way state, next-node set and step
 * come from the checkpoint. The server opens a new frame sink per run, so
 * seq restarts at 1 and frame ids use "-" until this run writes a checkpoint.
 */
export function startRun(t: ThreadSim): ThreadSim {
  const def = SCENARIOS[t.scenario];
  const launch = t.launch;
  const attempt = t.attempts + 1;
  const run: ActiveRun = { attempt, seq: 0, lastCp: "-", lastStep: 0, stepsRun: 0, resume: launch.resume, launch };
  const frames = [
    ...t.frames,
    frame(run, 0, "metadata", { run_id: `run_${t.id}_${attempt}`, thread_id: t.id, graph: def.graph, attempt, metadata: null }),
  ];
  let state = def.initial();
  let next = [def.entry];
  let step = 0;
  if (launch.checkpointId !== undefined || launch.resume !== undefined) {
    const cp =
      launch.checkpointId !== undefined
        ? t.checkpoints.find((c) => c.id === launch.checkpointId)
        : t.checkpoints[t.checkpoints.length - 1];
    if (cp) {
      state = cp.state;
      next = cp.next_nodes;
      step = cp.step;
    }
  }
  const base: ThreadSim = { ...t, attempts: attempt, state, next, step, frames, run, status: "running", interrupt: undefined, error: undefined };
  if (next.length === 0) {
    // Restored from a checkpoint with nothing scheduled: Done without a step.
    const end = frame(run, run.lastStep, "end", { status: "success" });
    return { ...base, frames: [...frames, end], run: null, status: "done", launch: {} };
  }
  return base;
}

function newCheckpoint(t: ThreadSim, step: number, state: ChannelState, next: string[], kind: Checkpoint["kind"], interrupt?: unknown): Checkpoint {
  return { id: nextCheckpointId(), thread_id: t.id, step, state, next_nodes: [...next], created: created, kind, interrupt };
}

/** One iteration of the executor loop for a running thread. Pure. */
export function computeStep(t: ThreadSim, opts: Options): StepResult {
  if (!t.run) throw new Error("computeStep needs a running thread");
  const def = SCENARIOS[t.scenario];
  const channels = def.channels(opts);
  const run: ActiveRun = { ...t.run };
  const step = t.step;
  const active = t.next;
  const before = t.state;

  // The ceiling is checked at the top of the loop, before the step runs.
  if (run.stepsRun >= opts.maxSteps) {
    const halted = {
      "rusty.halted": {
        reason: "step_ceiling",
        limit: opts.maxSteps,
        steps_run: run.stepsRun,
        note: "the run stopped at its step ceiling with the work it had done; resume the thread to carry on, raising RunConfig::max_steps when the task genuinely needs more steps",
      },
    };
    const checkpoint = newCheckpoint(t, step, before, active, "ceiling", halted);
    run.lastCp = checkpoint.id;
    const endFrames = [
      frame(run, step, "values", before),
      frame(run, step, "end", { status: "interrupted", interrupt: halted }),
    ];
    return {
      kind: "ceiling", step, active, lanes: [], mergeOrder: [], before, after: before, next: active, routes: [],
      checkpoint, mergeFrames: [], endFrames, outcome: "interrupted", interrupt: halted, lastStage: 5, run,
    };
  }

  const resume = run.resume;
  run.resume = undefined;
  const ctx: NodeCtx = { resume, fork: t.fork, opts };

  // Spawn: every active node runs on the same start-of-step snapshot.
  const results = active.map((node) => ({ node, ms: def.ms[node] ?? 100, result: def.run(node, before, ctx) }));

  // Barrier: reports arrive in finish order; the first interrupt or error
  // closes the barrier and aborts nodes still running.
  const byFinish = [...results].sort((a, b) => a.ms - b.ms);
  const lanes = new Map<string, Lane>();
  const writes: [string, Record<string, unknown>][] = [];
  let stop: { node: string; kind: "interrupt" | "error"; payload: unknown } | null = null;
  byFinish.forEach((r, i) => {
    const lane: Lane = { node: r.node, ms: r.ms, status: "ok", resumeSeen: resume !== undefined };
    if (stop) {
      lane.status = "aborted";
    } else if (r.result.kind === "ok") {
      lane.finished = i + 1;
      lane.writes = r.result.writes;
      writes.push([r.node, r.result.writes]);
    } else if (r.result.kind === "interrupt") {
      lane.finished = i + 1;
      lane.status = "interrupted";
      stop = { node: r.node, kind: "interrupt", payload: r.result.payload };
    } else {
      lane.finished = i + 1;
      lane.status = "failed";
      lane.error = r.result.error;
      stop = { node: r.node, kind: "error", payload: r.result.error };
    }
    lanes.set(r.node, lane);
  });
  const orderedLanes = active.map((n) => lanes.get(n)!);
  const common = { kind: "step" as const, step, active, before, routes: [], mergeFrames: [], run };

  if (stop) {
    const s = stop as { node: string; kind: "interrupt" | "error"; payload: unknown };
    for (const l of orderedLanes) if (l.status === "ok") l.status = "discarded";
    if (s.kind === "interrupt") {
      const checkpoint = newCheckpoint(t, step, before, active, "interrupt", s.payload);
      run.lastCp = checkpoint.id;
      const endFrames = [
        frame(run, step, "values", before),
        frame(run, step, "end", { status: "interrupted", interrupt: s.payload }),
      ];
      return {
        ...common, lanes: orderedLanes, mergeOrder: [], after: before, next: active, checkpoint,
        endFrames, outcome: "interrupted", interrupt: s.payload, lastStage: 2,
      };
    }
    const error = { kind: "node_error", message: `node error: node \`${s.node}\` failed at super-step ${step}: ${s.payload as string}` };
    const endFrames = [
      frame(run, run.lastStep, "error", { error: error.kind, message: error.message }),
      frame(run, run.lastStep, "end", { status: "error" }),
    ];
    return { ...common, lanes: orderedLanes, mergeOrder: [], after: before, next: [], endFrames, outcome: "error", error, lastStage: 2 };
  }

  // Merge: sorted by node name, validated as a whole, then reduced.
  const merged = merge(before, writes, channels);
  if (!merged.ok) {
    for (const l of orderedLanes) l.status = "discarded";
    const error = { kind: "invalid_update", message: `invalid state update: ${merged.message}` };
    const endFrames = [
      frame(run, run.lastStep, "error", { error: error.kind, message: error.message }),
      frame(run, run.lastStep, "end", { status: "error" }),
    ];
    return { ...common, lanes: orderedLanes, mergeOrder: [], after: before, next: [], endFrames, outcome: "error", error, lastStage: 3 };
  }
  const after = merged.state;
  const written = [...new Set(writes.flatMap(([, u]) => Object.keys(u)))];
  const mergeFrames = written.length
    ? [frame(run, step, "updates", { step, updates: Object.fromEntries(written.map((c) => [c, after[c]])) })]
    : [];

  // Route: outgoing edges of every node that ran, against the merged state.
  const next: string[] = [];
  const routes: { from: string; to: string }[] = [];
  for (const node of active) {
    for (const to of def.route(node, after)) {
      routes.push({ from: node, to });
      if (to !== END && !next.includes(to)) next.push(to);
    }
  }

  // Checkpoint at the boundary, then the values frame under its id.
  const checkpoint = newCheckpoint(t, step, after, next, "boundary");
  run.lastCp = checkpoint.id;
  const endFrames = [frame(run, step, "values", after)];
  const done = next.length === 0;
  if (done) endFrames.push(frame(run, step, "end", { status: "success" }));
  run.stepsRun += 1;
  return {
    ...common, lanes: orderedLanes, mergeOrder: merged.order, after, next, routes, checkpoint,
    mergeFrames, endFrames, outcome: done ? "done" : "continue", lastStage: 5,
  };
}

/**
 * A lane's status as of an animation stage. An InvalidUpdate is only found
 * at the merge, so until then the lanes read as finished.
 */
export function laneStatusAt(r: StepResult, lane: Lane, stage: number): LaneStatus {
  return r.error?.kind === "invalid_update" && stage < 3 ? "ok" : lane.status;
}

/** Apply a computed step to the thread. */
export function commitStep(t: ThreadSim, r: StepResult): ThreadSim {
  const frames = [...t.frames, ...r.mergeFrames, ...r.endFrames];
  const checkpoints = r.checkpoint ? [...t.checkpoints, r.checkpoint] : t.checkpoints;
  const latest = checkpoints[checkpoints.length - 1];
  switch (r.outcome) {
    case "continue":
      return { ...t, frames, checkpoints, state: r.after, next: r.next, step: r.step + 1, run: r.run };
    case "done":
      return { ...t, frames, checkpoints, state: r.after, next: [], step: r.step + 1, run: null, status: "done", launch: {} };
    case "interrupted":
      // A person answers (approval) or the caller continues (ceiling).
      return {
        ...t, frames, checkpoints, state: r.before, next: r.active, step: r.step, run: null, status: "interrupted",
        interrupt: r.interrupt, launch: r.kind === "ceiling" ? { checkpointId: r.checkpoint!.id } : {},
      };
    case "error":
      return {
        ...t, frames, checkpoints, run: null, status: "error", error: r.error,
        launch: latest ? { checkpointId: latest.id } : {},
      };
  }
}

/** RunConfig::with_resume(value): continue from the latest checkpoint. */
export function withResume(t: ThreadSim, value: unknown): ThreadSim {
  return { ...t, launch: { resume: { value } } };
}

/**
 * Checkpointer::fork_thread(src, dst, Some(at)): copy the source history, in
 * list order, up to and including `at` into a new thread. The fork's first
 * run replays from `at` (RunConfig::with_checkpoint_id).
 */
export function forkThread(src: ThreadSim, at: Checkpoint, id: string): ThreadSim {
  const list = [...src.checkpoints].sort((a, b) => a.step - b.step || a.created - b.created);
  const pos = list.findIndex((c) => c.id === at.id);
  const copied = list.slice(0, pos + 1).map((c) => ({ ...c, thread_id: id }));
  return {
    ...createThread(src.scenario, id),
    fork: true,
    forkedFrom: { thread: src.id, checkpoint: at.id, step: at.step },
    state: at.state,
    next: [...at.next_nodes],
    step: at.step,
    checkpoints: copied,
    launch: { checkpointId: at.id },
  };
}

export function channelsFor(scenario: ScenarioId, opts: Options): Channel[] {
  return SCENARIOS[scenario].channels(opts);
}
