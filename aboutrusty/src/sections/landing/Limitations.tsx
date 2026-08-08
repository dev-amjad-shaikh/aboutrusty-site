import { Link } from "react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

interface Limitation {
  title: string;
  body: string;
}

const LIMITATIONS: Limitation[] = [
  {
    title: "Single-node executor.",
    body: "One process runs the super-step loop. Remote nodes distribute node work, but the executor itself is not clustered and has no failover.",
  },
  {
    title: "No durable queue.",
    body: "Queued runs live in an in-memory per-thread FIFO; a server restart drops pending (not-yet-started) runs. Durable queues and autoscaling are open R1.0 items.",
  },
  {
    title: "Persistence is single-node.",
    body: "The core executor checkpoints only when you attach a Checkpointer; InMemoryCheckpointer is for dev/test and loses state on restart. On the server, checkpoints and the assistants / crons / KV store default to JSON files on local disk — Postgres requires the postgres feature, and there is no replication either way.",
  },
  {
    title: "Idempotency contract.",
    body: "Checkpoints happen at step boundaries, never mid-node: resume re-executes a node from its start, so node logic must be idempotent.",
  },
  {
    title: "Open by default in dev.",
    body: "With no API keys configured the server runs unauthenticated, and its CORS layer is permissive — restrict both before exposing it to a network.",
  },
];

export function Limitations() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="Known limitations"
        title="What v0.x is not."
        description="Rusty is explicit about its current edges. We would rather you know them now than discover them in production."
      />
      <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-xl border border-l-2 border-l-warning bg-card">
        <div className="flex items-center gap-3 border-b px-6 py-5 sm:px-8">
          <AlertTriangle
            size={15}
            strokeWidth={2}
            aria-hidden="true"
            className="text-warning"
          />
          <span className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-warning">
            Known limitations
          </span>
        </div>
        <ul className="divide-y">
          {LIMITATIONS.map((item) => (
            <li key={item.title} className="flex gap-3 px-6 py-5 sm:px-8">
              <AlertTriangle
                size={13}
                strokeWidth={2}
                aria-hidden="true"
                className="mt-1 shrink-0 text-warning/70"
              />
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {item.title}
                </span>{" "}
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <div className="border-t px-6 py-5 sm:px-8">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              Deliberately rejected:
            </span>{" "}
            PyO3 / napi-rs bindings and a cdylib / C ABI — the HTTP/SSE server
            is the polyglot interop layer instead.
          </p>
          <p className="mt-4">
            <Link
              to="/learn/roadmap-and-stability"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              The full stability contract and R1.0 roadmap
              <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
