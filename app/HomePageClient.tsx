'use client';

import { HeroScoreStrip } from '@/components/home/HeroScoreStrip';
import { HomeAskSection } from '@/components/home/HomeAskSection';
import { FlagshipProof } from '@/components/home/FlagshipProof';
import { HomeFreshness } from '@/components/home/HomeFreshness';
import { Footer } from '@/components/layout-ds/Footer';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Nav Cards — product entry points (Labs-style nav grid)
// ---------------------------------------------------------------------------

const NAV_CARDS = [
  { title: 'Leaderboards', subtitle: 'Savant batting & pitching', href: '/college-baseball/savant/', icon: '◈' },
  { title: 'Rankings', subtitle: 'National + conference', href: '/college-baseball/rankings/', icon: '▲' },
  { title: 'Live Scores', subtitle: 'Every D1 game', href: '/scores/', icon: '⚾' },
  { title: 'Visuals', subtitle: '16 interactive tools', href: '/college-baseball/savant/visuals/', icon: '◆' },
  { title: 'Bubble Watch', subtitle: 'Tournament projections', href: '/college-baseball/savant/bubble/', icon: '◉' },
  { title: 'Ask BSI', subtitle: 'AI-powered analysis', href: '/ask/', icon: '✦' },
];

export function HomePageClient() {
  return (
    <div className="min-h-screen">
      {/* Compact hero — tagline + live score strip */}
      <div className="px-4 md:px-6 pt-6 pb-2">
        <div className="mb-4">
          <h1
            className="text-2xl md:text-3xl font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-hero)', color: 'var(--bsi-bone)' }}
          >
            Blaze Sports Intel
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--font-body)' }}>
            College baseball sabermetrics, live scores, and scouting — the grown-up analytics platform.
          </p>
        </div>

        <DataErrorBoundary name="ScoreStrip" compact>
          <HeroScoreStrip />
        </DataErrorBoundary>
      </div>

      {/* Product nav grid */}
      <div className="px-4 md:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {NAV_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-start gap-3 px-4 py-3 rounded-sm transition-all"
              style={{
                background: 'var(--surface-dugout)',
                border: '1px solid var(--border-vintage)',
              }}
            >
              <span
                className="text-lg mt-0.5 shrink-0"
                style={{ color: 'var(--bsi-primary)' }}
              >
                {card.icon}
              </span>
              <div className="min-w-0">
                <span
                  className="text-sm font-bold uppercase tracking-wider block group-hover:text-[var(--bsi-primary)] transition-colors"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
                >
                  {card.title}
                </span>
                <span className="text-[10px] font-mono block mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
                  {card.subtitle}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Ask BSI — inline, compact */}
      <div className="px-4 md:px-6 py-2">
        <HomeAskSection />
      </div>

      {/* Live data proof — leaderboard + editorial */}
      <div className="px-4 md:px-6 py-2">
        <FlagshipProof />
      </div>

      {/* Trending intel */}
      <div className="px-4 md:px-6 py-2">
        <DataErrorBoundary name="Freshness">
          <HomeFreshness />
        </DataErrorBoundary>
      </div>

      <div className="px-4 md:px-6 pt-4 pb-8">
        <Footer />
      </div>
    </div>
  );
}
