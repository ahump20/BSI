'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';

interface StatLeader {
  rank: number;
  player: {
    id: string;
    name: string;
    team: string;
    teamAbbr: string;
  };
  value: number | string;
  supportingStats?: Record<string, string | number>;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type CategoryType = 'batting' | 'pitching';
type StatType = string;
const battingStats = [
  { id: 'avg', label: 'Batting Average', format: (v: number) => v.toFixed(3).replace('0.', '.') },
  { id: 'hr', label: 'Home Runs', format: (v: number) => v.toString() },
  { id: 'rbi', label: 'RBI', format: (v: number) => v.toString() },
  { id: 'sb', label: 'Stolen Bases', format: (v: number) => v.toString() },
  { id: 'ops', label: 'OPS', format: (v: number) => v.toFixed(3) },
  { id: 'hits', label: 'Hits', format: (v: number) => v.toString() },
  { id: 'runs', label: 'Runs', format: (v: number) => v.toString() },
  { id: 'doubles', label: 'Doubles', format: (v: number) => v.toString() },
];

const pitchingStats = [
  { id: 'era', label: 'ERA', format: (v: number) => v.toFixed(2) },
  { id: 'wins', label: 'Wins', format: (v: number) => v.toString() },
  { id: 'so', label: 'Strikeouts', format: (v: number) => v.toString() },
  { id: 'saves', label: 'Saves', format: (v: number) => v.toString() },
  { id: 'whip', label: 'WHIP', format: (v: number) => v.toFixed(2) },
  { id: 'ip', label: 'Innings Pitched', format: (v: number) => v.toFixed(1) },
];

export default function MLBStatsPage() {
  const [leaders, setLeaders] = useState<Record<string, StatLeader[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [category, setCategory] = useState<CategoryType>('batting');
  const [selectedStat, setSelectedStat] = useState<StatType>('avg');

  const fetchLeaders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mlb/stats/leaders?category=${category}&stat=${selectedStat}`);
      if (!res.ok) throw new Error('Failed to fetch leaders');
      const data = (await res.json()) as { leaders?: StatLeader[]; meta?: DataMeta };

      if (data.leaders) {
        setLeaders((prev) => ({ ...prev, [`${category}-${selectedStat}`]: data.leaders }));
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, [category, selectedStat]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  // Update selectedStat when category changes
  useEffect(() => {
    if (category === 'batting') {
      setSelectedStat('avg');
    } else {
      setSelectedStat('era');
    }
  }, [category]);

  const currentStats = category === 'batting' ? battingStats : pitchingStats;
  const currentLeaders = leaders[`${category}-${selectedStat}`] || [];
  const currentStatConfig = currentStats.find((s) => s.id === selectedStat);

  const LeaderCard = ({ leader, rank }: { leader: StatLeader; rank: number }) => (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg ${
        rank === 1
          ? 'bg-burnt-orange/10 border border-burnt-orange'
          : rank <= 3
            ? 'bg-graphite'
            : 'bg-charcoal'
      }`}
    >
      {/* Rank */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          rank === 1
            ? 'bg-burnt-orange text-white'
            : rank === 2
              ? 'bg-gold/20 text-gold'
              : rank === 3
                ? 'bg-copper/20 text-copper'
                : 'bg-graphite text-text-tertiary'
        }`}
      >
        {rank}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{leader.player.name}</p>
        <p className="text-xs text-text-tertiary">{leader.player.team}</p>
      </div>

      {/* Stat Value */}
      <div className="text-right">
        <p
          className={`text-2xl font-bold font-mono ${
            rank === 1 ? 'text-burnt-orange' : 'text-white'
          }`}
        >
          {currentStatConfig?.format(leader.value as number) || leader.value}
        </p>
        {leader.supportingStats && (
          <p className="text-xs text-text-tertiary">
            {Object.entries(leader.supportingStats)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ')}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                MLB
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Stats Leaders</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                2025 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                MLB Stat Leaders
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                League leaders in batting, pitching, and fielding statistics. Updated daily
                throughout the season.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters & Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Category Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setCategory('batting')}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  category === 'batting'
                    ? 'bg-burnt-orange text-white'
                    : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                }`}
              >
                Batting
              </button>
              <button
                onClick={() => setCategory('pitching')}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  category === 'pitching'
                    ? 'bg-burnt-orange text-white'
                    : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                }`}
              >
                Pitching
              </button>
            </div>

            {/* Stat Selector */}
            <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-border-subtle">
              {currentStats.map((stat) => (
                <button
                  key={stat.id}
                  onClick={() => setSelectedStat(stat.id)}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    selectedStat === stat.id
                      ? 'bg-white/10 text-white font-semibold border border-burnt-orange'
                      : 'text-text-tertiary hover:text-white hover:bg-white/5'
                  }`}
                >
                  {stat.label}
                </button>
              ))}
            </div>

            {/* Leaders List */}
            {loading ? (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <Skeleton variant="text" width={200} height={24} />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-graphite rounded-lg">
                        <Skeleton variant="rectangular" width={40} height={40} className="rounded-full" />
                        <div className="flex-1">
                          <Skeleton variant="text" width={150} height={18} />
                          <Skeleton variant="text" width={100} height={14} className="mt-1" />
                        </div>
                        <Skeleton variant="text" width={60} height={28} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchLeaders}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : currentLeaders.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 3v18h18M8 17V9m4 8V5m4 12v-6" />
                  </svg>
                  <p className="text-text-secondary">No stat leaders available</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Leaders will be available when the 2025 season begins
                  </p>
                </div>
              </Card>
            ) : (
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-burnt-orange"
                        fill="currentColor"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      {currentStatConfig?.label} Leaders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentLeaders.map((leader, idx) => (
                        <LeaderCard key={leader.player.id} leader={leader} rank={idx + 1} />
                      ))}
                    </div>

                    {currentLeaders.length >= 10 && (
                      <button className="w-full mt-6 py-3 text-burnt-orange hover:text-ember font-semibold text-sm transition-colors">
                        View Full Leaderboard →
                      </button>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* Quick Stats Grid */}
            {!loading && !error && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
                {currentStats.slice(0, 4).map((stat) => {
                  const statLeaders = leaders[`${category}-${stat.id}`];
                  const topLeader = statLeaders?.[0];

                  return (
                    <ScrollReveal key={stat.id}>
                      <Card
                        variant="default"
                        padding="md"
                        className={`cursor-pointer transition-all hover:border-burnt-orange ${
                          selectedStat === stat.id ? 'border-burnt-orange' : ''
                        }`}
                        onClick={() => setSelectedStat(stat.id)}
                      >
                        <p className="text-text-tertiary text-xs uppercase tracking-wide mb-2">
                          {stat.label}
                        </p>
                        {topLeader ? (
                          <>
                            <p className="text-2xl font-bold text-burnt-orange font-mono">
                              {stat.format(topLeader.value as number)}
                            </p>
                            <p className="text-sm text-white mt-1">{topLeader.player.name}</p>
                            <p className="text-xs text-text-tertiary">{topLeader.player.team}</p>
                          </>
                        ) : (
                          <p className="text-text-tertiary text-sm">Click to load</p>
                        )}
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source={meta?.dataSource || 'MLB Stats API'}
                timestamp={formatTimestamp(meta?.lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
