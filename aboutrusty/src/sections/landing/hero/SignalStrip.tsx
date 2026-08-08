type SignalTone = "primary" | "success" | "muted";

interface SignalItem {
  tone: SignalTone;
  label: string;
}

const SIGNALS: SignalItem[] = [
  { tone: "primary", label: "plan / ready_nodes_02" },
  { tone: "muted", label: "parallel / immutable_snapshot" },
  { tone: "success", label: "barrier / all_nodes_complete" },
  { tone: "muted", label: "merge / reducers_applied" },
  { tone: "primary", label: "checkpoint / version_04" },
];

const dotClass: Record<SignalTone, string> = {
  primary: "bg-primary shadow-[0_0_10px_hsl(var(--primary)/.6)]",
  success: "bg-success",
  muted: "bg-muted-foreground/50",
};

/**
 * Mono ticker strip from the reference — five runtime signals with dot
 * indicators and a staggered `signal-step` pulse (8s cycle, 1.6s offsets).
 * The reference's blue barrier dot becomes signal green here.
 */
export function SignalStrip() {
  return (
    <section
      aria-label="Runtime activity"
      className="flex h-[43px] items-center overflow-hidden border-y border-border bg-card max-sm:overflow-x-auto max-sm:[scrollbar-width:none]"
    >
      <style>{`
        @keyframes signal-step {
          0%, 18% { color: hsl(var(--foreground) / .82); background: rgba(255, 255, 255, .025); }
          28%, 100% { color: hsl(var(--muted-foreground)); background: transparent; }
        }
      `}</style>
      <div className="grid w-full grid-cols-5 max-sm:flex max-sm:w-max">
        {SIGNALS.map((signal, index) => (
          <span
            key={signal.label}
            style={{ animationDelay: `${(index * 1.6).toFixed(1)}s` }}
            className="flex min-w-0 items-center justify-center whitespace-nowrap border-r border-border px-[18px] font-code text-[10px] tracking-[.04em] text-muted-foreground animate-[signal-step_8s_ease-in-out_infinite] motion-reduce:animate-none max-sm:min-w-[190px]"
          >
            <i
              aria-hidden="true"
              className={`mr-[9px] inline-block h-[5px] w-[5px] shrink-0 rounded-full ${dotClass[signal.tone]}`}
            />
            {signal.label}
          </span>
        ))}
      </div>
    </section>
  );
}
