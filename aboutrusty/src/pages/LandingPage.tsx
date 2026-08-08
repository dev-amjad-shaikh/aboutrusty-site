import { ReelHero } from "@/sections/landing/hero/ReelHero";
import { SignalStrip } from "@/sections/landing/hero/SignalStrip";
import { WhyRusty } from "@/sections/landing/WhyRusty";
import { HowItWorks } from "@/sections/landing/HowItWorks";
import { FeatureGrid } from "@/sections/landing/FeatureGrid";
import { ComponentsTable } from "@/sections/landing/ComponentsTable";
import { Comparison } from "@/sections/landing/Comparison";
import { Limitations } from "@/sections/landing/Limitations";
import { FinalCta } from "@/sections/landing/FinalCta";

export default function LandingPage() {
  return (
    <div>
      <ReelHero />
      <SignalStrip />
      <div id="runtime">
        <WhyRusty />
      </div>
      <HowItWorks />
      <FeatureGrid />
      <Comparison />
      <ComponentsTable />
      <Limitations />
      <FinalCta />
    </div>
  );
}
