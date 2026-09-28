import { useState } from "react";
import { DiagramFrame, Toggle } from "../primitives";
import { D } from "../tokens";

/** The closed ErrorClass set from rusty-core/src/durable.rs, in declaration order. */
const CLASSES = [
  "transient",
  "rate_limited",
  "timeout",
  "invalid_input",
  "dependency_failure",
  "resource_exhausted",
  "cancelled",
  "unknown",
] as const;
type ErrorClass = (typeof CLASSES)[number];

type Status = "queued" | "leased" | "failed" | "completed" | "dead" | "cancelled";
type Decision = { kind: "retry"; afterMs: number; window: number } | { kind: "dead" } | { kind: "fail" };

const BASE_MS = 1_000;
const CAP_MS = 300_000;
const MAX_ATTEMPTS = 3; // DEFAULT_MAX_ATTEMPTS in rusty-server/src/tasks.rs
/** Fixed jitter samples so the widget replays the same way every time. The
 * real queue draws from the OS RNG (tasks.rs `uniform()`). */
const SAMPLES = [0.62, 0.35, 0.81, 0.27, 0.54, 0.9, 0.12];

/** backoff_delay_ms_with: full jitter over a doubling window, capped. */
function backoff(attempt: number, u: number) {
  const exponent = Math.min(Math.max(attempt - 1, 0), 20);
  const window = Math.min(BASE_MS * 2 ** exponent, CAP_MS);
  return { afterMs: Math.floor(u * window), window };
}

/** classify_retry_with_policy with the floor's parameters: effect gate,
 * class gate, attempt gate, then retry. */
function classify(idempotent: boolean, c: ErrorClass, attempt: number, u: number): Decision {
  const retryable = c !== "invalid_input" && c !== "cancelled";
  if (!idempotent || !retryable) return { kind: "fail" };
  if (attempt >= MAX_ATTEMPTS) return { kind: "dead" };
  return { kind: "retry", ...backoff(attempt, u) };
}

type Rec = {
  status: Status;
  attempt: number;
  owner: string | null;
  workerAlive: boolean;
  leaseExpired: boolean;
  retryAfter: number | null;
  errorClass: ErrorClass | null;
  workers: number;
  draws: number;
};

type Log = { t: string; tone: "plain" | "green" | "amber" | "red" | "accent" };

const FRESH: Rec = {
  status: "queued",
  attempt: 0,
  owner: null,
  workerAlive: false,
  leaseExpired: false,
  retryAfter: null,
  errorClass: null,
  workers: 0,
  draws: 0,
};

