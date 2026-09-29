import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { lessonHref } from "@/content/lessonLinks";
import { BranchesPanel } from "./BranchesPanel";
import { CheckpointTimeline } from "./CheckpointTimeline";
import { Btn, Dot, Label, PlaygroundStyles } from "./chrome";
import { C, STATUS_COLOR } from "./tokens";
import { EventLog } from "./EventLog";
import { GraphView, type NodeLook } from "./GraphView";
import { Lanes } from "./Lanes";
import { ResumePanel } from "./ResumePanel";
import { StateInspector } from "./StateInspector";
import {
  DEFAULT_OPTIONS,
  END,
  SCENARIOS,
  channelsFor,
  commitStep,
  computeStep,
  createThread,
  forkThread,
  laneStatusAt,
  startRun,
  withResume,
  type Checkpoint,
  type Options,
  type ScenarioId,
  type StepResult,
  type ThreadSim,
} from "./engine";

const STAGES = ["Plan", "Spawn", "Barrier", "Merge", "Route", "Checkpoint"];
const GH = "https://github.com/dev-amjad-shaikh/rusty/blob/main/";

type Mode = "auto" | "one" | null;

function list(nodes: string[]): string {
  return nodes.join(", ");
}

/** The caption under the stage rail: what the engine is doing right now. */
function caption(r: StepResult, stage: number, thread: ThreadSim, maxSteps: number): string {
  if (r.kind === "ceiling") {
    return `Step ceiling. This run has taken ${maxSteps} super-step${maxSteps === 1 ? "" : "s"}, which is its max_steps, so it stops before step ${r.step}. Checkpoint ${r.checkpoint!.id} saves the state and reschedules [${list(r.active)}]. The run returns Interrupted with rusty.halted. It does not fail.`;
  }
  const many = r.active.length > 1;
  const who = list(r.active);
  const restored = thread.run?.launch.checkpointId !== undefined || thread.run?.launch.resume !== undefined;
  switch (stage) {
    case 0:
      if (r.step === 0 && !restored) return `Plan. Step 0 starts at the entry point, so the active set is [${who}].`;
      if (restored && thread.run?.stepsRun === 0)
        return `Plan. This run was restored from a checkpoint, so it starts at that checkpoint's step (${r.step}) with its next-node set [${who}].`;
      return `Plan. The previous step's routing scheduled [${who}]. That is this step's active set.`;
    case 1: {
      const resume = r.lanes.some((l) => l.resumeSeen)
        ? ` This is the first step after a resume, so every node in it gets the resume value from ctx.resume_value().`
        : "";
      return many
        ? `Spawn. ${who} run in parallel. Each gets its own snapshot of the state from the start of step ${r.step}, so none of them can see another's writes.${resume}`
        : `Spawn. ${who} runs on a snapshot of the state from the start of step ${r.step}.${resume}`;
    }
    case 2: {
      const failed = r.lanes.find((l) => l.status === "failed");
      const stopped = r.lanes.find((l) => l.status === "interrupted");
      const kept = r.lanes.filter((l) => l.status === "discarded").map((l) => l.node);
      if (failed)
        return `Barrier. ${failed.node} returned an error. The executor aborts the step: ${kept.length ? `${list(kept)} already finished, and ${kept.length === 1 ? "its write is" : "their writes are"} discarded too. ` : ""}No checkpoint is written for step ${r.step}, and the run returns an error.`;
      if (stopped)
        return `Barrier. ${stopped.node} called ctx.interrupt(). ${kept.length ? `${list(kept)} had already finished; ${kept.length === 1 ? "its write is" : "their writes are"} discarded with the rest of the step. ` : ""}Checkpoint ${r.checkpoint!.id} reschedules the whole active set [${who}], and the run returns Interrupted.`;
      if (many) {
        const order = [...r.lanes].sort((a, b) => (a.finished ?? 0) - (b.finished ?? 0)).map((l) => l.node);
        return `Barrier. The executor waits for every node. They reported in the order ${order.join(", ")}. Nothing has been written to shared state yet.`;
      }
      return "Barrier. The executor waits for the step to finish. Nothing has been written to shared state yet.";
    }
    case 3:
      if (r.outcome === "error")
        return `Merge. The whole step is validated before any channel changes, and it fails: ${r.error!.message.replace(/^invalid state update: /, "")} The step is discarded and the run returns an error.`;
      return r.mergeOrder.length > 1
        ? `Merge. Writes are sorted by node name (${r.mergeOrder.join(", ")}), not by finish order, and applied through each channel's reducer.`
        : r.mergeOrder.length
          ? "Merge. The write is validated and applied through the channel's reducer."
          : "Merge. No node wrote anything this step, so no channel changes.";
    case 4:
      return r.next.length
        ? `Route. Edges are evaluated against the merged state. Next: [${list(r.next)}].`
        : "Route. Every edge leads to END, so the next-node set is empty.";
    default:
      return `Checkpoint ${r.checkpoint!.id}. Rusty saves step ${r.step}, the full state, and the next-node set [${list(r.next)}].${r.outcome === "done" ? " The next-node set is empty, so the run is done." : ""}`;
  }
}

