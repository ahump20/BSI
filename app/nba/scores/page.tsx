'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface NBAGame {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  quarter?: number;
  timeRemaining?: string;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number | null;
    record: string;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score: number | null;
    record: string;
  };
  venue: string;
  broadcast?: string;
}

// Raw API response types
interface APITeam {
  id: string;
  team: string;
  abbreviation: string;
  score: string | number;
  record: string;
}

interface APIGame {
  id: string;
  date: string;
  status: {
    type: string;
    period?: number;
    clock?: string;
  };
  teams: {
    home: APITeam;
    away: APITeam;
  };
  venue?: {
    name?: string;
  };
  broadcast?: string;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

// Transform API response to UI format
function transformAPIGame(apiGame: APIGame): NBAGame {
  const statusMap: Record<string, 'scheduled' | 'live' | 'final' | 'postponed'> = {
    STATUS_SCHEDULED: 'scheduled',
    STATUS_IN_PROGRESS: 'live',
    STATUS_FINAL: 'final',
    STATUS_POSTPONED: 'postponed',
  };

  const gameTime = new Date(apiGame.date).toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    id: apiGame.id,
    date: apiGame.date,
    time: gameTime,
    status: statusMap[apiGame.status?.type] || 'scheduled',
    quarter: apiGame.status?.period,
    timeRemaining: apiGame.status?.clock,
    homeTeam: {
      id: apiGame.teams?.home?.id || '',
      name: apiGame.teams?.home?.team || 'TBD',
      abbreviation: apiGame.teams?.home?.abbreviation || '',
      score:
        typeof apiGame.teams?.home?.score === 'string'
          ? parseInt(apiGame.teams.home.score) || null
          : (apiGame.teams?.home?.score ?? null),
      record: apiGame.teams?.home?.record || '0-0',
    },
    awayTeam: {
      id: apiGame.teams?.away?.id || '',
      name: apiGame.teams?.away?.team || 'TBD',
      abbreviation: apiGame.teams?.away?.abbreviation || '',
      score:
        typeof apiGame.teams?.away?.score === 'string'
          ? parseInt(apiGame.teams.away.score) || null
          : (apiGame.teams?.away?.score ?? null),
      record: apiGame.teams?.away?.record || '0-0',
    },
    venue: apiGame.venue?.name || 'TBD',
    broadcast: apiGame.broadcast,
  };
}

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDateOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
}

