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
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HomeLiveScores />
        </div>
      </section>

      {/* 3. Sports Hub + Trending Intel — bento layout */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </section>

      {/* 4. Stats Band — trust metrics */}
      <StatsBand />

      {/* 5. Origin Story — editorial */}
      <OriginStory />

      {/* 6. Covenant / Values */}
      <CovenantValues />

      {/* 7. Arcade Spotlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display text-white mb-10 uppercase tracking-wide">
            <span className="text-gradient-brand">Arcade</span>
          </h2>
          <ArcadeSpotlight />
        </div>
      </section>

      {/* 8. Final CTA */}
      <CtaSection />

      <Footer />
    </main>
  );
}
