import type { Channel, ChannelState } from "./engine";
import { Json, Label } from "./chrome";
import { C } from "./tokens";

/**
 * The thread's channels, each with its reducer. Channels the current step
 * wrote are outlined once the Merge stage has applied them.
 */
export function StateInspector({ channels, state, changed }: { channels: Channel[]; state: ChannelState; changed: string[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label>Shared state</Label>
      <div className="flex min-w-0 flex-col gap-2">
        {channels.map((ch) => {
          const hot = changed.includes(ch.name);
          return (
            <div
              key={ch.name}
              className="min-w-0 rounded-xl border px-3 py-2.5 transition-colors duration-300"
              style={{ borderColor: hot ? "rgba(240,134,43,.55)" : C.faint, background: hot ? "rgba(240,134,43,.06)" : undefined }}
            >
              <div className="flex items-center gap-2">
                <span className="font-code text-[12.5px] text-[#f7ece4]">{ch.name}</span>
                <span className="font-code text-[10.5px] text-[#8b837b]">{ch.reducer}</span>
                {hot && <span className="ml-auto font-code text-[10.5px] text-[#ffc7a6]">merged</span>}
              </div>
              <pre className="m-0 mt-1.5 max-h-44 overflow-auto whitespace-pre-wrap break-words font-code text-[11px] leading-[1.55] text-[#cfc3b8]">
                <Json value={state[ch.name]} indent={1} />
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
