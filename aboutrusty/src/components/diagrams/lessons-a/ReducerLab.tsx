import { useState } from "react";
import { DiagramFrame, Toggle } from "../primitives";
import { D } from "../tokens";
import { Choices, Label, Mono, json } from "./kit";

/* A faithful TypeScript port of Reducer::apply and the validation loop in
 * StateSpec::apply_super_step (rusty-core/src/state.rs), including the exact
 * InvalidUpdate message formats. */

type R = "overwrite" | "append" | "deep_merge" | "add_messages";
type Json = unknown;

const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);

function typeName(v: Json): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "boolean") return "bool";
  if (typeof v === "object") return "object";
  return typeof v;
}

function deepMerge(a: Json, b: Json): Json {
  if (isObj(a) && isObj(b)) {
    const out: Record<string, Json> = { ...a };
    for (const [k, v] of Object.entries(b)) out[k] = k in a ? deepMerge(a[k], v) : v;
    return out;
  }
  return b;
}

function addMessages(current: Json, update: Json): Json {
  const messages: Json[] = Array.isArray(current) ? [...current] : [];
  const incoming = Array.isArray(update) ? update : [update];
  const idOf = (m: Json) => (isObj(m) && typeof m.id === "string" ? m.id : undefined);
  for (const msg of incoming) {
    const id = idOf(msg);
    const at = id === undefined ? -1 : messages.findIndex((m) => idOf(m) === id);
    if (at >= 0) messages[at] = msg;
    else messages.push(msg);
  }
  return messages;
}

function apply(r: R, current: Json | undefined, update: Json): Json {
  switch (r) {
    case "overwrite":
      return update;
    case "append": {
      const items = Array.isArray(update) ? update : [update];
      return Array.isArray(current) ? [...current, ...items] : items;
    }
    case "deep_merge":
      return current === undefined ? update : deepMerge(current, update);
    case "add_messages":
      return addMessages(current, update);
  }
}

type Write = { node: string; value: Json };
type Result = { ok: true; value: Json; order: string[] } | { ok: false; error: string; order: string[] };

function applySuperStep(r: R, channel: string, current: Json | undefined, writes: Write[]): Result {
  // Sort by node name first: arrival order must not change the result.
  const sorted = [...writes].sort((a, b) => (a.node < b.node ? -1 : a.node > b.node ? 1 : 0));
  const order = sorted.map((w) => w.node);
  let count = 0;
  let first: string | undefined;
  for (const w of sorted) {
    if ((r === "append" || r === "add_messages") && current !== undefined && !Array.isArray(current)) {
      return {
        ok: false,
        order,
        error: `node \`${w.node}\` wrote to channel \`${channel}\` (reducer: ${r}), but the current value is a ${typeName(current)}; the reducer requires an array`,
      };
    }
    count += 1;
    first ??= w.node;
    if (count > 1 && r === "overwrite") {
      return {
        ok: false,
        order,
        error: `channel \`${channel}\` can receive only one value per super-step (reducer: ${r}); already written by node \`${first}\`, second write from node \`${w.node}\`. Use a multi-write reducer (Append/DeepMerge/AddMessages) to handle concurrent writes.`,
      };
    }
  }
  let value = current;
  for (const w of sorted) value = apply(r, value, w.value);
  return { ok: true, value, order };
}

const PRESETS: Record<R, { variant: string; channel: string; current: Json; a: Json; b: Json; note: string }> = {
  overwrite: {
    variant: "Reducer::Overwrite",
    channel: "summary",
    current: "draft",
    a: "short summary",
    b: "long summary",
    note: "The update replaces the value. At most one write per super-step.",
  },
  append: {
    variant: "Reducer::Append",
    channel: "results",
    current: ["r0"],
    a: "from a",
    b: ["b1", "b2"],
    note: "An array update is concatenated; any other value is pushed as one element.",
  },
  deep_merge: {
    variant: "Reducer::DeepMerge",
    channel: "config",
    current: { model: { name: "m1", temp: 0.2 }, tools: ["search"] },
    a: { model: { temp: 0.7 } },
    b: { tools: ["fetch"], limits: { steps: 10 } },
    note: "Objects merge key by key, recursively. Any non-object pair resolves to the update, so arrays are replaced.",
  },
  add_messages: {
    variant: "Reducer::AddMessages",
    channel: "messages",
    current: [
      { id: "m1", role: "user", content: "hi" },
      { id: "m2", role: "assistant", content: "draft" },
    ],
    a: { id: "m2", role: "assistant", content: "final" },
    b: { role: "tool", content: "42" },
    note: "A message whose string id matches an existing one replaces it in place. Messages without a string id are appended.",
  },
};

