import { useState } from "react";
import { Link } from "react-router";
import { Kicker, Reveal, SectionTitle } from "./primitives";

const REPO = "https://github.com/dev-amjad-shaikh/rusty/blob/main/";

const REASONS: { t: string; d: string; src: string; file: string }[] = [
  {
    t: "Parallel nodes without data races",
    d: "Nodes in a super-step run as tokio tasks on a thread pool. Rust's Send and Sync rules mean state that isn't safe to share won't compile. Each node gets its own snapshot of the state, so parallel nodes can't interfere with each other.",
    src: "rusty-core/src/executor.rs",
    file: "rusty-core/src/executor.rs",
  },
  {
    t: "Retry safety in the type system",
    d: "Every side effect is declared with a marker trait: PureEffect, ReadOnlyEffect, IdempotentEffect, CompensatableEffect, or IrreversibleEffect. Only an idempotent effect can be passed to the retry gate, and the gate refuses it without an idempotency key. An irreversible effect runs only with an ApprovalToken scoped to that effect.",
    src: "rusty-core/src/effects.rs",
    file: "rusty-core/src/effects.rs",
  },
  {
    t: "Credentials that can't leak by accident",
    d: "Tools receive a CredentialHandle instead of a secret. The handle carries no secret bytes, has no Serialize implementation, and redacts its signature in Debug output. Putting one into a prompt or a JSON response doesn't compile.",
    src: "rusty-core/src/broker.rs",
    file: "rusty-core/src/broker.rs",
  },
  {
    t: "Cheap snapshots",
    d: "State channels are shared with Arc and copied only when written. Taking a snapshot for each parallel node costs about 26 ns for both 1 MB and 10 MB states. Before this change it was about 105 µs and 1.9 ms.",
    src: "docs/benchmarks.md",
    file: "docs/benchmarks.md",
  },
  {
    t: "Steps that clean up after themselves",
    d: "The nodes of a step run in a JoinSet. If one node fails, dropping the set aborts every node still running. Ownership makes this cleanup automatic, so a failed step can't leave tasks running in the background.",
    src: "rusty-core/src/executor.rs",
    file: "rusty-core/src/executor.rs",
  },
  {
    t: "Sandboxed code in the same process",
    d: "Wasmtime is written in Rust and embeds directly. WASM nodes run with fuel and memory limits. Capsules go further: if a capability isn't granted, the import doesn't exist in the module at all.",
    src: "rusty-core/src/wasm_node.rs",
    file: "rusty-core/src/wasm_node.rs",
  },
  {
    t: "One binary, no pauses",
    d: "There is no garbage collector and no interpreter. Your graphs compile into the server, and the result runs from a FROM scratch container.",
    src: "rusty-server/README.md",
    file: "rusty-server/README.md",
  },
];

/** 07 · Why Rust — the language guarantees the runtime leans on. */
export function WhyRust() {
  const [on, setOn] = useState(0);
  const r = REASONS[on];

  return (
    <Reveal className="flex flex-col gap-10 border-t border-[rgba(236,150,96,0.10)] py-[90px]">
      <div className="flex max-w-[680px] flex-col gap-[14px]">
        <Kicker>07 · Why Rust</Kicker>
        <SectionTitle>Why Rust</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
          An agent runtime sits under every run. It has to be correct under
          concurrency, predictable under load, and safe around untrusted code
          and credentials. Rust lets us check many of those properties when the
          code compiles, instead of hoping they hold at runtime.
        </p>
      </div>

      <div
        className="grid items-start gap-8"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))" }}
      >
        <div className="flex flex-col" role="tablist" aria-label="Why Rust">
          {REASONS.map((x, i) => {
            const active = i === on;
            return (
              <button
                key={x.t}
                role="tab"
                aria-selected={active}
                onClick={() => setOn(i)}
                onMouseEnter={() => setOn(i)}
                className="flex cursor-pointer items-baseline gap-4 border-0 border-t border-solid bg-transparent py-[15px] text-left transition-all"
                style={{
                  borderColor: "rgba(236,150,96,.10)",
                  paddingLeft: active ? 10 : 0,
                  color: "inherit",
                }}
              >
                <span
                  className="font-code text-[12.5px]"
                  style={{ color: active ? "#f0862b" : "#8b837b" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-[17px]"
                  style={{ color: active ? "#fff3ea" : "#cbb3a2", fontWeight: active ? 400 : 300 }}
                >
                  {x.t}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="flex min-h-[280px] flex-col gap-4 rounded-[14px] border p-7"
          style={{
            borderColor: "rgba(240,134,43,.35)",
            background: "linear-gradient(160deg,rgba(240,134,43,.08),rgba(200,110,44,.02))",
          }}
          role="tabpanel"
        >
          <span className="text-[24px] font-light text-[#f7ece4]">{r.t}</span>
          <p className="m-0 text-[16.5px] leading-[1.7] text-[#d8ccc0]">{r.d}</p>
          <a
            href={REPO + r.file}
            target="_blank"
            rel="noreferrer"
            className="mt-auto self-start rounded-md border px-2 py-[3px] font-code text-[12.5px] text-[#ffc7a6]"
            style={{ borderColor: "rgba(240,134,43,.28)", background: "rgba(240,134,43,.12)" }}
          >
            {r.src} ↗
          </a>
        </div>
      </div>

      <Link to="/learn#part-11" className="self-start text-[15.5px]">
        How Rust shapes Rusty's design, in Learn part 11 →
      </Link>
    </Reveal>
  );
}
