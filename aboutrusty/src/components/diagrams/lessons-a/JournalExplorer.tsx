import { useMemo, useState } from "react";
import { DiagramFrame, StepControls, Toggle } from "../primitives";
import { sha256, toHex } from "../sha256";
import { D, useStepper } from "../tokens";
import { Label, Mono } from "./kit";

const RUN = "run-demo";

type Ev = {
  kind: string;
  node?: string;
  effect: string;
  parent?: number;
  note: string;
};

/* The journal of a two-turn ReAct run (agent → tools → agent) with a
 * checkpointer and a recording journal attached. Kinds, effects, and causal
 * parents follow execute_super_step in rusty-core/src/executor.rs. */
const EVENTS: Ev[] = [
  { kind: "super_step_start", effect: "pure", note: "step 0, active [agent]" },
  { kind: "node_input", node: "agent", effect: "pure", parent: 0, note: "the agent's state snapshot" },
  { kind: "model_call", node: "agent", effect: "non_idempotent", parent: 1, note: "reply asks for echo(\"hi\")" },
  { kind: "node_output", node: "agent", effect: "pure", parent: 1, note: "append the assistant message" },
  { kind: "super_step_end", effect: "pure", parent: 3, note: "merged messages" },
  { kind: "routing_decision", effect: "pure", parent: 4, note: "next [tools]" },
  { kind: "checkpoint_written", effect: "idempotent", parent: 5, note: "step 0" },
  { kind: "super_step_start", effect: "pure", parent: 5, note: "step 1, active [tools]" },
  { kind: "node_input", node: "tools", effect: "pure", parent: 7, note: "pending tool call" },
  { kind: "tool_call", node: "tools", effect: "non_idempotent", parent: 8, note: "echo → \"hi\"" },
  { kind: "node_output", node: "tools", effect: "pure", parent: 8, note: "append the tool message" },
  { kind: "super_step_end", effect: "pure", parent: 10, note: "merged messages" },
  { kind: "routing_decision", effect: "pure", parent: 11, note: "next [agent]" },
  { kind: "checkpoint_written", effect: "idempotent", parent: 12, note: "step 1" },
  { kind: "super_step_start", effect: "pure", parent: 12, note: "step 2, active [agent]" },
  { kind: "node_input", node: "agent", effect: "pure", parent: 14, note: "the agent's state snapshot" },
  { kind: "model_call", node: "agent", effect: "non_idempotent", parent: 15, note: "final answer" },
  { kind: "node_output", node: "agent", effect: "pure", parent: 15, note: "append the answer" },
  { kind: "super_step_end", effect: "pure", parent: 17, note: "merged messages" },
  { kind: "routing_decision", effect: "pure", parent: 18, note: "next [] → Done" },
  { kind: "checkpoint_written", effect: "idempotent", parent: 19, note: "step 2" },
];

const TAMPER_AT = 9;

/** The fields this demo hashes, in RunEvent's declared field order. */
function eventJson(e: Ev, seq: number, tampered: boolean): string {
  return JSON.stringify({
    id: `${RUN}:${seq}`,
    run_id: RUN,
    node_id: e.node ?? null,
    seq,
    kind: e.kind,
    effect: e.effect,
    output: tampered ? "echo → \"bye\"" : e.note,
    parent: e.parent === undefined ? null : `${RUN}:${e.parent}`,
  });
}

function chain(tampered: boolean): string[] {
  const heads = [toHex(sha256(""))];
  EVENTS.forEach((e, i) => {
    heads.push(toHex(sha256(heads[i] + eventJson(e, i, tampered && i === TAMPER_AT))));
  });
  return heads; // heads[n + 1] is the head after seq n
}

const short = (h: string) => `${h.slice(0, 12)}…`;

const KIND_COLOR: Record<string, string> = {
  model_call: D.accentSoft,
  tool_call: D.accentSoft,
  checkpoint_written: D.green,
  routing_decision: D.amber,
};

