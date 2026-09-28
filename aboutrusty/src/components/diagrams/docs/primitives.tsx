import { useId, type ReactNode } from "react";

/** Shared SVG pieces for the Docs diagrams, drawn in the site's tokens. */

export const INK = "#f7ece4";
export const BODY = "#cfc3b8";
export const MUTED = "#a39a91";
export const ACCENT = "#f0862b";
export const LINE = "rgba(236,150,96,.34)";
export const FILL = "rgba(255,236,214,.035)";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "'Outfit', ui-sans-serif, system-ui, sans-serif";

export function Frame({
  viewBox,
  label,
  children,
}: {
  viewBox: string;
  label: string;
  children: (marker: string, markerAccent: string) => ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const marker = `arrow-${id}`;
  const markerAccent = `arrow-a-${id}`;
  return (
    <figure
      className="m-0 overflow-hidden rounded-[11px] border px-3 py-4 sm:px-5"
      style={{ borderColor: "rgba(236,150,96,.14)", background: "rgba(255,236,214,.02)" }}
    >
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={label}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <defs>
          {[
            [marker, LINE],
            [markerAccent, ACCENT],
          ].map(([mid, color]) => (
            <marker
              key={mid}
              id={mid}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={color} />
            </marker>
          ))}
        </defs>
        {children(marker, markerAccent)}
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

export function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  sub2,
  accent,
  dashed,
  align = "middle",
  titleSize = 16,
}: {
  titleSize?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  sub2?: string;
  accent?: boolean;
  dashed?: boolean;
  align?: "middle" | "start";
}) {
  const tx = align === "middle" ? x + w / 2 : x + 14;
  const lines = [sub, sub2].filter(Boolean) as string[];
  const titleY = y + h / 2 - (lines.length * 17) / 2 + 5;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={accent ? "rgba(240,134,43,.09)" : FILL}
        stroke={accent ? ACCENT : LINE}
        strokeWidth={1.2}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <Text x={tx} y={titleY} size={titleSize} anchor={align} color={INK}>
        {title}
      </Text>
      {lines.map((line, i) => (
        <Text key={i} x={tx} y={titleY + 19 + i * 17} size={12.5} anchor={align} mono color={MUTED}>
          {line}
        </Text>
      ))}
    </g>
  );
}

export function Text({
  x,
  y,
  children,
  size = 13,
  anchor = "middle",
  mono,
  color = BODY,
  weight,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  anchor?: "start" | "middle" | "end";
  mono?: boolean;
  color?: string;
  weight?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      fill={color}
      fontFamily={mono ? MONO : SANS}
      fontWeight={weight ?? (mono ? 400 : 300)}
    >
      {children}
    </text>
  );
}

export function Arrow({
  d,
  marker,
  dashed,
  accent,
  both,
}: {
  d: string;
  marker: string;
  dashed?: boolean;
  accent?: boolean;
  both?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={accent ? ACCENT : LINE}
      strokeWidth={1.4}
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={`url(#${marker})`}
      markerStart={both ? `url(#${marker})` : undefined}
    />
  );
}
