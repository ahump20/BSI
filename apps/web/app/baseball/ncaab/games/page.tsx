import Link from 'next/link';
import { Suspense } from 'react';
import {
  fetchNcaaBaseballScoreboard,
  type ScoreboardResponse,
} from '../../../../lib/baseball/scoreboard';
import { ScoreboardClient } from './scoreboard-client';

const plannerLinks = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/standings', label: 'Check Standings' },
  { href: '/baseball/ncaab/news', label: 'Latest Briefings' },
];

export const revalidate = 30;

export default async function BaseballGamesPage() {
  const scoreboardPromise = fetchNcaaBaseballScoreboard();

  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Games</span>
        <h1 className="di-page-title">Live Games &amp; Scoreboard</h1>
        <p className="di-page-subtitle">
          Real-time college baseball intelligence with Highlightly/ESPN feeds, automated regression, and mobile-first cards.
          Expect inning-level context, leverage thresholds, and postseason odds without leaving your phone.
        </p>
      </section>

      <Suspense fallback={<ScoreboardSkeleton />}>
        <ScoreboardSection scoreboardPromise={scoreboardPromise} />
      </Suspense>

      <nav className="di-section">
        <h2 className="di-section-title">Navigate</h2>
        <ul className="di-list di-link-list">
          {plannerLinks.map((item) => (
            <li key={item.href}>
              <Link className="di-inline-link" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}

async function ScoreboardSection({
  scoreboardPromise,
}: {
  scoreboardPromise: Promise<ScoreboardResponse>;
}) {
  try {
    const scoreboard = await scoreboardPromise;
    if (scoreboard.games.length === 0) {
      return <EmptyState fetchedAt={scoreboard.fetchedAt} />;
    }

    return <ScoreboardClient initialData={scoreboard} />;
  } catch (error) {
    return (
      <ErrorState
        message="We couldn’t reach the live scoreboard feed."
        detail={error instanceof Error ? error.message : 'Unknown error'}
      />
    );
  }
}

function ScoreboardSkeleton() {
  return (
    <section className="di-section">
      <div className="di-card-grid di-scoreboard-grid">
        {Array.from({ length: 2 }).map((_, index) => (
          <article className="di-card di-game-card" key={`skeleton-${index}`} aria-hidden>
            <div className="di-skeleton di-skeleton--badge" />
            <div className="di-skeleton di-skeleton--title" />
            <div className="di-skeleton di-skeleton--row" />
            <div className="di-skeleton di-skeleton--row" />
            <div className="di-skeleton di-skeleton--meta" />
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ fetchedAt }: { fetchedAt: string }) {
  return (
    <section className="di-section">
      <article className="di-card di-game-card" role="status">
        <header className="di-game-card__header">
          <span className="di-pill">No Live Games</span>
          <h2>Scoreboard idle</h2>
        </header>
        <p className="di-game-card__body">
          The Highlightly feed isn’t reporting any active NCAA baseball matchups right now. Check back soon or review recaps from the hub.
        </p>
        <footer className="di-game-card__footer">
          Last sync: {formatTimestamp(fetchedAt)}
        </footer>
      </article>
    </section>
  );
}

function ErrorState({ message, detail }: { message: string; detail: string }) {
  return (
    <section className="di-section" aria-live="assertive">
      <article className="di-card di-game-card di-game-card--error">
        <header className="di-game-card__header">
          <span className="di-pill di-pill--alert">Live feed interruption</span>
          <h2>{message}</h2>
        </header>
        <p className="di-game-card__body">
          Standard over vibes: we logged the miss and will retry automatically. Manual refresh or our API health board can confirm restoration.
        </p>
        <p className="di-game-card__error-detail">{detail}</p>
      </article>
    </section>
  );
}

function formatTimestamp(value: string) {
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
