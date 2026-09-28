import { useState } from "react";
import { DiagramFrame, StepControls } from "./primitives";
import { D, useDiagramWidth, useStepper } from "./tokens";

const FORK_STEPS = [
  {
    title: "A run writes a checkpoint per step",
    text: "Thread t-main ran five super-steps and has checkpoints cp0 to cp4, one per boundary.",
  },
  {
    title: "fork_thread(\"t-main\", \"t-try-2\", Some(cp2))",
    text: "The checkpointer copies cp0, cp1, and cp2 into a new thread, oldest first. Ids, steps, and states are kept; only thread_id changes.",
  },
  {
    title: "run(…, RunConfig::new(\"t-try-2\").with_checkpoint_id(cp2))",
    text: "The executor loads cp2 with get_by_id and continues from its state and next_nodes. You can change the input or the code first; that is the point of going back.",
  },
  {
    title: "New history lands on the fork",
    text: "The rerun writes new checkpoints onto t-try-2. t-main is untouched, so you can compare the two timelines.",
  },
  {
    title: "Without the fork: replay on t-main",
    text: "Replaying cp2 on the same thread appends cp3′ and cp4′ after cp4. get_latest returns cp4′, the last one written, so a later resume continues the new timeline. That's why forking first is the safer pattern.",
  },
];

/** Fork-then-replay on a checkpoint history, after docs/architecture.md 4e. */
export function ForkTree() {
  const stepper = useStepper(FORK_STEPS.length, 2800);
  const { step } = stepper;
  const { ref, width } = useDiagramWidth();
  const left = 16;
  const gap = Math.min(64, (width - left * 2 - 12) / 6);
  const cx = (i: number) => left + 12 + i * gap;
  const yMain = 46;
  const yFork = 138;
  const height = 196;

  const dot = (x: number, y: number, label: string, style: "past" | "copy" | "new" | "alt" | "focus", key: string) => {
    const stroke =
      style === "new" ? D.accent : style === "alt" ? D.amber : style === "focus" ? D.accent : style === "copy" ? D.green : D.strong;
    const fill = style === "focus" ? "rgba(240,134,43,.25)" : style === "new" ? "rgba(240,134,43,.14)" : "#0d0908";
    return (
      <g key={key}>
        {style === "focus" && <circle cx={x} cy={y} r={17} fill="none" stroke={D.accent} strokeOpacity={0.5} />}
        <circle cx={x} cy={y} r={11} fill={fill} stroke={stroke} strokeWidth={1.6} />
        <text x={x} y={y + 28} textAnchor="middle" fontSize={11} fill={style === "past" ? D.body : stroke}>
          {label}
        </text>
      </g>
    );
  };

  const mainCount = 5;
  const altOnMain = step === 4;
  return (
    <DiagramFrame
      label="Time travel · fork, then replay"
      caption={FORK_STEPS[step]}
      controls={<StepControls stepper={stepper} count={FORK_STEPS.length} />}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block", fontFamily: D.mono }} role="img" aria-label={FORK_STEPS[step].title}>
          <text x={left} y={16} fontSize={11} fill={D.muted}>
            thread t-main
          </text>
          <line x1={cx(0)} y1={yMain} x2={cx(altOnMain ? 6 : mainCount - 1)} y2={yMain} stroke={D.line} />
          {Array.from({ length: mainCount }, (_, i) => dot(cx(i), yMain, `cp${i}`, "past", `m${i}`))}
          {altOnMain && (
            <>
              <path d={`M${cx(2)},${yMain - 11} C${cx(2)},${yMain - 30} ${cx(5)},${yMain - 30} ${cx(5)},${yMain - 13}`} fill="none" stroke={D.amber} strokeDasharray="3 3" />
              {dot(cx(5), yMain, "cp3′", "alt", "a3")}
              {dot(cx(6), yMain, "cp4′", "alt", "a4")}
            </>
          )}
          {step >= 1 && step <= 3 && (
            <>
              <text x={left} y={yFork + 48} fontSize={11} fill={D.green}>
                thread t-try-2
              </text>
              <line x1={cx(0)} y1={yFork} x2={cx(step >= 3 ? 4 : 2)} y2={yFork} stroke={D.line} />
              {[0, 1, 2].map((i) => (
                <line key={`c${i}`} x1={cx(i)} y1={yMain + 34} x2={cx(i)} y2={yFork - 13} stroke={D.green} strokeOpacity={0.45} strokeDasharray="2 4" />
              ))}
              {[0, 1, 2].map((i) => dot(cx(i), yFork, `cp${i}`, i === 2 && step === 2 ? "focus" : "copy", `f${i}`))}
              {step >= 3 && [3, 4].map((i) => dot(cx(i), yFork, `new${i - 2}`, "new", `n${i}`))}
            </>
          )}
          {step === 4 && (
            <text x={left} y={yFork} fontSize={11} fill={D.muted}>
              get_latest(t-main) → cp4′
            </text>
          )}
        </svg>
      </div>
    </DiagramFrame>
  );
}

const K = 32;
const CELLS = 40;

/** The delta-checkpoint chain bounded by DeltaPolicy::max_chain_len. */
export function DeltaChain() {
  const [n, setN] = useState(20);
  const base = Math.floor(n / K) * K;
  const deltas = n - base;
  return (
    <DiagramFrame
      label="Delta chain · max_chain_len = 32"
      caption={{
        title: `Resume from checkpoint ${n}`,
        text:
          deltas === 0
            ? `Checkpoint ${n} is a full snapshot, so a resume reads one file.`
            : `A resume reads the full snapshot at ${base} and ${deltas} delta${deltas === 1 ? "" : "s"} after it, and overlays the changed channels in order. The chain never grows past 31 deltas, so the worst case stays bounded.`,
      }}
    >
      <div className="grid grid-cols-8 gap-1.5" role="group" aria-label="Checkpoints in a delta chain">
        {Array.from({ length: CELLS }, (_, i) => {
          const full = i % K === 0;
          const read = i >= base && i <= n;
          const sel = i === n;
          return (
            <button
              key={i}
              onClick={() => setN(i)}
              aria-pressed={sel}
              aria-label={`Checkpoint ${i}, ${full ? "full snapshot" : "delta"}`}
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border py-1.5 font-code transition-colors"
              style={{
                borderColor: sel ? D.accent : read ? "rgba(240,134,43,.4)" : "rgba(236,150,96,.14)",
                background: read ? (full ? "rgba(240,134,43,.22)" : "rgba(240,134,43,.08)") : "transparent",
                boxShadow: sel ? "0 0 14px -3px rgba(240,134,43,.7)" : "none",
              }}
            >
              <span className="text-[13px]" style={{ color: full ? D.accentSoft : read ? D.ink : D.muted }}>
                {full ? "F" : "Δ"}
              </span>
              <span className="text-[10px]" style={{ color: D.dim }}>
                {i}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 font-code text-[11.5px] text-[#8b837b]">
        <span>F full snapshot</span>
        <span>Δ changed channels only</span>
        <span style={{ color: D.accentSoft }}>highlighted: read on resume</span>
      </div>
    </DiagramFrame>
  );
}
