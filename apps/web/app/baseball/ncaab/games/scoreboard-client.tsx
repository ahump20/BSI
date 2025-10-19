'use client';

import { useEffect, useMemo, useState } from 'react';

type ScoreboardTeam = {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  record: string | null;
  rank: number | null;
  score: number | null;
  logo: string | null;
  homeAway: 'home' | 'away';
};

type ScoreboardStatusState = 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed' | 'canceled';

interface ScoreboardStatus {
  state: ScoreboardStatusState;
  detail: string;
  shortDetail: string;
  completed: boolean;
  inning: number | null;
  inningHalf: 'Top' | 'Middle' | 'Bottom' | 'End' | null;
}

interface ScoreboardGame {
  id: string;
  uid: string | null;
  startTime: string;
  venue: {
    name: string | null;
    location: string | null;
  };
  status: ScoreboardStatus;
  broadcasters: string[];
  links: {
    boxscore: string | null;
    gamecast: string | null;
    tickets: string | null;
  };
  teams: {
    home: ScoreboardTeam;
    away: ScoreboardTeam;
  };
}

interface ScoreboardData {
  sport: string;
  league: string;
  provider: string;
  scoreboardDate: string;
  fetchedAt: string;
  ingestionKey: string;
  gameCount: number;
  games: ScoreboardGame[];
}

type CacheState = 'hit' | 'miss' | 'skip';

interface ScoreboardSuccess {
  status: 'ok';
  data: ScoreboardData;
  meta: {
    cacheState: CacheState;
    ttlSeconds: number;
    cacheKey: string;
  };
}

interface ScoreboardError {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ScoreboardResponse = ScoreboardSuccess | ScoreboardError;

const REFRESH_INTERVAL_MS = 45_000;

const statusLabels: Record<ScoreboardStatusState, string> = {
  scheduled: 'Scheduled',
  in_progress: 'Live',
  final: 'Final',
  postponed: 'Postponed',
  delayed: 'Delayed',
  canceled: 'Canceled',
};

const formatStartTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

const formatUpdatedTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date);
};

const formatLocation = (game: ScoreboardGame) => {
  if (game.venue.name && game.venue.location) {
    return `${game.venue.name} • ${game.venue.location}`;
  }
  if (game.venue.name) {
    return game.venue.name;
  }
  if (game.venue.location) {
    return game.venue.location;
  }
  return 'Venue TBA';
};

const formatRecord = (record: string | null) => record ?? '—';

const formatRank = (rank: number | null) => (typeof rank === 'number' ? `#${rank}` : undefined);

function ScoreboardSkeleton() {
  return (
    <div className="di-scoreboard-grid" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <article className="di-scoreboard-card di-scoreboard-card--skeleton" key={`skeleton-${index}`}>
          <div className="di-skeleton di-skeleton--badge" />
          <div className="di-skeleton di-skeleton--line" />
          <div className="di-skeleton di-skeleton--line" />
          <div className="di-skeleton di-skeleton--row" />
          <div className="di-skeleton di-skeleton--row" />
        </article>
      ))}
    </div>
  );
}

function ScoreboardErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <article className="di-card di-scoreboard-error" role="alert">
      <h2>Unable to load the live board</h2>
      <p className="di-text-muted">{message}</p>
      <div className="di-scoreboard-error__actions">
        <button className="di-refresh" type="button" onClick={onRetry}>
          Retry
        </button>
        <p className="di-text-muted">If this persists, ESPN may be rate-limiting the upstream feed.</p>
      </div>
    </article>
  );
}

function ScoreboardMeta({ updatedAt, cacheState }: { updatedAt: string; cacheState: CacheState }) {
  return (
    <div className="di-scoreboard-meta" aria-live="polite">
      <span className="di-scoreboard-meta__timestamp">Updated {formatUpdatedTime(updatedAt)}</span>
      <span className="di-scoreboard-meta__cache">Cache: {cacheState}</span>
    </div>
  );
}

