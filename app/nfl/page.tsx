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

interface Team {
  teamName: string;
  wins: number;
  losses: number;
  ties?: number;
  winPercentage: number;
  division: string;
  conference: string;
  pointsFor?: number;
  pointsAgainst?: number;
  streak?: string;
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

const DIVISION_ORDER = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West',
];

const NFL_HERO_STATS = [
  { value: '32', label: 'NFL Teams' },
  { value: '18', label: 'Week Season' },
  { value: 'Live', label: 'Real-Time Scores' },
  { value: 'EPA', label: 'Advanced Data' },
];

const TRACKING_BULLETS = [
  { bold: 'Next Gen Stats', text: 'uses Zebra UWB RFID tags (not camera CV) — 10Hz positional data for every player' },
  { bold: 'NFL Digital Athlete:', text: '38 cameras, 5K video, enabling 83x faster helmet impact detection' },
  { bold: '17% concussion reduction', text: 'in 2024 — material harm reduction powered by computer vision' },
  { bold: 'SkillCorner', text: '+ broadcast-derived tracking emerging for speed, separation, and get-off time' },
];

export default function NFLPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);

  // Standings — fetched when standings or teams tab is active
  const standingsUrl = (activeTab === 'standings' || activeTab === 'teams') ? '/api/nfl/standings' : null;
  const { data: standingsRaw, loading: standingsLoading, error: standingsError, retry: retryStandings } =
    useSportData<{ standings?: Team[]; teams?: Team[]; meta?: { lastUpdated?: string } }>(standingsUrl);
  const standings = (standingsRaw?.standings || standingsRaw?.teams || []) as Team[];

  // Scores — fetched when scores tab is active, auto-refreshes when live
  const scoresUrl = activeTab === 'scores' ? '/api/nfl/scores' : null;
  const { data: scoresRaw, loading: scoresLoading, error: scoresError, retry: retryScores } =
    useSportData<{ games?: Record<string, unknown>[]; meta?: { lastUpdated?: string } }>(scoresUrl, {
      refreshInterval: 30000,
      refreshWhen: liveGamesDetected,
    });

  // Normalize raw API games into typed Game[]
  const games = useMemo(() => {
    const rawGames = scoresRaw?.games || [];
    return rawGames.map((g, i) => {
      const teams = g.teams as Record<string, Record<string, unknown>> | undefined;
      const status = g.status as Record<string, unknown> | string | undefined;
      const isLive = typeof status === 'object'
        ? (status?.type as Record<string, unknown>)?.state === 'in' || status?.isLive === true
        : typeof status === 'string' && status.toLowerCase().includes('in progress');
      const isFinal = typeof status === 'object'
        ? status?.isFinal === true
        : typeof status === 'string' && status.toLowerCase().includes('final');
      return {
        id: (g.id as string | number) || i,
        away: { name: (teams?.away?.name as string) || 'Away', score: Number(teams?.away?.score ?? 0) },
        home: { name: (teams?.home?.name as string) || 'Home', score: Number(teams?.home?.score ?? 0) },
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

  // Derived shared state
  const loading = standingsLoading || scoresLoading;
  const error = standingsError || scoresError;
  const lastUpdated = standingsRaw?.meta?.lastUpdated || scoresRaw?.meta?.lastUpdated || '';

  const standingsByDivision: Record<string, Team[]> = {};
  standings.forEach((team) => {
    const key = `${team.conference} ${team.division}`;
    if (!standingsByDivision[key]) standingsByDivision[key] = [];
    standingsByDivision[key].push(team);
  });
  Object.values(standingsByDivision).forEach((div) => div.sort((a, b) => b.wins - a.wins));

  const tabs: { id: TabType; label: string }[] = [
    { id: 'standings', label: 'Standings' },
    { id: 'scores', label: 'Scores' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
    <div className="bsi-theme-football">
      <>
        <div>
        {/* Hero */}
        <SportHero
          sport="NFL"
          leagueName="National Football League"
          tagline="Titans. Cowboys. Chiefs. Every game, every stat, no network filter."
          description="Live scores, conference standings, and analytics for all 32 teams."
          accentColor="#013369"
          dataSource="SportsDataIO"
          primaryCta={{ label: 'View Standings', href: '/nfl/standings' }}
          secondaryCta={{ label: 'Game Scores', href: '/nfl/games' }}
          stats={NFL_HERO_STATS}
        />

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
                      <CardHeader><Skeleton variant="text" width={200} height={24} /></CardHeader>
                      <CardContent>
                        <table className="w-full"><thead><tr className="border-b-2 border-burnt-orange">
                          {['#', 'Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA'].map((h) => (
                            <th key={h} className="text-left p-3 text-text-tertiary font-semibold text-xs">{h}</th>
                          ))}
                        </tr></thead><tbody>{[1, 2, 3, 4].map((j) => <SkeletonTableRow key={j} columns={8} />)}</tbody></table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retryStandings} />
                </Card>
              ) : standings.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="offseason" sport="NFL" />
                </Card>
              ) : (
                DIVISION_ORDER.filter((div) => standingsByDivision[div]?.length > 0).map((division) => (
                  <ScrollReveal key={division}>
                    <Card variant="default" padding="lg" className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <Image src="/icons/football.svg" alt="" width={20} height={20} className="opacity-60" />
                          {division}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-burnt-orange">
                                {['#', 'Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA'].map((h) => (
                                  <th key={h} className="text-left p-3 text-text-tertiary font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {standingsByDivision[division].map((team, idx) => (
                                <tr key={team.teamName} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                                  <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                  <td className="p-3 font-semibold text-text-primary">{team.teamName}</td>
                                  <td className="p-3 text-text-secondary">{team.wins}</td>
                                  <td className="p-3 text-text-secondary">{team.losses}</td>
                                  <td className="p-3 text-text-secondary">{team.ties || 0}</td>
                                  <td className="p-3 text-text-secondary">{team.winPercentage.toFixed(3).replace('0.', '.')}</td>
                                  <td className="p-3 text-text-secondary">{team.pointsFor || '-'}</td>
                                  <td className="p-3 text-text-secondary">{team.pointsAgainst || '-'}</td>
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
                  <EmptyState type="error" onRetry={retryScores} />
                </Card>
              ) : games.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="no-games" sport="NFL" />
                </Card>
              ) : (
                <ScrollReveal>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>This Week&apos;s Games</span>
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
            </TabPanel>

            {/* Teams Tab */}
            <TabPanel id="teams" activeTab={activeTab}>
              <div className="grid gap-6 md:grid-cols-2">
                {['AFC', 'NFC'].map((conf) => (
                  <div key={conf}>
                    <h3 className="text-xl font-display font-bold text-burnt-orange mb-4">{conf}</h3>
                    <div className="space-y-3">
                      {DIVISION_ORDER.filter((d) => d.startsWith(conf)).map((div) => (
                        <Card key={div} variant="default" padding="md">
                          <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">{div}</h4>
                          <div className="flex flex-wrap gap-2">
                            {(standingsByDivision[div] || []).map((team) => (
                              <Link key={team.teamName} href={`/nfl/teams/${team.teamName.toLowerCase().replace(/\s+/g, '-')}`}>
                                <Badge variant="secondary" className="text-sm hover:bg-burnt-orange hover:text-white transition-colors cursor-pointer">
                                  {team.teamName} ({team.wins}-{team.losses})
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </Card>
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
                  <p className="text-text-secondary mb-4">Search NFL players for detailed stats and profiles.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/nfl/players"><Button variant="primary">Browse All Players</Button></Link>
                    <Link href="/nfl/standings"><Button variant="secondary">View Standings</Button></Link>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>
          </Container>
        </Section>

        {/* Tracking & Player Safety Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <SportInfoCard
              icon={
                <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
              title="Tracking &amp; Player Safety"
              subtitle="How the NFL uses tracking technology"
              bullets={TRACKING_BULLETS}
              actions={[
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
