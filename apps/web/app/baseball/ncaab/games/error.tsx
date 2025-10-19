'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GamesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Games route failed', error);
  }, [error]);

  return (
    <main className="di-page di-game-page">
      <section className="di-section di-game-section di-game-section--error">
        <header className="di-game-section__header">
          <span className="di-kicker">Diamond Insights · D1 Baseball</span>
          <h1 className="di-page-title">Scoreboard currently unavailable</h1>
          <p className="di-page-subtitle">
            We hit a snag pulling Highlightly data. Retry in a moment or check the conference hubs.
          </p>
        </header>
        <div className="di-game-error">
          <code>{error.digest ?? error.message}</code>
          <button type="button" className="di-game-card__tab" onClick={reset}>
            Retry fetch
          </button>
        </div>
      </section>
    </main>
  );
}
