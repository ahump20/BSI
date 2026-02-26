'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge, FreshnessBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';

interface NBATeam {
  id: string;
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    shortDisplayName: string;
    logo?: string;
    logos?: Array<{ href: string }>;
  };
  score?: string;
  homeAway: 'home' | 'away';
  winner?: boolean;
  records?: Array<{ summary: string }>;
}

interface NBAGame {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
    period: number;
    displayClock: string;
  };
  teams: NBATeam[];
  venue?: {
    fullName: string;
    city: string;
  };
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
}

interface ScoreboardResponse {
  timestamp: string;
  date: string;
  games: NBAGame[];
  meta: DataMeta;
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

function formatGameTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getDateOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
}

const conferences = ['All', 'Eastern', 'Western'];

export default function NBAGamesPage() {
  const [games, setGames] = useState<NBAGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getDateOffset(0));
  const [selectedConference, setSelectedConference] = useState('All');

  const fetchScores = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nba/scoreboard?date=${date}`);

      if (!res.ok) {
        throw new Error('Failed to fetch scores');
      }

      const data: ScoreboardResponse = await res.json();

      if (data.games) {
        setGames(data.games);
        setHasLiveGames(data.games.some((g) => g.status.type.state === 'in'));
        setMeta(data.meta);
      } else {
        setError('No games found');
        setGames([]);
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

  // Categorize games by status
  const categorizeGames = (games: NBAGame[]) => {
    const live = games.filter((g) => g.status.type.state === 'in');
    const final = games.filter((g) => g.status.type.completed);
    const scheduled = games.filter(
      (g) => g.status.type.state === 'pre' && !g.status.type.completed
    );
    return { live, final, scheduled };
  };

  const GameCard = ({ game }: { game: NBAGame }) => {
    const isLive = game.status.type.state === 'in';
    const isFinal = game.status.type.completed;
    const isScheduled = game.status.type.state === 'pre';

    const homeTeam = game.teams?.find((t) => t.homeAway === 'home');
    const awayTeam = game.teams?.find((t) => t.homeAway === 'away');

    if (!homeTeam || !awayTeam) return null;

    const awayScore = parseInt(awayTeam.score || '0', 10);
    const homeScore = parseInt(homeTeam.score || '0', 10);
    const awayWon = isFinal && awayScore > homeScore;
    const homeWon = isFinal && homeScore > awayScore;

    const getTeamLogo = (team: NBATeam) => {
      return team.team.logos?.[0]?.href || team.team.logo || null;
    };

    return (
      <Link href={`/nba/game/${game.id}`} className="block">
        <div
          className={`bg-background-tertiary rounded-lg border transition-all hover:border-burnt-orange hover:bg-surface-light ${
            isLive ? 'border-success' : 'border-border-subtle'
          }`}
        >
          {/* Game Status Bar */}
          <div
            className={`px-4 py-2 rounded-t-lg flex items-center justify-between ${
              isLive ? 'bg-success/20' : isFinal ? 'bg-background-secondary' : 'bg-burnt-orange/20'
            }`}
          >
            <span
              className={`text-xs font-semibold uppercase ${
                isLive ? 'text-success' : isFinal ? 'text-text-tertiary' : 'text-burnt-orange'
              }`}
            >
              {isLive ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  {game.status.type.shortDetail || `Q${game.status.period} ${game.status.displayClock}`}
                </span>
              ) : isFinal ? (
                game.status.type.shortDetail || 'Final'
              ) : (
                formatGameTime(game.date)
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
                <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center overflow-hidden">
                  {getTeamLogo(awayTeam) ? (
                    <img
                      src={getTeamLogo(awayTeam)!}
                      alt={awayTeam.team.abbreviation}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-burnt-orange">
                      {awayTeam.team.abbreviation}
                    </span>
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${awayWon ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {awayTeam.team.shortDisplayName || awayTeam.team.displayName}
                  </p>
                  {awayTeam.records?.[0] && (
                    <p className="text-xs text-text-tertiary">{awayTeam.records[0].summary}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {awayWon && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                <span
                  className={`text-2xl font-bold font-mono ${
                    isScheduled
                      ? 'text-text-tertiary'
                      : awayWon
                        ? 'text-text-primary'
                        : 'text-text-secondary'
                  }`}
                >
                  {awayTeam.score || '-'}
                </span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center overflow-hidden">
                  {getTeamLogo(homeTeam) ? (
                    <img
                      src={getTeamLogo(homeTeam)!}
                      alt={homeTeam.team.abbreviation}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-burnt-orange">
                      {homeTeam.team.abbreviation}
                    </span>
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${homeWon ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {homeTeam.team.shortDisplayName || homeTeam.team.displayName}
                  </p>
                  {homeTeam.records?.[0] && (
                    <p className="text-xs text-text-tertiary">{homeTeam.records[0].summary}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {homeWon && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                <span
                  className={`text-2xl font-bold font-mono ${
                    isScheduled
                      ? 'text-text-tertiary'
                      : homeWon
                        ? 'text-text-primary'
                        : 'text-text-secondary'
                  }`}
                >
                  {homeTeam.score || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Venue Footer */}
          {game.venue && (
            <div className="px-4 pb-3 text-xs text-text-tertiary border-t border-border-subtle pt-3">
              {game.venue.fullName}
              {game.venue.city && `, ${game.venue.city}`}
            </div>
          )}
        </div>
      </Link>
    );
  };

  const { live, final, scheduled } = categorizeGames(games);

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
              <span className="text-text-primary font-medium">Games</span>
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
                    {hasLiveGames && <FreshnessBadge isLive fetchedAt={meta?.lastUpdated} />}
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={100}>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                    NBA Scores
                  </h1>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={150}>
                  <p className="text-text-secondary mt-2">
                    Live scores and results from around the league
                  </p>
                </ScrollReveal>
              </div>
            </div>
          </Container>
        </Section>

        {/* Filters & Games */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Date Selector */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedDate(getDateOffset(-3))}
                className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
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
                        : 'bg-background-tertiary text-text-secondary hover:bg-surface-light hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedDate(getDateOffset(3))}
                className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
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

            {/* Conference Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {conferences.map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedConference === conf
                      ? 'bg-burnt-orange text-white'
                      : 'bg-background-tertiary text-text-secondary hover:text-text-primary hover:bg-slate'
                  }`}
                >
                  {conf === 'All' ? 'All Teams' : `${conf} Conference`}
                </button>
              ))}
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
                <p className="text-warning font-semibold">Error Loading Games</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20" />
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
                {live.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Live Games
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {live.map((game) => (
                        <ScrollReveal key={game.id}>
                          <GameCard game={game} />
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Games */}
                {final.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Final</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {final.map((game) => (
                        <ScrollReveal key={game.id}>
                          <GameCard game={game} />
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Games */}
                {scheduled.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {scheduled.map((game) => (
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
