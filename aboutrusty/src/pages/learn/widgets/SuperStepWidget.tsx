import { useEffect, useState } from "react";
import { Toggle } from "@/components/diagrams/primitives";

const LABELS = ["Plan", "Spawn", "Barrier", "Merge", "Route", "Checkpoint"];
const GREEN = "#9fd4a8";
const AMBER = "#f5b774";
const RED = "#f09a80";
const DIM = "#8b837b";

const NOTES: [string, string][] = [
  ["Plan", "The active set comes from the last checkpoint: research_a and research_b. Nothing has run yet in this step."],
  ["Spawn", "Each node starts as a tokio task with its own copy of the state from the start of the step. Neither can see what the other writes."],
  ["Barrier", "The executor waits for every task. Both finished, so their writes are collected but not yet applied."],
  ["Merge", "All writes are validated first, then sorted by node name and applied through the reducers. Append keeps both notes."],
  ["Route", "Routing reads the merged state. The edge from the research nodes activates write for the next step."],
  ["Checkpoint", "The step number, the full state, and the next-node set are saved. If the process dies now, a new process loads this checkpoint and runs write next."],
];

type Status = { status: string; ink: string; write: string };

/** The lesson 2.3 interactive: one super-step of a four-node graph, with
 * switches that make a node fail or two nodes write the same channel. */
