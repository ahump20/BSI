import Link from 'next/link';

const navigationLinks = [
  {
    href: '/baseball/ncaab/hub',
    title: 'College Baseball Hub',
    description: 'Centralize live games, scouting intel, and portal updates in one command center.'
  },
  {
    href: '/baseball/ncaab/games',
    title: 'Live Games',
    description: 'Mobile-first scoreboard with leverage alerts and inning-by-inning context.'
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
    title: 'Live Diamond Engine',
    body: 'Edge-ready ingestion keeps live games, standings, and recruiting intel refreshed with sub-minute latency.'
  },
  {
    title: 'Mobile-First Craftsmanship',
    body: 'Thumb-first navigation, high-contrast typography, and performant theming tuned for late-night scoreboard checks.'
  },
  {
    title: 'Diamond Pro Workflow',
    body: 'Subscription tier powering staff collaboration, scouting packet exports, and alert routing built for the Deep South.'
  }
];

export default function HomePage() {
  return (
    <div className="di-shell">
      <main className="di-container">
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
                <Link className="di-nav-card" href={link.href}>
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
              <article key={feature.title} className="di-card">
                <h3>{feature.title}</h3>
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
