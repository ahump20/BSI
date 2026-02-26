'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge, FreshnessBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';

interface Game {
  id: number;
  gamePk?: number;
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
      record?: string;
    };
    home: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      hits: number;
      errors: number;
      record?: string;
    };
  };
  venue: { name: string };
  probablePitchers?: {
    away?: { name: string; stats?: string };
    home?: { name: string; stats?: string };
  };
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
  degraded?: boolean;
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

export default function MLBScoresPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getDateOffset(0));
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);

  const { data: rawData, loading, error, retry } = useSportData<{ games?: Game[]; live?: boolean; meta?: DataMeta }>(
    `/api/mlb/scores?date=${selectedDate}`,
    { refreshInterval: 30000, refreshWhen: liveGamesDetected, timeout: 10000 }
  );

  const games = useMemo(() => rawData?.games || [], [rawData]);
  const hasLiveGames = useMemo(() => rawData?.live || games.some((g) => g.status.isLive), [rawData, games]);
  const meta = rawData?.meta || null;

  // Sync live detection to enable auto-refresh
  useEffect(() => { setLiveGamesDetected(hasLiveGames); }, [hasLiveGames]);

  // Date navigation
  const dateOptions = [
    { offset: -2, label: formatDate(getDateOffset(-2)) },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: formatDate(getDateOffset(2)) },
  ];

  const GameCard = ({ game }: { game: Game }) => {
    const isLive = game.status?.isLive;
    const isFinal = game.status?.isFinal;
    const isScheduled = !isLive && !isFinal;
    const gameId = game.gamePk || game.id;

    const away = game.teams?.away;
    const home = game.teams?.home;

    return (
      <Link href={`/mlb/game/${gameId}`} className="block">
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
                  {game.status?.inningState} {game.status?.inning}
                </span>
              ) : (
                game.status?.detailedState
              )}
            </span>
            <span className="text-xs text-text-tertiary">{game.venue?.name || 'TBD'}</span>
          </div>

          {/* Teams */}
          <div className="p-4 space-y-3">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                  {away?.abbreviation ?? '???'}
                </div>
                <div>
                  <p
                    className={`font-semibold ${isFinal && away?.isWinner ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    {away?.name ?? 'Away'}
                  </p>
                  {away?.record && (
                    <p className="text-xs text-text-tertiary">{away.record}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isFinal && away?.isWinner && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                <span
                  className={`text-2xl font-bold font-mono ${
                    isScheduled
                      ? 'text-text-tertiary'
                      : isFinal && away?.isWinner
                        ? 'text-text-primary'
                        : 'text-text-secondary'
                  }`}
                >
                  {isScheduled ? '-' : away?.score ?? '-'}
                </span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                  {home?.abbreviation ?? '???'}
                </div>
                <div>
                  <p
                    className={`font-semibold ${isFinal && home?.isWinner ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    {home?.name ?? 'Home'}
                  </p>
                  {home?.record && (
                    <p className="text-xs text-text-tertiary">{home.record}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isFinal && home?.isWinner && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                <span
                  className={`text-2xl font-bold font-mono ${
                    isScheduled
                      ? 'text-text-tertiary'
                      : isFinal && home?.isWinner
                        ? 'text-text-primary'
                        : 'text-text-secondary'
                  }`}
                >
                  {isScheduled ? '-' : home?.score ?? '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Game Details Footer */}
          {(isFinal || isLive) && (
            <div className="px-4 pb-3 flex items-center justify-between text-xs text-text-tertiary border-t border-border-subtle pt-3">
              <span>
                H: {away?.hits ?? 0}-{home?.hits ?? 0}
              </span>
              <span>
                E: {away?.errors ?? 0}-{home?.errors ?? 0}
              </span>
              <span className="text-burnt-orange hover:text-ember">Box Score →</span>
            </div>
          )}

          {/* Probable Pitchers for Scheduled Games */}
          {isScheduled && game.probablePitchers && (
            <div className="px-4 pb-3 text-xs text-text-tertiary border-t border-border-subtle pt-3">
              <div className="flex justify-between">
                <span>{game.probablePitchers.away?.name || 'TBD'}</span>
                <span>vs</span>
                <span>{game.probablePitchers.home?.name || 'TBD'}</span>
              </div>
            </div>
          )}
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
                href="/mlb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                MLB
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Scores</span>
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
                    MLB Scores
                  </h1>
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
                        : 'bg-background-tertiary text-text-secondary hover:bg-surface-medium hover:text-text-primary'
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

            {/* Games Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonScoreCard key={i} />
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={() => retry()}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : games.length === 0 ? (
              <EmptyState
                type={meta?.degraded ? 'source-unavailable' : 'no-games'}
                onRetry={meta?.degraded ? () => retry() : undefined}
              />
            ) : (
              <>
                {/* Live Games Section */}
                {games.some((g) => g.status.isLive) && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Live Games
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status.isLive)
                        .map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                    </div>
                  </div>
                )}

                {/* Final Games */}
                {games.some((g) => g.status.isFinal) && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Final</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status.isFinal)
                        .map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Games */}
                {games.some((g) => !g.status.isLive && !g.status.isFinal) && (
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => !g.status.isLive && !g.status.isFinal)
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
                    source={meta?.dataSource || 'MLB Stats API'}
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
