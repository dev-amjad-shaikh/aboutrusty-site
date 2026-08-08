import { GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ThreadSim } from "./engine";
import { InstrumentHeader } from "./chrome";

interface BranchesPanelProps {
  threads: ThreadSim[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Threads = timelines. fork_thread copies a thread's history (oldest first,
 * up to the chosen checkpoint) into a new thread id; replay then runs from
 * that checkpoint's state and next-node set — two divergent histories.
 */
export function BranchesPanel({ threads, activeId, onSelect }: BranchesPanelProps) {
  const activeRunning = threads.some(
    (t) => t.id === activeId && t.status === "running",
  );
  return (
    <Card className="gap-0 rounded-lg py-0">
      <InstrumentHeader
        label={
          <span className="flex items-center gap-2">
            <GitBranch size={13} className="text-primary" />
            Timelines
          </span>
        }
        description="A thread namespaces checkpoints. Fork one at a checkpoint to branch history, then replay on the fork."
        tone={activeRunning ? "success" : threads.length > 1 ? "rust" : "muted"}
        pulse={activeRunning}
      />
      <CardContent className="py-4">
        <ol className="space-y-1.5">
          {threads.map((t) => {
            const active = t.id === activeId;
            // Divergence delta: how many checkpoints this fork has vs main.
            const delta =
              t.checkpoints.length -
              (threads.find((x) => x.persona === "main")?.checkpoints.length ??
                0);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelect(t.id)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-primary/60 bg-accent/20"
                      : "border-border bg-transparent hover:bg-secondary/60"
                  }`}
                >
                  <span className="font-code text-xs font-medium">{t.id}</span>
                  <Badge
                    variant={t.persona === "main" ? "secondary" : "default"}
                    className="font-code text-[10px]"
                  >
                    {t.persona === "main" ? "main" : "fork"}
                  </Badge>
                  {t.forkedFrom && (
                    <span className="min-w-0 truncate font-code text-[10px] text-muted-foreground">
                      from {t.forkedFrom.thread} @ {t.forkedFrom.checkpoint}
                    </span>
                  )}
                  {t.persona !== "main" && (
                    <span className="shrink-0 font-code text-[10px] text-primary">
                      {delta >= 0 ? "+" : ""}
                      {delta} cp vs main
                    </span>
                  )}
                  <span className="ml-auto shrink-0 font-code text-[10px] text-muted-foreground">
                    {t.checkpoints.length} cp · {t.status}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
