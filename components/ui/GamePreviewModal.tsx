'use client';

/**
 * Game Preview Modal
 *
 * Opens when a score in the ticker is clicked. Shows a quick box score preview
 * without navigating away from the current page. Fetches game detail data on
 * demand and caches results.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GamePreviewModalProps {
  sport: string;
  gameId: string;
  onClose: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type GameData = Record<string, any>;

// ---------------------------------------------------------------------------
// Sport config
// ---------------------------------------------------------------------------

const SPORT_API_PREFIX: Record<string, string> = {
  'college-baseball': '/api/college-baseball',
  mlb: '/api/mlb',
  nfl: '/api/nfl',
  nba: '/api/nba',
  cfb: '/api/cfb',
};

const SPORT_LABELS: Record<string, string> = {
  'college-baseball': 'College Baseball',
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  cfb: 'College Football',
};

const SPORT_SHORT: Record<string, string> = {
  'college-baseball': 'CBB',
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  cfb: 'CFB',
};

function isBaseballSport(sport: string) {
  return sport === 'college-baseball' || sport === 'mlb';
}

// ---------------------------------------------------------------------------
// Data extraction helpers — resilient to varying response shapes
// ---------------------------------------------------------------------------

function extractTeams(game: GameData, sport: string): { away: string; home: string } {
  // ESPN shape: competitors array
  if (game.competitors) {
    const away = game.competitors.find((c: any) => c.homeAway === 'away');
    const home = game.competitors.find((c: any) => c.homeAway === 'home');
    return {
      away: away?.team?.displayName ?? away?.team?.name ?? 'Away',
      home: home?.team?.displayName ?? home?.team?.name ?? 'Home',
    };
  }
  // ESPN teams array: teams[].team.displayName, teams[].homeAway
  if (Array.isArray(game.teams)) {
    const away = game.teams.find((t: any) => t.homeAway === 'away');
    const home = game.teams.find((t: any) => t.homeAway === 'home');
    return {
      away: away?.team?.displayName ?? away?.team?.shortDisplayName ?? away?.team?.abbreviation ?? 'Away',
      home: home?.team?.displayName ?? home?.team?.shortDisplayName ?? home?.team?.abbreviation ?? 'Home',
    };
  }
  // Transformed teams object — prefer displayName over name (name = mascot in Highlightly)
  if (game.teams) {
    return {
      away: game.teams.away?.displayName ?? game.teams.away?.name ?? 'Away',
      home: game.teams.home?.displayName ?? game.teams.home?.name ?? 'Home',
    };
  }
  // Highlightly top-level — prefer displayName (school name) over name (mascot)
  if (game.awayTeam || game.homeTeam) {
    return {
      away: game.awayTeam?.displayName ?? game.awayTeam?.name ?? 'Away',
      home: game.homeTeam?.displayName ?? game.homeTeam?.name ?? 'Home',
    };
  }
  // Flat shape
  return {
    away: game.away_team ?? game.awayTeam ?? 'Away',
    home: game.home_team ?? game.homeTeam ?? 'Home',
  };
}

function extractScores(game: GameData): { away: number | string; home: number | string } {
  // Competitors shape
  if (game.competitors) {
    const away = game.competitors.find((c: any) => c.homeAway === 'away');
    const home = game.competitors.find((c: any) => c.homeAway === 'home');
    return {
      away: away?.score ?? '-',
      home: home?.score ?? '-',
    };
  }
  // Nested scores object
  if (game.scores) {
    return {
      away: game.scores.away ?? game.scores.awayScore ?? '-',
      home: game.scores.home ?? game.scores.homeScore ?? '-',
    };
  }
  // Teams object with score — MLB/NBA/NFL/CFB game detail shape
  if (game.teams?.away?.score != null || game.teams?.home?.score != null) {
    return {
      away: game.teams.away?.score ?? '-',
      home: game.teams.home?.score ?? '-',
    };
  }
  // Linescore totals — fallback for games where scores only live in linescore
  if (game.linescore?.totals) {
    return {
      away: game.linescore.totals.away?.runs ?? game.linescore.totals.away ?? '-',
      home: game.linescore.totals.home?.runs ?? game.linescore.totals.home ?? '-',
    };
  }
  // Flat
  return {
    away: game.away_score ?? game.awayScore ?? '-',
    home: game.home_score ?? game.homeScore ?? '-',
  };
}

function extractStatus(game: GameData): string {
  // ESPN status
  if (game.status?.type) {
    return game.status.type.shortDetail ?? game.status.type.description ?? game.status.type.state ?? '';
  }
  if (game.status?.detailedState) return game.status.detailedState;
  if (typeof game.status === 'string') return game.status;
  if (game.state) return game.state;
  return '';
}

function extractLinescore(game: GameData): { away: (number | string)[]; home: (number | string)[] } | null {
  // Direct linescore
  if (game.linescore) {
    const ls = game.linescore;
    if (Array.isArray(ls.innings) || Array.isArray(ls.periods)) {
      const periods = ls.innings ?? ls.periods;
      return {
        away: periods.map((p: any) => p.away ?? p.awayScore ?? '-'),
        home: periods.map((p: any) => p.home ?? p.homeScore ?? '-'),
      };
    }
    if (ls.away && ls.home) return ls;
  }
  // Boxscore linescore
  if (game.boxscore?.linescore) {
    return extractLinescore({ linescore: game.boxscore.linescore });
  }
  // ESPN linescores (competitors > linescores)
  if (game.competitors?.[0]?.linescores) {
    const away = game.competitors.find((c: any) => c.homeAway === 'away');
    const home = game.competitors.find((c: any) => c.homeAway === 'home');
    if (away?.linescores && home?.linescores) {
      return {
        away: away.linescores.map((l: any) => l.value ?? l.displayValue ?? '-'),
        home: home.linescores.map((l: any) => l.value ?? l.displayValue ?? '-'),
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ModalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-20 rounded-sm" style={{ background: 'rgba(196,184,165,0.15)' }} />
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-6 w-32 rounded-sm" style={{ background: 'rgba(196,184,165,0.15)' }} />
          <div className="h-6 w-10 rounded-sm" style={{ background: 'rgba(196,184,165,0.15)' }} />
        </div>
        <div className="flex justify-between">
          <div className="h-6 w-36 rounded-sm" style={{ background: 'rgba(196,184,165,0.15)' }} />
          <div className="h-6 w-10 rounded-sm" style={{ background: 'rgba(196,184,165,0.15)' }} />
        </div>
      </div>
      <div className="h-16 w-full rounded-sm" style={{ background: 'rgba(196,184,165,0.1)' }} />
    </div>
  );
}

function LinescoreTable({
  teams,
  linescore,
  scores,
  isBaseball,
}: {
  teams: { away: string; home: string };
  linescore: { away: (number | string)[]; home: (number | string)[] };
  scores: { away: number | string; home: number | string };
  isBaseball: boolean;
}) {
  const periodCount = Math.max(linescore.away.length, linescore.home.length);
  const headers = isBaseball
    ? Array.from({ length: periodCount }, (_, i) => String(i + 1))
    : Array.from({ length: periodCount }, (_, i) => `Q${i + 1}`);

  return (
    <div className="overflow-x-auto -mx-1">
      <table
        className="w-full text-[10px] tabular-nums font-mono text-bsi-dust"
      >
        <thead>
          <tr>
            <th
              className="text-left py-1 px-1.5 font-normal"
              style={{ color: 'rgba(196,184,165,0.5)', minWidth: '70px' }}
            />
            {headers.map((h) => (
              <th
                key={h}
                className="text-center py-1 px-1 font-normal"
                style={{ color: 'rgba(196,184,165,0.5)', minWidth: '20px' }}
              >
                {h}
              </th>
            ))}
            <th
              className="text-center py-1 px-1.5 font-bold text-bsi-bone"
              style={{ minWidth: '28px' }}
            >
              {isBaseball ? 'R' : 'T'}
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            { team: teams.away, periods: linescore.away, total: scores.away },
            { team: teams.home, periods: linescore.home, total: scores.home },
          ].map((row) => (
            <tr key={row.team} style={{ borderTop: '1px solid rgba(140,98,57,0.15)' }}>
              <td
                className="text-left py-1 px-1.5 truncate max-w-[90px] text-bsi-bone"
                style={{ fontFamily: 'var(--font-oswald)', fontSize: '11px' }}
              >
                {row.team}
              </td>
              {row.periods.map((val, idx) => (
                <td key={idx} className="text-center py-1 px-1">
                  {val}
                </td>
              ))}
              {/* Pad if fewer periods */}
              {Array.from({ length: periodCount - row.periods.length }).map((_, idx) => (
                <td key={`pad-${idx}`} className="text-center py-1 px-1">
                  -
                </td>
              ))}
              <td
                className="text-center py-1 px-1.5 font-bold text-bsi-bone"
              >
                {row.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// Cross-render cache so re-clicking the same game doesn't refetch
const gameCache = new Map<string, GameData>();

export function GamePreviewModal({ sport, gameId, onClose }: GamePreviewModalProps) {
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fetch game data on mount
  useEffect(() => {
    const cacheKey = `${sport}:${gameId}`;
    const cached = gameCache.get(cacheKey);
    if (cached) {
      setGame(cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const apiPrefix = SPORT_API_PREFIX[sport] ?? `/api/${sport}`;

    (async () => {
      try {
        const res = await fetch(`${apiPrefix}/game/${gameId}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json() as { game?: GameData; [key: string]: unknown };
        const gameData = data.game ?? data;
        gameCache.set(cacheKey, gameData);
        setGame(gameData);
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError('Could not load game data');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [sport, gameId]);

  // Focus trap + Escape to close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, a, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose, loading]);

  // Scroll lock cleanup
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Extracted data
  const teams = game ? extractTeams(game, sport) : null;
  const scores = game ? extractScores(game) : null;
  const status = game ? extractStatus(game) : '';
  const linescore = game ? extractLinescore(game) : null;
  const statusLower = status.toLowerCase();
  const isLive =
    statusLower.includes('live') ||
    statusLower.includes('in progress') ||
    statusLower.includes('top') ||
    statusLower.includes('bot');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${SPORT_LABELS[sport] ?? sport} game preview`}
        className="w-full max-w-sm rounded-sm overflow-hidden"
        style={{
          background: 'var(--surface-dugout)',
          border: '1px solid var(--border-vintage)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: 'var(--surface-press-box)',
            borderBottom: '2px solid var(--bsi-primary)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5"
              style={{
                fontFamily: 'var(--font-oswald)',
                color: 'var(--bsi-bone)',
                background: 'rgba(191,87,0,0.3)',
              }}
            >
              {SPORT_SHORT[sport] ?? sport}
            </span>
            {status && (
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isLive ? '#10B981' : 'var(--bsi-dust)',
                }}
              >
                {isLive && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  </span>
                )}{' '}
                {status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors hover:text-bsi-primary text-bsi-dust"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          {loading ? (
            <ModalSkeleton />
          ) : error ? (
            <div className="text-center py-6">
              <p
                className="text-sm mb-3 font-serif text-bsi-dust"
              >
                {error}
              </p>
              <Link
                href={`/${sport}/game/${gameId}/`}
                className="btn-heritage text-[10px] uppercase tracking-wider px-4 py-2 font-display"
                onClick={onClose}
              >
                View Full Game &rarr;
              </Link>
            </div>
          ) : (
            <>
              {/* Team scores */}
              {teams && scores && (
                <div className="space-y-2 mb-4">
                  {[
                    { team: teams.away, score: scores.away, label: 'away' },
                    { team: teams.home, score: scores.home, label: 'home' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span
                        className="text-sm font-bold uppercase tracking-wide truncate max-w-[200px] font-display text-bsi-bone"
                      >
                        {row.team}
                      </span>
                      <span
                        className="text-2xl font-bold tabular-nums font-mono text-bsi-bone"
                      >
                        {row.score}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Linescore */}
              {linescore && teams && scores && (
                <div
                  className="py-3 -mx-4 px-4"
                  style={{
                    borderTop: '1px solid var(--border-vintage)',
                    borderBottom: '1px solid var(--border-vintage)',
                    background: 'rgba(10,10,10,0.3)',
                  }}
                >
                  <LinescoreTable
                    teams={teams}
                    linescore={linescore}
                    scores={scores}
                    isBaseball={isBaseballSport(sport)}
                  />
                </div>
              )}

              {/* View full game link */}
              <div className="mt-4 text-center">
                <Link
                  href={`/${sport}/game/${gameId}/`}
                  className="btn-heritage text-[10px] uppercase tracking-wider px-5 py-2 inline-block font-display"
                  onClick={onClose}
                >
                  View Full Game &rarr;
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
