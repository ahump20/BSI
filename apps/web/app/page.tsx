import Link from 'next/link';
import { recordRuntimeEvent } from '../lib/observability/datadog-runtime';
import { QuickSearchBanner } from './QuickSearchBanner';

const productTiles = [
  {
    href: '/features',
    title: 'Features',
    description: 'Championship analytics platform features and pricing',
    badge: 'Platform',
    source: 'Real-time data + Monte Carlo simulations'
  },
  {
    href: '/command-center',
    title: 'Command Center',
    description: 'Multi-sport dashboards and live data',
    badge: 'Live',
    source: 'Updated every 30 seconds'
  },
  {
    href: '/CFP',
    title: 'CFP Intelligence',
    description: 'College Football Playoff scenario simulator',
    badge: 'Football',
    source: '10,000 Monte Carlo simulations'
  },
  {
    href: '/baseball/ncaab/hub',
    title: 'College Baseball Hub',
    description: 'Live games, scouting intel, and rankings',
    badge: 'Baseball',
    source: 'NCAA.com + TrackMan data'
  },
  {
    href: '/baseball/mlb',
    title: 'MLB Analytics',
    description: 'Statcast metrics and sabermetrics',
    badge: 'Baseball',
    source: 'Statcast + FanGraphs'
  },
  {
    href: '/historical-comparisons',
    title: 'Historical Data',
    description: '212 real games across multiple seasons',
    badge: 'Research',
    source: 'Verified historical archive'
  },
  {
    href: '/copilot',
    title: 'AI Copilot',
    description: 'Ask questions, get sourced answers',
    badge: 'AI',
    source: 'Gemini, GPT-5, Claude'
  },
  {
    href: '/lei',
    title: 'Leverage & Intensity',
    description: 'Clutch performance analytics',
    badge: 'Advanced',
    source: 'Whoop + game telemetry'
  }
];

const featureHighlights = [
  {
    title: 'Real Data. Faster Decisions.',
    body: 'Monte Carlo simulations, live game telemetry, and verified historical archives—all sourced and timestamped for transparency.'
  },
  {
    title: 'Mobile-First Championship Platform',
    body: 'Thumb-optimized navigation, high-contrast dark mode, and sub-2.5s page loads across all devices.'
  },
  {
    title: 'AI-Powered Intelligence',
    body: 'Ask questions in natural language. Get answers backed by real data with full source attribution and provider choice.'
  }
];

const sportsHubs = [
  {
    href: '/baseball',
    title: 'Baseball',
    icon: '⚾',
    coverage: 'MLB + NCAA Division I'
  },
  {
    href: '/football',
    title: 'Football',
    icon: '🏈',
    coverage: 'NFL + College Football Playoff'
  },
  {
    href: '/basketball',
    title: 'Basketball',
    icon: '🏀',
    coverage: 'NBA + NCAA (Coming Soon)'
  }
];

export default function HomePage() {
  void recordRuntimeEvent('route_render', { route: '/', sport: 'multi' });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Blaze Sports Intel',
            url: 'https://blazesportsintel.com',
            logo: 'https://blazesportsintel.com/images/logo.png',
            description: 'Championship analytics platform for baseball, football, and basketball with real-time data, AI copilot, and historical research.',
            sameAs: []
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Blaze Sports Intel',
            url: 'https://blazesportsintel.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://blazesportsintel.com/copilot?q={search_term_string}'
              },
              'query-input': 'required name=search_term_string'
            }
          })
        }}
      />
      <div className="di-shell">
        <main id="main-content" className="di-container">
          <QuickSearchBanner />

          <section className="di-hero" aria-labelledby="hero-title">
            <span className="di-pill live-indicator">Championship Analytics Platform</span>
            <h1 id="hero-title" className="di-title animated-gradient-text">
              Blaze Sports Intel
            </h1>
            <p className="di-subtitle">
              Real data. Faster decisions. Championship analytics for baseball, football, and basketball with live telemetry, AI copilot, and verified historical archives.
            </p>
            <div className="di-actions">
              <Link className="di-action scale-interaction glow-hover" href="/features">
                View Analytics
              </Link>
              <Link className="di-action di-action--secondary scale-interaction" href="/copilot">
                Launch Copilot
              </Link>
            </div>
            <p className="di-microcopy" style={{ marginTop: '0.5rem' }}>
              <Link href="/data-transparency" className="di-inline-link" style={{ fontSize: '0.75rem' }}>
                212 real games • Full data transparency
              </Link>
              <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>•</span>
              <kbd style={{
                padding: '0.15rem 0.4rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontFamily: 'inherit'
              }}>?</kbd>
              <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem', opacity: 0.7 }}>for shortcuts</span>
            </p>
          </section>

          <section className="di-section" aria-labelledby="sports-navigation">
            <h2 id="sports-navigation" className="di-page-title">
              Coverage by Sport
            </h2>
            <div className="di-card-grid stagger-animate">
              {sportsHubs.map((sport) => (
                <Link key={sport.href} className="di-nav-card scale-interaction glass-light" href={sport.href}>
                  <span style={{ fontSize: '2rem' }} className="float-animation">{sport.icon}</span>
                  <span>{sport.title}</span>
                  <p>{sport.coverage}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="di-section" aria-labelledby="products-navigation">
            <div className="di-nav-heading">
              <h2 id="products-navigation" className="di-page-title">
                Platform Products
              </h2>
              <p className="di-page-subtitle">
                Live dashboards, AI intelligence, and historical research—all with source transparency and real-time updates.
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              padding: '0.5rem 0',
              marginTop: '1rem'
            }}>
              {productTiles.map((tile) => (
                <Link
                  key={tile.href}
                  className="di-card scale-interaction glow-hover"
                  href={tile.href}
                  style={{
                    minWidth: '280px',
                    flex: '0 0 auto',
                    scrollSnapAlign: 'start',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease'
                  }}
                >
                  <span className="di-kicker">{tile.badge}</span>
                  <h3 style={{ fontFamily: 'var(--di-font-heading)', fontSize: '1.25rem' }}>{tile.title}</h3>
                  <p>{tile.description}</p>
                  <p className="di-microcopy" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {tile.source}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="di-section" aria-labelledby="features-highlight">
            <h2 id="features-highlight" className="di-page-title">
              Why Blaze Sports Intel
            </h2>
            <div className="di-card-grid">
              {featureHighlights.map((feature) => (
                <article key={feature.title} className="di-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="di-section" aria-labelledby="platform-status">
            <h2 id="platform-status" className="di-page-title">
              Get Started
            </h2>
            <div className="di-card-grid">
              <article className="di-card">
                <h3>Explore the Platform</h3>
                <p>
                  Free access to live dashboards, historical comparisons, and basic AI copilot queries. Upgrade for advanced features and team collaboration.
                </p>
                <Link className="di-inline-link" href="/features">
                  View pricing and features
                </Link>
              </article>
              <article className="di-card">
                <h3>Data Transparency</h3>
                <p>Every metric is sourced. Every prediction shows its methodology. View real-time data provider status and coverage maps.</p>
                <Link className="di-inline-link" href="/data-transparency">
                  Explore data sources
                </Link>
              </article>
              <article className="di-card">
                <h3>Need Help?</h3>
                <p>Questions about the platform, API access, or team subscriptions? Reach out to discuss your use case.</p>
                <Link className="di-inline-link" href="/contact">
                  Get in touch
                </Link>
              </article>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
