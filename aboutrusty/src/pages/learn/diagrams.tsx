import type { ComponentType } from "react";
import { RunSequence } from "@/components/diagrams/RunSequence";
import { RoutingFlow } from "@/components/diagrams/RoutingFlow";
import { DeltaChain, ForkTree } from "@/components/diagrams/CheckpointDiagrams";
import { CrashTimeline, InterruptSequence } from "@/components/diagrams/LessonSequences";
import { ReplayDiagram } from "@/components/diagrams/ReplayDiagram";
import { CanaryDraw, ShadowFilter } from "@/components/diagrams/DeployDiagrams";
import { SuperStepWidget } from "./widgets/SuperStepWidget";
import { ReducerLab } from "@/components/diagrams/lessons-a/ReducerLab";
import { RoutingLab } from "@/components/diagrams/lessons-a/RoutingLab";
import { SendFanout } from "@/components/diagrams/lessons-a/SendFanout";
import { JournalExplorer } from "@/components/diagrams/lessons-a/JournalExplorer";
import { LeaseTimeline } from "@/components/diagrams/lessons-b/LeaseTimeline";
import { CapsuleGrants } from "@/components/diagrams/lessons-b/CapsuleGrants";
import { CowSnapshot } from "@/components/diagrams/lessons-b/CowSnapshot";
import { FailureCompare } from "@/components/diagrams/lessons-c/FailureCompare";
import { BspRounds } from "@/components/diagrams/lessons-c/BspRounds";
import { SnapshotIsolation } from "@/components/diagrams/lessons-d/SnapshotIsolation";
import { ReactCycle } from "@/components/diagrams/lessons-d/ReactCycle";

/** Diagrams and interactives that lesson content can place by name. */
export const LESSON_DIAGRAMS: Record<string, ComponentType> = {
  "run-sequence": RunSequence,
  "super-step": SuperStepWidget,
  routing: RoutingFlow,
  "fork-tree": ForkTree,
  "delta-chain": DeltaChain,
  "interrupt-sequence": InterruptSequence,
  "crash-timeline": CrashTimeline,
  replay: ReplayDiagram,
  "canary-draw": CanaryDraw,
  "shadow-filter": ShadowFilter,
  "reducer-lab": ReducerLab,
  "routing-lab": RoutingLab,
  "send-fanout": SendFanout,
  "journal-explorer": JournalExplorer,
  "lease-timeline": LeaseTimeline,
  "capsule-grants": CapsuleGrants,
  "cow-snapshot": CowSnapshot,
  "failure-compare": FailureCompare,
  "bsp-rounds": BspRounds,
  "snapshot-isolation": SnapshotIsolation,
  "react-cycle": ReactCycle,
};
