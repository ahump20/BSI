export function GamesSkeleton() {
  return (
    <main className="di-page di-game-page" aria-busy="true">
      <section className="di-section di-game-section">
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
    </main>
  );
}
