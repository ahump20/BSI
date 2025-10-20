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

const navigation = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/players', label: 'Player Intel' }
];

export default function BaseballNewsPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Briefings</span>
        <h1 className={sectionTitle()}>Newsroom & Portal Tracker</h1>
        <p className={sectionSubtitle()}>
          The editorial desk is preparing live game capsules, transfer portal updates, and recruiting intel. Until feeds go live,
          this placeholder keeps navigation warm and communicates what to expect from the newsroom cadence.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Editorial Roadmap</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Expect automated recaps with human verification and curated storylines per market.
            </p>
            <ul className={listStyles()}>
              <li>Instant recaps sourced from verified game data.</li>
              <li>Portal tracker with commitment verification workflows.</li>
              <li>Diamond Pro premium briefs for operations staffs.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Navigate</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Access adjacent areas while coverage spins up.</p>
            <ul className={listStyles()}>
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link className={inlineLink()} href={item.href}>
                    {item.label}
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
