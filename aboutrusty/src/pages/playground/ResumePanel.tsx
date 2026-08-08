import { useState } from "react";
import { ShieldQuestion } from "lucide-react";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RESUME_SNIPPET } from "./engine";
import { InstrumentHeader } from "./chrome";

interface ResumePanelProps {
  interrupt: unknown;
  checkpointId: string | undefined;
  onResume: (value: unknown) => void;
}

/**
 * The run is parked: the approve node returned Err(ctx.interrupt(payload)),
 * the in-flight step was discarded wholesale, and the suspension checkpoint
 * re-scheduled the entire active set. Type the human's decision and resume —
 * the node re-executes from its start with ctx.resume_value() set.
 */
export function ResumePanel({ interrupt, checkpointId, onResume }: ResumePanelProps) {
  const [reviewer, setReviewer] = useState("alice");

  const resume = (approved: boolean) => {
    onResume({ approved, reviewer: reviewer.trim() || "you" });
  };

  return (
    <Card className="gap-0 rounded-lg border-warning/40 bg-warning/10 py-0">
      <InstrumentHeader
        label={
          <span className="flex items-center gap-2">
            <ShieldQuestion size={13} className="text-warning" />
            Interrupt — human input required
          </span>
        }
        description="An interrupt is a transaction abort with a receipt: the step's writes were discarded and the suspension checkpoint re-scheduled the whole active set. This is where the run is parked."
        tone="warning"
        pulse
        className="border-warning/20"
        right={
          <Badge
            variant="outline"
            className="border-warning/40 bg-warning/10 font-code text-[10px] text-warning"
          >
            {checkpointId ?? "suspended"}
          </Badge>
        }
      />
      <CardContent className="space-y-4 py-4">
        <pre className="bg-code overflow-x-auto rounded-lg border border-white/10 p-3 font-code text-[11px] leading-relaxed">
          {JSON.stringify(interrupt, null, 2)}
        </pre>

        <CodeBlock code={RESUME_SNIPPET} language="rust" title="approve node — check ctx.resume_value() FIRST" />

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="reviewer name"
            className="h-8 w-36 border-border bg-background font-code text-xs focus-visible:ring-primary/40"
            aria-label="Reviewer name"
          />
          <Button size="sm" onClick={() => resume(true)}>
            Resume — approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => resume(false)}>
            Resume — reject
          </Button>
          <span className="font-code text-[10px] text-muted-foreground">
            sent as RunConfig::with_resume(&#123;"approved": …&#125;)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
