import { useId, useState } from "react";
import { DiagramFrame, Markers } from "../primitives";
import { D } from "../tokens";
import { Choices, Label, Mono, json } from "./kit";

type Kind = "static" | "node" | "end" | "send" | "goto" | "typo" | "mixed" | "dup";

type Inv = { node: string; scoped?: Record<string, string> };

type Case = {
  label: string;
  code: string;
  /** When compile() rejects the graph. */
  compile?: string;
  /** When routing fails at run time. */
  runtime?: string;
  next?: Inv[];
  goto?: string[];
  /** Static edges drawn but skipped this step. */
  skipped?: string[];
  title: string;
  text: string;
};

const CASES: Record<Kind, Case> = {
  static: {
    label: "Static edges",
    code: `b.add_edge("plan", "search");
b.add_edge("plan", "fetch");`,
    next: [{ node: "search" }, { node: "fetch" }],
    title: "Every static edge from a node that ran fires",
    text: "Two edges out of plan activate both targets. They run in parallel in the next super-step.",
  },
  node: {
    label: "Route::Node",
    code: `b.add_conditional_edges("plan", |state| async move {
    Ok(Route::Node("answer".into()))
});`,
    next: [{ node: "answer" }],
    title: "The router picks one node",
    text: "The router reads the merged state after the barrier and names one node to run next.",
  },
  end: {
    label: "Route::End",
    code: `b.add_conditional_edges("plan", |state| async move {
    Ok(Route::End)
});`,
    next: [],
    title: "The router schedules nothing",
    text: "The next set is empty, so after the boundary checkpoint the run returns ExecutionOutcome::Done.",
  },
  send: {
    label: "Route::Send",
    code: `b.add_conditional_edges("plan", |state| async move {
    Ok(Route::Send(vec![
        Send::new("process_item", json!({ "item": "a" })),
        Send::new("process_item", json!({ "item": "b" })),
        Send::new("process_item", json!({ "item": "c" })),
    ]))
});`,
    next: [
      { node: "process_item", scoped: { item: "a" } },
      { node: "process_item", scoped: { item: "b" } },
      { node: "process_item", scoped: { item: "c" } },
    ],
    title: "One invocation per Send",
    text: "Three invocations of the same node, each with its own scoped state. Sends are not deduplicated, unlike edges and goto targets.",
  },
  goto: {
    label: "Command::goto",
    code: `b.add_edge("plan", "search");
b.add_edge("plan", "fetch");
// the plan node returns:
Ok(NodeOutput::route(Command::goto("answer")))`,
    next: [{ node: "answer" }],
    goto: ["answer"],
    skipped: ["search", "fetch"],
    title: "A goto replaces edge evaluation for the whole step",
    text: "Because a node returned Command::goto, the executor activates only the goto targets. No outgoing edge of any node that ran is evaluated.",
  },
  typo: {
    label: "Router typo",
    code: `b.add_conditional_edges("plan", |state| async move {
    Ok(Route::Node("answr".into()))
});`,
    runtime:
      "graph error: conditional router from `plan` returned unknown node `answr`",
    title: "Compiles, then fails at run time",
    text: "Router targets are data, so compile() cannot check them. The executor checks each target when routing and fails the run with RustyError::Graph.",
  },
  mixed: {
    label: "Mixed edges",
    code: `b.add_edge("plan", "search");
b.add_conditional_edges("plan", |state| async move {
    Ok(Route::Node("answer".into()))
});`,
    compile:
      "graph error: node `plan` has both static and conditional edges; routing would be ambiguous — use one kind per source node",
    title: "compile() rejects the graph",
    text: "A source node has either static edges or one conditional edge, never both. The error surfaces before any node or model call runs.",
  },
  dup: {
    label: "Duplicate edge",
    code: `b.add_edge("plan", "search");
b.add_edge("plan", "search");`,
    compile:
      "graph error: duplicate edge `plan -> search`: the target would be activated twice in one super-step",
    title: "compile() rejects the graph",
    text: "A duplicate edge would schedule search twice, which shows up later as a confusing double write on an Overwrite channel. compile() stops it here.",
  },
};

const ORDER: Kind[] = ["static", "node", "end", "send", "goto", "typo", "mixed", "dup"];
const TARGETS = ["search", "fetch", "answer", "process_item"];
const TY: Record<string, number> = { search: 34, fetch: 84, answer: 134, process_item: 184 };

