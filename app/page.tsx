import {
  HeroSection,
  StatsBand,
  HomeLiveScores,
  SportHubCards,
  TrendingIntelFeed,
  AboutSection,
  CtaSection,
  PersonaSwitch,
  PricingPreview,
  TransparencyBlock,
  IntelSignup,
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
      {/* 1. Hero — with live proof score strip */}
      <HeroSection />

      {/* 1.5. Trust metrics — animated counters */}
      <StatsBand />

      {/* 2. Start Here — persona-based entry points */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PersonaSwitch />
        </div>
      </section>

      {/* 3. Live Scores Hub — season-aware tabs */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HomeLiveScores />
        </div>
      </section>

      {/* 4. Sports Hub + Trending Intel — bento layout with email capture */}
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
              <IntelSignup />
              <TrendingIntelFeed />
            </div>
          </div>
        </div>
      </section>

      {/* 5. About — merged origin story + values */}
      <AboutSection />

      {/* 6. Pricing preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0D0D12]">
        <div className="max-w-7xl mx-auto">
          <PricingPreview />
        </div>
      </section>

      {/* 7. Data transparency */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0D0D12]">
        <div className="max-w-7xl mx-auto">
          <TransparencyBlock />
        </div>
      </section>

      {/* 8. Final CTA */}
      <CtaSection />

      <Footer />
    </main>
  );
}
