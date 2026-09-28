import { useEffect, useRef, useState, type RefObject } from "react";

/** Diagram palette, taken from the site design tokens. */
export const D = {
  hair: "rgba(236,150,96,.16)",
  line: "rgba(236,150,96,.3)",
  strong: "rgba(236,150,96,.45)",
  accent: "#f0862b",
  accentSoft: "#ffc7a6",
  green: "#9fd4a8",
  red: "#f09a80",
  amber: "#f5b774",
  ink: "#f7ece4",
  body: "#cfc3b8",
  muted: "#8b837b",
  dim: "#6f675f",
  panel: "#110c0a",
  card: "rgba(255,236,214,.03)",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
} as const;

export type Tone = "accent" | "green" | "red" | "amber" | "plain";

export function toneColor(tone: Tone | undefined): string {
  switch (tone) {
    case "green":
      return D.green;
    case "red":
      return D.red;
    case "amber":
      return D.amber;
    case "plain":
      return D.body;
    default:
      return D.accent;
  }
}

/** Width of an element in CSS pixels, tracked with a ResizeObserver. SVGs
 * render at this width so labels stay at a readable pixel size on phones. */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback = 640): number {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // The observer reports the initial size on observe, then every change.
    const ro = new ResizeObserver(() => setW(el.clientWidth || fallback));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback]);
  return w;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Step state for diagrams the reader walks through. */
export function useStepper(count: number, autoMs = 2200) {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((s) => (s >= count - 1 ? 0 : s + 1)), autoMs);
    return () => clearInterval(t);
  }, [auto, count, autoMs]);
  const cur = Math.min(step, count - 1);
  return {
    step: cur,
    setStep,
    auto,
    setAuto,
    next: () => setStep((s) => (s >= count - 1 ? 0 : s + 1)),
    back: () => setStep((s) => Math.max(0, s - 1)),
    atEnd: cur >= count - 1,
  };
}

export function useDiagramWidth(fallback = 640) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref, fallback);
  return { ref, width };
}
