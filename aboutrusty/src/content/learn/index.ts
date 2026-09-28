import type { Lesson } from "./types";
import { superStepLoop } from "./superStepLoop";
import { checkpoints } from "./checkpoints";
import { interrupts } from "./interrupts";
import { crashRecovery } from "./crashRecovery";
import { deterministicReplay } from "./deterministicReplay";
import { canaryAndShadow } from "./canaryAndShadow";
import { stateChannels } from "./stateChannels";
import { routing } from "./routing";
import { runJournal } from "./runJournal";
import { leasesRetries } from "./leasesRetries";
import { capsules } from "./capsules";
import { sendSync } from "./sendSync";

/** Written lessons, in course order. */
export const lessons: Lesson[] = [
  stateChannels,
  superStepLoop,
  routing,
  checkpoints,
  interrupts,
  leasesRetries,
  crashRecovery,
  runJournal,
  deterministicReplay,
  canaryAndShadow,
  capsules,
  sendSync,
];

export function getLesson(slug: string | undefined): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

/** Old article slugs from the previous Learn section, mapped to where their
 * topic lives now. Keeps links from elsewhere on the site working. */
export const LEGACY_SLUGS: Record<string, string> = {
  architecture: "/learn/super-step-loop",
  "human-in-the-loop": "/learn/interrupts",
  "flight-recorder": "/learn/deterministic-replay",
  "durable-work-fabric": "/learn/crash-recovery",
  "server-quickstart": "/docs",
  studio: "/docs",
  "roadmap-and-stability": "/releases",
  "capability-planes": "/guide/06-skills.html",
};
