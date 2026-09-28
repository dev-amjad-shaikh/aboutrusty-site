import { SteppedSequence, type SequenceStep } from "./SteppedSequence";

const LANES = [
  { id: "caller", label: "Caller" },
  { id: "exec", label: "Executor" },
  { id: "nodes", label: "Nodes" },
  { id: "reducers", label: "Reducers" },
  { id: "store", label: "Checkpointer" },
];

/** One run through Rusty Core, after docs/architecture.md section 3. */
const STEPS: SequenceStep[] = [
  {
    from: "caller",
    to: "exec",
    label: "run(graph, spec, state, config)",
    title: "The caller starts a run",
    text: "Executor::run takes the compiled graph, the StateSpec, an initial state, and a RunConfig with the thread id.",
  },
  {
    from: "exec",
    kind: "self",
    label: "plan: entry, resume, or replay",
    title: "Plan",
    text: "On a fresh run the active set is the entry point. On resume or replay it is the next_nodes of the checkpoint being loaded.",
  },
  {
    from: "exec",
    to: "nodes",
    label: "spawn: one task per node, own snapshot",
    title: "Spawn",
    text: "Each active node runs as a task in a tokio JoinSet, with its own clone of the state as it was at the start of the step.",
  },
  {
    from: "nodes",
    to: "exec",
    kind: "reply",
    label: "barrier: output, error, or interrupt",
    title: "Barrier",
    text: "The executor waits for every task. One error or interrupt discards the whole step; otherwise every output is collected.",
  },
  {
    from: "exec",
    to: "reducers",
    label: "apply_super_step(writes)",
    title: "Merge",
    text: "All writes go to StateSpec::apply_super_step together, sorted by node name.",
  },
  {
    from: "reducers",
    to: "exec",
    kind: "reply",
    label: "merged state, validated first",
    title: "Validated, then applied",
    text: "Every write is checked before any is applied, so a bad write leaves the state untouched.",
  },
  {
    from: "exec",
    kind: "self",
    label: "route: goto, edges, Route, Send",
    title: "Route",
    text: "Command::goto, static edges, and conditional routers decide the next active set from the merged state.",
  },
  {
    from: "exec",
    to: "store",
    label: "put(checkpoint) at the boundary",
    title: "Checkpoint",
    text: "Step, full state, and next nodes are saved. This is the only place a running graph persists state.",
  },
  {
    from: "exec",
    kind: "self",
    tone: "amber",
    label: "next set not empty: plan again",
    title: "Loop",
    text: "If routing scheduled anything, the next super-step starts at plan. An agent loop is many passes through this cycle, bounded by max_steps.",
  },
  {
    from: "exec",
    to: "caller",
    kind: "reply",
    tone: "green",
    label: "Done(state) or Interrupted(payload)",
    title: "The run returns",
    text: "An empty next set ends the run with Done. An interrupt or a ceiling returns Interrupted with the checkpoint id to resume from.",
  },
];

export function RunSequence() {
  return <SteppedSequence label="Anatomy of a run" lanes={LANES} steps={STEPS} />;
}
