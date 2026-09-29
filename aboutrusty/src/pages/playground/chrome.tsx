import type { ReactNode } from "react";
import { C } from "./tokens";

/** Mono uppercase label used above every panel. */
export function Label({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 font-code text-[10.5px] uppercase tracking-[0.14em] text-[#8b837b]">{children}</span>
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </div>
  );
}

/** Hairline panel. */
export function Panel({ children, className = "", tone }: { children: ReactNode; className?: string; tone?: string }) {
  return (
    <div
      className={`min-w-0 rounded-xl border ${className}`}
      style={{ borderColor: tone ? `${tone}66` : C.faint, background: tone ? `${tone}0d` : "rgba(255,236,214,.02)" }}
    >
      {children}
    </div>
  );
}

export function Dot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${pulse ? "pg-breathe" : ""}`}
      style={{ background: color, boxShadow: `0 0 10px ${color}` }}
    />
  );
}

/** Buttons in the console's control row. */
export function Btn({
  children,
  onClick,
  disabled,
  primary,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`cursor-pointer rounded-lg border px-3.5 py-2 text-[14px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "border-transparent bg-primary font-medium text-primary-foreground hover:bg-[#fb9a3f]"
          : "bg-transparent text-[#f7ece4] hover:border-[rgba(236,150,96,.5)]"
      }`}
      style={primary ? undefined : { borderColor: "rgba(236,150,96,.3)" }}
    >
      {children}
    </button>
  );
}

/** Pretty JSON with the site's code colors. */
export function Json({ value, indent = 2 }: { value: unknown; indent?: number }) {
  if (value === undefined) return <span style={{ color: C.dim }}>unset</span>;
  const json = JSON.stringify(value, null, indent);
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  const TOKEN_RE = /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  while ((m = TOKEN_RE.exec(json)) !== null) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <span key={k++} style={{ color: m[2] ? C.soft : C.green }}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else {
      out.push(
        <span key={k++} style={{ color: /^[tfn]/.test(m[0]) ? C.dim : C.amber }}>
          {m[0]}
        </span>,
      );
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < json.length) out.push(json.slice(last));
  return <>{out}</>;
}

/** One-time keyframes for the page. */
export function PlaygroundStyles() {
  return (
    <style>{`
      @keyframes pgBreathe { 50% { opacity: .4; } }
      .pg-breathe { animation: pgBreathe 1.6s ease-in-out infinite; }
      @keyframes pgPulse { 0% { opacity: .7; } 100% { opacity: 0; transform: scale(1.25); } }
      .pg-pulse { transform-box: fill-box; transform-origin: center; animation: pgPulse 1.4s ease-out infinite; }
      @media (prefers-reduced-motion: reduce) { .pg-breathe, .pg-pulse { animation: none; } }
    `}</style>
  );
}
