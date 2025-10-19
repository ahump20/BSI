'use client';

import { useEffect, useMemo, useState } from 'react';
import { SportSwitcher } from './components/SportSwitcher';

type CompetitionStatus = {
  type?: {
    completed?: boolean;
    description?: string;
    detail?: string;
    state?: string;
  };
};

type CompetitionVenue = {
  fullName?: string;
};

type CompetitionCompetitor = {
  id?: string;
  homeAway?: 'home' | 'away';
  score?: string;
  team?: {
    displayName?: string;
    abbreviation?: string;
  };
  records?: Array<{ summary?: string }>;
};

type Competition = {
  id?: string;
  competitors?: CompetitionCompetitor[];
  venue?: CompetitionVenue;
  status?: CompetitionStatus;
};

type EspnEvent = {
  id: string;
  competitions?: Competition[];
};

type FetchState = 'idle' | 'loading' | 'ready' | 'error';

const SCOREBOARD_ENDPOINT =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';

function describeStatus(status?: CompetitionStatus) {
  if (!status) {
    return { label: 'Scheduled', tone: 'status-pill' } as const;
  }

  const completed = status.type?.completed;
  const detail = status.type?.detail ?? status.type?.description ?? 'In Progress';
  const state = status.type?.state?.toLowerCase();

  if (completed) {
    return { label: 'Final', tone: 'status-pill status-final' } as const;
  }

  if (state === 'in' || state === 'inprogress' || detail.toLowerCase().includes('live')) {
    return { label: detail, tone: 'status-pill status-live' } as const;
  }

  if (state === 'delayed') {
    return { label: detail, tone: 'status-pill status-delayed' } as const;
  }

  return { label: detail, tone: 'status-pill' } as const;
}

export default function BaseballScoreboardPage() {
  const [events, setEvents] = useState<EspnEvent[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchGames = async () => {
      try {
        setState('loading');
        const response = await fetch(SCOREBOARD_ENDPOINT, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const payload: { events?: EspnEvent[] } = await response.json();

        if (!isMounted) {
          return;
        }

        setEvents(payload.events ?? []);
        setError(null);
        setLastUpdated(new Date());
        setState('ready');
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error('Failed to fetch college baseball games', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setState('error');
      }
    };

    fetchGames();
    const interval = setInterval(fetchGames, 30_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formattedTimestamp = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    return lastUpdated.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }, [lastUpdated]);

  if (state === 'loading' || state === 'idle') {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border/60 bg-surface/70 px-6 py-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">⚾ College Baseball Live</h1>
          <p className="mt-3 text-sm text-muted">
            Real-time college baseball scores and updates refreshed every 30 seconds.
          </p>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
          <div className="spinner" aria-hidden />
          <div className="space-y-2">
            <p className="text-sm text-muted">Loading live scores…</p>
            <p className="text-xs text-muted/80">Pulling latest data from ESPN College Baseball</p>
          </div>
        </main>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border/60 bg-surface/70 px-6 py-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">⚾ College Baseball Live</h1>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="card w-full max-w-xl space-y-4 px-8 py-10">
            <h2 className="text-xl font-semibold text-danger">Failed to load live data</h2>
            <p className="text-sm text-muted">{error}</p>
            <p className="text-xs text-muted/70">
              Data source: ESPN College Baseball API
              <br /> Status: Temporarily unavailable
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-surface/70 px-6 py-10 text-center">
        <div className="mx-auto max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Diamond Insights</p>
          <h1 className="text-4xl font-semibold tracking-tight">⚾ College Baseball Live</h1>
          <p className="text-sm text-muted">
            Real-time scores, mobile-first visuals, and SEC-country context without leaving dark mode.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Live Scoreboard</h2>
            {formattedTimestamp && (
              <p className="text-xs text-muted">
                Last updated {formattedTimestamp} · Source: ESPN College Baseball API
              </p>
            )}
          </div>

          {events.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 px-8 py-12 text-center">
              <span className="text-4xl" aria-hidden>
                🌙
              </span>
              <div className="space-y-1">
                <p className="text-base font-medium">No live games right now</p>
                <p className="text-sm text-muted">
                  Check back soon for first pitch, or explore historical insights inside Diamond Pro.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((event) => {
                const competition = event.competitions?.[0];
                const home = competition?.competitors?.find((team) => team.homeAway === 'home');
                const away = competition?.competitors?.find((team) => team.homeAway === 'away');
                const status = describeStatus(competition?.status);

                return (
                  <article key={event.id} className="card flex flex-col gap-4 px-6 py-6">
                    <div className="flex items-center justify-between">
                      <span className={status.tone}>{status.label}</span>
                      <span className="text-xs text-muted">
                        {competition?.venue?.fullName ?? 'Venue TBA'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {[away, home].map((team, index) => {
                        if (!team) {
                          return null;
                        }

                        const isHome = index === 1;
                        const record = team.records?.[0]?.summary;

                        return (
                          <div key={team.id ?? `${event.id}-${team.homeAway}`} className="flex items-center justify-between gap-4">
                            <div className="flex flex-1 flex-col">
                              <span className="text-sm font-medium text-muted">
                                {isHome ? 'Home' : 'Away'}
                              </span>
                              <span className="text-lg font-semibold">{team.team?.displayName ?? 'TBD'}</span>
                              {record && <span className="text-xs text-muted">{record}</span>}
                            </div>
                            <span className="text-3xl font-bold tracking-tight">
                              {team.score ?? '0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SportSwitcher currentSport="baseball" />
    </div>
  );
}
