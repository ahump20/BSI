import Link from 'next/link';

const actions = [
  { href: '/baseball/ncaab/players', label: 'Review Player Intel' },
  { href: '/baseball/ncaab/conferences', label: 'Compare Conferences' },
  { href: '/account/settings', label: 'Configure Alerts' }
];

export default function BaseballTeamsPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Programs</span>
        <h1 className="di-page-title">Team Dashboards</h1>
        <p className="di-page-subtitle">
          Program detail views will live here: roster matrices, bullpen usage charts, recruiting velocity, and portal notes.
          Use the quick actions below while the dataset hydrates.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>What&apos;s Coming</h2>
            <p>Expect sortable tables, recent form charts, and Diamond Pro scouting packs.</p>
            <ul className="di-list">
              <li>Split leaderboards by conference, last 10, and road/home.</li>
              <li>Spray chart heatmaps rendered with mobile pinch-zoom.</li>
              <li>Automated opponent prep packets delivered nightly.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Continue Building</h2>
            <p>Jump into adjacent workflows.</p>
            <ul className="di-list">
              {actions.map((action) => (
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
