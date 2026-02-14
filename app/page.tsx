import {
  HeroSection,
  HomeLiveScores,
  SportHubCards,
  TrendingIntelFeed,
  ArcadeSpotlight,
  StatsBand,
  OriginStory,
  CovenantValues,
  CtaSection,
} from '@/components/home';
import { Footer } from '@/components/layout-ds/Footer';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';

export const metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description:
    'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics. Live scores, predictions, and data-driven insights.',
};

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0D0D12]">
      {/* 1. Hero — cinematic video (desktop) / emblem (mobile) */}
      <HeroSection />

      {/* 2. Live Scores Hub */}
      <Section padding="lg">
        <Container>
          <HomeLiveScores />
        </Container>
      </Section>

      {/* 3. Sports Hub + Trending Intel — bento layout */}
      <Section padding="xl">
        <Container>
          <h2 className="text-3xl font-display text-white mb-10 uppercase tracking-wide">
            <span className="text-gradient-brand">Sports Hub</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SportHubCards />
            </div>
            <div className="lg:col-span-1">
              <TrendingIntelFeed />
            </div>
          </div>
        </Container>
      </Section>

      {/* 4. Stats Band — trust metrics */}
      <StatsBand />

      {/* 5. Origin Story — editorial */}
      <OriginStory />

      {/* 6. Covenant / Values */}
      <CovenantValues />

      {/* 7. Arcade Spotlight */}
      <Section padding="xl">
        <Container>
          <h2 className="text-3xl font-display text-white mb-10 uppercase tracking-wide">
            <span className="text-gradient-brand">Arcade</span>
          </h2>
          <ArcadeSpotlight />
        </Container>
      </Section>

      {/* 8. Final CTA */}
      <CtaSection />

      <Footer />
    </main>
  );
}
