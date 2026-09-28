import type { ComponentType } from "react";
import { RunSequence } from "@/components/diagrams/RunSequence";
import { RoutingFlow } from "@/components/diagrams/RoutingFlow";
import { DeltaChain, ForkTree } from "@/components/diagrams/CheckpointDiagrams";
import { CrashTimeline, InterruptSequence } from "@/components/diagrams/LessonSequences";
import { ReplayDiagram } from "@/components/diagrams/ReplayDiagram";
import { CanaryDraw, ShadowFilter } from "@/components/diagrams/DeployDiagrams";
import { SuperStepWidget } from "./widgets/SuperStepWidget";

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
};
