'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';
import {
  filterGamesByConference,
  findNextGameDate,
  formatDatePill,
  groupGamesByStatus,
  normalizeSchedulePayload,
  shiftIsoDate,
  toIsoDate,
  type NormalizedSchedulePayload,
  type PowerConference,
  type ScheduleGame,
  type ScheduleMeta,
} from '@/lib/college-baseball/schedule-utils';

const conferences: PowerConference[] = ['All P4', 'SEC', 'ACC', 'Big 12', 'Big Ten'];

function getRelativeDateLabel(isoDate: string): string {
  const today = toIsoDate(new Date());
  if (isoDate === today) return 'Today';
  if (isoDate === shiftIsoDate(today, -1)) return 'Yesterday';
  if (isoDate === shiftIsoDate(today, 1)) return 'Tomorrow';
  return formatDatePill(isoDate);
}

function parseScheduleMeta(
  payload: unknown,
  normalized: NormalizedSchedulePayload,
  headers: Headers
): ScheduleMeta {
  const bodyMeta =
    payload && typeof payload === 'object' && 'meta' in payload
      ? (payload.meta as Record<string, unknown>)
      : undefined;

  const bodySource = typeof bodyMeta?.dataSource === 'string' ? bodyMeta.dataSource : undefined;
  const bodyLastUpdated =
    typeof bodyMeta?.lastUpdated === 'string' ? bodyMeta.lastUpdated : undefined;

  return {
    dataSource: bodySource || headers.get('x-data-source') || normalized.meta.dataSource || 'NCAA/ESPN',
    lastUpdated:
      bodyLastUpdated ||
      headers.get('x-last-updated') ||
      normalized.meta.lastUpdated ||
      new Date().toISOString(),
    timezone: 'America/Chicago',
  };
}

