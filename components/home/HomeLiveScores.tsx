'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { FreshnessBadge } from '@/components/ui/Badge';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { getDateOffset } from '@/lib/utils/timezone';

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

/** Normalized game shape — one type to rule all sports */
interface NormalizedGame {
  id: string;
  sport: string;
  sportLabel: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  detail?: string;
  startTime?: string;
  home: { name: string; abbr: string; score: number | null };
  away: { name: string; abbr: string; score: number | null };
  venue?: string;
  href: string;
}

type SportFilter = 'all' | 'college-baseball' | 'mlb' | 'nfl' | 'nba';

// ────────────────────────────────────────
// Sport config
// ────────────────────────────────────────

const SPORT_COLORS: Record<string, string> = {
  'college-baseball': '#BF5700',
  mlb: '#C41E3A',
  nfl: '#013369',
  nba: '#FF6B35',
};

interface SportEndpoint {
  key: SportFilter;
  label: string;
  endpoint: string;
  scoresHref: string;
  color: string;
}

/** Season-aware sport endpoints. Same logic as hero-scores.ts. */
function getActiveSports(): SportEndpoint[] {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const md = m * 100 + d;

  const sports: SportEndpoint[] = [];

  // College baseball: Feb 14 – Jun 30
  if (md >= 214 && md <= 630) {
    sports.push({
      key: 'college-baseball',
      label: 'College Baseball',
      endpoint: '/api/college-baseball/schedule',
      scoresHref: '/college-baseball/scores',
      color: SPORT_COLORS['college-baseball'],
    });
  }

  // MLB: Feb 15 – Nov 5
  if (md >= 215 && md <= 1105) {
    sports.push({
      key: 'mlb',
      label: 'MLB',
      endpoint: '/api/mlb/scores',
      scoresHref: '/mlb',
      color: SPORT_COLORS.mlb,
    });
  }

  // NBA: Oct 20 – Jun 20 (spans year boundary)
  if (md >= 1020 || md <= 620) {
    sports.push({
      key: 'nba',
      label: 'NBA',
      endpoint: '/api/nba/scores',
      scoresHref: '/nba',
      color: SPORT_COLORS.nba,
    });
  }

  // NFL: Aug 1 – Feb 15 (spans year boundary)
  if (md >= 801 || md <= 215) {
    sports.push({
      key: 'nfl',
      label: 'NFL',
      endpoint: '/api/nfl/scores',
      scoresHref: '/nfl',
      color: SPORT_COLORS.nfl,
    });
  }

  return sports;
}

// ────────────────────────────────────────
// Normalization — handles all response shapes
// ────────────────────────────────────────

/**
 * Normalizes college baseball /schedule response.
 * Shape: { data: [{ id, status, homeTeam: { name, shortName, score }, awayTeam: ... }] }
 */
function normalizeCollegeBaseball(data: Record<string, unknown>): NormalizedGame[] {
  const games = (data.data || data.games || []) as Record<string, unknown>[];
  return games.map((g, i) => {
    const home = g.homeTeam as Record<string, unknown> | undefined;
    const away = g.awayTeam as Record<string, unknown> | undefined;
    const status = (g.status as string) || 'scheduled';
    const id = (g.id as string) || `cbb-${i}`;

    const isLive = status === 'live';
    const isFinal = status === 'final';
    const gameHref = isLive
      ? `/college-baseball/game/${id}/live`
      : isFinal
        ? `/college-baseball/game/${id}/box-score`
        : `/college-baseball/game/${id}`;

    return {
      id,
      sport: 'college-baseball',
      sportLabel: 'CBALL',
      status: status as NormalizedGame['status'],
      detail: g.inning ? `INN ${g.inning}` : (g.situation as string) || undefined,
      startTime: (g.time as string) || undefined,
      home: {
        name: (home?.name as string) || 'Home',
        abbr: (home?.shortName as string) || '',
        score: home?.score != null ? Number(home.score) : null,
      },
      away: {
        name: (away?.name as string) || 'Away',
        abbr: (away?.shortName as string) || '',
        score: away?.score != null ? Number(away.score) : null,
      },
      venue: (g.venue as string) || undefined,
      href: gameHref,
    };
  });
}

/**
 * Normalizes BSIScoreboardResult format (MLB, NFL, NBA).
 * Shape: { games: [{ teams: [{ homeAway, team: { displayName, abbreviation }, score }], status: { type: { state } } }] }
 */
