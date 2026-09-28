import { D } from "./tokens";
import { SteppedSequence, type SequenceStep } from "./SteppedSequence";

/** Interrupt, park, resume: after docs/architecture.md 4f. */
const INTERRUPT_STEPS: SequenceStep[] = [
  {
    from: "caller",
    to: "exec",
    label: "run(thread t)",
    title: "First call",
    text: "The run reaches the approve node's step. resume is not set on the RunConfig.",
  },
  {
    from: "exec",
    to: "node",
    label: "run(ctx): resume_value() = None",
    title: "The node has no answer yet",
    text: "approve checks ctx.resume_value() first. It's None, so the node builds its question.",
  },
  {
    from: "node",
    to: "exec",
    kind: "reply",
    tone: "amber",
    label: "Err(ctx.interrupt(payload))",
    title: "The node asks",
    text: "Returning the interrupt error is how a node pauses the run. The payload is the question for the person.",
  },
  {
    from: "exec",
    kind: "self",
    tone: "amber",
    label: "discard step, abort siblings",
    title: "The step is discarded",
    text: "Like a failure, the interrupt throws away every write from this step, including siblings that already finished.",
  },
  {
    from: "exec",
    to: "store",
    label: "put(checkpoint, next = active set)",
    title: "The suspension checkpoint",
    text: "The saved checkpoint schedules the whole active set of the step, so every node in it runs again on resume.",
  },
  {
    from: "exec",
    to: "caller",
    kind: "reply",
    tone: "amber",
    label: "Interrupted { value, checkpoint_id }",
    title: "The run is parked",
    text: "run returns. Nothing is executing and nothing is held in memory. The process can exit.",
  },
  {
    from: "caller",
    kind: "self",
    tone: "plain",
    label: "a person decides (minutes or weeks)",
    title: "Waiting costs nothing",
    text: "Your application shows the payload to someone and stores their answer however it likes.",
  },
  {
    from: "caller",
    to: "exec",
    label: "run(thread t, with_resume(decision))",
    title: "Second call",
    text: "Same thread id, with the decision as the resume value.",
  },
  {
    from: "store",
    to: "exec",
    kind: "reply",
    label: "get_latest(t): state + next_nodes",
    title: "Restore",
    text: "The executor loads the latest checkpoint for the thread and uses its state and next nodes as the first step.",
  },
  {
    from: "exec",
    to: "node",
    label: "run again: resume_value() = Some",
    title: "The node runs from the top",
    text: "approve starts over. This time resume_value() returns the decision, so it writes approval instead of asking.",
  },
  {
    from: "node",
    to: "exec",
    kind: "reply",
    label: "NodeOutput::update(\"approval\", …)",
    title: "The step completes",
    text: "The merge, routing, and checkpoint happen as usual, and publish runs in the next step.",
  },
  {
    from: "exec",
    to: "caller",
    kind: "reply",
    tone: "green",
    label: "Done(state)",
    title: "Finished",
    text: "The run ends normally. Its journal records the interrupt in the first run and a resume event in the second.",
  },
];

export function InterruptSequence() {
  return (
    <SteppedSequence
      label="Interrupt · park and resume"
      lanes={[
        { id: "caller", label: "Caller" },
        { id: "exec", label: "Executor" },
        { id: "node", label: "approve" },
        { id: "store", label: "Checkpointer" },
      ]}
      steps={INTERRUPT_STEPS}
    />
  );
}

/** rusty-server/tests/crash_recovery.rs, step by step. `task` is the server's
 * record and `ledger` the provider's invocation lines after each step. */
