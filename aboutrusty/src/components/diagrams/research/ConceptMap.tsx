import { useState } from "react";
import { MONO, T } from "./kit";

/*
 * The Concepts page's dependency map: four layers of concepts and the edges
 * between them. Each edge carries one sentence, checked against rusty-src,
 * saying how the two concepts connect.
 */

interface Place {
  lane: number;
  col: number;
}

export const LANES = ["Engine", "Durability", "Evidence", "Governance"];

export const PLACES: Record<string, Place> = {
  Graph: { lane: 0, col: 0 },
  "State channel": { lane: 0, col: 1 },
  Reducer: { lane: 0, col: 2 },
  "Super-step": { lane: 0, col: 3 },
  Interrupt: { lane: 1, col: 2 },
  Checkpoint: { lane: 1, col: 3 },
  "Durable task": { lane: 1, col: 4 },
  Replay: { lane: 2, col: 1 },
  "Run journal": { lane: 2, col: 2 },
  Fork: { lane: 2, col: 3 },
  "Signed receipt": { lane: 2, col: 4 },
  Candidate: { lane: 3, col: 0 },
  Evaluation: { lane: 3, col: 1 },
  Promotion: { lane: 3, col: 2 },
  Rollback: { lane: 3, col: 3 },
};

export interface Edge {
  from: string;
  to: string;
  says: string;
}

export const EDGES: Edge[] = [
  { from: "Graph", to: "State channel", says: "Graph nodes never return whole state. They write partial updates to state channels." },
  { from: "State channel", to: "Reducer", says: "Each state channel has a reducer that merges the writes to it." },
  { from: "Reducer", to: "Super-step", says: "Reducers merge a super-step's writes at the barrier." },
  { from: "Super-step", to: "Checkpoint", says: "A checkpoint is saved after each super-step." },
  { from: "Checkpoint", to: "Interrupt", says: "An interrupted run resumes from its checkpoint." },
  { from: "Checkpoint", to: "Durable task", says: "The outbox commits a checkpoint and a task submission in one Postgres transaction." },
  { from: "Checkpoint", to: "Fork", says: "A fork copies a thread's checkpoints into a new thread." },
  { from: "Super-step", to: "Run journal", says: "The journal records super-step boundaries, node calls, and model and tool calls." },
  { from: "Durable task", to: "Run journal", says: "Effect receipts from durable work are written to the run's journal." },
  { from: "Run journal", to: "Replay", says: "Replay serves model and tool results from the journal instead of calling out." },
  { from: "Run journal", to: "Signed receipt", says: "A signed receipt covers the journal's head hash, and through it the whole chain." },
  { from: "Replay", to: "Evaluation", says: "Evaluation replays recorded runs against the candidate." },
  { from: "Candidate", to: "Evaluation", says: "Every candidate is evaluated against recorded evidence." },
  { from: "Evaluation", to: "Promotion", says: "Promotion follows evaluation, inside a declared envelope." },
  { from: "Promotion", to: "Rollback", says: "Rollback moves the version pointer back to the prior version." },
];

type Orientation = "wide" | "tall";

const GEOM = {
  wide: { W: 1000, H: 410, nodeW: 150, nodeH: 40, font: 14, pos: (c: number) => 190 + c * 178, lane: (l: number) => 52 + l * 102 },
  tall: { W: 410, H: 420, nodeW: 92, nodeH: 34, font: 10.5, pos: (c: number) => 62 + c * 82, lane: (l: number) => 54 + l * 101 },
};

function edgePath(o: Orientation, e: Edge) {
  const g = GEOM[o];
  const s = PLACES[e.from];
  const t = PLACES[e.to];
  // Logical coordinates: p along the lane, l across lanes.
  const halfP = (o === "wide" ? g.nodeW : g.nodeH) / 2;
  const halfL = (o === "wide" ? g.nodeH : g.nodeW) / 2;
  const sp = g.pos(s.col), sl = g.lane(s.lane);
  const tp = g.pos(t.col), tl = g.lane(t.lane);
  const xy = (p: number, l: number) => (o === "wide" ? `${p} ${l}` : `${l} ${p}`);
  if (s.lane === t.lane) {
    const dir = tp > sp ? 1 : -1;
    if (Math.abs(t.col - s.col) === 1) {
      return `M${xy(sp + dir * halfP, sl)} L${xy(tp - dir * (halfP + 2), tl)}`;
    }
    const bend = sl + halfL + (o === "wide" ? 26 : 10);
    return `M${xy(sp, sl + halfL)} C${xy(sp, bend)} ${xy(tp, bend)} ${xy(tp, tl + halfL + 2)}`;
  }
  const down = tl > sl ? 1 : -1;
  const a = sl + down * halfL;
  const b = tl - down * (halfL + 2);
  const mid = (a + b) / 2;
  return `M${xy(sp, a)} C${xy(sp, mid)} ${xy(tp, mid)} ${xy(tp, b)}`;
}

