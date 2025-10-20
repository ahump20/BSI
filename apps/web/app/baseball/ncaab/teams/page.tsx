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

const actions = [
  { href: '/baseball/ncaab/players', label: 'Review Player Intel' },
  { href: '/baseball/ncaab/conferences', label: 'Compare Conferences' },
  { href: '/account/settings', label: 'Configure Alerts' }
];

export default function BaseballTeamsPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Programs</span>
        <h1 className={sectionTitle()}>Team Dashboards</h1>
        <p className={sectionSubtitle()}>
          Program detail views will live here: roster matrices, bullpen usage charts, recruiting velocity, and portal notes.
          Use the quick actions below while the dataset hydrates.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">What&apos;s Coming</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Expect sortable tables, recent form charts, and Diamond Pro scouting packs.
            </p>
            <ul className={listStyles()}>
              <li>Split leaderboards by conference, last 10, and road/home.</li>
              <li>Spray chart heatmaps rendered with mobile pinch-zoom.</li>
              <li>Automated opponent prep packets delivered nightly.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Continue Building</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Jump into adjacent workflows.</p>
            <ul className={listStyles()}>
              {actions.map((action) => (
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
