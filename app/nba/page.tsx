'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, FreshnessBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton, SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { TabBar, TabPanel } from '@/components/ui/TabBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SportHero } from '@/components/sports/SportHero';
import { GameScoreCard } from '@/components/sports/GameScoreCard';
import { SportInfoCard } from '@/components/sports/SportInfoCard';
import { formatTimestamp } from '@/lib/utils/timezone';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import {
  type NBAApiConference,
  type NBAStandingsTeam,
  flattenNBAStandings,
  splitNBAByConference,
} from '@/lib/utils/standings';

interface Game {
  id: string | number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  detail?: string;
  away: { name: string; score: number };
  home: { name: string; score: number };
  venue?: string;
}

interface PlayerLeader {
  name: string;
  team: string;
  value: number;
}

interface LeaderCategory {
  label: string;
  abbreviation: string;
  unit: string;
  players: PlayerLeader[];
}

type TabType = 'standings' | 'scores' | 'teams' | 'players';

const NBA_HERO_STATS = [
  { value: '30', label: 'NBA Teams' },
  { value: '82', label: 'Games/Season' },
  { value: 'Live', label: 'Real-Time Scores' },
  { value: 'PER', label: 'Advanced Data' },
];

const COURT_VISION_BULLETS = [
  { bold: 'Hawk-Eye: 12 cameras', text: 'per arena tracking 29 skeletal keypoints per player in real-time' },
  { bold: 'Second Spectrum', text: '(Genius Sports) provides the analytics layer — play-type classification, matchup data, shot quality' },
  { bold: 'Play-type classification:', text: 'pick-and-roll, isolation, spot-up, transition — every possession tagged automatically' },
  { bold: 'Shot tracking', text: 'with real-time arc, distance, and defender proximity metrics' },
];

const STAT_EXPLAINERS = [
  {
    stat: 'PER',
    name: 'Player Efficiency Rating',
    description: 'John Hollinger\'s all-in-one metric normalizing a player\'s per-minute production. League average is 15.0. Anything above 20 is All-Star caliber; above 25 is MVP-tier.',
  },
  {
    stat: 'TS%',
    name: 'True Shooting Percentage',
    description: 'Measures scoring efficiency by accounting for 2-pointers, 3-pointers, and free throws. The league average hovers around 57%. It exposes volume scorers who need 25 shots to get 25 points.',
  },
  {
    stat: 'USG%',
    name: 'Usage Rate',
    description: 'Estimates the percentage of team possessions a player uses while on the floor. High usage (30%+) means the offense runs through that player — for better or worse.',
  },
  {
    stat: 'RAPTOR',
    name: 'Robust Algorithm using Player Tracking and On/Off Ratings',
    description: 'FiveThirtyEight\'s catch-all metric combining box score, on/off data, and tracking. Measured in points above average per 100 possessions. Splits into offensive and defensive components.',
  },
];

const AROUND_THE_LEAGUE = [
  {
    category: 'Playoff Picture',
    headline: 'Western Conference race tightens',
    description: 'Five teams within two games of each other for the final two playoff spots. The play-in tournament looms for teams seeded 7-10.',
    badge: 'Postseason',
    badgeVariant: 'success' as const,
    href: '/nba/standings',
  },
  {
    category: 'Trade Market',
    headline: 'Deadline fallout reshaping rosters',
    description: 'Contenders loaded up at the deadline while rebuilding teams stockpiled draft capital. The ripple effects are showing up in the standings.',
    badge: 'Analysis',
    badgeVariant: 'warning' as const,
    href: '/nba/teams',
  },
  {
    category: 'Injury Watch',
    headline: 'Star availability driving betting lines',
    description: 'Load management and late-season injuries are shifting the title odds nightly. Teams with depth are separating from those relying on one or two stars.',
    badge: 'Health',
    badgeVariant: 'error' as const,
    href: '/nba/scores',
  },
  {
    category: 'Rookie Watch',
    headline: 'First-year players making an impact',
    description: 'This draft class is producing immediate contributors. Multiple rookies are cracking rotation minutes on playoff-bound teams — a rarity in the modern NBA.',
    badge: 'Rising',
    badgeVariant: 'accent' as const,
    href: '/nba/players',
  },
];

