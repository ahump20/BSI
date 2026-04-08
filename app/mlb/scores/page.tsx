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
import { formatTimestamp, formatScheduleDate, getDateOffset } from '@/lib/utils/timezone';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import type { DataMeta } from '@/lib/types/data-meta';

/* ── ESPN competitor shape (what the API actually returns) ── */
interface ESPNCompetitor {
  id?: string;
  team?: { id?: string; displayName?: string; abbreviation?: string; logo?: string; shortDisplayName?: string };
  score?: string;
  homeAway?: 'home' | 'away';
  winner?: boolean;
  records?: Array<{ summary?: string; type?: string }>;
}

interface ESPNStatus {
  type?: { state?: string; detail?: string; shortDetail?: string; description?: string };
  period?: number;
  displayClock?: string;
}

interface RawGame {
  id?: string;
  gamePk?: number;
  name?: string;
  shortName?: string;
  date?: string;
  status?: ESPNStatus;
  teams?: ESPNCompetitor[] | { away?: TeamSide; home?: TeamSide };
  venue?: { name?: string; fullName?: string } | string;
  probablePitchers?: { away?: { name: string; stats?: string }; home?: { name: string; stats?: string } };
  broadcasts?: unknown;
}

/* ── Normalized shape for GameCard ── */
interface TeamSide {
  name: string;
  abbreviation: string;
  score: number;
  isWinner: boolean;
  hits: number;
  errors: number;
  record?: string;
  logo?: string;
}

interface Game {
  id: string;
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
  teams: { away: TeamSide; home: TeamSide };
  venue: { name: string };
  probablePitchers?: { away?: { name: string; stats?: string }; home?: { name: string; stats?: string } };
}

/** Convert ESPN competitor array OR pre-normalized object into {away, home} */
function normalizeGame(raw: RawGame): Game {
  const status = raw.status || {};
  const stateType = status.type || {};
  const stateStr = (stateType.state || '').toLowerCase();

  const isLive = stateStr === 'in';
  const isFinal = stateStr === 'post';

  // Parse inning from detail like "Bottom 3rd" or "Top 5th"
  let inning: number | undefined;
  let inningState: string | undefined;
  if (isLive && stateType.shortDetail) {
    const match = stateType.shortDetail.match(/(Top|Bot|Mid)\s+(\d+)/i);
    if (match) {
      inningState = match[1] === 'Bot' ? 'Bottom' : match[1] === 'Mid' ? 'Middle' : 'Top';
      inning = parseInt(match[2], 10);
    }
  }

  // Normalize teams — handle both ESPN array and pre-normalized object
  let away: TeamSide = { name: '', abbreviation: '', score: 0, isWinner: false, hits: 0, errors: 0 };
  let home: TeamSide = { name: '', abbreviation: '', score: 0, isWinner: false, hits: 0, errors: 0 };

  if (Array.isArray(raw.teams)) {
    for (const c of raw.teams as ESPNCompetitor[]) {
      const side: TeamSide = {
        name: c.team?.displayName || c.team?.shortDisplayName || '',
        abbreviation: c.team?.abbreviation || '',
        score: parseInt(String(c.score || '0'), 10),
        isWinner: !!c.winner,
        hits: 0,
        errors: 0,
        record: c.records?.find((r) => r.type === 'total')?.summary,
        logo: c.team?.logo,
      };
      if (c.homeAway === 'away') away = side;
      else home = side;
    }
  } else if (raw.teams && typeof raw.teams === 'object') {
    const t = raw.teams as { away?: TeamSide; home?: TeamSide };
    if (t.away) away = t.away;
    if (t.home) home = t.home;
  }

  // Normalize venue
  const venueName = typeof raw.venue === 'string'
    ? raw.venue
    : (raw.venue as Record<string, string> | undefined)?.fullName
      || (raw.venue as Record<string, string> | undefined)?.name
      || '';

  return {
    id: String(raw.id || raw.gamePk || '0'),
    gamePk: raw.gamePk,
    date: raw.date || '',
    status: {
      state: stateStr,
      detailedState: stateType.detail || stateType.description || (isFinal ? 'Final' : isLive ? 'In Progress' : 'Scheduled'),
      inning,
      inningState,
      isLive,
      isFinal,
    },
    teams: { away, home },
    venue: { name: venueName },
    probablePitchers: raw.probablePitchers,
  };
}

