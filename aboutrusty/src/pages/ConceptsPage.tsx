import { useMemo, useState } from "react";
import { lessonHref } from "@/content/lessonLinks";

/** [term, definition, lesson ref] — transcribed from the design's glossary. */
const TERMS: [string, string, string][] = [
  ["Agent (durable)", "An agent with a stable ID and private state that survives restarts.", "6.1"],
  ["Artifact", "A file or dataset produced by a run, stored by content hash with a link back to the run that produced it.", "9.5"],
  ["Candidate", "A proposed change to a prompt, policy, memory set, or tool permission. Candidates are immutable.", "7.1"],
  ["Canary deployment", "A new revision serves a set fraction of new runs while the current revision serves the rest.", "9.3"],
  ["Capsule", "A packaged WASM module that can only use the capabilities declared in its manifest.", "8.1"],
  ["Checkpoint", "A saved copy of a run's state, written after each super-step.", "2.8"],
  ["Checkpointer", "The storage backend for checkpoints: memory, JSON file, or Postgres.", "2.8"],
  ["Connector", "A connection to an external system, defined by a JSON Schema file.", "10.1"],
  ["Correction", "A change submitted by a person to fix an agent's output. It becomes a candidate.", "7.3"],
  ["Durable task", "A unit of work in the server's queue with a lease, retries, and a dead-letter queue.", "5.2"],
  ["Effect", "A side effect declared by a node, classified as pure, read-only, idempotent, compensatable, or irreversible.", "4.2"],
  ["Environment", "A deployment target such as dev, staging, or prod.", "9.1"],
  ["Evaluation", "Checking a candidate or revision against recorded runs and datasets before it is promoted.", "9.2"],
  ["Flight Recorder", "The run journal and the tools to replay it.", "4.1"],
  ["Fork", "Start a new branch of a run from an earlier checkpoint.", "2.10"],
  ["Goal", "An objective an agent works toward across steps, turns, and restarts.", "10.4"],
  ["Graph", "Nodes and edges that define an agent. Validated when you call compile().", "1.3"],
  ["Interrupt", "A pause in a run, usually to wait for human input.", "2.9"],
  ["Knowledge source", "Content added for retrieval. Results include citations.", "10.3"],
  ["Mailbox", "A persistent message queue for an agent.", "6.2"],
  ["Promotion", "Making a candidate or revision the active version, after evaluation and any required approval.", "7.5"],
  ["Reducer", "The rule that merges writes to a state channel.", "2.2"],
  ["Release gate", "An eval check that must pass before a revision is promoted.", "9.2"],
  ["Remote node", "A node that runs on another service over HTTP.", "2.13"],
  ["Replay", "Re-running a recorded run using journaled results instead of live calls.", "4.4"],
  ["Revision", "An immutable, deployable version of a graph and its config.", "9.1"],
  ["Rollback", "Pointing an environment back to its previous revision.", "9.1"],
  ["Run", "One execution of a graph on a thread.", "3.1"],
  ["Run journal", "The ordered record of every step, call, and decision in a run, with causal parents.", "4.1"],
  ["Signed receipt", "A signed record of what a run did, including denied actions.", "4.6"],
  ["Shadow deployment", "A revision runs alongside production without performing side effects, for comparison.", "9.4"],
  ["Skill", "A reusable procedure packaged as a SKILL.md file.", "10.2"],
  ["State channel", "A named, schema-declared field in a run's state.", "2.2"],
  ["Super-step", "One round of execution in which all scheduled nodes run in parallel and their writes commit together.", "2.3"],
  ["Thread", "The identity that groups a run's checkpoints. Used to resume.", "3.1"],
  ["WASM node", "A node that runs a WebAssembly module in a sandbox.", "2.13"],
];

const LAYERS: { name: string; items: string[] }[] = [
  { name: "Engine", items: ["Graph", "State channel", "Reducer", "Super-step"] },
  { name: "Durability", items: ["Checkpoint", "Interrupt", "Durable task"] },
  { name: "Evidence", items: ["Run journal", "Replay", "Fork", "Signed receipt"] },
  { name: "Governance", items: ["Candidate", "Evaluation", "Promotion", "Rollback"] },
];

