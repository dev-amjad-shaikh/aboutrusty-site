import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Kicker, Reveal, SectionTitle } from "./primitives";

/*
 * The anatomy of one run, as a stepped diagram. The scenario scripts follow
 * rusty-src/docs/architecture.md §3–4f: plan → spawn → barrier → merge →
 * route → checkpoint, a failed node discarding the whole step, an interrupt
 * rescheduling the entire active set, and a kill -9 resuming from the latest
 * checkpoint.
 */

type NodeName = "plan" | "search" | "fetch" | "write";
type LaneStatus = "running" | "done" | "failed" | "interrupted" | "discarded";
type RunStatus = "running" | "done" | "failed" | "interrupted" | "crashed" | "restarting";

interface Lane {
  node: NodeName;
  status: LaneStatus;
  write: string;
}
interface Channels {
  messages: number;
  sources: number;
  draft: string | null;
}
interface Checkpoint {
  n: number;
  step: number;
  next: string[];
}
interface Frame {
  step: number;
  stage: number; // 0..5, or -1 for an event outside the loop
  lanes: Lane[];
  state: Channels;
  pending: Partial<Channels> | null;
  cps: Checkpoint[];
  status: RunStatus;
  caption: string;
  label?: string;
}

const STAGES = ["Plan", "Spawn", "Barrier", "Merge", "Route", "Checkpoint"];

const WRITES: Record<NodeName, { text: string; delta: Partial<Channels> }> = {
  plan: { text: "messages += plan", delta: { messages: 1 } },
  search: { text: "sources += 2 results", delta: { sources: 2 } },
  fetch: { text: "sources += 1 page", delta: { sources: 1 } },
  write: { text: "draft = \"…\"", delta: { draft: "written" } },
};

const ROUTE: Record<number, NodeName[]> = { 0: ["fetch", "search"], 1: ["write"], 2: [] };

function apply(s: Channels, nodes: NodeName[]): Channels {
  const out = { ...s };
  for (const n of nodes) {
    const d = WRITES[n].delta;
    if (d.messages) out.messages += d.messages;
    if (d.sources) out.sources += d.sources;
    if (d.draft) out.draft = d.draft;
  }
  return out;
}

function pendingOf(nodes: NodeName[]): Partial<Channels> {
  return apply({ messages: 0, sources: 0, draft: null }, nodes);
}

/** The six frames of one clean super-step. */
function superStep(
  step: number,
  active: NodeName[],
  state: Channels,
  cps: Checkpoint[],
  label?: string,
  nextOverride?: NodeName[],
): { frames: Frame[]; state: Channels; cps: Checkpoint[] } {
  const next = nextOverride ?? ROUTE[step] ?? [];
  const lanes = (st: LaneStatus) => active.map((node) => ({ node, status: st, write: WRITES[node].text }));
  const merged = apply(state, active);
  const cp: Checkpoint = { n: cps.length + 1, step, next };
  const who = active.join(" and ");
  const base = { step, state, cps, status: "running" as RunStatus, label, pending: null };
  const frames: Frame[] = [
    {
      ...base,
      stage: 0,
      lanes: lanes("running").map((l) => ({ ...l, status: "running" as LaneStatus, write: "" })),
      caption:
        step === 0
          ? "Plan. The first step starts at the entry point, so the active set is plan."
          : `Plan. The previous step's routing scheduled ${who}. That is this step's active set.`,
    },
    {
      ...base,
      stage: 1,
      lanes: lanes("running"),
      pending: pendingOf(active),
      caption:
        active.length > 1
          ? `Spawn. ${who} run in parallel as tokio tasks. Each gets its own copy of the state from the start of the step, so neither can see the other's writes.`
          : `Spawn. ${who} runs as a tokio task on its own copy of the state from the start of the step.`,
    },
    {
      ...base,
      stage: 2,
      lanes: lanes("done"),
      pending: pendingOf(active),
      caption: "Barrier. The executor waits until every node in the step has finished. Nothing is written to shared state yet.",
    },
    {
      ...base,
      stage: 3,
      lanes: lanes("done"),
      state: merged,
      caption:
        active.length > 1
          ? "Merge. Writes are sorted by node name, then applied through each channel's reducer. sources uses Append, so two nodes may write it in the same step."
          : "Merge. The write is validated and applied through the channel's reducer.",
    },
    {
      ...base,
      stage: 4,
      lanes: lanes("done"),
      state: merged,
      caption: next.length
        ? `Route. The merged state decides what runs next: ${next.join(", ")}.`
        : "Route. No edge leads anywhere else, so the next-node set is empty.",
    },
    {
      ...base,
      stage: 5,
      lanes: lanes("done"),
      state: merged,
      cps: [...cps, cp],
      caption: `Checkpoint ${cp.n}. Rusty saves the step number, the full state, and the next-node set [${next.join(", ")}]. Checkpoints are written at step boundaries, never in the middle of a node.`,
    },
  ];
  return { frames, state: merged, cps: [...cps, cp] };
}

