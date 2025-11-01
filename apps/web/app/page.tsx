import Link from 'next/link';
import { recordRuntimeEvent } from '../lib/observability/datadog-runtime';

const navigationLinks = [
  {
    href: '/3d-viz',
    title: '⚡ 3D Visualization Engine',
    description: 'NEW: Stadium-quality WebGPU graphics with ray tracing, volumetric lighting, and real-time analytics.',
    featured: true
  },
  {
    href: '/baseball/ncaab/hub',
    title: 'College Baseball Hub',
    description: 'Centralize live games, scouting intel, and portal updates in one command center.'
  },
  {
    href: '/baseball/overlays/pitch-tunnel',
    title: '⚾ Pitch Tunnel 3D',
    description: 'NEW: Interactive 3D pitch trajectories with velocity analysis and strike zone overlay.',
    featured: true
  },
  {
    href: '/command-center',
    title: '🎯 Multi-Sport Command Center',
    description: 'NEW: Real-time Cardinals/Titans/Grizzlies/Longhorns tracking with 3D performance spheres.',
    featured: true
  },
  {
    href: '/baseball/ncaab/games',
    title: 'Live Games',
    description: 'Mobile-first scoreboard with leverage alerts and inning-by-inning context.'
  },
  {
    href: '/baseball/sabermetrics',
    title: '📊 Advanced Sabermetrics',
    description: 'NEW: 5 visualization modes for all 30 MLB teams with live stats and trajectory forecasting.',
    featured: true
  },
  {
    href: '/baseball/ncaab/teams',
    title: 'Programs',
    description: 'Deep dives on SEC, ACC, Big 12, and national programs with advanced splits.'
  },
  {
    href: '/baseball/ncaab/players',
    title: 'Player Intel',
    description: 'Biomechanics, velocity trends, and recruiting signals tied to every roster.'
  },
  {
    href: '/baseball/ncaab/standings',
    title: 'Standings',
    description: 'Real-time RPI, ISR, and bid probability dashboards for Selection Monday readiness.'
  },
  {
    href: '/baseball/ncaab/rankings',
    title: 'Rankings',
    description: 'Data-backed Diamond Index and curated polls with movement tracking.'
  },
  {
    href: '/baseball/ncaab/news',
    title: 'Newsroom',
    description: 'Verified recaps, portal updates, and strategic briefings for staffs and fans.'
  }
];

const featureHighlights = [
  {
    title: '3D WebGPU Visualization Engine',
    body: 'Stadium-quality graphics with ray tracing, SSAO, and volumetric lighting. Nobody else visualizes sports stats in true 3D with hardware acceleration.',
    icon: '⚡',
    isNew: true
  },
  {
    title: 'Live Diamond Engine',
    body: 'Edge-ready ingestion keeps live games, standings, and recruiting intel refreshed with sub-minute latency.'
  },
  {
    title: 'Mobile-First Craftsmanship',
    body: 'Thumb-first navigation, high-contrast typography, and performant theming tuned for late-night scoreboard checks.'
  },
  {
    title: 'Real-Time Multi-Sport Command Center',
    body: 'Track Cardinals, Titans, Grizzlies, and Longhorns with 3D performance spheres, momentum rings, and auto-refresh every 5 minutes.',
    icon: '🎯',
    isNew: true
  }
];

export default function HomePage() {
  void recordRuntimeEvent('route_render', { route: '/', sport: 'baseball' });

  return (
    <div className="di-shell">
      <main className="di-container">
        {/* New Feature Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          <div style={{ flex: '1 1 auto' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '8px'
            }}>
              ⚡ NEW
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              3D WebGPU Visualization Engine Now Live
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Experience stadium-quality graphics with ray tracing, volumetric lighting, and real-time analytics. Nobody else does this.
            </p>
          </div>
          <Link
            className="di-action"
            href="/3d-viz"
            style={{
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
            }}
          >
            Explore 3D Visualizations →
          </Link>
        </div>

        <section className="di-hero" aria-labelledby="diamond-insights-hero">
          <span className="di-pill">Diamond Insights</span>
          <h1 id="diamond-insights-hero" className="di-title">
            College Baseball Intelligence for the Deep South
          </h1>
          <p className="di-subtitle">
            BlazeSportsIntel is pivoting into the definitive NCAA Division I baseball platform—live telemetry, scouting intel,
            and recruiting context built mobile-first and dark-mode native.
          </p>
          <div className="di-actions">
            <Link className="di-action" href="/baseball/ncaab/hub">
              Enter the Baseball Hub
            </Link>
            <Link className="di-action di-action--secondary" href="/auth/sign-up">
              Join Diamond Pro Beta
            </Link>
          </div>
        </section>

        <nav className="di-nav" aria-labelledby="diamond-insights-navigation">
          <div className="di-nav-heading">
            <h2 id="diamond-insights-navigation" className="di-page-title">
              Navigate the College Baseball Stack
            </h2>
            <p className="di-page-subtitle">
              Every route is mobile-optimized and ready for data hookups—start in the hub or jump straight to live surfaces.
            </p>
          </div>
          <ul className="di-nav-list">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className={`di-nav-card ${link.featured ? 'featured-card' : ''}`}
                  href={link.href}
                  style={link.featured ? {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)'
                  } : {}}
                >
                  <span>{link.title}</span>
                  <p>{link.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="di-section" aria-labelledby="diamond-insights-highlights">
          <h2 id="diamond-insights-highlights" className="di-page-title">
            Diamond Insights Operating Principles
          </h2>
          <div className="di-card-grid">
            {featureHighlights.map((feature) => (
              <article key={feature.title} className="di-card" style={feature.isNew ? {
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
                borderColor: 'rgba(34, 197, 94, 0.3)'
              } : {}}>
                {feature.isNew && (
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
                <h3>{feature.icon && <span style={{ marginRight: '8px' }}>{feature.icon}</span>}{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="di-section" aria-labelledby="diamond-insights-status">
          <h2 id="diamond-insights-status" className="di-page-title">
            Platform Status
          </h2>
          <div className="di-card-grid">
            <article className="di-card">
              <h3>Foundation Build</h3>
              <p>
                Phase 2 (MVP) scaffolding is underway. Routing is locked, theming is stabilized, and data ingestion hooks are
                staged for Highlightly, TrackMan, and NCAA stat endpoints.
              </p>
              <p className="di-microcopy">Updated: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </article>
            <article className="di-card">
              <h3>Need Early Access?</h3>
              <p>Reach out for Diamond Pro onboarding or operations partnerships across the Deep South footprint.</p>
              <Link className="di-inline-link" href="/account">
                Manage your Diamond Insights profile
              </Link>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
