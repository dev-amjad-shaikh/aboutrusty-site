import { END, SCENARIOS, type GraphEdge, type GraphNode, type LaneStatus, type ScenarioId } from "./engine";
import { C } from "./tokens";

export type NodeLook = "running" | LaneStatus | "next" | null;

const LOOK_COLOR: Record<Exclude<NodeLook, null>, string> = {
  running: C.accent,
  ok: C.green,
  interrupted: C.amber,
  failed: C.red,
  discarded: C.dim,
  aborted: C.dim,
  next: C.accent,
};

const H = 34;
const width = (n: GraphNode) => (n.id === END ? 44 : Math.max(62, n.id.length * 7.3 + 22));

/** Where the segment from a node's center toward (tx, ty) leaves its box. */
function exit(n: GraphNode, tx: number, ty: number): [number, number] {
  const dx = tx - n.x;
  const dy = ty - n.y;
  if (n.id === END) {
    const len = Math.hypot(dx, dy) || 1;
    return [n.x + (dx / len) * 22, n.y + (dy / len) * 22];
  }
  const hw = width(n) / 2 + 2;
  const hh = H / 2 + 2;
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return [n.x + dx * t, n.y + dy * t];
}

function edgeGeometry(a: GraphNode, b: GraphNode, e: GraphEdge) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const bend = e.bend ?? 0;
  const cx = mx + (-(b.y - a.y) / len) * bend;
  const cy = my + ((b.x - a.x) / len) * bend;
  const [x1, y1] = exit(a, cx, cy);
  const [x2, y2] = exit(b, cx, cy);
  const d = bend ? `M${x1},${y1} Q${cx},${cy} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
  return { d, lx: bend ? (x1 + 2 * cx + x2) / 4 : mx, ly: bend ? (y1 + 2 * cy + y2) / 4 : my };
}

/**
 * The compiled graph. Nodes take the color of their state in the step on
 * screen; edges the step routed through light up after the Route stage.
 */
export function GraphView({
  scenario,
  looks,
  fired,
  done,
}: {
  scenario: ScenarioId;
  looks: Record<string, NodeLook>;
  fired: { from: string; to: string }[];
  done: boolean;
}) {
  const def = SCENARIOS[scenario];
  const byId = new Map(def.nodes.map((n) => [n.id, n]));
  const firedSet = new Set(fired.map((r) => `${r.from}>${r.to}`));
  return (
    <svg viewBox="0 0 490 220" className="block h-auto w-full" role="img" aria-label={`The ${def.graph} graph`}>
      <defs>
        <marker id="pg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(236,150,96,.5)" />
        </marker>
        <marker id="pg-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
        </marker>
      </defs>
      {def.edges.map((e) => {
        const a = byId.get(e.from)!;
        const b = byId.get(e.to)!;
        const on = firedSet.has(`${e.from}>${e.to}`);
        const g = edgeGeometry(a, b, e);
        return (
          <g key={`${e.from}>${e.to}`}>
            <path
              d={g.d}
              fill="none"
              stroke={on ? C.accent : "rgba(236,150,96,.3)"}
              strokeWidth={on ? 2 : 1.3}
              strokeDasharray={e.conditional ? "5 4" : undefined}
              markerEnd={on ? "url(#pg-arrow-on)" : "url(#pg-arrow)"}
              style={{ transition: "stroke .3s" }}
            />
            {e.label && (
              <text x={g.lx} y={g.ly - 5} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={10} fill={on ? C.soft : C.dim}>
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {def.nodes.map((n) => {
        if (n.id === END) {
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={20} fill={done ? `${C.green}22` : "none"} stroke={done ? C.green : "rgba(236,150,96,.3)"} strokeDasharray="3 3" />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={10.5} fill={C.muted}>
                END
              </text>
            </g>
          );
        }
        const look = looks[n.id] ?? null;
        const color = look ? LOOK_COLOR[look] : "rgba(236,150,96,.28)";
        const w = width(n);
        return (
          <g key={n.id}>
            {look === "running" && (
              <rect x={n.x - w / 2 - 4} y={n.y - H / 2 - 4} width={w + 8} height={H + 8} rx={12} fill="none" stroke={C.accent} strokeOpacity={0.4} strokeWidth={4} className="pg-pulse" />
            )}
            <rect
              x={n.x - w / 2}
              y={n.y - H / 2}
              width={w}
              height={H}
              rx={9}
              fill={look && look !== "next" ? `${color}22` : "rgba(20,12,9,.92)"}
              stroke={color}
              strokeWidth={look ? 1.6 : 1}
              strokeDasharray={look === "next" ? "4 3" : undefined}
              style={{ transition: "all .3s" }}
            />
            <text x={n.x} y={n.y + 4.5} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={12} fill={look && look !== "discarded" && look !== "aborted" ? C.ink : "#b8b0a8"}>
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
