'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { TabBar, TabPanel } from '@/components/ui/TabBar';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SportHero } from '@/components/sports/SportHero';
import { GameScoreCard } from '@/components/sports/GameScoreCard';
import { SpringTrainingLeagueFilter } from '@/components/sports/SpringTrainingLeagueFilter';
import { SpringTrainingStandingsTable } from '@/components/sports/SpringTrainingStandingsTable';
import { useSportData } from '@/lib/hooks/useSportData';
import { formatTimestamp } from '@/lib/utils/timezone';

type STTab = 'scores' | 'standings' | 'schedule';
type LeagueFilter = 'all' | 'Cactus' | 'Grapefruit';

const ST_HERO_STATS = [
  { value: '30', label: 'Teams' },
  { value: '2', label: 'Leagues' },
  { value: 'Live', label: 'Scores' },
  { value: 'Feb–Mar', label: 'Season' },
];

const tabs: { id: STTab; label: string }[] = [
  { id: 'scores', label: "Today's Games" },
  { id: 'standings', label: 'Standings' },
  { id: 'schedule', label: 'Schedule' },
];

interface STGame {
  id: string;
  name: string;
  date: string;
  status: { type?: { state?: string; description?: string } };
  league: 'Cactus' | 'Grapefruit' | null;
  home: { id: string; name: string; abbreviation: string; score: string; logo: string };
  away: { id: string; name: string; abbreviation: string; score: string; logo: string };
}

interface STStandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  league: 'Cactus' | 'Grapefruit' | null;
  wins: number;
  losses: number;
  winPct: number;
}

