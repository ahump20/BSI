'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import type { DiamondProSnapshot, GameSummary, GamesApiResponse } from './types';

const DEFAULT_REFRESH_MS = 45_000;

async function fetchGames(url: string): Promise<GamesApiResponse> {
  const response = await fetch(url, {
    headers: {
      'x-bsi-tier': typeof document !== 'undefined' ? window.localStorage.getItem('bsi_user_tier') ?? '' : '',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Unable to load games.';
    try {
      const payload = (await response.json()) as Partial<GamesApiResponse>;
      if (payload?.error) {
        message = payload.error;
      }
    } catch (error) {
      console.warn('[GamesClient] Failed to parse games response', error);
    }
    throw new Error(message);
  }

  return (await response.json()) as GamesApiResponse;
}

function formatStatus(game: GameSummary): string {
  const baseStatus = game.status.replace(/_/g, ' ').toUpperCase();
  if (game.status.toLowerCase() === 'live' && game.inning) {
    const half = game.inningHalf ? game.inningHalf.charAt(0).toUpperCase() + game.inningHalf.slice(1).toLowerCase() : '';
    return `${half} ${game.inning}`.trim();
  }
  if (game.status.toLowerCase() === 'final' && game.completedAt) {
    return `Final · ${new Date(game.completedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })}`;
  }
  if (game.scheduledAt) {
    return new Date(game.scheduledAt).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: 'numeric',
    });
  }
  return baseStatus;
}

function useGamesData() {
  const today = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const { data, error, isLoading, mutate } = useSWR<GamesApiResponse>(
    `/api/v1/games?date=${today}`,
    fetchGames,
    {
      refreshInterval: DEFAULT_REFRESH_MS,
      revalidateOnFocus: true,
      shouldRetryOnError: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

function LoadingState() {
  return (
    <div className="di-card-grid" aria-live="polite">
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className="di-card" aria-busy="true">
          <div className="di-microcopy" style={{ opacity: 0.6 }}>Syncing game feed…</div>
          <div style={{ height: '28px', background: 'rgba(148,163,184,0.12)', borderRadius: '12px' }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ flex: 1, height: '16px', background: 'rgba(148,163,184,0.1)', borderRadius: '8px' }} />
            <div style={{ flex: 1, height: '16px', background: 'rgba(148,163,184,0.08)', borderRadius: '8px' }} />
          </div>
        </article>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="di-card-grid" role="alert">
      <article className="di-card">
        <h2>Unable to Load Games</h2>
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="di-action di-action--secondary"
          style={{ alignSelf: 'flex-start' }}
        >
          Retry
        </button>
      </article>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="di-card-grid">
      <article className="di-card">
        <h2>No Games Scheduled</h2>
        <p>We didn’t find any Division I matchups for today. Adjust filters or check back soon.</p>
      </article>
    </div>
  );
}

function TeamRow({ label, team, score }: { label: string; team: GameSummary['homeTeam']; score: number | null }) {
  if (!team) {
    return (
      <div className="di-microcopy">{label}</div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontWeight: 600 }}>{team.name}</span>
        {team.abbreviation && <span className="di-microcopy">{team.abbreviation}</span>}
      </div>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.25rem', fontWeight: 700 }}>
        {score != null ? score : '—'}
      </span>
    </div>
  );
}

function DiamondProBadge({ snapshot }: { snapshot?: DiamondProSnapshot }) {
  if (!snapshot) {
    return (
      <p className="di-microcopy">Upgrade to Diamond Pro for leverage index and win probabilities.</p>
    );
  }

  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
      <div>
        <dt className="di-microcopy">Run Differential</dt>
        <dd style={{ fontWeight: 600 }}>{snapshot.runDifferential >= 0 ? `+${snapshot.runDifferential}` : snapshot.runDifferential}</dd>
      </div>
      <div>
        <dt className="di-microcopy">Leverage Index</dt>
        <dd style={{ fontWeight: 600 }}>{snapshot.leverageIndex.toFixed(2)}</dd>
      </div>
      <div>
        <dt className="di-microcopy">Home Win%</dt>
        <dd style={{ fontWeight: 600 }}>{Math.round(snapshot.homeWinProbability * 100)}%</dd>
      </div>
      <div>
        <dt className="di-microcopy">Away Win%</dt>
        <dd style={{ fontWeight: 600 }}>{Math.round(snapshot.awayWinProbability * 100)}%</dd>
      </div>
    </dl>
  );
}

function GameCard({ game, canSeeDiamondPro }: { game: GameSummary; canSeeDiamondPro: boolean }) {
  const status = formatStatus(game);

  return (
    <article className="di-card" role="listitem">
      <div className="di-microcopy" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span>{status}</span>
        {game.conferenceGame && <span style={{ color: 'var(--di-accent)' }}>Conference</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
        <TeamRow label="Away" team={game.awayTeam} score={game.awayScore} />
        <TeamRow label="Home" team={game.homeTeam} score={game.homeScore} />
      </div>
      {game.venue && (
        <p className="di-microcopy" style={{ marginTop: '0.75rem' }}>
          {game.venue.name ? `${game.venue.name} · ` : ''}
          {[game.venue.city, game.venue.state].filter(Boolean).join(', ')}
        </p>
      )}
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem' }}>Diamond Pro Snapshot</h3>
        {canSeeDiamondPro ? <DiamondProBadge snapshot={game.diamondPro} /> : <DiamondProBadge />}
      </div>
    </article>
  );
}

export default function GamesClient() {
  const { data, error, isLoading, mutate } = useGamesData();

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  const games = data?.data ?? [];
  const canSeeDiamondPro = Boolean(data?.permissions.diamondPro);
  const diamondProFeatureEnabled = Boolean(data?.permissions.diamondProFeatureFlag);

  if (!games.length) {
    return (
      <>
        <EmptyState />
        {diamondProFeatureEnabled && !canSeeDiamondPro && (
          <article className="di-card" style={{ marginTop: '1.25rem' }}>
            <h2>Unlock Diamond Pro</h2>
            <p>
              Premium win probabilities, leverage markers, and pitch-by-pitch overlays ship with Diamond Pro. Upgrade to
              monitor leverage in real time.
            </p>
          </article>
        )}
      </>
    );
  }

  return (
    <>
      <div className="di-card-grid" role="list">
        {games.map((game) => (
          <GameCard key={game.id} game={game} canSeeDiamondPro={canSeeDiamondPro} />
        ))}
      </div>
      {diamondProFeatureEnabled && !canSeeDiamondPro && (
        <article className="di-card" style={{ marginTop: '1.25rem' }}>
          <h2>Diamond Pro Exclusive</h2>
          <p>
            These cards highlight leverage index and win probabilities for subscribed programs. Secure your Diamond Pro
            seat to see the full stack of advanced metrics across every contest.
          </p>
        </article>
      )}
      {data?.meta.generatedAt && (
        <p className="di-microcopy" style={{ marginTop: '0.75rem' }}>
          Last updated {new Date(data.meta.generatedAt).toLocaleTimeString()}
        </p>
      )}
    </>
  );
}
