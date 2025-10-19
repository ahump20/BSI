'use client';

import { useMemo } from 'react';
import type { LiveGameTeam } from '../../../../lib/hooks/use-live-games-data';
import { useLiveCollegeBaseballGames } from '../../../../lib/hooks/use-live-games-data';

const DEFAULT_TIME_ZONE = 'America/Chicago';
const REFRESH_INTERVAL_MS = 60000;

type Props = {
  date?: string;
  conference?: string;
};

export function LiveScoreboardCard({ date, conference }: Props) {
  const { games, isLoading, error, meta, refresh } = useLiveCollegeBaseballGames({
    date,
    conference,
    refreshIntervalMs: REFRESH_INTERVAL_MS
  });

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: DEFAULT_TIME_ZONE
      }),
    []
  );

  const fetchedAt = meta?.fetchedAt ?? null;
  const lastUpdatedLabel = useMemo(() => formatDateTime(fetchedAt, timeFormatter), [fetchedAt, timeFormatter]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        timeZone: DEFAULT_TIME_ZONE
      }),
    []
  );

  const requestedDate = meta?.date ?? date ?? null;
  const dateLabel = useMemo(() => {
    if (!requestedDate) {
      return null;
    }

    const parsed = new Date(`${requestedDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      return requestedDate;
    }

    return dateFormatter.format(parsed);
  }, [dateFormatter, requestedDate]);

  return (
    <article className="di-card" aria-labelledby="live-scoreboard-heading">
      <header className="di-card-header">
        <div>
          <h2 id="live-scoreboard-heading">Live Scoreboard</h2>
          <p className="di-card-subtitle">
            Normalized from ESPN and cached at the edge for 60-second bursts.
          </p>
          <p className="di-meta" aria-live="polite">
            {dateLabel ? `${dateLabel} · ` : ''}
            {meta?.cacheStatus === 'hit' ? 'Cache hit' : 'Fresh fetch'}
            {lastUpdatedLabel ? ` · Updated ${lastUpdatedLabel}` : ''}
          </p>
        </div>
        <button type="button" className="di-inline-link" onClick={refresh} aria-label="Refresh live scoreboard">
          Refresh
        </button>
      </header>

      {error ? (
        <p role="status" className="di-meta">
          {error.message}
        </p>
      ) : null}

      {isLoading && games.length === 0 ? (
        <p role="status" className="di-meta">
          Loading live games…
        </p>
      ) : null}

      {!isLoading && games.length === 0 && !error ? (
        <p className="di-body">No games match the current filters.</p>
      ) : null}

      {games.length > 0 ? (
        <ul className="di-live-list" aria-live="polite">
          {games.map((game) => {
            const startLabel = formatDateTime(game.startTime, timeFormatter);

            return (
              <li key={game.id} className="di-live-list__item">
                <div className="di-live-list__status">
                  <span className="di-pill">{game.statusText ?? game.status}</span>
                  {startLabel ? <span className="di-meta">{startLabel}</span> : null}
                </div>
                <div className="di-live-list__teams">
                  <TeamRow team={game.away} alignment="away" />
                  <TeamRow team={game.home} alignment="home" />
                </div>
                {game.venue ? (
                  <div className="di-meta di-live-list__venue">
                    {game.venue}
                    {game.location?.city ? ` · ${game.location.city}${game.location?.state ? `, ${game.location.state}` : ''}` : ''}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}

type TeamRowProps = {
  team: LiveGameTeam;
  alignment: 'home' | 'away';
};

function TeamRow({ team, alignment }: TeamRowProps) {
  const label = team.rank ? `#${team.rank} ${team.shortName}` : team.shortName;
  return (
    <div className={`di-live-team di-live-team--${alignment}`}>
      <span className="di-live-team__name">{label}</span>
      <span className="di-live-team__score">{team.score ?? '—'}</span>
      {team.record ? <span className="di-meta di-live-team__record">{team.record}</span> : null}
    </div>
  );
}

export default LiveScoreboardCard;

function formatDateTime(value: string | null, formatter: Intl.DateTimeFormat): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  try {
    return formatter.format(parsed);
  } catch {
    return null;
  }
}
