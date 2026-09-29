import { useState } from "react";
import { DiagramFrame, StepControls } from "../primitives";
import { D, useStepper } from "../tokens";
import { Choices, Label, Mono } from "../lessons-a/kit";

/* The create_react_agent loop as the executor sees it: one node per
 * super-step, re-scheduled by routing. The frames follow Executor::run:
 * the ceiling is checked before each step (steps_run >= max_steps), the
 * tools node asks the approval gate before any call runs, and the agent's
 * conditional edge ends the run when the last message has no tool calls. */

type Model = "answers" | "loops";
type Tools = "nonidempotent" | "readonly";

type Frame = {
  step: number | null;
  node: "agent" | "tools" | null;
  status: "ran" | "approval" | "halted" | "done";
  title: string;
  text: string;
};

function frames(model: Model, tools: Tools, budget: number): Frame[] {
  const out: Frame[] = [];
  for (let s = 0; s < 40; s++) {
    if (s >= budget) {
      out.push({
        step: null,
        node: null,
        status: "halted",
        title: `Suspended at the ceiling · steps_run ${s}`,
        text: `Before step ${s} the executor finds steps_run >= max_steps (${budget}). It writes a checkpoint and returns Interrupted with a rusty.halted payload, reason step_ceiling. The messages so far are kept; resume the thread with a higher max_steps to continue.`,
      });
      return out;
    }
    const node = s % 2 === 0 ? "agent" : "tools";
    if (node === "agent") {
      const final = model === "answers" && s >= 2;
      out.push({
        step: s,
        node,
        status: "ran",
        title: `Step ${s} · agent`,
        text: final
          ? "The model sees the two tool results and answers in plain text. The conditional edge on agent finds no tool calls in the last message and returns Route::End."
          : s >= 2
            ? "The model asks for more tool calls with new arguments, so the conditional edge routes to tools again. (Identical repeats would trip the agent's own STUCK_TURN_LIMIT first.) Each lap costs two super-steps of the budget, and the executor's guard for a loop that never ends is max_steps."
            : "The model replies with tool calls (calculator and echo). AddMessages appends the assistant message at the barrier, and the conditional edge on agent returns Route::Node(\"tools\").",
      });
      if (final) {
        out.push({
          step: null,
          node: null,
          status: "done",
          title: `Done after ${s + 1} super-steps`,
          text: "No next nodes, so the run finishes with ExecutionOutcome::Done. The loop agent → tools → agent was three separate super-steps, each with its own barrier and checkpoint.",
        });
        return out;
      }
    } else {
      if (tools === "nonidempotent") {
        out.push({
          step: s,
          node,
          status: "approval",
          title: `Step ${s} · tools pauses for approval`,
          text: "Both toy tools keep the default effect, NonIdempotent. Before running anything, the tools node asks the approval gate, finds no tokens, and returns an interrupt with kind approval. No tool has run. This is where react_agent stops at fedbb3a.",
        });
        return out;
      }
      out.push({
        step: s,
        node,
        status: "ran",
        title: `Step ${s} · tools`,
        text: "The tools are declared ReadOnly, so the gate has nothing to ask. execute_batch runs both calls concurrently and appends one tool message per call. The static edge tools → agent schedules the agent for the next step.",
      });
    }
  }
  return out;
}

const tone = (f: Frame) =>
  f.status === "approval" || f.status === "halted" ? D.amber : f.status === "done" ? D.green : D.accent;

/** The ReAct loop stepping through super-steps under a step budget. */
export function ReactCycle() {
  const [model, setModel] = useState<Model>("answers");
  const [tools, setTools] = useState<Tools>("readonly");
  const [budget, setBudget] = useState(10);
  const list = frames(model, tools, budget);
  const stepper = useStepper(list.length, 2000);
  const cur = list[stepper.step];
  const ranSteps = list.filter((f) => f.step !== null).slice(0, stepper.step + 1).length;
  const reset = () => stepper.setStep(0);

  return (
    <DiagramFrame
      label="create_react_agent · agent ⇄ tools as super-steps"
      caption={{ title: cur.title, text: cur.text }}
      controls={
        <>
          <div
            className="grid gap-3 border-t px-4 py-3 sm:grid-cols-3 sm:px-5"
            style={{ borderColor: "rgba(236,150,96,.10)" }}
          >
            <div className="grid content-start gap-1.5">
              <Label>Model</Label>
              <Choices<Model>
                label="Model"
                value={model}
                onChange={(v) => {
                  setModel(v);
                  reset();
                }}
                options={[
                  { id: "answers", label: "answers after one round" },
                  { id: "loops", label: "keeps calling tools, new arguments each time" },
                ]}
              />
            </div>
            <div className="grid content-start gap-1.5">
              <Label>Tool effect</Label>
              <Choices<Tools>
                label="Tool effect"
                value={tools}
                onChange={(v) => {
                  setTools(v);
                  reset();
                }}
                options={[
                  { id: "readonly", label: "ReadOnly" },
                  { id: "nonidempotent", label: "NonIdempotent (default)" },
                ]}
              />
            </div>
            <div className="grid content-start gap-1.5">
              <Label>max_steps</Label>
              <Choices<string>
                label="max_steps"
                value={String(budget)}
                onChange={(v) => {
                  setBudget(Number(v));
                  reset();
                }}
                options={["2", "4", "10"].map((b) => ({ id: b, label: b }))}
              />
            </div>
          </div>
          <StepControls stepper={stepper} count={list.length} />
        </>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-1.5" aria-label="Super-steps">
          {list.map((f, i) => {
            const seen = i <= stepper.step;
            const here = i === stepper.step;
            const label =
              f.step === null ? (f.status === "done" ? "End" : "halt") : `${f.step} ${f.node}`;
            return (
              <span
                key={i}
                className="rounded-lg border px-2 py-1 font-code text-[11.5px]"
                style={{
                  borderColor: here ? tone(f) : seen ? D.line : D.hair,
                  background: here ? "rgba(240,134,43,.12)" : "transparent",
                  color: seen ? (f.status === "ran" ? D.ink : tone(f)) : D.dim,
                  opacity: seen ? 1 : 0.5,
                  transition: "all .25s",
                }}
              >
                {label}
                {f.status === "approval" && " ⏸"}
              </span>
            );
          })}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
          <div className="min-w-0">
            <Label>Step budget</Label>
            <div
              className="flex gap-1 rounded-lg border p-2"
              style={{ borderColor: D.hair, background: "#0d0908" }}
              aria-label={`${ranSteps} of ${budget} steps used`}
            >
              {Array.from({ length: budget }, (_, i) => (
                <span
                  key={i}
                  className="h-3 flex-1 rounded-sm"
                  style={{
                    background: i < ranSteps ? (ranSteps >= budget ? D.amber : D.accent) : "rgba(236,150,96,.12)",
                    transition: "background .25s",
                  }}
                />
              ))}
            </div>
            <div className="mt-1 font-code text-[11px]" style={{ color: D.muted }}>
              {ranSteps} of {budget} used
            </div>
          </div>
          <div className="min-w-0">
            <Label>Outcome so far</Label>
            <Mono tone={cur.status === "done" ? "green" : cur.status === "ran" ? undefined : "amber"}>
              {cur.status === "done"
                ? "ExecutionOutcome::Done"
                : cur.status === "approval"
                  ? 'Interrupted { "kind": "approval", "requests": [calculator, echo] }'
                  : cur.status === "halted"
                    ? 'Interrupted { "rusty.halted": { "reason": "step_ceiling" } }'
                    : "running"}
            </Mono>
          </div>
        </div>
      </div>
    </DiagramFrame>
  );
}
