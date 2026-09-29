import { laneStatusAt, type Lane, type StepResult } from "./engine";
import { Dot, Label } from "./chrome";
import { C } from "./tokens";

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th"];

const LANE_COLOR: Record<Lane["status"] | "running", string> = {
  running: C.accent,
  ok: C.green,
  interrupted: C.amber,
  failed: C.red,
  discarded: C.dim,
  aborted: C.dim,
};

const LANE_TEXT: Record<Lane["status"] | "running", string> = {
  running: "running",
  ok: "done",
  interrupted: "interrupted",
  failed: "failed",
  discarded: "discarded",
  aborted: "aborted",
};

function short(v: unknown): string {
  const s = JSON.stringify(v);
  return s.length > 64 ? `${s.slice(0, 61)}…` : s;
}

function writeText(l: Lane): string {
  if (l.status === "interrupted") return "ctx.interrupt(…)";
  if (l.status === "failed") return l.error ?? "error";
  if (l.status === "aborted") return "stopped before it reported";
  const entries = Object.entries(l.writes ?? {});
  if (entries.length === 0) return "no writes";
  return entries.map(([k, v]) => `${k} ← ${short(v)}`).join(", ");
}

/**
 * The active set of the step on screen: one lane per node, its state at the
 * current stage, what it wrote, and the order it reached the barrier.
 */
export function Lanes({ result, stage, next }: { result: StepResult | null; stage: number; next: string[] }) {
  if (!result || result.kind === "ceiling") {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <Label>Active set</Label>
        <div
          className="flex min-h-[150px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-5 text-center text-[14px] text-[#8b837b]"
          style={{ borderColor: C.faint }}
        >
          {result?.kind === "ceiling" ? (
            <span>
              No node ran. The run stopped at <code className="font-code text-[#ffc7a6]">max_steps</code> before step {result.step}.
            </span>
          ) : next.length ? (
            <span>
              Scheduled next: <code className="font-code text-[#ffc7a6]">[{next.join(", ")}]</code>
            </span>
          ) : (
            <span>Nothing scheduled.</span>
          )}
        </div>
      </div>
    );
  }
  const settled = stage >= 2;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label>Active set · step {result.step}</Label>
      {result.lanes.map((l) => {
        const status = settled ? laneStatusAt(result, l, stage) : "running";
        const color = LANE_COLOR[status];
        const struck = settled && (status === "discarded" || status === "aborted");
        return (
          <div
            key={l.node}
            className="flex min-w-0 flex-col gap-1.5 rounded-xl border p-3 transition-all duration-300"
            style={{ borderColor: `${color}66`, background: `${color}0f`, opacity: struck ? 0.65 : 1 }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Dot color={color} pulse={!settled && stage >= 1} />
              <span className="min-w-0 truncate font-code text-[13px] text-[#f7ece4]">{l.node}</span>
              <span className="ml-auto shrink-0 font-code text-[11px]" style={{ color }}>
                {LANE_TEXT[status]}
              </span>
            </div>
            {stage >= 1 && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-code text-[11.5px] text-[#a39a91]">
                <span className="rounded border px-1.5 py-[1px]" style={{ borderColor: C.faint }}>
                  snapshot@step{result.step}
                </span>
                {l.resumeSeen && (
                  <span className="rounded border px-1.5 py-[1px] text-[#f5b774]" style={{ borderColor: "rgba(245,183,116,.35)" }}>
                    resume value
                  </span>
                )}
                {settled && l.finished && <span>reported {ORDINAL[l.finished - 1]}</span>}
              </div>
            )}
            {settled && (
              <span
                className="break-words font-code text-[11.5px]"
                style={{ color: l.status === "failed" ? C.red : struck ? C.dim : C.soft, textDecoration: status === "discarded" ? "line-through" : "none" }}
              >
                {writeText(l)}
              </span>
            )}
          </div>
        );
      })}
      {stage >= 3 && result.mergeOrder.length > 1 && (
        <span className="font-code text-[11.5px] text-[#a39a91]">
          merge order: <span className="text-[#ffc7a6]">{result.mergeOrder.join(" → ")}</span>
        </span>
      )}
    </div>
  );
}
