import { useState } from "react";
import { DiagramFrame, StepControls, Toggle } from "../primitives";
import { D, useStepper } from "../tokens";
import { Label, Mono } from "./kit";

const TOPICS = ["reducers", "routing", "journals"];

type Stage = { title: string; text: string };

const STAGES: Stage[] = [
  {
    title: "Step 0 · generate_topics runs",
    text: "The entry node writes three topics to topics. Nothing else runs in this step.",
  },
  {
    title: "Route · the router returns Route::Send",
    text: "The conditional edge on generate_topics reads the merged topics and returns one Send per topic, all targeting process_item. The RoutingDecision event lists three invocations with their scoped state.",
  },
  {
    title: "Step 1 · three invocations, three private snapshots",
    text: "Each invocation gets its own clone of the start-of-step state with its Send's object laid over it. So each one reads a different item, and item never lands in the shared state.",
  },
  {
    title: "Barrier · three writes to results merge",
    text: "All three invocations write results in the same step. That is legal only because results is declared with Reducer::Append.",
  },
  {
    title: "Step 2 · summarize reads the merged array",
    text: "The static edge process_item → summarize is evaluated once for the fan-out, so summarize runs once, in the next step, and sees all three records.",
  },
];

/** The parallel_fanout example as a stepped map-reduce, with an Overwrite what-if. */
export function SendFanout() {
  const [overwrite, setOverwrite] = useState(false);
  const count = overwrite ? 4 : STAGES.length;
  const stepper = useStepper(count, 2400);
  const { step } = stepper;
  const failed = overwrite && step === 3;

  const caption = failed
    ? {
        title: "Barrier · InvalidUpdate on results",
        text: "With results declared as Reducer::Overwrite, the second write fails validation. The step is discarded and the run returns the error. All three invocations share the name process_item, so the message names the same node twice.",
      }
    : STAGES[step];

  const inv = (t: string, i: number) => {
    const lit = step >= 2;
    const wrote = step >= 3;
    return (
      <div
        key={t}
        className="rounded-lg border px-2.5 py-2 font-code text-[11.5px]"
        style={{
          borderColor: lit ? "rgba(240,134,43,.5)" : "rgba(236,150,96,.14)",
          background: lit ? "rgba(240,134,43,.07)" : "#0d0908",
          opacity: step >= 1 ? 1 : 0.4,
          transition: "all .3s",
        }}
      >
        <div style={{ color: D.ink }}>process_item #{i}</div>
        <div className="mt-1" style={{ color: D.muted, overflowWrap: "anywhere" }}>
          scoped <span style={{ color: D.accentSoft }}>{`{"item": "${t}"}`}</span>
        </div>
        {wrote && (
          <div className="mt-1" style={{ color: failed ? D.red : D.green, overflowWrap: "anywhere" }}>
            → results: {`{"topic": "${t}"}`}
          </div>
        )}
      </div>
    );
  };

  const resultsValue =
    step >= 3 && !overwrite ? `[${TOPICS.map((t) => `{"topic": "${t}"}`).join(", ")}]` : "(unset)";

  return (
    <DiagramFrame
      label="Send fan-out · map, then reduce"
      caption={caption}
      captionTone={failed ? "bad" : "plain"}
      controls={
        <StepControls stepper={stepper} count={count}>
          <Toggle
            on={overwrite}
            onClick={() => {
              setOverwrite(!overwrite);
              stepper.setStep(0);
            }}
          >
            Declare results as Overwrite
          </Toggle>
        </StepControls>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2 font-code text-[12px]">
          <span
            className="rounded-lg border px-2.5 py-1.5"
            style={{
              borderColor: step === 0 ? D.accent : "rgba(236,150,96,.2)",
              color: D.ink,
              background: step === 0 ? "rgba(240,134,43,.1)" : "transparent",
            }}
          >
            generate_topics
          </span>
          <span style={{ color: step >= 1 ? D.accentSoft : D.dim }}>→ Route::Send ×3 →</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">{TOPICS.map((t, i) => inv(t, i + 1))}</div>
        <div className="flex flex-wrap items-center gap-2 font-code text-[12px]">
          <span style={{ color: step >= 4 ? D.accentSoft : D.dim }}>→ barrier →</span>
          <span
            className="rounded-lg border px-2.5 py-1.5"
            style={{
              borderColor: step === 4 ? D.accent : "rgba(236,150,96,.2)",
              color: D.ink,
              background: step === 4 ? "rgba(240,134,43,.1)" : "transparent",
              opacity: step >= 4 ? 1 : 0.45,
            }}
          >
            summarize
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="min-w-0">
            <Label>Shared state · topics</Label>
            <Mono dim={step < 1}>{step >= 1 ? `[${TOPICS.map((t) => `"${t}"`).join(", ")}]` : "(unset)"}</Mono>
          </div>
          <div className="min-w-0">
            <Label>Shared state · results ({overwrite ? "Overwrite" : "Append"})</Label>
            <Mono tone={step >= 3 && !overwrite ? "green" : undefined} dim={step < 3}>
              {resultsValue}
            </Mono>
          </div>
        </div>
        {failed && (
          <Mono tone="red">
            invalid state update: channel `results` can receive only one value per super-step (reducer: overwrite);
            already written by node `process_item`, second write from node `process_item`. Use a multi-write reducer
            (Append/DeepMerge/AddMessages) to handle concurrent writes.
          </Mono>
        )}
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">
        Based on rusty-core/examples/parallel_fanout.rs, trimmed to three topics. The real records also carry a length and a checksum.
      </p>
    </DiagramFrame>
  );
}
