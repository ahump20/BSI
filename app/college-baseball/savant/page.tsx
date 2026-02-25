'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import {
  SavantLeaderboard,
  BATTING_COLUMNS,
  PITCHING_COLUMNS,
} from '@/components/analytics/SavantLeaderboard';
import { ParkFactorTable } from '@/components/analytics/ParkFactorTable';
import { ConferenceStrengthChart } from '@/components/analytics/ConferenceStrengthChart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'batting' | 'pitching' | 'park-factors' | 'conference';

interface LeaderboardResponse {
  data: Record<string, unknown>[];
  meta: { source: string; fetched_at: string; timezone: string };
}

interface ParkFactorRow {
  team: string;
  venue_name: string | null;
  conference: string | null;
  runs_factor: number;
  hits_factor?: number;
  hr_factor?: number;
  sample_games: number;
}

interface ConferenceRow {
  conference: string;
  strength_index: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  is_power: number;
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS: { key: Tab; label: string }[] = [
  { key: 'batting', label: 'Batting' },
  { key: 'pitching', label: 'Pitching' },
  { key: 'park-factors', label: 'Park Factors' },
  { key: 'conference', label: 'Conference Strength' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SavantHubPage() {
  const [activeTab, setActiveTab] = useState<Tab>('batting');

  const { data: battingRes, loading: battingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=50');
  const { data: pitchingRes, loading: pitchingLoading } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=50');
  const { data: parkRes, loading: parkLoading } =
    useSportData<{ data: ParkFactorRow[] }>('/api/savant/park-factors');
  const { data: confRes, loading: confLoading } =
    useSportData<{ data: ConferenceRow[] }>('/api/savant/conference-strength');

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-white/40 hover:text-[#BF5700] transition-colors">
                  Home
                </Link>
                <span className="text-white/20">/</span>
                <Link
                  href="/college-baseball"
                  className="text-white/40 hover:text-[#BF5700] transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white/70">Savant</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">ADVANCED ANALYTICS</Badge>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-white">
                  College Baseball <span className="text-[#BF5700]">Savant</span>
                </h1>
                <p className="text-white/50 mt-3 max-w-2xl text-base leading-relaxed">
                  The metrics MLB Savant tracks — wOBA, FIP, wRC+, park factors, conference
                  strength indices — applied to 300+ D1 programs. No other public platform
                  does this for the college game.
                </p>
              </div>
            </ScrollReveal>

            {/* Methodology cards */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                <Card padding="md">
                  <span className="font-display text-2xl font-bold text-[#BF5700]">wOBA</span>
                  <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                    Weighted On-Base Average. Best single batting metric publicly available.
                  </p>
                </Card>
                <Card padding="md">
                  <span className="font-display text-2xl font-bold text-[#BF5700]">FIP</span>
                  <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                    Fielding Independent Pitching. Isolates what the pitcher controls.
                  </p>
                </Card>
                <Card padding="md">
                  <span className="font-display text-2xl font-bold text-[#BF5700]">wRC+</span>
                  <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                    Weighted Runs Created Plus. Park-adjusted, 100 = league average.
                  </p>
                </Card>
                <Card padding="md">
                  <span className="font-display text-2xl font-bold text-[#BF5700]">PF</span>
                  <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                    Park Factors. How venues inflate or suppress offense.
                  </p>
                </Card>
              </div>
            </ScrollReveal>

            {/* Tab navigation */}
            <ScrollReveal direction="up" delay={150}>
              <div className="flex items-center gap-1 border-b border-white/[0.06] mb-8 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-display uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? 'text-[#BF5700] border-[#BF5700]'
                        : 'text-white/30 border-transparent hover:text-white/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Tab content */}
            <ScrollReveal direction="up" delay={200}>
              {activeTab === 'batting' && (
                battingLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <SavantLeaderboard
                    data={battingRes?.data ?? []}
                    columns={BATTING_COLUMNS}
                    title="Batting Leaders — Advanced"
                    isPro={false}
                    initialRows={25}
                  />
                )
              )}

              {activeTab === 'pitching' && (
                pitchingLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <SavantLeaderboard
                    data={pitchingRes?.data ?? []}
                    columns={PITCHING_COLUMNS}
                    title="Pitching Leaders — Advanced"
                    isPro={false}
                    initialRows={25}
                  />
                )
              )}

              {activeTab === 'park-factors' && (
                parkLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <ParkFactorTable
                    data={parkRes?.data ?? []}
                    isPro={false}
                  />
                )
              )}

              {activeTab === 'conference' && (
                confLoading ? (
                  <LeaderboardSkeleton />
                ) : (
                  <ConferenceStrengthChart
                    data={confRes?.data ?? []}
                    isPro={false}
                  />
                )
              )}
            </ScrollReveal>

            {/* Data attribution */}
            {battingRes && (
              <div className="mt-8 text-center text-xs text-white/25">
                <p>
                  Source: BSI College Baseball Savant | Methodology:{' '}
                  <Link
                    href="/college-baseball/savant/park-factors"
                    className="text-[#BF5700] hover:text-[#FF6B35] transition-colors"
                  >
                    Park Factors
                  </Link>
                  {' · '}
                  <Link
                    href="/college-baseball/savant/conference-index"
                    className="text-[#BF5700] hover:text-[#FF6B35] transition-colors"
                  >
                    Conference Strength
                  </Link>
                </p>
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function LeaderboardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <div className="h-4 w-48 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
      </div>
      <div className="divide-y divide-white/[0.02]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4">
            <div className="h-4 w-6 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-4 flex-1 max-w-[200px] bg-white/[0.06] rounded animate-pulse" />
            <div className="h-4 w-16 bg-white/[0.04] rounded animate-pulse hidden sm:block" />
            <div className="h-4 w-12 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-4 w-12 bg-white/[0.04] rounded animate-pulse hidden md:block" />
          </div>
        ))}
      </div>
    </Card>
  );
}
