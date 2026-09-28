import { useState } from "react";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { RESUME_SNIPPET, type Checkpoint, type ThreadSim } from "./engine";
import { Btn, Json } from "./chrome";
import { C } from "./tokens";

function isHalt(v: unknown): boolean {
  return typeof v === "object" && v !== null && "rusty.halted" in v;
}

/**
 * What the caller does next when a run stops early: answer an interrupt,
 * continue past the step ceiling, or retry after an error.
 */
export function ResumePanel({
  thread,
  latest,
  fault,
  onResume,
  onContinue,
}: {
  thread: ThreadSim;
  latest: Checkpoint | undefined;
  /** The option that makes the step fail, while it is still on. */
  fault: string | null;
  onResume: (value: unknown) => void;
  onContinue: () => void;
}) {
  const [reviewer, setReviewer] = useState("amjad");

  if (thread.status === "error" && thread.error) {
    return (
      <Box tone={C.red} title={`Run failed · ${thread.error.kind}`}>
        <p className="m-0 break-words font-code text-[12px] leading-[1.6] text-[#f09a80]">{thread.error.message}</p>
        <p className="m-0 text-[15px] leading-[1.6] text-[#cfc3b8]">
          The failed step left no trace in the state and wrote no checkpoint.{" "}
          {latest
            ? `The latest checkpoint is still ${latest.id} at step ${latest.step}, so a new run with that checkpoint id starts the failed step again.`
            : "There is no checkpoint yet, so a new run starts from the entry point."}
          {fault && ` Uncheck "${fault}" first, or the step fails the same way.`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Btn primary onClick={onContinue}>
            {latest ? `Retry from ${latest.id}` : "Run again"}
          </Btn>
          {latest && <code className="break-all font-code text-[11.5px] text-[#8b837b]">RunConfig::new("{thread.id}").with_checkpoint_id("{latest.id}")</code>}
        </div>
      </Box>
    );
  }

  if (thread.status !== "interrupted") return null;

  if (isHalt(thread.interrupt)) {
    return (
      <Box tone={C.amber} title="Suspended at the step ceiling">
        <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words font-code text-[11.5px] leading-[1.55] text-[#cfc3b8]">
          <Json value={thread.interrupt} />
        </pre>
        <p className="m-0 text-[15px] leading-[1.6] text-[#cfc3b8]">
          The run kept its work. Checkpoint {latest?.id} holds the state and the next-node set, and a new run from it gets a fresh
          step budget.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Btn primary onClick={onContinue}>
            Continue from {latest?.id}
          </Btn>
          <code className="break-all font-code text-[11.5px] text-[#8b837b]">RunConfig::new("{thread.id}").with_checkpoint_id("{latest?.id}")</code>
        </div>
      </Box>
    );
  }

  return (
    <Box tone={C.amber} title={`Interrupted · waiting for a person · checkpoint ${latest?.id ?? ""}`}>
      <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words font-code text-[11.5px] leading-[1.55] text-[#cfc3b8]">
        <Json value={thread.interrupt} />
      </pre>
      <p className="m-0 text-[15px] leading-[1.6] text-[#cfc3b8]">
        Nothing from step {latest?.step} was kept, including the audit entry log_request wrote. The suspension checkpoint schedules
        both nodes again. When you answer, both run from the start and both see your answer in{" "}
        <code className="font-code text-[13.5px] text-[#ffc7a6]">ctx.resume_value()</code>.
      </p>
      <CodeBlock code={RESUME_SNIPPET} language="rust" title="the approve node" />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 font-code text-[12px] text-[#8b837b]">
          reviewer
          <input
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            className="w-32 rounded-lg border bg-transparent px-2.5 py-1.5 font-code text-[12.5px] text-[#f7ece4] outline-none focus:border-[rgba(240,134,43,.6)]"
            style={{ borderColor: "rgba(236,150,96,.3)" }}
          />
        </label>
        <Btn primary onClick={() => onResume({ approved: true, reviewer: reviewer.trim() || "reviewer" })}>
          Approve
        </Btn>
        <Btn onClick={() => onResume({ approved: false, reviewer: reviewer.trim() || "reviewer" })}>Reject</Btn>
      </div>
      <code className="break-all font-code text-[11.5px] text-[#8b837b]">
        RunConfig::new("{thread.id}").with_resume(json!({"{"}"approved": …{"}"}))
      </code>
    </Box>
  );
}

function Box({ tone, title, children }: { tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border p-4" style={{ borderColor: `${tone}66`, background: `${tone}0d` }}>
      <span className="font-code text-[10.5px] uppercase tracking-[0.14em]" style={{ color: tone }}>
        {title}
      </span>
      {children}
    </div>
  );
}
