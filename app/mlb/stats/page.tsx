'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSportData } from '@/lib/hooks/useSportData';
import { formatTimestamp } from '@/lib/utils/timezone';
import type { DataMeta } from '@/lib/types/data-meta';

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
  const [category, setCategory] = useState<CategoryType>('batting');
  const [selectedStat, setSelectedStat] = useState<StatType>('avg');

  const { data: rawData, loading, error, retry: fetchLeaders } = useSportData<{ leaders?: StatLeader[]; meta?: DataMeta }>(
    `/api/mlb/stats/leaders?category=${category}&stat=${selectedStat}`
  );

  const meta = rawData?.meta ?? null;

  // Cache leaders by category-stat key so switching back preserves data
  useEffect(() => {
    if (rawData?.leaders) {
      setLeaders((prev) => ({ ...prev, [`${category}-${selectedStat}`]: rawData.leaders! }));
    }
  }, [rawData, category, selectedStat]);

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
      className={`flex items-center gap-4 p-4 rounded-sm ${
        rank === 1
          ? 'bg-[var(--bsi-primary)]/10 border border-[var(--bsi-primary)]'
          : rank <= 3
            ? 'bg-[var(--surface-dugout)]'
            : 'bg-[var(--surface-dugout)]'
      }`}
    >
      {/* Rank */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          rank === 1
            ? 'bg-[var(--bsi-primary)] text-white'
            : rank === 2
              ? 'bg-gold/20 text-gold'
              : rank === 3
                ? 'bg-texas-soil/20 text-texas-soil'
                : 'bg-[var(--surface-dugout)] text-[rgba(196,184,165,0.5)]'
        }`}
      >
        {rank}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--bsi-bone)] truncate">{leader.player.name}</p>
        <p className="text-xs text-[rgba(196,184,165,0.5)]">{leader.player.team}</p>
      </div>

      {/* Stat Value */}
      <div className="text-right">
        <p
          className={`text-2xl font-bold font-mono ${
            rank === 1 ? 'text-[var(--bsi-primary)]' : 'text-[var(--bsi-bone)]'
          }`}
        >
          {currentStatConfig?.format(leader.value as number) || leader.value}
        </p>
        {leader.supportingStats && (
          <p className="text-xs text-[rgba(196,184,165,0.5)]">
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
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                MLB
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">Stats Leaders</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                2026 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-[var(--bsi-primary)] mb-4">
                MLB Stat Leaders
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-[var(--bsi-dust)] max-w-2xl">
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
                className={`px-6 py-2.5 rounded-sm font-semibold text-sm transition-all ${
                  category === 'batting'
                    ? 'bg-[var(--bsi-primary)] text-white'
                    : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)] hover:text-[var(--bsi-bone)]'
                }`}
              >
                Batting
              </button>
              <button
                onClick={() => setCategory('pitching')}
                className={`px-6 py-2.5 rounded-sm font-semibold text-sm transition-all ${
                  category === 'pitching'
                    ? 'bg-[var(--bsi-primary)] text-white'
                    : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)] hover:text-[var(--bsi-bone)]'
                }`}
              >
                Pitching
              </button>
            </div>

            {/* Stat Selector */}
            <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-[var(--border-vintage)]">
              {currentStats.map((stat) => (
                <button
                  key={stat.id}
                  onClick={() => setSelectedStat(stat.id)}
                  className={`px-4 py-2 rounded-sm text-sm transition-all ${
                    selectedStat === stat.id
                      ? 'bg-[var(--surface-press-box)] text-[var(--bsi-bone)] font-semibold border border-[var(--bsi-primary)]'
                      : 'text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
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
                      <div key={i} className="flex items-center gap-4 p-4 bg-[var(--surface-dugout)] rounded-sm">
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
                <p className="text-[var(--bsi-dust)] text-sm mt-1">{error}</p>
                <button
                  onClick={fetchLeaders}
                  className="mt-4 px-4 py-2 bg-[var(--bsi-primary)] text-white rounded-sm hover:bg-[var(--bsi-primary)]/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : currentLeaders.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-16 h-16 text-[rgba(196,184,165,0.5)] mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 3v18h18M8 17V9m4 8V5m4 12v-6" />
                  </svg>
                  <p className="text-[var(--bsi-dust)]">Stat leaders populate once the season starts</p>
                  <p className="text-[rgba(196,184,165,0.5)] text-sm mt-2">
                    Check back for batting, pitching, and fielding leaders
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
                        className="w-6 h-6 text-[var(--bsi-primary)]"
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
                      <button type="button" className="w-full mt-6 py-3 text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] font-semibold text-sm transition-colors">
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
                        className={`cursor-pointer transition-all hover:border-[var(--bsi-primary)] ${
                          selectedStat === stat.id ? 'border-[var(--bsi-primary)]' : ''
                        }`}
                        onClick={() => setSelectedStat(stat.id)}
                      >
                        <p className="text-[rgba(196,184,165,0.5)] text-xs uppercase tracking-wide mb-2">
                          {stat.label}
                        </p>
                        {topLeader ? (
                          <>
                            <p className="text-2xl font-bold text-[var(--bsi-primary)] font-mono">
                              {stat.format(topLeader.value as number)}
                            </p>
                            <p className="text-sm text-[var(--bsi-bone)] mt-1">{topLeader.player.name}</p>
                            <p className="text-xs text-[rgba(196,184,165,0.5)]">{topLeader.player.team}</p>
                          </>
                        ) : (
                          <p className="text-[rgba(196,184,165,0.5)] text-sm">Click to load</p>
                        )}
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-[var(--border-vintage)]">
              <DataSourceBadge
                source={meta?.dataSource || 'MLB Stats API'}
                timestamp={formatTimestamp(meta?.lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
