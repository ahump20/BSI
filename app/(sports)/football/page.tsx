'use client';

import { useEffect, useMemo, useState } from 'react';
import { SportSwitcher } from '../../components/SportSwitcher';

type TeamSummary = {
  id: string;
  rank?: number;
  record?: string;
  score?: number | string;
  team: {
    name: string;
  };
};

type FootballGame = {
  id: string;
  status: {
    completed: boolean;
    shortDetail?: string;
  };
  teams: {
    home: TeamSummary;
    away: TeamSummary;
  };
  venue?: {
    name?: string;
  };
  broadcast?: string;
  odds?: {
    spread?: string;
    overUnder?: string;
  };
};

type FootballResponse = {
  games?: FootballGame[];
};

type FetchState = 'idle' | 'loading' | 'ready' | 'error';

type WeekOption = 'current';

export default function FootballScoreboardPage() {
  const [games, setGames] = useState<FootballGame[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [week, setWeek] = useState<WeekOption>('current');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchGames = async () => {
      try {
        setState('loading');
        const response = await fetch(`/api/football/scores?week=${week}`, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const payload: FootballResponse = await response.json();

        if (cancelled) {
          return;
        }

        setGames(payload.games ?? []);
        setError(null);
        setLastUpdated(new Date());
        setState('ready');
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error('Failed to fetch football games', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setState('error');
      }
    };

    fetchGames();
    const interval = setInterval(fetchGames, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [week]);

  const timestamp = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    return lastUpdated.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }, [lastUpdated]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-surface/70 px-6 py-10 text-center">
        <div className="mx-auto max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Diamond Insights</p>
          <h1 className="text-4xl font-semibold tracking-tight">🏈 College Football Live</h1>
          <p className="text-sm text-muted">
            Real-time FBS scoreboard tuned for staffs across the SEC, Big 12, and beyond.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Live Scores</h2>
              {timestamp && <p className="text-xs text-muted">Last updated {timestamp}</p>}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted" htmlFor="week-select">
                Week
              </label>
              <select
                id="week-select"
                value={week}
                onChange={(event) => setWeek(event.target.value as WeekOption)}
                className="rounded-full border border-border/50 bg-background/70 px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <option value="current">Current Week</option>
              </select>
            </div>
          </div>

          {state === 'loading' && games.length === 0 && (
            <div className="card flex flex-col items-center gap-4 px-8 py-12 text-center">
              <div className="spinner" aria-hidden />
              <p className="text-sm text-muted">Loading football scoreboard…</p>
            </div>
          )}

          {state === 'error' ? (
            <div className="card space-y-4 px-8 py-10 text-center">
              <h2 className="text-lg font-semibold text-danger">Unable to load football data</h2>
              <p className="text-sm text-muted">{error}</p>
              <p className="text-xs text-muted/70">Source: BlazeSportsIntel Football API</p>
            </div>
          ) : games.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 px-8 py-12 text-center">
              <span className="text-4xl" aria-hidden>
                🏟️
              </span>
              <p className="text-base font-medium">No football matchups scheduled for this window.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {games.map((game) => (
                <article key={game.id} className="card flex flex-col gap-4 px-6 py-6">
                  <div className="flex items-center justify-between">
                    <span className={`status-pill ${game.status.completed ? 'status-final' : 'status-live'}`}>
                      {game.status.completed ? 'Final' : game.status.shortDetail ?? 'Live'}
                    </span>
                    <span className="text-xs text-muted">{game.venue?.name ?? 'Venue TBA'}</span>
                  </div>

                  <div className="space-y-4">
                    {[game.teams.away, game.teams.home].map((team, index) => (
                      <div key={`${game.id}-${team.id}-${index}`} className="flex items-center justify-between gap-4">
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-center gap-2 text-sm text-muted">
                            {typeof team.rank === 'number' && <span className="font-semibold">#{team.rank}</span>}
                            <span>{team.team.name}</span>
                          </div>
                          {team.record && <span className="text-xs text-muted">{team.record}</span>}
                        </div>
                        <span className="text-3xl font-bold tracking-tight">{team.score ?? '0'}</span>
                      </div>
                    ))}
                  </div>

                  {game.broadcast && (
                    <p className="text-xs text-muted">Broadcast: {game.broadcast}</p>
                  )}

                  {game.odds && (game.odds.spread || game.odds.overUnder) && (
                    <p className="text-xs text-muted">
                      Spread: {game.odds.spread ?? 'TBD'} · O/U: {game.odds.overUnder ?? 'TBD'}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <SportSwitcher currentSport="football" />
    </div>
  );
}