function normalizeBSIScoreboard(
  data: Record<string, unknown>,
  sportKey: string,
  sportLabel: string,
  scoresHref: string,
): NormalizedGame[] {
  const games = (data.games || []) as Record<string, unknown>[];
  return games.map((g, i) => {
    const teams = (g.teams || []) as Record<string, unknown>[];
    const homeEntry = teams.find((t) => t.homeAway === 'home') || teams[1];
    const awayEntry = teams.find((t) => t.homeAway === 'away') || teams[0];
    const homeTeam = (homeEntry?.team as Record<string, unknown>) || homeEntry || {};
    const awayTeam = (awayEntry?.team as Record<string, unknown>) || awayEntry || {};

    const statusObj = g.status as Record<string, unknown> | undefined;
    const statusType = statusObj?.type as Record<string, unknown> | undefined;
    const state = (statusType?.state as string) || '';
    const completed = statusType?.completed === true;

    let status: NormalizedGame['status'] = 'scheduled';
    if (state === 'in') status = 'live';
    else if (state === 'post' || completed) status = 'final';
    else if (state === 'pre') status = 'scheduled';

    const detail = (statusType?.detail as string) || (statusType?.shortDetail as string) || undefined;
    const id = (g.id as string) || `${sportKey}-${i}`;

    return {
      id,
      sport: sportKey,
      sportLabel: sportLabel.toUpperCase(),
      status,
      detail: status === 'live' ? detail : undefined,
      startTime: status === 'scheduled' ? detail : undefined,
      home: {
        name: (homeTeam.displayName as string) || (homeTeam.shortDisplayName as string) || 'Home',
        abbr: (homeTeam.abbreviation as string) || '',
        score: homeEntry?.score != null ? Number(homeEntry.score) : null,
      },
      away: {
        name: (awayTeam.displayName as string) || (awayTeam.shortDisplayName as string) || 'Away',
        abbr: (awayTeam.abbreviation as string) || '',
        score: awayEntry?.score != null ? Number(awayEntry.score) : null,
      },
      venue: undefined,
      href: scoresHref,
    };
  });
}

// ────────────────────────────────────────
// Score card
// ────────────────────────────────────────

