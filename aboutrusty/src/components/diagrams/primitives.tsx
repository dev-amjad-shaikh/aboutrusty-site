import type { ReactNode } from "react";
import { D, type useStepper } from "./tokens";

const btn =
  "cursor-pointer rounded-lg border px-3 py-2 text-[14px] transition-colors disabled:cursor-default disabled:opacity-40";

/** Back / Next / Auto-play controls shared by stepped diagrams. */
export function StepControls({
  stepper,
  count,
  nextLabel,
  children,
}: {
  stepper: ReturnType<typeof useStepper>;
  count: number;
  nextLabel?: string;
  children?: ReactNode;
}) {
  const { step, auto, setAuto, next, back, atEnd } = stepper;
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-5"
      style={{ borderColor: "rgba(236,150,96,.10)" }}
    >
      <button
        onClick={() => setAuto(!auto)}
        className={btn}
        style={{
          borderColor: auto ? "rgba(240,134,43,.6)" : "rgba(236,150,96,.22)",
          background: auto ? "rgba(240,134,43,.14)" : "transparent",
          color: auto ? "#ffe2cb" : "#d8ccc0",
        }}
      >
        {auto ? "❚❚ Pause" : "▶ Auto-play"}
      </button>
      <button
        onClick={back}
        disabled={step === 0}
        className={btn}
        style={{ borderColor: "rgba(236,150,96,.22)", background: "transparent", color: "#d8ccc0" }}
      >
        Back
      </button>
      <button
        onClick={next}
        className={`${btn} border-0 font-medium`}
        style={{ background: D.accent, color: "#2a1000" }}
      >
        {atEnd ? "Restart" : nextLabel ?? "Next"}
      </button>
      <span className="font-code text-[12px] text-[#8b837b]">
        {step + 1} / {count}
      </span>
      {children && (
        <>
          <span className="flex-1" />
          {children}
        </>
      )}
    </div>
  );
}

/** A toggle chip used for "what if" switches under a diagram. */
export function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="cursor-pointer rounded-lg border px-3 py-2 text-[13.5px] transition-colors"
      style={{
        borderColor: on ? "rgba(224,106,74,.55)" : "rgba(236,150,96,.2)",
        background: on ? "rgba(224,106,74,.12)" : "transparent",
        color: on ? "#f7c3b3" : "#b8b0a8",
      }}
    >
      {children}
    </button>
  );
}

/** The bordered panel every diagram sits in, with an optional caption. */
export function DiagramFrame({
  label,
  children,
  caption,
  captionTone,
  controls,
}: {
  label?: string;
  children: ReactNode;
  caption?: { title: string; text: string };
  captionTone?: "plain" | "bad";
  controls?: ReactNode;
}) {
  return (
    <figure
      className="m-0 overflow-hidden rounded-2xl border"
      style={{ borderColor: "rgba(236,150,96,.22)", background: D.panel, boxShadow: "0 30px 70px -30px rgba(0,0,0,.8)" }}
    >
      {label && (
        <div className="px-4 pt-4 font-code text-[11px] uppercase tracking-[0.12em] text-[#8b837b] sm:px-5">
          {label}
        </div>
      )}
      <div className="px-4 py-4 sm:px-5">{children}</div>
      {caption && (
        <figcaption
          aria-live="polite"
          className="flex flex-col gap-1.5 border-t px-4 py-4 sm:px-5"
          style={{
            borderColor: "rgba(236,150,96,.10)",
            background: captionTone === "bad" ? "rgba(224,106,74,.08)" : "rgba(255,236,214,.03)",
          }}
        >
          <span className="text-[15.5px] font-normal text-[#f7ece4]">{caption.title}</span>
          <span className="text-[15px] leading-[1.6] text-[#cfc3b8]">{caption.text}</span>
        </figcaption>
      )}
      {controls}
    </figure>
  );
}

/** Arrowhead markers; render once inside each <svg>. */
export function Markers({ id }: { id: string }) {
  const colors: [string, string][] = [
    ["line", D.strong],
    ["accent", D.accent],
    ["green", D.green],
    ["red", D.red],
    ["amber", D.amber],
    ["plain", D.body],
  ];
  return (
    <defs>
      {colors.map(([k, c]) => (
        <marker
          key={k}
          id={`${id}-${k}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9 z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

