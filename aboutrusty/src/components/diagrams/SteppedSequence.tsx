import type { ReactNode } from "react";
import { DiagramFrame, StepControls } from "./primitives";
import { useStepper } from "./tokens";
import { SequenceDiagram, type Lane, type Message } from "./SequenceDiagram";

export interface SequenceStep extends Message {
  /** Caption shown under the diagram while this message is active. */
  title: string;
  text: string;
  bad?: boolean;
}

/** A sequence diagram with Back / Next / Auto-play and a caption per step. */
export function SteppedSequence({
  label,
  lanes,
  steps,
  aside,
}: {
  label: string;
  lanes: Lane[];
  steps: SequenceStep[];
  /** Optional panel rendered beside the diagram, given the active step. */
  aside?: (step: number) => ReactNode;
}) {
  const stepper = useStepper(steps.length, 2600);
  const s = steps[stepper.step];
  const diagram = <SequenceDiagram lanes={lanes} messages={steps} active={stepper.step} />;
  return (
    <DiagramFrame
      label={label}
      caption={{ title: s.title, text: s.text }}
      captionTone={s.bad ? "bad" : "plain"}
      controls={<StepControls stepper={stepper} count={steps.length} />}
    >
      {aside ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
          {diagram}
          {aside(stepper.step)}
        </div>
      ) : (
        diagram
      )}
    </DiagramFrame>
  );
}
