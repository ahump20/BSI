import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

export interface WatchlistEntry {
  id: string;
  userId: string;
  teamId: string;
  teamSlug?: string | null;
  teamName: string;
  teamAbbreviation?: string | null;
  teamLogoUrl?: string | null;
  alertLeadChanges: boolean;
  alertWalkOffs: boolean;
  alertUpsetOdds: boolean;
}

export interface WatchlistGameTeam {
  id: string;
  name: string;
  slug: string;
  abbreviation?: string | null;
  logoUrl?: string | null;
}

export interface WatchlistGame {
  id: string;
  externalId?: string | null;
  scheduledAt: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  currentInning?: number | null;
  currentInningHalf?: string | null;
  homeTeam: WatchlistGameTeam;
  awayTeam: WatchlistGameTeam;
}

interface WatchlistDrawerProps {
  isActive: boolean;
  onSelectGame?: (game: WatchlistGame) => void;
}

type AlertPreferenceKey = 'alertLeadChanges' | 'alertWalkOffs' | 'alertUpsetOdds';

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const DEFAULT_ALERTS = {
  alertLeadChanges: true,
  alertWalkOffs: true,
  alertUpsetOdds: false,
};

const statusLabels: Record<string, string> = {
  LIVE: 'Live',
  SCHEDULED: 'Scheduled',
  FINAL: 'Final',
  POSTPONED: 'Postponed',
  CANCELLED: 'Cancelled',
  DELAYED: 'Delayed',
};

