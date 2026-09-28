import { useId, useState } from "react";
import { DiagramFrame, Markers } from "./primitives";
import { D } from "./tokens";

type BoxId = "A" | "B" | "C" | "D" | "E" | "F" | "RN" | "RS" | "RE" | "I";

const BOX: Record<BoxId, { cx: number; cy: number; w: number; label: string }> = {
  A: { cx: 180, cy: 22, w: 230, label: "merged state after the barrier" },
  B: { cx: 180, cy: 80, w: 176, label: "any Command::goto?" },
  C: { cx: 80, cy: 144, w: 150, label: "activate goto targets" },
  D: { cx: 266, cy: 144, w: 176, label: "edges of nodes that ran" },
  E: { cx: 176, cy: 208, w: 124, label: "direct → target" },
  F: { cx: 300, cy: 208, w: 108, label: "conditional" },
  RN: { cx: 132, cy: 272, w: 86, label: "Route::Node" },
  RS: { cx: 230, cy: 272, w: 86, label: "Route::Send" },
  RE: { cx: 318, cy: 272, w: 78, label: "Route::End" },
  I: { cx: 180, cy: 340, w: 176, label: "next active set" },
};

const H = 28;

type EdgeId = string;
const EDGES: { id: EdgeId; from: BoxId; to: BoxId; label?: string }[] = [
  { id: "AB", from: "A", to: "B" },
  { id: "BC", from: "B", to: "C", label: "yes" },
  { id: "BD", from: "B", to: "D", label: "no" },
  { id: "DE", from: "D", to: "E" },
  { id: "DF", from: "D", to: "F" },
  { id: "FRN", from: "F", to: "RN" },
  { id: "FRS", from: "F", to: "RS" },
  { id: "FRE", from: "F", to: "RE" },
  { id: "CI", from: "C", to: "I" },
  { id: "EI", from: "E", to: "I" },
  { id: "RNI", from: "RN", to: "I" },
  { id: "RSI", from: "RS", to: "I" },
];

const CASES: { id: string; label: string; path: EdgeId[]; title: string; text: string }[] = [
  {
    id: "goto",
    label: "Command::goto",
    path: ["AB", "BC", "CI"],
    title: "A node returned Command::goto",
    text: "Its targets are the next step, deduplicated, and static edges are not evaluated at all. A goto to a node that doesn't exist fails the run.",
  },
  {
    id: "direct",
    label: "Direct edge",
    path: ["AB", "BD", "DE", "EI"],
    title: "A static edge",
    text: "add_edge(from, to) activates its target whenever the source node ran in this step.",
  },
  {
    id: "node",
    label: "Route::Node",
    path: ["AB", "BD", "DF", "FRN", "RNI"],
    title: "A router picks one node",
    text: "A conditional edge calls its router with the merged state. Route::Node(name) activates that node.",
  },
  {
    id: "send",
    label: "Route::Send",
    path: ["AB", "BD", "DF", "FRS", "RSI"],
    title: "A router fans out",
    text: "Route::Send(items) activates one invocation per item, each with its own scoped state, even when they target the same node. Their writes fan back in through a multi-write reducer.",
  },
  {
    id: "end",
    label: "Route::End",
    path: ["AB", "BD", "DF", "FRE"],
    title: "A router ends this branch",
    text: "Route::End schedules nothing. If no node scheduled anything, the next set is empty and the run finishes with Done.",
  },
];

function anchor(b: BoxId, side: "top" | "bottom") {
  const x = BOX[b];
  return { x: x.cx, y: side === "top" ? x.cy - H / 2 : x.cy + H / 2 };
}

/** How the executor picks the next active set, after docs/architecture.md 4d. */
export function RoutingFlow() {
  const uid = useId().replace(/:/g, "");
  const [pick, setPick] = useState(CASES[3].id);
  const c = CASES.find((x) => x.id === pick)!;
  const onEdges = new Set(c.path);
  const onBoxes = new Set<BoxId>();
  EDGES.filter((e) => onEdges.has(e.id)).forEach((e) => {
    onBoxes.add(e.from);
    onBoxes.add(e.to);
  });

  return (
    <DiagramFrame label="Route · picking the next step" caption={{ title: c.title, text: c.text }}>
      <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Routing case">
        {CASES.map((x) => {
          const on = x.id === pick;
          return (
            <button
              key={x.id}
              role="radio"
              aria-checked={on}
              onClick={() => setPick(x.id)}
              className="cursor-pointer rounded-lg border px-2.5 py-1.5 font-code text-[12px] transition-colors"
              style={{
                borderColor: on ? "rgba(240,134,43,.6)" : "rgba(236,150,96,.2)",
                background: on ? "rgba(240,134,43,.14)" : "transparent",
                color: on ? "#ffe2cb" : "#b8b0a8",
              }}
            >
              {x.label}
            </button>
          );
        })}
      </div>
      <svg
        viewBox="0 0 360 362"
        width="100%"
        role="img"
        aria-label={`Routing flow, highlighting ${c.label}`}
        style={{ display: "block", maxWidth: 460, margin: "0 auto", fontFamily: D.mono }}
      >
        <Markers id={uid} />
        {EDGES.map((e) => {
          const a = anchor(e.from, "bottom");
          const b = anchor(e.to, "top");
          const on = onEdges.has(e.id);
          const midY = (a.y + b.y) / 2;
          return (
            <g key={e.id}>
              <path
                d={`M${a.x},${a.y} C${a.x},${midY} ${b.x},${midY} ${b.x},${b.y - 2}`}
                fill="none"
                stroke={on ? D.accent : D.line}
                strokeWidth={on ? 2 : 1.2}
                markerEnd={`url(#${uid}-${on ? "accent" : "line"})`}
                style={{ transition: "stroke .3s", filter: on ? `drop-shadow(0 0 4px ${D.accent})` : undefined }}
              />
              {e.label && (
                <text
                  x={(a.x + b.x) / 2 + (b.x < a.x ? -8 : 8)}
                  y={midY - 2}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill={on ? D.accentSoft : D.muted}
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {(Object.keys(BOX) as BoxId[]).map((id) => {
          const b = BOX[id];
          const on = onBoxes.has(id);
          const end = id === "RE" && on;
          return (
            <g key={id} style={{ transition: "opacity .3s" }} opacity={on ? 1 : 0.55}>
              <rect
                x={b.cx - b.w / 2}
                y={b.cy - H / 2}
                width={b.w}
                height={H}
                rx={7}
                fill={on ? (end ? "rgba(224,106,74,.12)" : "rgba(240,134,43,.10)") : "#0d0908"}
                stroke={on ? (end ? D.red : D.accent) : D.line}
              />
              <text x={b.cx} y={b.cy + 4} textAnchor="middle" fontSize={11} fill={on ? D.ink : D.body}>
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </DiagramFrame>
  );
}
