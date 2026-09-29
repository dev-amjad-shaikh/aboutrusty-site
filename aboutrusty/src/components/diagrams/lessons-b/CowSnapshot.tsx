import { useState } from "react";
import { DiagramFrame, StepControls, Toggle } from "../primitives";
import { D, useStepper } from "../tokens";

type Chan = { name: string; reducer: string; value: string };
const CHANNELS: Chan[] = [
  { name: "messages", reducer: "AddMessages", value: "[4 messages]" },
  { name: "notes", reducer: "Append", value: '["plan: 2 topics"]' },
  { name: "summary", reducer: "Overwrite", value: '"draft"' },
  { name: "config", reducer: "Overwrite", value: '{"model": …}' },
];

type Holder = { who: string; note: string };
type Cell = { alloc: string; value: string; mark: "shared" | "inplace" | "copied" | "new" };

const STEPS = [
  "Start of step",
  "Snapshot and spawn",
  "Nodes return updates",
  "Merge at the barrier",
  "After the step",
] as const;

/** Lesson 11.1 interactive: the Arc structure of State across one
 * super-step. Clones share the map; the merge copies only what it writes,
 * and only when someone else still holds it. */
export function CowSnapshot() {
  const stepper = useStepper(STEPS.length, 2600);
  const [durable, setDurable] = useState(true);
  const s = stepper.step;

  // Who holds the channel map (outer Arc) at each stage.
  const holders: Holder[] =
    s === 0
      ? [{ who: "state", note: "the executor's" }]
      : s === 1
        ? [
            { who: "state", note: "" },
            { who: "snapshot", note: "state.clone()" },
            { who: "node_state (research_a)", note: "snapshot.clone()" },
            { who: "node_state (research_b)", note: "snapshot.clone()" },
          ]
        : s === 2
          ? [
              { who: "state", note: "" },
              { who: "snapshot", note: "held until the barrier" },
            ]
          : [{ who: "state", note: s === 3 ? "drop(snapshot) ran" : "" }];
  if (durable) holders.push({ who: "checkpoint (step N)", note: "saved last step" });
  const mapRefs = holders.length;

  const after = s >= 3;
  const cells: Cell[] = CHANNELS.map((c, i) => {
    const alloc = `#${i + 1}`;
    if (!after) return { alloc, value: c.value, mark: "shared" };
    if (c.name === "notes")
      return durable
        ? { alloc: "#5", value: '["plan: 2 topics", "A: 3 sources"]', mark: "copied" }
        : { alloc, value: '["plan: 2 topics", "A: 3 sources"]', mark: "inplace" };
    if (c.name === "summary") return { alloc: "#6", value: '"final"', mark: "new" };
    return { alloc, value: c.value, mark: "shared" };
  });

  const MARK: Record<Cell["mark"], { label: string; color: string; border: string }> = {
    shared: {
      label: after ? (durable ? "untouched, shared with the checkpoint" : "untouched, same allocation") : mapRefs > 1 ? "shared" : "one owner",
      color: D.green,
      border: "rgba(159,212,168,.35)",
    },
    inplace: { label: "merged in place (refcount 1)", color: D.green, border: "rgba(159,212,168,.6)" },
    copied: { label: "copied: the checkpoint still holds #2", color: D.amber, border: "rgba(245,183,116,.55)" },
    new: { label: "Overwrite: fresh Arc", color: D.accentSoft, border: "rgba(240,134,43,.55)" },
  };

  const captions = [
    {
      title: "A State is an Arc'd map of Arc'd values",
      text: `State { inner: Arc<BTreeMap<String, Arc<Value>>> }. Four channels, four value allocations (#1 to #4), one map.${durable ? " The checkpoint written at the end of the last step is a clone, so it shares all of it." : ""}`,
    },
    {
      title: "Every snapshot is a pointer copy",
      text: "The executor clones the state once for the step, then once per node. Each clone bumps one reference count on the map. Nothing is copied, whatever the payload size; docs/benchmarks.md measures the whole six-clone fan-out at about 26 ns for 1 MB and 10 MB states.",
    },
    {
      title: "Nodes don't touch the map",
      text: "Each node returns its writes as a NodeOutput. It never mutates the map it was given, and its copy is dropped when the task ends. The shared map and every value in it are unchanged until the barrier.",
    },
    {
      title: durable ? "The merge copies one channel, not the state" : "Nobody else holds notes, so it grows in place",
      text: durable
        ? "The checkpoint still shares the map, so Arc::make_mut clones it shallowly: one pointer per channel. notes is shared with the checkpoint, so Append copies that one array (#5) and pushes onto the copy. summary gets a fresh Arc. messages and config are never cloned."
        : "With no checkpoint holding the old state, dropping the snapshot leaves every Arc with refcount 1. Arc::get_mut succeeds, and Append pushes onto the existing array (#2). summary still gets a fresh Arc: Overwrite always replaces.",
    },
    {
      title: "Sharing is also the delta",
      text: durable
        ? "channels_changed_since compares pointers first. messages and config are the same allocations as in the checkpoint, so the next delta checkpoint writes only notes and summary."
        : "The post-step state shares nothing it didn't need to copy. Turn on the checkpoint to see the copy it forces.",
    },
  ];

  return (
    <DiagramFrame
      label={`State sharing · ${STEPS[s].toLowerCase()}`}
      caption={captions[s]}
      controls={
        <StepControls stepper={stepper} count={STEPS.length}>
          <Toggle on={durable} onClick={() => setDurable(!durable)}>
            Checkpoint holds last step
          </Toggle>
        </StepControls>
      }
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="mb-1 font-code text-[10.5px] uppercase tracking-[0.12em] text-[#8b837b]">
            Holders of the map · refcount {mapRefs}
          </span>
          {holders.map((h) => (
            <div
              key={h.who}
              className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-lg border px-3 py-1.5"
              style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(255,236,214,.02)", transition: "all .3s" }}
            >
              <span className="font-code text-[12.5px] text-[#f7ece4]">{h.who}</span>
              {h.note && <span className="font-code text-[11px] text-[#8b837b]">{h.note}</span>}
            </div>
          ))}
          {s === 2 && (
            <div className="mt-1 flex flex-col gap-1 rounded-lg border px-3 py-2 font-code text-[12px]" style={{ borderColor: "rgba(240,134,43,.35)" }}>
              <span className="text-[#ffc7a6]">research_a → notes += "A: 3 sources"</span>
              <span className="text-[#ffc7a6]">research_b → summary = "final"</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="mb-1 font-code text-[10.5px] uppercase tracking-[0.12em] text-[#8b837b]">
            Channel values {after ? "in the merged state" : ""}
          </span>
          {CHANNELS.map((c, i) => {
            const cell = cells[i];
            const m = MARK[cell.mark];
            return (
              <div
                key={c.name}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 rounded-lg border px-3 py-2"
                style={{ borderColor: m.border, transition: "border-color .3s" }}
              >
                <span className="font-code text-[12.5px] text-[#f7ece4]">{c.name}</span>
                <span className="break-words text-right font-code text-[11.5px]" style={{ color: m.color }}>
                  {cell.alloc} · {m.label}
                </span>
                <span className="col-span-2 break-words font-code text-[11.5px] text-[#8b837b]">
                  {c.reducer} · {cell.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </DiagramFrame>
  );
}
