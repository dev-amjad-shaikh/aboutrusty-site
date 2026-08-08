import { useEffect, useRef, useState } from "react";
import { ArrowDown, Terminal } from "lucide-react";
import type { SimFrame } from "./engine";
import { StatusDot } from "./chrome";

interface EventLogProps {
  frames: SimFrame[];
  threadId: string;
  /** 2× speed switches autoscroll to instant ("auto") to avoid jitter. */
  speed: 1 | 2;
  /** True while the thread is running — the title-bar dot breathes green. */
  streaming?: boolean;
}

const FRAME_COLORS: Record<SimFrame["event"], string> = {
  metadata: "text-white/40",
  updates: "text-amber-300",
  values: "text-orange-300",
  end: "text-[#e8845c]", // light rust — readable on the charcoal surface
};

const TRUNCATE_AT = 140;

/**
 * `values` frames repeat the entire channel state every super-step — truncate
 * the payload with a "+ expand" toggle so `updates` frames stay visible.
 */
function FramePayload({ frame }: { frame: SimFrame }) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(frame.data);
  if (frame.event !== "values" || json.length <= TRUNCATE_AT) {
    return <>{json}</>;
  }
  return (
    <>
      {expanded ? json : `${json.slice(0, TRUNCATE_AT)}…`}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="ml-1.5 font-code text-[10px] text-white/40 hover:text-white/70"
      >
        {expanded ? "– collapse" : "+ expand"}
      </button>
    </>
  );
}

/**
 * The SSE stream, rendered like a terminal: metadata → updates → values →
 * end frames, each carrying the {checkpoint_id}:{step}:{seq} frame id that
 * Last-Event-ID reconnects dedupe against. Autoscroll stays pinned to the
 * bottom until you scroll up — the ↓ latest button re-pins it.
 */
export function EventLog({ frames, threadId, speed, streaming = false }: EventLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const [pinned, setPinned] = useState(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    pinnedRef.current = atBottom;
    setPinned(atBottom);
  };

  useEffect(() => {
    if (!pinnedRef.current) return;
    endRef.current?.scrollIntoView({
      behavior: speed === 2 ? "auto" : "smooth",
      block: "end",
    });
  }, [frames.length, threadId, speed]);

  const repin = () => {
    pinnedRef.current = true;
    setPinned(true);
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  };

  return (
    <div className="bg-code relative overflow-hidden rounded-lg border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="flex items-center gap-2 font-code text-[10px] uppercase tracking-[0.14em] text-white/60">
          <StatusDot
            tone={streaming ? "success" : frames.length > 0 ? "rust" : "muted"}
            pulse={streaming}
          />
          <Terminal size={13} />
          runs/stream · thread {threadId}
        </span>
        <span className="font-code text-[10px] uppercase tracking-[0.14em] text-white/40">
          SSE
        </span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-80 overflow-y-auto p-4"
      >
        {frames.length === 0 ? (
          <p className="font-code text-xs text-white/40">
            # No frames yet — the stream starts when you run.
            <br />
            # stream_mode: [updates, values]
          </p>
        ) : (
          <div className="space-y-3">
            {frames.map((f, i) => (
              // frameId embeds checkpoint+step; the index tiebreaker keeps the
              // key unique across run attempts (the metadata frame is always
              // "-:0:1", so attempt 2 legitimately repeats frameId+seq).
              <div
                key={`${threadId}-${f.frameId}-${f.seq}-${i}`}
                className="font-code text-[11.5px] leading-relaxed"
              >
                <div>
                  <span className="text-white/35">event: </span>
                  <span className={FRAME_COLORS[f.event]}>{f.event}</span>
                </div>
                <div>
                  <span className="text-white/35">id: </span>
                  <span className="text-white/60">{f.frameId}</span>
                </div>
                <div className="break-all">
                  <span className="text-white/35">data: </span>
                  <span className="text-white/85">
                    <FramePayload frame={f} />
                  </span>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
      {!pinned && frames.length > 0 && (
        <button
          type="button"
          onClick={repin}
          className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-white/10 bg-secondary px-2 py-1 font-code text-[10px] uppercase tracking-[0.08em] text-secondary-foreground shadow-md hover:bg-secondary/80"
        >
          <ArrowDown size={11} />
          latest
        </button>
      )}
    </div>
  );
}
