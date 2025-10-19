import Link from 'next/link';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';
import {
  commandContainer,
  heroPill,
  heroSection,
  heroSubtitle,
  heroTitle,
  landingShell,
  navCard,
  navCardDescription,
  navCardTitle,
  navHeadingTitle,
  navList,
  sectionWrapper
} from '../../lib/ui/styles';

export default async function BaseballLandingPage() {
  void recordRuntimeEvent('route_render', { route: '/baseball', sport: 'baseball' });

  const focusAreas = [
    {
      title: 'College Hub',
      href: '/baseball/ncaab/hub',
      description: 'Command center for live leverage alerts, scouting intel, and recruiting telemetry.'
    },
    {
      title: 'Live Games',
      href: '/baseball/ncaab/games',
      description: 'Pitch-by-pitch dashboards tuned for phones, with instant leverage scoring.'
    },
    {
      title: 'Programs',
      href: '/baseball/ncaab/teams',
      description: 'Deep dossiers on SEC, ACC, Big 12, and national contenders with portal readiness.'
    }
  ];

  return (
    <div className={landingShell}>
      <main className={commandContainer} aria-labelledby="baseball-intel-heading">
        <section className={heroSection} id="baseball-intel-heading">
          <span className={heroPill}>Diamond Insights</span>
          <h1 className={heroTitle}>College Baseball Stack</h1>
          <p className={heroSubtitle}>
            BlazeSportsIntel is engineered for staff rooms in Baton Rouge, Starkville, and Austin—mobile-first, dark-mode,
            and updated on a sub-minute cadence.
          </p>
        </section>

        <section className={sectionWrapper} aria-labelledby="baseball-focus-areas">
          <h2 id="baseball-focus-areas" className={navHeadingTitle}>
            Operational Focus
          </h2>
          <ul className={navList}>
            {focusAreas.map((area) => (
              <li key={area.href}>
                <Link className={navCard} href={area.href}>
                  <span className={navCardTitle}>{area.title}</span>
                  <p className={navCardDescription}>{area.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