export default function NBAScoresPage() {
  const [games, setGames] = useState<NBAGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getDateOffset(0));

  const fetchScores = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nba/scores?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = (await res.json()) as {
        games?: APIGame[];
        data?: APIGame[];
        meta?: DataMeta;
      };

      const rawGames = data.games || data.data || [];
      const transformedGames = rawGames.map(transformAPIGame);

      setGames(transformedGames);
      setHasLiveGames(transformedGames.some((g) => g.status === 'live'));

      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores(selectedDate);
  }, [selectedDate, fetchScores]);

  // Auto-refresh for live games
  useEffect(() => {
    if (hasLiveGames) {
      const interval = setInterval(() => fetchScores(selectedDate), 30000);
      return () => clearInterval(interval);
    }
  }, [hasLiveGames, selectedDate, fetchScores]);

  // Date navigation
  const dateOptions = [
    { offset: -2, label: formatDate(getDateOffset(-2)) },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: formatDate(getDateOffset(2)) },
  ];

  const GameCard = ({ game }: { game: NBAGame }) => {
    const isLive = game.status === 'live';
    const isFinal = game.status === 'final';
    const isScheduled = game.status === 'scheduled';
    const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
    const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

    return (
      <Link href={`/nba/game/${game.id}`} className="block">
        <div
          className={`bg-graphite rounded-lg border transition-all hover:border-burnt-orange hover:bg-white/5 ${
            isLive ? 'border-success' : 'border-border-subtle'
          }`}
        >
          {/* Game Status Bar */}
          <div
            className={`px-4 py-2 rounded-t-lg flex items-center justify-between ${
              isLive ? 'bg-success/20' : isFinal ? 'bg-charcoal' : 'bg-burnt-orange/20'
            }`}
          >
            <span
              className={`text-xs font-semibold uppercase ${
                isLive ? 'text-success' : isFinal ? 'text-text-tertiary' : 'text-burnt-orange'
              }`}
            >
              {isLive ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />Q{game.quarter}{' '}
                  {game.timeRemaining}
                </span>
              ) : isFinal ? (
                'Final'
              ) : game.status === 'postponed' ? (
                'Postponed'
              ) : (
                game.time
              )}
            </span>
            <Badge variant="default" className="text-xs">
              NBA
            </Badge>
          </div>

          {/* Teams */}
          <div className="p-4 space-y-3">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo abbreviation={game.awayTeam.abbreviation} sport="nba" size="md" />
                <div>
                  <p className={`font-semibold ${awayWon ? 'text-white' : 'text-text-secondary'}`}>
                    {game.awayTeam.name}
                  </p>
                  <p className="text-xs text-text-tertiary">{game.awayTeam.record}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {awayWon && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                {!isScheduled && (
                  <span
                    className={`text-2xl font-bold font-mono ${
                      awayWon ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {game.awayTeam.score ?? 0}
                  </span>
                )}
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo abbreviation={game.homeTeam.abbreviation} sport="nba" size="md" />
                <div>
                  <p className={`font-semibold ${homeWon ? 'text-white' : 'text-text-secondary'}`}>
                    {game.homeTeam.name}
                  </p>
                  <p className="text-xs text-text-tertiary">{game.homeTeam.record}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {homeWon && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                {!isScheduled && (
                  <span
                    className={`text-2xl font-bold font-mono ${
                      homeWon ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {game.homeTeam.score ?? 0}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Venue Footer */}
          <div className="px-4 pb-3 text-xs text-text-tertiary border-t border-border-subtle pt-3 flex items-center justify-between">
            <span>{game.venue || 'TBD'}</span>
            {game.broadcast && <span className="text-burnt-orange">{game.broadcast}</span>}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
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
              <span className="text-white font-medium">Scores</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <ScrollReveal direction="up">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="primary">Live Scores</Badge>
                    {hasLiveGames && <LiveBadge />}
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={100}>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                    NBA Scores
                  </h1>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={150}>
                  <p className="text-text-secondary mt-2">Daily NBA scores from all 30 teams</p>
                </ScrollReveal>
              </div>
            </div>
          </Container>
        </Section>

        {/* Date Selector & Games */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Date Selector */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedDate(getDateOffset(-3))}
                className="p-2 text-text-tertiary hover:text-white transition-colors"
                aria-label="Previous days"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {dateOptions.map((option) => {
                const dateValue = getDateOffset(option.offset);
                const isSelected = selectedDate === dateValue;

                return (
                  <button
                    key={option.offset}
                    onClick={() => setSelectedDate(dateValue)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-burnt-orange text-white'
                        : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedDate(getDateOffset(3))}
                className="p-2 text-text-tertiary hover:text-white transition-colors"
                aria-label="Next days"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Games Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonScoreCard key={i} />
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-warning/10 border-warning/30">
                <p className="text-warning font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">
                  NBA season runs October through June. Check back during the season for live games.
                </p>
                <button
                  onClick={() => fetchScores(selectedDate)}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : games.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-text-secondary">No games scheduled for this date</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    NBA season runs October through June
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Live Games Section */}
                {games.some((g) => g.status === 'live') && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Live Games
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status === 'live')
                        .map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                    </div>
                  </div>
                )}

                {/* Final Games */}
                {games.some((g) => g.status === 'final') && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Final</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status === 'final')
                        .map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Games */}
                {games.some((g) => g.status === 'scheduled') && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Upcoming</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status === 'scheduled')
                        .map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                    </div>
                  </div>
                )}

                {/* Data Source Footer */}
                <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between flex-wrap gap-4">
                  <DataSourceBadge
                    source={meta?.dataSource || 'ESPN NBA API'}
                    timestamp={formatTimestamp(meta?.lastUpdated)}
                  />
                  {hasLiveGames && (
                    <span className="text-xs text-text-tertiary">
                      Auto-refreshing every 30 seconds
                    </span>
                  )}
                </div>
              </>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