/** A live journal: record events one by one, select one to see its causal parents and the head hash. */
export function JournalExplorer() {
  const stepper = useStepper(EVENTS.length, 1100);
  const recorded = stepper.step + 1;
  const [picked, setPicked] = useState<number | null>(null);
  const [tamper, setTamper] = useState(false);
  const sel = picked !== null && picked < recorded ? picked : recorded - 1;

  const honest = useMemo(() => chain(false), []);
  const edited = useMemo(() => chain(true), []);

  const ancestors = new Set<number>();
  for (let p = EVENTS[sel].parent; p !== undefined; p = EVENTS[p].parent) ancestors.add(p);

  const e = EVENTS[sel];
  const tamperedHere = tamper && recorded > TAMPER_AT;
  const heads = tamperedHere ? edited : honest;
  const claimed = honest[recorded];
  const recomputed = heads[recorded];

  const caption = tamperedHere
    ? {
        title: "Someone edited seq 9 after the fact",
        text: "Every head from seq 9 on changes, so the recomputed head no longer matches the one the journal stored. Journal::from_snapshot refuses to load it, and the server re-runs that check before serving GET /runs/{id}/events.",
      }
    : {
        title: `${RUN}:${sel} · ${e.kind}`,
        text:
          e.parent === undefined
            ? "The first event of the run has no causal parent."
            : `Its parent is ${RUN}:${e.parent}. Following parents back gives ${ancestors.size} ancestor${ancestors.size === 1 ? "" : "s"}, highlighted in the list: why this event happened, not only when.`,
      };

  return (
    <DiagramFrame
      label="Run journal · recorded as the run executes"
      caption={caption}
      captionTone={tamperedHere ? "bad" : "plain"}
      controls={
        <StepControls stepper={stepper} count={EVENTS.length} nextLabel="Record next">
          <Toggle on={tamper} onClick={() => setTamper(!tamper)}>
            Edit seq 9 after the fact
          </Toggle>
        </StepControls>
      }
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Label>Events · tap one to select it</Label>
          <div className="flex flex-col font-code text-[12px]" role="listbox" aria-label="Journal events">
            {EVENTS.slice(0, recorded).map((ev, i) => {
              const isSel = i === sel;
              const isAnc = ancestors.has(i);
              const bad = tamperedHere && i === TAMPER_AT;
              return (
                <button
                  key={i}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => setPicked(i)}
                  className="grid cursor-pointer grid-cols-[22px_minmax(0,1fr)_auto] items-baseline gap-x-2 border-t px-1.5 py-1 text-left"
                  style={{
                    borderColor: "rgba(236,150,96,.08)",
                    background: isSel ? "rgba(240,134,43,.16)" : isAnc ? "rgba(240,134,43,.06)" : "transparent",
                    boxShadow: isSel ? `inset 2px 0 0 ${D.accent}` : isAnc ? `inset 2px 0 0 rgba(240,134,43,.4)` : undefined,
                  }}
                >
                  <span style={{ color: D.dim }}>{i}</span>
                  <span className="min-w-0 truncate">
                    <span style={{ color: bad ? D.red : KIND_COLOR[ev.kind] ?? D.ink }}>{ev.kind}</span>
                    {ev.node && <span style={{ color: D.muted }}> · {ev.node}</span>}
                  </span>
                  <span style={{ color: isAnc ? D.accentSoft : D.dim }}>
                    {ev.parent === undefined ? "root" : `← ${ev.parent}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <Label>Selected event</Label>
            <Mono>
              {[
                `id:      "${RUN}:${sel}"`,
                `seq:     ${sel}`,
                `kind:    ${e.kind}`,
                `node_id: ${e.node ? `"${e.node}"` : "null"}`,
                `effect:  ${e.effect}`,
                `parent:  ${e.parent === undefined ? "null" : `"${RUN}:${e.parent}"`}`,
                `output:  ${tamper && sel === TAMPER_AT ? "echo → \"bye\"" : e.note}`,
              ].join("\n")}
            </Mono>
            {e.kind === "checkpoint_written" && (
              <p className="mb-0 mt-2 text-[13px] leading-[1.55] text-[#a39a91]">
                The checkpoint was minted just before this event, so its journal_ref is{" "}
                <span className="font-code" style={{ color: D.green }}>
                  {`{events: ${sel}, sha256: ${short(honest[sel])}}`}
                </span>
                , the head after seq {sel - 1}.
              </p>
            )}
          </div>
          <div>
            <Label>Head hash after seq {sel}</Label>
            <Mono tone="accent">
              {`previous: ${short(heads[sel])}${sel === 0 ? '  (sha256 of "")' : ""}\nnew head: sha256(previous ‖ event ${sel})\n        = ${short(heads[sel + 1])}`}
            </Mono>
          </div>
          <div>
            <Label>Journal head · {recorded} events</Label>
            <Mono tone={tamperedHere ? "red" : "green"}>
              {tamperedHere
                ? `stored:     ${short(claimed)}\nrecomputed: ${short(recomputed)}\n→ head hash mismatch, load refused`
                : `${short(recomputed)}\nrecomputes to the stored head ✓`}
            </Mono>
          </div>
        </div>
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">
        Hashes are real SHA-256, computed in your browser over a trimmed event. Real events carry more fields (thread_id,
        input, latency, tokens, status, recorded_at), so real heads differ.
      </p>
    </DiagramFrame>
  );
}