export function SuperStepWidget() {
  const [stage, setStage] = useState(0);
  const [fail, setFail] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [auto, setAuto] = useState(false);

  const stopAt = fail ? 2 : conflict ? 3 : 5;
  const halted = stage === stopAt && stopAt < 5;

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStage((s) => (s >= stopAt ? 0 : s + 1)), 2200);
    return () => clearInterval(t);
  }, [auto, stopAt]);

  const aWrites = conflict ? 'notes += "A: 2 sources" · summary = "A"' : 'notes += "A: 2 sources"';
  const bWrites = conflict ? 'notes += "B: 3 sources" · summary = "B"' : 'notes += "B: 3 sources"';

  const research = (writes: string, failing: boolean): Status => {
    if (stage === 0) return { status: "scheduled", ink: AMBER, write: "" };
    if (stage === 1) return { status: "running on snapshot", ink: AMBER, write: "" };
    if (failing) return { status: "failed", ink: RED, write: "writes discarded" };
    if (fail) return { status: "aborted", ink: RED, write: "writes discarded" };
    return { status: stage >= 3 && !halted ? "merged" : "done", ink: GREEN, write: writes };
  };
  const writeNode: Status =
    stage >= 4 && !halted
      ? { status: stage >= 5 ? "scheduled for the next step" : "next", ink: AMBER, write: "" }
      : { status: "idle", ink: DIM, write: "" };

  const nodes: (Status & { name: string; indent: boolean; active: boolean })[] = [
    { name: "plan", status: "done in step 0", ink: DIM, write: "", indent: false, active: false },
    { name: "research_a", ...research(aWrites, false), indent: true, active: true },
    { name: "research_b", ...research(bWrites, fail), indent: true, active: true },
    { name: "write", ...writeNode, indent: false, active: stage >= 4 && !halted },
  ];

  const merged = stage >= 3 && !halted;
  const conflictNow = conflict && stage === 3;

  let note = NOTES[stage];
  let bad = false;
  if (halted && fail) {
    note = [
      "Barrier: step failed",
      "research_b returned an error. The executor returns, which drops the JoinSet and aborts anything still running. research_a finished, but its writes are discarded too. The state is unchanged and the run fails with “node `research_b` failed at super-step 1”.",
    ];
    bad = true;
  }
  if (halted && conflict) {
    note = [
      "Merge: InvalidUpdate",
      "Both nodes wrote to summary, which uses Overwrite and accepts one write per step. Validation fails before anything is applied, so notes is unchanged too. The error names both nodes and suggests a multi-write reducer.",
    ];
    bad = true;
  }

  const mono = "font-code";

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: "rgba(236,150,96,.22)", background: "#110c0a", boxShadow: "0 30px 70px -30px rgba(0,0,0,.8)" }}
    >
      <div
        className="grid grid-cols-3 border-b sm:grid-cols-6"
        style={{ borderColor: "rgba(236,150,96,.12)" }}
        role="tablist"
        aria-label="Super-step stages"
      >
        {LABELS.map((label, i) => {
          const on = i === stage;
          const locked = i > stopAt;
          const isBad = halted && on;
          return (
            <button
              key={label}
              role="tab"
              aria-selected={on}
              disabled={locked}
              onClick={() => !locked && setStage(i)}
              className="flex cursor-pointer flex-col items-start gap-[3px] border-0 px-3 pb-[11px] pt-3 text-left disabled:cursor-default"
              style={{
                borderRight: "1px solid rgba(236,150,96,.08)",
                borderBottom: `2px solid ${on ? (isBad ? "#e06a4a" : "#f0862b") : "transparent"}`,
                background: on ? "rgba(240,134,43,.08)" : "transparent",
                opacity: locked ? 0.35 : 1,
              }}
            >
              <span className={`${mono} text-[11px]`} style={{ color: on ? (isBad ? RED : "#f0862b") : "#6f675f" }}>
                {i + 1}
              </span>
              <span className="text-[14.5px]" style={{ color: on ? "#fff3ea" : i < stage ? "#d8ccc0" : DIM }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}>
        <div className="flex flex-col gap-2.5 p-5" style={{ borderRight: "1px solid rgba(236,150,96,.08)" }}>
          <span className={`${mono} text-[11px] uppercase tracking-[0.12em] text-[#8b837b]`}>Graph · step 1</span>
          {nodes.map((nd) => {
            const redish = nd.ink === RED;
            return (
              <div
                key={nd.name}
                className="flex flex-col gap-[5px] rounded-[10px] border px-[13px] py-[11px]"
                style={{
                  marginLeft: nd.indent ? 22 : 0,
                  borderColor: nd.active ? (redish ? "rgba(224,106,74,.5)" : "rgba(240,134,43,.4)") : "rgba(236,150,96,.12)",
                  background: nd.active ? (redish ? "rgba(224,106,74,.08)" : "rgba(240,134,43,.06)") : "transparent",
                  boxShadow:
                    nd.active && nd.status.startsWith("running")
                      ? "0 0 22px -4px rgba(240,134,43,.6)"
                      : nd.active && redish
                        ? "0 0 22px -4px rgba(224,106,74,.6)"
                        : "none",
                  transition: "all .45s ease",
                }}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span className={`${mono} text-[13.5px] text-[#f7ece4]`}>{nd.name}</span>
                  <span className="text-[12.5px]" style={{ color: nd.ink }}>
                    {nd.status}
                  </span>
                </div>
                {nd.write && <span className={`${mono} break-words text-[12px] text-[#b8b0a8]`}>{nd.write}</span>}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5 p-5">
          <span className={`${mono} text-[11px] uppercase tracking-[0.12em] text-[#8b837b]`}>
            {merged ? "State after merge" : "State · start of step (frozen)"}
          </span>
          <div
            className="flex flex-col gap-[5px] rounded-[10px] border px-[13px] py-[11px]"
            style={{ borderColor: merged ? "rgba(95,191,127,.35)" : "rgba(236,150,96,.12)", background: "rgba(255,236,214,.03)" }}
          >
            <div className="flex justify-between gap-2.5">
              <span className={`${mono} text-[13px] text-[#f7ece4]`}>notes</span>
              <span className={`${mono} text-[11.5px] text-[#8b837b]`}>Append</span>
            </div>
            <span className={`${mono} text-[12px] leading-[1.5] text-[#b8b0a8]`}>"plan: compare sources"</span>
            {merged && (
              <>
                <span className={`${mono} text-[12px] leading-[1.5]`} style={{ color: GREEN }}>
                  + "A: 2 sources" (research_a)
                </span>
                <span className={`${mono} text-[12px] leading-[1.5]`} style={{ color: GREEN }}>
                  + "B: 3 sources" (research_b)
                </span>
              </>
            )}
          </div>
          <div
            className="flex flex-col gap-[5px] rounded-[10px] border px-[13px] py-[11px]"
            style={{ borderColor: conflictNow ? "rgba(224,106,74,.5)" : "rgba(236,150,96,.12)", background: "rgba(255,236,214,.03)" }}
          >
            <div className="flex justify-between gap-2.5">
              <span className={`${mono} text-[13px] text-[#f7ece4]`}>summary</span>
              <span className={`${mono} text-[11.5px] text-[#8b837b]`}>Overwrite</span>
            </div>
            <span className={`${mono} text-[12px] leading-[1.5]`} style={{ color: conflictNow ? RED : "#b8b0a8" }}>
              {conflictNow ? "2 writes in one step → InvalidUpdate" : '""'}
            </span>
          </div>
          <span className={`${mono} mt-1.5 text-[11px] uppercase tracking-[0.12em] text-[#8b837b]`}>Checkpoints</span>
          <span
            className={`${mono} rounded-lg border px-2.5 py-1.5 text-[12px] text-[#b8b0a8]`}
            style={{ borderColor: "rgba(236,150,96,.14)" }}
          >
            step 0 · next: [research_a, research_b]
          </span>
          {stage >= 5 && (
            <span
              className={`${mono} rounded-lg border px-2.5 py-1.5 text-[12px]`}
              style={{ borderColor: "rgba(95,191,127,.4)", color: GREEN }}
            >
              step 1 · next: [write]
            </span>
          )}
        </div>
      </div>

      <div
        aria-live="polite"
        className="flex flex-col gap-1.5 border-t px-5 py-4"
        style={{ borderColor: "rgba(236,150,96,.10)", background: bad ? "rgba(224,106,74,.08)" : "rgba(255,236,214,.03)" }}
      >
        <span className="text-[15.5px] font-normal text-[#f7ece4]">{note[0]}</span>
        <span className="text-[15px] leading-[1.6] text-[#cfc3b8]">{note[1]}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3.5" style={{ borderColor: "rgba(236,150,96,.10)" }}>
        <button
          onClick={() => setAuto(!auto)}
          className="cursor-pointer rounded-lg border px-3 py-2 text-[14px]"
          style={{
            borderColor: auto ? "rgba(240,134,43,.6)" : "rgba(236,150,96,.22)",
            background: auto ? "rgba(240,134,43,.14)" : "transparent",
            color: auto ? "#ffe2cb" : "#d8ccc0",
          }}
        >
          {auto ? "❚❚ Pause" : "▶ Auto-play"}
        </button>
        <button
          onClick={() => setStage(Math.max(0, stage - 1))}
          className="cursor-pointer rounded-lg border bg-transparent px-3.5 py-2 text-[14px] text-[#d8ccc0]"
          style={{ borderColor: "rgba(236,150,96,.22)", opacity: stage === 0 ? 0.4 : 1 }}
        >
          Back
        </button>
        <button
          onClick={() => setStage(stage >= stopAt ? 0 : stage + 1)}
          className="cursor-pointer rounded-lg border-0 px-4 py-2 text-[14px] font-medium"
          style={{ background: "#f0862b", color: "#2a1000" }}
        >
          {stage >= stopAt ? "Restart" : `Next: ${LABELS[stage + 1]}`}
        </button>
        <span className="flex-1" />
        <Toggle
          on={fail}
          onClick={() => {
            setFail(!fail);
            setConflict(false);
            setStage(Math.min(stage, 2));
          }}
        >
          research_b fails
        </Toggle>
        <Toggle
          on={conflict}
          onClick={() => {
            setConflict(!conflict);
            setFail(false);
            setStage(Math.min(stage, 3));
          }}
        >
          Both write summary
        </Toggle>
      </div>
    </div>
  );
}
