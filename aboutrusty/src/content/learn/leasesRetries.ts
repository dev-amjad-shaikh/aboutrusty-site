import type { Lesson } from "./types";

export const leasesRetries: Lesson = {
  id: "4.2",
  slug: "leases-and-retries",
  title: "Leases, heartbeats, and retries",
  minutes: 15,
  source: "rusty-core/src/durable.rs",
  before: ["4.1"],
  summary:
    "A durable task outlives the worker that runs it. The server hands the task out under a lease, the worker keeps the lease alive with heartbeats, and a dead worker's task comes back when the lease runs out. When an attempt fails, one shared function decides whether to retry, dead-letter, or fail.",
  glance: {
    learn: "How a lease reassigns work, and the four gates of classify_retry",
    try: "Killing a worker and failing attempts with each ErrorClass",
    read: "claimable_at, classify_retry_with_policy, and the backoff formula",
  },
  interactive: true,
  sections: [
    {
      id: "outcomes",
      title: "Three ways an attempt ends",
      toc: "Outcomes",
      blocks: [
        {
          type: "p",
          text: "A worker takes a [[Durable task|durable task]] and starts calling a payment API. Three things can happen next. It finishes and reports. It hits an error and reports that. Or it dies, and reports nothing at all. The queue has to handle all three without a person watching, and it can't tell a slow worker from a dead one by asking.",
        },
        {
          type: "p",
          text: "The failed-with-a-report case has its own trap. Some errors go away on retry and some never will. Some work is safe to repeat and some isn't: a timed-out charge may already have gone through. So the queue needs a rule for each case.",
        },
      ],
    },
    {
      id: "lifecycle",
      title: "The task lifecycle",
      toc: "Lifecycle",
      blocks: [
        {
          type: "p",
          text: "The server's task queue lives in `rusty-server/src/tasks.rs`. A task enqueued with `POST /tasks` moves through six statuses:",
        },
        {
          type: "code",
          file: "rusty-server/src/tasks.rs",
          symbol: "TaskStatus",
          lang: "text",
          code: `queued ──claim──> leased ──complete──> completed   (terminal)
                    │
                    ├──fail──> RetryDecision::Retry ──> failed (next_attempt_at set)
                    │            ──backoff elapsed──> claimable again
                    ├──fail──> RetryDecision::Dead  ──> dead     (terminal, DLQ)
                    ├──fail──> RetryDecision::Fail  ──> failed (next_attempt_at null;
                    │                                     terminal, *not* the DLQ)
                    └──lease expires──> claimable again (new attempt)`,
        },
        {
          type: "p",
          text: "`failed` covers two resting states. With `next_attempt_at` set, a retry is scheduled. With it null, the task is finished. The sixth status, `cancelled`, is reached by cancelling the task. It's terminal too, and counts as control flow rather than failure.",
        },
      ],
    },
    {
      id: "leases",
      title: "Leases",
      toc: "Leases",
      blocks: [
        {
          type: "p",
          text: "A worker calls `POST /tasks/claim` with a `lease_ms` and gets the task under a [[Lease|lease]]. The server marks the task `leased`, records the worker as the lease owner with an expiry time, and increments the attempt counter. The task is invisible to other workers until the lease runs out. This is the SQS visibility-timeout idea with an explicit owner.",
        },
        {
          type: "p",
          text: "Whether a task can be claimed is one function. A leased task becomes claimable the moment its lease is past expiry:",
        },
        {
          type: "code",
          file: "rusty-server/src/tasks.rs",
          symbol: "TaskRecord::claimable_at",
          code: `pub(crate) fn claimable_at(&self, now: DateTime<Utc>) -> bool {
    match self.status {
        TaskStatus::Queued => true,
        TaskStatus::Failed => self.next_attempt_at.is_some_and(|at| at <= now),
        TaskStatus::Leased => self.lease.as_ref().is_some_and(|l| l.expires_at <= now),
        TaskStatus::Completed | TaskStatus::Dead | TaskStatus::Cancelled => false,
    }
}`,
        },
        {
          type: "p",
          text: "Nobody has to detect the crash. The dead worker stops heartbeating, time passes, and the next claim picks the task up as a new attempt. `lease_ms` must be between 100 ms and one hour (`MIN_LEASE_MS`, `MAX_LEASE_MS`).",
        },
      ],
    },
    {
      id: "heartbeats",
      title: "Heartbeats and the 409",
      toc: "Heartbeats",
      blocks: [
        {
          type: "p",
          text: "The worker SDK's `ActivityWorker` requests a 30 second lease by default (`DEFAULT_LEASE`) and renews it from a background task every `lease / 3`. Each `POST /tasks/{id}/heartbeat` moves `expires_at` to now plus `lease_ms`. A healthy worker never lets the lease lapse, however long the handler runs.",
        },
        {
          type: "p",
          text: "Heartbeat, complete, and fail are all lease-guarded. The server checks that the caller still owns the lease, atomically with the change. A worker whose lease expired and was reclaimed gets `409` from all three. In the worker, a `409` on a heartbeat aborts the handler and skips the settle call, so the new holder is the only one who can finish the task.",
        },
        {
          type: "predict",
          question: "Worker A claims a task with a 100 ms lease and dies. Worker B claims the same task 200 ms later. What `attempt` number does B see?",
          options: ["1: A never reported a failure", "2", "It can't claim it until A's task is failed by a reaper"],
          answer: 1,
          explain:
            "Every claim increments the attempt counter, and an expired lease makes the task claimable with no reaper involved. The lab below shows it on a real server.",
        },
        {
          type: "lab",
          title: "Lose a lease",
          intro:
            "Start the demo server in open mode in one terminal, then drive the queue with curl from another. Worker A takes a 100 ms lease and never heartbeats. Worker B takes over, A tries to finish anyway, and B reports a timeout.",
          commands: `# terminal 1
RUSTY_OPEN=1 cargo run -p rusty-agent-server --example server_demo

# terminal 2
TASK=$(curl -s -X POST localhost:8100/tasks -H 'content-type: application/json' \\
  -d '{"kind": "send_email", "payload": {"to": "a@b.c"}, "effect": "idempotent"}' | jq -r .task_id)

curl -s -X POST localhost:8100/tasks/claim -H 'content-type: application/json' \\
  -d '{"worker_id": "worker-a", "lease_ms": 100}' | jq -c '.task | {attempt, status, owner: .lease.owner}'
sleep 0.2

curl -s -X POST localhost:8100/tasks/claim -H 'content-type: application/json' \\
  -d '{"worker_id": "worker-b", "lease_ms": 30000}' | jq -c '.task | {attempt, status, owner: .lease.owner}'

curl -s -o /dev/null -w '%{http_code}\\n' -X POST localhost:8100/tasks/$TASK/complete \\
  -H 'content-type: application/json' -d '{"worker_id": "worker-a", "result": null}'

curl -s -X POST localhost:8100/tasks/$TASK/fail -H 'content-type: application/json' \\
  -d '{"worker_id": "worker-b", "error_class": "timeout", "message": "provider slow", "retryable": true}' \\
  | jq -c '{requeued, dead, next_attempt_at}'`,
          output: `{"attempt":1,"status":"leased","owner":"worker-a"}
{"attempt":2,"status":"leased","owner":"worker-b"}
409
{"requeued":true,"dead":false,"next_attempt_at":"2026-09-29T19:15:54.663215Z"}`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change: "Enqueue the task with `\"effect\": \"non_idempotent\"` and run the same five calls.",
            predict: "The timeout is a retryable class and this is attempt 2 of 3. Does the task get another try?",
            result:
              "No. The first four lines are identical, and the last one is `{\"requeued\":false,\"dead\":false,\"next_attempt_at\":null}`: failed outright, outside the dead-letter queue. The effect gate below refuses before the class or the attempt count is considered.",
          },
        },
        {
          type: "note",
          title: "What the lease does not do",
          text: "A lease makes reassignment safe. It doesn't stop the effect from running twice: the dead worker may have charged the card before it died. The idempotency key covers that. [4.4](/learn/crash-recovery) walks through a test that kills a worker in exactly that window.",
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [
        {
          type: "p",
          text: "Claim the task, then kill the worker and let the lease expire, or report a failure with one of the eight error classes. Flip the declared effect to `non_idempotent` and fail again to see the first gate close.",
        },
        { type: "diagram", name: "lease-timeline" },
      ],
    },
    {
      id: "classes",
      title: "Error classes",
      toc: "ErrorClass",
      blocks: [
        {
          type: "p",
          text: "A worker that fails an attempt says why, with one of eight values from the closed `ErrorClass` enum in `rusty-core/src/durable.rs`. The class is declared by whoever ran the work, never inferred from logs.",
        },
        {
          type: "rows",
          rows: [
            { label: "transient", tone: "amber", text: "Connection reset, broken pipe. Retry with backoff." },
            { label: "rate_limited", tone: "amber", text: "The callee asked to slow down (429). Retry with backoff." },
            { label: "timeout", tone: "amber", text: "The attempt ran past its deadline and may have partly executed. Retry with backoff, if the effect gate allows." },
            { label: "dependency_failure", tone: "amber", text: "An upstream service is down, such as a model endpoint returning 5xx. Retry with backoff; kept apart from transient so telemetry separates their outage from your wiring." },
            { label: "resource_exhausted", tone: "amber", text: "Out of memory, connections, or quota. Retry with backoff." },
            { label: "unknown", tone: "amber", text: "Unclassified. Retry to the attempt limit, then dead-letter. These are the DLQ's main input, because they need a person to look." },
            { label: "invalid_input", tone: "red", text: "The same bytes will fail the same way. Never retried; fails the task." },
            { label: "cancelled", tone: "plain", text: "Control flow. Never retried and never dead-lettered." },
          ],
        },
        {
          type: "p",
          text: "Model calls map onto this taxonomy through `impl From<LlmErrorClass> for ErrorClass`: a provider rate limit stays `RateLimited`, a server error becomes `DependencyFailure`, and bad credentials, a refused request, or an undecodable response become `InvalidInput`.",
        },
      ],
    },
    {
      id: "gates",
      title: "The retry decision",
      toc: "classify_retry",
      blocks: [
        {
          type: "predict",
          question: "An `idempotent` task fails with `unknown` on attempt 3, and `max_attempts` is 3. Retry, dead-letter, or fail?",
          options: ["Retry: `unknown` is retryable", "Dead-letter", "Fail outright"],
          answer: 1,
          explain:
            "The effect and the class both allow a retry, but the attempt gate comes before the retry: at `max_attempts`, a retryable failure goes to the dead-letter queue.",
        },
        {
          type: "p",
          text: "Every failed attempt goes through one function in `rusty-core`. The worker only reports the class and a `retryable` flag to `POST /tasks/{id}/fail`; the server decides, against the task record:",
        },
        {
          type: "code",
          file: "rusty-core/src/durable.rs",
          symbol: "classify_retry_with_policy",
          code: `if !effect.is_freely_repeatable() || !class.is_retryable() {
    return RetryDecision::Fail;
}
if attempt >= resolved.max_attempts {
    return RetryDecision::Dead;
}
RetryDecision::Retry {
    after_ms: backoff_delay_ms_with(
        attempt,
        uniform,
        resolved.base_delay_ms,
        resolved.max_delay_ms,
    ),
}`,
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Effect gate.** Only `Pure`, `ReadOnly`, and `Idempotent` work is freely repeatable (see [[Effect|effect classes]]). A `Compensatable` or `NonIdempotent` task is never retried silently, whatever the class.",
            "**Class gate.** `invalid_input` and `cancelled` fail immediately.",
            "**Attempt gate.** `attempt` counts attempts made so far, starting at 1. At `max_attempts` a retryable failure goes to the dead-letter queue.",
            "**Retry**, after a jittered delay.",
          ],
        },
        {
          type: "p",
          text: "The order is the policy. The effect gate comes first because its question, whether a second run could do harm, outranks every other one. The effect comes from the task's declared `effect` at enqueue. When the enqueuer didn't declare one, the server uses the worker's `retryable` flag: `true` reads as `Idempotent`, `false` as `NonIdempotent`. A declared non-repeatable effect outranks the flag.",
        },
        {
          type: "p",
          text: "A task enqueued without `max_attempts` gets the server default of 3: the first try plus two retries. The ceiling is 100.",
        },
      ],
    },
    {
      id: "backoff",
      title: "Backoff with full jitter",
      toc: "Backoff",
      blocks: [
        {
          type: "code",
          file: "rusty-core/src/durable.rs",
          symbol: "backoff_delay_ms_with",
          code: `pub fn backoff_delay_ms_with(attempt: u32, uniform: f64, base_ms: u64, cap_ms: u64) -> u64 {
    let exponent = attempt.saturating_sub(1).min(20);
    let exponential = base_ms.saturating_mul(1u64 << exponent).min(cap_ms);
    (uniform.clamp(0.0, 1.0) * exponential as f64) as u64
}`,
        },
        {
          type: "p",
          text: "Retry `n` draws a delay uniformly from `[0, 1 s × 2^(n−1)]`, capped at five minutes (`BASE_RETRY_DELAY_MS = 1_000`, `MAX_RETRY_DELAY_MS = 300_000`). The windows are 1 s, 2 s, 4 s, and so on; retry 9 draws from up to 256 s, and from retry 10 on the window stays at 300 s. At the cap one task retries at most 12 times an hour.",
        },
        {
          type: "p",
          text: "Full jitter means the whole window is random, where a fixed delay would only add a little noise. When a shared dependency goes down, hundreds of tasks fail together. Fixed delays would bring them all back at the same instant and knock the dependency over again. Uniform draws over the window spread them out.",
        },
        {
          type: "p",
          text: "`uniform` is a parameter; the function draws nothing itself. The server's queue takes it from the OS random source. A caller that passes a sample from a seeded source gets the same schedule on every replay. A learned policy may tune the base, the cap, and the attempt budget (narrowing it, never widening it), but not the shape of the schedule.",
        },
      ],
    },
    {
      id: "dlq",
      title: "Dead-letter or fail",
      toc: "DLQ vs fail",
      blocks: [
        {
          type: "p",
          text: "The two terminal failure outcomes mean different things, and the queue keeps them apart:",
        },
        {
          type: "rows",
          rows: [
            {
              label: "dead",
              tone: "red",
              text: "A retryable failure that ran out of attempts. It sits in the dead-letter queue, listed by `GET /tasks?status=dead` with its `error_class` and `last_error`, because a person can fix the cause and act on it. A tenant quota `max_dlq` refuses new submissions while the DLQ is full.",
            },
            {
              label: "failed, next_attempt_at null",
              tone: "amber",
              text: "Invalid input, or work not safe to repeat. Re-driving the same input can't help, so it never enters the DLQ. The test `outright_failures_never_dead_letter` in `rusty-server/tests/tasks.rs` checks all three routes here: `retryable: false`, `invalid_input`, and a declared `non_idempotent` effect.",
            },
          ],
        },
        {
          type: "p",
          text: "A task that completes after earlier failures keeps its last `error_class` on the record, as history of what it survived.",
        },
      ],
    },
    {
      id: "expiry",
      title: "What a lease expiry counts as",
      toc: "Lease expiry",
      blocks: [
        {
          type: "p",
          text: "The design doc (`docs/durable-work-design.md`) says lease-expiry reaping classifies as `unknown`: a dead worker tells you nothing about whether the effect fired. In the queue as implemented, an expired lease isn't run through `classify_retry` at all. The claim path takes the task directly, and `claim` increments the attempt counter:",
        },
        {
          type: "code",
          file: "rusty-server/tests/tasks.rs",
          symbol: "expired_lease_is_reclaimed_and_lost_lease_is_409",
          code: `// Worker A takes a very short lease and dies (no heartbeat).
let task = claim_one(&app, "worker-a", 100).await;
assert_eq!(task["lease"]["owner"], json!("worker-a"));

tokio::time::sleep(std::time::Duration::from_millis(150)).await;

// Worker B reclaims the expired lease as a new attempt.
let task = claim_one(&app, "worker-b", 30_000).await;
assert_eq!(task["task_id"], json!(task_id));
assert_eq!(task["attempt"], json!(2));`,
        },
        {
          type: "p",
          text: "The attempt still counts. If the task keeps failing after reclaims, the next reported failure at or past `max_attempts` dead-letters it. A worker that crashes every time without reporting never triggers that decision, so watch `GET /tasks/metrics` and attempt counts for tasks that keep coming back.",
        },
      ],
    },
  ],
  quiz: [
    {
      q: "Worker A's lease expires, worker B claims the task, and then A calls complete. What happens?",
      a: "A gets 409. The lease check runs atomically with the mutation, and B is now the owner.",
    },
    {
      q: "What delay range does the second retry draw from?",
      a: "Uniformly from 0 to 2 seconds: 1 s × 2^(2−1).",
    },
  ],
  sources: [
    { path: "rusty-core/src/durable.rs", what: "ErrorClass, RetryDecision, classify_retry, backoff_delay_ms" },
    { path: "rusty-server/src/tasks.rs", what: "TaskStatus, TaskRecord::claimable_at, claim, fail" },
    { path: "rusty-worker/src/activity.rs", what: "ActivityWorker, the heartbeat loop" },
    { path: "rusty-server/tests/tasks.rs", what: "Lease expiry, retry, DLQ, and outright-failure tests" },
    { path: "docs/durable-work-design.md", what: "The retry taxonomy and lease model" },
  ],
  deeper: [{ book: "10-durability.html#level-two-durable-work", label: "Durability: durable work" }],
  related: [{ label: "4.4 Walkthrough: the crash_recovery test", href: "/learn/crash-recovery" }],
};
