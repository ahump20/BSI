import Link from 'next/link';

import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';
import {
  heroPill,
  heroSection,
  heroSubtitle,
  heroTitle,
  layoutContainer,
  layoutShell,
  navCard,
  navGrid,
  section,
  sectionTitle
} from '../../lib/ui/di-variants';

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
    <div className={layoutShell({ variant: 'hero' })}>
      <main className={layoutContainer()} aria-labelledby="baseball-intel-heading">
        <section className={heroSection()} id="baseball-intel-heading">
          <span className={heroPill()}>Diamond Insights</span>
          <h1 className={heroTitle()}>College Baseball Stack</h1>
          <p className={heroSubtitle()}>
            BlazeSportsIntel is engineered for staff rooms in Baton Rouge, Starkville, and Austin—mobile-first, dark-mode, and
            updated on a sub-minute cadence.
          </p>
        </section>

        <section className={section()} aria-labelledby="baseball-focus-areas">
          <h2 id="baseball-focus-areas" className={sectionTitle()}>
            Operational Focus
          </h2>
          <ul className={navGrid()}>
            {focusAreas.map((area) => (
              <li key={area.href}>
                <Link className={navCard()} href={area.href}>
                  <span className="text-sm font-semibold text-di-text sm:text-base">{area.title}</span>
                  <p className="text-sm text-di-textMuted">{area.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
