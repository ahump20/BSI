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

const quickActions = [
  { href: '/auth/sign-up', label: 'Upgrade to Diamond Pro' },
  { href: '/baseball/ncaab/news', label: 'Read Analysis Briefs' },
  { href: '/baseball/ncaab/standings', label: 'Review Standings' }
];

export default function BaseballRankingsPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Rankings</span>
        <h1 className={sectionTitle()}>Diamond Index & Polls</h1>
        <p className={sectionSubtitle()}>
          Our blended power rating, featuring Diamond Index, RPI, and human composite polls, will populate this view. The
          placeholder maintains UX continuity and dark theme while we finalize ranking algorithms.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">On Deck</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Expect sortable poll cards, résumé snippets, and movement indicators.
            </p>
            <ul className={listStyles()}>
              <li>Delta badges showing week-over-week shifts.</li>
              <li>Strength-of-schedule overlays and predictive tiers.</li>
              <li>Top 25 focus with quick filters for Freshman Impact, Pitching, and Offense.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Quick Actions</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Stay productive while data sync finishes.</p>
            <ul className={listStyles()}>
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link className={inlineLink()} href={action.href}>
                    {action.label}
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
