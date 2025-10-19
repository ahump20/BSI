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

const navTargets = [
  { href: '/baseball/ncaab/rankings', label: 'Power Ratings' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/hub', label: 'Hub Overview' }
];

export default function BaseballStandingsPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Standings</span>
        <h1 className={pageTitle}>Standings & Form Tracker</h1>
        <p className={pageSubtitle}>
          Standings tables, rolling expected wins, and postseason projections will render here. For now, this placeholder keeps
          navigation intact and signals the dark-mode design language heading toward launch.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Coming Soon</h2>
            <p className={cardBody}>Full-table visualizations with swipeable filters and conference toggles.</p>
            <ul className={bulletList}>
              <li>Auto-refreshing RPI, ISR, and KPI comparisons.</li>
              <li>Form tracker for last 10 games with sparkline trends.</li>
              <li>Bid probability modeling for Selection Monday scenarios.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Navigate</h2>
            <p className={cardBody}>Move to another page while we pipe in the data.</p>
            <ul className={bulletList}>
              {navTargets.map((target) => (
                <li key={target.href}>
                  <Link className={inlineLink} href={target.href}>
                    {target.label}
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
