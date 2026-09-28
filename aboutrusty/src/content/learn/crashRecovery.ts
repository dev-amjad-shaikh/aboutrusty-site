import type { Lesson } from "./types";

export const crashRecovery: Lesson = {
  id: "4.4",
  slug: "crash-recovery",
  title: "Walkthrough: the crash_recovery test",
  minutes: 14,
  source: "rusty-server/tests/crash_recovery.rs",
  before: ["3.1"],
  summary:
    "Checkpoints protect a run's state. They don't protect the world outside it: an email sent just before a crash gets sent again when the step reruns. Rusty's durable task queue closes that gap with leases and idempotency keys. This lesson walks through the test that proves it, with real processes and real SIGKILLs.",
  glance: {
    learn: "Why a crash between an effect and its report is the hard case",
    try: "Stepping through two kills and a restart",
    read: "The test, the demo worker's dedup branch, and the asserts",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "The problem",
      blocks: [
        {
          type: "p",
          text: "A worker sends a receipt email. The provider accepts it. Before the worker tells the server it's done, the machine dies. The server's record still says the task is running, so after a restart someone has to run it again, and the customer gets two emails.",
        },
        {
          type: "p",
          text: "This window, where the effect is durable at the provider but its completion was never reported, can't be closed by saving more often. Something has to make the second attempt harmless.",
        },
        {
          type: "p",
          text: "docs/durable-work-design.md states the promise precisely: **effectively-once execution when applications use idempotency**, not exactly-once side effects in general. Delivery through the queue is at-least-once. The idempotency key, passed all the way to the effect, collapses duplicate deliveries into one visible effect.",
        },
      ],
    },
    {
      id: "pieces",
      title: "The three mechanisms",
      toc: "Mechanisms",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "Durable task records",
              text: "A task enqueued with `POST /tasks` is stored by the server with its status, attempt counter, and idempotency key. The record survives the server's death.",
            },
            {
              label: "Leases",
              text: "A worker that claims a task holds it for a lease period and extends it with heartbeats. If the worker dies, the lease expires and the task becomes visible to other workers again.",
            },
            {
              label: "Idempotency keys",
              text: "The key travels with the task to the code that performs the effect. The provider stores it and answers a repeat with the original result instead of acting again.",
            },
          ],
        },
      ],
    },
    {
      id: "walkthrough",
      title: "Step through the test",
      toc: "Walkthrough",
      blocks: [
        {
          type: "p",
          text: "The test spawns the real demo binaries as child processes: `server_demo` with a JSON-file store in a temp directory, and `activity_worker_demo` running a `send_receipt` task against a ledger file that stands in for the external provider.",
        },
        { type: "diagram", name: "crash-timeline" },
      ],
    },
    {
      id: "window",
      title: "Making the crash deterministic",
      toc: "The kill window",
      blocks: [
        {
          type: "p",
          text: "A crash test that races the process it kills is flaky. This one isn't, because the demo worker pauses right after the effect fires. The pause is 30 seconds, the lease is 1 second, and every wait in the test polls against a deadline instead of sleeping:",
        },
        {
          type: "code",
          file: "rusty-server/tests/crash_recovery.rs",
          code: `/// The lease the test workers request: long enough to survive heartbeat
/// jitter, short enough that a SIGKILLed worker's task returns to
/// visibility ~1 s after its last heartbeat.
const LEASE_MS: u64 = 1_000;

/// The post-effect pause: the kill window.
const EFFECT_PAUSE_MS: u64 = 30_000;`,
        },
        {
          type: "p",
          text: "Attempt 1 can never report completion before the SIGKILL lands. The whole test takes a few seconds.",
        },
      ],
    },
    {
      id: "dedup",
      title: "Where the duplicate is stopped",
      toc: "Dedup",
      blocks: [
        {
          type: "p",
          text: "The second attempt really runs. The queue delivered the task twice, as at-least-once delivery allows. The duplicate is stopped at the effect, by the provider looking up the key:",
        },
        {
          type: "code",
          file: "rusty-worker/examples/activity_worker_demo.rs",
          symbol: "FileProvider::execute",
          code: `let key = idempotency_key.unwrap_or(task_id).to_owned();
// ...
if let Some(record) = self.find(&key) {
    let provider_id = record["provider_id"].as_str().unwrap_or("").to_owned();
    return ActivityCompletion {
        result: json!({"sent": true, "to": to, "provider_id": provider_id,
                       "deduplicated": true}),
        receipt: Some(make_receipt(provider_id)),
    };
}`,
        },
        {
          type: "p",
          text: "In your own workers, the provider is the payment API or mail service you call. Most of them accept an idempotency key header; pass the task's key to it.",
        },
      ],
    },
    {
      id: "asserts",
      title: "What the test asserts",
      toc: "Asserts",
      blocks: [
        {
          type: "code",
          file: "rusty-server/tests/crash_recovery.rs",
          symbol: "crash_mid_effect_recovers_without_losing_state_or_duplicating_the_effect",
          code: `assert_eq!(completed["attempt"], json!(2));
assert_eq!(completed["idempotency_key"], json!(key));

let records = ledger_records(&ledger, &key);
assert_eq!(records.len(), 1, "the external effect fired more than once: {records:?}");

assert_eq!(completed["result"]["deduplicated"], json!(true));
assert_eq!(completed["result"]["provider_id"], json!(provider_id));
assert_eq!(completed["receipt"]["provider_id"], json!(provider_id));`,
        },
        {
          type: "list",
          items: [
            "**No lost state.** The task record survived the server's SIGKILL with its attempt counter and key, and ends `completed` on attempt 2.",
            "**No duplicate effect.** Across both worker processes, the provider ledger holds exactly one line for the key.",
            "**A receipt that matches.** The stored result and the effect receipt carry the first attempt's `provider_id`.",
          ],
        },
        { type: "p", text: "Run it yourself. The test runs the compiled examples, so build them first:" },
        {
          type: "code",
          lang: "shell",
          code: `cargo build --workspace --examples
cargo test -p rusty-agent-server --test crash_recovery`,
        },
      ],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "The key has to reach the effect.",
              text: "If the code that calls the provider drops the key, the queue can't prevent a duplicate.",
            },
            {
              label: "Some effects can't be made idempotent.",
              text: "For those, the retry machinery refuses to re-drive the task silently instead of pretending.",
            },
            {
              label: "Recovery waits for the lease.",
              text: "A dead worker's task comes back only when its lease expires. Short leases recover faster and need more frequent heartbeats.",
            },
          ],
        },
      ],
    },
  ],
  takeaways: [
    "Checkpoints protect run state; leases and idempotency keys protect external effects.",
    "Delivery is at-least-once. The key makes the repeat a no-op at the provider.",
    "The test kills both processes with SIGKILL inside the window between effect and report.",
    "It asserts attempt 2, one ledger line, and a receipt with the first attempt's provider id.",
  ],
  quiz: [
    {
      q: "Why doesn't a checkpoint written after the email prevent a second email?",
      a: "The crash happens between the email and the report, before any boundary is saved. The rerun has no record that the email went out.",
    },
    {
      q: "In the test, how many times does the worker's effect code run? How many emails land?",
      a: "Twice, once per attempt. One line lands in the ledger, because attempt 2 finds the key and returns the stored result.",
    },
    {
      q: "What makes the task visible to worker-2?",
      a: "Worker-1's lease expires, since nobody heartbeats it after the kill, and the task returns to visibility.",
    },
  ],
  sources: [
    { path: "rusty-server/tests/crash_recovery.rs", what: "The test" },
    { path: "rusty-worker/examples/activity_worker_demo.rs", what: "FileProvider, the dedup branch" },
    { path: "rusty-server/examples/server_demo.rs", what: "The server under test" },
    { path: "docs/durable-work-design.md", what: "The effectively-once contract" },
    { path: "rusty-core/src/durable.rs", what: "Task envelope and retry contracts" },
  ],
  related: [
    { label: "Recording: docs/screenshots/crash-resume.gif", href: "https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/screenshots/crash-resume.gif" },
    { label: "Book: Durability", href: "/guide/10-durability.html#level-two-durable-work" },
  ],
};
