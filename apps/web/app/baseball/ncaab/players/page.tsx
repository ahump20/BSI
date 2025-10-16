import Link from 'next/link';

const quickRoutes = [
  { href: '/auth/sign-in', label: 'Sign in for Diamond Pro scouting reports' },
  { href: '/baseball/ncaab/news', label: 'Read latest player movement notes' },
  { href: '/baseball/ncaab/rankings', label: 'Check Draft Boards & Rankings' }
];

export default function BaseballPlayersPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Player Intel</span>
        <h1 className="di-page-title">Player Profiles</h1>
        <p className="di-page-subtitle">
          Our player knowledge graph—linking pitch characteristics, biomechanics, and recruiting momentum—is loading soon. The
          interface below stands in so routing, theming, and accessibility remain stable during data hookups.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Pipeline</h2>
            <p>Expect pitch mix visuals, health monitors, and NIL valuations with audit trails.</p>
            <ul className="di-list">
              <li>Unified datasets from TrackMan, Synergy, and school feeds.</li>
              <li>Progressive release schedule with freshness badges.</li>
              <li>Diamond Pro tagging for private board collaboration.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Quick Links</h2>
            <p>Keep momentum while the feeds finalize.</p>
            <ul className="di-list">
              {quickRoutes.map((route) => (
                <li key={route.href}>
                  <Link className="di-inline-link" href={route.href}>
                    {route.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
