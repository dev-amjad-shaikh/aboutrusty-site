import { useId } from "react";
import { Markers } from "./primitives";
import { D, toneColor, useDiagramWidth, type Tone } from "./tokens";

export interface Lane {
  id: string;
  label: string;
}

export interface Message {
  from: string;
  /** Omit for self-calls, kills, and boots. */
  to?: string;
  label: string;
  tone?: Tone;
  /** msg: solid arrow · reply: dashed arrow · self: loop on one lane ·
   *  kill: the lane's process dies · boot: the lane's process starts. */
  kind?: "msg" | "reply" | "self" | "kill" | "boot";
}

const ROW = 42;
const HEAD = 46;

/**
 * A sequence diagram that steps with the reader: messages before `active`
 * are drawn solid, the active one in its tone, later ones faint. Rendered at
 * the container's pixel width so labels stay 11px on a phone.
 */
export function SequenceDiagram({ lanes, messages, active }: { lanes: Lane[]; messages: Message[]; active: number }) {
  const { ref, width } = useDiagramWidth();
  const uid = useId().replace(/:/g, "");
  const pad = 6;
  const n = lanes.length;
  const col = (width - pad * 2) / n;
  const x = (id: string) => pad + col * (lanes.findIndex((l) => l.id === id) + 0.5);
  const height = HEAD + messages.length * ROW + 10;
  const fs = col < 84 ? 10 : 11;
  const charW = fs * 0.62;

  // Rows during which a lane's process is dead (between a kill and a boot).
  const dead: Record<string, [number, number][]> = {};
  messages.forEach((m, i) => {
    if (m.kind === "kill") (dead[m.from] ??= []).push([i, messages.length]);
    if (m.kind === "boot") {
      const open = dead[m.from]?.find((r) => r[1] === messages.length);
      if (open) open[1] = i;
    }
  });

  const clampMid = (mid: number, label: string) => {
    const half = (label.length * charW) / 2;
    return Math.max(pad + half, Math.min(width - pad - half, mid));
  };

  return (
    <div ref={ref} className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={messages.map((m) => m.label).join(", ")}
        style={{ display: "block", fontFamily: D.mono }}
      >
        <Markers id={uid} />
        {lanes.map((l) => {
          const cx = x(l.id);
          const bw = Math.min(col - 6, 132);
          return (
            <g key={l.id}>
              <line x1={cx} y1={34} x2={cx} y2={height - 4} stroke={D.hair} strokeDasharray="3 4" />
              {(dead[l.id] ?? []).map(([a, b]) => (
                <line
                  key={a}
                  x1={cx}
                  x2={cx}
                  y1={HEAD + a * ROW + 28}
                  y2={HEAD + b * ROW + 22}
                  stroke={D.red}
                  strokeOpacity={a < active + 1 ? 0.5 : 0.15}
                  strokeWidth={2}
                  strokeDasharray="2 5"
                />
              ))}
              <rect x={cx - bw / 2} y={6} width={bw} height={28} rx={7} fill="#0d0908" stroke={D.line} />
              <text x={cx} y={24.5} textAnchor="middle" fontSize={fs} fill={D.ink}>
                {l.label}
              </text>
            </g>
          );
        })}
        {messages.map((m, i) => {
          const state = i < active ? "past" : i === active ? "now" : "future";
          const color = state === "now" ? toneColor(m.tone) : m.tone === "red" && state === "past" ? D.red : D.strong;
          const textColor = state === "now" ? D.ink : D.body;
          const op = state === "future" ? 0.32 : 1;
          const y = HEAD + i * ROW;
          const fx = x(m.from);
          const marker = `url(#${uid}-${state === "now" ? m.tone ?? "accent" : m.tone === "red" && state === "past" ? "red" : "line"})`;
          const kind = m.kind ?? "msg";

          if (kind === "kill" || kind === "boot") {
            const c = kind === "kill" ? D.red : D.green;
            const mid = clampMid(fx, m.label);
            return (
              <g key={i} opacity={op} style={{ transition: "opacity .35s" }}>
                {kind === "kill" ? (
                  <path
                    d={`M${fx - 7},${y + 19} l14,14 M${fx + 7},${y + 19} l-14,14`}
                    stroke={c}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ) : (
                  <circle cx={fx} cy={y + 26} r={7} fill="#0d0908" stroke={c} strokeWidth={2} />
                )}
                <text x={mid} y={y + 13} textAnchor="middle" fontSize={fs} fill={state === "future" ? D.body : c}>
                  {m.label}
                </text>
              </g>
            );
          }

          if (kind === "self") {
            const mid = clampMid(fx + 30 + (m.label.length * charW) / 2, m.label);
            return (
              <g key={i} opacity={op} style={{ transition: "opacity .35s" }}>
                <text x={mid} y={y + 13} textAnchor="middle" fontSize={fs} fill={textColor}>
                  {m.label}
                </text>
                <path
                  d={`M${fx},${y + 20} h22 v12 h-19`}
                  fill="none"
                  stroke={color}
                  strokeWidth={state === "now" ? 2 : 1.4}
                  markerEnd={marker}
                />
              </g>
            );
          }

          const tx = x(m.to ?? m.from);
          const dir = tx >= fx ? 1 : -1;
          const mid = clampMid((fx + tx) / 2, m.label);
          return (
            <g key={i} opacity={op} style={{ transition: "opacity .35s" }}>
              <text x={mid} y={y + 15} textAnchor="middle" fontSize={fs} fill={textColor}>
                {m.label}
              </text>
              <line
                x1={fx + dir * 3}
                y1={y + 26}
                x2={tx - dir * 4}
                y2={y + 26}
                stroke={color}
                strokeWidth={state === "now" ? 2 : 1.4}
                strokeDasharray={kind === "reply" ? "5 4" : undefined}
                markerEnd={marker}
                style={state === "now" ? { filter: `drop-shadow(0 0 5px ${color})` } : undefined}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
