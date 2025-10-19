import Link from 'next/link';

import {
  cardGrid,
  cardSurface,
  inlineLink,
  kicker,
  layoutShell,
  listStyles,
  section,
  sectionSubtitle,
  sectionTitle
} from '../../../../lib/ui/di-variants';

const quickRoutes = [
  { href: '/auth/sign-in', label: 'Sign in for Diamond Pro scouting reports' },
  { href: '/baseball/ncaab/news', label: 'Read latest player movement notes' },
  { href: '/baseball/ncaab/rankings', label: 'Check Draft Boards & Rankings' }
];

export default function BaseballPlayersPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Player Intel</span>
        <h1 className={sectionTitle()}>Player Profiles</h1>
        <p className={sectionSubtitle()}>
          Our player knowledge graph—linking pitch characteristics, biomechanics, and recruiting momentum—is loading soon. The
          interface below stands in so routing, theming, and accessibility remain stable during data hookups.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Pipeline</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Expect pitch mix visuals, health monitors, and NIL valuations with audit trails.
            </p>
            <ul className={listStyles()}>
              <li>Unified datasets from TrackMan, Synergy, and school feeds.</li>
              <li>Progressive release schedule with freshness badges.</li>
              <li>Diamond Pro tagging for private board collaboration.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Quick Links</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Keep momentum while the feeds finalize.</p>
            <ul className={listStyles()}>
              {quickRoutes.map((route) => (
                <li key={route.href}>
                  <Link className={inlineLink()} href={route.href}>
                    {route.label}
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
