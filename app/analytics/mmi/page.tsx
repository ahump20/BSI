'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { MMIGauge } from '@/components/analytics/MMIGauge';
import { MMIMiniIndicator } from '@/components/analytics/MMIMiniIndicator';
import { useSportData } from '@/lib/hooks/useSportData';

interface TrendingGame {
  game_id: string;
  home_team: string;
  away_team: string;
  final_mmi: number;
  max_mmi: number;
  min_mmi: number;
  momentum_swings: number;
  biggest_swing: number;
  excitement_rating: number;
  sport: string;
}

interface TrendingResponse {
  data: TrendingGame[];
  meta: { source: string; fetched_at: string; timezone: string };
}

const methodologyWeights = [
  {
    abbr: 'SD',
    name: 'Score Differential',
    weight: '40%',
    description: 'Run lead or deficit, scaled by game phase.',
  },
  {
    abbr: 'RS',
    name: 'Recent Scoring',
    weight: '30%',
    description: 'Scoring activity in the last two innings.',
  },
  {
    abbr: 'GP',
    name: 'Game Phase',
    weight: '15%',
    description: 'Multiplier — late innings amplify leverage.',
  },
  {
    abbr: 'BS',
    name: 'Base Situation',
    weight: '15%',
    description: 'Runners on base and scoring position pressure.',
  },
];

function getExcitementLabel(rating: number): { label: string; variant: 'primary' | 'warning' | 'success' | 'secondary' } {
  if (rating >= 80) return { label: 'ELECTRIC', variant: 'primary' };
  if (rating >= 60) return { label: 'HIGH DRAMA', variant: 'warning' };
  if (rating >= 40) return { label: 'COMPETITIVE', variant: 'success' };
  return { label: 'ROUTINE', variant: 'secondary' };
}

function getMagnitude(value: number): 'low' | 'medium' | 'high' | 'extreme' {
  const abs = Math.abs(value);
  if (abs >= 75) return 'extreme';
  if (abs >= 50) return 'high';
  if (abs >= 25) return 'medium';
  return 'low';
}

export default function MMITrendingPage() {
  const { data, loading, error, retry } = useSportData<TrendingResponse>(
    '/api/analytics/mmi/trending'
  );

  const sortedGames = useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => b.biggest_swing - a.biggest_swing);
  }, [data]);

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Home
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/analytics"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Analytics
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Momentum Index</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Proprietary Index
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                Momentum Index (MMI)
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary text-lg max-w-2xl mb-8">
                Track in-game momentum shifts across college baseball. BSI&apos;s proprietary
                index measures scoring pressure, game phase, and base situations to quantify
                which team has the edge.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Methodology */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <Card variant="default" padding="lg">
                <h2 className="font-display text-xl uppercase tracking-wide font-semibold text-text-primary mb-4">
                  How It Works
                </h2>
                <p className="text-text-secondary text-sm mb-6 max-w-3xl">
                  The Momentum Magnitude Index combines four weighted signals into a single
                  value on a scale from <span className="font-mono text-[#6B8DB2]">-100</span> (full
                  away momentum) to <span className="font-mono text-burnt-orange">+100</span> (full
                  home momentum). Zero is neutral.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {methodologyWeights.map((w) => (
                    <div
                      key={w.abbr}
                      className="bg-surface-light border border-border rounded-lg p-4"
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-burnt-orange font-bold text-lg">
                          {w.weight}
                        </span>
                        <span className="font-display text-xs uppercase tracking-wider text-text-muted">
                          {w.abbr}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">{w.name}</p>
                      <p className="text-xs text-text-tertiary">{w.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Trending Games */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-text-primary">
                    Trending Games
                  </h2>
                  <p className="text-text-tertiary text-sm mt-1">
                    Today&apos;s most dramatic momentum shifts, sorted by biggest swing.
                  </p>
                </div>
                {data?.meta && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-text-muted">
                    <span className="font-medium">{data.meta.source}</span>
                    <span>|</span>
                    <span>{data.meta.fetched_at}</span>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Loading State */}
            {loading && (
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} variant="default" padding="lg">
                    <div className="animate-pulse space-y-4">
                      <div className="h-5 bg-surface-medium rounded w-2/3" />
                      <div className="h-14 bg-surface-light rounded-xl" />
                      <div className="flex gap-4">
                        <div className="h-4 bg-surface-light rounded w-24" />
                        <div className="h-4 bg-surface-light rounded w-28" />
                        <div className="h-4 bg-surface-light rounded w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card variant="default" padding="lg" className="text-center">
                <p className="text-error mb-4">{error}</p>
                <button
                  onClick={retry}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-burnt-orange text-white hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && sortedGames.length === 0 && (
              <Card variant="default" padding="lg" className="text-center">
                <p className="text-text-tertiary text-lg mb-2">
                  No momentum data available yet.
                </p>
                <p className="text-text-tertiary text-sm">
                  Check back during game days.
                </p>
              </Card>
            )}

            {/* Game Cards */}
            {!loading && !error && sortedGames.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {sortedGames.map((game, index) => {
                  const excitement = getExcitementLabel(game.excitement_rating);
                  const magnitude = getMagnitude(game.final_mmi);

                  return (
                    <ScrollReveal key={game.game_id} delay={index * 60}>
                      <Card
                        variant="hover"
                        padding="lg"
                        className="h-full"
                      >
                        {/* Game Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-text-primary">
                            {game.away_team} at {game.home_team}
                          </h3>
                          <Badge variant={excitement.variant} size="sm">
                            {excitement.label}
                          </Badge>
                        </div>

                        {/* Gauge */}
                        <MMIGauge
                          value={game.final_mmi}
                          awayTeam={game.away_team}
                          homeTeam={game.home_team}
                          magnitude={magnitude}
                          className="mb-4"
                        />

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-tertiary">Swings:</span>
                            <span className="font-mono font-bold text-text-primary tabular-nums">
                              {game.momentum_swings}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-tertiary">Biggest Swing:</span>
                            <span className="font-mono font-bold text-burnt-orange tabular-nums">
                              {game.biggest_swing.toFixed(1)}
                            </span>
                          </div>
                          <MMIMiniIndicator value={game.final_mmi} />
                        </div>
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
