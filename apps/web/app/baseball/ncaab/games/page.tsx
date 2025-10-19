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

const plannerLinks = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/standings', label: 'Check Standings' },
  { href: '/baseball/ncaab/news', label: 'Latest Briefings' }
];

export default function BaseballGamesPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Games</span>
        <h1 className={sectionTitle()}>Live Games & Scoreboard</h1>
        <p className={sectionSubtitle()}>
          Live data wiring is underway. This mobile-first shell confirms routing, theming, and accessibility while we attach the
          Highlightly feed, probabilistic win models, and shot charts.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Game Day Checklist</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Expect inning-by-inning updates, leverage index, and situational spray charts in this slot.
            </p>
            <ul className={listStyles()}>
              <li>
                Live win probability model with <abbr title="Expected Runs Added">xRA</abbr> overlays.
              </li>
              <li>Tabbed views for Box Score, Plays, and Team Tendencies.</li>
              <li>Push alerts tuned to leverage moments.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Navigate</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Select another surface to continue planning.</p>
            <ul className={listStyles()}>
              {plannerLinks.map((item) => (
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