const CRASH_STEPS: (SequenceStep & { task: string; attempt: string; owner: string; ledger: number })[] = [
  {
    from: "server",
    kind: "boot",
    label: "server_demo starts (JSON-file store)",
    title: "Generation 1 boots",
    text: "The test spawns the real server_demo binary with its store in a temp directory, and waits for GET /ok.",
    task: "—", attempt: "—", owner: "—", ledger: 0,
  },
  {
    from: "worker",
    kind: "boot",
    label: "worker-1 starts (lease 1 s)",
    title: "A worker joins",
    text: "activity_worker_demo runs send_receipt against a ledger file outside the server's store. The ledger stands in for the external provider.",
    task: "—", attempt: "—", owner: "—", ledger: 0,
  },
  {
    from: "test",
    to: "server",
    label: "POST /tasks {idempotency_key, effect}",
    title: "Enqueue a durable task",
    text: "kind send_receipt, an idempotency key, and effect: idempotent. The server answers 201 with a task_id.",
    task: "queued", attempt: "0", owner: "—", ledger: 0,
  },
  {
    from: "worker",
    to: "server",
    label: "claim → leased, attempt 1",
    title: "The worker leases the task",
    text: "The task is invisible to other workers until the lease expires. The record says leased, attempt 1, owner worker-1.",
    task: "leased", attempt: "1", owner: "worker-1", ledger: 0,
  },
  {
    from: "worker",
    to: "provider",
    label: "send_receipt: append line, fsync",
    title: "The effect fires",
    text: "The provider ledger now holds one invocation for the key. From the outside world's view, the email was sent.",
    task: "leased", attempt: "1", owner: "worker-1", ledger: 1,
  },
  {
    from: "worker",
    kind: "self",
    tone: "amber",
    label: "pause 30 s before reporting",
    title: "The kill window opens",
    text: "Effect durable at the provider, completion not yet reported. This is the case checkpoints alone can't handle.",
    task: "leased", attempt: "1", owner: "worker-1", ledger: 1,
  },
  {
    from: "worker",
    kind: "kill",
    tone: "red",
    label: "SIGKILL worker-1",
    title: "kill -9 the worker",
    text: "No drain, no signal handler. The worker dies holding the lease and never reports.",
    bad: true,
    task: "leased", attempt: "1", owner: "worker-1", ledger: 1,
  },
  {
    from: "server",
    kind: "kill",
    tone: "red",
    label: "SIGKILL server_demo",
    title: "kill -9 the server",
    text: "The server dies too. Its store says the task is leased; its writes went through temp files and renames, so nothing is half-written.",
    bad: true,
    task: "leased", attempt: "1", owner: "worker-1", ledger: 1,
  },
  {
    from: "server",
    kind: "boot",
    label: "server_demo restarts, same store",
    title: "Generation 2 boots",
    text: "A new server process opens the same store directory. The task record, its attempt counter, and its key are all there.",
    task: "leased", attempt: "1", owner: "worker-1", ledger: 1,
  },
  {
    from: "worker",
    kind: "boot",
    label: "worker-2 starts, same ledger",
    title: "A new worker",
    text: "worker-2 points at the new server and the same provider ledger.",
    task: "leased", attempt: "1", owner: "worker-1", ledger: 1,
  },
  {
    from: "server",
    kind: "self",
    label: "lease expired → claimable again",
    title: "The lease runs out",
    text: "Nobody heartbeats worker-1's lease. Past its expires_at the task is claimable again; the record still says leased until someone claims it.",
    task: "leased (expired)", attempt: "1", owner: "worker-1", ledger: 1,
  },
  {
    from: "worker",
    to: "server",
    label: "claim → leased, attempt 2",
    title: "Second attempt",
    text: "worker-2 claims the task. Delivery is at-least-once, so the effect code runs again.",
    task: "leased", attempt: "2", owner: "worker-2", ledger: 1,
  },
  {
    from: "worker",
    to: "provider",
    tone: "green",
    label: "same key → found, return first result",
    title: "The provider deduplicates",
    text: "The ledger already has a line for this key. The worker returns the stored provider_id with deduplicated: true and doesn't fire again.",
    task: "leased", attempt: "2", owner: "worker-2", ledger: 1,
  },
  {
    from: "worker",
    to: "server",
    tone: "green",
    label: "complete: result + receipt",
    title: "Completion is reported",
    text: "The record ends completed, with the result and an effect receipt carrying the first attempt's provider_id.",
    task: "completed", attempt: "2", owner: "—", ledger: 1,
  },
  {
    from: "test",
    to: "server",
    tone: "green",
    label: "assert: attempt 2, one ledger line",
    title: "The asserts pass",
    text: "No lost state, one external effect, and a receipt that matches it.",
    task: "completed", attempt: "2", owner: "—", ledger: 1,
  },
];

export function CrashTimeline() {
  return (
    <SteppedSequence
      label="crash_recovery.rs · two SIGKILLs mid-effect"
      lanes={[
        { id: "test", label: "Test" },
        { id: "server", label: "Server" },
        { id: "worker", label: "Worker" },
        { id: "provider", label: "Provider" },
      ]}
      steps={CRASH_STEPS}
      aside={(i) => {
        const s = CRASH_STEPS[i];
        const rows: [string, string, string?][] = [
          ["task", s.task, s.task === "completed" ? D.green : s.task === "leased" ? D.amber : undefined],
          ["attempt", s.attempt],
          ["lease owner", s.owner],
          ["ledger lines", String(s.ledger), s.ledger > 1 ? D.red : undefined],
        ];
        return (
          <div className="flex flex-col gap-2 self-start rounded-xl border p-3.5" style={{ borderColor: "rgba(236,150,96,.16)", background: D.card }}>
            <span className="font-code text-[10.5px] uppercase tracking-[0.12em] text-[#8b837b]">What the store says</span>
            {rows.map(([k, v, c]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 font-code text-[12.5px]">
                <span className="text-[#8b837b]">{k}</span>
                <span style={{ color: c ?? D.ink, transition: "color .3s" }}>{v}</span>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}
