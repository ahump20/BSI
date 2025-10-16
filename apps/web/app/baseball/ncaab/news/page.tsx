import Link from 'next/link';

const navigation = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/players', label: 'Player Intel' }
];

export default function BaseballNewsPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Briefings</span>
        <h1 className="di-page-title">Newsroom & Portal Tracker</h1>
        <p className="di-page-subtitle">
          The editorial desk is preparing live game capsules, transfer portal updates, and recruiting intel. Until feeds go
          live, this placeholder keeps navigation warm and communicates what to expect from the newsroom cadence.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Editorial Roadmap</h2>
            <p>Expect automated recaps with human verification and curated storylines per market.</p>
            <ul className="di-list">
              <li>Instant recaps sourced from verified game data.</li>
              <li>Portal tracker with commitment verification workflows.</li>
              <li>Diamond Pro premium briefs for operations staffs.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Navigate</h2>
            <p>Access adjacent areas while coverage spins up.</p>
            <ul className="di-list">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link className="di-inline-link" href={item.href}>
                    {item.label}
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
