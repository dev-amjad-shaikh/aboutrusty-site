import { useEffect, useState } from "react";
import { Gauge, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { PHASES, type Phase, type ThreadStatus } from "./engine";
import { InstrumentHeader, type DotTone } from "./chrome";

interface TransportControlsProps {
  status: ThreadStatus;
  step: number;
  phase: Phase | null;
  speed: 1 | 2;
  canRun: boolean;
  canStep: boolean;
  /** True while the driver is mid super-step (mode !== "idle"). */
  busy: boolean;
  /** False until the first run/step — the Run button pulses to invite it. */
  hasRun: boolean;
  /** Bumped when a keyboard Run/Step no-ops — flashes the status badge. */
  flashSignal: number;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeed: (s: 1 | 2) => void;
}

const STATUS_STYLES: Record<ThreadStatus, string> = {
  idle: "border-border bg-secondary/60 font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
  running:
    "border-success/40 bg-success/10 font-code text-[10px] uppercase tracking-[0.14em] text-success",
  paused:
    "border-primary/40 bg-accent/20 font-code text-[10px] uppercase tracking-[0.14em] text-accent-foreground",
  interrupted:
    "border-warning/40 bg-warning/10 font-code text-[10px] uppercase tracking-[0.14em] text-warning",
  done: "border-success/40 bg-success/10 font-code text-[10px] uppercase tracking-[0.14em] text-success",
};

const STATUS_DOT: Record<ThreadStatus, DotTone> = {
  idle: "muted",
  running: "success",
  paused: "rust",
  interrupted: "warning",
  done: "success",
};

/**
 * Run / Pause / Step / Reset + speed, with the six-beat super-step loop
 * (plan → parallel → barrier → merge → route → checkpoint) lighting up as
 * each phase passes. The barrier makes the whole step transactional.
 */
export function TransportControls({
  status,
  step,
  phase,
  speed,
  canRun,
  canStep,
  busy,
  hasRun,
  flashSignal,
  onRun,
  onPause,
  onStep,
  onReset,
  onSpeed,
}: TransportControlsProps) {
  const running = status === "running";
  const phaseIdx = phase ? PHASES.indexOf(phase) : -1;

  // Transient ring on the status badge when a keyboard shortcut no-ops.
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (flashSignal === 0) return;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 400);
    return () => clearTimeout(timer);
  }, [flashSignal]);

  // Why the primary action is dead — shown inline, since a disabled button
  // can't rely on hover (and touch devices have no hover at all).
  const disabledReason =
    status === "interrupted"
      ? "interrupted — resume from the panel above"
      : status === "done"
        ? "run finished — Reset to replay, or fork a checkpoint"
        : busy
          ? "working — wait for the current super-step to commit"
          : null;

  // The idle caption answers "what now?" per status instead of lying.
  const idleCaption =
    status === "done"
      ? "run complete — Reset to replay, or open the Checkpoints tab and fork a boundary"
      : status === "interrupted"
        ? "parked at an interrupt — answer in the panel above"
        : status === "paused"
          ? "paused — Run continues, Step advances one super-step"
          : `super-step ${step} — press Run or Step`;

  return (
    <Card className="gap-0 rounded-lg py-0">
      <InstrumentHeader
        label="Transport"
        description="One super-step = plan → parallel → barrier → merge → route → checkpoint. Transactional as a whole."
        tone={STATUS_DOT[status]}
        pulse={running}
        right={
          <Badge
            variant="outline"
            className={`${STATUS_STYLES[status]} transition-shadow ${
              flash ? "ring-2 ring-warning/60" : ""
            }`}
          >
            {status}
          </Badge>
        }
      />
      <CardContent className="space-y-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {running ? (
            <Button size="sm" variant="secondary" onClick={onPause}>
              <Pause size={14} className="mr-1.5" />
              Pause
              <Kbd className="ml-2">R</Kbd>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onRun}
              disabled={!canRun}
              title={
                canRun
                  ? "Run super-steps until you pause, interrupt, or finish"
                  : (disabledReason ?? undefined)
              }
              className={
                !hasRun && canRun
                  ? "animate-pulse ring-2 ring-primary/40"
                  : undefined
              }
            >
              <Play size={14} className="mr-1.5" />
              Run
              <Kbd className="ml-2">R</Kbd>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onStep}
            disabled={!canStep}
            title={
              canStep
                ? "Advance exactly one super-step"
                : (disabledReason ?? undefined)
            }
          >
            <StepForward size={14} className="mr-1.5" />
            Step
            <Kbd className="ml-2">S</Kbd>
          </Button>
          <Button size="sm" variant="ghost" onClick={onReset}>
            <RotateCcw size={14} className="mr-1.5" />
            Reset
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Gauge size={14} className="text-muted-foreground" />
            <div
              role="group"
              aria-label="Playback speed"
              className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/40 p-0.5"
            >
              {([1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={speed === s}
                  onClick={() => onSpeed(s)}
                  className={`rounded-sm px-2 py-1 font-code text-[10px] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    speed === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {!canRun && disabledReason && (
          <p className="font-code text-[11px] text-muted-foreground">
            {disabledReason}
          </p>
        )}

        <div className="h-px bg-border/70" aria-hidden="true" />

        {/* Below lg the strip stays on screen while busy, so phases remain
            visible while the event log / state scroll underneath. */}
        <div
          aria-label="Super-step phases"
          className={`space-y-2 ${
            busy
              ? "sticky top-14 z-10 -mx-2 rounded-md border border-border/60 bg-background/95 px-2 py-2 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none"
              : ""
          }`}
        >
          <div className="flex flex-wrap items-center gap-y-1.5">
            {PHASES.map((p, i) => {
              const isCurrent = i === phaseIdx;
              const isPast = phaseIdx > i;
              return (
                <span key={p} className="flex items-center">
                  <span
                    className={`rounded-md border px-2 py-1 font-code text-[10px] uppercase tracking-[0.08em] transition-colors ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_16px_rgba(240,134,43,0.25)]"
                        : isPast
                          ? "border-transparent text-muted-foreground/50 line-through decoration-muted-foreground/40"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {p}
                  </span>
                  {i < PHASES.length - 1 && (
                    <span className="mx-1 text-[10px] text-muted-foreground/60">→</span>
                  )}
                </span>
              );
            })}
          </div>
          <p className="font-code text-[11px] text-muted-foreground">
            {phase
              ? phase === "parallel"
                ? "nodes run on immutable snapshots — they cannot see each other's writes"
                : phase === "barrier"
                  ? "all-or-nothing: writes become visible only here"
                  : phase === "merge"
                    ? "reducers merge partial updates into the channels"
                    : phase === "route"
                      ? "static edges, Command::goto, or Route decide the next active set"
                      : phase === "checkpoint"
                        ? "a versioned checkpoint is persisted at the step boundary"
                        : "the executor plans the active set for this super-step"
              : idleCaption}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
