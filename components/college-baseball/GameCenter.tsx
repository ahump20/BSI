'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Game } from '@/lib/college-baseball/types';

type GameFilter = 'all' | 'live' | 'scheduled';

interface GameCenterProps {
  initialGames?: Game[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const FILTER_TABS: Array<{ value: GameFilter; label: string }> = [
  { value: 'all', label: 'All Games' },
  { value: 'live', label: 'Live' },
  { value: 'scheduled', label: 'Upcoming' }
];

export default function GameCenter({
  initialGames = [],
  autoRefresh = true,
  refreshInterval = 30000
}: GameCenterProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<GameFilter>('all');

  const fetchGames = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await fetch('/api/college-baseball/games');
      const result = await response.json();

      if (result.success) {
        setGames(result.data);
        setLastUpdate(new Date());

        if (typeof window !== 'undefined' && 'caches' in window) {
          const cache = await caches.open('college-baseball-v1');
          await cache.put('/api/college-baseball/games', new Response(JSON.stringify(result)));
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError('Unable to load games. Showing cached data if available.');

      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open('college-baseball-v1');
        const cached = await cache.match('/api/college-baseball/games');
        if (cached) {
          const result = await cached.json();
          setGames(result.data as Game[]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        const hasLiveGames = games.some(game => game.status === 'live');
        if (hasLiveGames) {
          void fetchGames(false);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, fetchGames, games, refreshInterval]);

  useEffect(() => {
    if (initialGames.length === 0) {
      void fetchGames();
    }
  }, [initialGames, fetchGames]);

  const filteredGames = useMemo(() => {
    if (filter === 'all') return games;
    return games.filter(game => game.status === filter);
  }, [games, filter]);

  const handleRefresh = () => {
    void fetchGames();
  };

  return (
    <section className="bsi-card mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-[var(--bsi-color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-headline text-bsi-text">College Baseball</h1>
          <p className="text-sm text-bsi-muted">Auto-refreshing scoreboard tuned for live leverage moments.</p>
        </div>
        <div className="flex flex-col items-start text-xs text-bsi-muted sm:items-end" aria-live="polite">
          <span className="font-medium uppercase tracking-wide text-bsi-accent">Last update</span>
          <time dateTime={lastUpdate.toISOString()}>{lastUpdate.toLocaleTimeString()}</time>
        </div>
      </header>

      <div className="bsi-tablist" role="tablist" aria-label="Filter games">
        {FILTER_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            data-state={filter === value ? 'active' : 'inactive'}
            className="bsi-tab"
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-card border border-bsi-accent-strong/40 bg-[rgba(220,38,38,0.12)] px-4 py-3 text-sm text-bsi-text">
          {error}
        </div>
      )}

      {loading && games.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-sm text-bsi-muted">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-bsi-border border-t-bsi-accent" aria-hidden="true" />
          <p>Loading games…</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {filteredGames.map(game => (
          <GameCard
            key={game.id}
            game={game}
            isSelected={selectedGame === game.id}
            onClick={() => setSelectedGame(game.id)}
          />
        ))}

        {filteredGames.length === 0 && !loading && (
          <div className="rounded-card border border-dashed border-[var(--bsi-color-border)] bg-bsi-surface-muted/40 px-4 py-12 text-center text-sm text-bsi-muted">
            No games {filter !== 'all' ? filter : 'available'} right now.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-pill bg-bsi-accent px-4 py-3 font-semibold text-bsi-bg transition-colors duration-150 hover:bg-bsi-accent-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bsi-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(11,17,32,0.9)] disabled:cursor-not-allowed disabled:bg-[rgba(251,191,36,0.45)]"
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </section>
  );
}

interface GameCardProps {
  game: Game;
  isSelected: boolean;
  onClick: () => void;
}

function GameCard({ game, isSelected, onClick }: GameCardProps) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  const classes = [
    'bsi-card relative flex flex-col gap-4 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bsi-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(11,17,32,0.85)]',
    isSelected ? 'ring-2 ring-bsi-accent ring-offset-2 ring-offset-[rgba(11,17,32,0.85)]' : 'hover:border-bsi-accent hover:shadow-xl',
    isLive ? 'border-bsi-accent-strong bg-bsi-surface-muted/70 shadow-[0_0_0_1px_rgba(220,38,38,0.35)]' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={onClick} aria-pressed={isSelected}>
      {isLive && (
        <div className="absolute right-5 top-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-bsi-accent-strong">
          <span className="h-2 w-2 animate-pulse rounded-full bg-bsi-accent-strong" aria-hidden="true" />
          Live
        </div>
      )}

      <div className="flex flex-col gap-1 text-sm text-bsi-muted">
        <span>{isFinal ? 'Final' : game.time}</span>
        {game.venue && <span className="text-xs text-bsi-muted">{game.venue}</span>}
        {game.tv && <span className="text-xs text-bsi-muted">📺 {game.tv}</span>}
      </div>

      <div className="flex flex-col gap-4">
        <TeamRow team={game.awayTeam} showScore={isLive || isFinal} score={game.awayTeam.score} />
        <TeamRow team={game.homeTeam} showScore={isLive || isFinal} score={game.homeTeam.score} />
      </div>
    </button>
  );
}

interface TeamRowProps {
  team: Game['homeTeam'];
  showScore: boolean;
  score?: number;
}

function TeamRow({ team, showScore, score }: TeamRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-bsi-text">{team.shortName}</span>
        <span className="text-xs uppercase tracking-wide text-bsi-muted">
          ({team.record.wins}-{team.record.losses})
        </span>
      </div>
      {showScore && (
        <span className="ml-auto text-2xl font-bold leading-none text-bsi-text">{score}</span>
      )}
    </div>
  );
}
