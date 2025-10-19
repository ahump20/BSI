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

const actions = [
  { href: '/baseball/ncaab/players', label: 'Review Player Intel' },
  { href: '/baseball/ncaab/conferences', label: 'Compare Conferences' },
  { href: '/account/settings', label: 'Configure Alerts' }
];

export default function BaseballTeamsPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Programs</span>
        <h1 className={pageTitle}>Team Dashboards</h1>
        <p className={pageSubtitle}>
          Program detail views will live here: roster matrices, bullpen usage charts, recruiting velocity, and portal notes.
          Use the quick actions below while the dataset hydrates.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>What&apos;s Coming</h2>
            <p className={cardBody}>Expect sortable tables, recent form charts, and Diamond Pro scouting packs.</p>
            <ul className={bulletList}>
              <li>Split leaderboards by conference, last 10, and road/home.</li>
              <li>Spray chart heatmaps rendered with mobile pinch-zoom.</li>
              <li>Automated opponent prep packets delivered nightly.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Continue Building</h2>
            <p className={cardBody}>Jump into adjacent workflows.</p>
            <ul className={bulletList}>
              {actions.map((action) => (
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