function ScoreboardGameCard({ game }: { game: ScoreboardGame }) {
  const broadcasters = game.broadcasters.length > 0 ? game.broadcasters.join(', ') : 'Broadcast TBA';
  return (
    <article className="di-scoreboard-card">
      <header className="di-scoreboard-card__header">
        <span className={`di-status-badge di-status-badge--${game.status.state}`}>
          {statusLabels[game.status.state]}
        </span>
        <div className="di-scoreboard-card__status">
          <span className="di-scoreboard-card__detail">{game.status.shortDetail}</span>
          <time dateTime={game.startTime} className="di-scoreboard-card__time">
            {formatStartTime(game.startTime)}
          </time>
        </div>
      </header>
      <div className="di-scoreboard-card__venue">{formatLocation(game)}</div>
      <div className="di-scoreboard-teams">
        {[game.teams.away, game.teams.home].map((team) => (
          <div className="di-scoreboard-team" key={`${game.id}-${team.id}`}>
            <div className="di-scoreboard-team__info">
              {formatRank(team.rank) ? <span className="di-scoreboard-team__rank">{formatRank(team.rank)}</span> : null}
              <span className="di-scoreboard-team__name">{team.shortDisplayName}</span>
            </div>
            <span className="di-scoreboard-team__record">{formatRecord(team.record)}</span>
            <span className="di-scoreboard-team__score" aria-label={`${team.displayName} score`}>
              {typeof team.score === 'number' ? team.score : '—'}
            </span>
          </div>
        ))}
      </div>
      <div className="di-scoreboard-card__footer">
        <span className="di-scoreboard-card__broadcast">{broadcasters}</span>
        <div className="di-scoreboard-card__links">
          {game.links.gamecast ? (
            <a className="di-inline-link" href={game.links.gamecast} target="_blank" rel="noopener noreferrer">
              Gamecast
            </a>
          ) : null}
          {game.links.boxscore ? (
            <a className="di-inline-link" href={game.links.boxscore} target="_blank" rel="noopener noreferrer">
              Box Score
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function ScoreboardClient() {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [cacheState, setCacheState] = useState<CacheState>('skip');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scoreboardDate = useMemo(() => {
    if (!data) {
      return null;
    }
    const [year, month, day] = data.scoreboardDate.split('-');
    const formatted = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(formatted);
  }, [data]);

  const fetchScoreboard = async (mode: 'initial' | 'manual' | 'interval' = 'manual') => {
    if (mode === 'initial') {
      setIsLoading(true);
      setError(null);
    } else {
      setIsRefreshing(true);
      if (mode === 'manual') {
        setError(null);
      }
    }

    try {
      const response = await fetch('/api/v1/baseball/scoreboard', {
        cache: 'no-store',
      });
      const body = (await response.json()) as ScoreboardResponse;

      if (!response.ok || body.status !== 'ok') {
        const message = body.status === 'error' ? body.error.message : 'Unable to load the scoreboard feed';
        throw new Error(message);
      }

      setData(body.data);
      setCacheState(body.meta.cacheState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error while loading scoreboard data');
    } finally {
      if (mode === 'initial') {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) {
        return;
      }
      await fetchScoreboard('initial');
    };

    load();

    const interval = setInterval(() => {
      if (!isMounted) {
        return;
      }
      fetchScoreboard('interval').catch(() => {
        // Errors handled by fetchScoreboard state management
      });
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="di-scoreboard" aria-labelledby="scoreboard-heading">
      <div className="di-scoreboard-header">
        <div>
          <h2 id="scoreboard-heading">Today&apos;s live board</h2>
          <p className="di-text-muted">Edge API proxy keeps ESPN on a 45-second cadence with idempotent caching.</p>
        </div>
        <div className="di-scoreboard-controls">
          <button className="di-refresh" type="button" onClick={() => fetchScoreboard('manual')} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {data ? <ScoreboardMeta updatedAt={data.fetchedAt} cacheState={cacheState} /> : null}
        </div>
      </div>

      {scoreboardDate ? <p className="di-scoreboard-date">Games for {scoreboardDate}</p> : null}

      {isLoading ? <ScoreboardSkeleton /> : null}

      {!isLoading && error ? <ScoreboardErrorCard message={error} onRetry={() => fetchScoreboard('manual')} /> : null}

      {!isLoading && data && data.games.length === 0 ? (
        <article className="di-card di-scoreboard-empty">
          <h2>No games on the slate</h2>
          <p className="di-text-muted">We&apos;ll light this up the moment ESPN publishes the next lineup.</p>
        </article>
      ) : null}

      {!isLoading && data && data.games.length > 0 ? (
        <div className="di-scoreboard-grid">
          {data.games.map((game) => (
            <ScoreboardGameCard key={game.id} game={game} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
