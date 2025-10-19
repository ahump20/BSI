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

const plannerLinks = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/standings', label: 'Check Standings' },
  { href: '/baseball/ncaab/news', label: 'Latest Briefings' }
];

export default function BaseballGamesPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Games</span>
        <h1 className={pageTitle}>Live Games & Scoreboard</h1>
        <p className={pageSubtitle}>
          Live data wiring is underway. This mobile-first shell confirms routing, theming, and accessibility while we attach
          the Highlightly feed, probabilistic win models, and shot charts.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Game Day Checklist</h2>
            <p className={cardBody}>Expect inning-by-inning updates, leverage index, and situational spray charts in this slot.</p>
            <ul className={bulletList}>
              <li>
                Live win probability model with <abbr title="Expected Runs Added">xRA</abbr> overlays.
              </li>
              <li>Tabbed views for Box Score, Plays, and Team Tendencies.</li>
              <li>Push alerts tuned to leverage moments.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Navigate</h2>
            <p className={cardBody}>Select another surface to continue planning.</p>
            <ul className={bulletList}>
              {plannerLinks.map((item) => (
                <li key={item.href}>
                  <Link className={inlineLink} href={item.href}>
                    {item.label}
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
