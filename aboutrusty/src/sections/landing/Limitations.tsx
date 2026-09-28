import { Link } from "react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Kicker, Reveal, SectionTitle } from "./home/primitives";

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
    title: "No autoscaling yet.",
    body: "Queued runs persist on enqueue (one file per run / the server_pending_runs table, both store backends) and resume draining after a restart — the durable-queue R1.0 gate landed 2026-08-12. Autoscaling workers remains an open R1.0 item.",
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
    <section className="mx-auto max-w-[1240px] px-7">
      <Reveal
        className="flex flex-col gap-10 border-t py-[90px]"
        style={{ borderColor: "rgba(236,150,96,.10)" }}
      >
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <Kicker>07 · Known limitations</Kicker>
          <SectionTitle>What v0.x is not.</SectionTitle>
          <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
            Rusty is explicit about its current edges. We would rather you know
            them now than discover them in production.
          </p>
        </div>
        <div
          className="mx-auto w-full max-w-3xl overflow-hidden rounded-[14px] border"
          style={{
            borderColor: "rgba(236,150,96,.16)",
            background: "rgba(255,236,214,.03)",
            borderLeft: "2px solid rgba(245,183,116,.6)",
          }}
        >
          <div
            className="flex items-center gap-3 border-b px-6 py-5 sm:px-8"
            style={{ borderColor: "rgba(236,150,96,.10)" }}
          >
            <AlertTriangle
              size={15}
              strokeWidth={2}
              aria-hidden="true"
              className="text-warning"
            />
            <span className="font-code text-[10.5px] uppercase tracking-[0.16em] text-warning">
              Known limitations
            </span>
          </div>
          <ul className="m-0 list-none divide-y p-0" style={{ borderColor: "rgba(236,150,96,.10)" }}>
            {LIMITATIONS.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 px-6 py-5 sm:px-8"
                style={{ borderColor: "rgba(236,150,96,.10)" }}
              >
                <AlertTriangle
                  size={13}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-warning/70"
                />
                <p className="m-0 text-[15px] leading-[1.65] text-[#b8b0a8]">
                  <span className="font-normal text-[#f7ece4]">
                    {item.title}
                  </span>{" "}
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
          <div
            className="border-t px-6 py-5 sm:px-8"
            style={{ borderColor: "rgba(236,150,96,.10)" }}
          >
            <p className="m-0 text-[15px] leading-[1.65] text-[#b8b0a8]">
              <span className="font-normal text-[#f7ece4]">
                Deliberately rejected:
              </span>{" "}
              PyO3 / napi-rs bindings and a cdylib / C ABI — the HTTP/SSE server
              is the polyglot interop layer instead.
            </p>
            <p className="mb-0 mt-4">
              <Link
                to="/learn/roadmap-and-stability"
                className="inline-flex items-center gap-1.5 text-[15px] text-primary no-underline transition-colors hover:text-[#fb9a3f]"
              >
                The full stability contract and R1.0 roadmap
                <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
