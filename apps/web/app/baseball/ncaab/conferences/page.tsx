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

const conferenceFlows = [
  { href: '/baseball/ncaab/standings', label: 'View Standings' },
  { href: '/baseball/ncaab/rankings', label: 'Analyze Rankings' },
  { href: '/baseball/ncaab/news', label: 'Conference Briefings' }
];

export default function BaseballConferencesPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Conference Pulse</span>
        <h1 className={pageTitle}>Conference Intelligence</h1>
        <p className={pageSubtitle}>
          SEC, ACC, Big 12, Sun Belt, and every league will receive parity coverage with tempo, offensive profile, and travel
          strain metrics. This placeholder keeps information architecture wired into production while dashboards are staged.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Planned Modules</h2>
            <p className={cardBody}>Future widgets will display tournament résumés, bubble ratings, and historical matchup context.</p>
            <ul className={bulletList}>
              <li>Automatic NCAA résumé tracker with quad breakdowns.</li>
              <li>Conference power score built on run differential and schedule hardness.</li>
              <li>Travel analytics for coaches and operations leads.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Next Steps</h2>
            <p className={cardBody}>Select another live surface.</p>
            <ul className={bulletList}>
              {conferenceFlows.map((flow) => (
                <li key={flow.href}>
                  <Link className={inlineLink} href={flow.href}>
                    {flow.label}
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
