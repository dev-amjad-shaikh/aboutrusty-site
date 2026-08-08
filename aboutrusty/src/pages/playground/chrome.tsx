import type { ReactNode } from "react";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type DotTone = "muted" | "success" | "warning" | "rust";

const DOT_STYLES: Record<DotTone, string> = {
  muted: "bg-muted-foreground/40",
  // Glow alphas can't come from tokens — rust/signal rgba only, per theme rules.
  success: "bg-success shadow-[0_0_9px_rgba(146,231,192,0.42)]",
  warning: "bg-warning",
  rust: "bg-primary shadow-[0_0_9px_rgba(255,107,53,0.5)]",
};

/**
 * One-time keyframes for the recorder-style breathing status dot. Rendered
 * once at the top of the playground page (the app shell has no global
 * status-breathe keyframe, and this directory owns the playground chrome).
 */
export function ChromeStyles() {
  return (
    <style>{`
      @keyframes status-breathe { 50% { opacity: .45; } }
      .status-breathe { animation: status-breathe 2.8s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .status-breathe { animation: none; }
      }
    `}</style>
  );
}

/** The recorder-panel recording/status dot — 6px, round, optional breathe. */
export function StatusDot({
  tone = "muted",
  pulse = false,
}: {
  tone?: DotTone;
  pulse?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${DOT_STYLES[tone]} ${
        pulse ? "status-breathe" : ""
      }`}
    />
  );
}

/**
 * Instrument-panel card header: mono uppercase micro-label + status dot, an
 * optional right-hand slot (badges, counters), and the kept description copy.
 */
export function InstrumentHeader({
  label,
  description,
  tone = "muted",
  pulse = false,
  right,
  className = "",
}: {
  label: ReactNode;
  description?: ReactNode;
  tone?: DotTone;
  pulse?: boolean;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <CardHeader
      className={`gap-2 border-b border-border/60 pb-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <StatusDot tone={tone} pulse={pulse} />
          {label}
        </CardTitle>
        {right}
      </div>
      {description ? (
        <CardDescription className="text-xs leading-relaxed">
          {description}
        </CardDescription>
      ) : null}
    </CardHeader>
  );
}