function idleCaption(t: ThreadSim): string {
  const latest = t.checkpoints[t.checkpoints.length - 1];
  switch (t.status) {
    case "ready":
      return t.forkedFrom
        ? `This fork holds a copy of ${t.forkedFrom.thread}'s history up to checkpoint ${t.forkedFrom.checkpoint}. Press Run to replay from it. The first step keeps that checkpoint's step number, ${t.forkedFrom.step}.`
        : "Press Run to play the run, or Step to go one super-step at a time.";
    case "running":
      return `Paused between steps. The latest checkpoint is ${latest?.id ?? "not written yet"}. Press Run or Step to go on.`;
    case "done":
      return "The run is done. Open a checkpoint below to read its state, or fork one to replay from it on a new thread.";
    case "interrupted":
      return "The run is suspended. Nothing is running, and the thread waits in its checkpoint store until someone resumes it.";
    case "error":
      return "The run failed. Its checkpoints are intact.";
  }
}

const TRY: { title: string; body: string; links: [string, string][] }[] = [
  {
    title: "Step through a ReAct agent",
    body: "Press Step to watch one super-step at a time. agent and tools take turns, and each step ends with a checkpoint.",
    links: [
      ["The super-step loop", lessonHref("2.3")],
      ["Build a graph in Rust", "/docs?p=graph"],
    ],
  },
  {
    title: "Break a parallel step",
    body: "In Parallel fan-out, make search_code fail, or declare findings as Overwrite. Either way the step's writes are discarded and no checkpoint is written for it.",
    links: [["The barrier", lessonHref("11.2")]],
  },
  {
    title: "Answer an interrupt",
    body: "In Human approval, approve waits for you. Approve or reject, and watch both nodes of the step run again with your answer.",
    links: [
      ["Interrupts", lessonHref("3.2")],
      ["Human approval", "/docs?p=approval"],
    ],
  },
  {
    title: "Fork and replay",
    body: "Fork any checkpoint. The fork gets the history up to that point and replays from it. The scripted model makes different choices on a fork, so the two threads diverge.",
    links: [
      ["Time travel and forks", lessonHref("3.3")],
      ["Fork and compare runs", "/docs?p=fork"],
    ],
  },
  {
    title: "Hit the step ceiling",
    body: "Set max_steps to 2 and run. The run suspends with its work saved instead of failing, and Continue picks it up.",
    links: [["Checkpoints", lessonHref("3.1")]],
  },
];

/**
 * The Playground: a client-side model of Rusty's executor (see engine.ts for
 * the rules and their sources). Everything is scripted and deterministic.
 */