const sec = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(ms % 1000 ? 2 : 0)} s` : `${ms} ms`);

const TONE: Record<Log["tone"], string> = {
  plain: D.body,
  green: D.green,
  amber: D.amber,
  red: D.red,
  accent: D.accentSoft,
};

const btn =
  "cursor-pointer rounded-lg border px-3 py-2 text-[13.5px] transition-colors disabled:cursor-default disabled:opacity-35";

/** Lesson 4.2 interactive: one durable task under the server's lease and
 * retry rules. Kill the worker, let the lease expire, fail an attempt with
 * any ErrorClass, and read the decision classify_retry makes. */
export function LeaseTimeline() {
  const [rec, setRec] = useState<Rec>(FRESH);
  const [log, setLog] = useState<Log[]>([{ t: "POST /tasks → queued, attempt 0, max_attempts 3", tone: "plain" }]);
  const [idempotent, setIdempotent] = useState(true);
  const [cls, setCls] = useState<ErrorClass>("transient");
  const [caption, setCaption] = useState({
    title: "A queued task",
    text: "Nobody holds it yet. Claim it with a worker, then choose what happens to the attempt.",
  });

  const push = (entry: Log) => setLog((l) => [...l, entry]);
  const terminal = rec.status === "completed" || rec.status === "dead" || rec.status === "cancelled";
  const leasedLive = rec.status === "leased" && !rec.leaseExpired;
  const holderUp = leasedLive && rec.workerAlive;
  const claimable =
    rec.status === "queued" || (rec.status === "failed" && rec.retryAfter !== null) || (rec.status === "leased" && rec.leaseExpired);

  function claim() {
    const n = rec.workers + 1;
    const worker = `worker-${n}`;
    const attempt = rec.attempt + 1;
    const why =
      rec.status === "leased"
        ? "The old lease expired, so the claim query treats the task as visible again."
        : rec.status === "failed"
          ? `The backoff (${sec(rec.retryAfter ?? 0)}) has elapsed, so next_attempt_at is in the past.`
          : "A queued task is always claimable.";
    setRec({ ...rec, status: "leased", attempt, owner: worker, workerAlive: true, leaseExpired: false, retryAfter: null, workers: n });
    push({ t: `${worker} claims → leased, attempt ${attempt}, lease 30 s`, tone: "accent" });
    setCaption({
      title: `Attempt ${attempt}: ${worker} holds the lease`,
      text: `${why} Claiming increments the attempt counter. The worker's SDK heartbeats every lease / 3, 10 s for the default 30 s lease.`,
    });
  }

  function heartbeat() {
    push({ t: `${rec.owner} heartbeat → 200, lease extended 30 s`, tone: "green" });
    setCaption({
      title: "Heartbeat renews the lease",
      text: "renew_lease moves expires_at to now + lease_ms. Only the current holder can do this; anyone else gets 409.",
    });
  }

  function kill() {
    setRec({ ...rec, workerAlive: false });
    push({ t: `${rec.owner} SIGKILLed: no more heartbeats`, tone: "red" });
    setCaption({
      title: "The worker died holding the lease",
      text: "The server isn't told. Nothing reports a failure, so nothing is classified. The record still says leased, and it stays that way until expires_at passes.",
    });
  }

  function expire() {
    setRec({ ...rec, leaseExpired: true });
    push({ t: `lease of ${rec.owner} expires → claimable again`, tone: "amber" });
    setCaption({
      title: "Lease expired: the task is visible again",
      text: "claimable_at returns true for a leased task whose expires_at is in the past. The next claim takes it as a new attempt. If the old worker comes back, its heartbeat, complete, and fail calls all answer 409.",
    });
  }

  function complete() {
    setRec({ ...rec, status: "completed", owner: null, workerAlive: false });
    push({ t: `${rec.owner} complete → completed (attempt ${rec.attempt})`, tone: "green" });
    setCaption({
      title: "Completed",
      text: rec.errorClass
        ? `Terminal. The record keeps error_class = ${rec.errorClass} from the earlier attempt as history of what the task survived.`
        : "Terminal. The result and any effect receipt are stored on the record.",
    });
  }

  function fail() {
    const u = SAMPLES[rec.draws % SAMPLES.length];
    const d = classify(idempotent, cls, rec.attempt, u);
    const who = rec.owner;
    const base = { ...rec, owner: null, workerAlive: false, errorClass: cls, draws: rec.draws + 1 };
    if (d.kind === "retry") {
      setRec({ ...base, status: "failed", retryAfter: d.afterMs });
      push({ t: `${who} fail(${cls}) → Retry { after_ms: ${d.afterMs} }`, tone: "amber" });
      setCaption({
        title: `Retry ${rec.attempt}: wait ${sec(d.afterMs)}`,
        text: `All three gates pass: the effect is freely repeatable, ${cls} is retryable, and attempt ${rec.attempt} < ${MAX_ATTEMPTS}. The delay is drawn uniformly from [0, ${sec(d.window)}] (this draw: ${u.toFixed(2)}). Status becomes failed with next_attempt_at set.`,
      });
    } else if (d.kind === "dead") {
      setRec({ ...base, status: "dead", retryAfter: null });
      push({ t: `${who} fail(${cls}) → Dead (dead-letter queue)`, tone: "red" });
      setCaption({
        title: "Dead-lettered",
        text: `The failure was retryable, but attempt ${rec.attempt} ≥ max_attempts ${MAX_ATTEMPTS}. The task moves to status dead: never claimable again, listed by GET /tasks?status=dead with its error_class and last_error.`,
      });
    } else {
      const cancelled = cls === "cancelled";
      setRec({ ...base, status: cancelled ? "cancelled" : "failed", retryAfter: null });
      push({ t: `${who} fail(${cls}) → Fail${cancelled ? " (cancelled)" : ""}`, tone: "red" });
      setCaption({
        title: cancelled ? "Cancelled: control flow, not failure" : "Failed outright, not dead-lettered",
        text: !idempotent
          ? "The effect gate runs first. A NonIdempotent task is never retried silently, whatever the class: a timed-out charge may already have happened. next_attempt_at stays null and the DLQ stays empty."
          : cancelled
            ? "Cancelled is never retried and never dead-lettered. The record lands in the terminal cancelled state."
            : "invalid_input is never retried: the same bytes fail the same way. The task ends failed with next_attempt_at null. It isn't dead-lettered, because re-driving the same input can't help.",
      });
    }
  }

  function reset() {
    setRec(FRESH);
    setLog([{ t: "POST /tasks → queued, attempt 0, max_attempts 3", tone: "plain" }]);
    setCaption({ title: "A queued task", text: "Nobody holds it yet. Claim it with a worker, then choose what happens to the attempt." });
  }

  const statusColor =
    rec.status === "completed" ? D.green : rec.status === "dead" || rec.status === "cancelled" ? D.red : rec.status === "failed" ? D.amber : D.accentSoft;
  const statusText =
    rec.status === "failed"
      ? rec.retryAfter !== null
        ? `failed · retry in ${sec(rec.retryAfter)}`
        : "failed · terminal"
      : rec.status === "leased" && rec.leaseExpired
        ? "leased · expired, claimable"
        : rec.status;

  const fields: [string, string][] = [
    ["status", statusText],
    ["attempt", `${rec.attempt} / ${MAX_ATTEMPTS}`],
    ["lease.owner", rec.status === "leased" ? `${rec.owner}${rec.workerAlive ? "" : " (dead)"}` : "null"],
    ["effect", idempotent ? "idempotent" : "non_idempotent"],
    ["error_class", rec.errorClass ?? "null"],
  ];

  return (
    <DiagramFrame label="One durable task · lease, heartbeat, retry" caption={caption} captionTone={rec.status === "dead" ? "bad" : "plain"}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(236,150,96,.16)", background: D.card }}>
            <div className="mb-2 font-code text-[10.5px] uppercase tracking-[0.12em] text-[#8b837b]">Task record</div>
            <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 font-code text-[12.5px]">
              {fields.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-[#8b837b]">{k}</dt>
                  <dd className="m-0 break-words" style={{ color: k === "status" ? statusColor : D.ink }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap gap-1.5" aria-label="Attempts">
            {Array.from({ length: Math.max(MAX_ATTEMPTS, rec.attempt) }, (_, i) => {
              const n = i + 1;
              const past = n < rec.attempt || (n === rec.attempt && rec.status !== "leased");
              const current = n === rec.attempt && rec.status === "leased";
              return (
                <span
                  key={n}
                  className="rounded-md border px-2.5 py-1 font-code text-[11.5px]"
                  style={{
                    borderColor: current ? D.accent : past ? "rgba(236,150,96,.3)" : "rgba(236,150,96,.12)",
                    color: current ? D.accentSoft : past ? D.body : D.dim,
                    background: current ? "rgba(240,134,43,.1)" : "transparent",
                  }}
                >
                  attempt {n}
                  {n > MAX_ATTEMPTS ? " (lease reclaim)" : ""}
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Toggle on={!idempotent} onClick={() => setIdempotent(!idempotent)}>
              Declared effect: {idempotent ? "idempotent" : "non_idempotent"}
            </Toggle>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button className={btn} disabled={!claimable} onClick={claim} style={{ borderColor: "rgba(240,134,43,.5)", color: "#ffe2cb", background: claimable ? "rgba(240,134,43,.12)" : "transparent" }}>
              {rec.status === "failed" && rec.retryAfter !== null ? "Wait out backoff, claim" : "Worker claims"}
            </button>
            <button className={btn} disabled={!holderUp} onClick={heartbeat} style={{ borderColor: "rgba(159,212,168,.35)", color: D.green }}>
              Heartbeat
            </button>
            <button className={btn} disabled={!holderUp} onClick={complete} style={{ borderColor: "rgba(159,212,168,.35)", color: D.green }}>
              Complete
            </button>
            <button className={btn} disabled={!holderUp} onClick={kill} style={{ borderColor: "rgba(240,154,128,.4)", color: D.red }}>
              Kill worker
            </button>
            <button className={btn} disabled={!(leasedLive && !rec.workerAlive)} onClick={expire} style={{ borderColor: "rgba(245,183,116,.4)", color: D.amber }}>
              Let lease expire
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 font-code text-[12.5px] text-[#cfc3b8]">
              fail as
              <select
                value={cls}
                onChange={(e) => setCls(e.target.value as ErrorClass)}
                className="rounded-md border bg-[#0d0908] px-2 py-1.5 font-code text-[12.5px] text-[#f7ece4]"
                style={{ borderColor: "rgba(236,150,96,.25)" }}
                aria-label="Error class"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button className={btn} disabled={!holderUp} onClick={fail} style={{ borderColor: "rgba(240,154,128,.4)", color: D.red }}>
              Report failure
            </button>
            <span className="flex-1" />
            <button className={btn} onClick={reset} style={{ borderColor: "rgba(236,150,96,.22)", color: "#d8ccc0" }}>
              {terminal ? "New task" : "Reset"}
            </button>
          </div>

          <ol
            className="m-0 flex max-h-[190px] list-none flex-col gap-1 overflow-y-auto rounded-xl border p-3 font-code text-[12px]"
            style={{ borderColor: "rgba(236,150,96,.12)", background: "rgba(0,0,0,.2)" }}
            aria-label="Event log"
          >
            {log.map((e, i) => (
              <li key={i} className="break-words" style={{ color: TONE[e.tone] }}>
                <span className="text-[#6f675f]">{String(i + 1).padStart(2, "0")} </span>
                {e.t}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">
        Decisions use classify_retry's gates and the floor constants (base 1 s, cap 5 min, 3 attempts). Jitter draws are fixed here so the widget replays; the server draws them from the OS.
      </p>
    </DiagramFrame>
  );
}
