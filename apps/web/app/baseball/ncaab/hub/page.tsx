import Link from 'next/link';
import '../../../../styles/advanced-effects.css';

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
      <section className="di-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-blue-600/5 to-purple-600/5 animated-gradient" style={{ opacity: 0.3 }} />
        <span className="di-kicker pulse-ring" style={{
          background: 'linear-gradient(135deg, rgba(191, 87, 0, 0.2), rgba(255, 125, 60, 0.3))',
          border: '1px solid rgba(191, 87, 0, 0.4)',
        }}>Diamond Insights · NCAA Division I Baseball</span>
        <h1 className="di-page-title neon-text" style={{ position: 'relative', zIndex: 1 }}>
          College Baseball <span className="gradient-text">Command Center</span>
        </h1>
        <p className="di-page-subtitle" style={{ position: 'relative', zIndex: 1 }}>
          Your single landing zone for <span className="gradient-text" style={{ fontWeight: 600 }}>live game telemetry</span>, advanced scouting intel, and conference health across the
          national landscape. Final visuals and data hooks are en route; this shell keeps navigation live while we finish
          the ingest plumbing.
        </p>

        {/* Featured 3D Visualizations */}
        <div className="glass-dark hover-lift smooth-all" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animated-gradient" style={{ opacity: 0.4 }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '28px',
            position: 'relative',
            zIndex: 1
          }}>
            <span style={{
              fontSize: '40px',
              filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))'
            }}>⚡</span>
            <div>
              <h2 className="neon-text" style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                NEW: 3D Visualization Engine
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Experience baseball analytics in <span className="gradient-text" style={{ fontWeight: 600 }}>stadium-quality 3D</span> with WebGPU ray tracing
              </p>
            </div>
          </div>
          <div className="di-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', position: 'relative', zIndex: 1 }}>
            {featuredVisualizations.map((viz) => (
              <article key={viz.href} className="di-card glass-dark hover-lift smooth-all" style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)'
              }}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 animated-gradient" style={{ opacity: 0.5 }} />
                {viz.isNew && (
                  <span className="pulse-ring" style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.35))',
                    border: '1px solid rgba(34, 197, 94, 0.5)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#10b981',
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    NEW
                  </span>
                )}
                <h2 style={{ position: 'relative', zIndex: 1 }}><span className="gradient-text">{viz.label}</span></h2>
                <p style={{ position: 'relative', zIndex: 1 }}>{viz.summary}</p>
                <Link className="di-inline-link hover-lift" href={viz.href} style={{
                  color: '#3b82f6',
                  fontWeight: '700',
                  position: 'relative',
                  zIndex: 1,
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                  borderRadius: '8px'
                }}>
                  Launch Visualization →
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Regular Sections */}
        <h2 className="di-page-title neon-text" style={{ fontSize: '24px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          Baseball Intelligence <span className="gradient-text">Hub</span>
        </h2>
        <div className="di-card-grid">
          {sections.map((section) => (
            <article key={section.href} className="di-card glass hover-lift smooth-all" style={{
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-blue-600/5" style={{ opacity: 0.6 }} />
              <h2 style={{ position: 'relative', zIndex: 1 }}><span className="gradient-text">{section.label}</span></h2>
              <p style={{ position: 'relative', zIndex: 1 }}>{section.summary}</p>
              <Link className="di-inline-link hover-lift" href={section.href} style={{
                position: 'relative',
                zIndex: 1,
                display: 'inline-block',
                marginTop: '8px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, rgba(191, 87, 0, 0.2), rgba(255, 125, 60, 0.2))',
                borderRadius: '8px'
              }}>
                Enter {section.label} →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
