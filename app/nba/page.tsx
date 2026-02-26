'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
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

interface Team {
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  conference: string;
  division?: string;
  gamesBack?: number;
  streak?: string;
  ppg?: number;
  oppg?: number;
}

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

export default function NBAPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [standings, setStandings] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [hasLiveGames, setHasLiveGames] = useState(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nba/standings');
      if (!res.ok) throw new Error('Failed to fetch standings');
      const data = await res.json() as { standings?: Team[]; teams?: Team[]; meta?: { lastUpdated?: string } };
      setStandings((data.standings || data.teams || []) as Team[]);
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nba/scoreboard');
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = await res.json() as { games?: Record<string, unknown>[]; scoreboard?: { games?: Record<string, unknown>[] }; meta?: { lastUpdated?: string } };
      const rawGames = data.games || data.scoreboard?.games || [];
      const normalized: Game[] = rawGames.map((g, i) => {
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
        };
      });
      setGames(normalized);
      setHasLiveGames(normalized.some((g) => g.isLive));
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'standings' || activeTab === 'teams') fetchStandings();
    else if (activeTab === 'scores') fetchScores();
  }, [activeTab, fetchStandings, fetchScores]);

  useEffect(() => {
    if (activeTab === 'scores' && hasLiveGames) {
      const interval = setInterval(fetchScores, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, hasLiveGames, fetchScores]);

  const eastern = standings.filter((t) => t.conference === 'Eastern' || t.conference === 'East');
  const western = standings.filter((t) => t.conference === 'Western' || t.conference === 'West');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'standings', label: 'Standings' },
    { id: 'scores', label: 'Scores' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
    <div className="bsi-theme-basketball">
      <>
        <main id="main-content">
        {/* Hero */}
        <SportHero
          sport="NBA"
          leagueName="National Basketball Association"
          tagline="Grizzlies. Mavericks. Thunder. Every game, every stat, no network filter."
          description="Live scores, conference standings, and analytics for all 30 teams."
          accentColor="#1D428A"
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
                  <EmptyState type="error" onRetry={fetchStandings} />
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
            </TabPanel>

            {/* Scores Tab */}
            <TabPanel id="scores" activeTab={activeTab}>
              {loading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}</div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={fetchScores} />
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
                        {hasLiveGames && <LiveBadge />}
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
            </TabPanel>

            {/* Teams Tab */}
            <TabPanel id="teams" activeTab={activeTab}>
              <div className="grid gap-6 md:grid-cols-2">
                {[{ label: 'Eastern Conference', teams: eastern }, { label: 'Western Conference', teams: western }].map((conf) => (
                  <div key={conf.label}>
                    <h3 className="text-xl font-display font-bold text-burnt-orange mb-4">{conf.label}</h3>
                    <div className="space-y-2">
                      {conf.teams.sort((a, b) => b.wins - a.wins).map((team) => (
                        <Link key={team.teamName} href={`/nba/teams/${team.teamName.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Card variant="hover" padding="sm" className="flex items-center justify-between px-4 py-3">
                            <span className="font-medium text-text-primary">{team.teamName}</span>
                            <span className="text-sm text-text-tertiary">{team.wins}-{team.losses}</span>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabPanel>

            {/* Players Tab */}
            <TabPanel id="players" activeTab={activeTab}>
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
            </TabPanel>
          </Container>
        </Section>

        {/* Court Vision Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
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
          </Container>
        </Section>
      </main>
        <Footer />
      </>
    </div>
  );
}
