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

const conferenceFlows = [
  { href: '/baseball/ncaab/standings', label: 'View Standings' },
  { href: '/baseball/ncaab/rankings', label: 'Analyze Rankings' },
  { href: '/baseball/ncaab/news', label: 'Conference Briefings' }
];

export default function BaseballConferencesPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Conference Pulse</span>
        <h1 className={sectionTitle()}>Conference Intelligence</h1>
        <p className={sectionSubtitle()}>
          SEC, ACC, Big 12, Sun Belt, and every league will receive parity coverage with tempo, offensive profile, and travel
          strain metrics. This placeholder keeps information architecture wired into production while dashboards are staged.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Planned Modules</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Future widgets will display tournament résumés, bubble ratings, and historical matchup context.
            </p>
            <ul className={listStyles()}>
              <li>Automatic NCAA résumé tracker with quad breakdowns.</li>
              <li>Conference power score built on run differential and schedule hardness.</li>
              <li>Travel analytics for coaches and operations leads.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Next Steps</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Select another live surface.</p>
            <ul className={listStyles()}>
              {conferenceFlows.map((flow) => (
                <li key={flow.href}>
                  <Link className={inlineLink()} href={flow.href}>
                    {flow.label}
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