/** Concepts — how the core ideas depend on each other, plus the glossary. */
export function ConceptsPage() {
  const [sel, setSel] = useState("Super-step");
  const [query, setQuery] = useState("");

  const current = TERMS.find(([t]) => t === sel) ?? TERMS[0];
  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter(([t, d]) => !q || (t + " " + d).toLowerCase().includes(q));
  }, [query]);

  return (
    <main className="mx-auto max-w-[1240px] px-7">
      <section className="flex flex-col gap-4 pb-9 pt-[72px]">
        <h1
          className="m-0 font-light text-[#f7ece4]"
          style={{ fontSize: "clamp(42px,5vw,60px)", lineHeight: 1.04, letterSpacing: "-.03em" }}
        >
          Concepts
        </h1>
        <p className="m-0 max-w-[640px] text-[18px] leading-[1.6] text-[#cfc3b8]">
          How Rusty's core ideas depend on each other, and a glossary of terms.
          Select a concept to see its definition.
        </p>
      </section>

      <section className="flex flex-col gap-2.5 pb-5">
        {LAYERS.map((layer) => (
          <div
            key={layer.name}
            className="grid items-center gap-5 rounded-[14px] border px-[18px] py-3.5 md:grid-cols-[130px_minmax(0,1fr)]"
            style={{ borderColor: "rgba(236,150,96,.14)", background: "rgba(255,236,214,.025)" }}
          >
            <span className="font-code text-[11.5px] uppercase tracking-[0.14em] text-[#cbb3a2]">
              {layer.name}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {layer.items.map((item, i) => {
                const on = item === sel;
                return (
                  <span key={item} className="flex items-center gap-2">
                    <button
                      onClick={() => setSel(item)}
                      className="cursor-pointer rounded-[9px] border px-3.5 py-[9px] text-[15px] transition-colors"
                      style={{
                        borderColor: on ? "rgba(240,134,43,.6)" : "rgba(236,150,96,.2)",
                        background: on ? "rgba(240,134,43,.16)" : "transparent",
                        color: on ? "#fff3ea" : "#d8ccc0",
                      }}
                    >
                      {item}
                    </button>
                    {i < layer.items.length - 1 && <span className="text-[#6f675f]">→</span>}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
        <div
          className="mt-1.5 flex flex-wrap items-center justify-between gap-5 rounded-[14px] border px-[22px] py-5"
          style={{ borderColor: "rgba(240,134,43,.32)", background: "rgba(240,134,43,.06)" }}
        >
          <div className="flex max-w-[760px] flex-col gap-1.5">
            <span className="text-[20px] font-normal text-[#f7ece4]">{current[0]}</span>
            <span className="text-[16px] leading-[1.6] text-[#d8ccc0]">{current[1]}</span>
          </div>
          <a href={lessonHref(current[2])} className="whitespace-nowrap text-[15px]">
            Read more →
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-[18px] pb-6 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="m-0 text-[32px] font-light tracking-[-0.02em] text-[#f7ece4]">
            Glossary
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter terms"
            className="min-w-[240px] rounded-[9px] border px-3 py-[9px] text-[14.5px] text-[#f7ece4] outline-none placeholder:text-[#8b837b]"
            style={{ background: "rgba(255,236,214,.04)", borderColor: "rgba(236,150,96,.18)" }}
          />
        </div>
        <div className="grid gap-x-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
          {terms.map(([t, d, l]) => (
            <div
              key={t}
              className="flex flex-col gap-[5px] border-t py-4"
              style={{ borderColor: "rgba(236,150,96,.10)" }}
            >
              <div className="flex justify-between gap-3">
                <span className="text-[16.5px] font-normal text-[#f7ece4]">{t}</span>
                <a
                  href={lessonHref(l)}
                  className="font-code text-[12px] text-primary no-underline hover:text-[#fb9a3f]"
                >
                  {l}
                </a>
              </div>
              <span className="text-[15px] leading-[1.55] text-[#b8b0a8]">{d}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
