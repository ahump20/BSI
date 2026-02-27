'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, FreshnessBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton, SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { RefreshIndicator } from '@/components/ui/RefreshIndicator';
import { TabBar, TabPanel } from '@/components/ui/TabBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SportHero } from '@/components/sports/SportHero';
import { GameScoreCard } from '@/components/sports/GameScoreCard';
import { SportInfoCard } from '@/components/sports/SportInfoCard';
import { formatTimestamp } from '@/lib/utils/timezone';
import { getSeasonPhase } from '@/lib/season';

const mlbFeatures = [
  {
    href: '/mlb/scores',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Live Scores',
    description:
      'Real-time scores and game updates for all 30 MLB teams. Box scores, line scores, and play-by-play.',
    badge: 'Live Now',
    badgeVariant: 'success' as const,
    isLive: true,
  },
  {
    href: '/mlb/standings',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: 'Division Standings',
    description:
      'Complete AL and NL standings with win percentage, games back, run differential, and streak data.',
    badge: 'Updated Daily',
    badgeVariant: 'primary' as const,
  },
  {
    href: '/mlb/teams',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Team Profiles',
    description:
      'Rosters, schedules, and statistics for all 30 MLB teams across the American and National Leagues.',
    badge: '30 Teams',
    badgeVariant: 'warning' as const,
  },
  {
    href: '/mlb/stats',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Statcast Analytics',
    description:
      'Advanced metrics including exit velocity, launch angle, sprint speed, and pitch movement data.',
    badge: 'Pro-Level',
    badgeVariant: 'warning' as const,
  },
  {
    href: '/mlb/editorial',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: 'Editorial',
    description:
      'Season previews, division analysis, and long-form coverage of the 2026 MLB season.',
    badge: 'New',
    badgeVariant: 'primary' as const,
  },
];

interface Team {
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;
  division: string;
  league: string;
  runsScored: number;
  runsAllowed: number;
  streakCode: string;
}

interface Game {
  id: number;
  date: string;
  status: {
    state: string;
    detailedState: string;
    inning?: number;
    inningState?: string;
    isLive: boolean;
    isFinal: boolean;
  };
  teams: {
    away: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      hits: number;
      errors: number;
    };
    home: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      hits: number;
      errors: number;
    };
  };
  venue: { name: string };
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type TabType = 'standings' | 'teams' | 'players' | 'schedule';

const MLB_HERO_STATS = [
  { value: '30', label: 'MLB Teams' },
  { value: '162', label: 'Games/Season' },
  { value: 'Live', label: 'Real-Time Scores' },
  { value: 'Statcast', label: 'Advanced Data' },
];

const STATCAST_BULLETS = [
  { bold: '12 Hawk-Eye cameras', text: 'per ballpark track ball trajectory, bat path, and 18 skeletal keypoints at 30fps' },
  { bold: '225+ metrics per pitch', text: '— Statcast generates ~7TB of tracking data per game' },
  { bold: 'Bat tracking', text: 'now operational across all 30 parks — exit velocity, sweet-spot rate, and attack angle' },
  { bold: 'ABS deployed for 2026', text: '— robot umpire system using pose-tracking cameras for batter-specific strike zones' },
];

