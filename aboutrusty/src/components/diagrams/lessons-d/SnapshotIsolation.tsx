import { useState } from "react";
import { DiagramFrame } from "../primitives";
import { D } from "../tokens";
import { Choices, Label, Mono, json } from "../lessons-a/kit";

/* Two nodes in one super-step. zeta writes n = 1; alpha reads n. The model
 * mirrors the snapshot-isolation lab: with a private snapshot per node, alpha
 * reads the start-of-step value and the writes merge sorted by node name.
 * The "shared map" mode is the design Rusty avoids: writes land as each node
 * finishes, so what alpha reads and the order of `log` follow the timing. */

type Mode = "snapshot" | "shared";
type Order = "zeta" | "alpha";

type Run = { n: number; alphaRead: number; log: string[] };

function simulate(mode: Mode, order: Order): Run {
  const zetaFirst = order === "zeta";
  if (mode === "snapshot") {
    // Both read the start-of-step value; the barrier merges sorted by name.
    return { n: 1, alphaRead: 0, log: ["alpha saw n=0", "zeta"] };
  }
  const alphaRead = zetaFirst ? 1 : 0;
  const alphaEntry = `alpha saw n=${alphaRead}`;
  return { n: 1, alphaRead, log: zetaFirst ? ["zeta", alphaEntry] : [alphaEntry, "zeta"] };
}

const LANES: Record<Order, { alpha: [number, number]; zeta: [number, number] }> = {
  // [start, end] as a percentage of the step's width.
  zeta: { alpha: [0, 80], zeta: [0, 22] },
  alpha: { alpha: [0, 30], zeta: [0, 78] },
};

function Lane({ name, span, note, lit }: { name: string; span: [number, number]; note: string; lit: boolean }) {
  return (
    <div className="grid grid-cols-[52px_1fr] items-center gap-2">
      <span className="font-code text-[12px]" style={{ color: D.ink }}>
        {name}
      </span>
      <div className="relative h-8 rounded-md" style={{ background: "#0d0908", border: `1px solid ${D.hair}` }}>
        <div
          className="absolute top-1 bottom-1 rounded"
          style={{
            left: `${span[0]}%`,
            width: `${span[1] - span[0]}%`,
            background: lit ? "rgba(240,134,43,.28)" : "rgba(236,150,96,.14)",
            border: `1px solid ${lit ? "rgba(240,134,43,.6)" : D.line}`,
            transition: "all .3s",
          }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-code text-[11px]"
          style={{
            left: `${Math.min(span[1] + 1.5, 60)}%`,
            color: D.accentSoft,
            textShadow: "0 0 4px #110c0a",
          }}
        >
          {note}
        </span>
      </div>
    </div>
  );
}

/** Two nodes in one step, with and without a private snapshot per node. */
export function SnapshotIsolation() {
  const [mode, setMode] = useState<Mode>("snapshot");
  const [order, setOrder] = useState<Order>("zeta");
  const run = simulate(mode, order);
  const other = simulate(mode, order === "zeta" ? "alpha" : "zeta");
  const same = JSON.stringify(run) === JSON.stringify(other);
  const lanes = LANES[order];

  const caption =
    mode === "snapshot"
      ? {
          title: same ? "Same result for either finish order" : "Results differ",
          text: "alpha reads its own clone of the start-of-step state, so it sees n = 0 even when zeta has already finished. zeta's write waits at the barrier. The barrier sorts writes by node name, so log is alpha's entry, then zeta's, whichever task finished first.",
        }
      : {
          title: "The result depends on which task finished first",
          text: "With one shared map, zeta's write lands the moment it finishes. alpha reads 1 if zeta got there first and 0 otherwise, and log records finish order. Flip the finish order to see a second, different result from the same graph and the same input.",
        };

  return (
    <DiagramFrame
      label="One super-step · alpha and zeta in parallel"
      caption={caption}
      captionTone={mode === "shared" ? "bad" : "plain"}
      controls={
        <div
          className="flex flex-col gap-3 border-t px-4 py-3 sm:px-5"
          style={{ borderColor: "rgba(236,150,96,.10)" }}
        >
          <div className="grid gap-1.5">
            <Label>Nodes read from</Label>
            <Choices<Mode>
              label="Nodes read from"
              value={mode}
              onChange={setMode}
              options={[
                { id: "snapshot", label: "a private snapshot (Rusty)" },
                { id: "shared", label: "one shared map" },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Which task finishes first</Label>
            <Choices<Order>
              label="Which task finishes first"
              value={order}
              onChange={setOrder}
              options={[
                { id: "zeta", label: "zeta first" },
                { id: "alpha", label: "alpha first" },
              ]}
            />
          </div>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Lane
            name="zeta"
            span={lanes.zeta}
            lit={order === "zeta"}
            note={mode === "shared" ? "writes n = 1 now" : "n = 1 held for the barrier"}
          />
          <Lane
            name="alpha"
            span={lanes.alpha}
            lit={order === "alpha"}
            note={`reads n = ${run.alphaRead}`}
          />
          <div className="grid grid-cols-[52px_1fr] gap-2">
            <span />
            <div className="flex justify-between font-code text-[10.5px]" style={{ color: D.dim }}>
              <span>step starts</span>
              <span>barrier</span>
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="min-w-0">
            <Label>State after the step · n (Overwrite)</Label>
            <Mono>{json(run.n)}</Mono>
          </div>
          <div className="min-w-0">
            <Label>State after the step · log (Append)</Label>
            <Mono tone={mode === "snapshot" ? "green" : "red"}>{json(run.log)}</Mono>
          </div>
        </div>
        <div className="min-w-0">
          <Label>With the other finish order</Label>
          <Mono tone={same ? "green" : "red"} dim={false}>
            {same ? "identical: " : "different: "}
            {json(other.log)}
          </Mono>
        </div>
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">
        The snapshot mode matches the lab below, captured from Rusty at fedbb3a. Rusty has no shared-map mode; it is
        shown for contrast.
      </p>
    </DiagramFrame>
  );
}
