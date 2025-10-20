import Link from 'next/link';
import { Suspense } from 'react';
import type {
  BaseballGameState,
  BaseballGamesResponse,
  BaseballGameSituation,
  RegressionContributor,
  WinProbabilityPoint
} from '../../../api/v1/baseball/games/types';
import './styles.css';

const plannerLinks = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/standings', label: 'Check Standings' },
  { href: '/baseball/ncaab/news', label: 'Latest Briefings' }
];

function getAppOrigin(): string {
  const direct = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_ORIGIN ?? process.env.WEB_APP_ORIGIN;
  if (direct) {
    return direct;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://127.0.0.1:3000';
}

interface ScoreboardResult {
  data: BaseballGamesResponse | null;
  error?: string;
}

async function fetchScoreboard(): Promise<ScoreboardResult> {
  try {
    const origin = getAppOrigin();
    const url = new URL('/api/v1/baseball/games', origin);
    url.searchParams.set('league', 'ncaab');
    url.searchParams.set('date', new Date().toISOString().slice(0, 10));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json'
      },
      next: { revalidate: 25 }
    });

    if (!response.ok) {
      let errorDetail = 'Unable to load live games.';
      try {
        const body = await response.json();
        errorDetail = typeof body?.error === 'string' ? body.error : errorDetail;
      } catch (error) {
        // ignore JSON parse issues
      }
      return { data: null, error: errorDetail };
    }

    const payload = (await response.json()) as BaseballGamesResponse;
    return { data: payload };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error fetching games.'
    };
  }
}

function clampProbability(probability: number | null | undefined): number | undefined {
  if (typeof probability !== 'number' || Number.isNaN(probability)) {
    return undefined;
  }
  return Math.min(Math.max(probability, 0), 1);
}

function formatProbability(probability: number | undefined): string {
  if (typeof probability !== 'number') {
    return '—';
  }
  const value = probability * 100;
  return value >= 99 || value <= 1 ? `${value.toFixed(1)}%` : `${Math.round(value)}%`;
}

function resolveTrend(probability: number | undefined, isHome: boolean): 'hot' | 'cold' | undefined {
  if (typeof probability !== 'number') {
    return undefined;
  }
  if (probability >= 0.6 && isHome) {
    return 'hot';
  }
  if (probability >= 0.6 && !isHome) {
    return 'cold';
  }
  if (probability <= 0.4 && isHome) {
    return 'cold';
  }
  if (probability <= 0.4 && !isHome) {
    return 'hot';
  }
  return undefined;
}

function formatGameStatus(game: BaseballGameState): string {
  if (game.status === 'scheduled') {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/Chicago'
    }).format(new Date(game.startTime));
  }

  if (game.situation) {
    const parts: string[] = [];
    if (typeof game.situation.inning === 'number') {
      const half = game.situation.half === 'bottom' ? 'B' : 'T';
      parts.push(`${half}${game.situation.inning}`);
    }
    if (typeof game.situation.outs === 'number') {
      parts.push(`${game.situation.outs} out${game.situation.outs === 1 ? '' : 's'}`);
    }
    return parts.length > 0 ? parts.join(' • ') : game.statusText ?? 'In Progress';
  }

  return game.statusText ?? game.status.replace('_', ' ');
}

function formatUpdated(timestamp: string | undefined): string {
  if (!timestamp) {
    return 'Updated just now';
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'America/Chicago'
    });
    return `Updated ${formatter.format(new Date(timestamp))} CT`;
  } catch (error) {
    return 'Updated moments ago';
  }
}

function describeRunners(runners: BaseballGameSituation['runners'] | undefined): string | undefined {
  if (!runners) {
    return undefined;
  }

  const occupied: string[] = [];
  if (runners.first) occupied.push('1B');
  if (runners.second) occupied.push('2B');
  if (runners.third) occupied.push('3B');

  if (!occupied.length) {
    return 'Bases empty';
  }

  return `Runners: ${occupied.join(', ')}`;
}

function ProbabilityChip({
  label,
  probability,
  trend
}: {
  label: string;
  probability: number | undefined;
  trend?: 'hot' | 'cold';
}) {
  return (
    <span className="probability-chip" data-trend={trend}>
      <span>{label}</span>
      <strong>{formatProbability(probability)}</strong>
    </span>
  );
}

function LeverageBadge({ leverageIndex }: { leverageIndex: number | undefined }) {
  if (typeof leverageIndex !== 'number') {
    return null;
  }

  let level: 'moderate' | 'high' | 'extreme' = 'moderate';
  if (leverageIndex >= 3.5) {
    level = 'extreme';
  } else if (leverageIndex >= 2.5) {
    level = 'high';
  }

  return (
    <span className="leverage-badge" data-level={level}>
      <span>LI</span>
      <strong>{leverageIndex.toFixed(2)}</strong>
    </span>
  );
}

function WinProbabilitySparkline({ series }: { series: WinProbabilityPoint[] | undefined }) {
  if (!series || series.length < 2) {
    return null;
  }

  const width = 120;
  const height = 48;
  const coordinates = series.map((point, index) => {
    const probability = clampProbability(point.home) ?? 0.5;
    const x = (index / (series.length - 1)) * width;
    const y = height - probability * height;
    return { command: index === 0 ? 'M' : 'L', x, y };
  });

  const path = coordinates.map((coord) => `${coord.command}${coord.x.toFixed(2)},${coord.y.toFixed(2)}`).join(' ');
  const areaPath = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Home win probability sparkline">
      <path className="sparkline-area" d={areaPath} />
      <path d={path} />
    </svg>
  );
}

