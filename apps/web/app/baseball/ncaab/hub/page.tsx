import Link from 'next/link';

const sections = [
  { href: '/baseball/ncaab/games', label: 'Scoreboard & Live Games', summary: 'Track real-time scores, win probability, and inning-by-inning context.' },
  { href: '/baseball/ncaab/teams', label: 'Programs & Scouting', summary: 'Browse SEC, ACC, Big 12, and national profiles with rolling efficiency metrics.' },
  { href: '/baseball/ncaab/players', label: 'Player Intelligence', summary: 'Monitor player trends, pitch data, and recruiting signals as rosters evolve.' },
  { href: '/baseball/ncaab/conferences', label: 'Conference Pulse', summary: 'Assess power rankings, standings, and RPI movement by league.' },
  { href: '/baseball/ncaab/standings', label: 'Standings & Splits', summary: 'Compare division races, streaks, and form ahead of Selection Monday.' },
  { href: '/baseball/ncaab/rankings', label: 'Diamond Index', summary: 'Dive into data-backed polls, KPIs, and momentum indicators.' },
  { href: '/baseball/ncaab/news', label: 'News & Briefings', summary: 'Stay informed on transfers, injuries, and portal commitments.' },
  { href: '/account', label: 'Manage Account', summary: 'Adjust notifications, Diamond Pro access, and personalization.' }
];

export default function BaseballHubPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · NCAA Division I Baseball</span>
        <h1 className="di-page-title">College Baseball Command Center</h1>
        <p className="di-page-subtitle">
          Your single landing zone for live game telemetry, advanced scouting intel, and conference health across the
          national landscape. Final visuals and data hooks are en route; this shell keeps navigation live while we finish
          the ingest plumbing.
        </p>
        <div className="di-card-grid">
          {sections.map((section) => (
            <article key={section.href} className="di-card">
              <h2>{section.label}</h2>
              <p>{section.summary}</p>
              <Link className="di-inline-link" href={section.href}>
                Enter {section.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