const EMPTY: Channels = { messages: 1, sources: 0, draft: null };

function doneFrame(state: Channels, cps: Checkpoint[]): Frame {
  return {
    step: 2,
    stage: -1,
    lanes: [],
    state,
    pending: null,
    cps,
    status: "done",
    caption: "Done. Every step boundary is a checkpoint you can resume from, replay, or fork into a new thread.",
  };
}

function build(scenario: Scenario): Frame[] {
  const f: Frame[] = [];
  let r = superStep(0, ["plan"], EMPTY, []);
  f.push(...r.frames);

  if (scenario === "normal") {
    const s2 = superStep(1, ["fetch", "search"], r.state, r.cps);
    const s3 = superStep(2, ["write"], s2.state, s2.cps);
    f.push(...s2.frames, ...s3.frames, doneFrame(s3.state, s3.cps));
    return f;
  }

  if (scenario === "fail") {
    const s2 = superStep(1, ["fetch", "search"], r.state, r.cps).frames.slice(0, 2);
    f.push(...s2);
    const failedLanes: Lane[] = [
      { node: "fetch", status: "failed", write: "error: upstream 500" },
      { node: "search", status: "done", write: WRITES.search.text },
    ];
    f.push({
      ...s2[1],
      stage: 2,
      lanes: failedLanes,
      caption: "Barrier. fetch returns an error. search already finished. The executor drops the JoinSet, which aborts anything still running.",
    });
    f.push({
      ...s2[1],
      stage: -1,
      pending: null,
      lanes: [
        { node: "fetch", status: "failed", write: "error: upstream 500" },
        { node: "search", status: "discarded", write: WRITES.search.text },
      ],
      status: "failed",
      caption: "The whole step is discarded, including search's writes. State stays exactly as checkpoint 1 left it, and the run returns an error naming fetch and step 1.",
    });
    return f;
  }

  if (scenario === "interrupt") {
    const s2 = superStep(1, ["fetch", "search"], r.state, r.cps).frames.slice(0, 2);
    f.push(...s2);
    f.push({
      ...s2[1],
      stage: 2,
      lanes: [
        { node: "fetch", status: "interrupted", write: "ctx.interrupt(\"approve source?\")" },
        { node: "search", status: "done", write: WRITES.search.text },
      ],
      caption: "Barrier. fetch calls ctx.interrupt() to ask a person whether a source may be used. search already finished.",
    });
    const parked: Checkpoint = { n: r.cps.length + 1, step: 1, next: ["fetch", "search"] };
    const cps = [...r.cps, parked];
    f.push({
      ...s2[1],
      stage: -1,
      pending: null,
      lanes: [
        { node: "fetch", status: "interrupted", write: "waiting for a person" },
        { node: "search", status: "discarded", write: WRITES.search.text },
      ],
      cps,
      status: "interrupted",
      caption: `The step's writes are discarded and checkpoint ${parked.n} reschedules the whole active set, fetch and search. The run returns Interrupted. No process has to stay alive while it waits.`,
    });
    const s2b = superStep(1, ["fetch", "search"], r.state, cps, "resumed");
    s2b.frames[0] = {
      ...s2b.frames[0],
      status: "running",
      caption: "Resume. A person approves, and the caller runs the same thread with with_resume(decision). Both nodes start again from the beginning; fetch reads the decision from ctx.resume_value().",
    };
    const s3 = superStep(2, ["write"], s2b.state, s2b.cps);
    f.push(...s2b.frames, ...s3.frames, doneFrame(s3.state, s3.cps));
    return f;
  }

  // crash
  const s2 = superStep(1, ["fetch", "search"], r.state, r.cps);
  f.push(...s2.frames);
  r = s2;
  const s3a = superStep(2, ["write"], r.state, r.cps).frames.slice(0, 2);
  f.push(...s3a);
  f.push({
    ...s3a[1],
    stage: -1,
    lanes: [],
    pending: null,
    status: "crashed",
    caption: "kill -9. The server process dies in the middle of step 2. write's unfinished work is lost. Checkpoints 1 and 2 are already on disk.",
  });
  f.push({
    ...s3a[1],
    stage: -1,
    lanes: [],
    pending: null,
    status: "restarting",
    caption: "A new process starts against the same store and loads the thread's latest checkpoint: step 1, next [write]. plan, fetch, and search do not run again. The restored run keeps the checkpoint's step number, so write runs as step 1.",
  });
  // A restored run keeps the checkpoint's step number, so write runs as step 1 again.
  const s3 = superStep(1, ["write"], r.state, r.cps, "after restart", []);
  f.push(...s3.frames, doneFrame(s3.state, s3.cps));
  return f;
}

