import { Hero } from "@/sections/landing/home/Hero";
import { WhatItIs, WhyBuilt } from "@/sections/landing/home/WhatWhy";
import { HowItWorksHome } from "@/sections/landing/home/HowItWorksHome";
import { PlatformStack } from "@/sections/landing/home/PlatformStack";
import { StudioShowcase } from "@/sections/landing/home/StudioShowcase";
import { FeatureGrid } from "@/sections/landing/FeatureGrid";
import { Limitations } from "@/sections/landing/Limitations";
import { FinalCta } from "@/sections/landing/FinalCta";

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <main className="mx-auto max-w-[1240px] px-7">
        <WhatItIs />
        <WhyBuilt />
        <HowItWorksHome />
        <PlatformStack />
        <StudioShowcase />
      </main>
      <FeatureGrid />
      <Limitations />
      <FinalCta />
    </div>
  );
}
