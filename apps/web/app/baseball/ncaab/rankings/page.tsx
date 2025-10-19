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

const quickActions = [
  { href: '/auth/sign-up', label: 'Upgrade to Diamond Pro' },
  { href: '/baseball/ncaab/news', label: 'Read Analysis Briefs' },
  { href: '/baseball/ncaab/standings', label: 'Review Standings' }
];

export default function BaseballRankingsPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Rankings</span>
        <h1 className={pageTitle}>Diamond Index & Polls</h1>
        <p className={pageSubtitle}>
          Our blended power rating, featuring Diamond Index, RPI, and human composite polls, will populate this view. The
          placeholder maintains UX continuity and dark theme while we finalize ranking algorithms.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>On Deck</h2>
            <p className={cardBody}>Expect sortable poll cards, résumé snippets, and movement indicators.</p>
            <ul className={bulletList}>
              <li>Delta badges showing week-over-week shifts.</li>
              <li>Strength-of-schedule overlays and predictive tiers.</li>
              <li>Top 25 focus with quick filters for Freshman Impact, Pitching, and Offense.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Quick Actions</h2>
            <p className={cardBody}>Stay productive while data sync finishes.</p>
            <ul className={bulletList}>
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link className={inlineLink} href={action.href}>
                    {action.label}
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