type Scenario = "normal" | "fail" | "interrupt" | "crash";
const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "normal", label: "A clean run" },
  { id: "fail", label: "A node fails" },
  { id: "interrupt", label: "Pause for a person" },
  { id: "crash", label: "kill -9 mid-run" },
];

const C = {
  line: "rgba(236,150,96,.22)",
  faint: "rgba(236,150,96,.12)",
  accent: "#f0862b",
  green: "#9fd4a8",
  amber: "#f5b774",
  red: "#f09a80",
  ink: "#f7ece4",
  muted: "#8b837b",
};

const LANE_COLOR: Record<LaneStatus, string> = {
  running: C.accent,
  done: C.green,
  failed: C.red,
  interrupted: C.amber,
  discarded: C.muted,
};

const STATUS_LABEL: Record<RunStatus, [string, string]> = {
  running: ["running", C.amber],
  done: ["done", C.green],
  failed: ["error", C.red],
  interrupted: ["interrupted", C.amber],
  crashed: ["killed", C.red],
  restarting: ["restarting", C.amber],
};

/* ---------- the graph ---------- */

const POS: Record<string, [number, number]> = {
  plan: [52, 110],
  search: [180, 52],
  fetch: [180, 168],
  write: [308, 110],
  END: [410, 110],
};
const EDGES: [string, string][] = [
  ["plan", "search"],
  ["plan", "fetch"],
  ["search", "write"],
  ["fetch", "write"],
  ["write", "END"],
];

function GraphView({ frame }: { frame: Frame }) {
  const statusOf = (n: string): LaneStatus | null => frame.lanes.find((l) => l.node === n)?.status ?? null;
  const dead = frame.status === "crashed";
  return (
    <svg viewBox="0 0 460 220" className="block h-auto w-full" role="img" aria-label="The agent graph: plan fans out to search and fetch, which both lead to write">
      <defs>
        <marker id="ar-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(236,150,96,.45)" />
        </marker>
      </defs>
      {EDGES.map(([a, b]) => {
        const [x1, y1] = POS[a];
        const [x2, y2] = POS[b];
        const dx = x2 - x1,
          dy = y2 - y1,
          len = Math.hypot(dx, dy);
        const r1 = 34,
          r2 = b === "END" ? 26 : 36;
        return (
          <line
            key={a + b}
            x1={x1 + (dx / len) * r1}
            y1={y1 + (dy / len) * r1}
            x2={x2 - (dx / len) * r2}
            y2={y2 - (dy / len) * r2}
            stroke="rgba(236,150,96,.3)"
            strokeWidth={1.4}
            markerEnd="url(#ar-arrow)"
          />
        );
      })}
      {(["plan", "search", "fetch", "write"] as const).map((n) => {
        const st = dead ? null : statusOf(n);
        const color = st ? LANE_COLOR[st] : "rgba(236,150,96,.28)";
        const [x, y] = POS[n];
        return (
          <g key={n} style={{ transition: "all .4s" }}>
            {st === "running" && (
              <circle cx={x} cy={y} r={40} fill="none" stroke={C.accent} strokeOpacity={0.35} strokeWidth={6} className="ar-pulse" />
            )}
            <rect
              x={x - 34}
              y={y - 20}
              width={68}
              height={40}
              rx={10}
              fill={st ? `${color}22` : "rgba(20,12,9,.9)"}
              stroke={color}
              strokeWidth={st ? 1.6 : 1}
            />
            <text x={x} y={y + 5} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={13} fill={st ? C.ink : "#b8b0a8"}>
              {n}
            </text>
          </g>
        );
      })}
      <g>
        <circle cx={POS.END[0]} cy={POS.END[1]} r={22} fill={frame.status === "done" ? `${C.green}22` : "none"} stroke={frame.status === "done" ? C.green : "rgba(236,150,96,.28)"} strokeDasharray="3 3" />
        <text x={POS.END[0]} y={POS.END[1] + 4} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={10.5} fill="#a39a91">
          END
        </text>
      </g>
    </svg>
  );
}

