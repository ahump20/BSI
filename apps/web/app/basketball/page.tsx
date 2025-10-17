import Link from 'next/link';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';

export default async function BasketballLandingPage() {
  void recordRuntimeEvent('route_render', { route: '/basketball', sport: 'basketball' });

  const highlights = [
    {
      title: 'Tempo Sheets',
      description: 'Possession-by-possession analytics primed for SEC and Big 12 scouting reports.'
    },
    {
      title: 'Shot Quality Maps',
      description: 'Visualize hot zones and defensive breakdowns for portal scouting and opponent prep.'
    },
    {
      title: 'Recruiting Heat Index',
      description: 'Track evaluation periods and portal shifts with rapid alerts to staff devices.'
    }
  ];

  return (
    <div className="di-shell">
      <main className="di-container" aria-labelledby="basketball-heading">
        <section className="di-hero" id="basketball-heading">
          <span className="di-pill">Hardwood Signal</span>
          <h1 className="di-title">Basketball Intelligence Preview</h1>
          <p className="di-subtitle">
            BlazeSportsIntel keeps the culture connected—dark-mode dashboards, mobile-first scouting packets, and actionable
            recruiting telemetry.
          </p>
        </section>

        <section className="di-section" aria-labelledby="basketball-highlights">
          <h2 id="basketball-highlights" className="di-page-title">
            Coming Online Soon
          </h2>
          <div className="di-card-grid">
            {highlights.map((highlight) => (
              <article key={highlight.title} className="di-card">
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
          <Link className="di-inline-link" href="/auth/sign-up">
            Join the Hardwood Pilot
          </Link>
        </section>
      </main>
    </div>
  );
}
