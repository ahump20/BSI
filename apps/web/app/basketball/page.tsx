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
  inlineLink,
  landingShell,
  navHeadingTitle,
  sectionWrapper
} from '../../lib/ui/styles';

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
    <div className={landingShell}>
      <main className={commandContainer} aria-labelledby="basketball-heading">
        <section className={heroSection} id="basketball-heading">
          <span className={heroPill}>Hardwood Signal</span>
          <h1 className={heroTitle}>Basketball Intelligence Preview</h1>
          <p className={heroSubtitle}>
            BlazeSportsIntel keeps the culture connected—dark-mode dashboards, mobile-first scouting packets, and actionable
            recruiting telemetry.
          </p>
        </section>

        <section className={sectionWrapper} aria-labelledby="basketball-highlights">
          <h2 id="basketball-highlights" className={navHeadingTitle}>
            Coming Online Soon
          </h2>
          <div className={featureGrid}>
            {highlights.map((highlight) => (
              <article key={highlight.title} className={card}>
                <h3 className={cardHeading}>{highlight.title}</h3>
                <p className={cardBody}>{highlight.description}</p>
              </article>
            ))}
          </div>
          <Link className={inlineLink} href="/auth/sign-up">
            Join the Hardwood Pilot
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
