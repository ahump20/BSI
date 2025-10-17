import Link from 'next/link';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';

export default async function FootballLandingPage() {
  void recordRuntimeEvent('route_render', { route: '/football', sport: 'football' });

  const featureTiles = [
    {
      title: 'Portal Watch',
      description: 'Power-conference roster tracking tuned for SEC and Big 12 recruiting battles.'
    },
    {
      title: 'Tactical Dashboards',
      description: 'Explosive-play rates, defensive havoc, and situational analytics built for Saturday decisions.'
    },
    {
      title: 'Diamond Pro Alerts',
      description: 'Route critical injury, portal, and signing intelligence straight to your staff devices.'
    }
  ];

  return (
    <div className="di-shell">
      <main className="di-container" aria-labelledby="football-heading">
        <section className="di-hero" id="football-heading">
          <span className="di-pill">Gridiron Signal</span>
          <h1 className="di-title">Deep South Football Intel</h1>
          <p className="di-subtitle">
            Complement the Diamond stack with fall analytics—portal velocity, recruiting scorecards, and live win probability.
          </p>
          <Link className="di-action" href="/auth/sign-up">
            Reserve Football Access
          </Link>
        </section>

        <section className="di-section" aria-labelledby="football-tiles">
          <h2 id="football-tiles" className="di-page-title">
            Fall 2025 Preview
          </h2>
          <div className="di-card-grid">
            {featureTiles.map((tile) => (
              <article key={tile.title} className="di-card">
                <h3>{tile.title}</h3>
                <p>{tile.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
