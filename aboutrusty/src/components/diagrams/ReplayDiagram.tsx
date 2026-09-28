import { useState } from "react";
import { DiagramFrame, StepControls, Toggle } from "./primitives";
import { D, useStepper } from "./tokens";

type Row = { kind: string; node?: string; served?: boolean; note: string };

/** A simplified journal for a ReAct run: agent calls the model, tools calls echo. */
const ROWS: Row[] = [
  { kind: "SuperStepStart", note: "step 0, active [agent]" },
  { kind: "NodeInput", node: "agent", note: "messages: [user]" },
  { kind: "ModelCall", node: "agent", served: true, note: "→ tool_calls: echo(\"hello\")" },
  { kind: "NodeOutput", node: "agent", note: "append assistant message" },
  { kind: "SuperStepEnd", note: "merged messages" },
  { kind: "RoutingDecision", note: "next: [tools]" },
  { kind: "CheckpointWritten", note: "step 0" },
  { kind: "SuperStepStart", note: "step 1, active [tools]" },
  { kind: "NodeInput", node: "tools", note: "pending tool call" },
  { kind: "ToolCall", node: "tools", served: true, note: "echo → \"hello\"" },
  { kind: "NodeOutput", node: "tools", note: "append tool message" },
];

const DIVERGE_AT = 2;

/** Exact replay against a recorded journal, with an optional divergence. */
export function ReplayDiagram() {
  const [changed, setChanged] = useState(false);
  const count = changed ? DIVERGE_AT + 1 : ROWS.length;
  const stepper = useStepper(count, 1500);
  const { step } = stepper;
  const diverged = changed && step === DIVERGE_AT;
  const cur = ROWS[step];

  const caption = diverged
    ? {
        title: "replay divergence at recorded seq 2 (ModelCall)",
        text: "The changed prompt makes the agent issue a model request whose canonical hash differs from the one in the journal. Replay stops with RustyError::Replay at the first mismatch, before the model is ever called.",
      }
    : cur.served
      ? {
          title: `seq ${step} ${cur.kind}: served from the journal`,
          text: `The replaying ${cur.kind === "ModelCall" ? "model" : "tool"} matches the request by position, kind, and request hash, then returns the recorded output. The real ${cur.kind === "ModelCall" ? "model" : "tool"} is never called.`,
        }
      : {
          title: `seq ${step} ${cur.kind}: recomputed`,
          text: "The executor produces this event itself, from the same graph and the served answers. run_and_verify later checks it equals the recording.",
        };

  const outbound = 0;

  return (
    <DiagramFrame
      label="Exact replay · recorded vs replayed"
      caption={caption}
      captionTone={diverged ? "bad" : "plain"}
      controls={
        <StepControls stepper={stepper} count={count}>
          <Toggle
            on={changed}
            onClick={() => {
              setChanged(!changed);
              stepper.setStep(0);
            }}
          >
            Change the system prompt
          </Toggle>
        </StepControls>
      }
    >
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 font-code text-[11.5px]">
        <span style={{ color: D.muted }}>
          outbound calls: <span style={{ color: D.green }}>{outbound}</span>
        </span>
        <span style={{ color: D.muted }}>
          <span style={{ color: D.accentSoft }}>●</span> served from journal
        </span>
        <span style={{ color: D.muted }}>
          <span style={{ color: D.green }}>●</span> recomputed, must match
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[300px] grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 font-code text-[12px]">
          <span className="pb-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[#6f675f]">seq</span>
          <span className="pb-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[#6f675f]">Recorded journal</span>
          <span className="pb-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[#6f675f]">Replay</span>
          {ROWS.map((r, i) => {
            const past = i < step || (i === step && !diverged);
            const now = i === step;
            const hidden = changed && i > DIVERGE_AT;
            const bad = diverged && i === DIVERGE_AT;
            const replayText = bad
              ? "request hash ≠ recorded"
              : past
                ? r.served
                  ? "served ✓"
                  : "matches ✓"
                : "";
            const color = bad ? D.red : r.served ? D.accentSoft : D.green;
            return (
              <div key={i} className="contents">
                <span className="border-t py-1.5 text-[#6f675f]" style={{ borderColor: "rgba(236,150,96,.08)", opacity: hidden ? 0.3 : 1 }}>
                  {i}
                </span>
                <span
                  className="min-w-0 border-t py-1.5"
                  style={{ borderColor: "rgba(236,150,96,.08)", opacity: hidden ? 0.3 : 1 }}
                >
                  <span style={{ color: r.served ? D.accentSoft : D.ink }}>{r.kind}</span>
                  {r.node && <span className="text-[#8b837b]"> · {r.node}</span>}
                  <span className="block truncate text-[11px] text-[#8b837b]">{r.note}</span>
                </span>
                <span
                  className="border-t py-1.5"
                  style={{
                    borderColor: "rgba(236,150,96,.08)",
                    background: now ? (bad ? "rgba(224,106,74,.10)" : "rgba(240,134,43,.07)") : "transparent",
                    transition: "background .3s",
                  }}
                >
                  <span style={{ color, paddingLeft: 6 }}>{hidden ? "not reached" : replayText}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">
        A simplified journal for the run in react_record_replay.rs. Real journals carry more fields and events.
      </p>
    </DiagramFrame>
  );
}
