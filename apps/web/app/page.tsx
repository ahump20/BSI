import Link from 'next/link';

import { recordRuntimeEvent } from '../lib/observability/datadog-runtime';
import {
  actionButton,
  actionRow,
  cardGrid,
  cardSurface,
  heroPill,
  heroSection,
  heroSubtitle,
  heroTitle,
  inlineLink,
  layoutContainer,
  layoutShell,
  microcopy,
  navCard,
  navGrid,
  section,
  sectionHeader,
  sectionSubtitle,
  sectionTitle
} from '../lib/ui/di-variants';

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
    <div className={layoutShell({ variant: 'hero' })}>
      <main className={layoutContainer()}>
        <section className={heroSection()} aria-labelledby="diamond-insights-hero">
          <span className={heroPill()}>Diamond Insights</span>
          <h1 id="diamond-insights-hero" className={heroTitle()}>
            College Baseball Intelligence for the Deep South
          </h1>
          <p className={heroSubtitle()}>
            BlazeSportsIntel is pivoting into the definitive NCAA Division I baseball platform—live telemetry, scouting intel,
            and recruiting context built mobile-first and dark-mode native.
          </p>
          <div className={actionRow()}>
            <Link className={actionButton()} href="/baseball/ncaab/hub">
              Enter the Baseball Hub
            </Link>
            <Link className={actionButton({ variant: 'secondary' })} href="/auth/sign-up">
              Join Diamond Pro Beta
            </Link>
          </div>
        </section>

        <nav className={section()} aria-labelledby="diamond-insights-navigation">
          <div className={sectionHeader()}>
            <h2 id="diamond-insights-navigation" className={sectionTitle()}>
              Navigate the College Baseball Stack
            </h2>
            <p className={sectionSubtitle()}>
              Every route is mobile-optimized and ready for data hookups—start in the hub or jump straight to live surfaces.
            </p>
          </div>
          <ul className={navGrid()}>
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link className={navCard()} href={link.href}>
                  <span className="text-sm font-semibold text-di-text sm:text-base">{link.title}</span>
                  <p className="text-sm text-di-textMuted">{link.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className={section()} aria-labelledby="diamond-insights-highlights">
          <h2 id="diamond-insights-highlights" className={sectionTitle()}>
            Diamond Insights Operating Principles
          </h2>
          <div className={cardGrid()}>
            {featureHighlights.map((feature) => (
              <article key={feature.title} className={cardSurface()}>
                <h3 className="font-display text-2xl text-di-text">{feature.title}</h3>
                <p className="text-sm text-di-textMuted sm:text-base">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={section()} aria-labelledby="diamond-insights-status">
          <h2 id="diamond-insights-status" className={sectionTitle()}>
            Platform Status
          </h2>
          <div className={cardGrid()}>
            <article className={cardSurface()}>
              <h3 className="font-display text-2xl text-di-text">Foundation Build</h3>
              <p className="text-sm text-di-textMuted sm:text-base">
                Phase 2 (MVP) scaffolding is underway. Routing is locked, theming is stabilized, and data ingestion hooks are
                staged for Highlightly, TrackMan, and NCAA stat endpoints.
              </p>
              <p className={microcopy()}>
                Updated: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </article>
            <article className={cardSurface()}>
              <h3 className="font-display text-2xl text-di-text">Need Early Access?</h3>
              <p className="text-sm text-di-textMuted sm:text-base">
                Reach out for Diamond Pro onboarding or operations partnerships across the Deep South footprint.
              </p>
              <Link className={inlineLink()} href="/account">
                Manage your Diamond Insights profile
              </Link>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