function formatGameStatus(game: WatchlistGame): string {
  const normalizedStatus = game.status?.toUpperCase?.() ?? 'SCHEDULED';
  if (normalizedStatus === 'LIVE' && game.currentInning) {
    const half = game.currentInningHalf ? game.currentInningHalf.toLowerCase() : '';
    return `${half ? `${half.charAt(0).toUpperCase()}${half.slice(1)} ` : ''}${game.currentInning}`;
  }
  if (normalizedStatus === 'SCHEDULED') {
    try {
      const date = new Date(game.scheduledAt);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (error) {
      return statusLabels[normalizedStatus] ?? normalizedStatus;
    }
  }
  return statusLabels[normalizedStatus] ?? normalizedStatus;
}

function normalizeGame(game: WatchlistGame) {
  return {
    ...game,
    status: game.status?.toLowerCase?.() ?? 'scheduled',
    inning: game.currentInning
      ? { number: game.currentInning, half: (game.currentInningHalf || '').toLowerCase() }
      : null,
    scheduledTime: formatGameStatus(game),
    homeTeam: {
      id: game.homeTeam.id,
      name: game.homeTeam.name,
      record: '—',
      score: game.homeScore ?? 0,
      abbreviation: game.homeTeam.abbreviation ?? undefined,
      logoUrl: game.homeTeam.logoUrl ?? undefined,
    },
    awayTeam: {
      id: game.awayTeam.id,
      name: game.awayTeam.name,
      record: '—',
      score: game.awayScore ?? 0,
      abbreviation: game.awayTeam.abbreviation ?? undefined,
      logoUrl: game.awayTeam.logoUrl ?? undefined,
    },
  };
}

export default function WatchlistDrawer({ isActive, onSelectGame }: WatchlistDrawerProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [watchlistGames, setWatchlistGames] = useState<WatchlistGame[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [state, setState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(user?.id);

  const authHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user?.id) {
      headers['X-User-Id'] = user.id;
    }

    if (getToken) {
      try {
        const token = await getToken({ template: 'bsi-api' }).catch(() => null);
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (tokenError) {
        console.warn('Unable to resolve Clerk token, continuing with user header.', tokenError);
      }
    }

    return headers;
  }, [getToken, user?.id]);

  const refreshWatchlist = useCallback(async () => {
    if (!user?.id) {
      setWatchlist([]);
      setWatchlistGames([]);
      return;
    }

    setState('loading');
    setError(null);

    try {
      const headers = await authHeaders();
      const response = await fetch('/api/v1/watchlist', { headers });

      if (!response.ok) {
        throw new Error(`Failed to load watchlist (${response.status})`);
      }

      const payload = await response.json();
      setWatchlist(payload.watchlist ?? []);
      setWatchlistGames(payload.games ?? []);
      setState('success');
    } catch (err) {
      console.error('Failed to load watchlist', err);
      setError(err instanceof Error ? err.message : 'Unable to load watchlist');
      setState('error');
    }
  }, [authHeaders, user?.id]);

  useEffect(() => {
    if (isActive && user?.id) {
      refreshWatchlist();
    }
  }, [isActive, refreshWatchlist, user?.id]);

  const handleSubmitTeam = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!teamInput.trim()) return;
      if (!user?.id) {
        setError('Sign in to manage your watchlist.');
        return;
      }

      setState('loading');
      setError(null);

      try {
        const headers = await authHeaders();
        const response = await fetch('/api/v1/watchlist', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            teamSlug: teamInput.trim(),
            ...DEFAULT_ALERTS,
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Unable to save watchlist entry');
        }

        const payload = await response.json();
        setWatchlist(payload.watchlist ?? []);
        setWatchlistGames(payload.games ?? []);
        setTeamInput('');
        setState('success');
      } catch (err) {
        console.error('Failed to add team to watchlist', err);
        setError(err instanceof Error ? err.message : 'Unable to add team');
        setState('error');
      }
    },
    [authHeaders, teamInput, user?.id]
  );

  const handleAlertToggle = useCallback(
    async (entry: WatchlistEntry, key: AlertPreferenceKey) => {
      if (!user?.id) {
        setError('Sign in to update alerts.');
        return;
      }

      setState('loading');
      setError(null);

      try {
        const headers = await authHeaders();
        const response = await fetch('/api/v1/watchlist', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            teamId: entry.teamId,
            alertLeadChanges: key === 'alertLeadChanges' ? !entry.alertLeadChanges : entry.alertLeadChanges,
            alertWalkOffs: key === 'alertWalkOffs' ? !entry.alertWalkOffs : entry.alertWalkOffs,
            alertUpsetOdds: key === 'alertUpsetOdds' ? !entry.alertUpsetOdds : entry.alertUpsetOdds,
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Unable to update preferences');
        }

        const payload = await response.json();
        setWatchlist(payload.watchlist ?? []);
        setWatchlistGames(payload.games ?? []);
        setState('success');
      } catch (err) {
        console.error('Failed to update alert preferences', err);
        setError(err instanceof Error ? err.message : 'Unable to update alerts');
        setState('error');
      }
    },
    [authHeaders, user?.id]
  );

  const normalizedGames = useMemo(
    () =>
      watchlistGames.map((game) => ({
        ...game,
        displayStatus: formatGameStatus(game),
      })),
    [watchlistGames]
  );

  const handleGameSelect = useCallback(
    (game: WatchlistGame) => {
      if (!onSelectGame) return;
      const normalized = normalizeGame(game);
      onSelectGame(normalized as unknown as WatchlistGame);
    },
    [onSelectGame]
  );

  return (
    <div className="watchlist-drawer">
      <header className="watchlist-header">
        <div>
          <h2>Watchlist</h2>
          <p className="watchlist-subtitle">Track your programs and automate high-leverage alerts.</p>
        </div>
        <button className="refresh-button" onClick={refreshWatchlist} disabled={state === 'loading'}>
          Refresh
        </button>
      </header>

      {!isAuthenticated ? (
        <div className="watchlist-auth-required">
          <p>Sign in with Clerk to manage your personalized watchlist.</p>
        </div>
      ) : (
        <>
          <form className="watchlist-form" onSubmit={handleSubmitTeam}>
            <label htmlFor="watchlist-team-input">Add a team by slug</label>
            <div className="watchlist-input-row">
              <input
                id="watchlist-team-input"
                type="text"
                placeholder="e.g. texas-longhorns"
                value={teamInput}
                onChange={(event) => setTeamInput(event.target.value)}
                disabled={state === 'loading'}
              />
              <button type="submit" disabled={state === 'loading'}>
                {state === 'loading' ? 'Saving…' : 'Add'}
              </button>
            </div>
            <span className="watchlist-hint">We match the slug to our NCAA D1 roster automatically.</span>
          </form>

          {error && <div className="watchlist-error">{error}</div>}

          <section className="watchlist-section">
            <h3>Tracked Teams</h3>
            {state === 'loading' && watchlist.length === 0 ? (
              <div className="watchlist-empty">Loading watchlist…</div>
            ) : watchlist.length === 0 ? (
              <div className="watchlist-empty">
                <p>No teams pinned yet.</p>
                <span>Add a slug to start receiving alerts.</span>
              </div>
            ) : (
              <ul className="watchlist-list">
                {watchlist.map((entry) => (
                  <li key={entry.id} className="watchlist-item">
                    <div className="watchlist-team">
                      {entry.teamLogoUrl ? (
                        <img src={entry.teamLogoUrl} alt="" className="watchlist-logo" />
                      ) : (
                        <div className="watchlist-logo placeholder">{entry.teamAbbreviation?.slice(0, 2) ?? 'CB'}</div>
                      )}
                      <div>
                        <p className="watchlist-team-name">{entry.teamName}</p>
                        {entry.teamSlug && <p className="watchlist-team-slug">/{entry.teamSlug}</p>}
                      </div>
                    </div>
                    <div className="watchlist-preferences">
                      <label className="watchlist-toggle">
                        <input
                          type="checkbox"
                          checked={entry.alertLeadChanges}
                          onChange={() => handleAlertToggle(entry, 'alertLeadChanges')}
                        />
                        <span>Lead changes</span>
                      </label>
                      <label className="watchlist-toggle">
                        <input
                          type="checkbox"
                          checked={entry.alertWalkOffs}
                          onChange={() => handleAlertToggle(entry, 'alertWalkOffs')}
                        />
                        <span>Walk-offs</span>
                      </label>
                      <label className="watchlist-toggle">
                        <input
                          type="checkbox"
                          checked={entry.alertUpsetOdds}
                          onChange={() => handleAlertToggle(entry, 'alertUpsetOdds')}
                        />
                        <span>Upset odds</span>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="watchlist-section">
            <h3>Upcoming &amp; Live Games</h3>
            {normalizedGames.length === 0 ? (
              <div className="watchlist-empty">
                <p>No games scheduled yet for your tracked teams.</p>
              </div>
            ) : (
              <div className="watchlist-games">
                {normalizedGames.map((game) => (
                  <article key={game.id} className="watchlist-game-card">
                    <div className="watchlist-game-header">
                      <span className={`game-status-tag status-${game.status?.toLowerCase() ?? 'scheduled'}`}>
                        {game.displayStatus}
                      </span>
                      <span className="game-time">
                        {new Date(game.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="watchlist-game-body">
                      <div className="watchlist-game-team">
                        <span className="team-name">{game.awayTeam.name}</span>
                        <span className="team-score">{game.awayScore ?? 0}</span>
                      </div>
                      <div className="watchlist-game-team">
                        <span className="team-name">{game.homeTeam.name}</span>
                        <span className="team-score">{game.homeScore ?? 0}</span>
                      </div>
                    </div>
                    {onSelectGame && (
                      <button className="watchlist-game-button" onClick={() => handleGameSelect(game)}>
                        View Box Score
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
