'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SportTabs, SportTabsCompact, type Sport } from '@/components/sports/SportTabs';
import { LiveScoresPanel } from '@/components/sports/LiveScoresPanel';
import { StandingsTable } from '@/components/sports/StandingsTable';
import { LiveBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const [activeSport, setActiveSport] = useState<Sport>('nfl');

  return (
    <main id="main-content" className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-fixed bg-midnight/80 backdrop-blur-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/images/logo/blaze-logo.png"
                alt="Blaze Sports Intel"
                className="h-10 w-auto"
              />
              <span className="font-display text-xl text-white tracking-wide hidden sm:inline">
                BLAZE SPORTS INTEL
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <LiveBadge />
              <Link href="/pricing" className="btn-primary text-sm">
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display text-white mb-2">COMMAND CENTER</h1>
            <p className="text-white/60">
              Real-time scores, standings, and analytics across all leagues
            </p>
          </div>

          {/* Sport Tabs - Desktop */}
          <div className="hidden md:block mb-8">
            <SportTabs defaultSport={activeSport} onSportChange={setActiveSport} />
          </div>

          {/* Sport Tabs - Mobile */}
          <div className="md:hidden mb-6">
            <SportTabsCompact defaultSport={activeSport} onSportChange={setActiveSport} />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scores Section - 2 columns */}
            <div className="lg:col-span-2">
              <LiveScoresPanel sport={activeSport} />
            </div>

            {/* Standings Section - 1 column */}
            <div>
              <StandingsTable sport={activeSport} limit={5} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-label">Live Games</div>
              <div className="stat-value text-success">2</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Today&apos;s Games</div>
              <div className="stat-value">8</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Refresh Rate</div>
              <div className="stat-value text-burnt-orange">30s</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Data Source</div>
              <div className="stat-value text-info text-base">Official</div>
            </div>
          </div>

          {/* Data Attribution */}
          <div className="mt-8 text-center text-xs text-white/40">
            <p>
              Data sourced from official league APIs. Updated every 30 seconds during live games.
            </p>
            <p className="mt-1">
              MLB via statsapi.mlb.com | NFL via ESPN | NBA via NBA.com | NCAA via NCAA.org
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
