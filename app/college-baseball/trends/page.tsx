'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { ScrollReveal } from '@/components/cinematic';
import { TrendChart } from '@/components/college-baseball/TrendChart';
import { SimulationWidget } from '@/components/college-baseball/SimulationWidget';
import { formatTimestamp } from '@/lib/utils/timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface ConferencePowerRanking {
  rank: number;
  conference: string;
  avgRPI: number;
  record: string;
  trend: TrendDataPoint[];
}

interface TopMover {
  team: string;
  conference: string;
  previousRank: number;
  currentRank: number;
  change: number;
  scoringTrend: TrendDataPoint[];
}

interface SeasonProjection {
  team: string;
  conference: string;
  projectedWins: number;
  projectedLosses: number;
  cwsProbability: number;
  conferenceChampProbability: number;
  simulations: { outcome: string; probability: number }[];
}

interface TrendsData {
  conferencePowerRankings: ConferencePowerRanking[];
  topMovers: TopMover[];
  seasonProjections: SeasonProjection[];
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONFERENCES = [
  'All Conferences',
  'SEC',
  'ACC',
  'Big 12',
  'Big Ten',
  'Pac-12',
  'Big East',
  'AAC',
  'Sun Belt',
  'Mountain West',
  'Conference USA',
  'Colonial',
  'Missouri Valley',
  'West Coast',
  'Atlantic 10',
];

// ---------------------------------------------------------------------------
// Static params (required for static export)
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conferenceFilter, setConferenceFilter] = useState('All Conferences');

  useEffect(() => {
    async function fetchTrends() {
      try {
        setLoading(true);
        const res = await fetch('/api/college-baseball/trends');
        if (!res.ok) throw new Error(`Failed to fetch trends: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trends data');
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  // Filtered data based on conference selection
  const filteredPowerRankings = useMemo(() => {
    if (!data) return [];
    if (conferenceFilter === 'All Conferences') return data.conferencePowerRankings;
    return data.conferencePowerRankings.filter(
      (r) => r.conference === conferenceFilter
    );
  }, [data, conferenceFilter]);

  const filteredMovers = useMemo(() => {
    if (!data) return [];
    if (conferenceFilter === 'All Conferences') return data.topMovers;
    return data.topMovers.filter((m) => m.conference === conferenceFilter);
  }, [data, conferenceFilter]);

  const filteredProjections = useMemo(() => {
    if (!data) return [];
    if (conferenceFilter === 'All Conferences') return data.seasonProjections;
    return data.seasonProjections.filter(
      (p) => p.conference === conferenceFilter
    );
  }, [data, conferenceFilter]);

  return (
    <>
      <Section className="pt-8 pb-4">
        <Container>
          <ScrollReveal>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-text-primary">
                  Historical Trends
                </h1>
                <p className="font-serif text-lg text-text-secondary mt-2">
                  Conference analytics, momentum tracking, and season projections
                </p>
                {data?.meta && (
                  <p className="text-text-tertiary text-xs mt-1 font-mono">
                    Updated {formatTimestamp(data.meta.fetched_at)}
                  </p>
                )}
              </div>

              {/* Conference Filter */}
              <div className="shrink-0">
                <label
                  htmlFor="conference-filter"
                  className="sr-only"
                >
                  Filter by conference
                </label>
                <select
                  id="conference-filter"
                  value={conferenceFilter}
                  onChange={(e) => setConferenceFilter(e.target.value)}
                  className="bg-charcoal border border-border-subtle rounded-lg px-4 py-2 text-text-primary text-sm font-sans focus:outline-none focus:ring-2 focus:ring-burnt-orange/50 focus:border-burnt-orange appearance-none cursor-pointer"
                >
                  {CONFERENCES.map((conf) => (
                    <option key={conf} value={conf}>
                      {conf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Loading State */}
      {loading && (
        <Section className="pb-12">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-charcoal/50 border-border-subtle animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-graphite rounded w-3/4 mb-4" />
                    <div className="h-48 bg-graphite rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Error State */}
      {error && (
        <Section className="pb-12">
          <Container>
            <Card className="bg-charcoal/50 border-error/30">
              <CardContent className="p-6 text-center">
                <p className="text-error text-sm">{error}</p>
                <p className="text-text-tertiary text-xs mt-2">
                  Trends data will populate as the season progresses.
                </p>
              </CardContent>
            </Card>
          </Container>
        </Section>
      )}

      {/* Conference Power Rankings */}
      {!loading && !error && (
        <>
          <Section className="pb-8">
            <Container>
              <ScrollReveal>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-text-primary mb-6">
                  Conference Power Rankings
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPowerRankings.length > 0 ? (
                    filteredPowerRankings.map((ranking) => (
                      <Card
                        key={ranking.conference}
                        className="bg-charcoal/50 border-border-subtle hover:border-burnt-orange/30 transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-burnt-orange text-lg font-bold">
                                #{ranking.rank}
                              </span>
                              <CardTitle className="font-display text-lg uppercase">
                                {ranking.conference}
                              </CardTitle>
                            </div>
                            <Badge variant="secondary" size="sm">
                              {ranking.record}
                            </Badge>
                          </div>
                          <p className="text-text-tertiary text-xs font-mono mt-1">
                            Avg RPI: {ranking.avgRPI.toFixed(1)}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {ranking.trend.length > 0 && (
                            <TrendChart data={ranking.trend} height={160} />
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-charcoal/50 border-border-subtle col-span-full">
                      <CardContent className="p-6 text-center">
                        <p className="text-text-secondary text-sm">
                          No conference data available for the selected filter.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollReveal>
            </Container>
          </Section>

          {/* Top Movers */}
          <Section className="pb-8">
            <Container>
              <ScrollReveal>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-text-primary mb-6">
                  Top Movers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMovers.length > 0 ? (
                    filteredMovers.map((mover) => (
                      <Card
                        key={mover.team}
                        className="bg-charcoal/50 border-border-subtle hover:border-burnt-orange/30 transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="font-display text-base uppercase">
                              {mover.team}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono text-sm font-bold ${
                                  mover.change > 0
                                    ? 'text-success'
                                    : mover.change < 0
                                      ? 'text-error'
                                      : 'text-text-secondary'
                                }`}
                              >
                                {mover.change > 0 ? '+' : ''}
                                {mover.change}
                              </span>
                              <Badge variant="secondary" size="sm">
                                {mover.conference}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-text-tertiary text-xs font-mono">
                              #{mover.previousRank}
                            </span>
                            <svg
                              className="w-3 h-3 text-text-tertiary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                            <span className="text-text-primary text-xs font-mono font-bold">
                              #{mover.currentRank}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {mover.scoringTrend.length > 0 && (
                            <TrendChart data={mover.scoringTrend} height={120} />
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-charcoal/50 border-border-subtle col-span-full">
                      <CardContent className="p-6 text-center">
                        <p className="text-text-secondary text-sm">
                          No movers data available for the selected filter.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollReveal>
            </Container>
          </Section>

          {/* Season Projections */}
          <Section className="pb-16">
            <Container>
              <ScrollReveal>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-text-primary mb-6">
                  Season Projections
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredProjections.length > 0 ? (
                    filteredProjections.map((projection) => (
                      <Card
                        key={projection.team}
                        className="bg-charcoal/50 border-border-subtle hover:border-burnt-orange/30 transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="font-display text-base uppercase">
                              {projection.team}
                            </CardTitle>
                            <Badge variant="secondary" size="sm">
                              {projection.conference}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-text-secondary text-xs font-mono">
                              Proj: {projection.projectedWins}-{projection.projectedLosses}
                            </span>
                            <span className="text-burnt-orange text-xs font-mono font-bold">
                              CWS: {(projection.cwsProbability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <SimulationWidget
                            teamName={projection.team}
                            simulations={projection.simulations}
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-charcoal/50 border-border-subtle col-span-full">
                      <CardContent className="p-6 text-center">
                        <p className="text-text-secondary text-sm">
                          No projection data available for the selected filter.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollReveal>
            </Container>
          </Section>

          {/* Data Attribution */}
          <Section className="pb-8">
            <Container>
              <div className="border-t border-border-subtle pt-4 flex items-center justify-between">
                <span className="text-text-tertiary text-[10px] font-mono">
                  Monte Carlo simulations | D1 historical data | BSI Analytics Engine
                </span>
                <span className="text-text-tertiary text-[10px] font-mono">
                  {data?.meta?.source ?? 'bsi-historical-db'}
                </span>
              </div>
            </Container>
          </Section>
        </>
      )}

      <Footer />
    </>
  );
}
