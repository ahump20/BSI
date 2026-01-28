'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

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

type CategoryType = 'passing' | 'rushing' | 'receiving' | 'defense';
type StatType = string;

const passingStats = [
  { id: 'passYards', label: 'Passing Yards' },
  { id: 'passTD', label: 'Passing TDs' },
  { id: 'qbr', label: 'QB Rating' },
  { id: 'completionPct', label: 'Completion %' },
];

const rushingStats = [
  { id: 'rushYards', label: 'Rushing Yards' },
  { id: 'rushTD', label: 'Rushing TDs' },
  { id: 'yardsPerCarry', label: 'Yards/Carry' },
];

const receivingStats = [
  { id: 'receptions', label: 'Receptions' },
  { id: 'recYards', label: 'Receiving Yards' },
  { id: 'recTD', label: 'Receiving TDs' },
];

const defenseStats = [
  { id: 'tackles', label: 'Tackles' },
  { id: 'sacks', label: 'Sacks' },
  { id: 'interceptions', label: 'Interceptions' },
];

export default function NFLStatsPage() {
  const [leaders, setLeaders] = useState<Record<string, StatLeader[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [category, setCategory] = useState<CategoryType>('passing');
  const [selectedStat, setSelectedStat] = useState<StatType>('passYards');

  const fetchLeaders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nfl/stats/leaders?category=${category}&stat=${selectedStat}`);
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

  useEffect(() => {
    // Update default stat when category changes
    const defaultStats: Record<CategoryType, string> = {
      passing: 'passYards',
      rushing: 'rushYards',
      receiving: 'receptions',
      defense: 'tackles',
    };
    setSelectedStat(defaultStats[category]);
  }, [category]);

  const currentStats =
    category === 'passing'
      ? passingStats
      : category === 'rushing'
        ? rushingStats
        : category === 'receiving'
          ? receivingStats
          : defenseStats;

  const currentLeaders = leaders[`${category}-${selectedStat}`] || [];

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

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{leader.player.name}</p>
        <p className="text-xs text-text-tertiary">{leader.player.team || 'NFL'}</p>
      </div>

      <div className="text-right">
        <p
          className={`text-2xl font-bold font-mono ${
            rank === 1 ? 'text-burnt-orange' : 'text-white'
          }`}
        >
          {leader.value}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nfl"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Stats Leaders</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                2024-25 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                NFL Stat Leaders
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                League leaders in passing, rushing, receiving, and defense. Updated throughout the
                season.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-6 flex-wrap">
              {(['passing', 'rushing', 'receiving', 'defense'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all capitalize ${
                    category === cat
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

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

            {loading ? (
              <Card variant="default" padding="lg">
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-graphite rounded-lg">
                        <Skeleton variant="rect" width={40} height={40} className="rounded-full" />
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
                  <p className="text-text-secondary">No data available for this stat.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {currentLeaders.map((leader) => (
                  <LeaderCard key={leader.rank} leader={leader} rank={leader.rank} />
                ))}
              </div>
            )}

            {meta && !error && (
              <p className="text-text-tertiary text-xs text-center mt-6">
                Data from {meta.dataSource} • Last updated{' '}
                {new Date(meta.lastUpdated).toLocaleString('en-US', {
                  timeZone: 'America/Chicago',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}{' '}
                CT
              </p>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
