import Link from 'next/link';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';
import {
  card,
  cardBody,
  cardHeading,
  commandContainer,
  featureGrid,
  heroPill,
  heroSection,
  heroSubtitle,
  heroTitle,
  landingShell,
  navHeadingTitle,
  primaryAction,
  sectionWrapper
} from '../../lib/ui/styles';

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
    <div className={landingShell}>
      <main className={commandContainer} aria-labelledby="football-heading">
        <section className={heroSection} id="football-heading">
          <span className={heroPill}>Gridiron Signal</span>
          <h1 className={heroTitle}>Deep South Football Intel</h1>
          <p className={heroSubtitle}>
            Complement the Diamond stack with fall analytics—portal velocity, recruiting scorecards, and live win probability.
          </p>
          <Link className={primaryAction} href="/auth/sign-up">
            Reserve Football Access
          </Link>
        </section>

        <section className={sectionWrapper} aria-labelledby="football-tiles">
          <h2 id="football-tiles" className={navHeadingTitle}>
            Fall 2025 Preview
          </h2>
          <div className={featureGrid}>
            {featureTiles.map((tile) => (
              <article key={tile.title} className={card}>
                <h3 className={cardHeading}>{tile.title}</h3>
                <p className={cardBody}>{tile.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
