'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge, FreshnessBadge } from '@/components/ui/Badge';
import { FilterPill } from '@/components/ui/FilterPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollReveal } from '@/components/cinematic';

import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { OffSeasonBanner, detectSeasonState } from '@/components/ui/OffSeasonBanner';
import { useSportData } from '@/lib/hooks/useSportData';
import { formatTimestamp, formatScheduleDate, getDateOffset } from '@/lib/utils/timezone';

interface ESPNGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type?: { completed?: boolean; description?: string };
    displayClock?: string;
    period?: number;
  };
  teams: Array<{
    id: string;
    team: {
      id: string;
      displayName: string;
      abbreviation: string;
      logo?: string;
      logos?: Array<{ href: string }>;
    };
    score?: string;
    homeAway: string;
    winner?: boolean;
    records?: Array<{ summary: string }>;
  }>;
  venue?: { fullName?: string };
}

const formatDate = formatScheduleDate;


function GameCard({ game }: { game: ESPNGame }) {
  const home = game.teams.find((t) => t.homeAway === 'home');
  const away = game.teams.find((t) => t.homeAway === 'away');
  const isCompleted = game.status?.type?.completed;
  const isLive =
    !isCompleted && game.status?.period && game.status.period > 0;
  const isScheduled = !isCompleted && !isLive;
  const statusText = isLive
    ? `Q${game.status.period} ${game.status.displayClock || ''}`
    : game.status?.type?.description || 'Scheduled';

  return (
    <Link href={`/cfb/game/${game.id}`} className="block">
      <div
        className={`bg-background-tertiary rounded-sm border transition-all hover:border-burnt-orange hover:bg-surface-light ${
          isLive ? 'border-success' : 'border-border-subtle'
        }`}
      >
        {/* Status Bar */}
        <div
          className={`px-4 py-2 rounded-t-sm flex items-center justify-between ${
            isLive ? 'bg-success/20' : isCompleted ? 'bg-background-secondary' : 'bg-burnt-orange/20'
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase ${
              isLive ? 'text-success' : isCompleted ? 'text-text-tertiary' : 'text-burnt-orange'
            }`}
          >
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                {statusText}
              </span>
            ) : (
              statusText
            )}
          </span>
          <Badge variant="default" className="text-xs">
            CFB
          </Badge>
        </div>

        {/* Teams */}
        <div className="p-4 space-y-3">
          {[away, home].map((team) => {
            if (!team) return null;
            const isWinner = isCompleted && team.winner;
            const logoUrl = team.team.logo || team.team.logos?.[0]?.href;
            return (
              <div key={team.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {logoUrl ? (
                    <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center overflow-hidden">
                      <img src={logoUrl} alt={team.team.abbreviation} className="w-6 h-6 object-contain" loading="lazy" decoding="async" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                      {team.team.abbreviation}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold truncate ${isWinner ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {team.team.displayName}
                      </p>
                      {isWinner && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-success" fill="currentColor" aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                    </div>
                    {team.records?.[0]?.summary && (
                      <p className="text-xs text-text-tertiary">{team.records[0].summary}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-2xl font-bold font-mono ${
                    isScheduled
                      ? 'text-text-tertiary'
                      : isWinner
                        ? 'text-text-primary'
                        : 'text-text-secondary'
                  }`}
                >
                  {team.score ?? '-'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Venue Footer */}
        {game.venue?.fullName && (
          <div className="px-4 pb-3 text-xs text-text-tertiary border-t border-border-subtle pt-3">
            {game.venue.fullName}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CFBScoresPage() {
  const [selectedDate, setSelectedDate] = useState(getDateOffset(0));
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);

  const { data: scoresData, loading, error, retry, lastUpdated: lastUpdatedDate } = useSportData<{
    games?: ESPNGame[];
    meta?: { lastUpdated?: string };
  }>(`/api/cfb/scores?date=${selectedDate}`, {
    refreshInterval: 30000,
    refreshWhen: liveGamesDetected,
  });

  const games = useMemo(() => scoresData?.games || [], [scoresData]);
  const lastUpdated = scoresData?.meta?.lastUpdated || lastUpdatedDate?.toISOString() || '';

  const hasLive = useMemo(
    () => games.some((g) => !g.status?.type?.completed && g.status?.period && g.status.period > 0),
    [games],
  );

  useEffect(() => { setLiveGamesDetected(hasLive); }, [hasLive]);

  const liveGames = useMemo(
    () => games.filter((g) => !g.status?.type?.completed && g.status?.period && g.status.period > 0),
    [games],
  );
  const finalGames = useMemo(() => games.filter((g) => g.status?.type?.completed), [games]);
  const scheduledGames = useMemo(
    () => games.filter((g) => !g.status?.type?.completed && !(g.status?.period && g.status.period > 0)),
    [games],
  );

  // Detect off-season state so visitors hitting /cfb/scores in April don't see
  // an empty scoreboard with no context and assume the data is stale.
  // `sport: 'cfb'` enables calendar fallback — without it, an empty games
  // array during the true offseason is ambiguous and detection returns
  // 'in-season' by default.
  const seasonState = useMemo(
    () =>
      detectSeasonState(
        games.map((g) => ({
          date: g.date,
          isCompleted: !!g.status?.type?.completed,
          isLive: !g.status?.type?.completed && !!(g.status?.period && g.status.period > 0),
          isScheduled: !g.status?.type?.completed && !(g.status?.period && g.status.period > 0),
        })),
        { sport: 'cfb' },
      ),
    [games],
  );

  const dateOptions = [
    { offset: -2, label: formatDate(getDateOffset(-2)) },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: formatDate(getDateOffset(2)) },
  ];

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/cfb" className="text-text-tertiary hover:text-burnt-orange transition-colors">CFB</Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Scores</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">Live Scores</Badge>
                {hasLive && <FreshnessBadge isLive fetchedAt={lastUpdated} />}
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                College Football Scores
              </h1>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <DataErrorBoundary name="College Football Scores">
              {/* Date Selector */}
              <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedDate(getDateOffset(-3))}
                  className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Previous days"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                {dateOptions.map((opt) => {
                  const val = getDateOffset(opt.offset);
                  return (
                    <FilterPill
                      key={opt.offset}
                      active={selectedDate === val}
                      onClick={() => setSelectedDate(val)}
                      uppercase={false}
                      className="whitespace-nowrap"
                    >
                      {opt.label}
                    </FilterPill>
                  );
                })}

                <button
                  onClick={() => setSelectedDate(getDateOffset(3))}
                  className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Next days"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
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
                    className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-sm hover:bg-burnt-orange/80 transition-colors"
                  >
                    Retry
                  </button>
                </Card>
              ) : seasonState.state !== 'in-season' ? (
                // Off-season branch — fires BEFORE the empty-state check,
                // otherwise an empty games array during the offseason would
                // route to the generic "NO GAMES FOUND" card and the banner
                // would never render.
                <OffSeasonBanner
                  state={seasonState.state}
                  referenceDate={seasonState.referenceDate}
                  sportLabel="College Football"
                  seasonTimingHint="Kickoff for the 2026 season is late August."
                />
              ) : games.length === 0 ? (
                <EmptyState
                  type="no-games"
                  sport="CFB"
                  message="College football season typically runs August through January."
                  action={{ label: 'View CFB Standings', href: '/cfb/standings' }}
                />
              ) : (
                <>
                  {/* Live Games */}
                  {liveGames.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        Live Games
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {liveGames.map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Games */}
                  {finalGames.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold text-text-primary mb-4">Final</h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {finalGames.map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled Games */}
                  {scheduledGames.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming</h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {scheduledGames.map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Source Footer */}
                  <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between flex-wrap gap-4">
                    <DataSourceBadge source="SportsDataIO" timestamp={formatTimestamp(lastUpdated)} />
                    {hasLive && (
                      <span className="text-xs text-text-tertiary">Auto-refreshing every 30 seconds</span>
                    )}
                  </div>
                </>
              )}
            </DataErrorBoundary>
          </Container>
        </Section>
      </div>
    </>
  );
}
