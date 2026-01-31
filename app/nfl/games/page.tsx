'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';

interface Game {
  GameKey: string;
  Season: number;
  Week: number;
  Date: string;
  AwayTeam: string;
  HomeTeam: string;
  Status: string;
  AwayScore?: number;
  HomeScore?: number;
  Quarter?: string;
  TimeRemaining?: string;
  Channel?: string;
}

interface ScoresResponse {
  success: boolean;
  season: number;
  week: number;
  games: {
    live: Game[];
    final: Game[];
    scheduled: Game[];
  };
  rawData: Game[];
  source: {
    provider: string;
    retrievedAt: string;
    cacheHit: boolean;
  };
  meta: {
    dataProvider: string;
    timezone: string;
    liveGames?: number;
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

export default function NFLGamesPage() {
  const [scores, setScores] = useState<ScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nfl/scores');
      if (!response.ok) throw new Error('Failed to fetch scores');
      const data: ScoresResponse = await response.json();
      if (data.success) {
        setScores(data);
        setHasLiveGames((data.meta?.liveGames || 0) > 0);
      } else {
        throw new Error('API returned unsuccessful response');
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Auto-refresh for live games
  useEffect(() => {
    if (hasLiveGames) {
      const interval = setInterval(fetchScores, 30000);
      return () => clearInterval(interval);
    }
  }, [hasLiveGames, fetchScores]);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
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
              <span className="text-white font-medium">Games</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">{scores?.season || 2025} Season</Badge>
                {hasLiveGames && <LiveBadge />}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                NFL Games {scores?.week ? `- Week ${scores.week}` : ''}
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Live scores, final results, and upcoming matchups. Real data, no network spin.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Games Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonScoreCard key={i} />
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchScores}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : !scores?.rawData?.length ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-16 h-16 text-burnt-orange mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <ellipse cx="12" cy="12" rx="9" ry="5" />
                    <path d="M12 7v10M7 12h10" />
                  </svg>
                  <p className="text-text-secondary">No games scheduled this week.</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Bye week or offseason. Football returns Thursday through Monday when the
                    league's in action.
                  </p>
                </div>
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
                          strokeWidth="1.5"
                        >
                          <ellipse cx="12" cy="12" rx="9" ry="5" />
                          <path d="M12 7v10M7 12h10" />
                        </svg>
                        Week {scores.week} Games
                      </div>
                      {hasLiveGames && <LiveBadge />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Live Games */}
                    {scores.games.live.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-success font-semibold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          Live Games
                        </h4>
                        <div className="space-y-3">
                          {scores.games.live.map((game) => (
                            <div
                              key={game.GameKey}
                              className="bg-graphite rounded-lg p-4 flex justify-between items-center border border-success"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">{game.AwayTeam}</span>
                                  <span className="ml-auto text-burnt-orange font-bold text-lg">
                                    {game.AwayScore ?? 0}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{game.HomeTeam}</span>
                                  <span className="ml-auto text-burnt-orange font-bold text-lg">
                                    {game.HomeScore ?? 0}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-6 text-right min-w-[80px]">
                                <div className="text-success font-semibold text-sm">
                                  {game.Quarter} {game.TimeRemaining}
                                </div>
                                {game.Channel && (
                                  <div className="text-xs text-text-tertiary mt-1">
                                    {game.Channel}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final Games */}
                    {scores.games.final.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-text-tertiary font-semibold mb-3">Final</h4>
                        <div className="space-y-3">
                          {scores.games.final.map((game) => {
                            const awayWins = (game.AwayScore ?? 0) > (game.HomeScore ?? 0);
                            const homeWins = (game.HomeScore ?? 0) > (game.AwayScore ?? 0);
                            return (
                              <div
                                key={game.GameKey}
                                className="bg-graphite rounded-lg p-4 flex justify-between items-center border border-border-subtle"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className={`font-semibold ${awayWins ? 'text-white' : 'text-text-secondary'}`}
                                    >
                                      {game.AwayTeam}
                                    </span>
                                    {awayWins && (
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="w-4 h-4 text-success"
                                        fill="currentColor"
                                      >
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                      </svg>
                                    )}
                                    <span
                                      className={`ml-auto font-bold text-lg ${awayWins ? 'text-burnt-orange' : 'text-text-secondary'}`}
                                    >
                                      {game.AwayScore ?? 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-semibold ${homeWins ? 'text-white' : 'text-text-secondary'}`}
                                    >
                                      {game.HomeTeam}
                                    </span>
                                    {homeWins && (
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="w-4 h-4 text-success"
                                        fill="currentColor"
                                      >
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                      </svg>
                                    )}
                                    <span
                                      className={`ml-auto font-bold text-lg ${homeWins ? 'text-burnt-orange' : 'text-text-secondary'}`}
                                    >
                                      {game.HomeScore ?? 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-6 text-right min-w-[60px]">
                                  <div className="text-text-tertiary font-semibold text-sm">
                                    Final
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Scheduled Games */}
                    {scores.games.scheduled.length > 0 && (
                      <div>
                        <h4 className="text-burnt-orange font-semibold mb-3">Upcoming</h4>
                        <div className="space-y-3">
                          {scores.games.scheduled.map((game) => (
                            <div
                              key={game.GameKey}
                              className="bg-graphite rounded-lg p-4 flex justify-between items-center border border-border-subtle"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">{game.AwayTeam}</span>
                                  <span className="ml-auto text-text-secondary">-</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{game.HomeTeam}</span>
                                  <span className="ml-auto text-text-secondary">-</span>
                                </div>
                              </div>
                              <div className="ml-6 text-right min-w-[100px]">
                                <div className="text-burnt-orange font-semibold text-sm">
                                  {new Date(game.Date).toLocaleString('en-US', {
                                    weekday: 'short',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                    timeZone: 'America/Chicago',
                                  })}{' '}
                                  CT
                                </div>
                                {game.Channel && (
                                  <div className="text-xs text-text-tertiary mt-1">
                                    {game.Channel}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-border-subtle">
                      <DataSourceBadge
                        source={scores.meta?.dataProvider || 'SportsDataIO'}
                        timestamp={formatTimestamp(scores.source?.retrievedAt)}
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
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
