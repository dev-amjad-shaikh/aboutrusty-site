import { Hero } from "@/sections/landing/home/Hero";
import { WhatItIs, WhyBuilt } from "@/sections/landing/home/WhatWhy";
import { HowItWorksHome } from "@/sections/landing/home/HowItWorksHome";
import { AnatomyOfRun } from "@/sections/landing/home/AnatomyOfRun";
import { PlatformStack } from "@/sections/landing/home/PlatformStack";
import { StudioShowcase } from "@/sections/landing/home/StudioShowcase";
import { WhyRust } from "@/sections/landing/home/WhyRust";
import { Compare } from "@/sections/landing/home/Compare";
import {
  GetStarted,
  Proof,
  ResearchTeaser,
  WhatsNew,
} from "@/sections/landing/home/Closing";

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <main className="mx-auto max-w-[1240px] px-7">
        <WhatItIs />
        <WhyBuilt />
        <HowItWorksHome />
        <AnatomyOfRun />
        <PlatformStack />
        <StudioShowcase />
        <WhyRust />
        <Compare />
        <ResearchTeaser />
        <WhatsNew />
        <Proof />
        <GetStarted />
      </main>
    </div>
  );
}
