import { PublicHeader } from "@/components/public/PublicHeader";
import { HeroSection } from "@/components/public/HeroSection";
import { StatsSection } from "@/components/public/StatsSection";
import { FeaturesSection } from "@/components/public/FeaturesSection";
import { TeamSection } from "@/components/public/TeamSection";
import { FinalCTA } from "@/components/public/FinalCTA";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function HomePage() {
  return (
    <main>
      <PublicHeader />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TeamSection />
      <FinalCTA />
      <PublicFooter />
    </main>
  );
}