function GameCard({ game }: { game: ScheduleGame }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  return (
    <Link href={`/college-baseball/game/${game.id}`} className="block">
      <div
        className={`bg-graphite rounded-lg border transition-all hover:border-burnt-orange hover:bg-white/5 ${
          isLive ? 'border-success' : 'border-border-subtle'
        }`}
      >
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
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                {game.situation || 'Live'}
              </span>
            ) : isFinal ? (
              'Final'
            ) : game.status === 'postponed' ? (
              'Postponed'
            ) : game.status === 'canceled' ? (
              'Canceled'
            ) : (
              game.time
            )}
          </span>
          <Badge variant="default" className="text-xs">
            {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
          </Badge>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                {game.awayTeam.shortName?.slice(0, 3).toUpperCase() || 'AWY'}
              </div>
              <div>
                <p className={`font-semibold ${awayWon ? 'text-white' : 'text-text-secondary'}`}>
                  {game.awayTeam.name}
                </p>
                <p className="text-xs text-text-tertiary">
                  {game.awayTeam.record.wins}-{game.awayTeam.record.losses}
                </p>
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
                      ? 'text-white'
                      : 'text-text-secondary'
                }`}
              >
                {game.awayTeam.score !== null ? game.awayTeam.score : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                {game.homeTeam.shortName?.slice(0, 3).toUpperCase() || 'HME'}
              </div>
              <div>
                <p className={`font-semibold ${homeWon ? 'text-white' : 'text-text-secondary'}`}>
                  {game.homeTeam.name}
                </p>
                <p className="text-xs text-text-tertiary">
                  {game.homeTeam.record.wins}-{game.homeTeam.record.losses}
                </p>
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
                      ? 'text-white'
                      : 'text-text-secondary'
                }`}
              >
                {game.homeTeam.score !== null ? game.homeTeam.score : '-'}
              </span>
            </div>
          </div>
        </div>

        {game.venue && game.venue !== 'TBD' && (
          <div className="px-4 pb-3 text-xs text-text-tertiary border-t border-border-subtle pt-3">
            {game.venue}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CollegeBaseballScoresPage() {
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ScheduleMeta | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [selectedConference, setSelectedConference] = useState<PowerConference>('All P4');
  const [scheduleInitialized, setScheduleInitialized] = useState(false);
  const cacheRef = useRef<Map<string, NormalizedSchedulePayload>>(new Map());

  const loadScheduleForDate = useCallback(async (date: string): Promise<NormalizedSchedulePayload> => {
    const cached = cacheRef.current.get(date);
    if (cached) return cached;

    const res = await fetch(`/api/college-baseball/schedule?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch scores');

    const payload = (await res.json()) as unknown;
    const normalized = normalizeSchedulePayload(payload, res.headers);
    const finalMeta = parseScheduleMeta(payload, normalized, res.headers);

    const result: NormalizedSchedulePayload = {
      ...normalized,
      meta: finalMeta,
    };

    cacheRef.current.set(date, result);
    return result;
  }, []);

  const fetchScores = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const payload = await loadScheduleForDate(date);
      setGames(payload.games);
      setMeta(payload.meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [loadScheduleForDate]);

  useEffect(() => {
    if (scheduleInitialized) return;

    let mounted = true;
    const initialize = async () => {
      const today = toIsoDate(new Date());

      try {
        const nextDate = await findNextGameDate({
          startDate: today,
          maxDays: 7,
          loadGamesForDate: async (candidateDate) => {
            const payload = await loadScheduleForDate(candidateDate);
            return filterGamesByConference(payload.games, selectedConference);
          },
        });

        if (!mounted) return;
        setSelectedDate(nextDate);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!mounted) return;
        setScheduleInitialized(true);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadScheduleForDate, scheduleInitialized, selectedConference]);

  useEffect(() => {
    if (!scheduleInitialized) return;
    fetchScores(selectedDate);
  }, [fetchScores, scheduleInitialized, selectedDate]);

  const filteredGames = useMemo(
    () => filterGamesByConference(games, selectedConference),
    [games, selectedConference]
  );

  const groupedGames = useMemo(
    () => groupGamesByStatus(filteredGames),
    [filteredGames]
  );

  const hasLiveGames = groupedGames.live.length > 0;

  useEffect(() => {
    if (!hasLiveGames || !scheduleInitialized) return;

    const interval = setInterval(async () => {
      cacheRef.current.delete(selectedDate);
      await fetchScores(selectedDate);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchScores, hasLiveGames, scheduleInitialized, selectedDate]);

  const dateOptions = useMemo(
    () =>
      [-2, -1, 0, 1, 2].map((offset) => {
        const date = shiftIsoDate(selectedDate, offset);
        return {
          date,
          label: getRelativeDateLabel(date),
        };
      }),
    [selectedDate]
  );

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/college-baseball"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                College Baseball
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Scores</span>
            </nav>
          </Container>
        </Section>

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
                    College Baseball Scores
                  </h1>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={150}>
                  <p className="text-text-secondary mt-2">
                    Live scores for all 300+ D1 programs — the coverage ESPN won&apos;t give you
                  </p>
                </ScrollReveal>
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedDate(shiftIsoDate(selectedDate, -1))}
                className="p-2 text-text-tertiary hover:text-white transition-colors"
                aria-label="Previous day"
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

              {dateOptions.map((option) => (
                <button
                  key={option.date}
                  onClick={() => setSelectedDate(option.date)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                    selectedDate === option.date
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                onClick={() => setSelectedDate(shiftIsoDate(selectedDate, 1))}
                className="p-2 text-text-tertiary hover:text-white transition-colors"
                aria-label="Next day"
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

            <div className="flex flex-wrap gap-2 mb-8">
              {conferences.map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedConference === conf
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:text-white hover:bg-slate'
                  }`}
                >
                  {conf}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonScoreCard key={i} />
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-warning/10 border-warning/30">
                <p className="text-warning font-semibold">No Games Found</p>
                <p className="text-text-secondary text-sm mt-1">
                  College baseball season runs February through June. Check back during the season
                  for live games.
                </p>
                <button
                  onClick={() => fetchScores(selectedDate)}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : filteredGames.length === 0 ? (
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
                    College baseball season runs February through June
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {groupedGames.live.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Live Games
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {groupedGames.live.map((game) => (
                        <ScrollReveal key={game.id}>
                          <GameCard game={game} />
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}

                {groupedGames.final.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Final</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {groupedGames.final.map((game) => (
                        <ScrollReveal key={game.id}>
                          <GameCard game={game} />
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}

                {groupedGames.upcoming.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Upcoming</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {groupedGames.upcoming.map((game) => (
                        <ScrollReveal key={game.id}>
                          <GameCard game={game} />
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between flex-wrap gap-4">
                  <DataSourceBadge
                    source={meta?.dataSource || 'NCAA/ESPN'}
                    timestamp={formatTimestamp(meta?.lastUpdated)}
                  />
                  {hasLiveGames && (
                    <span className="text-xs text-text-tertiary">Auto-refreshing every 30 seconds</span>
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
