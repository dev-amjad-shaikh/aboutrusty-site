import { useState } from "react";
import { DiagramFrame, StepControls, Toggle } from "../primitives";
import { D, useStepper } from "../tokens";
import { Label, Mono } from "../lessons-a/kit";

const TOPICS = ["super-step scheduling", "channel reducers", "checkpoint persistence", "interrupt/resume"];
/** Illustrative durations in ms. The real example's nodes finish almost
 * instantly, in spawn order; these keep that order unless one is slowed. */
const BASE_MS = [40, 50, 60, 70];
const SLOW_MS = 500;

type Stage = { step: number; phase: "compute" | "barrier"; title: string };

const STAGES: Stage[] = [
  { step: 0, phase: "compute", title: "Step 0 · compute" },
  { step: 0, phase: "barrier", title: "Step 0 · barrier, merge, route" },
  { step: 1, phase: "compute", title: "Step 1 · compute" },
  { step: 1, phase: "barrier", title: "Step 1 · barrier, merge, route" },
  { step: 2, phase: "compute", title: "Step 2 · compute" },
  { step: 2, phase: "barrier", title: "Step 2 · barrier: run ends" },
];

/** Lesson 1.4 interactive: parallel_fanout.rs as bulk-synchronous rounds.
 * Slow one invocation or fail one and watch what the barrier does. */
export function BspRounds() {
  const [slow, setSlow] = useState(false);
  const [fail, setFail] = useState(false);
  const stepper = useStepper(fail ? 4 : STAGES.length, 2600);
  const { step: i } = stepper;
  const stage = STAGES[i];

  const ms = BASE_MS.map((m, k) => (slow && k === 0 ? SLOW_MS : m));
  const wall = Math.max(...ms);
  const finishOrder = TOPICS.map((t, k) => ({ t, ms: ms[k], k })).sort((a, b) => a.ms - b.ms);
  const failedStep1 = fail && stage.step === 1 && stage.phase === "barrier";

  const reached = (s: number, p: Stage["phase"]) => i >= STAGES.findIndex((x) => x.step === s && x.phase === p);
  const merged1 = reached(1, "barrier") && !fail;

  let text: string;
  if (stage.step === 0 && stage.phase === "compute") {
    text = "Only the entry node is active. generate_topics reads its snapshot and returns an update for topics. Nothing is written to shared state yet.";
  } else if (stage.step === 0) {
    text = "The single write merges into topics. Routing then reads the merged state: the router on generate_topics returns Route::Send with one Send per topic. A checkpoint would be written here if a checkpointer were attached.";
  } else if (stage.step === 1 && stage.phase === "compute") {
    text = `Four process_item invocations run at once, each on its own copy of the state with its item laid over it. None can see another's write. The step lasts as long as its slowest invocation: ${wall} ms here.`;
  } else if (failedStep1) {
    text = "One invocation returned an error. The barrier discards every write from the step, including writes from invocations that succeeded, aborts any still running, and the run returns: node error: node `process_item` failed at super-step 1: …";
  } else if (stage.step === 1) {
    text = `All four writes to results merge together, in the order the invocations finished${slow ? ": the slow one lands last" : ""}. They share one node name, so sorting by name keeps that order. Then the static edge activates summarize.`;
  } else if (stage.phase === "compute") {
    text = "summarize runs in the next round, so it reads the fully merged array. It can never see three of four results.";
  } else {
    text = "summary is written and summarize has no outgoing edge, so the next active set is empty and the run returns Done.";
  }

  const lane = (label: string, width: number, active: boolean, done: boolean, tone: "accent" | "red" | "green" = "accent") => {
    const color = tone === "red" ? D.red : tone === "green" ? D.green : D.accent;
    return (
      <div key={label} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] items-center gap-2">
        <span className="truncate font-code text-[11.5px]" style={{ color: active || done ? D.ink : D.dim }} title={label}>
          {label}
        </span>
        <div className="relative h-5 rounded" style={{ background: "rgba(255,236,214,.03)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded"
            style={{
              width: active || done ? `${width}%` : "0%",
              background: tone === "red" ? "rgba(224,106,74,.35)" : `${color}40`,
              border: `1px solid ${active || done ? color : "transparent"}`,
              transition: "width .5s ease",
            }}
          />
        </div>
      </div>
    );
  };

  const step1Active = stage.step === 1;
  const step1Done = i > STAGES.findIndex((x) => x.step === 1 && x.phase === "compute");

  return (
    <DiagramFrame
      label="Bulk-synchronous rounds · parallel_fanout.rs"
      caption={{ title: stage.title, text }}
      captionTone={failedStep1 ? "bad" : "plain"}
      controls={
        <StepControls stepper={stepper} count={fail ? 4 : STAGES.length}>
          <Toggle
            on={slow}
            onClick={() => {
              setSlow(!slow);
              stepper.setStep(0);
            }}
          >
            Slow the first item
          </Toggle>
          <Toggle
            on={fail}
            onClick={() => {
              setFail(!fail);
              stepper.setStep(0);
            }}
          >
            Fail one item
          </Toggle>
        </StepControls>
      }
    >
      <div className="grid gap-3">
        {[0, 1, 2].map((s) => {
          const current = stage.step === s;
          const past = stage.step > s || (current && stage.phase === "barrier");
          return (
            <div
              key={s}
              className="rounded-xl border p-3"
              style={{
                borderColor: current ? "rgba(240,134,43,.45)" : "rgba(236,150,96,.12)",
                background: current ? "rgba(240,134,43,.04)" : "transparent",
                opacity: stage.step < s || (fail && s === 2) ? 0.4 : 1,
              }}
            >
              <div className="mb-2 flex items-center justify-between font-code text-[11px] uppercase tracking-[0.1em]">
                <span style={{ color: current ? D.accentSoft : D.muted }}>super-step {s}</span>
                <span style={{ color: past ? (failedStep1 && s === 1 ? D.red : D.green) : D.dim }}>
                  {past ? (failedStep1 && s === 1 ? "barrier: step discarded" : "barrier ✓") : "barrier"}
                </span>
              </div>
              <div className="grid gap-1.5">
                {s === 0 && lane("generate_topics", 30, current, stage.step > 0 || (current && stage.phase === "barrier"))}
                {s === 1 &&
                  TOPICS.map((_, k) =>
                    lane(
                      `process_item #${k + 1}`,
                      Math.max(8, (ms[k] / wall) * 100),
                      step1Active,
                      step1Done,
                      fail && k === 2 && step1Done ? "red" : "accent",
                    ),
                  )}
                {s === 2 && lane("summarize", 30, current && !fail, stage.step === 2 && stage.phase === "barrier")}
              </div>
              {s === 1 && (
                <div className="mt-2 font-code text-[11px] text-[#8b837b]">
                  wall time = slowest invocation = {wall} ms{slow ? " (one item slowed)" : ""}
                </div>
              )}
            </div>
          );
        })}

        <div className="min-w-0">
          <Label>Shared state · results (Append)</Label>
          <Mono tone={merged1 ? "green" : failedStep1 ? "red" : undefined} dim={!merged1 && !failedStep1}>
            {failedStep1
              ? "(unset): the step's writes were discarded"
              : merged1
                ? `[${finishOrder.map((f) => `"${f.t}"`).join(", ")}]`
                : "(unset)"}
          </Mono>
        </div>
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">
        Bar lengths are illustrative. The real example's nodes do no I/O and finish in spawn order; the lab below slows one item for real.
      </p>
    </DiagramFrame>
  );
}