/* ---------- panels ---------- */

function StageRail({ stage }: { stage: number }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {STAGES.map((s, i) => {
        const on = i === stage;
        const past = stage >= 0 && i < stage;
        return (
          <div
            key={s}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300"
            style={{
              borderColor: on ? "rgba(240,134,43,.6)" : C.faint,
              background: on ? "rgba(240,134,43,.14)" : past ? "rgba(240,134,43,.04)" : "transparent",
            }}
          >
            <span className="font-code text-[11px]" style={{ color: on ? C.accent : C.muted }}>
              {i + 1}
            </span>
            <span className="text-[14px]" style={{ color: on ? "#fff3ea" : past ? "#cbb3a2" : "#8b837b" }}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Lanes({ frame }: { frame: Frame }) {
  if (frame.status === "crashed" || frame.status === "restarting") {
    const crashed = frame.status === "crashed";
    return (
      <div
        className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center"
        style={{ borderColor: crashed ? "rgba(240,154,128,.5)" : "rgba(245,183,116,.45)" }}
      >
        <span className="font-code text-[13px]" style={{ color: crashed ? C.red : C.amber }}>
          {crashed ? "$ kill -9 <pid>  ✗ SIGKILL" : "▸ new process · get_latest(thread)"}
        </span>
        <span className="text-[14px] text-[#a39a91]">{crashed ? "no process, no tasks" : "loaded checkpoint 2 · next [write]"}</span>
      </div>
    );
  }
  if (!frame.lanes.length) {
    return (
      <div className="flex min-h-[150px] items-center justify-center rounded-xl border border-dashed p-5 text-[14px] text-[#8b837b]" style={{ borderColor: C.faint }}>
        no active nodes
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="font-code text-[10.5px] uppercase tracking-[0.14em] text-[#8b837b]">
        Active set · step {frame.step}
        {frame.label ? ` · ${frame.label}` : ""}
      </span>
      {frame.lanes.map((l) => {
        const color = LANE_COLOR[l.status];
        return (
          <div
            key={l.node}
            className="relative flex flex-col gap-1.5 overflow-hidden rounded-xl border p-3 transition-all duration-300"
            style={{ borderColor: `${color}66`, background: `${color}0f`, opacity: l.status === "discarded" ? 0.6 : 1 }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
              <span className="font-code text-[13px] text-[#f7ece4]">{l.node}</span>
              <span className="ml-auto font-code text-[11px]" style={{ color }}>
                {l.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-code text-[11.5px] text-[#a39a91]">
              <span className="rounded border px-1.5 py-[1px]" style={{ borderColor: C.faint }}>
                snapshot@step{frame.step}
              </span>
              {l.write && (
                <>
                  <span>→</span>
                  <span style={{ color: l.status === "discarded" ? C.muted : "#ffc7a6", textDecoration: l.status === "discarded" ? "line-through" : "none" }}>
                    {l.write}
                  </span>
                </>
              )}
            </div>
            {frame.stage === 1 && l.status === "running" && (
              <span className="ar-bar absolute bottom-0 left-0 h-[2px]" style={{ background: C.accent }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatePanel({ frame }: { frame: Frame }) {
  const rows: [keyof Channels, string, string][] = [
    ["messages", "AddMessages", `${frame.state.messages} msg${frame.state.messages === 1 ? "" : "s"}`],
    ["sources", "Append", `${frame.state.sources} item${frame.state.sources === 1 ? "" : "s"}`],
    ["draft", "Overwrite", frame.state.draft ? "\"…\"" : "null"],
  ];
  const merging = frame.stage === 3;
  return (
    <div className="flex flex-col gap-2">
      <span className="font-code text-[10.5px] uppercase tracking-[0.14em] text-[#8b837b]">Shared state</span>
      <div className="flex flex-col overflow-hidden rounded-xl border" style={{ borderColor: C.faint }}>
        {rows.map(([k, reducer, v]) => {
          const p = frame.pending?.[k];
          const hasPending = p !== undefined && p !== 0 && p !== null;
          return (
            <div key={k} className="flex items-center gap-2 border-t px-3 py-2 first:border-t-0" style={{ borderColor: C.faint, background: merging ? "rgba(240,134,43,.05)" : undefined }}>
              <span className="font-code text-[12.5px] text-[#f7ece4]">{k}</span>
              <span className="font-code text-[10.5px] text-[#8b837b]">{reducer}</span>
              <span className="ml-auto font-code text-[12px] text-[#cfc3b8]">{v}</span>
              {hasPending && (
                <span className="font-code text-[11px] text-[#ffc7a6] opacity-70">
                  {typeof p === "number" ? `+${p}` : "pending"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <span className="pt-2 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#8b837b]">Checkpoints · thread t_1</span>
      <div className="flex min-h-[34px] flex-wrap gap-1.5">
        {frame.cps.length === 0 && <span className="text-[13px] text-[#6f675f]">none yet</span>}
        {frame.cps.map((cp, i) => {
          const newest = i === frame.cps.length - 1 && frame.stage === 5;
          return (
            <span
              key={cp.n}
              className="rounded-md border px-2 py-1 font-code text-[11px] transition-all duration-500"
              style={{
                borderColor: newest ? C.accent : "rgba(236,150,96,.25)",
                background: newest ? "rgba(240,134,43,.18)" : "rgba(255,236,214,.03)",
                color: newest ? "#fff3ea" : "#cbb3a2",
              }}
              title={`step ${cp.step}, next [${cp.next.join(", ")}]`}
            >
              cp{cp.n} · s{cp.step} → [{cp.next.join(",") || "∅"}]
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- section ---------- */

/** 04 · Anatomy of a run — the super-step loop, stepped through four scenarios. */
export function AnatomyOfRun() {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const frames = useMemo(() => build(scenario), [scenario]);
  const frame = frames[Math.min(i, frames.length - 1)];

  // Start playing the first time the diagram scrolls into view.
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPlay(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!play) return;
    const id = setTimeout(() => setI((x) => (x + 1 < frames.length ? x + 1 : x)), i + 1 < frames.length ? 2300 : 0);
    return () => clearTimeout(id);
  }, [play, i, frames.length]);

  const pick = (s: Scenario) => {
    setScenario(s);
    setI(0);
    setPlay(true);
  };
  const [statusText, statusColor] = STATUS_LABEL[frame.status];
  const atEnd = i >= frames.length - 1;

  return (
    <Reveal className="flex flex-col gap-8 border-t border-[rgba(236,150,96,0.10)] py-[90px]">
      <style>{`
        @keyframes arPulse{0%{opacity:.7}100%{opacity:0;transform:scale(1.25)}}
        .ar-pulse{transform-box:fill-box;transform-origin:center;animation:arPulse 1.4s ease-out infinite}
        @keyframes arBar{from{width:0}to{width:100%}}
        .ar-bar{animation:arBar 2.2s linear forwards}
        @media (prefers-reduced-motion: reduce){.ar-pulse,.ar-bar{animation:none}}
      `}</style>
      <div className="flex max-w-[720px] flex-col gap-[14px]">
        <Kicker>04 · Anatomy of a run</Kicker>
        <SectionTitle>What happens inside one run</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
          An agent here is four nodes: <code className="font-code text-[15px] text-[#ffc7a6]">plan</code> fans out to{" "}
          <code className="font-code text-[15px] text-[#ffc7a6]">search</code> and{" "}
          <code className="font-code text-[15px] text-[#ffc7a6]">fetch</code>, which both lead to{" "}
          <code className="font-code text-[15px] text-[#ffc7a6]">write</code>. Step through the run, then see what changes
          when a node fails, when the agent waits for a person, and when the server is killed.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 self-start rounded-[11px] border p-1" style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(255,236,214,.03)" }}>
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => pick(s.id)}
            className="cursor-pointer rounded-lg border-0 px-3.5 py-2 text-[14px]"
            style={{ background: s.id === scenario ? "rgba(240,134,43,.2)" : "transparent", color: s.id === scenario ? "#fff3ea" : "#b8b0a8" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        ref={box}
        className="flex flex-col gap-5 rounded-[18px] border p-4 sm:p-6"
        style={{ borderColor: "rgba(236,150,96,.2)", background: "linear-gradient(180deg,rgba(20,13,10,.9),rgba(10,7,6,.9))", boxShadow: "0 40px 90px -30px rgba(0,0,0,.9)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-code text-[12px] text-[#8b837b]">Executor::run · thread t_1</span>
          <span className="ml-auto flex items-center gap-2 font-code text-[12px]" style={{ color: statusColor }}>
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor }} />
            {statusText}
          </span>
        </div>
        <StageRail stage={frame.stage} />
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}>
          <div className="flex flex-col gap-2">
            <span className="font-code text-[10.5px] uppercase tracking-[0.14em] text-[#8b837b]">The graph</span>
            <div className="rounded-xl border p-2" style={{ borderColor: C.faint }}>
              <GraphView frame={frame} />
            </div>
          </div>
          <Lanes frame={frame} />
          <StatePanel frame={frame} />
        </div>

        <p className="m-0 min-h-[78px] rounded-xl border px-4 py-3 text-[16px] leading-[1.6] text-[#e6d9cd]" style={{ borderColor: "rgba(240,134,43,.25)", background: "rgba(240,134,43,.06)" }} aria-live="polite">
          {frame.caption}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => (atEnd ? (setI(0), setPlay(true)) : setPlay(!play))}
            className="cursor-pointer rounded-lg border bg-transparent px-3.5 py-2 text-[14px] text-[#f7ece4]"
            style={{ borderColor: "rgba(236,150,96,.3)" }}
          >
            {atEnd ? "↺ Replay" : play ? "❚❚ Pause" : "▶ Play"}
          </button>
          <button
            onClick={() => {
              setPlay(false);
              setI((x) => Math.max(0, x - 1));
            }}
            disabled={i === 0}
            className="cursor-pointer rounded-lg border bg-transparent px-3 py-2 text-[14px] text-[#cbb3a2] disabled:opacity-40"
            style={{ borderColor: C.faint }}
            aria-label="Previous stage"
          >
            ←
          </button>
          <button
            onClick={() => {
              setPlay(false);
              setI((x) => Math.min(frames.length - 1, x + 1));
            }}
            disabled={atEnd}
            className="cursor-pointer rounded-lg border bg-transparent px-3 py-2 text-[14px] text-[#cbb3a2] disabled:opacity-40"
            style={{ borderColor: C.faint }}
            aria-label="Next stage"
          >
            →
          </button>
          <div className="h-1 min-w-[120px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,236,214,.08)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((i + 1) / frames.length) * 100}%`, background: C.accent }} />
          </div>
          <span className="font-code text-[11.5px] text-[#8b837b]">
            {i + 1}/{frames.length}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-[15px]">
        <Link to="/learn/super-step-loop">The super-step loop, in depth →</Link>
        <a href="https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/architecture.md" target="_blank" rel="noreferrer">
          docs/architecture.md ↗
        </a>
      </div>
    </Reveal>
  );
}
