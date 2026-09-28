import { useEffect, useState } from "react";
import { Kicker, Reveal, SectionTitle } from "./primitives";

const STEPS: { t: string; d: string }[] = [
  {
    t: "Define a graph",
    d: 'Nodes are steps such as "call the model" or "run a tool." State is typed JSON, declared up front.',
  },
  {
    t: "Run it",
    d: "Rusty runs the graph in rounds called super-steps. Nodes in the same round run in parallel.",
  },
  {
    t: "Save after every step",
    d: "When a round finishes, Rusty writes a checkpoint to memory, a JSON file, or Postgres.",
  },
  {
    t: "Resume, pause, or replay",
    d: "Use the checkpoint to recover from a crash, wait for a person, or replay the run exactly.",
  },
];

/** [text, color, step index this line belongs to] */
const TERM: [string, string, number][] = [
  ["$ cargo test -p rusty-agent-server --test crash_recovery", "#f7ece4", 0],
  ["▸ server started · pid 48211", "#b8b0a8", 0],
  ["▸ run r_7f2 · step 1 plan        ✓ checkpoint 1", "#9fd4a8", 1],
  ["▸ run r_7f2 · step 2 research    ✓ checkpoint 2", "#9fd4a8", 2],
  ["▸ run r_7f2 · step 3 write       running…", "#f5b774", 1],
  ["$ kill -9 48211", "#f7ece4", 3],
  ["✗ server terminated (SIGKILL)", "#f09a80", 3],
  ["▸ new server started · pid 48305", "#b8b0a8", 3],
  ["▸ loaded checkpoint 2 for thread t_research", "#ffd0b3", 3],
  ["▸ run r_7f2 · step 3 write       ✓ checkpoint 3", "#9fd4a8", 2],
  ["✓ run done · completed steps not re-run", "#9fd4a8", 3],
];

/** 03 · How it works — clickable step timeline beside a live crash test. */
export function HowItWorksHome() {
  const [term, setTerm] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTerm(TERM.length);
      setStep(3);
      return;
    }
    const id = setInterval(() => {
      setTerm((t) => {
        const next = (t + 1) % (TERM.length + 5);
        const line = TERM[Math.min(next, TERM.length) - 1];
        if (next !== 0 && line) setStep(line[2]);
        if (next === 0) setStep(0);
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, []);

  const killed = term >= 6 && term <= 7;
  const done = term >= TERM.length;
  const liveInk = killed ? "#f09a80" : done ? "#9fd4a8" : "#f5b774";
  const liveLabel = killed ? "killed" : done ? "passed" : "running";
  const lines = TERM.slice(0, Math.min(TERM.length, term));

  return (
    <Reveal
      className="flex flex-col gap-10 border-t py-[90px]"
      style={{ borderColor: "rgba(236,150,96,.10)" }}
    >
      <div className="flex flex-col gap-3.5">
        <Kicker>03 · How it works</Kicker>
        <SectionTitle>How it works</SectionTitle>
      </div>
      <div
        className="grid items-start gap-10"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))" }}
      >
        {/* step timeline */}
        <div className="relative flex flex-col pl-7">
          <span
            aria-hidden="true"
            className="absolute bottom-3.5 left-1.5 top-3.5 w-0.5"
            style={{ background: "rgba(236,150,96,.14)" }}
          />
          <span
            aria-hidden="true"
            className="absolute left-1.5 top-3.5 w-0.5"
            style={{
              height: `${(step / 3) * 100}%`,
              background: "linear-gradient(180deg,#b4501f,#f0862b)",
              boxShadow: "0 0 10px rgba(240,134,43,.6)",
              transition: "height .6s ease",
            }}
          />
          {STEPS.map((s, i) => {
            const on = i === step;
            const past = i < step;
            return (
              <button
                key={s.t}
                onClick={() => setStep(i)}
                className="relative mb-2 flex cursor-pointer flex-col gap-1.5 rounded-xl border px-[18px] py-4 text-left text-inherit"
                style={{
                  borderColor: on ? "rgba(240,134,43,.45)" : "rgba(236,150,96,.12)",
                  background: on ? "rgba(240,134,43,.08)" : "transparent",
                  transition: "all .4s",
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-7 top-[18px] h-3.5 w-3.5 rounded-full border-2"
                  style={{
                    borderColor: on || past ? "#f0862b" : "rgba(236,150,96,.3)",
                    background: on ? "#f0862b" : "#0d0a09",
                    transition: "all .4s",
                  }}
                />
                <span className="flex items-baseline gap-3">
                  <span
                    className="font-code text-[12.5px]"
                    style={{ color: on ? "#f0862b" : "#8b837b" }}
                  >
                    0{i + 1}
                  </span>
                  <span className="text-[18px] font-normal text-[#f7ece4]">
                    {s.t}
                  </span>
                </span>
                <span className="text-[15.5px] leading-[1.55] text-[#b8b0a8]">
                  {s.d}
                </span>
              </button>
            );
          })}
        </div>

        {/* crash-recovery terminal */}
        <div className="flex min-w-0 flex-col gap-3">
          <div
            className="overflow-hidden rounded-[14px] border"
            style={{
              borderColor: "rgba(236,150,96,.2)",
              background: "rgba(10,7,6,.9)",
              boxShadow: "0 30px 70px -20px rgba(0,0,0,.8)",
            }}
          >
            <div
              className="flex items-center gap-2 border-b px-3.5 py-[11px]"
              style={{ borderColor: "rgba(236,150,96,.10)" }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#3a2a22]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3a2a22]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3a2a22]" />
              <span className="ml-2 font-code text-[12px] text-[#8b837b]">
                crash_recovery · real kill -9
              </span>
              <span
                className="ml-auto flex items-center gap-1.5 font-code text-[11.5px]"
                style={{ color: liveInk }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: liveInk }}
                />
                {liveLabel}
              </span>
            </div>
            <div className="flex min-h-[330px] flex-col gap-[7px] px-[18px] pb-5 pt-[18px] font-code text-[13px] leading-[1.5]">
              {lines.map(([text, color], i) => (
                <div
                  key={`${i}-${text}`}
                  style={{ color, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {text}
                </div>
              ))}
              <span className="block h-4 w-2 bg-primary opacity-[.85]" />
            </div>
          </div>
          <pre
            className="m-0 overflow-x-auto rounded-xl border px-[18px] py-4 font-code text-[12.5px] leading-[1.7] text-[#ddd0c4]"
            style={{
              borderColor: "rgba(236,150,96,.14)",
              background: "rgba(8,5,4,.7)",
            }}
          >
            <span className="text-primary">let</span>
            {" graph = create_react_agent(model, ToolRegistry::new())?;\n"}
            <span className="text-primary">let</span>
            {' spec = StateSpec::new().channel('}
            <span className="text-[#9fd4a8]">"messages"</span>
            {", Reducer::AddMessages);\n"}
            <span className="text-primary">let</span>
            {" outcome = Executor::new()\n    .run(&graph, &spec, input, RunConfig::new("}
            <span className="text-[#9fd4a8]">"demo"</span>
            {"))\n    ."}
            <span className="text-primary">await</span>?;
          </pre>
          <span className="text-[14px] leading-[1.55] text-[#a39a91]">
            This path runs in CI on every change.{" "}
            <a href="https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-server/tests/crash_recovery.rs">
              See the test
            </a>
          </span>
        </div>
      </div>
    </Reveal>
  );
}