/** Switch the routing kind out of `plan` and see the next active set. */
export function RoutingLab() {
  const uid = useId().replace(/:/g, "");
  const [kind, setKind] = useState<Kind>("static");
  const c = CASES[kind];
  const failed = !!(c.compile || c.runtime);
  const active = new Map<string, number>();
  (c.next ?? []).forEach((i) => active.set(i.node, (active.get(i.node) ?? 0) + 1));
  const skipped = new Set(c.skipped ?? []);
  const routingJson = c.next ? { next: c.next.map((i) => ({ node: i.node, scoped: i.scoped ?? null })), goto: c.goto ?? [] } : null;

  return (
    <DiagramFrame
      label="Route · from plan to the next active set"
      caption={{ title: c.title, text: c.text }}
      captionTone={failed ? "bad" : "plain"}
    >
      <div className="mb-3">
        <Choices label="Routing kind" options={ORDER.map((id) => ({ id, label: CASES[id].label }))} value={kind} onChange={setKind} />
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Label>Builder code</Label>
          <pre
            className="m-0 overflow-x-auto rounded-lg border px-3 py-2 font-code text-[11.5px] leading-[1.6] text-[#ddd0c4]"
            style={{ borderColor: "rgba(236,150,96,.14)", background: "#0d0908" }}
          >
            {c.code}
          </pre>
        </div>
        <div className="min-w-0">
          <Label>{c.compile ? "compile()" : "Next super-step"}</Label>
          <svg
            viewBox="0 0 320 214"
            width="100%"
            role="img"
            aria-label={`Routing from plan: ${c.label}`}
            style={{ display: "block", maxWidth: 420, fontFamily: D.mono, opacity: c.compile ? 0.45 : 1 }}
          >
            <Markers id={uid} />
            <rect x={8} y={92} width={78} height={30} rx={7} fill="rgba(240,134,43,.10)" stroke={D.accent} />
            <text x={47} y={111} textAnchor="middle" fontSize={11.5} fill={D.ink}>
              plan
            </text>
            {TARGETS.map((t) => {
              const n = active.get(t) ?? 0;
              const on = n > 0 && !failed;
              const skip = skipped.has(t);
              const bad = kind === "typo" && t === "answer";
              const y = TY[t];
              const stroke = on ? D.accent : skip ? D.dim : D.line;
              return (
                <g key={t}>
                  <path
                    d={`M86,107 C140,107 140,${y} 188,${y}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={on ? 2 : 1}
                    strokeDasharray={on ? undefined : "3 4"}
                    markerEnd={`url(#${uid}-${on ? "accent" : "line"})`}
                    opacity={on || skip ? 1 : 0.5}
                  />
                  {skip && (
                    <text x={140} y={y < 107 ? y + 18 : y - 8} textAnchor="middle" fontSize={9.5} fill={D.muted}>
                      skipped
                    </text>
                  )}
                  {Array.from({ length: Math.max(1, n) })
                    .map((_, k) => k)
                    .reverse()
                    .map((k) => (
                      <rect
                        key={k}
                        x={190 + k * 5}
                        y={y - 14 - k * 5}
                        width={116}
                        height={28}
                        rx={7}
                        fill={on ? "#1a100a" : "#0d0908"}
                        stroke={bad ? D.red : on ? D.accent : D.line}
                        opacity={on || bad ? 1 : 0.55}
                      />
                    ))}
                  <text x={248} y={y + 4} textAnchor="middle" fontSize={11} fill={on ? D.ink : bad ? D.red : D.body} opacity={on || bad ? 1 : 0.6}>
                    {bad ? "answr ?" : t}
                  </text>
                  {n > 1 && on && (
                    <text x={312} y={y - 20} textAnchor="end" fontSize={10} fill={D.accentSoft}>
                      ×{n}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="mt-3">
        {failed ? (
          <>
            <Label>{c.compile ? "GraphBuilder::compile() returned" : "execute_super_step returned"}</Label>
            <Mono tone="red">{c.compile ?? c.runtime}</Mono>
          </>
        ) : (
          <>
            <Label>RoutingDecision event output</Label>
            <Mono tone="green">{json(routingJson)}</Mono>
          </>
        )}
      </div>
    </DiagramFrame>
  );
}
