import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionHeading } from "./SectionHeading";

interface ComponentRow {
  piece: string;
  path: string;
  description: string;
}

const COMPONENTS: ComponentRow[] = [
  {
    piece: "Rusty Core",
    path: "rusty-core/ (rusty-agent-runtime)",
    description:
      "The engine: state channels + reducers, graph builder, super-step executor, checkpoints (memory / JSON file / Postgres), interrupts, Send fan-out, prebuilt ReAct agent, MCP client, remote nodes, WASM nodes, Flight Recorder (run journal + exact replay). No HTTP.",
  },
  {
    piece: "Rusty Server",
    path: "rusty-server/",
    description:
      "axum HTTP/SSE server: threads, background / blocking / streaming runs, checkpoint history, fork + replay, assistants, crons, KV store, multi-tenant API-key auth.",
  },
  {
    piece: "Rusty Worker",
    path: "rusty-worker/",
    description:
      "Worker SDK: serves your node handlers over HTTP so RemoteNode can execute them remotely.",
  },
  {
    piece: "Rusty OTel",
    path: "rusty-otel/",
    description:
      "One-call tracing subscriber setup with optional OTLP span export.",
  },
  {
    piece: "Rusty Studio",
    path: "studio/",
    description:
      "Zero-build debug UI: connect, run, stream, inspect state and checkpoint history, fork and replay, Flight Recorder timeline with causal path and branch compare.",
  },
  {
    piece: "Rusty SDKs",
    path: "sdks/python/ · sdks/typescript/",
    description:
      "Zero-dependency rusty_client (Python) and @rusty-runtime/client (TypeScript) clients for the server API.",
  },
];

export function ComponentsTable() {
  return (
    <section className="border-y bg-card">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHeading
          eyebrow="Components"
          title="Four crates, a studio, and two SDKs."
          description="Packages version independently. The crates are implemented but not yet published to any registry — crates.io / npm / PyPI publishing is on the R1.0 roadmap."
        />
        <div className="mt-14 overflow-x-auto rounded-lg border bg-background/70">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40 font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Piece
                </TableHead>
                <TableHead className="w-64 font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Path
                </TableHead>
                <TableHead className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  What it is
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPONENTS.map((row) => (
                <TableRow key={row.piece}>
                  <TableCell className="align-top text-sm font-medium">
                    {row.piece}
                  </TableCell>
                  <TableCell className="align-top font-code text-[11px] text-muted-foreground">
                    {row.path}
                  </TableCell>
                  <TableCell className="align-top text-sm leading-relaxed text-muted-foreground">
                    {row.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            to="/learn/studio"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Studio in depth
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/learn/server-quickstart"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Serve your first graph
            <ArrowRight size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
