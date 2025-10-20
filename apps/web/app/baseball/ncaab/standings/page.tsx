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

const navTargets = [
  { href: '/baseball/ncaab/rankings', label: 'Power Ratings' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/hub', label: 'Hub Overview' }
];

export default function BaseballStandingsPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Standings</span>
        <h1 className={sectionTitle()}>Standings & Form Tracker</h1>
        <p className={sectionSubtitle()}>
          Standings tables, rolling expected wins, and postseason projections will render here. For now, this placeholder keeps
          navigation intact and signals the dark-mode design language heading toward launch.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Coming Soon</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Full-table visualizations with swipeable filters and conference toggles.
            </p>
            <ul className={listStyles()}>
              <li>Auto-refreshing RPI, ISR, and KPI comparisons.</li>
              <li>Form tracker for last 10 games with sparkline trends.</li>
              <li>Bid probability modeling for Selection Monday scenarios.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Navigate</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Move to another page while we pipe in the data.</p>
            <ul className={listStyles()}>
              {navTargets.map((target) => (
                <li key={target.href}>
                  <Link className={inlineLink()} href={target.href}>
                    {target.label}
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
