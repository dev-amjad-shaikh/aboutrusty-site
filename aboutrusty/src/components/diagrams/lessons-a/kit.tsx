import type { ReactNode } from "react";
import { D } from "../tokens";

/** A row of mutually exclusive choices, styled like the routing diagram's chips. */
export function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className="cursor-pointer rounded-lg border px-2.5 py-1.5 font-code text-[12px] transition-colors"
            style={{
              borderColor: on ? "rgba(240,134,43,.6)" : "rgba(236,150,96,.2)",
              background: on ? "rgba(240,134,43,.14)" : "transparent",
              color: on ? "#ffe2cb" : "#b8b0a8",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A small uppercase label above a panel. */
export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 font-code text-[10.5px] uppercase tracking-[0.1em] text-[#6f675f]">{children}</div>;
}

/** Compact one-line JSON: `{"a": 1, "b": [2]}`. */
export function json(v: unknown): string {
  if (v === undefined) return "(unset)";
  if (Array.isArray(v)) return `[${v.map(json).join(", ")}]`;
  if (v && typeof v === "object") {
    return `{${Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => `${JSON.stringify(k)}: ${json(x)}`)
      .join(", ")}}`;
  }
  return JSON.stringify(v);
}

/** A monospace value box that wraps instead of scrolling the page. */
export function Mono({
  children,
  tone,
  dim,
}: {
  children: ReactNode;
  tone?: "green" | "red" | "amber" | "accent";
  dim?: boolean;
}) {
  const color =
    tone === "green" ? D.green : tone === "red" ? D.red : tone === "amber" ? D.amber : tone === "accent" ? D.accentSoft : D.ink;
  const border =
    tone === "red" ? "rgba(224,106,74,.4)" : tone === "green" ? "rgba(159,212,168,.3)" : "rgba(236,150,96,.14)";
  const bg = tone === "red" ? "rgba(224,106,74,.08)" : "#0d0908";
  return (
    <div
      className="whitespace-pre-wrap rounded-lg border px-3 py-2 font-code text-[12px] leading-[1.6]"
      style={{ borderColor: border, background: bg, color, opacity: dim ? 0.45 : 1, overflowWrap: "anywhere" }}
    >
      {children}
    </div>
  );
}
