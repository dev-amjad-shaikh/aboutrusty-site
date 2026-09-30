import { useState, type ReactNode } from "react";
import { DiagramFrame } from "../primitives";
import { D } from "../tokens";
import { Choices, Label, Mono } from "../lessons-a/kit";

type Failure = "crash" | "clobber" | "runaway";
type Cell = { tone: "done" | "redo" | "dead" | "idle" | "cp"; text: string };

/** The ReAct loop from react_agent.rs, five super-steps long. */
const STEPS = ["agent", "tools", "agent", "tools", "agent"];

const FAILURES: { id: Failure; label: string }[] = [
  { id: "crash", label: "process dies mid-run" },
  { id: "clobber", label: "two nodes write one key" },
  { id: "runaway", label: "model never stops" },
];

const CELL: Record<Cell["tone"], { border: string; bg: string; color: string }> = {
  done: { border: "rgba(159,212,168,.35)", bg: "rgba(159,212,168,.07)", color: D.green },
  redo: { border: "rgba(245,183,116,.45)", bg: "rgba(245,183,116,.08)", color: D.amber },
  dead: { border: "rgba(240,154,128,.5)", bg: "rgba(224,106,74,.1)", color: D.red },
  idle: { border: "rgba(236,150,96,.12)", bg: "transparent", color: D.dim },
  cp: { border: "rgba(240,134,43,.5)", bg: "rgba(240,134,43,.1)", color: D.accentSoft },
};

function Strip({ cells }: { cells: Cell[] }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {cells.map((c, i) => {
        const s = CELL[c.tone];
        return (
          <div
            key={i}
            className="min-w-0 rounded-md border px-1.5 py-1.5 text-center font-code text-[11px] leading-[1.35]"
            style={{ borderColor: s.border, background: s.bg, color: s.color, overflowWrap: "anywhere" }}
          >
            {c.text}
          </div>
        );
      })}
    </div>
  );
}

function Side({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border p-3" style={{ borderColor: "rgba(236,150,96,.14)", background: D.card }}>
      <div className="font-code text-[11px] uppercase tracking-[0.1em] text-[#8b837b]">{title}</div>
      {children}
    </div>
  );
}

function Note({ children, tone }: { children: ReactNode; tone?: "red" | "green" | "amber" }) {
  const color = tone === "red" ? D.red : tone === "green" ? D.green : tone === "amber" ? D.amber : D.body;
  return <p className="m-0 text-[13.5px] leading-[1.55]" style={{ color }}>{children}</p>;
}

/** Lesson 1.2 interactive: pick a failure and compare an in-memory loop with a
 * checkpointed Rusty run of the same five-step ReAct loop. */
