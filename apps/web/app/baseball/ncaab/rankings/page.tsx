import Link from 'next/link';

const quickActions = [
  { href: '/auth/sign-up', label: 'Upgrade to Diamond Pro' },
  { href: '/baseball/ncaab/news', label: 'Read Analysis Briefs' },
  { href: '/baseball/ncaab/standings', label: 'Review Standings' }
];

export default function BaseballRankingsPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Rankings</span>
        <h1 className="di-page-title">Diamond Index & Polls</h1>
        <p className="di-page-subtitle">
          Our blended power rating, featuring Diamond Index, RPI, and human composite polls, will populate this view. The
          placeholder maintains UX continuity and dark theme while we finalize ranking algorithms.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>On Deck</h2>
            <p>Expect sortable poll cards, résumé snippets, and movement indicators.</p>
            <ul className="di-list">
              <li>Delta badges showing week-over-week shifts.</li>
              <li>Strength-of-schedule overlays and predictive tiers.</li>
              <li>Top 25 focus with quick filters for Freshman Impact, Pitching, and Offense.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Quick Actions</h2>
            <p>Stay productive while data sync finishes.</p>
            <ul className="di-list">
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link className="di-inline-link" href={action.href}>
                    {action.label}
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
