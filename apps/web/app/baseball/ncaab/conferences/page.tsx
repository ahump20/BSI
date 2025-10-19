import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const conferenceFlows = [
  { href: '/baseball/ncaab/standings', label: 'View Standings' },
  { href: '/baseball/ncaab/rankings', label: 'Analyze Rankings' },
  { href: '/baseball/ncaab/news', label: 'Conference Briefings' }
];

export default function BaseballConferencesPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · Conference Pulse"
          title="Conference Intelligence"
          description="SEC, ACC, Big 12, Sun Belt, and every league will receive parity coverage with tempo, offensive profile, and travel strain metrics. This placeholder keeps information architecture wired into production while dashboards are staged."
        />
        <CardGrid>
          <InfoCard
            title="Planned Modules"
            description="Future widgets will display tournament résumés, bubble ratings, and historical matchup context."
          >
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              <li>Automatic NCAA résumé tracker with quad breakdowns.</li>
              <li>Conference power score built on run differential and schedule hardness.</li>
              <li>Travel analytics for coaches and operations leads.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Next Steps" description="Select another live surface.">
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              {conferenceFlows.map((flow) => (
                <li key={flow.href}>
                  <AccentLink href={flow.href}>{flow.label}</AccentLink>
                </li>
              ))}
            </ul>
          </InfoCard>
        </CardGrid>
      </section>
    </PageShell>
  );
}
