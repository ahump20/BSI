import { Suspense } from 'react';
import { buildFallbackGamesPayload, getD1BaseballGames } from '@/lib/baseball/games';
import { GameCard } from './GameCard';

async function loadGames() {
  try {
    const response = await getD1BaseballGames();
    if (response.games.length === 0) {
      return buildFallbackGamesPayload();
    }
    return response;
  } catch (error) {
    console.error('Failed to fetch games for scoreboard', error);
    return buildFallbackGamesPayload();
  }
}

async function GamesSection() {
  const data = await loadGames();

  return (
    <section className="di-section di-game-section">
      <header className="di-game-section__header">
        <span className="di-kicker">Diamond Insights · D1 Baseball</span>
        <h1 className="di-page-title">Live Scoreboard & Win Pressure</h1>
        <p className="di-page-subtitle">
          Track leverage index, inning state, and Diamond Pro exclusives in one mobile-first grid. Refresh
          auto-syncs every minute.
        </p>
      </header>

      <div className="di-game-grid" role="list">
        {data.games.map((game) => (
          <GameCard
            key={game.id}
            game={{
              ...game,
              locked: game.subscriptionTier === 'diamond_pro'
            }}
          />
        ))}
      </div>
    </section>
  );
}

function GamesLoadingState() {
  return (
    <section className="di-section di-game-section" aria-busy="true">
      <header className="di-game-section__header">
        <span className="di-kicker">Diamond Insights · D1 Baseball</span>
        <h1 className="di-page-title">Live Scoreboard & Win Pressure</h1>
        <p className="di-page-subtitle">Loading live games…</p>
      </header>
      <div className="di-game-grid">
        {Array.from({ length: 3 }).map((_, idx) => (
          <article key={idx} className="di-game-card di-game-card--skeleton">
            <div className="di-game-card__skeleton-row" />
            <div className="di-game-card__skeleton-row di-game-card__skeleton-row--wide" />
            <div className="di-game-card__skeleton-grid">
              <span />
              <span />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BaseballGamesPage() {
  return (
    <main className="di-page di-game-page">
      <Suspense fallback={<GamesLoadingState />}>
        {/* @ts-expect-error Async Server Component */}
        <GamesSection />
      </Suspense>
    </main>
  );
}