const OPTIONS: { id: R; label: string }[] = [
  { id: "overwrite", label: "Overwrite" },
  { id: "append", label: "Append" },
  { id: "deep_merge", label: "DeepMerge" },
  { id: "add_messages", label: "AddMessages" },
];

/** Pick a reducer, fire writes from two nodes in one super-step, and watch the merge. */
export function ReducerLab() {
  const [r, setR] = useState<R>("overwrite");
  const [aOn, setA] = useState(true);
  const [bOn, setB] = useState(true);
  const [bFirst, setBFirst] = useState(false);
  const [corrupt, setCorrupt] = useState(false);
  const p = PRESETS[r];
  const arrayReducer = r === "append" || r === "add_messages";
  const current = arrayReducer && corrupt ? { oops: "object" } : p.current;

  const a: Write = { node: "research_a", value: p.a };
  const b: Write = { node: "research_b", value: p.b };
  const arrivals = (bFirst ? [b, a] : [a, b]).filter((w) => (w === a ? aOn : bOn));
  const res = applySuperStep(r, p.channel, current, arrivals);

  const caption = !res.ok
    ? { title: "RustyError::InvalidUpdate. Nothing was merged.", text: "Validation runs over every write before any channel changes, so the state below is exactly the start-of-step state. The executor aborts the step." }
    : arrivals.length === 0
      ? { title: "No writes to this channel", text: "A channel no node wrote keeps its value. Its Arc is still shared with the snapshot, so nothing is copied." }
      : { title: `${p.variant}: merged`, text: `${p.note}${arrivals.length > 1 ? " Writes merge in node-name order, so swapping the finish order gives the same result." : ""}` };

  return (
    <DiagramFrame
      label="Reducer lab · one super-step, one channel"
      caption={caption}
      captionTone={res.ok ? "plain" : "bad"}
      controls={
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "rgba(236,150,96,.10)" }}>
          <Toggle on={!aOn} onClick={() => setA(!aOn)}>
            research_a skips the write
          </Toggle>
          <Toggle on={!bOn} onClick={() => setB(!bOn)}>
            research_b skips the write
          </Toggle>
          <Toggle on={bFirst} onClick={() => setBFirst(!bFirst)}>
            research_b finishes first
          </Toggle>
          {arrayReducer && (
            <Toggle on={corrupt} onClick={() => setCorrupt(!corrupt)}>
              Current value is not an array
            </Toggle>
          )}
        </div>
      }
    >
      <div className="mb-4">
        <Choices label="Reducer" options={OPTIONS} value={r} onChange={setR} />
      </div>
      <div className="grid gap-3">
        <div>
          <p className="mb-3 mt-0 font-code text-[12px]" style={{ color: D.accentSoft, overflowWrap: "anywhere" }}>
            StateSpec::new().channel("{p.channel}", {p.variant})
          </p>
          <Label>Current value before the step</Label>
          <Mono>{json(current)}</Mono>
        </div>
        <div>
          <Label>Writes, in the order the tasks finished</Label>
          <div className="grid gap-1.5">
            {arrivals.length === 0 && <Mono dim>(none)</Mono>}
            {arrivals.map((w) => (
              <div key={w.node} className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-2">
                <span className="pt-2 font-code text-[12px]" style={{ color: D.accentSoft }}>
                  {w.node}
                </span>
                <Mono tone="accent">{json(w.value)}</Mono>
              </div>
            ))}
          </div>
          {arrivals.length > 1 && (
            <p className="mb-0 mt-2 font-code text-[11.5px] text-[#8b837b]">
              merge order after sort: {res.order.join(" → ")}
            </p>
          )}
        </div>
        <div>
          <Label>{res.ok ? "Value after the barrier" : "apply_super_step returned"}</Label>
          {res.ok ? <Mono tone="green">{json(res.value)}</Mono> : <Mono tone="red">invalid state update: {res.error}</Mono>}
        </div>
      </div>
    </DiagramFrame>
  );
}
