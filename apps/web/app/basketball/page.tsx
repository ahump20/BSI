import Link from 'next/link';

import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';
import {
  actionButton,
  cardGrid,
  cardSurface,
  heroPill,
  heroSection,
  heroSubtitle,
  heroTitle,
  inlineLink,
  layoutContainer,
  layoutShell,
  section,
  sectionTitle
} from '../../lib/ui/di-variants';

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
    <div className={layoutShell({ variant: 'hero' })}>
      <main className={layoutContainer()} aria-labelledby="basketball-heading">
        <section className={heroSection()} id="basketball-heading">
          <span className={heroPill()}>Hardwood Signal</span>
          <h1 className={heroTitle()}>Basketball Intelligence Preview</h1>
          <p className={heroSubtitle()}>
            BlazeSportsIntel keeps the culture connected—dark-mode dashboards, mobile-first scouting packets, and actionable
            recruiting telemetry.
          </p>
        </section>

        <section className={section()} aria-labelledby="basketball-highlights">
          <h2 id="basketball-highlights" className={sectionTitle()}>
            Coming Online Soon
          </h2>
          <div className={cardGrid()}>
            {highlights.map((highlight) => (
              <article key={highlight.title} className={cardSurface()}>
                <h3 className="font-display text-2xl text-di-text">{highlight.title}</h3>
                <p className="text-sm text-di-textMuted sm:text-base">{highlight.description}</p>
              </article>
            ))}
          </div>
          <Link className={inlineLink()} href="/auth/sign-up">
            Join the Hardwood Pilot
          </Link>
        </section>
      </main>
    </div>
  );
}
