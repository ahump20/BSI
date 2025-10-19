import Link from 'next/link';
import { recordRuntimeEvent } from '../lib/observability/datadog-runtime';
import {
  card,
  cardBody,
  cardGrid,
  cardHeading,
  commandContainer,
  featureGrid,
  heroActions,
  heroPill,
  heroSection,
  heroSubtitle,
  heroTitle,
  inlineLink,
  landingShell,
  microcopy,
  navCard,
  navCardDescription,
  navCardTitle,
  navHeadingSubtitle,
  navHeadingTitle,
  navList,
  navWrapper,
  primaryAction,
  secondaryAction,
  sectionWrapper
} from '../lib/ui/styles';

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
  void recordRuntimeEvent('route_render', { route: '/', sport: 'baseball' });

  return (
    <div className={landingShell}>
      <main className={commandContainer}>
        <section className={heroSection} aria-labelledby="diamond-insights-hero">
          <span className={heroPill}>Diamond Insights</span>
          <h1 id="diamond-insights-hero" className={heroTitle}>
            College Baseball Intelligence for the Deep South
          </h1>
          <p className={heroSubtitle}>
            BlazeSportsIntel is pivoting into the definitive NCAA Division I baseball platform—live telemetry, scouting intel,
            and recruiting context built mobile-first and dark-mode native.
          </p>
          <div className={heroActions}>
            <Link className={primaryAction} href="/baseball/ncaab/hub">
              Enter the Baseball Hub
            </Link>
            <Link className={secondaryAction} href="/auth/sign-up">
              Join Diamond Pro Beta
            </Link>
          </div>
        </section>

        <nav className={sectionWrapper} aria-labelledby="diamond-insights-navigation">
          <div className={navWrapper}>
            <h2 id="diamond-insights-navigation" className={navHeadingTitle}>
              Navigate the College Baseball Stack
            </h2>
            <p className={navHeadingSubtitle}>
              Every route is mobile-optimized and ready for data hookups—start in the hub or jump straight to live surfaces.
            </p>
          </div>
          <ul className={navList}>
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link className={navCard} href={link.href}>
                  <span className={navCardTitle}>{link.title}</span>
                  <p className={navCardDescription}>{link.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className={sectionWrapper} aria-labelledby="diamond-insights-highlights">
          <h2 id="diamond-insights-highlights" className={navHeadingTitle}>
            Diamond Insights Operating Principles
          </h2>
          <div className={featureGrid}>
            {featureHighlights.map((feature) => (
              <article key={feature.title} className={card}>
                <h3 className={cardHeading}>{feature.title}</h3>
                <p className={cardBody}>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={sectionWrapper} aria-labelledby="diamond-insights-status">
          <h2 id="diamond-insights-status" className={navHeadingTitle}>
            Platform Status
          </h2>
          <div className={cardGrid}>
            <article className={card}>
              <h3 className={cardHeading}>Foundation Build</h3>
              <p className={cardBody}>
                Phase 2 (MVP) scaffolding is underway. Routing is locked, theming is stabilized, and data ingestion hooks are
                staged for Highlightly, TrackMan, and NCAA stat endpoints.
              </p>
              <p className={microcopy}>
                Updated: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </article>
            <article className={card}>
              <h3 className={cardHeading}>Need Early Access?</h3>
              <p className={cardBody}>
                Reach out for Diamond Pro onboarding or operations partnerships across the Deep South footprint.
              </p>
              <Link className={inlineLink} href="/account">
                Manage your Diamond Insights profile
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
