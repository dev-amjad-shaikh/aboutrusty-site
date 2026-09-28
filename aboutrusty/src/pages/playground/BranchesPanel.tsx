import type { ThreadSim } from "./engine";
import { Dot, Label } from "./chrome";
import { C, STATUS_COLOR } from "./tokens";

/** Every thread in the session: the original and its forks. */
export function BranchesPanel({
  threads,
  activeId,
  disabled,
  onSelect,
}: {
  threads: ThreadSim[];
  activeId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label>Threads</Label>
      <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
        {threads.map((t) => {
          const active = t.id === activeId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                disabled={disabled && !active}
                aria-current={active}
                className="flex w-full min-w-0 cursor-pointer flex-col gap-1 rounded-xl border bg-transparent px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: active ? "rgba(240,134,43,.5)" : C.faint, background: active ? "rgba(240,134,43,.06)" : undefined }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Dot color={STATUS_COLOR[t.status]} />
                  <span className="min-w-0 truncate font-code text-[12.5px] text-[#f7ece4]">{t.id}</span>
                  <span className="ml-auto shrink-0 font-code text-[11px]" style={{ color: STATUS_COLOR[t.status] }}>
                    {t.status}
                  </span>
                </span>
                <span className="font-code text-[11px] text-[#8b837b]">
                  {t.forkedFrom ? `forked from ${t.forkedFrom.thread} at ${t.forkedFrom.checkpoint} · ` : ""}
                  {t.checkpoints.length} checkpoint{t.checkpoints.length === 1 ? "" : "s"} · {t.attempts} run{t.attempts === 1 ? "" : "s"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
