import Link from 'next/link';

const navTargets = [
  { href: '/baseball/ncaab/rankings', label: 'Power Ratings' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/hub', label: 'Hub Overview' }
];

export default function BaseballStandingsPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Standings</span>
        <h1 className="di-page-title">Standings & Form Tracker</h1>
        <p className="di-page-subtitle">
          Standings tables, rolling expected wins, and postseason projections will render here. For now, this placeholder keeps
          navigation intact and signals the dark-mode design language heading toward launch.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Coming Soon</h2>
            <p>Full-table visualizations with swipeable filters and conference toggles.</p>
            <ul className="di-list">
              <li>Auto-refreshing RPI, ISR, and KPI comparisons.</li>
              <li>Form tracker for last 10 games with sparkline trends.</li>
              <li>Bid probability modeling for Selection Monday scenarios.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Navigate</h2>
            <p>Move to another page while we pipe in the data.</p>
            <ul className="di-list">
              {navTargets.map((target) => (
                <li key={target.href}>
                  <Link className="di-inline-link" href={target.href}>
                    {target.label}
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
