import { createContext, useContext, useId } from "react";
import type { ReactNode } from "react";

/** Site tokens for diagrams. */
export const T = {
  line: "rgba(236,150,96,.24)",
  lineStrong: "rgba(236,150,96,.42)",
  fill: "rgba(255,236,214,.03)",
  accent: "#f0862b",
  accentFill: "rgba(240,134,43,.13)",
  green: "#9fd4a8",
  greenFill: "rgba(159,212,168,.10)",
  red: "#f09a80",
  redFill: "rgba(240,154,128,.10)",
  amber: "#f5b774",
  ink: "#f7ece4",
  body: "#d8ccc0",
  muted: "#a39a91",
  faint: "#6f675f",
};

export const MONO = `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

export type Tone = "line" | "accent" | "green" | "red" | "muted";

const STROKE: Record<Tone, string> = {
  line: T.lineStrong,
  accent: T.accent,
  green: T.green,
  red: T.red,
  muted: T.line,
};
const FILL: Record<Tone, string> = {
  line: T.fill,
  accent: T.accentFill,
  green: T.greenFill,
  red: T.redFill,
  muted: "transparent",
};
const INK: Record<Tone, string> = {
  line: T.ink,
  accent: "#fff3ea",
  green: T.green,
  red: T.red,
  muted: T.muted,
};

const IdCtx = createContext("d");
/** Unique id prefix for markers and clip paths inside the current diagram. */
export const useDiagramId = () => useContext(IdCtx);

const CSS = `
.rd-flow{stroke-dasharray:5 7;animation:rd-dash 1.6s linear infinite}
.rd-pulse{animation:rd-pulse 2.4s ease-in-out infinite}
@keyframes rd-dash{to{stroke-dashoffset:-24}}
@keyframes rd-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@media (prefers-reduced-motion: reduce){.rd-flow,.rd-pulse{animation:none}}
`;

/**
 * An inline SVG diagram, 420 units wide, scaling to its container.
 * Marker ids are scoped per instance.
 */
export function Diagram({
  title,
  height,
  children,
  caption,
  width = 420,
  maxWidth = 460,
}: {
  title: string;
  height: number;
  children: ReactNode;
  caption?: string;
  width?: number;
  maxWidth?: number;
}) {
  const id = "d" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const marker = (name: string, color: string) => (
    <marker
      id={`${id}-${name}`}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path d="M0 1 L9 5 L0 9 z" fill={color} />
    </marker>
  );
  return (
    <figure className="m-0 flex w-full flex-col gap-2" style={{ maxWidth }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={title}
        className="block h-auto overflow-visible"
        fontFamily={MONO}
      >
        <style>{CSS}</style>
        <defs>
          {marker("line", T.lineStrong)}
          {marker("accent", T.accent)}
          {marker("green", T.green)}
          {marker("red", T.red)}
          {marker("muted", T.line)}
        </defs>
        <IdCtx.Provider value={id}>{children}</IdCtx.Provider>
      </svg>
      {caption && (
        <figcaption className="text-[13px] leading-[1.5] text-[#8b837b]">{caption}</figcaption>
      )}
    </figure>
  );
}

/** A labelled box. `x`,`y` are the top-left corner. */
export function Box({
  x,
  y,
  w,
  h = 36,
  label,
  sub,
  tone = "line",
  dashed,
  strike,
  size = 12,
  className,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  sub?: string;
  tone?: Tone;
  dashed?: boolean;
  strike?: boolean;
  size?: number;
  className?: string;
}) {
  const cx = x + w / 2;
  const ly = sub ? y + h / 2 - 3 : y + h / 2 + size * 0.36;
  return (
    <g className={className}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={FILL[tone]}
        stroke={STROKE[tone]}
        strokeWidth={1}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      <text
        x={cx}
        y={ly}
        textAnchor="middle"
        fontSize={size}
        fill={INK[tone]}
        textDecoration={strike ? "line-through" : undefined}
      >
        {label}
      </text>
      {sub && (
        <text x={cx} y={y + h / 2 + 11} textAnchor="middle" fontSize={9.5} fill={T.muted}>
          {sub}
        </text>
      )}
    </g>
  );
}

/** An arrow along a path, or a straight segment from `from` to `to`. */
export function Arrow({
  from,
  to,
  d,
  tone = "line",
  dashed,
  flow,
  head = true,
}: {
  from?: [number, number];
  to?: [number, number];
  d?: string;
  tone?: Tone;
  dashed?: boolean;
  flow?: boolean;
  head?: boolean;
}) {
  const id = useDiagramId();
  const path = d ?? `M${from![0]} ${from![1]} L${to![0]} ${to![1]}`;
  return (
    <path
      d={path}
      fill="none"
      stroke={STROKE[tone]}
      strokeWidth={1.2}
      strokeDasharray={dashed ? "4 4" : undefined}
      className={flow ? "rd-flow" : undefined}
      markerEnd={head ? `url(#${id}-${tone})` : undefined}
    />
  );
}

/** Plain text. */
export function Label({
  x,
  y,
  children,
  anchor = "middle",
  tone = "muted",
  size = 10,
  weight,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  tone?: Tone | "ink" | "amber";
  size?: number;
  weight?: number;
}) {
  const fill =
    tone === "ink" ? T.ink : tone === "amber" ? T.amber : tone === "muted" ? T.muted : INK[tone];
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} fontWeight={weight}>
      {children}
    </text>
  );
}
