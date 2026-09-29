import { useEffect, useRef, useState } from "react";
import type { SimFrame } from "./engine";
import { Dot, Label } from "./chrome";
import { C } from "./tokens";

const EVENT_COLOR: Record<SimFrame["event"], string> = {
  metadata: C.dim,
  updates: C.amber,
  values: C.soft,
  error: C.red,
  end: C.green,
};

function Payload({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  const json = JSON.stringify(data);
  if (json.length <= 150) return <>{json}</>;
  return (
    <>
      {open ? json : `${json.slice(0, 150)}…`}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-2 cursor-pointer border-0 bg-transparent p-0 font-code text-[11px] text-[#8b837b] hover:text-[#ffc7a6]"
      >
        {open ? "less" : "more"}
      </button>
    </>
  );
}

/**
 * The frames POST /threads/{id}/runs/stream would send, with the
 * default stream modes (values, updates). Each run opens its own stream, so
 * seq restarts at 1 and ids use "-" until the run writes a checkpoint.
 */
export function EventLog({ frames, threadId, live }: { frames: SimFrame[]; threadId: string; live: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const el = box.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [frames.length, threadId]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label right={<span className="font-code text-[10.5px] text-[#8b837b]">{frames.length} frames</span>}>
        <span className="inline-flex items-center gap-2">
          <Dot color={live ? C.accent : frames.length ? C.green : C.dim} pulse={live} />
          Event stream · thread {threadId}
        </span>
      </Label>
      <div
        ref={box}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
        }}
        className="h-72 overflow-y-auto rounded-xl border px-4 py-3"
        style={{ borderColor: C.faint, background: "rgba(8,5,4,.75)" }}
      >
        {frames.length === 0 ? (
          <p className="m-0 font-code text-[12px] text-[#8b837b]">No frames yet. The stream opens when a run starts.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {frames.map((f, i) => (
              <div key={i} className="font-code text-[11.5px] leading-[1.6]">
                <div>
                  <span className="text-[#6f675f]">event: </span>
                  <span style={{ color: EVENT_COLOR[f.event] }}>{f.event}</span>
                </div>
                <div>
                  <span className="text-[#6f675f]">id: </span>
                  <span className="text-[#cbb3a2]">{f.id}</span>
                </div>
                <div className="break-all text-[#cfc3b8]">
                  <span className="text-[#6f675f]">data: </span>
                  <Payload data={f.data} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