function MapSvg({
  o,
  active,
  onSelect,
  onHover,
  className,
}: {
  o: Orientation;
  active: string;
  onSelect: (t: string) => void;
  onHover: (t: string | null) => void;
  className: string;
}) {
  const g = GEOM[o];
  const linked = new Set<string>([active]);
  EDGES.forEach((e) => {
    if (e.from === active) linked.add(e.to);
    if (e.to === active) linked.add(e.from);
  });
  const mid = `cm-${o}`;
  return (
    <svg
      viewBox={`0 0 ${g.W} ${g.H}`}
      width="100%"
      className={`block h-auto ${className}`}
      fontFamily={MONO}
      role="group"
      aria-label="Concept map: how Rusty's concepts depend on each other"
    >
      <style>{`.cm-flow{stroke-dasharray:6 7;animation:cm-dash 1.4s linear infinite}@keyframes cm-dash{to{stroke-dashoffset:-26}}@media (prefers-reduced-motion: reduce){.cm-flow{animation:none}}.cm-node{cursor:pointer;transition:opacity .25s}.cm-node:focus{outline:none}.cm-node:focus-visible rect{stroke:#fb9a3f;stroke-width:2}`}</style>
      <defs>
        <marker id={`${mid}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9 z" fill={T.accent} />
        </marker>
        <marker id={`${mid}-l`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9 z" fill={T.lineStrong} />
        </marker>
      </defs>

      {LANES.map((name, l) => {
        const c = g.lane(l);
        const band = o === "wide" ? g.nodeH + 38 : g.nodeW + 8;
        return o === "wide" ? (
          <g key={name}>
            <rect x={4} y={c - band / 2} width={g.W - 8} height={band} rx={14} fill="rgba(255,236,214,.022)" stroke="rgba(236,150,96,.12)" />
            <text x={22} y={c + 4} fontSize={11.5} fill="#cbb3a2" letterSpacing="1.6">{name.toUpperCase()}</text>
          </g>
        ) : (
          <g key={name}>
            <rect x={c - band / 2} y={4} width={band} height={g.H - 8} rx={12} fill="rgba(255,236,214,.022)" stroke="rgba(236,150,96,.12)" />
            <text x={c} y={24} textAnchor="middle" fontSize={9.5} fill="#cbb3a2" letterSpacing="1.2">{name.toUpperCase()}</text>
          </g>
        );
      })}

      {EDGES.map((e) => {
        const on = e.from === active || e.to === active;
        return (
          <path
            key={`${e.from}-${e.to}`}
            d={edgePath(o, e)}
            fill="none"
            stroke={on ? T.accent : T.lineStrong}
            strokeWidth={on ? 1.6 : 1.1}
            opacity={on ? 1 : 0.55}
            className={on ? "cm-flow" : undefined}
            markerEnd={`url(#${mid}-${on ? "a" : "l"})`}
          />
        );
      })}

      {Object.entries(PLACES).map(([t, p]) => {
        const px = g.pos(p.col), pl = g.lane(p.lane);
        const cx = o === "wide" ? px : pl;
        const cy = o === "wide" ? pl : px;
        const isActive = t === active;
        const isLinked = linked.has(t);
        return (
          <g
            key={t}
            className="cm-node"
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            aria-label={t}
            opacity={isLinked ? 1 : 0.5}
            onClick={() => onSelect(t)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                onSelect(t);
              }
            }}
            onMouseEnter={() => onHover(t)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(t)}
            onBlur={() => onHover(null)}
          >
            <rect
              x={cx - g.nodeW / 2}
              y={cy - g.nodeH / 2}
              width={g.nodeW}
              height={g.nodeH}
              rx={o === "wide" ? 10 : 8}
              fill={isActive ? "rgba(240,134,43,.18)" : "#110d0b"}
              stroke={isActive ? "rgba(240,134,43,.75)" : isLinked ? "rgba(240,134,43,.45)" : "rgba(236,150,96,.24)"}
            />
            <text
              x={cx}
              y={cy + g.font * 0.36}
              textAnchor="middle"
              fontSize={g.font}
              fill={isActive ? "#fff3ea" : "#d8ccc0"}
              fontFamily={o === "wide" ? "Outfit, ui-sans-serif, system-ui, sans-serif" : MONO}
            >
              {t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Interactive concept map. Hover previews a concept's links; click selects it. */
export function ConceptMap({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (t: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ?? selected;
  return (
    <>
      <MapSvg o="wide" active={active} onSelect={onSelect} onHover={setHover} className="max-md:hidden" />
      <MapSvg o="tall" active={active} onSelect={onSelect} onHover={setHover} className="md:hidden" />
    </>
  );
}
