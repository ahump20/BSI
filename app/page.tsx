import Link from 'next/link';
import { HomeLiveScores, SportHubCards, TrendingIntelFeed, ArcadeSpotlight } from '@/components/home';
import { HeroVideo } from '@/components/hero/HeroVideo';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description:
    'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics. Live scores, predictions, and data-driven insights.',
};

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-midnight pt-24 md:pt-28">
      {/* Hero Section — Cinematic Video (compact) */}
      <section className="relative pt-8 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[50vh] flex items-center">
        <HeroVideo />

        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(13,13,18,0.85) 0%, rgba(13,13,18,0.4) 40%, rgba(13,13,18,0.7) 85%, rgba(13,13,18,1) 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary mb-6">
            <span className="live-indicator__dot" style={{ width: 6, height: 6 }} />
            <span className="live-indicator__label">Real-Time Sports Intelligence</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display text-white mb-6 tracking-tight uppercase">
            BORN TO BLAZE THE
            <br />
            <span className="text-gradient-brand">PATH LESS BEATEN</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            Every game matters to someone. MLB, NFL, NBA, College Baseball, NCAA Football — real
            analytics, not just scores. Built by a fan who got tired of waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn-primary px-8 py-4 text-lg rounded-lg"
            >
              Launch Dashboard
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary px-8 py-4 text-lg rounded-lg"
            >
              View Pricing
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="live-indicator">
              <span className="live-indicator__dot" />
              <span className="live-indicator__label">LIVE</span>
            </span>
            <span className="text-white/50 text-sm">Data streaming from official sources</span>
          </div>
        </div>
      </section>

      {/* Live Scores Hub */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-charcoal/50">
        <div className="max-w-7xl mx-auto">
          <HomeLiveScores />
        </div>
      </section>

      {/* Sports Hub + Trending Intel */}
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

      {/* Arcade Spotlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-charcoal/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display text-white mb-10 uppercase tracking-wide">
            <span className="text-gradient-brand">Arcade</span>
          </h2>
          <ArcadeSpotlight />
        </div>
      </section>

      <Footer />
    </main>
  );
}