export default function NBAPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);

  // Standings — fetched when standings or teams tab is active
  const standingsUrl = (activeTab === 'standings' || activeTab === 'teams') ? '/api/nba/standings' : null;
  const { data: standingsRaw, loading: standingsLoading, error: standingsError, retry: retryStandings } =
    useSportData<{ standings?: NBAApiConference[]; meta?: { lastUpdated?: string } }>(standingsUrl);

  const standings = useMemo<NBAStandingsTeam[]>(
    () => flattenNBAStandings(standingsRaw?.standings || []),
    [standingsRaw],
  );

  // Scores — fetched when scores tab is active, auto-refreshes when live
  const scoresUrl = activeTab === 'scores' ? '/api/nba/scoreboard' : null;
  const { data: scoresRaw, loading: scoresLoading, error: scoresError, retry: retryScores } =
    useSportData<{ games?: Record<string, unknown>[]; scoreboard?: { games?: Record<string, unknown>[] }; meta?: { lastUpdated?: string } }>(scoresUrl, {
      refreshInterval: 30000,
      refreshWhen: liveGamesDetected,
    });

  // Normalize raw API games into typed Game[]
  const games = useMemo(() => {
    const rawGames = scoresRaw?.games || scoresRaw?.scoreboard?.games || [];
    return rawGames.map((g, i) => {
      const teams = g.teams as Record<string, Record<string, unknown>> | undefined;
      const homeTeam = (g.homeTeam || teams?.home) as Record<string, unknown> | undefined;
      const awayTeam = (g.awayTeam || teams?.away) as Record<string, unknown> | undefined;
      const status = g.status as Record<string, unknown> | string | undefined;
      const isLive = typeof status === 'object'
        ? (status?.type as Record<string, unknown>)?.state === 'in' || status?.isLive === true
        : typeof status === 'string' && status.toLowerCase().includes('in progress');
      const isFinal = typeof status === 'object'
        ? status?.isFinal === true
        : typeof status === 'string' && status.toLowerCase().includes('final');
      return {
        id: (g.id as string | number) || i,
        away: { name: (awayTeam?.name as string) || 'Away', score: Number(awayTeam?.score ?? 0) },
        home: { name: (homeTeam?.name as string) || 'Home', score: Number(homeTeam?.score ?? 0) },
        status: typeof status === 'object' ? ((status?.detailedState as string) || 'Scheduled') : ((status as string) || 'Scheduled'),
        isLive: Boolean(isLive),
        isFinal: Boolean(isFinal),
        detail: typeof status === 'object' && status?.period ? `Q${status.period}` : undefined,
        venue: (g.venue as Record<string, unknown>)?.name as string || undefined,
      } as Game;
    });
  }, [scoresRaw]);

  const hasLiveGames = useMemo(() => games.some((g) => g.isLive), [games]);
  useEffect(() => { setLiveGamesDetected(hasLiveGames); }, [hasLiveGames]);

  // Leaders — the deployed NBA data layer does not currently expose a league-leaders endpoint.
  const leadersLoading = false;
  const leaderCategories = useMemo<LeaderCategory[]>(() => [], []);

  // Derived shared state
  const loading = standingsLoading || scoresLoading;
  const error = standingsError || scoresError;
  const lastUpdated = standingsRaw?.meta?.lastUpdated || scoresRaw?.meta?.lastUpdated || '';

  const { eastern, western } = useMemo(() => splitNBAByConference(standings), [standings]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'standings', label: 'Standings' },
    { id: 'scores', label: 'Scores' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
    <div className="bsi-theme-basketball">
      <>
        <div>
        {/* Hero */}
        <SportHero
          sport="NBA"
          leagueName="National Basketball Association"
          tagline="Grizzlies. Mavericks. Thunder. Every game, every stat, no network filter."
          description="Live scores, conference standings, and analytics for all 30 teams."
          dataSource="SportsDataIO"
          primaryCta={{ label: 'Live Scores', href: '/nba/games' }}
          secondaryCta={{ label: 'Standings', href: '/nba/standings' }}
          stats={NBA_HERO_STATS}
        />

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabType)} size="sm" />

            {/* Standings Tab */}
            <TabPanel id="standings" activeTab={activeTab}>
              <DataErrorBoundary name="NBA Standings">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <Card key={i} variant="default" padding="lg">
                      <CardHeader><Skeleton variant="text" width={200} height={24} /></CardHeader>
                      <CardContent><table className="w-full"><tbody>{[1, 2, 3, 4, 5].map((j) => <SkeletonTableRow key={j} columns={7} />)}</tbody></table></CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retryStandings} />
                </Card>
              ) : standings.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="offseason" sport="NBA" />
                </Card>
              ) : (
                [{ label: 'Eastern Conference', teams: eastern }, { label: 'Western Conference', teams: western }]
                  .filter((conf) => conf.teams.length > 0)
                  .map((conf) => (
                    <ScrollReveal key={conf.label}>
                      <Card variant="default" padding="lg" className="mb-6">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            <Image src="/icons/basketball.svg" alt="" width={20} height={20} className="opacity-60" />
                            {conf.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-burnt-orange">
                                  {['#', 'Team', 'W', 'L', 'PCT', 'GB', 'STRK'].map((h) => (
                                    <th key={h} className="text-left p-3 text-text-tertiary font-semibold text-xs">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {conf.teams.sort((a, b) => b.wins - a.wins).map((team, idx) => (
                                  <tr key={team.teamName} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                                    <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                    <td className="p-3 font-semibold text-text-primary">{team.teamName}</td>
                                    <td className="p-3 text-text-secondary">{team.wins}</td>
                                    <td className="p-3 text-text-secondary">{team.losses}</td>
                                    <td className="p-3 text-text-secondary">{team.winPercentage.toFixed(3).replace('0.', '.')}</td>
                                    <td className="p-3 text-text-secondary">{team.gamesBack != null ? (team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)) : '-'}</td>
                                    <td className="p-3 text-text-secondary">{team.streak || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 pt-4 border-t border-border-subtle">
                            <DataSourceBadge source="SportsDataIO" timestamp={formatTimestamp(lastUpdated)} />
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  ))
              )}
              </DataErrorBoundary>
            </TabPanel>

            {/* Scores Tab */}
            <TabPanel id="scores" activeTab={activeTab}>
              <DataErrorBoundary name="NBA Scores">
              {loading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}</div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retryScores} />
                </Card>
              ) : games.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="no-games" sport="NBA" />
                </Card>
              ) : (
                <ScrollReveal>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Today&apos;s Games</span>
                        {hasLiveGames && <FreshnessBadge isLive fetchedAt={lastUpdated} />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {games.map((game) => (
                          <GameScoreCard
                            key={game.id}
                            game={game}
                          />
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <DataSourceBadge source="SportsDataIO" timestamp={formatTimestamp(lastUpdated)} />
                        {hasLiveGames && <span className="text-xs text-text-tertiary ml-4">Auto-refreshing every 30 seconds</span>}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}
              </DataErrorBoundary>
            </TabPanel>

            {/* Teams Tab */}
            <TabPanel id="teams" activeTab={activeTab}>
              <div className="grid gap-6 md:grid-cols-2">
                {[{ label: 'Eastern Conference', teams: eastern }, { label: 'Western Conference', teams: western }].map((conf) => (
                  <ScrollReveal key={conf.label}>
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <Image src="/icons/basketball.svg" alt="" width={20} height={20} className="opacity-60" />
                          {conf.label}
                        </CardTitle>
                        <p className="text-xs text-text-tertiary mt-1">{conf.teams.length} teams</p>
                      </CardHeader>
                      <CardContent>
                        <div className="divide-y divide-border-subtle">
                          {conf.teams.sort((a, b) => b.wins - a.wins).map((team, idx) => {
                            const isPlayoffSeed = idx < 6;
                            const isPlayIn = idx >= 6 && idx < 10;
                            return (
                              <Link key={team.teamName} href={`/nba/teams/${team.teamName.toLowerCase().replace(/\s+/g, '-')}`}>
                                <div className="flex items-center justify-between py-3 px-2 hover:bg-surface-light rounded-lg transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold w-6 text-center ${isPlayoffSeed ? 'text-burnt-orange' : isPlayIn ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                                      {idx + 1}
                                    </span>
                                    <span className="font-medium text-text-primary group-hover:text-burnt-orange transition-colors">
                                      {team.teamName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm text-text-secondary">{team.wins}-{team.losses}</span>
                                    <span className="font-mono text-xs text-text-tertiary w-12 text-right">
                                      {team.winPercentage.toFixed(3).replace('0.', '.')}
                                    </span>
                                    {isPlayoffSeed && (
                                      <Badge variant="success" size="sm">Playoff</Badge>
                                    )}
                                    {isPlayIn && (
                                      <Badge variant="warning" size="sm">Play-In</Badge>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </TabPanel>

            {/* Players Tab */}
            <TabPanel id="players" activeTab={activeTab}>
              <DataErrorBoundary name="NBA Players">
                {leadersLoading ? (
                  <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} variant="default" padding="lg">
                        <CardHeader><Skeleton variant="text" width={140} height={20} /></CardHeader>
                        <CardContent>
                          {[1, 2, 3, 4, 5].map((j) => (
                            <div key={j} className="flex justify-between py-2">
                              <Skeleton variant="text" width={120} height={16} />
                              <Skeleton variant="text" width={40} height={16} />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : leaderCategories.length > 0 ? (
                  <>
                    <div className="grid gap-6 md:grid-cols-3">
                      {leaderCategories.map((cat) => (
                        <ScrollReveal key={cat.label}>
                          <Card variant="default" padding="lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-burnt-orange/15 text-burnt-orange font-mono font-bold text-sm">
                                  {cat.abbreviation}
                                </span>
                                {cat.label}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="divide-y divide-border-subtle">
                                {cat.players.map((player, idx) => (
                                  <div key={player.name} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? 'text-burnt-orange' : 'text-text-tertiary'}`}>
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <p className={`font-semibold text-sm ${idx === 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                                          {player.name}
                                        </p>
                                        <p className="text-xs text-text-tertiary">{player.team}</p>
                                      </div>
                                    </div>
                                    <span className={`font-mono font-bold text-sm ${idx === 0 ? 'text-burnt-orange' : 'text-text-primary'}`}>
                                      {player.value.toFixed(1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </ScrollReveal>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link href="/nba/players"><Button variant="primary">Browse All Players</Button></Link>
                      <Link href="/nba/standings"><Button variant="secondary">View Standings</Button></Link>
                    </div>
                  </>
                ) : (
                  <Card variant="default" padding="lg">
                    <CardHeader><CardTitle>Player Statistics</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-text-secondary mb-4">Search NBA players for detailed stats and profiles.</p>
                      <div className="flex flex-wrap gap-3">
                        <Link href="/nba/players"><Button variant="primary">Browse All Players</Button></Link>
                        <Link href="/nba/standings"><Button variant="secondary">View Standings</Button></Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </DataErrorBoundary>
            </TabPanel>
          </Container>
        </Section>

        {/* League Leaders Section */}
        {leaderCategories.length > 0 && (
          <Section padding="lg" background="midnight" borderTop>
            <Container>
              <ScrollReveal>
                <div className="mb-8">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary uppercase tracking-wide">
                    League Leaders
                  </h2>
                  <p className="text-text-tertiary text-sm mt-2">Top performers across the NBA this season</p>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 md:grid-cols-3">
                {leaderCategories.map((cat) => (
                  <ScrollReveal key={cat.label}>
                    <Card variant="default" padding="lg" className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-burnt-orange/15 text-burnt-orange font-mono font-bold text-sm">
                            {cat.abbreviation}
                          </span>
                          {cat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="divide-y divide-border-subtle">
                          {cat.players.map((player, idx) => (
                            <div key={player.name} className="flex items-center justify-between py-3">
                              <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? 'text-burnt-orange' : 'text-text-tertiary'}`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className={`font-semibold text-sm ${idx === 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                                    {player.name}
                                  </p>
                                  <p className="text-xs text-text-tertiary">{player.team}</p>
                                </div>
                              </div>
                              <span className={`font-mono font-bold text-sm ${idx === 0 ? 'text-burnt-orange' : 'text-text-primary'}`}>
                                {player.value.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Around the League */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="mb-8">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary uppercase tracking-wide">
                  Around the League
                </h2>
                <p className="text-text-tertiary text-sm mt-2">Storylines shaping the NBA right now</p>
              </div>
            </ScrollReveal>
            <div className="grid gap-6 md:grid-cols-2">
              {AROUND_THE_LEAGUE.map((item) => (
                <ScrollReveal key={item.headline}>
                  <Link href={item.href}>
                    <Card variant="hover" padding="lg" className="h-full">
                      <CardContent>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant={item.badgeVariant} size="sm">{item.badge}</Badge>
                          <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">{item.category}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-text-primary uppercase tracking-wide mb-2">
                          {item.headline}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Court Vision Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <div className="grid gap-8 lg:grid-cols-2">
              <SportInfoCard
                icon={
                  <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                }
                title="Court Vision"
                subtitle="How the NBA tracks the game"
                bullets={COURT_VISION_BULLETS}
                actions={[
                  { label: 'Full Vision AI Landscape →', href: '/vision-ai', variant: 'ghost' },
                ]}
              />
              <ScrollReveal>
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle size="md">Stat Glossary</CardTitle>
                      <p className="text-text-tertiary text-xs mt-0.5">Advanced metrics decoded</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {STAT_EXPLAINERS.map((item) => (
                      <div key={item.stat} className="border-l-2 border-burnt-orange/40 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-burnt-orange text-sm">{item.stat}</span>
                          <span className="text-xs text-text-tertiary">— {item.name}</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>
      </div>
        <Footer />
      </>
    </div>
  );
}
