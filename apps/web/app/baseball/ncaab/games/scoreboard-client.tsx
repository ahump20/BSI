'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PythagoreanAnalyzer,
  type PythagoreanResult,
  type TeamStats,
} from '../../../../lib/analytics/pythagorean';
import {
  type ScoreboardGame,
  type ScoreboardResponse,
  type ScoreboardTeam,
} from '../../../../lib/baseball/scoreboard';

interface ScoreboardClientProps {
  initialData: ScoreboardResponse;
  refreshIntervalMs?: number;
}

interface TeamAnalytics {
  stats: TeamStats;
  pythagorean: PythagoreanResult;
  playoffProbability: number;
}

interface TeamWithAnalytics {
  team: ScoreboardTeam;
  analytics: TeamAnalytics;
}

interface GameWithAnalytics {
  game: ScoreboardGame;
  home: TeamWithAnalytics;
  away: TeamWithAnalytics;
}

const DEFAULT_REFRESH_INTERVAL = 30_000;

export function ScoreboardClient({
  initialData,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL,
}: ScoreboardClientProps) {
  const [scoreboard, setScoreboard] = useState<ScoreboardResponse>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setScoreboard(initialData);
  }, [initialData]);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setIsRefreshing(true);
      setRefreshError(null);

      const response = await fetch('/api/v1/baseball/ncaab/scoreboard', {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const payload = (await response.json()) as Partial<ScoreboardResponse>;

      if (!payload || !Array.isArray(payload.games) || typeof payload.fetchedAt !== 'string') {
        throw new Error('Malformed scoreboard payload');
      }

      setScoreboard({
        games: payload.games,
        fetchedAt: payload.fetchedAt,
        source: payload.source === 'highlightly' || payload.source === 'mock' ? payload.source : 'espn',
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      setRefreshError((error as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, refreshIntervalMs);

    const handleVisibility = () => {
      if (!document.hidden) {
        void refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      controllerRef.current?.abort();
    };
  }, [refresh, refreshIntervalMs]);

  const analytics = useMemo<GameWithAnalytics[]>(() => {
    return scoreboard.games.map((game) => ({
      game,
      home: {
        team: game.teams.home,
        analytics: buildTeamAnalytics(game.teams.home, game.teams.away),
      },
      away: {
        team: game.teams.away,
        analytics: buildTeamAnalytics(game.teams.away, game.teams.home),
      },
    }));
  }, [scoreboard.games]);

  const lastUpdated = useMemo(
    () => formatTimestamp(scoreboard.fetchedAt),
    [scoreboard.fetchedAt]
  );

  return (
    <section className="di-section">
      <header className="di-scoreboard-header">
        <div>
          <h2 className="di-section-title">Live D1 Scoreboard</h2>
          <p className="di-scoreboard-subtitle">
            Win expectancy and postseason odds refresh every {Math.round(refreshIntervalMs / 1000)} seconds. Standard over vibes.
          </p>
        </div>
        <div className="di-scoreboard-meta" aria-live="polite">
          <span data-testid="scoreboard-updated">Last sync · {lastUpdated}</span>
          {isRefreshing ? <span className="di-scoreboard-status">Refreshing…</span> : null}
          {refreshError ? (
            <span className="di-scoreboard-error" role="status">
              Retry failed: {refreshError}
            </span>
          ) : null}
          <button
            className="di-refresh-button"
            type="button"
            onClick={() => refresh()}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
      </header>

      <div className="di-card-grid di-scoreboard-grid">
        {analytics.map((entry) => (
          <article
            className="di-card di-game-card"
            key={entry.game.id}
            data-testid={`scoreboard-game-${entry.game.id}`}
          >
            <header className="di-game-card__header">
              <div className="di-status-badge">{formatStatus(entry.game)}</div>
              <div className="di-game-meta">
                {entry.game.venue.name ? <span>{entry.game.venue.name}</span> : null}
                {entry.game.broadcasts.length > 0 ? (
                  <span>Broadcast: {entry.game.broadcasts.join(', ')}</span>
                ) : null}
              </div>
            </header>

              <div className="di-game-card__teams" role="list">
                {renderTeamRow(entry.away, 'away')}
                {renderTeamRow(entry.home, 'home')}
              </div>

              <section className="di-game-card__analytics" aria-label="Regression metrics">
                <div className="di-analytics-column">
                  <h3>{entry.away.team.shortName ?? entry.away.team.name}</h3>
                  {renderAnalytics(entry.away)}
                </div>
                <div className="di-analytics-column">
                  <h3>{entry.home.team.shortName ?? entry.home.team.name}</h3>
                  {renderAnalytics(entry.home)}
                </div>
              </section>

            <footer className="di-game-card__footer">
              <span className="di-game-card__source">Data: {scoreboard.source.toUpperCase()}</span>
              {entry.game.links.length > 0 ? (
                <a
                  className="di-inline-link"
                  href={entry.game.links[0]?.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.game.links[0]?.text}
                </a>
              ) : null}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildTeamAnalytics(team: ScoreboardTeam, opponent: ScoreboardTeam): TeamAnalytics {
  const wins = team.season.wins ?? 0;
  const losses = team.season.losses ?? 0;
  const gamesPlayed = Math.max(1, team.season.gamesPlayed ?? wins + losses);

  const runsFor = pickStat(team.season.runsFor, team.game.runs, team.score);
  const runsAgainst = pickStat(team.season.runsAgainst, opponent.game.runs, opponent.score);

  const teamStats: TeamStats = {
    sport: 'baseball',
    pointsFor: runsFor,
    pointsAgainst: runsAgainst,
    gamesPlayed,
    wins,
    losses,
  };

  const pythagorean = PythagoreanAnalyzer.analyze(teamStats);

  const seasonLength = Math.max(gamesPlayed, 56);
  const playoffThreshold = Math.max(1, Math.round(seasonLength * 0.6));
  const playoffProbability = PythagoreanAnalyzer.calculatePlayoffProbability(
    teamStats,
    seasonLength,
    playoffThreshold,
  );

  return {
    stats: teamStats,
    pythagorean,
    playoffProbability: clampPercentage(playoffProbability),
  };
}

function renderTeamRow(entry: TeamWithAnalytics, side: 'home' | 'away') {
  const team = entry.team;
  const rankBadge = team.rank ? `#${team.rank} ` : '';
  const record = team.record.summary ?? `${entry.analytics.stats.wins}-${entry.analytics.stats.losses}`;

  return (
    <div className="di-team-row" role="listitem" data-side={side}>
      <div className="di-team-row__info">
        <div className="di-team-row__name">
          {rankBadge && <span className="di-team-rank">{rankBadge}</span>}
          <span>{team.name}</span>
        </div>
        <span className="di-team-record">{record}</span>
      </div>
      <div className="di-team-row__score">{formatScore(team.score)}</div>
    </div>
  );
}

function renderAnalytics(entry: TeamWithAnalytics) {
  const team = entry.team;
  const analytics = entry.analytics;
  return (
    <dl className="di-analytics-list" data-testid={`analytics-${team.id}`}>
      <div>
        <dt>Win Expectancy</dt>
        <dd>{formatPercent(analytics.pythagorean.expectedWinPct)}</dd>
      </div>
      <div>
        <dt>Luck Index</dt>
        <dd>{formatNumber(analytics.pythagorean.luckFactor)}</dd>
      </div>
      <div>
        <dt>Projected Wins</dt>
        <dd>{formatNumber(analytics.pythagorean.expectedWins)}</dd>
      </div>
      <div>
        <dt>Playoff Chance</dt>
        <dd>{formatPercent(analytics.playoffProbability / 100)}</dd>
      </div>
    </dl>
  );
}

function formatStatus(game: ScoreboardGame): string {
  if (game.status.detail) {
    return game.status.detail;
  }
  if (game.status.shortDetail) {
    return game.status.shortDetail;
  }
  return game.status.state === 'pre' ? 'Scheduled' : 'In progress';
}

function pickStat(...candidates: Array<number | null | undefined>): number {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

function formatTimestamp(value: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return `${Math.round(value * 1000) / 10}%`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return `${Math.round(value * 10) / 10}`;
}

function formatScore(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return value.toString();
}
