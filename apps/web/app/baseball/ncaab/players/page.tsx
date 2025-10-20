import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const quickRoutes = [
  { href: '/auth/sign-in', label: 'Sign in for Diamond Pro scouting reports' },
  { href: '/baseball/ncaab/news', label: 'Read latest player movement notes' },
  { href: '/baseball/ncaab/rankings', label: 'Check Draft Boards & Rankings' }
];

export default function BaseballPlayersPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · Player Intel"
          title="Player Profiles"
          description="Our player knowledge graph—linking pitch characteristics, biomechanics, and recruiting momentum—is loading soon. The interface below stands in so routing, theming, and accessibility remain stable during data hookups."
        />
        <CardGrid>
          <InfoCard
            title="Pipeline"
            description="Expect pitch mix visuals, health monitors, and NIL valuations with audit trails."
          >
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              <li>Unified datasets from TrackMan, Synergy, and school feeds.</li>
              <li>Progressive release schedule with freshness badges.</li>
              <li>Diamond Pro tagging for private board collaboration.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Quick Links" description="Keep momentum while the feeds finalize.">
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              {quickRoutes.map((route) => (
                <li key={route.href}>
                  <AccentLink href={route.href}>{route.label}</AccentLink>
                </li>
              ))}
            </ul>
          </InfoCard>
        </CardGrid>
      </section>
    </PageShell>
  );
}
