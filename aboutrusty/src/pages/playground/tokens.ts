import type { ThreadStatus } from "./engine";

/** Site palette (the same values the Home "Anatomy of a run" section uses). */
export const C = {
  line: "rgba(236,150,96,.22)",
  faint: "rgba(236,150,96,.12)",
  accent: "#f0862b",
  soft: "#ffc7a6",
  green: "#9fd4a8",
  amber: "#f5b774",
  red: "#f09a80",
  ink: "#f7ece4",
  body: "#cfc3b8",
  muted: "#a39a91",
  dim: "#8b837b",
};

export const STATUS_COLOR: Record<ThreadStatus, string> = {
  ready: C.dim,
  running: C.accent,
  interrupted: C.amber,
  done: C.green,
  error: C.red,
};
