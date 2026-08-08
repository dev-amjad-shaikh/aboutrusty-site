import type { ReactNode } from "react";
import { Braces } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ChannelState, Checkpoint, ScenarioDef } from "./engine";

interface StateInspectorProps {
  def: ScenarioDef;
  /** Currently inspected checkpoint, or null for live state. */
  checkpoint: Checkpoint | null;
  liveState: ChannelState;
  hasRun: boolean;
}

// Tiny JSON tokenizer — keys in rust-soft, strings in signal green, numbers in
// amber, booleans/null muted. Deliberately regex-simple; payloads are engine
// JSON, so no edge cases beyond strings/numbers/literals.
const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function JsonValue({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2);
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(json)) !== null) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1] !== undefined) {
      // A string — a key when immediately followed by a colon.
      out.push(
        <span key={k++} className={m[2] ? "text-accent-foreground" : "text-success"}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else if (m[0] === "true" || m[0] === "false" || m[0] === "null") {
      out.push(
        <span key={k++} className="text-muted-foreground">
          {m[0]}
        </span>,
      );
    } else {
      out.push(
        <span key={k++} className="text-warning">
          {m[0]}
        </span>,
      );
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < json.length) out.push(json.slice(last));
  return <>{out}</>;
}

/**
 * Pretty JSON of the state channels. The messages channel (AddMessages
 * reducer) is highlighted — the ID-aware upsert that makes replay safe.
 */
export function StateInspector({ def, checkpoint, liveState, hasRun }: StateInspectorProps) {
  const state = checkpoint ? checkpoint.state : liveState;

  // Before the first run the scenario may already carry a seeded input (the
  // ReAct scenario's scripted user message) — surface it with an "input seed"
  // badge as the reason to press Run, instead of hiding it behind an empty state.
  const hasSeed =
    !hasRun &&
    !checkpoint &&
    def.channels.some((ch) => liveState[ch.name] !== undefined);

  if (!hasRun && !checkpoint && !hasSeed) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
        <Braces size={22} className="text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No state yet — press Run or Step to populate the channels.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {checkpoint
            ? `state @ ${checkpoint.checkpoint_id} · step ${checkpoint.step}`
            : hasSeed
              ? "seeded input — press Run to watch reducers grow it"
              : "live state"}
        </p>
        {checkpoint ? (
          <Badge variant="outline" className="font-code text-[10px]">
            snapshot
          </Badge>
        ) : hasSeed ? (
          <Badge variant="outline" className="font-code text-[10px]">
            input seed
          </Badge>
        ) : null}
      </div>
      {def.channels.map((ch) => {
        const value = state[ch.name];
        const isMessages = ch.name === "messages";
        return (
          <div
            key={ch.name}
            className={`rounded-lg border p-3 ${
              isMessages
                ? "border-primary/40 bg-accent/10"
                : "border-border bg-secondary/60"
            }`}
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="font-code text-xs font-semibold">{ch.name}</span>
              <Badge
                variant={isMessages ? "default" : "secondary"}
                className="font-code text-[10px]"
              >
                {ch.reducer}
              </Badge>
              {isMessages && (
                <span className="text-[10px] text-muted-foreground">
                  ID-aware upsert — replay never duplicates a message
                </span>
              )}
            </div>
            <pre className="bg-code max-h-64 overflow-auto rounded-md border border-white/10 p-3 font-code text-[11px] leading-relaxed">
              {value === undefined ? "—" : <JsonValue value={value} />}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
