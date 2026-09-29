import { useId, useState } from "react";
import { CodePre, CommandBlock } from "./Code";
import { Inline } from "./Inline";

type Exercise = { change: string; predict: string; result: string };

const STEP = "font-code text-[10.5px] uppercase tracking-[0.14em]";
const LINK_BTN = "cursor-pointer self-start border-0 bg-transparent p-0 text-[14.5px] text-[#f0862b] hover:text-[#fb9a3f]";


/** Exercise prose: blank lines split paragraphs, newlines break lines, ``` fences render as code. */
function ExerciseText({ text }: { text: string }) {
  const parts = text.split(/```[a-z]*\n?([\s\S]*?)```/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            className="m-0 overflow-x-auto rounded-lg border px-3 py-2 font-code text-[12.5px] leading-[1.6] text-[#ddd0c4]"
            style={{ borderColor: "rgba(236,150,96,.14)", background: "rgba(8,5,4,.7)" }}
          >
            {part.replace(/\n$/, "")}
          </pre>
        ) : (
          part
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((para, j) => (
              <p key={`${i}-${j}`} className="m-0">
                {para.trim().split("\n").map((line, k) => (
                  <span key={k}>
                    {k > 0 && <br />}
                    <Inline text={line} />
                  </span>
                ))}
              </p>
            ))
        ),
      )}
    </>
  );
}

function ExerciseSteps({ exercise }: { exercise: Exercise }) {
  const [step, setStep] = useState(1);
  const [guess, setGuess] = useState("");
  const guessId = useId();
  return (
    <div className="flex flex-col gap-3.5 border-t pt-4" style={{ borderColor: "rgba(236,150,96,.12)" }}>
      <span className="text-[16px] text-[#f7ece4]">Try a change</span>
      <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
        <li className="flex flex-col gap-1.5">
          <span className={`${STEP} text-[#cbb3a2]`}>1 · Change</span>
          <div className="flex flex-col gap-2 text-[15.5px] leading-[1.6] text-[#cfc3b8]">
            <ExerciseText text={exercise.change} />
          </div>
          {step === 1 && (
            <button type="button" className={LINK_BTN} onClick={() => setStep(2)}>
              Next: predict →
            </button>
          )}
        </li>
        {step >= 2 && (
          <li className="flex flex-col gap-1.5">
            <label htmlFor={guessId} className={`${STEP} text-[#cbb3a2]`}>
              2 · Your prediction
            </label>
            <div className="flex flex-col gap-2 text-[15.5px] leading-[1.6] text-[#cfc3b8]">
              <ExerciseText text={exercise.predict} />
            </div>
            <textarea
              id={guessId}
              rows={2}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Write it down before you run it (optional)"
              className="w-full resize-y rounded-[9px] border bg-[rgba(8,5,4,.6)] px-3 py-2 text-[15px] text-[#ece0d5] placeholder:text-[#6f675f] focus:outline-none focus:ring-1 focus:ring-[#f0862b]"
              style={{ borderColor: "rgba(236,150,96,.2)" }}
            />
            {step === 2 && (
              <button type="button" className={LINK_BTN} onClick={() => setStep(3)}>
                Show what happened →
              </button>
            )}
          </li>
        )}
        {step >= 3 && (
          <li className="flex flex-col gap-1.5" aria-live="polite">
            <span className={`${STEP} text-[#9fd4a8]`}>3 · What happened</span>
            <div className="flex flex-col gap-2 text-[15.5px] leading-[1.6] text-[#d8ccc0]">
              <ExerciseText text={exercise.result} />
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}

/** Run it yourself: commands, the real captured output, an optional exercise. */
export function Lab({
  title,
  intro,
  commands,
  output,
  capturedAt,
  exercise,
}: {
  title: string;
  intro: string;
  commands: string;
  output: string;
  capturedAt: string;
  exercise?: Exercise;
}) {
  const [showOut, setShowOut] = useState(false);
  const outId = useId();
  return (
    <div
      className="flex flex-col gap-4 rounded-[14px] border px-5 py-5 sm:px-6"
      style={{ borderColor: "rgba(240,134,43,.3)", background: "linear-gradient(160deg,rgba(240,134,43,.07),rgba(200,110,44,.01))" }}
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-code text-[10.5px] uppercase tracking-[0.14em] text-[#f0862b]">Run it yourself</span>
        <span className="text-[19px] font-normal text-[#f7ece4]">{title}</span>
        <span className="flex flex-col gap-2 text-[15.5px] leading-[1.6] text-[#cfc3b8]">
          <Inline text={intro} />
        </span>
      </div>
      <CommandBlock code={commands} />
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(8,5,4,.75)" }}>
        <button
          type="button"
          aria-expanded={showOut}
          aria-controls={showOut ? outId : undefined}
          onClick={() => setShowOut((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-[rgba(255,236,214,.02)] px-3.5 py-2 text-left font-code text-[11.5px] text-[#cbb3a2] hover:text-[#ffd0b3]"
        >
          <span>Output at {capturedAt}</span>
          <span aria-hidden="true" className="text-[#8b837b]">
            {showOut ? "hide ▴" : "show ▾"}
          </span>
        </button>
        {showOut && (
          <div id={outId} className="border-t" style={{ borderColor: "rgba(236,150,96,.10)" }}>
            <CodePre code={output} lang="text" maxHeight={420} />
          </div>
        )}
      </div>
      {exercise && <ExerciseSteps exercise={exercise} />}
    </div>
  );
}
