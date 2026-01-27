'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

const ScrollReveal = dynamic(
  () => import('@/components/cinematic/ScrollReveal').then((mod) => mod.ScrollReveal),
  { ssr: false }
);

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

type CategoryType = 'scoring' | 'rebounds' | 'assists' | 'defense';
type StatType = string;

function formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return (
    date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' CT'
  );
}

const scoringStats = [
  { id: 'ppg', label: 'Points Per Game', format: (v: number) => v.toFixed(1) },
  { id: 'fgp', label: 'Field Goal %', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { id: '3pp', label: '3-Point %', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { id: 'ftp', label: 'Free Throw %', format: (v: number) => `${(v * 100).toFixed(1)}%` },
];

const reboundStats = [
  { id: 'rpg', label: 'Rebounds Per Game', format: (v: number) => v.toFixed(1) },
  { id: 'orpg', label: 'Offensive RPG', format: (v: number) => v.toFixed(1) },
  { id: 'drpg', label: 'Defensive RPG', format: (v: number) => v.toFixed(1) },
];

const assistStats = [
  { id: 'apg', label: 'Assists Per Game', format: (v: number) => v.toFixed(1) },
  { id: 'ast_to_ratio', label: 'AST/TO Ratio', format: (v: number) => v.toFixed(2) },
];

const defenseStats = [
  { id: 'spg', label: 'Steals Per Game', format: (v: number) => v.toFixed(1) },
  { id: 'bpg', label: 'Blocks Per Game', format: (v: number) => v.toFixed(1) },
];

const categoryToStats: Record<CategoryType, typeof scoringStats> = {
  scoring: scoringStats,
  rebounds: reboundStats,
  assists: assistStats,
  defense: defenseStats,
};

const defaultStats: Record<CategoryType, string> = {
  scoring: 'ppg',
  rebounds: 'rpg',
  assists: 'apg',
  defense: 'spg',
};

// Placeholder data for display before API loads
const placeholderLeaders: StatLeader[] = [
  {
    rank: 1,
    player: { id: '1', name: 'Luka Doncic', team: 'Dallas Mavericks', teamAbbr: 'DAL' },
    value: 33.9,
  },
  {
    rank: 2,
    player: { id: '2', name: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', teamAbbr: 'MIL' },
    value: 31.1,
  },
  {
    rank: 3,
    player: {
      id: '3',
      name: 'Shai Gilgeous-Alexander',
      team: 'Oklahoma City Thunder',
      teamAbbr: 'OKC',
    },
    value: 30.8,
  },
  {
    rank: 4,
    player: { id: '4', name: 'Joel Embiid', team: 'Philadelphia 76ers', teamAbbr: 'PHI' },
    value: 29.5,
  },
  {
    rank: 5,
    player: { id: '5', name: 'Kevin Durant', team: 'Phoenix Suns', teamAbbr: 'PHX' },
    value: 28.3,
  },
  {
    rank: 6,
    player: { id: '6', name: 'Jayson Tatum', team: 'Boston Celtics', teamAbbr: 'BOS' },
    value: 27.8,
  },
  {
    rank: 7,
    player: { id: '7', name: 'Anthony Edwards', team: 'Minnesota Timberwolves', teamAbbr: 'MIN' },
    value: 27.2,
  },
  {
    rank: 8,
    player: { id: '8', name: 'Donovan Mitchell', team: 'Cleveland Cavaliers', teamAbbr: 'CLE' },
    value: 26.5,
  },
  {
    rank: 9,
    player: { id: '9', name: "De'Aaron Fox", team: 'Sacramento Kings', teamAbbr: 'SAC' },
    value: 26.1,
  },
  {
    rank: 10,
    player: { id: '10', name: 'Ja Morant', team: 'Memphis Grizzlies', teamAbbr: 'MEM' },
    value: 25.9,
  },
];

export default function NBAStatsPage() {
  const [leaders, setLeaders] = useState<Record<string, StatLeader[]>>({
    'scoring-ppg': placeholderLeaders,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [category, setCategory] = useState<CategoryType>('scoring');
  const [selectedStat, setSelectedStat] = useState<StatType>('ppg');
  const [usingPlaceholder, setUsingPlaceholder] = useState(true);

  const fetchLeaders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nba/stats/leaders?category=${category}&stat=${selectedStat}`);
      if (!res.ok) throw new Error('Failed to fetch leaders');
      const data = (await res.json()) as { leaders?: StatLeader[]; meta?: DataMeta };

      if (data.leaders && data.leaders.length > 0) {
        setLeaders((prev) => ({ ...prev, [`${category}-${selectedStat}`]: data.leaders }));
        setUsingPlaceholder(false);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [category, selectedStat]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  useEffect(() => {
    setSelectedStat(defaultStats[category]);
  }, [category]);

  const currentStats = categoryToStats[category];
  const currentLeaders = leaders[`${category}-${selectedStat}`] || placeholderLeaders;
  const currentStatConfig = currentStats.find((s) => s.id === selectedStat);

  const LeaderCard = ({ leader, rank }: { leader: StatLeader; rank: number }) => (
    <Link href={`/nba/players/${leader.player.id}`} className="block">
      <div
        className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:border-burnt-orange ${
          rank === 1
            ? 'bg-burnt-orange/10 border border-burnt-orange'
            : rank <= 3
              ? 'bg-graphite border border-transparent'
              : 'bg-charcoal border border-transparent'
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
          <p className="text-xs text-text-tertiary">{leader.player.team}</p>
        </div>

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
    </Link>
  );

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nba"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NBA
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
                NBA Stat Leaders
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                League leaders in scoring, rebounds, assists, and defense. Updated daily throughout
                the season.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {usingPlaceholder && (
              <Card variant="default" padding="md" className="mb-6 bg-info/10 border-info/30">
                <p className="text-info font-semibold">Sample Data</p>
                <p className="text-text-secondary text-sm mt-1">
                  Showing representative stat leaders. Live data updates during the active NBA
                  season.
                </p>
              </Card>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {(['scoring', 'rebounds', 'assists', 'defense'] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm capitalize transition-all ${
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
                <CardHeader>
                  <Skeleton variant="text" width={200} height={24} />
                </CardHeader>
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

            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source={meta?.dataSource || 'NBA.com / ESPN'}
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
