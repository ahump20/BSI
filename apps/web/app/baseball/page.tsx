import Link from 'next/link';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';

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
    <div className="di-shell">
      <main className="di-container" aria-labelledby="baseball-intel-heading">
        <section className="di-hero" id="baseball-intel-heading">
          <span className="di-pill">Diamond Insights</span>
          <h1 className="di-title">College Baseball Stack</h1>
          <p className="di-subtitle">
            BlazeSportsIntel is engineered for staff rooms in Baton Rouge, Starkville, and Austin—mobile-first, dark-mode,
            and updated on a sub-minute cadence.
          </p>
        </section>

        <section className="di-section" aria-labelledby="baseball-focus-areas">
          <h2 id="baseball-focus-areas" className="di-page-title">
            Operational Focus
          </h2>
          <ul className="di-nav-list">
            {focusAreas.map((area) => (
              <li key={area.href}>
                <Link className="di-nav-card" href={area.href}>
                  <span>{area.title}</span>
                  <p>{area.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