function RegressionChips({ contributors }: { contributors: RegressionContributor[] | undefined }) {
  if (!contributors || contributors.length === 0) {
    return null;
  }

  return (
    <div className="regression-tokens">
      {contributors.slice(0, 4).map((contributor) => {
        const deltaPercent = contributor.delta * 100;
        const formattedDelta = `${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(Math.abs(deltaPercent) < 1 ? 2 : 1)}%`;
        const tooltip = contributor.description ?? `Model coefficient impact: ${formattedDelta} toward ${contributor.direction}.`;
        return (
          <span
            key={contributor.id}
            className="regression-chip"
            data-direction={contributor.direction}
            data-tooltip={tooltip}
            tabIndex={0}
            aria-label={`${contributor.label} contributes ${formattedDelta} for the ${contributor.direction} side`}
          >
            <span>{contributor.label}</span>
            <span>{formattedDelta}</span>
          </span>
        );
      })}
    </div>
  );
}

function GameCard({ game }: { game: BaseballGameState }) {
  const regression = game.regression;
  const homeProbability = clampProbability(regression?.homeWinProbability ?? game.teams.home.winProbability ?? null);
  const awayProbability = clampProbability(
    game.teams.away.winProbability ?? (typeof homeProbability === 'number' ? 1 - homeProbability : undefined)
  );

  const situation = game.situation;
  const runners = describeRunners(situation?.runners);

  return (
    <article className="scoreboard-card" aria-labelledby={`game-${game.id}`}>
      <header className="scoreboard-header">
        <div className="scoreboard-title">
          <span className="scoreboard-status">{formatGameStatus(game)}</span>
          <h2 id={`game-${game.id}`}>
            {game.teams.away.shortName ?? game.teams.away.name} @ {game.teams.home.shortName ?? game.teams.home.name}
          </h2>
          {game.venue ? <span className="scoreboard-venue">{game.venue}</span> : null}
        </div>
        <div className="scoreboard-updated">{formatUpdated(game.lastUpdated)}</div>
      </header>
      <div className="scoreboard-teams">
        <div className="scoreboard-team-row">
          <div className="scoreboard-team-meta">
            <strong>{game.teams.away.name}</strong>
            {game.teams.away.record ? <span>{game.teams.away.record}</span> : null}
          </div>
          <div className="scoreboard-score">{game.teams.away.runs ?? '—'}</div>
          <ProbabilityChip label="Win%" probability={awayProbability} trend={resolveTrend(awayProbability, false)} />
        </div>
        <div className="scoreboard-team-row">
          <div className="scoreboard-team-meta">
            <strong>{game.teams.home.name}</strong>
            {game.teams.home.record ? <span>{game.teams.home.record}</span> : null}
          </div>
          <div className="scoreboard-score">{game.teams.home.runs ?? '—'}</div>
          <ProbabilityChip label="Win%" probability={homeProbability} trend={resolveTrend(homeProbability, true)} />
        </div>
      </div>
      <div className="regression-metrics">
        <div className="situation-bar">
          {situation?.description ? <span>{situation.description}</span> : null}
          {typeof situation?.balls === 'number' && typeof situation?.strikes === 'number' ? (
            <span>{`Count ${situation.balls}-${situation.strikes}`}</span>
          ) : null}
          {typeof situation?.outs === 'number' ? <span>{`${situation.outs} outs`}</span> : null}
          {runners ? <span>{runners}</span> : null}
          <LeverageBadge leverageIndex={regression?.leverageIndex ?? undefined} />
        </div>
        <WinProbabilitySparkline series={regression?.winProbabilitySeries} />
        <RegressionChips contributors={regression?.coefficientContributors} />
      </div>
    </article>
  );
}

async function ScoreboardSection() {
  const { data, error } = await fetchScoreboard();

  if (error) {
    return (
      <section className="di-section scoreboard-section" aria-live="polite">
        <div className="scoreboard-empty scoreboard-error">
          <strong>Live feed error</strong>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  const games = data?.games ?? [];

  return (
    <section className="di-section scoreboard-section" aria-live="polite">
      <div className="scoreboard-meta">
        <strong>Realtime inference</strong>
        <span>
          Powered by Cloudflare Workers pulling Highlightly live state, cached for {data?.ttlSeconds ?? 45}s. Last sync{' '}
          {data ? formatUpdated(data.fetchedAt) : 'just now'}.
        </span>
      </div>
      {games.length === 0 ? (
        <div className="scoreboard-empty">
          <strong>No live games at the moment.</strong>
          <p>We will light this board up once first pitch is thrown across Division I.</p>
        </div>
      ) : (
        <div className="scoreboard-grid">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}

function ScoreboardFallback() {
  return (
    <section className="di-section scoreboard-section" aria-busy="true">
      <div className="scoreboard-grid">
        {[0, 1, 2].map((item) => (
          <article key={item} className="scoreboard-card" aria-hidden="true">
            <div className="scoreboard-skeleton">
              <span className="skeleton-line is-title" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BaseballGamesPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Games</span>
        <h1 className="di-page-title">Live Games & Win Models</h1>
        <p className="di-page-subtitle">
          Cloudflare Worker inference keeps this board updated every inning with regression-driven probabilities, leverage
          alerts, and coefficient explainers tuned for fast scouting calls.
        </p>
      </section>
      <Suspense fallback={<ScoreboardFallback />}>
        {/* @ts-expect-error Async Server Component */}
        <ScoreboardSection />
      </Suspense>
      <section className="di-section">
        <h2 className="di-page-title">Navigate</h2>
        <div className="di-card-grid">
          {plannerLinks.map((item) => (
            <article key={item.href} className="di-card">
              <h3>{item.label}</h3>
              <p>Stay locked on the broader landscape while live leverage shifts unfold.</p>
              <Link className="di-inline-link" href={item.href}>
                {item.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
