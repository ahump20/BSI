'use client';

import { useEffect, useMemo, useState } from 'react';
import SportSwitcher from '@/components/sport-switcher';
import styles from './scoreboard.module.css';

const SCOREBOARD_ENDPOINT =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';
const REFRESH_INTERVAL_MS = 30_000;

type RecordSummary = {
  summary?: string;
};

type ScoreboardTeam = {
  id?: string;
  homeAway?: 'home' | 'away';
  score?: string;
  team?: {
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
  };
  records?: RecordSummary[];
};

type ScoreboardStatusType = {
  state?: 'pre' | 'in' | 'post';
  detail?: string;
  shortDetail?: string;
  completed?: boolean;
};

type ScoreboardStatus = {
  type?: ScoreboardStatusType;
};

type ScoreboardCompetition = {
  id?: string;
  status?: ScoreboardStatus;
  competitors?: ScoreboardTeam[];
  venue?: {
    fullName?: string;
  };
};

type ScoreboardEvent = {
  id: string;
  date?: string;
  competitions?: ScoreboardCompetition[];
};

type ScoreboardResponse = {
  events?: ScoreboardEvent[];
};

type StatusMeta = {
  label: string;
  state: 'pre' | 'in' | 'post';
};

const statusMeta = (status?: ScoreboardStatus): StatusMeta => {
  const type = status?.type;
  if (!type) {
    return { label: 'Scheduled', state: 'pre' };
  }

  const state: StatusMeta['state'] = type.completed || type.state === 'post'
    ? 'post'
    : type.state === 'in'
      ? 'in'
      : 'pre';

  if (state === 'post') {
    return { label: type.detail || type.shortDetail || 'Final', state };
  }

  if (state === 'in') {
    return { label: type.detail || type.shortDetail || 'Live', state };
  }

  return { label: type.detail || type.shortDetail || 'Scheduled', state };
};

const formatRecord = (records?: RecordSummary[]): string => {
  const [primary] = records ?? [];
  return primary?.summary ?? '';
};

const formatStartTime = (event: ScoreboardEvent): string => {
  if (!event.date) {
    return '';
  }

  try {
    const date = new Date(event.date);
    return new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
      dateStyle: 'medium',
      timeZone: 'America/Chicago',
    }).format(date);
  } catch (error) {
    return '';
  }
};

const getTeamBySide = (
  competition: ScoreboardCompetition | undefined,
  side: 'home' | 'away',
): ScoreboardTeam | undefined =>
  competition?.competitors?.find((competitor) => competitor.homeAway === side);

export default function BaseballNcaabScoreboardPage() {
  const [games, setGames] = useState<ScoreboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = null;

    const fetchGames = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        if (isMounted) {
          setError(null);
        }

        const response = await fetch(SCOREBOARD_ENDPOINT, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as ScoreboardResponse;
        if (isMounted) {
          setGames(data.events ?? []);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        if ((fetchError as Error).name === 'AbortError') {
          return;
        }

        setError((fetchError as Error).message);
        setLoading(false);
      }
    };

    fetchGames();
    const intervalId = setInterval(fetchGames, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      controller?.abort();
      clearInterval(intervalId);
    };
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
      dateStyle: 'medium',
      timeZone: 'America/Chicago',
    }).format(lastUpdated);
  }, [lastUpdated]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <span className={styles.pill}>NCAA Division I</span>
          <h1 className={styles.title}>College Baseball Live Scoreboard</h1>
          <p className={styles.subtitle}>
            Real-time scores, venues, and momentum snapshots across the college baseball landscape.
          </p>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <span aria-hidden="true">⏱️</span>
              {lastUpdated ? `Last updated ${lastUpdatedLabel}` : 'Loading live data…'}
            </span>
            <span className={styles.metaItem}>
              <span aria-hidden="true">🔁</span>
              Refreshing every {Math.floor(REFRESH_INTERVAL_MS / 1000)} seconds
            </span>
          </div>
        </header>

        <main className={styles.scoreboard}>
          <div className={styles.sectionHeading}>
            <strong>Today&apos;s Board</strong>
            <span>{games.length} matchups tracked</span>
          </div>

          {loading ? (
            <div className={styles.loading} role="status" aria-live="polite">
              <div className={styles.spinner} />
              <p>Loading live scores…</p>
            </div>
          ) : error ? (
            <div className={styles.error} role="alert">
              <p className={styles.errorTitle}>We couldn&apos;t load the latest games.</p>
              <p className={styles.errorDetail}>{error}</p>
              <p className={styles.helper}>
                Source: ESPN College Baseball Scoreboard API
              </p>
            </div>
          ) : games.length === 0 ? (
            <div className={styles.empty} role="status" aria-live="polite">
              <p>No matchups are on the board right now. Check back soon for first pitch.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {games.map((event) => {
                const competition = event.competitions?.[0];
                const home = getTeamBySide(competition, 'home');
                const away = getTeamBySide(competition, 'away');
                const status = statusMeta(competition?.status);
                const homeScore = Number(home?.score ?? '0');
                const awayScore = Number(away?.score ?? '0');
                const isHomeLeading = homeScore > awayScore;
                const isAwayLeading = awayScore > homeScore;

                return (
                  <article key={event.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span
                        className={`${styles.status} ${
                          status.state === 'in'
                            ? styles.statusLive
                            : status.state === 'post'
                              ? styles.statusFinal
                              : styles.statusScheduled
                        }`}
                      >
                        {status.label}
                      </span>
                      {competition?.venue?.fullName ? (
                        <span className={styles.venue}>{competition.venue.fullName}</span>
                      ) : null}
                    </div>

                    <div className={styles.teams}>
                      <div className={styles.teamRow}>
                        <div className={styles.teamInfo}>
                          <span className={styles.teamName}>
                            {away?.team?.displayName ?? 'Away'}
                          </span>
                          {formatRecord(away?.records) ? (
                            <span className={styles.teamRecord}>{formatRecord(away?.records)}</span>
                          ) : null}
                        </div>
                        <span
                          className={`${styles.teamScore} ${
                            isAwayLeading ? styles.teamScoreLeading : ''
                          }`}
                          aria-label={`Away score ${away?.score ?? '0'}`}
                        >
                          {away?.score ?? '0'}
                        </span>
                      </div>

                      <div className={styles.teamRow}>
                        <div className={styles.teamInfo}>
                          <span className={styles.teamName}>
                            {home?.team?.displayName ?? 'Home'}
                          </span>
                          {formatRecord(home?.records) ? (
                            <span className={styles.teamRecord}>{formatRecord(home?.records)}</span>
                          ) : null}
                        </div>
                        <span
                          className={`${styles.teamScore} ${
                            isHomeLeading ? styles.teamScoreLeading : ''
                          }`}
                          aria-label={`Home score ${home?.score ?? '0'}`}
                        >
                          {home?.score ?? '0'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.meta}>
                      <span>{status.state === 'pre' ? 'First pitch' : 'Updated'}: {formatStartTime(event)}</span>
                      <span>Event ID: {event.id}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <footer className={styles.footer}>
          Data provided by ESPN College Baseball Scoreboard API. Timestamps localized to America/Chicago.
        </footer>
      </div>

      <SportSwitcher currentSport="baseball" />
    </div>
  );
}