export default function MLBPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [standings, setStandings] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mlb/standings');
      if (!res.ok) throw new Error('Failed to fetch standings');
      const data = (await res.json()) as { standings?: unknown; meta?: unknown };

      if (data.standings) {
        setStandings(data.standings as typeof standings);
      }
      if (data.meta) {
        setMeta(data.meta as typeof meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mlb/scores');
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = (await res.json()) as { games?: unknown; live?: boolean; meta?: unknown };

      if (data.games) {
        setSchedule(data.games as typeof schedule);
        setHasLiveGames(data.live || false);
      }
      if (data.meta) {
        setMeta(data.meta as typeof meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'standings') {
      fetchStandings();
    } else if (activeTab === 'schedule') {
      fetchSchedule();
    }
  }, [activeTab, fetchStandings, fetchSchedule]);

  // Auto-refresh for live games (every 30 seconds)
  useEffect(() => {
    if (activeTab === 'schedule' && hasLiveGames) {
      const interval = setInterval(fetchSchedule, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, hasLiveGames, fetchSchedule]);

  // Group standings by league and division
  const standingsByDivision: Record<string, Team[]> = {};
  standings.forEach((team) => {
    const divKey = `${team.league} ${team.division}`;
    if (!standingsByDivision[divKey]) standingsByDivision[divKey] = [];
    standingsByDivision[divKey].push(team);
  });

  // Sort teams within each division by wins
  Object.keys(standingsByDivision).forEach((div) => {
    standingsByDivision[div].sort((a, b) => b.wins - a.wins);
  });

  const divisionOrder = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'standings', label: 'Standings' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
    { id: 'schedule', label: 'Schedule' },
  ];

  return (
    <div className="bsi-theme-baseball">
      <>
        <div>
        {/* Hero Section */}
        <SportHero
          sport="MLB"
          leagueName="Major League Baseball"
          tagline="Cardinals. Rangers. Astros. Every game, every stat, no network filter."
          description="Live scores, division standings, and Statcast analytics for all 30 teams—pulled straight from MLB's official API. No third-party garbage. No guesswork."
          dataSource="SportsDataIO"
          primaryCta={{ label: 'View Live Scores', href: '/mlb/scores' }}
          secondaryCta={{ label: 'Division Standings', href: '/mlb/standings' }}
          stats={MLB_HERO_STATS}
        />

        {/* Spring Training Banner — visible during preseason */}
        {getSeasonPhase('mlb').phase === 'preseason' && (
          <Section padding="md" background="charcoal" borderTop>
            <Container>
              <Link href="/mlb/spring-training" className="group block">
                <div className="bg-gradient-to-r from-burnt-orange/15 via-ember/10 to-transparent rounded-xl p-6 border border-burnt-orange/30 hover:border-burnt-orange transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-burnt-orange/20 rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2c-2 4-2 8 0 12s2 8 0 12" />
                          <path d="M2 12c4-2 8-2 12 0s8 2 12 0" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="warning">Spring Training</Badge>
                          <FreshnessBadge isLive fetchedAt={meta?.lastUpdated} />
                        </div>
                        <h3 className="text-text-primary font-semibold">Cactus & Grapefruit League</h3>
                        <p className="text-text-tertiary text-sm mt-1">Live scores, standings, rosters, and schedules across both spring leagues.</p>
                      </div>
                    </div>
                    <span className="text-burnt-orange font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                      View Spring Training
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </Container>
          </Section>
        )}

        {/* Features Section */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">All 30 Teams</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  The Data You <span className="text-gradient-blaze">Actually Need</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Scores, standings, Statcast. Straight from MLB—no middleman.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {mlbFeatures.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Link href={feature.href} className="block group">
                    <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="w-12 h-12 mb-5 bg-burnt-orange/15 rounded-xl flex items-center justify-center">
                        {feature.icon}
                      </div>

                      <h3 className="text-lg font-semibold text-text-primary mb-3">{feature.title}</h3>
                      <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        {feature.isLive ? (
                          <FreshnessBadge isLive fetchedAt={meta?.lastUpdated} />
                        ) : (
                          <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                        )}
                        <span className="text-burnt-orange text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                          View
                          <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabType)} size="sm" />

            {/* Standings Tab */}
            <TabPanel id="standings" activeTab={activeTab}>
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} variant="default" padding="lg">
                      <CardHeader>
                        <Skeleton variant="text" width={200} height={24} />
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full" aria-label="MLB standings">
                            <thead>
                              <tr className="border-b-2 border-burnt-orange">
                                {['Rank', 'Team', 'W', 'L', 'PCT', 'GB', 'RS', 'RA', 'STRK'].map(
                                  (h) => (
                                    <th scope="col"
                                      key={h}
                                      className="text-left p-3 text-text-tertiary font-semibold"
                                    >
                                      {h}
                                    </th>
                                  )
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {[1, 2, 3, 4, 5].map((j) => (
                                <SkeletonTableRow key={j} columns={9} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={fetchStandings} />
                </Card>
              ) : standings.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="offseason" sport="MLB" />
                </Card>
              ) : (
                divisionOrder
                  .filter((div) => standingsByDivision[div]?.length > 0)
                  .map((division) => (
                    <ScrollReveal key={division}>
                      <Card variant="default" padding="lg" className="mb-6">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-6 h-6 text-burnt-orange"
                              fill="currentColor"
                            >
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            {division}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full" aria-label="MLB division standings">
                              <thead>
                                <tr className="border-b-2 border-burnt-orange">
                                  <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">
                                    Rank
                                  </th>
                                  <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">
                                    Team
                                  </th>
                                  <th className="text-left p-3 text-text-tertiary font-semibold">W</th>
                                  <th className="text-left p-3 text-text-tertiary font-semibold">L</th>
                                  <th className="text-left p-3 text-text-tertiary font-semibold">PCT</th>
                                  <th className="text-left p-3 text-text-tertiary font-semibold">GB</th>
                                  <th className="text-left p-3 text-text-tertiary font-semibold">RS</th>
                                  <th className="text-left p-3 text-text-tertiary font-semibold">RA</th>
                                  <th className="text-left p-3 text-text-tertiary font-semibold">
                                    STRK
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {standingsByDivision[division].map((team, idx) => (
                                  <tr
                                    key={team.teamName}
                                    className="border-b border-border-subtle hover:bg-surface-light transition-colors"
                                  >
                                    <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                    <td className="p-3 font-semibold text-text-primary">
                                      {team.teamName}
                                    </td>
                                    <td className="p-3 text-text-secondary">{team.wins}</td>
                                    <td className="p-3 text-text-secondary">{team.losses}</td>
                                    <td className="p-3 text-text-secondary">
                                      {team.winPercentage.toFixed(3).replace('0.', '.')}
                                    </td>
                                    <td className="p-3 text-text-secondary">
                                      {team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)}
                                    </td>
                                    <td className="p-3 text-text-secondary">{team.runsScored}</td>
                                    <td className="p-3 text-text-secondary">
                                      {team.runsAllowed}
                                    </td>
                                    <td className="p-3 text-text-secondary">{team.streakCode}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 pt-4 border-t border-border-subtle">
                            <DataSourceBadge
                              source={meta?.dataSource || 'MLB Stats API'}
                              timestamp={formatTimestamp(meta?.lastUpdated)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  ))
              )}
            </TabPanel>

            {/* Teams Tab */}
            <TabPanel id="teams" activeTab={activeTab}>
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    MLB Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-6">
                    Browse all 30 MLB teams — rosters, schedules, and statistics across the American and National Leagues.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/mlb/teams" className="group block">
                      <div className="bg-background-tertiary rounded-lg p-6 border border-border-subtle hover:border-burnt-orange transition-colors">
                        <h3 className="text-text-primary font-semibold mb-2 group-hover:text-burnt-orange transition-colors">All 30 Teams</h3>
                        <p className="text-text-tertiary text-sm">Full team directory with profiles, rosters, and season stats.</p>
                        <span className="text-burnt-orange text-sm font-semibold mt-3 inline-flex items-center gap-1">
                          Browse Teams
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </Link>
                    <Link href="/mlb/standings" className="group block">
                      <div className="bg-background-tertiary rounded-lg p-6 border border-border-subtle hover:border-burnt-orange transition-colors">
                        <h3 className="text-text-primary font-semibold mb-2 group-hover:text-burnt-orange transition-colors">Division Standings</h3>
                        <p className="text-text-tertiary text-sm">AL &amp; NL standings with win percentage, games back, and streaks.</p>
                        <span className="text-burnt-orange text-sm font-semibold mt-3 inline-flex items-center gap-1">
                          View Standings
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Players Tab */}
            <TabPanel id="players" activeTab={activeTab}>
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    </svg>
                    Player Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-6">
                    Player profiles, advanced Statcast metrics, and performance data across the league.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/mlb/players" className="group block">
                      <div className="bg-background-tertiary rounded-lg p-6 border border-border-subtle hover:border-burnt-orange transition-colors">
                        <h3 className="text-text-primary font-semibold mb-2 group-hover:text-burnt-orange transition-colors">Browse Players</h3>
                        <p className="text-text-tertiary text-sm">Search and explore player profiles with batting, pitching, and fielding stats.</p>
                        <span className="text-burnt-orange text-sm font-semibold mt-3 inline-flex items-center gap-1">
                          View Players
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </Link>
                    <Link href="/mlb/stats" className="group block">
                      <div className="bg-background-tertiary rounded-lg p-6 border border-border-subtle hover:border-burnt-orange transition-colors">
                        <h3 className="text-text-primary font-semibold mb-2 group-hover:text-burnt-orange transition-colors">Statcast Analytics</h3>
                        <p className="text-text-tertiary text-sm">Exit velocity, launch angle, sprint speed, and pitch movement data.</p>
                        <span className="text-burnt-orange text-sm font-semibold mt-3 inline-flex items-center gap-1">
                          View Analytics
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Schedule Tab */}
            <TabPanel id="schedule" activeTab={activeTab}>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonScoreCard key={i} />
                  ))}
                </div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={fetchSchedule} />
                </Card>
              ) : schedule.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="no-games" sport="MLB" />
                </Card>
              ) : (
                <ScrollReveal>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-6 h-6 text-burnt-orange"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Today&apos;s Games
                        </div>
                        <div className="flex items-center gap-3">
                          {hasLiveGames && <FreshnessBadge isLive fetchedAt={meta?.lastUpdated} />}
                          <RefreshIndicator active={hasLiveGames} intervalSeconds={30} />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {schedule.map((game) => (
                          <GameScoreCard
                            key={game.id}
                            game={{
                              id: game.id,
                              away: {
                                name: game.teams.away.name,
                                score: game.teams.away.score,
                                isWinner: game.status.isFinal ? game.teams.away.isWinner : undefined,
                                hits: game.teams.away.hits,
                                errors: game.teams.away.errors,
                              },
                              home: {
                                name: game.teams.home.name,
                                score: game.teams.home.score,
                                isWinner: game.status.isFinal ? game.teams.home.isWinner : undefined,
                                hits: game.teams.home.hits,
                                errors: game.teams.home.errors,
                              },
                              status: game.status.detailedState,
                              isLive: game.status.isLive,
                              isFinal: game.status.isFinal,
                              detail: game.status.isLive
                                ? `${game.status.inningState} ${game.status.inning}`
                                : undefined,
                              venue: game.venue?.name || 'TBD',
                            }}
                            showHitsErrors
                          />
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <DataSourceBadge
                          source={meta?.dataSource || 'MLB Stats API'}
                          timestamp={formatTimestamp(meta?.lastUpdated)}
                        />
                        {hasLiveGames && (
                          <span className="text-xs text-text-tertiary ml-4">
                            Auto-refreshing every 30 seconds
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}
            </TabPanel>
          </Container>
        </Section>

        {/* Statcast & Vision AI Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <SportInfoCard
              icon={
                <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              }
              title="Statcast &amp; Vision AI"
              subtitle="How MLB tracks everything"
              bullets={STATCAST_BULLETS}
              actions={[
                { label: 'ABS Challenge Tracker', href: '/mlb/abs', variant: 'outline' },
                { label: 'Full Vision AI Landscape →', href: '/vision-ai', variant: 'ghost' },
              ]}
            />
          </Container>
        </Section>
      </div>

        <Footer />
      </>
    </div>
  );
}