export function FailureCompare() {
  const [failure, setFailure] = useState<Failure>("crash");
  const [killAt, setKillAt] = useState(3);
  const [bFirst, setBFirst] = useState(false);

  let naive: ReactNode;
  let rusty: ReactNode;
  let caption: { title: string; text: string };

  if (failure === "crash") {
    const before = STEPS.map((n, i): Cell => (i < killAt ? { tone: "done", text: n } : i === killAt ? { tone: "dead", text: "killed" } : { tone: "idle", text: n }));
    const naiveAfter = STEPS.map((n, i): Cell => (i <= killAt ? { tone: "redo", text: `${n} again` } : { tone: "done", text: n }));
    const rustyBefore = STEPS.map((n, i): Cell => (i < killAt ? { tone: "cp", text: n } : i === killAt ? { tone: "dead", text: "killed" } : { tone: "idle", text: n }));
    const rustyAfter = STEPS.map((n, i): Cell => (i < killAt ? { tone: "idle", text: "kept" } : i === killAt ? { tone: "redo", text: `${n} again` } : { tone: "done", text: n }));
    const lostModel = STEPS.slice(0, killAt).filter((n) => n === "agent").length;
    const lostTools = STEPS.slice(0, killAt).filter((n) => n === "tools").length;
    naive = (
      <>
        <Label>First process</Label>
        <Strip cells={before} />
        <Label>After restart: state was in memory</Label>
        <Strip cells={naiveAfter} />
        <Note tone="red">
          Starts over from the user's message. {lostModel} model call{lostModel === 1 ? "" : "s"} and {lostTools} tool batch{lostTools === 1 ? "" : "es"} run a second time.
        </Note>
      </>
    );
    rusty = (
      <>
        <Label>First process · orange = checkpoint saved</Label>
        <Strip cells={rustyBefore} />
        <Label>After restart: load the latest checkpoint</Label>
        <Strip cells={rustyAfter} />
        <Note tone="amber">
          {killAt === 0
            ? "No step finished, so there is no checkpoint yet. Step 0 runs again."
            : `Resumes from the checkpoint written after step ${killAt - 1}. Only the ${STEPS[killAt]} node of step ${killAt} runs again, from its start.`}
        </Note>
      </>
    );
    caption = {
      title: `Killed during step ${killAt} (${STEPS[killAt]})`,
      text: "Progress is only as durable as the last thing written to disk. Rusty writes a checkpoint at every step boundary when a checkpointer is attached, so a restart loses at most the step in flight. That step reruns whole, which is why nodes must be safe to repeat.",
    };
  } else if (failure === "clobber") {
    const order = bFirst ? ["research_b", "research_a"] : ["research_a", "research_b"];
    const last = order[1];
    naive = (
      <>
        <Label>Finish order</Label>
        <Mono>{order.join(" → ")}</Mono>
        <Label>Both write state["summary"] directly</Label>
        <Mono tone="amber">{`summary = "from ${last}"`}</Mono>
        <Note tone="red">The value depends on which task finished last. Flip the order and the answer changes, with no error.</Note>
      </>
    );
    rusty = (
      <>
        <Label>summary declared with Reducer::Overwrite</Label>
        <Mono tone="red">
          invalid state update: channel `summary` can receive only one value per super-step (reducer: overwrite); already written by node `research_a`, second write from node `research_b`. …
        </Mono>
        <Label>summary declared with Reducer::Append</Label>
        <Mono tone="green">{`summary = ["from research_a", "from research_b"]`}</Mono>
        <Note tone="green">Same result for either finish order. Writes are sorted by node name before the merge.</Note>
      </>
    );
    caption = {
      title: "Two parallel nodes, one key",
      text: "In a plain loop the last writer wins and nobody is told. Rusty makes each channel declare a reducer. The default refuses a second write in the same step, and the multi-write reducers merge in a fixed order.",
    };
  } else {
    naive = (
      <>
        <Label>while model asks for tools</Label>
        <Strip cells={STEPS.map((n): Cell => ({ tone: "redo", text: n }))} />
        <Mono tone="amber">… step 6, 7, 8 …</Mono>
        <Note tone="red">Nothing in the loop stops it. A timeout kills the process and the work so far goes with it.</Note>
      </>
    );
    rusty = (
      <>
        <Label>RunConfig::new(…).with_max_steps(5)</Label>
        <Strip cells={STEPS.map((n): Cell => ({ tone: "cp", text: n }))} />
        <Mono tone="amber">{`Interrupted { value: {"rusty.halted": {"reason": "step_ceiling", "limit": 5, "steps_run": 5, …}} }`}</Mono>
        <Note tone="green">The run suspends at the ceiling with its state and a checkpoint. Resume the thread to carry on.</Note>
      </>
    );
    caption = {
      title: "A loop with no exit",
      text: "Each trip around agent → tools is a new super-step, so a step budget is the guard. The default is 1000 (DEFAULT_MAX_STEPS). Reaching it suspends the run instead of failing it.",
    };
  }

  return (
    <DiagramFrame label="Same failure, two runtimes" caption={caption}>
      <div className="flex flex-col gap-3">
        <Choices label="Failure" options={FAILURES} value={failure} onChange={setFailure} />
        {failure === "crash" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-code text-[12px] text-[#8b837b]">kill during step</span>
            <Choices
              label="Kill during step"
              options={STEPS.map((_, i) => ({ id: String(i), label: String(i) }))}
              value={String(killAt)}
              onChange={(v) => setKillAt(Number(v))}
            />
          </div>
        )}
        {failure === "clobber" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-code text-[12px] text-[#8b837b]">who finishes first</span>
            <Choices
              label="Who finishes first"
              options={[
                { id: "a", label: "research_a" },
                { id: "b", label: "research_b" },
              ]}
              value={bFirst ? "b" : "a"}
              onChange={(v) => setBFirst(v === "b")}
            />
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <Side title="In-memory loop">{naive}</Side>
          <Side title="Rusty, checkpointer attached">{rusty}</Side>
        </div>
      </div>
    </DiagramFrame>
  );
}