export default function SpringTrainingPage() {
  const [activeTab, setActiveTab] = useState<STTab>('scores');
  const [league, setLeague] = useState<LeagueFilter>('all');

  const { data: scoresData, loading: scoresLoading, error: scoresError, retry: retryScores } =
    useSportData<{ games: STGame[]; meta?: { lastUpdated?: string; dataSource?: string } }>(
      '/api/mlb/spring-training/scores',
      { refreshInterval: 30_000, refreshWhen: activeTab === 'scores' },
    );

  const { data: standingsData, loading: standingsLoading, error: standingsError, retry: retryStandings } =
    useSportData<{ cactus: STStandingsTeam[]; grapefruit: STStandingsTeam[]; meta?: { lastUpdated?: string; dataSource?: string } }>(
      '/api/mlb/spring-training/standings',
      { skip: activeTab !== 'standings' },
    );

  const { data: scheduleData, loading: scheduleLoading, error: scheduleError, retry: retrySchedule } =
    useSportData<{ schedule: STGame[]; meta?: { lastUpdated?: string; dataSource?: string } }>(
      '/api/mlb/spring-training/schedule',
      { skip: activeTab !== 'schedule' },
    );

  const games = scoresData?.games ?? [];
  const filteredGames = league === 'all' ? games : games.filter((g) => g.league === league);
  const hasLive = games.some((g) => g.status?.type?.state === 'in');

  const filteredSchedule = league === 'all'
    ? (scheduleData?.schedule ?? [])
    : (scheduleData?.schedule ?? []).filter((g) => g.league === league);

  return (
    <>
      <main id="main-content">
        <SportHero
          sport="MLB"
          leagueName="Spring Training"
          tagline="Cactus League. Grapefruit League. Every camp, every game."
          description="Live scores, standings, and roster tracking across both spring leagues. The 2026 season starts here."
          dataSource="ESPN"
          primaryCta={{ label: 'View Scores', href: '/mlb/spring-training/scores' }}
          secondaryCta={{ label: 'Standings', href: '/mlb/spring-training/standings' }}
          stats={ST_HERO_STATS}
        />

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as STTab)} size="sm" />
              <SpringTrainingLeagueFilter value={league} onChange={setLeague} />
            </div>

            {/* Scores Tab */}
            <TabPanel id="scores" activeTab={activeTab}>
              {scoresLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}
                </div>
              ) : scoresError ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retryScores} />
                </Card>
              ) : filteredGames.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="no-games" sport="Spring Training" />
                </Card>
              ) : (
                <ScrollReveal>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          Today&apos;s Spring Training Games
                          {hasLive && <LiveBadge />}
                        </span>
                        <Badge variant="primary">{filteredGames.length} Games</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredGames.map((game) => (
                          <div key={game.id} className="relative">
                            {game.league && (
                              <Badge
                                variant={game.league === 'Cactus' ? 'warning' : 'success'}
                                className="absolute -top-2 right-2 text-[10px] z-10"
                              >
                                {game.league}
                              </Badge>
                            )}
                            <GameScoreCard
                              game={{
                                id: game.id,
                                away: { name: game.away.name, score: Number(game.away.score) || 0 },
                                home: { name: game.home.name, score: Number(game.home.score) || 0 },
                                status: game.status?.type?.description ?? 'Scheduled',
                                isLive: game.status?.type?.state === 'in',
                                isFinal: game.status?.type?.state === 'post',
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <DataSourceBadge
                          source={scoresData?.meta?.dataSource ?? 'ESPN'}
                          timestamp={formatTimestamp(scoresData?.meta?.lastUpdated)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}
            </TabPanel>

            {/* Standings Tab */}
            <TabPanel id="standings" activeTab={activeTab}>
              {standingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <SkeletonScoreCard key={i} />)}
                </div>
              ) : standingsError ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retryStandings} />
                </Card>
              ) : (
                <div className="space-y-8">
                  {(league === 'all' || league === 'Cactus') && (
                    <SpringTrainingStandingsTable
                      title="Cactus League"
                      teams={standingsData?.cactus ?? []}
                    />
                  )}
                  {(league === 'all' || league === 'Grapefruit') && (
                    <SpringTrainingStandingsTable
                      title="Grapefruit League"
                      teams={standingsData?.grapefruit ?? []}
                    />
                  )}
                  <div className="pt-4 border-t border-border-subtle">
                    <DataSourceBadge
                      source={standingsData?.meta?.dataSource ?? 'ESPN'}
                      timestamp={formatTimestamp(standingsData?.meta?.lastUpdated)}
                    />
                  </div>
                </div>
              )}
            </TabPanel>

            {/* Schedule Tab */}
            <TabPanel id="schedule" activeTab={activeTab}>
              {scheduleLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => <SkeletonScoreCard key={i} />)}
                </div>
              ) : scheduleError ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="error" onRetry={retrySchedule} />
                </Card>
              ) : filteredSchedule.length === 0 ? (
                <Card variant="default" padding="lg">
                  <EmptyState type="no-games" sport="Spring Training" />
                </Card>
              ) : (
                <ScrollReveal>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle>
                        Full Schedule ({filteredSchedule.length} games)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredSchedule.slice(0, 50).map((game) => (
                          <div
                            key={game.id}
                            className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-text-primary text-sm font-medium truncate">{game.name}</p>
                              <p className="text-text-tertiary text-xs mt-1">
                                {new Date(game.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  weekday: 'short',
                                  timeZone: 'America/Chicago',
                                })}
                              </p>
                            </div>
                            {game.league && (
                              <Badge
                                variant={game.league === 'Cactus' ? 'warning' : 'success'}
                                className="text-[10px] ml-2"
                              >
                                {game.league}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}
            </TabPanel>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/mlb/spring-training/scores" className="px-4 py-2 bg-background-tertiary rounded-lg text-text-primary text-sm hover:bg-burnt-orange/20 transition-colors">
                Scores
              </Link>
              <Link href="/mlb/spring-training/standings" className="px-4 py-2 bg-background-tertiary rounded-lg text-text-primary text-sm hover:bg-burnt-orange/20 transition-colors">
                Standings
              </Link>
              <Link href="/mlb" className="px-4 py-2 bg-background-tertiary rounded-lg text-text-tertiary text-sm hover:text-text-primary transition-colors">
                Back to MLB Hub
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
