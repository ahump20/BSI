import Link from 'next/link';
import {
  bulletList,
  card,
  cardBody,
  cardGrid,
  cardHeading,
  inlineLink,
  pageKicker,
  pageSection,
  pageShell,
  pageSubtitle,
  pageTitle
} from '../../../../lib/ui/styles';

const quickRoutes = [
  { href: '/auth/sign-in', label: 'Sign in for Diamond Pro scouting reports' },
  { href: '/baseball/ncaab/news', label: 'Read latest player movement notes' },
  { href: '/baseball/ncaab/rankings', label: 'Check Draft Boards & Rankings' }
];

export default function BaseballPlayersPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Player Intel</span>
        <h1 className={pageTitle}>Player Profiles</h1>
        <p className={pageSubtitle}>
          Our player knowledge graph—linking pitch characteristics, biomechanics, and recruiting momentum—is loading soon. The
          interface below stands in so routing, theming, and accessibility remain stable during data hookups.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Pipeline</h2>
            <p className={cardBody}>Expect pitch mix visuals, health monitors, and NIL valuations with audit trails.</p>
            <ul className={bulletList}>
              <li>Unified datasets from TrackMan, Synergy, and school feeds.</li>
              <li>Progressive release schedule with freshness badges.</li>
              <li>Diamond Pro tagging for private board collaboration.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Quick Links</h2>
            <p className={cardBody}>Keep momentum while the feeds finalize.</p>
            <ul className={bulletList}>
              {quickRoutes.map((route) => (
                <li key={route.href}>
                  <Link className={inlineLink} href={route.href}>
                    {route.label}
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
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
