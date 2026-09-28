import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BranchesPanel } from "./BranchesPanel";
import { CheckpointTimeline } from "./CheckpointTimeline";
import { ChromeStyles, InstrumentHeader } from "./chrome";
import { EventLog } from "./EventLog";
import { GraphView } from "./GraphView";
import { ResumePanel } from "./ResumePanel";
import { StateInspector } from "./StateInspector";
import { TransportControls } from "./TransportControls";
import {
  beginRun,
  computeSuperStep,
  createThread,
  forkThread,
  PHASES,
  SCENARIOS,
  type Checkpoint,
  type Phase,
  type RouteEdge,
  type ScenarioId,
  type StepComputation,
  type ThreadSim,
  type ThreadStatus,
} from "./engine";

type DriveMode = "idle" | "run" | "step";

/**
 * The Experience page: a self-contained, client-side simulation of Rusty's
 * engine semantics — super-steps, reducers, versioned checkpoints, HITL
 * interrupts, and fork/replay time travel. No backend; every run is
 * deterministic and scripted.
 */
export function PlaygroundPage() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("react");
  const [threads, setThreads] = useState<ThreadSim[]>(() => [
    createThread("react", "main", "main"),
  ]);
  const [activeId, setActiveId] = useState("main");
  const [selectedCpId, setSelectedCpId] = useState<string | null>(null);
  const [pending, setPending] = useState<StepComputation | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [mode, setMode] = useState<DriveMode>("idle");
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [firedRoutes, setFiredRoutes] = useState<RouteEdge[]>([]);
  const [routeAnimKey, setRouteAnimKey] = useState(0);
  // Bumped when a keyboard Run/Step no-ops (interrupted/done) — the Transport
  // status badge flashes briefly so the page doesn't feel broken.
  const [statusFlash, setStatusFlash] = useState(0);
  // Set when a fork is created — drives the "forked at step N" banner.
  const [lastFork, setLastFork] = useState<{ step: number; id: string } | null>(
    null,
  );

  const threadsRef = useRef(threads);
  threadsRef.current = threads;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const resumeRef = useRef<unknown>(undefined);
  const pauseRef = useRef(false);

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0];
  const def = SCENARIOS[scenarioId];
  const busy = mode !== "idle";

  const mutateActive = (fn: (t: ThreadSim) => ThreadSim) => {
    setThreads((prev) => prev.map((t) => (t.id === activeId ? fn(t) : t)));
  };

  // ------------------------------------------------------------- driver ---
  const commitStep = () => {
    if (!pending) return;
    const comp = pending;
    const keepRunning =
      mode === "run" && comp.outcome === "continue" && !pauseRef.current;
    mutateActive((t) => {
      let frames = t.frames;
      let seq = t.seq;
      if (comp.valuesFrame) {
        frames = [...frames, comp.valuesFrame];
        seq = comp.valuesFrame.seq;
      }
      if (comp.endFrame) {
        frames = [...frames, comp.endFrame];
        seq = comp.endFrame.seq;
      }
      const status: ThreadStatus =
        comp.outcome === "done"
          ? "done"
          : comp.outcome === "interrupted"
            ? "interrupted"
            : keepRunning
              ? "running"
              : "paused";
      return {
        ...t,
        checkpoints: [...t.checkpoints, comp.checkpoint],
        clock: comp.checkpoint.clock,
        frames,
        seq,
        status,
        step: comp.step + 1,
        interrupt: comp.outcome === "interrupted" ? comp.interrupt : undefined,
      };
    });
    setPending(null);
    setPhase(null);
    if (!keepRunning) setMode("idle");
    pauseRef.current = false;
  };

  useEffect(() => {
    if (mode === "idle") return;
    const base = speed === 2 ? 150 : 420;

    if (!pending) {
      // Between super-steps: plan the next one (or stop).
      const timer = setTimeout(
        () => {
          const thread = threadsRef.current.find((t) => t.id === activeId);
          if (
            !thread ||
            thread.next.length === 0 ||
            thread.status === "done" ||
            thread.status === "interrupted"
          ) {
            setMode("idle");
            return;
          }
          const comp = computeSuperStep(thread, resumeRef.current);
          resumeRef.current = undefined;
          setPending(comp);
          setPhase("plan");
          setFiredRoutes([]);
        },
        mode === "step" ? 0 : base * 0.6,
      );
      return () => clearTimeout(timer);
    }

    // Inside a super-step: advance one phase per tick.
    const idx = PHASES.indexOf(phase ?? "plan");
    const timer = setTimeout(
      () => {
        if (idx < PHASES.length - 1) {
          const nextPhase = PHASES[idx + 1];
          setPhase(nextPhase);
          if (nextPhase === "merge") {
            // Reducers merge the barrier-collected writes into the channels.
            mutateActive((t) => ({
              ...t,
              state: pending.mergedState,
              frames: [...t.frames, pending.updatesFrame],
              seq: pending.updatesFrame.seq,
            }));
          }
          if (nextPhase === "route") {
            mutateActive((t) => ({ ...t, next: pending.nextSet }));
            setFiredRoutes(pending.routes);
            setRouteAnimKey((k) => k + 1);
          }
        } else {
          commitStep();
        }
      },
      mode === "step" ? base * 0.45 : base,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pending, phase, speed, activeId]);

  // ----------------------------------------------------------- handlers ---
  const handleRun = () => {
    const t = threadsRef.current.find((x) => x.id === activeId);
    if (!t || busy || t.status === "done" || t.status === "interrupted") return;
    pauseRef.current = false;
    mutateActive((x) => (x.status === "idle" ? beginRun(x) : { ...x, status: "running" }));
    setMode("run");
  };

  const handleStep = () => {
    const t = threadsRef.current.find((x) => x.id === activeId);
    if (!t || busy || t.status === "done" || t.status === "interrupted") return;
    pauseRef.current = false;
    mutateActive((x) => (x.status === "idle" ? beginRun(x) : { ...x, status: "running" }));
    setMode("step");
  };

  const handlePause = () => {
    pauseRef.current = true;
    if (!pending) {
      setMode("idle");
      mutateActive((t) => (t.status === "running" ? { ...t, status: "paused" } : t));
    }
  };

  const resetAll = (sc: ScenarioId) => {
    setThreads([createThread(sc, "main", "main")]);
    setActiveId("main");
    setSelectedCpId(null);
    setPending(null);
    setPhase(null);
    setMode("idle");
    setFiredRoutes([]);
    setLastFork(null);
    resumeRef.current = undefined;
    pauseRef.current = false;
  };

  const handleReset = () => resetAll(scenarioId);

  const handleScenario = (sc: ScenarioId) => {
    if (sc === scenarioId || busy) return;
    // Switching scenario wipes every thread, fork, and checkpoint — confirm
    // first when there is something worth losing.
    if (
      threads.length > 1 &&
      !window.confirm(
        "Switch scenario? This discards the current run and its forks.",
      )
    ) {
      return;
    }
    setScenarioId(sc);
    resetAll(sc);
  };

  const handleResume = (value: unknown) => {
    resumeRef.current = value;
    pauseRef.current = false;
    mutateActive((t) => (t.status === "interrupted" ? beginRun(t) : t));
    setMode("run");
  };

  const handleFork = (cp: Checkpoint) => {
    const src = threadsRef.current.find((t) => t.id === activeId);
    if (!src || busy) return;
    const fork = forkThread(src, cp);
    setThreads((prev) => [...prev, fork]);
    setActiveId(fork.id);
    setSelectedCpId(null);
    setPending(null);
    setPhase(null);
    setMode("idle");
    setFiredRoutes([]);
    setLastFork({ step: cp.step, id: fork.id });
  };

  const handleSelectThread = (id: string) => {
    if (id === activeId || busy) return;
    setActiveId(id);
    setSelectedCpId(null);
    setPending(null);
    setPhase(null);
    setFiredRoutes([]);
  };

  // Keyboard: S = step one super-step, R = run / pause.
  const handlersRef = useRef({ step: handleStep, runToggle: handleRun });
  handlersRef.current = {
    step: handleStep,
    runToggle: activeThread.status === "running" ? handlePause : handleRun,
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "s" || e.key === "S") handlersRef.current.step();
      if (e.key === "r" || e.key === "R") {
        const t = threadsRef.current.find((x) => x.id === activeIdRef.current);
        if (t && (t.status === "interrupted" || t.status === "done")) {
          // The shortcut would silently no-op — flash the status badge instead.
          setStatusFlash((k) => k + 1);
          return;
        }
        handlersRef.current.runToggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ----------------------------------------------------------- derived ----
  const status = activeThread.status;
  const canRun = !busy && status !== "done" && status !== "interrupted";
  const canStep = canRun;
  const selectedCp =
    activeThread.checkpoints.find((c) => c.checkpoint_id === selectedCpId) ?? null;
  const activeNodes =
    pending && phase && PHASES.indexOf(phase) <= PHASES.indexOf("barrier")
      ? pending.active
      : [];
  const hasRun = activeThread.frames.length > 0 || activeThread.checkpoints.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ChromeStyles />
      {/* ------------------------------------------------------ intro ----- */}
      <header>
        <p className="font-code text-[10px] uppercase tracking-[0.2em] text-primary">
          Interactive simulation
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Feel the super-step loop
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
          This is a <strong className="text-foreground">browser simulation of the real
          engine semantics</strong> — a tiny, fully deterministic model of Rusty's
          Pregel/BSP (bulk-synchronous: nodes run in parallel rounds separated
          by a barrier) super-step loop, typed channels with reducers, versioned
          checkpoints at every step boundary, interrupts, and fork/replay time
          travel. No backend, no network, no randomness: every run is scripted
          so you can inspect each beat, then fork the timeline and watch it
          diverge — the same interrupts and fork/replay run over the real HTTP
          server and both SDKs.
        </p>
      </header>

      {/* --------------------------------------------- first-step hints --- */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-code text-[10px] text-muted-foreground">
        <span className="rounded-md border border-border bg-card px-2 py-1 tracking-wide">
          <span className="text-primary">①</span> Pick a scenario
        </span>
        <span aria-hidden="true" className="text-muted-foreground/50">—</span>
        <span className="rounded-md border border-border bg-card px-2 py-1 tracking-wide">
          <span className="text-primary">②</span> Press Run (R)
        </span>
        <span aria-hidden="true" className="text-muted-foreground/50">—</span>
        <span className="rounded-md border border-border bg-card px-2 py-1 tracking-wide">
          <span className="text-primary">③</span> Approve the interrupt
        </span>
        <span aria-hidden="true" className="text-muted-foreground/50">—</span>
        <span className="rounded-md border border-border bg-card px-2 py-1 tracking-wide">
          <span className="text-primary">④</span> Open Checkpoints and fork the timeline
        </span>
      </div>

      {/* ---------------------------------------------- scenario picker --- */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Object.values(SCENARIOS).map((sc) => {
          const selected = sc.id === scenarioId;
          return (
            <button
              key={sc.id}
              type="button"
              disabled={busy}
              onClick={() => handleScenario(sc.id)}
              className={`rounded-lg border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-primary/60 bg-accent/20 shadow-[0_0_24px_rgba(240,134,43,0.15)]"
                  : "border-border bg-card hover:border-muted-foreground/40 hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-code text-sm font-semibold">{sc.graphName}</span>
                {sc.channels.map((c) => (
                  <Badge
                    key={c.name}
                    variant="secondary"
                    className="font-code text-[10px]"
                    title={
                      c.reducer === "AddMessages"
                        ? "AddMessages reducer: upsert messages by id"
                        : "Overwrite reducer: last write wins"
                    }
                  >
                    {c.name}: {c.reducer}
                  </Badge>
                ))}
                {selected && (
                  <MousePointerClick size={14} className="ml-auto text-primary" />
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {sc.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interrupt: the one required action — full width, above the grid, so
          it's the first thing under the picker on mobile too. */}
      {status === "interrupted" && activeThread.interrupt !== undefined && (
        <div className="mt-6">
          <ResumePanel
            interrupt={activeThread.interrupt}
            checkpointId={
              activeThread.checkpoints[activeThread.checkpoints.length - 1]
                ?.checkpoint_id
            }
            onResume={handleResume}
          />
        </div>
      )}

      {/* ------------------------------------------------------ debugger -- */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* left rail: controls + graph + timelines */}
        <div className="space-y-6 lg:col-span-5">
          <TransportControls
            status={status}
            step={activeThread.step}
            phase={phase}
            speed={speed}
            canRun={canRun}
            canStep={canStep}
            busy={busy}
            hasRun={hasRun}
            flashSignal={statusFlash}
            onRun={handleRun}
            onPause={handlePause}
            onStep={handleStep}
            onReset={handleReset}
            onSpeed={setSpeed}
          />

          {lastFork && (
            <div className="rounded-lg border border-primary/40 bg-accent/20 px-3 py-2 font-code text-[11px] leading-relaxed text-accent-foreground">
              Forked at step {lastFork.step} — press Run: this replay re-plans
              from the checkpoint and is free to diverge from main.
            </div>
          )}

          <Card className="gap-0 rounded-lg py-0">
            <InstrumentHeader
              label="Graph"
              description="An agent is a graph over shared state — the cycle is re-scheduling across super-steps, not call-stack recursion."
              tone={activeNodes.length > 0 ? "rust" : "muted"}
              pulse={activeNodes.length > 0}
            />
            <CardContent className="py-4">
              <GraphView
                def={def}
                activeNodes={activeNodes}
                nextNodes={activeThread.next}
                firedRoutes={firedRoutes}
                routeAnimKey={routeAnimKey}
              />
            </CardContent>
          </Card>

          <BranchesPanel
            threads={threads}
            activeId={activeId}
            onSelect={handleSelectThread}
          />
        </div>

        {/* right rail: tabs (the resume panel lives above the grid) */}
        <div className="space-y-6 lg:col-span-7">
          <Tabs defaultValue="state">
            <TabsList className="border border-border bg-card">
              <TabsTrigger
                value="state"
                className="font-code text-[10px] uppercase tracking-[0.14em]"
              >
                State
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="font-code text-[10px] uppercase tracking-[0.14em]"
              >
                Events
              </TabsTrigger>
              <TabsTrigger
                value="checkpoints"
                className="font-code text-[10px] uppercase tracking-[0.14em]"
              >
                Checkpoints
              </TabsTrigger>
            </TabsList>

            <TabsContent value="state">
              <Card className="gap-0 rounded-lg py-0">
                <InstrumentHeader
                  label="State inspector"
                  description="Schema-declared JSON channels, merged by reducers at the barrier — validation is all-or-nothing before a single mutation is applied."
                  tone={status === "running" ? "success" : hasRun ? "rust" : "muted"}
                  pulse={status === "running"}
                />
                <CardContent className="py-4">
                  <StateInspector
                    def={def}
                    checkpoint={selectedCp}
                    liveState={activeThread.state}
                    hasRun={hasRun}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card className="gap-0 rounded-lg py-0">
                <InstrumentHeader
                  label="Event stream"
                  description={
                    <>
                      The SSE surface (Server-Sent Events — the real engine's
                      HTTP stream): metadata → updates → values → end frames,
                      each with a {"{checkpoint_id}:{step}:{seq}"} id.
                      Last-Event-ID lets a reconnected client skip frames it
                      already saw.
                    </>
                  }
                  tone={status === "running" ? "success" : hasRun ? "rust" : "muted"}
                  pulse={status === "running"}
                />
                <CardContent className="py-4">
                  <EventLog
                    frames={activeThread.frames}
                    threadId={activeThread.id}
                    speed={speed}
                    streaming={status === "running"}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checkpoints">
              <Card className="gap-0 rounded-lg py-0">
                <InstrumentHeader
                  label="Checkpoint history"
                  description="A versioned checkpoint at every super-step boundary: step index, full channel state, and the next-node set. One primitive — durability, HITL, time travel, recovery."
                  tone={
                    status === "running"
                      ? "success"
                      : activeThread.checkpoints.length > 0
                        ? "rust"
                        : "muted"
                  }
                  pulse={status === "running"}
                />
                <CardContent className="py-4">
                  <CheckpointTimeline
                    checkpoints={activeThread.checkpoints}
                    selectedId={selectedCpId}
                    canFork={!busy}
                    onSelect={setSelectedCpId}
                    onFork={handleFork}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="mt-8 space-y-2 text-center">
        <p className="font-code text-[11px] text-muted-foreground">
          Simulation, not a live server — interrupts, resume, and fork/replay
          work the same way over the real HTTP engine: cargo run --example
          server_demo, then open studio/index.html.
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <Link
            to="/docs?p=quickstart"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Run the real server
            <ArrowRight size={12} />
          </Link>
          <Link
            to="/docs?p=local"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Open Rusty Studio
            <ArrowRight size={12} />
          </Link>
        </p>
      </div>
    </div>
  );
}