export function PlaygroundPage() {
  const [scenario, setScenario] = useState<ScenarioId>("react");
  const [opts, setOpts] = useState<Options>(DEFAULT_OPTIONS);
  const [threads, setThreads] = useState<ThreadSim[]>(() => [createThread("react", "main")]);
  const [activeId, setActiveId] = useState("main");
  const [live, setLive] = useState<{ result: StepResult; stage: number } | null>(null);
  const [last, setLast] = useState<Record<string, StepResult>>({});
  const [mode, setMode] = useState<Mode>(null);
  const [fast, setFast] = useState(false);
  const [selectedCp, setSelectedCp] = useState<string | null>(null);
  const forks = useRef(0);

  const thread = threads.find((t) => t.id === activeId) ?? threads[0];
  const threadRef = useRef(thread);
  threadRef.current = thread;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const update = (id: string, fn: (t: ThreadSim) => ThreadSim) => setThreads((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));

  // The driver: plan a step, walk its stages, commit it.
  useEffect(() => {
    if (!mode) return;
    const t = threadRef.current;
    const tick = fast ? 200 : 700;
    if (!live) {
      if (t.status !== "running") {
        setMode(null);
        return;
      }
      const id = setTimeout(() => setLive({ result: computeStep(t, optsRef.current), stage: 0 }), tick / 2);
      return () => clearTimeout(id);
    }
    const { result, stage } = live;
    const id = setTimeout(
      () => {
        if (result.kind !== "ceiling" && stage < result.lastStage) {
          setLive({ result, stage: stage + 1 });
          return;
        }
        update(t.id, (x) => commitStep(x, result));
        setLast((m) => ({ ...m, [t.id]: result }));
        setLive(null);
        if (mode === "one" || result.outcome !== "continue") setMode(null);
      },
      result.kind === "ceiling" ? tick * 1.5 : tick,
    );
    return () => clearTimeout(id);
  }, [mode, live, fast]);

  const busy = live !== null;
  const canRun = !busy && (thread.status === "ready" || thread.status === "running");

  const go = (m: Exclude<Mode, null>) => {
    if (!canRun) return;
    if (thread.status === "ready") update(thread.id, startRun);
    setMode(m);
  };

  const launchNow = (fn: (t: ThreadSim) => ThreadSim) => {
    update(thread.id, (t) => startRun(fn(t)));
    setMode("auto");
  };

  const reset = (sc: ScenarioId = scenario) => {
    setMode(null);
    setLive(null);
    setLast({});
    setSelectedCp(null);
    forks.current = 0;
    setThreads([createThread(sc, "main")]);
    setActiveId("main");
  };

  const pickScenario = (sc: ScenarioId) => {
    if (sc === scenario || busy) return;
    setScenario(sc);
    setOpts((o) => ({ ...o, failNode: false, singleWrite: false }));
    reset(sc);
  };

  const fork = (cp: Checkpoint) => {
    if (busy) return;
    forks.current += 1;
    const id = `${thread.id.split("-fork")[0]}-fork-${forks.current}`;
    const f = forkThread(thread, cp, id);
    setMode(null);
    setThreads((ts) => [...ts, f]);
    setActiveId(id);
    setSelectedCp(null);
  };

  // What the console shows: the live step, or the last committed one.
  const shown = live ?? (last[thread.id] ? { result: last[thread.id], stage: last[thread.id].lastStage } : null);
  const r = shown?.result ?? null;
  const stage = shown?.stage ?? -1;
  const channels = channelsFor(scenario, opts);
  const merged = r && r.kind === "step" && r.outcome !== "error" && stage >= 3;
  const displayState = live ? (merged ? live.result.after : live.result.before) : thread.state;
  const changed = live && merged && r ? r.mergeOrder.flatMap((n) => Object.keys(r.lanes.find((l) => l.node === n)?.writes ?? {})) : [];

  // Node colors: the step on screen while it runs; after an error or an
  // interrupt, how that step ended; otherwise the scheduled next set.
  const looks: Record<string, NodeLook> = {};
  const settled = !live && r?.kind === "step" && (thread.status === "error" || thread.status === "interrupted");
  if ((live || settled) && r?.kind === "step") {
    for (const l of r.lanes) looks[l.node] = stage >= 2 ? laneStatusAt(r, l, stage) : stage >= 1 ? "running" : "next";
    if (live && stage >= 4) for (const n of r.next) looks[n] ??= "next";
  } else if (thread.status === "ready" || thread.status === "running" || thread.status === "interrupted") {
    for (const n of thread.next) looks[n] = "next";
  }
  const fired = live && stage >= 4 ? live.result.routes : [];
  const def = SCENARIOS[scenario];
  const latest = thread.checkpoints[thread.checkpoints.length - 1];
  const statusText = live ? "running" : thread.status;
  const statusColor = live ? C.accent : STATUS_COLOR[thread.status];

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-4 pb-20 pt-14 sm:px-7">
      <PlaygroundStyles />

      {/* ------------------------------------------------------ intro ---- */}
      <header className="flex max-w-[760px] flex-col gap-[14px]">
        <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-primary">Playground</span>
        <h1 className="m-0 font-light text-[#f7ece4]" style={{ fontSize: "clamp(36px,5vw,44px)", lineHeight: 1.08, letterSpacing: "-.025em" }}>
          Run a graph in your browser
        </h1>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
          This page runs a small model of Rusty's executor in your browser. It follows the same rules as{" "}
          <a href={GH + "rusty-core/src/executor.rs"} target="_blank" rel="noreferrer" className="font-code text-[15px]">
            executor.rs
          </a>
          : zero-based super-steps, reducers, a checkpoint at every step boundary, interrupts, and forks. There is no server
          and no model. Nodes and the model are scripted, so every run is the same.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <Label>What to try</Label>
        <ol className="m-0 grid list-none gap-x-10 gap-y-0 p-0" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))" }}>
          {TRY.map((t, i) => (
            <li key={t.title} className="flex min-w-0 gap-3 border-t py-3.5" style={{ borderColor: C.faint }}>
              <span className="pt-[3px] font-code text-[11.5px] text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[15.5px] text-[#f7ece4]">{t.title}</span>
                <p className="m-0 text-[14.5px] leading-[1.6] text-[#a39a91]">{t.body}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
                  {t.links.map(([label, href]) => (
                    <Link key={href} to={href}>
                      {label} →
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------- the console -- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex max-w-full flex-wrap gap-1 rounded-[11px] border p-1" style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(255,236,214,.03)" }}>
            {Object.values(SCENARIOS).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickScenario(s.id)}
                disabled={busy && s.id !== scenario}
                aria-pressed={s.id === scenario}
                className="cursor-pointer rounded-lg border-0 px-3.5 py-2 text-[14px] disabled:cursor-not-allowed"
                style={{ background: s.id === scenario ? "rgba(240,134,43,.2)" : "transparent", color: s.id === scenario ? "#fff3ea" : "#b8b0a8" }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="text-[14.5px] text-[#a39a91]">
            <code className="font-code text-[13px] text-[#ffc7a6]">{def.graph}</code>: {def.summary}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-code text-[12px] text-[#a39a91]">
          <label className="flex items-center gap-2">
            max_steps
            <select
              value={opts.maxSteps}
              onChange={(e) => setOpts((o) => ({ ...o, maxSteps: Number(e.target.value) }))}
              className="cursor-pointer rounded-md border bg-[#0d0908] px-2 py-1 font-code text-[12px] text-[#f7ece4]"
              style={{ borderColor: "rgba(236,150,96,.3)" }}
            >
              <option value={1000}>1000 (default)</option>
              <option value={2}>2</option>
            </select>
          </label>
          {scenario === "fanout" && (
            <>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={opts.failNode} onChange={(e) => setOpts((o) => ({ ...o, failNode: e.target.checked }))} className="accent-[#f0862b]" />
                search_code fails
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={opts.singleWrite} onChange={(e) => setOpts((o) => ({ ...o, singleWrite: e.target.checked }))} className="accent-[#f0862b]" />
                findings uses Overwrite
              </label>
            </>
          )}
        </div>

        <div
          className="flex min-w-0 flex-col gap-5 rounded-[18px] border p-4 sm:p-6"
          style={{ borderColor: "rgba(236,150,96,.2)", background: "linear-gradient(180deg,rgba(20,13,10,.9),rgba(10,7,6,.9))", boxShadow: "0 40px 90px -30px rgba(0,0,0,.9)" }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="min-w-0 break-all font-code text-[12px] text-[#8b837b]">
              Executor::run · thread {thread.id}
              {thread.attempts > 0 ? ` · run ${thread.attempts}` : ""}
            </span>
            <span className="ml-auto flex items-center gap-2 font-code text-[12px]" style={{ color: statusColor }}>
              <Dot color={statusColor} pulse={busy} />
              {statusText}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {STAGES.map((s, i) => {
              const on = live !== null && live.result.kind === "step" && i === stage;
              const past = live !== null && live.result.kind === "step" && i < stage;
              return (
                <div
                  key={s}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300"
                  style={{
                    borderColor: on ? "rgba(240,134,43,.6)" : C.faint,
                    background: on ? "rgba(240,134,43,.14)" : past ? "rgba(240,134,43,.04)" : "transparent",
                  }}
                >
                  <span className="font-code text-[11px]" style={{ color: on ? C.accent : C.dim }}>
                    {i + 1}
                  </span>
                  <span className="text-[14px]" style={{ color: on ? "#fff3ea" : past ? "#cbb3a2" : C.dim }}>
                    {s}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}>
            <div className="flex min-w-0 flex-col gap-2">
              <Label>The graph</Label>
              <div className="rounded-xl border p-2" style={{ borderColor: C.faint }}>
                <GraphView scenario={scenario} looks={looks} fired={fired} done={thread.status === "done" && !live} />
              </div>
              <span className="font-code text-[11px] text-[#8b837b]">dashed edges are conditional · dashed nodes are scheduled next</span>
            </div>
            <Lanes result={r} stage={stage} next={thread.next.filter((n) => n !== END)} />
            <StateInspector channels={channels} state={displayState} changed={changed} />
          </div>

          <p
            className="m-0 min-h-[78px] rounded-xl border px-4 py-3 text-[16px] leading-[1.6] text-[#e6d9cd]"
            style={{ borderColor: "rgba(240,134,43,.25)", background: "rgba(240,134,43,.06)" }}
            aria-live="polite"
          >
            {live ? caption(live.result, stage, thread, opts.maxSteps) : idleCaption(thread)}
          </p>

          {!live && (
            <ResumePanel
              thread={thread}
              latest={latest}
              fault={opts.failNode ? "search_code fails" : opts.singleWrite ? "findings uses Overwrite" : null}
              onResume={(value) => launchNow((t) => withResume(t, value))}
              onContinue={() => launchNow((t) => t)}
            />
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {mode === "auto" ? (
              <Btn primary onClick={() => setMode("one")}>
                ❚❚ Pause
              </Btn>
            ) : (
              <Btn primary onClick={() => go("auto")} disabled={!canRun}>
                ▶ Run
              </Btn>
            )}
            <Btn onClick={() => go("one")} disabled={!canRun || mode !== null}>
              Step
            </Btn>
            <Btn onClick={() => reset()} disabled={false}>
              ↺ Reset
            </Btn>
            <button
              type="button"
              onClick={() => setFast((f) => !f)}
              aria-pressed={fast}
              className="ml-auto cursor-pointer rounded-lg border bg-transparent px-3 py-2 font-code text-[12px] text-[#cbb3a2]"
              style={{ borderColor: C.faint }}
            >
              speed {fast ? "3×" : "1×"}
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- history + stream --- */}
      <section className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))" }}>
        <CheckpointTimeline
          threadId={thread.id}
          checkpoints={thread.checkpoints}
          selected={selectedCp}
          canFork={!busy}
          onSelect={setSelectedCp}
          onFork={fork}
        />
        <div className="flex min-w-0 flex-col gap-6">
          <BranchesPanel
            threads={threads}
            activeId={thread.id}
            disabled={busy}
            onSelect={(id) => {
              if (busy) return;
              setMode(null);
              setActiveId(id);
              setSelectedCp(null);
            }}
          />
          <p className="m-0 text-[14px] leading-[1.6] text-[#a39a91]">
            A fork copies the history up to the checkpoint you picked, the same as{" "}
            <code className="font-code text-[12.5px] text-[#ffc7a6]">fork_thread</code> or{" "}
            <code className="font-code text-[12.5px] text-[#ffc7a6]">POST /threads/{"{id}"}/fork</code>. Its first run replays from that
            checkpoint with <code className="font-code text-[12.5px] text-[#ffc7a6]">with_checkpoint_id</code>. New checkpoints go to the
            fork only. The latest checkpoint is the last one written, not the one with the highest step.
          </p>
        </div>
      </section>

      <EventLog frames={thread.frames} threadId={thread.id} live={busy} />

      {/* --------------------------------------------------- for real --- */}
      <section className="flex flex-col gap-3 border-t pt-8" style={{ borderColor: "rgba(236,150,96,.10)" }}>
        <Label>Run it for real</Label>
        <p className="m-0 max-w-[760px] text-[16px] leading-[1.7] text-[#cfc3b8]">
          <code className="font-code text-[14px] text-[#ffc7a6]">./scripts/dev.sh</code> starts Rusty Server on :8100 and Rusty Studio on
          localhost:4400. The same interrupts, resumes and forks work there over HTTP and from both SDKs. The examples in{" "}
          <code className="font-code text-[14px] text-[#ffc7a6]">rusty-core/examples</code> run each pattern on this page from the command
          line.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
          <Link to="/docs?p=local">Run locally with Studio →</Link>
          <Link to="/docs?p=quickstart">Quickstart: serve a graph →</Link>
          <a href={GH + "rusty-core/examples/react_agent.rs"} target="_blank" rel="noreferrer">
            react_agent.rs ↗
          </a>
          <a href={GH + "rusty-core/examples/parallel_fanout.rs"} target="_blank" rel="noreferrer">
            parallel_fanout.rs ↗
          </a>
          <a href={GH + "rusty-core/examples/human_in_loop.rs"} target="_blank" rel="noreferrer">
            human_in_loop.rs ↗
          </a>
        </div>
      </section>
    </div>
  );
}
