import { useId, useState } from "react";
import { Inline } from "./Inline";

const LETTERS = "ABCDEFGH";

/** Ask before telling: pick an option, then see the answer and why. */
export function Predict({ question, options, answer, explain }: { question: string; options: string[]; answer: number; explain: string }) {
  const [pick, setPick] = useState<number | null>(null);
  const qid = useId();
  const done = pick !== null;
  const right = pick === answer;

  return (
    <div
      role="group"
      aria-labelledby={qid}
      className="flex flex-col gap-3 rounded-xl border px-5 py-[18px]"
      style={{ borderColor: "rgba(240,134,43,.28)", background: "rgba(255,236,214,.03)" }}
    >
      <span className="font-code text-[10.5px] uppercase tracking-[0.14em] text-[#f0862b]">Predict first</span>
      <span id={qid} className="text-[16.5px] leading-[1.55] text-[#f7ece4]">
        <Inline text={question} />
      </span>
      <div className="flex flex-col gap-2">
        {options.map((o, i) => {
          const isAnswer = i === answer;
          const isPick = i === pick;
          const border = !done ? "rgba(236,150,96,.2)" : isAnswer ? "rgba(159,212,168,.6)" : isPick ? "rgba(240,154,128,.6)" : "rgba(236,150,96,.1)";
          const bg = !done ? "transparent" : isAnswer ? "rgba(159,212,168,.08)" : isPick ? "rgba(240,154,128,.07)" : "transparent";
          return (
            <button
              key={i}
              type="button"
              aria-pressed={isPick}
              aria-disabled={done}
              onClick={() => !done && setPick(i)}
              className={`flex items-start gap-3 rounded-[10px] border px-3.5 py-2.5 text-left text-[15.5px] leading-[1.5] transition-colors ${
                done ? "cursor-default" : "cursor-pointer hover:border-[rgba(240,134,43,.55)] hover:bg-[rgba(240,134,43,.07)]"
              }`}
              style={{ borderColor: border, background: bg, color: done && !isAnswer && !isPick ? "#8b837b" : "#ece0d5" }}
            >
              <span
                className="mt-px min-w-[18px] font-code text-[12px]"
                style={{ color: done && isAnswer ? "#9fd4a8" : done && isPick ? "#f09a80" : "#cbb3a2" }}
              >
                {done && isAnswer ? "✓" : done && isPick ? "✗" : LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1">
                <Inline text={o} />
              </span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {done && (
          <p className="m-0 text-[15.5px] leading-[1.6] text-[#cfc3b8]">
            <span style={{ color: right ? "#9fd4a8" : "#f5b774" }}>{right ? "Right. " : `Not quite: the answer is ${LETTERS[answer]}. `}</span>
            <Inline text={explain} />
          </p>
        )}
      </div>
    </div>
  );
}
