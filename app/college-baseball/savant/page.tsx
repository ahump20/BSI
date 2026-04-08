'use client';

import dynamic from 'next/dynamic';

const SavantHubClient = dynamic(
  () => import('./SavantHubClient'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen grain-overlay" style={{ background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
        <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <p className="heritage-stamp mb-4">BSI Savant</p>
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--bsi-font-display-hero)' }}>
            College Baseball Sabermetrics
          </h1>
          <p className="font-serif text-lg mb-8" style={{ color: 'var(--bsi-dust)' }}>
            Park-adjusted wOBA, wRC+, FIP, expected stats, conference strength index, and HAV-F scouting grades for 330 D1 programs. Updated every 6 hours.
          </p>
          <noscript>
            <p>This page requires JavaScript to display live sabermetric leaderboards and player analytics.</p>
          </noscript>
        </div>
      </div>
    ),
  }
);

export default function SavantPage() {
  return <SavantHubClient />;
}
