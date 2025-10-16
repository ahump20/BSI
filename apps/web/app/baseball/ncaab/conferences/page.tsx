import Link from 'next/link';

const conferenceFlows = [
  { href: '/baseball/ncaab/standings', label: 'View Standings' },
  { href: '/baseball/ncaab/rankings', label: 'Analyze Rankings' },
  { href: '/baseball/ncaab/news', label: 'Conference Briefings' }
];

export default function BaseballConferencesPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Conference Pulse</span>
        <h1 className="di-page-title">Conference Intelligence</h1>
        <p className="di-page-subtitle">
          SEC, ACC, Big 12, Sun Belt, and every league will receive parity coverage with tempo, offensive profile, and travel
          strain metrics. This placeholder keeps information architecture wired into production while dashboards are staged.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Planned Modules</h2>
            <p>Future widgets will display tournament résumés, bubble ratings, and historical matchup context.</p>
            <ul className="di-list">
              <li>Automatic NCAA résumé tracker with quad breakdowns.</li>
              <li>Conference power score built on run differential and schedule hardness.</li>
              <li>Travel analytics for coaches and operations leads.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Next Steps</h2>
            <p>Select another live surface.</p>
            <ul className="di-list">
              {conferenceFlows.map((flow) => (
                <li key={flow.href}>
                  <Link className="di-inline-link" href={flow.href}>
                    {flow.label}
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
