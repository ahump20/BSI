'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { HAVFLeaderboard } from '@/components/analytics/HAVFLeaderboard';
import { HAVFRadar } from '@/components/analytics/HAVFRadar';

interface HAVFPlayerAPI {
  player_id: string;
  player_name: string;
  team: string;
  position: string;
  conference: string;
  havf_composite: number;
  h_score: number;
  a_score: number;
  v_score: number;
  f_score: number;
}

interface HAVFLeaderboardResponse {
  data: HAVFPlayerAPI[];
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
  };
}

const METHODOLOGY = [
  { key: 'H', label: 'Hitting', weight: '30%', description: 'Contact quality, barrel rate, hard-hit rate, exit velocity percentile' },
  { key: 'A', label: 'At-Bat Quality', weight: '25%', description: 'Plate discipline, chase rate, walk rate, strikeout-to-walk ratio' },
  { key: 'V', label: 'Velocity', weight: '25%', description: 'Bat speed, sprint speed, arm strength, positional athleticism' },
  { key: 'F', label: 'Fielding', weight: '20%', description: 'Defensive runs saved, range factor, error rate, positioning' },
] as const;

export default function CollegeBaseballAnalyticsPage() {
  const { data: response, loading, error, retry } = useSportData<HAVFLeaderboardResponse>(
    '/api/analytics/havf/leaderboard?league=college-baseball&limit=50'
  );

  const players = useMemo(() => {
    if (!response?.data) return [];
    return response.data.map((p) => ({
      playerId: p.player_id,
      playerName: p.player_name,
      team: p.team,
      position: p.position,
      conference: p.conference,
      composite: p.havf_composite,
      hScore: p.h_score,
      aScore: p.a_score,
      vScore: p.v_score,
      fScore: p.f_score,
    }));
  }, [response]);

  const topPlayer = players[0] ?? null;

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link
                  href="/"
                  className="text-white/40 hover:text-[#BF5700] transition-colors"
                >
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
                <span className="text-white/70">Analytics</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">BSI PROPRIETARY</Badge>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-white">
                  HAV-F <span className="text-[#BF5700]">Analytics</span>
                </h1>
                <p className="text-white/50 mt-3 max-w-2xl text-base leading-relaxed">
                  BSI&apos;s proprietary player evaluation metric. Four measurable dimensions
                  compressed into a single composite score that tells you what batting
                  average and ERA alone never will.{' '}
                  <Link href="/models/havf" className="text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                    Read the full methodology &rarr;
                  </Link>
                </p>
                <p className="text-white/40 mt-2 text-sm">
                  Looking for wOBA, FIP, wRC+, park factors?{' '}
                  <Link href="/college-baseball/savant" className="text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                    College Baseball Savant &rarr;
                  </Link>
                </p>
              </div>
            </ScrollReveal>

            {/* Methodology */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                {METHODOLOGY.map((m) => (
                  <Card key={m.key} padding="md" className="group">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-display text-2xl font-bold text-[#BF5700]">
                        {m.key}
                      </span>
                      <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
                        {m.weight}
                      </span>
                    </div>
                    <p className="font-display text-xs uppercase tracking-widest text-white/60 mb-1">
                      {m.label}
                    </p>
                    <p className="text-[11px] text-white/30 leading-relaxed">
                      {m.description}
                    </p>
                  </Card>
                ))}
              </div>
            </ScrollReveal>

            {/* Leaderboard */}
            {loading ? (
              <ScrollReveal direction="up" delay={150}>
                <Card padding="none" className="overflow-hidden">
                  {/* Skeleton header */}
                  <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <div className="h-4 w-40 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                  {/* Skeleton rows */}
                  <div className="divide-y divide-white/[0.02]">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-4">
                        <div className="h-4 w-6 bg-white/[0.04] rounded animate-pulse" />
                        <div className="h-4 flex-1 max-w-[200px] bg-white/[0.06] rounded animate-pulse" />
                        <div className="h-4 w-16 bg-white/[0.04] rounded animate-pulse hidden sm:block" />
                        <div className="h-6 w-12 bg-white/[0.06] rounded-full animate-pulse ml-auto" />
                        <div className="h-[6px] w-16 bg-white/[0.04] rounded-full animate-pulse hidden md:block" />
                        <div className="h-[6px] w-16 bg-white/[0.04] rounded-full animate-pulse hidden md:block" />
                        <div className="h-[6px] w-16 bg-white/[0.04] rounded-full animate-pulse hidden md:block" />
                        <div className="h-[6px] w-16 bg-white/[0.04] rounded-full animate-pulse hidden md:block" />
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <div className="text-red-400 text-4xl mb-4 font-display">!</div>
                <h3 className="text-xl font-display font-semibold text-white mb-2 uppercase tracking-wide">
                  Error Loading Leaderboard
                </h3>
                <p className="text-white/40 mb-6 text-sm">{error}</p>
                <button
                  onClick={retry}
                  className="px-5 py-2 bg-[#BF5700]/20 text-[#BF5700] rounded-lg text-sm font-medium hover:bg-[#BF5700]/30 transition-colors"
                >
                  Try again
                </button>
              </Card>
            ) : players.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-white/20 text-4xl mb-4 font-display">--</div>
                <h3 className="text-xl font-display font-semibold text-white mb-2 uppercase tracking-wide">
                  No Player Data Available
                </h3>
                <p className="text-white/40 mb-6 text-sm">
                  HAV-F leaderboards populate once the season begins and game data flows through
                  the pipeline.
                </p>
                <button
                  onClick={retry}
                  className="px-5 py-2 bg-white/5 text-white/50 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Refresh
                </button>
              </Card>
            ) : (
              <>
                {/* Top player spotlight + leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                  {/* Radar for #1 ranked player */}
                  {topPlayer && (
                    <ScrollReveal direction="left" delay={150}>
                      <HAVFRadar
                        playerName={topPlayer.playerName}
                        scores={{
                          hitting: topPlayer.hScore,
                          atBatQuality: topPlayer.aScore,
                          velocity: topPlayer.vScore,
                          fielding: topPlayer.fScore,
                        }}
                        composite={topPlayer.composite}
                        className="lg:sticky lg:top-24"
                      />
                    </ScrollReveal>
                  )}

                  {/* Full leaderboard */}
                  <ScrollReveal direction="up" delay={200}>
                    <HAVFLeaderboard
                      players={players}
                      title="HAV-F Leaderboard — College Baseball"
                      showComponents
                      initialRows={25}
                    />
                  </ScrollReveal>
                </div>

                {/* Data attribution */}
                {response?.meta && (
                  <div className="mt-8 text-center text-xs text-white/25">
                    <p>
                      Source: {response.meta.source} | Last updated: {response.meta.fetched_at} | {response.meta.timezone}
                    </p>
                  </div>
                )}
              </>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
