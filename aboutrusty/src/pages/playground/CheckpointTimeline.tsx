import type { Checkpoint } from "./engine";
import { Json, Label } from "./chrome";
import { C } from "./tokens";

const KIND_LABEL: Record<Checkpoint["kind"], [string, string]> = {
  boundary: ["boundary", C.dim],
  interrupt: ["interrupt", C.amber],
  ceiling: ["step ceiling", C.amber],
};

/**
 * The thread's checkpoints in insertion order, the order get_latest uses.
 * Open one to read its state, or fork the thread there.
 */
export function CheckpointTimeline({
  threadId,
  checkpoints,
  selected,
  canFork,
  onSelect,
  onFork,
}: {
  threadId: string;
  checkpoints: Checkpoint[];
  selected: string | null;
  canFork: boolean;
  onSelect: (id: string | null) => void;
  onFork: (cp: Checkpoint) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label right={<span className="font-code text-[10.5px] text-[#8b837b]">{checkpoints.length}</span>}>
        Checkpoints · thread {threadId}
      </Label>
      {checkpoints.length === 0 ? (
        <div className="rounded-xl border border-dashed p-5 text-[14px] text-[#8b837b]" style={{ borderColor: C.faint }}>
          None yet. The first one is written when step 0 ends.
        </div>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
          {checkpoints.map((cp, i) => {
            const open = cp.id === selected;
            const latest = i === checkpoints.length - 1;
            const [kind, kindColor] = KIND_LABEL[cp.kind];
            return (
              <li key={cp.id} className="min-w-0 rounded-xl border" style={{ borderColor: open ? "rgba(240,134,43,.5)" : C.faint, background: open ? "rgba(240,134,43,.05)" : undefined }}>
                <div className="flex min-w-0 items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSelect(open ? null : cp.id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-x-2.5 gap-y-1 border-0 bg-transparent p-0 text-left"
                  >
                    <span className="font-code text-[12px] text-[#f7ece4]">{cp.id}</span>
                    <span className="font-code text-[11px] text-[#cbb3a2]">step {cp.step}</span>
                    <span className="font-code text-[11px] text-[#a39a91]">next [{cp.next_nodes.join(", ") || "∅"}]</span>
                    <span className="font-code text-[10.5px]" style={{ color: kindColor }}>
                      {kind}
                    </span>
                    {latest && <span className="font-code text-[10.5px] text-[#ffc7a6]">latest</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => onFork(cp)}
                    disabled={!canFork}
                    title={canFork ? "fork_thread up to this checkpoint, then replay from it" : "Wait for the step to finish"}
                    className="shrink-0 cursor-pointer rounded-md border bg-transparent px-2.5 py-1 font-code text-[11.5px] text-[#ffc7a6] hover:border-[rgba(240,134,43,.6)] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "rgba(240,134,43,.3)" }}
                  >
                    Fork
                  </button>
                </div>
                {open && (
                  <pre className="m-0 max-h-56 overflow-auto whitespace-pre-wrap break-words border-t px-3 py-2.5 font-code text-[11px] leading-[1.55] text-[#cfc3b8]" style={{ borderColor: C.faint }}>
                    <Json value={cp.state} indent={1} />
                  </pre>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
