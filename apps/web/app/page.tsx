import Link from 'next/link';
import { recordRuntimeEvent } from '../lib/observability/datadog-runtime';
import '../styles/advanced-effects.css';

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
        <div className="glass-dark hover-lift card-hover smooth-all" style={{
          borderRadius: '24px',
          padding: '24px 32px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animated-gradient" style={{ opacity: 0.3 }} />
          <div style={{ flex: '1 1 auto', position: 'relative', zIndex: 1 }}>
            <div className="pulse-ring" style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.3))',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '12px',
              letterSpacing: '0.05em'
            }}>
              ⚡ NEW FEATURE
            </div>
            <h3 className="neon-text" style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              3D WebGPU Visualization Engine
            </h3>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
              Experience <span className="gradient-text" style={{ fontWeight: '600' }}>stadium-quality graphics</span> with ray tracing, volumetric lighting, and real-time analytics.
              <br />
              <span style={{ color: '#60a5fa' }}>Nobody else visualizes sports like this.</span>
            </p>
          </div>
          <Link
            className="di-action hover-lift"
            href="/3d-viz"
            style={{
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
              padding: '14px 28px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '16px',
              position: 'relative',
              zIndex: 1,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <span className="flex items-center gap-2">
              Explore 3D Visualizations
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
        </div>

        <section className="di-hero" aria-labelledby="diamond-insights-hero" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-blue-600/5 to-purple-600/5 animated-gradient" style={{ opacity: 0.4 }} />
          <span className="di-pill pulse-ring" style={{
            background: 'linear-gradient(135deg, rgba(191, 87, 0, 0.2), rgba(255, 125, 60, 0.3))',
            border: '1px solid rgba(191, 87, 0, 0.4)',
          }}>Diamond Insights</span>
          <h1 id="diamond-insights-hero" className="di-title neon-text" style={{ position: 'relative', zIndex: 1 }}>
            College Baseball Intelligence for the <span className="gradient-text">Deep South</span>
          </h1>
          <p className="di-subtitle" style={{ position: 'relative', zIndex: 1 }}>
            BlazeSportsIntel is pivoting into the definitive NCAA Division I baseball platform—<span className="gradient-text" style={{ fontWeight: 600 }}>live telemetry</span>, scouting intel,
            and recruiting context built mobile-first and dark-mode native.
          </p>
          <div className="di-actions" style={{ position: 'relative', zIndex: 1 }}>
            <Link className="di-action hover-lift" href="/baseball/ncaab/hub" style={{
              background: 'linear-gradient(135deg, #BF5700, #FF7D3C)',
              boxShadow: '0 8px 32px rgba(191, 87, 0, 0.3)',
            }}>
              Enter the Baseball Hub
            </Link>
            <Link className="di-action di-action--secondary hover-lift" href="/auth/sign-up" style={{
              borderColor: 'rgba(59, 130, 246, 0.3)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)',
            }}>
              Join Diamond Pro Beta
            </Link>
          </div>
        </section>

        <nav className="di-nav" aria-labelledby="diamond-insights-navigation">
          <div className="di-nav-heading">
            <h2 id="diamond-insights-navigation" className="di-page-title neon-text">
              Navigate the College Baseball <span className="gradient-text">Stack</span>
            </h2>
            <p className="di-page-subtitle">
              Every route is mobile-optimized and ready for data hookups—start in the hub or jump straight to <span className="gradient-text" style={{ fontWeight: 600 }}>live surfaces</span>.
            </p>
          </div>
          <ul className="di-nav-list">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className={`di-nav-card hover-lift smooth-all ${link.featured ? 'featured-card glass-dark' : 'glass'}`}
                  href={link.href}
                  style={link.featured ? {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
                    borderColor: 'rgba(59, 130, 246, 0.4)',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                  } : {
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {link.featured && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/5 animated-gradient" style={{ opacity: 0.6 }} />
                      <div className="absolute top-3 right-3 pulse-ring" style={{
                        padding: '4px 10px',
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.35))',
                        border: '1px solid rgba(34, 197, 94, 0.5)',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#10b981',
                        letterSpacing: '0.05em'
                      }}>
                        NEW
                      </div>
                    </>
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{link.title}</span>
                  <p style={{ position: 'relative', zIndex: 1 }}>{link.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="di-section" aria-labelledby="diamond-insights-highlights">
          <h2 id="diamond-insights-highlights" className="di-page-title neon-text">
            Diamond Insights <span className="gradient-text">Operating Principles</span>
          </h2>
          <div className="di-card-grid">
            {featureHighlights.map((feature) => (
              <article
                key={feature.title}
                className={`di-card hover-lift smooth-all ${feature.isNew ? 'glass-dark' : 'glass'}`}
                style={feature.isNew ? {
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))',
                  borderColor: 'rgba(34, 197, 94, 0.4)',
                  boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                } : {
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {feature.isNew && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-blue-600/10 to-emerald-600/5 animated-gradient" style={{ opacity: 0.5 }} />
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
                  </>
                )}
                <h3 style={{ position: 'relative', zIndex: 1 }}>
                  {feature.icon && <span style={{ marginRight: '8px' }}>{feature.icon}</span>}
                  <span className={feature.isNew ? 'gradient-text' : ''}>{feature.title}</span>
                </h3>
                <p style={{ position: 'relative', zIndex: 1 }}>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="di-section" aria-labelledby="diamond-insights-status">
          <h2 id="diamond-insights-status" className="di-page-title neon-text">
            Platform <span className="gradient-text">Status</span>
          </h2>
          <div className="di-card-grid">
            <article className="di-card glass hover-lift smooth-all" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" style={{ opacity: 0.6 }} />
              <h3 style={{ position: 'relative', zIndex: 1 }}>
                <span className="gradient-text">Foundation Build</span>
              </h3>
              <p style={{ position: 'relative', zIndex: 1 }}>
                Phase 2 (MVP) scaffolding is underway. Routing is locked, theming is stabilized, and data ingestion hooks are
                staged for <span className="gradient-text" style={{ fontWeight: 600 }}>Highlightly, TrackMan, and NCAA</span> stat endpoints.
              </p>
              <p className="di-microcopy" style={{ position: 'relative', zIndex: 1 }}>Updated: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </article>
            <article className="di-card glass hover-lift smooth-all" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-pink-600/5" style={{ opacity: 0.6 }} />
              <h3 style={{ position: 'relative', zIndex: 1 }}>
                <span className="gradient-text">Need Early Access?</span>
              </h3>
              <p style={{ position: 'relative', zIndex: 1 }}>Reach out for Diamond Pro onboarding or operations partnerships across the Deep South footprint.</p>
              <Link className="di-inline-link hover-lift" href="/account" style={{
                position: 'relative',
                zIndex: 1,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'inline-block',
                marginTop: '8px'
              }}>
                Manage your Diamond Insights profile →
              </Link>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
