import Link from 'next/link';

const featuredVisualizations = [
  {
    href: '/baseball/overlays/pitch-tunnel',
    label: '⚾ 3D Pitch Tunnel',
    summary: 'NEW: Stadium-quality WebGPU visualization of pitch trajectories with velocity analysis and strike zone overlay.',
    isNew: true,
    icon: '⚡'
  },
  {
    href: '/baseball/sabermetrics',
    label: '📊 Advanced Sabermetrics',
    summary: 'NEW: 5 visualization modes for all 30 MLB teams with live stats, trajectory forecasting, and team comparison.',
    isNew: true,
    icon: '⚡'
  }
];

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

        {/* Featured 3D Visualizations */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <span style={{
              fontSize: '32px'
            }}>⚡</span>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                NEW: 3D Visualization Engine
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Experience baseball analytics in stadium-quality 3D with WebGPU ray tracing
              </p>
            </div>
          </div>
          <div className="di-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {featuredVisualizations.map((viz) => (
              <article key={viz.href} className="di-card" style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderColor: 'rgba(59, 130, 246, 0.4)'
              }}>
                {viz.isNew && (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#10b981',
                    marginBottom: '12px'
                  }}>
                    NEW
                  </span>
                )}
                <h2>{viz.label}</h2>
                <p>{viz.summary}</p>
                <Link className="di-inline-link" href={viz.href} style={{
                  color: '#3b82f6',
                  fontWeight: '600'
                }}>
                  Launch Visualization →
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Regular Sections */}
        <h2 className="di-page-title" style={{ fontSize: '20px', marginBottom: '16px' }}>
          Baseball Intelligence Hub
        </h2>
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