function CompactGameCard({ game }: { game: NormalizedGame }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const awayWon = isFinal && (game.away.score ?? 0) > (game.home.score ?? 0);
  const homeWon = isFinal && (game.home.score ?? 0) > (game.away.score ?? 0);
  const sportColor = SPORT_COLORS[game.sport] || '#BF5700';

  return (
    <Link
      href={game.href}
      className="group flex-shrink-0 w-48 sm:w-56 rounded-xl border border-border bg-surface-light hover:bg-surface-light transition-all duration-300 overflow-hidden"
      style={{ borderColor: isLive ? `${sportColor}40` : undefined }}
    >
      {/* Status bar */}
      <div
        className={`px-3 py-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider ${
          isLive
            ? 'text-green-400'
            : isFinal
              ? 'bg-surface-light text-text-muted'
              : 'text-text-muted'
        }`}
        style={isLive ? { backgroundColor: `${sportColor}15` } : undefined}
      >
        <span className="flex items-center gap-1.5">
          {isLive && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
          )}
          {isLive ? (game.detail || 'LIVE') : isFinal ? 'Final' : (game.startTime || 'TBD')}
        </span>
        {/* Sport badge */}
        <span
          className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider"
          style={{ backgroundColor: `${sportColor}20`, color: sportColor }}
        >
          {game.sportLabel}
        </span>
      </div>

      {/* Teams */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium truncate ${awayWon ? 'text-text-primary' : 'text-text-secondary'}`}>
            {game.away.abbr || game.away.name}
          </span>
          <span className={`text-sm font-bold font-mono tabular-nums ${
            isLive ? 'text-text-primary' : awayWon ? 'text-text-primary' : 'text-text-muted'
          }`}>
            {game.away.score !== null ? game.away.score : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium truncate ${homeWon ? 'text-text-primary' : 'text-text-secondary'}`}>
            {game.home.abbr || game.home.name}
          </span>
          <span className={`text-sm font-bold font-mono tabular-nums ${
            isLive ? 'text-text-primary' : homeWon ? 'text-text-primary' : 'text-text-muted'
          }`}>
            {game.home.score !== null ? game.home.score : '-'}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ────────────────────────────────────────
// Main component
// ────────────────────────────────────────

/**
 * HomeLiveScores — multi-sport horizontal score strip for the homepage.
 * Fetches all in-season sport endpoints in parallel, normalizes into a common shape,
 * and auto-refreshes (30s when live, 5min otherwise).
 */
export function HomeLiveScores() {
  const [today, setToday] = useState('');
  const [allGames, setAllGames] = useState<NormalizedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<SportFilter>('all');
  const [activeSports] = useState(getActiveSports);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    setToday(getDateOffset(0));
  }, []);

  const fetchAllScores = useCallback(async () => {
    if (!today || activeSports.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled(
        activeSports.map(async (sport) => {
          const url = sport.key === 'college-baseball'
            ? `${sport.endpoint}?date=${today}`
            : sport.endpoint;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) return null;
          const data = await res.json() as Record<string, unknown>;

          return sport.key === 'college-baseball'
            ? normalizeCollegeBaseball(data)
            : normalizeBSIScoreboard(data, sport.key, sport.label, sport.scoresHref);
        }),
      );

      const games: NormalizedGame[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          games.push(...r.value);
        }
      }

      setAllGames(games);
      setLastFetched(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [today, activeSports]);

  // Initial fetch
  useEffect(() => {
    fetchAllScores();
  }, [fetchAllScores]);

  // Auto-refresh: 30s when live, 5min otherwise
  const hasLiveGames = allGames.some((g) => g.status === 'live');
  useEffect(() => {
    if (allGames.length === 0 && !loading) return;
    const interval = setInterval(fetchAllScores, hasLiveGames ? 30_000 : 300_000);
    return () => clearInterval(interval);
  }, [fetchAllScores, hasLiveGames, allGames.length, loading]);

  // Filter + sort
  const displayGames = useMemo(() => {
    const filtered = filter === 'all'
      ? allGames
      : allGames.filter((g) => g.sport === filter);

    // Live first, then scheduled by time, then final
    const live = filtered.filter((g) => g.status === 'live');
    const scheduled = filtered.filter((g) => g.status === 'scheduled');
    const final_ = filtered.filter((g) => g.status === 'final');
    return [...live, ...scheduled, ...final_];
  }, [allGames, filter]);

  // Available sport filters (only show pills for sports with games)
  const sportCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of allGames) {
      counts.set(g.sport, (counts.get(g.sport) || 0) + 1);
    }
    return counts;
  }, [allGames]);

  // Don't render if no sports are in season
  if (activeSports.length === 0) return null;

  // Don't render if no games and done loading
  if (!loading && !error && allGames.length === 0) return null;

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
              Today&apos;s Games
            </h2>
            {hasLiveGames && <FreshnessBadge isLive />}
            {!loading && allGames.length > 0 && (
              <span className="text-[10px] text-text-muted tabular-nums">
                {allGames.length} game{allGames.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Link
            href="/scores"
            className="text-xs font-semibold text-burnt-orange hover:text-ember transition-colors flex items-center gap-1"
          >
            All scores
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Sport filter pills — only show when multiple sports have games */}
        {sportCounts.size > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-surface-medium text-text-primary'
                  : 'bg-surface-light text-text-muted hover:bg-surface hover:text-text-secondary'
              }`}
            >
              All ({allGames.length})
            </button>
            {activeSports
              .filter((s) => sportCounts.has(s.key))
              .map((sport) => (
                <button
                  key={sport.key}
                  onClick={() => setFilter(sport.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    filter === sport.key
                      ? 'text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                  style={{
                    backgroundColor: filter === sport.key ? `${sport.color}30` : 'rgba(255,255,255,0.05)',
                    borderColor: filter === sport.key ? `${sport.color}50` : 'transparent',
                  }}
                >
                  {sport.label} ({sportCounts.get(sport.key) || 0})
                </button>
              ))}
          </div>
        )}

        {/* Score cards — horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-48 sm:w-56">
                  <SkeletonScoreCard />
                </div>
              ))}
            </>
          ) : error ? (
            <div className="text-sm text-text-muted py-4">
              Scores unavailable — check back during the season.
            </div>
          ) : displayGames.length === 0 ? (
            <div className="text-sm text-text-muted py-4">
              No {filter === 'all' ? '' : `${activeSports.find((s) => s.key === filter)?.label || ''} `}games today.
            </div>
          ) : (
            displayGames.map((game) => <CompactGameCard key={`${game.sport}-${game.id}`} game={game} />)
          )}
        </div>

        {!loading && allGames.length > 0 && (
          <p className="text-[10px] text-text-muted mt-2">
            {hasLiveGames ? 'Auto-refreshing every 30s' : 'Refreshes every 5 min'}
            {lastFetched && (
              <> · Updated {lastFetched.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })} CT</>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────
// Export for Phase 4 — sport card badges
// ────────────────────────────────────────

export { SPORT_COLORS, getActiveSports, normalizeCollegeBaseball, normalizeBSIScoreboard };
export type { NormalizedGame, SportEndpoint };
