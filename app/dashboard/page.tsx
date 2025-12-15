'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SportTabs, SportTabsCompact, type Sport } from '@/components/sports/SportTabs';
import { LiveScoresPanel } from '@/components/sports/LiveScoresPanel';
import { StandingsTable } from '@/components/sports/StandingsTable';
import { LiveBadge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ScrollReveal } from '../../components/cinematic/ScrollReveal';
import { Navbar } from '../../components/layout-ds/Navbar';
import { Footer } from '../../components/layout-ds/Footer';

const dashboardNavItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball/' },
  { label: 'MLB', href: '/mlb/' },
  { label: 'NFL', href: '/nfl/' },
  { label: 'Pricing', href: '/pricing.html' },
];

export default function DashboardPage() {
  const [activeSport, setActiveSport] = useState<Sport>('nfl');

  return (
    <main id="main-content" className="min-h-screen">
      {/* Navbar */}
      <Navbar items={dashboardNavItems} />

      {/* Dashboard Content */}
      <Section padding="lg" className="pt-24">
        <Container size="wide">
          {/* Hero Section */}
          <ScrollReveal direction="up">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-display text-white mb-2">COMMAND CENTER</h1>
                <p className="text-white/60">
                  Real-time scores, standings, and analytics across all leagues
                </p>
              </div>
              <LiveBadge />
            </div>
          </ScrollReveal>

          {/* Sport Tabs - Desktop */}
          <ScrollReveal direction="up" delay={100}>
            <div className="hidden md:block mb-8">
              <SportTabs defaultSport={activeSport} onSportChange={setActiveSport} />
            </div>
          </ScrollReveal>

          {/* Sport Tabs - Mobile */}
          <div className="md:hidden mb-6">
            <SportTabsCompact defaultSport={activeSport} onSportChange={setActiveSport} />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scores Section - 2 columns */}
            <ScrollReveal direction="left" delay={200} className="lg:col-span-2">
              <LiveScoresPanel sport={activeSport} />
            </ScrollReveal>

            {/* Standings Section - 1 column */}
            <ScrollReveal direction="right" delay={300}>
              <StandingsTable sport={activeSport} limit={5} />
            </ScrollReveal>
          </div>

          {/* Quick Stats */}
          <ScrollReveal direction="up" delay={400}>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="stat-label">Live Games</div>
                <div className="stat-value text-success">2</div>
              </Card>
              <Card className="p-4">
                <div className="stat-label">Today&apos;s Games</div>
                <div className="stat-value">8</div>
              </Card>
              <Card className="p-4">
                <div className="stat-label">Refresh Rate</div>
                <div className="stat-value text-burnt-orange">30s</div>
              </Card>
              <Card className="p-4">
                <div className="stat-label">Data Source</div>
                <div className="stat-value text-info text-base">Official</div>
              </Card>
            </div>
          </ScrollReveal>

          {/* Data Attribution */}
          <div className="mt-8 text-center text-xs text-white/40">
            <p>
              Data sourced from official league APIs. Updated every 30 seconds during live games.
            </p>
            <p className="mt-1">
              MLB via statsapi.mlb.com | NFL via ESPN | NBA via NBA.com | NCAA via NCAA.org
            </p>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
