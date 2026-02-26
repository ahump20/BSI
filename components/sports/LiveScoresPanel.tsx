'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Sport } from './SportTabs';
import { normalizeGames, sortGames, type GameScore } from '@/lib/scores/normalize';
import { getSeasonPhase, type SportKey } from '@/lib/season';
import { useLiveScoresAdapter } from '@/lib/hooks/useLiveScoresAdapter';
import { ConnectionIndicator } from '@/components/ui/ConnectionIndicator';

interface LiveScoresPanelProps {
  sport: Sport;
  className?: string;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Map Sport tab keys to SportKey for season detection. */
const SPORT_KEY_MAP: Record<Sport, SportKey> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  ncaa: 'ncaa',
};

// =============================================================================
// Shared game card rendering
// =============================================================================

function GameCardList({ games }: { games: GameScore[] }) {
  return (
    <>
      {games.map((game) => (
        <div
          key={game.id}
          role="group"
          aria-label={`${game.away.name} at ${game.home.name}`}
          className={`bg-surface-light rounded-lg p-4 border transition-colors ${
            game.isLive
              ? 'border-green-500/30'
              : game.isPostponed
                ? 'border-border-subtle opacity-50'
                : 'border-transparent'
          }`}
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
              {game.away.rank && (
                <span className="text-[10px] font-bold text-burnt-orange bg-burnt-orange/10 px-1.5 py-0.5 rounded-md leading-none">
                  #{game.away.rank}
                </span>
              )}
              {game.away.name}
            </span>
            <span className="font-bold text-burnt-orange text-lg tabular-nums" aria-label={`${game.away.name} score`} {...(game.isLive ? { 'aria-live': 'polite' as const } : {})}>{game.away.score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
              {game.home.rank && (
                <span className="text-[10px] font-bold text-burnt-orange bg-burnt-orange/10 px-1.5 py-0.5 rounded-md leading-none">
                  #{game.home.rank}
                </span>
              )}
              {game.home.name}
            </span>
            <span className="font-bold text-burnt-orange text-lg tabular-nums" aria-label={`${game.home.name} score`} {...(game.isLive ? { 'aria-live': 'polite' as const } : {})}>{game.home.score}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {game.isLive && (
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" role="status" aria-label="Game in progress" />
            )}
            <span className={`text-xs ${
              game.isLive ? 'text-green-400'
                : game.isPostponed ? 'text-yellow-500/60'
                : game.isFinal ? 'text-text-muted'
                : 'text-burnt-orange'
            }`}>
              {game.detail || game.status}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface-light rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-surface rounded w-2/3 mb-2" />
          <div className="h-4 bg-surface rounded w-2/3" />
        </div>
      ))}
    </>
  );
}

// =============================================================================
// WebSocket-powered panel (NCAA college baseball)
// =============================================================================

function LiveScoresPanelWS({ className = '' }: { className?: string }) {
  const { games, connectionStatus, error, retry } = useLiveScoresAdapter();

  const seasonPhase = useMemo(() => getSeasonPhase('ncaa'), []);
  const isPreseason = seasonPhase?.phase === 'preseason';
  const preseasonLabel = seasonPhase?.label;

  // Consider "loading" until first data arrives or we've been polling for a bit
  const loading = connectionStatus === 'connecting' && games.length === 0;

  return (
    <div className={`bg-surface-light border border-border-subtle rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-primary">Live Scores</h3>
          <ConnectionIndicator status={connectionStatus} />
        </div>
        <span className="text-xs text-text-muted uppercase tracking-wider">NCAA</span>
      </div>
      {isPreseason && preseasonLabel && (
        <div className="mx-4 mt-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400/80 text-xs">
            {preseasonLabel} — coverage may be limited; some games unavailable until first pitch
          </p>
        </div>
      )}
      <div className="p-4 space-y-3 min-h-[280px] max-h-[500px] overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : error && games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={retry}
              className="text-xs text-burnt-orange hover:text-ember transition-colors"
            >
              Retry connection
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No games scheduled</p>
          </div>
        ) : (
          <GameCardList games={games} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// REST-powered panel (MLB, NFL, NBA)
// =============================================================================

function LiveScoresPanelREST({ sport, className = '' }: { sport: Sport; className: string }) {
  const [games, setGames] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isYesterday, setIsYesterday] = useState(false);
  const gamesRef = useRef(games);
  gamesRef.current = games;

  const seasonPhase = useMemo(() => {
    const key = SPORT_KEY_MAP[sport];
    return key ? getSeasonPhase(key) : null;
  }, [sport]);

  const isPreseason = seasonPhase?.phase === 'preseason';
  const preseasonLabel = seasonPhase?.label;

  const buildEndpoint = useCallback((dateParam?: string) => {
    const origin = process.env.NEXT_PUBLIC_API_BASE || '';
    const apiBase = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
    const endpoint = `${origin}${sport === 'nba' ? `${apiBase}/scoreboard` : `${apiBase}/scores`}`;
    return dateParam ? `${endpoint}?date=${dateParam}` : endpoint;
  }, [sport]);

  const buildCachedEndpoint = useCallback(() => {
    const origin = process.env.NEXT_PUBLIC_API_BASE || '';
    return `${origin}/api/scores/cached?sport=${sport}`;
  }, [sport]);

  useEffect(() => {
    let cancelled = false;

    async function fetchScores() {
      setLoading(true);
      setError(null);
      setIsYesterday(false);

      try {
        const cachedRes = await fetch(buildCachedEndpoint());
        if (cachedRes.ok && cachedRes.status === 200) {
          const cachedData = await cachedRes.json() as { data?: unknown };
          if (cachedData?.data) {
            const cachedGames = normalizeGames(sport, cachedData.data as Record<string, unknown>);
            if (!cancelled && cachedGames.length > 0) {
              setGames(sortGames(cachedGames));
              setLoading(false);
              return;
            }
          }
        }

        const res = await fetch(buildEndpoint());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const todayGames = normalizeGames(sport, data as Record<string, unknown>);

        if (!cancelled) {
          if (todayGames.length > 0) {
            setGames(sortGames(todayGames));
          } else {
            try {
              const yRes = await fetch(buildEndpoint(getYesterdayDateString()));
              if (yRes.ok) {
                const yData = await yRes.json();
                const yGames = normalizeGames(sport, yData as Record<string, unknown>);
                if (yGames.length > 0) {
                  setGames(sortGames(yGames));
                  setIsYesterday(true);
                } else {
                  setGames([]);
                }
              } else {
                setGames([]);
              }
            } catch {
              setGames([]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load scores');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchScores();
    const hasLive = gamesRef.current.some((g) => g.isLive);
    const interval = setInterval(fetchScores, hasLive ? 30000 : 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sport, buildEndpoint, buildCachedEndpoint]);

  return (
    <div className={`bg-surface-light border border-border-subtle rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          {isYesterday ? "Yesterday's Results" : 'Live Scores'}
        </h3>
        <span className="text-xs text-text-muted uppercase tracking-wider">{sport.toUpperCase()}</span>
      </div>
      {isPreseason && preseasonLabel && (
        <div className="mx-4 mt-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400/80 text-xs">
            {preseasonLabel} — coverage may be limited; some games unavailable until first pitch
          </p>
        </div>
      )}
      <div className="p-4 space-y-3 min-h-[280px] max-h-[500px] overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No games scheduled</p>
          </div>
        ) : (
          <GameCardList games={games} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Public export — delegates to WS (NCAA) or REST (everything else)
// =============================================================================

export function LiveScoresPanel({ sport, className = '' }: LiveScoresPanelProps) {
  if (sport === 'ncaa') {
    return <LiveScoresPanelWS className={className} />;
  }
  return <LiveScoresPanelREST sport={sport} className={className} />;
}
