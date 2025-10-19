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

const navigation = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/players', label: 'Player Intel' }
];

export default function BaseballNewsPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Briefings</span>
        <h1 className={pageTitle}>Newsroom & Portal Tracker</h1>
        <p className={pageSubtitle}>
          The editorial desk is preparing live game capsules, transfer portal updates, and recruiting intel. Until feeds go
          live, this placeholder keeps navigation warm and communicates what to expect from the newsroom cadence.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Editorial Roadmap</h2>
            <p className={cardBody}>Expect automated recaps with human verification and curated storylines per market.</p>
            <ul className={bulletList}>
              <li>Instant recaps sourced from verified game data.</li>
              <li>Portal tracker with commitment verification workflows.</li>
              <li>Diamond Pro premium briefs for operations staffs.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Navigate</h2>
            <p className={cardBody}>Access adjacent areas while coverage spins up.</p>
            <ul className={bulletList}>
              {navigation.map((item) => (
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