const formatDate = formatScheduleDate;

function GameCard({ game }: { game: Game }) {
  const isLive = game.status?.isLive;
  const isFinal = game.status?.isFinal;
  const isScheduled = !isLive && !isFinal;
  const gameId = game.gamePk || game.id;

  const away = game.teams?.away;
  const home = game.teams?.home;

  return (
    <Link href={`/mlb/game/${gameId}`} className="block">
      <div
        className={`rounded-sm border transition-all ${
          isLive ? 'border-success' : ''
        }`}
        style={{
          background: 'var(--surface-dugout)',
          borderColor: isLive ? undefined : 'var(--border-vintage)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--bsi-primary)';
          e.currentTarget.style.background = 'var(--surface-press-box)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isLive ? '' : 'var(--border-vintage)';
          e.currentTarget.style.background = 'var(--surface-dugout)';
        }}
      >
        {/* Game Status Bar */}
        <div
          className={`px-4 py-2 rounded-t-sm flex items-center justify-between ${
            isLive ? 'bg-success/20' : ''
          }`}
          style={{
            background: isLive ? undefined : isFinal ? 'var(--surface-dugout)' : 'rgba(191,87,0,0.2)',
          }}
        >
          <span
            className={`text-xs font-semibold uppercase ${
              isLive ? 'text-success' : ''
            }`}
            style={{
              color: isLive ? undefined : isFinal ? 'rgba(196,184,165,0.5)' : 'var(--bsi-primary)',
            }}
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
          {game.venue?.name && (
            <span className="text-xs" style={{ color: 'rgba(196,184,165,0.5)' }}>{game.venue.name}</span>
          )}
        </div>

        {/* Teams */}
        <div className="p-4 space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--surface-dugout)', color: 'var(--bsi-primary)' }}
              >
                {away?.abbreviation || '—'}
              </div>
              <div>
                <p
                  className="font-semibold"
                  style={{ color: isFinal && away?.isWinner ? 'var(--bsi-bone)' : 'var(--bsi-dust)' }}
                >
                  {away?.name || 'Unknown'}
                </p>
                {away?.record && (
                  <p className="text-xs" style={{ color: 'rgba(196,184,165,0.5)' }}>{away.record}</p>
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
                className="text-2xl font-bold font-mono"
                style={{
                  color: isScheduled
                    ? 'rgba(196,184,165,0.5)'
                    : isFinal && away?.isWinner
                      ? 'var(--bsi-bone)'
                      : 'var(--bsi-dust)',
                }}
              >
                {isScheduled ? '-' : away?.score ?? '-'}
              </span>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--surface-dugout)', color: 'var(--bsi-primary)' }}
              >
                {home?.abbreviation || '—'}
              </div>
              <div>
                <p
                  className="font-semibold"
                  style={{ color: isFinal && home?.isWinner ? 'var(--bsi-bone)' : 'var(--bsi-dust)' }}
                >
                  {home?.name || 'Unknown'}
                </p>
                {home?.record && (
                  <p className="text-xs" style={{ color: 'rgba(196,184,165,0.5)' }}>{home.record}</p>
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
                className="text-2xl font-bold font-mono"
                style={{
                  color: isScheduled
                    ? 'rgba(196,184,165,0.5)'
                    : isFinal && home?.isWinner
                      ? 'var(--bsi-bone)'
                      : 'var(--bsi-dust)',
                }}
              >
                {isScheduled ? '-' : home?.score ?? '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Game Details Footer */}
        {(isFinal || isLive) && (
          <div
            className="px-4 pb-3 flex items-center justify-between text-xs pt-3"
            style={{ color: 'rgba(196,184,165,0.5)', borderTop: '1px solid var(--border-vintage)' }}
          >
            <span>
              H: {away?.hits ?? 0}-{home?.hits ?? 0}
            </span>
            <span>
              E: {away?.errors ?? 0}-{home?.errors ?? 0}
            </span>
            <span style={{ color: 'var(--bsi-primary)' }}>Box Score →</span>
          </div>
        )}

        {/* Probable Pitchers for Scheduled Games */}
        {isScheduled && game.probablePitchers && (
          <div
            className="px-4 pb-3 text-xs pt-3"
            style={{ color: 'rgba(196,184,165,0.5)', borderTop: '1px solid var(--border-vintage)' }}
          >
            <div className="flex justify-between">
              <span>{game.probablePitchers.away?.name || 'Not Announced'}</span>
              <span>vs</span>
              <span>{game.probablePitchers.home?.name || 'Not Announced'}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MLBScoresPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getDateOffset(0));
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);

  const { data: rawData, loading, error, retry } = useSportData<{ games?: RawGame[]; live?: boolean; meta?: DataMeta }>(
    `/api/mlb/scores?date=${selectedDate}`,
    { refreshInterval: 30000, refreshWhen: liveGamesDetected, timeout: 10000 }
  );

  const games = useMemo(() => (rawData?.games || []).map(normalizeGame), [rawData]);
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

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
        {/* Breadcrumb */}
        <Section padding="sm" style={{ borderBottom: '1px solid var(--border-vintage)' }}>
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="transition-colors hover:opacity-80"
                style={{ color: 'rgba(196,184,165,0.5)' }}
              >
                MLB
              </Link>
              <span style={{ color: 'rgba(196,184,165,0.5)' }}>/</span>
              <span className="font-medium" style={{ color: 'var(--bsi-bone)' }}>Scores</span>
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
                  <h1
                    className="text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze"
                    style={{ fontFamily: 'var(--font-oswald)' }}
                  >
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
                className="p-2 transition-colors"
                style={{ color: 'rgba(196,184,165,0.5)' }}
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
                    className="px-4 py-2 rounded-sm font-semibold text-sm whitespace-nowrap transition-all"
                    style={{
                      background: isSelected ? 'var(--bsi-primary)' : 'var(--surface-dugout)',
                      color: isSelected ? '#fff' : 'var(--bsi-dust)',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedDate(getDateOffset(3))}
                className="p-2 transition-colors"
                style={{ color: 'rgba(196,184,165,0.5)' }}
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
            <DataErrorBoundary name="MLB Scores">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonScoreCard key={i} />
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-sm mt-1" style={{ color: 'var(--bsi-dust)' }}>{error}</p>
                <button
                  onClick={() => retry()}
                  className="mt-4 px-4 py-2 text-white rounded-sm transition-colors"
                  style={{ background: 'var(--bsi-primary)' }}
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
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--bsi-bone)' }}>
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
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--bsi-bone)' }}>Final</h2>
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
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--bsi-bone)' }}>Upcoming</h2>
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
                <div className="mt-8 pt-4 flex items-center justify-between flex-wrap gap-4" style={{ borderTop: '1px solid var(--border-vintage)' }}>
                  <DataSourceBadge
                    source={meta?.dataSource || 'MLB Stats API'}
                    timestamp={formatTimestamp(meta?.lastUpdated)}
                  />
                  {hasLiveGames && (
                    <span className="text-xs" style={{ color: 'rgba(196,184,165,0.5)' }}>
                      Auto-refreshing every 30 seconds
                    </span>
                  )}
                </div>
              </>
            )}
            </DataErrorBoundary>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
