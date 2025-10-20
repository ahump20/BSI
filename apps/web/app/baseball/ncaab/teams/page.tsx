import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const actions = [
  { href: '/baseball/ncaab/players', label: 'Review Player Intel' },
  { href: '/baseball/ncaab/conferences', label: 'Compare Conferences' },
  { href: '/account/settings', label: 'Configure Alerts' }
];

export default function BaseballTeamsPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · Programs"
          title="Team Dashboards"
          description="Program detail views will live here: roster matrices, bullpen usage charts, recruiting velocity, and portal notes. Use the quick actions below while the dataset hydrates."
        />
        <CardGrid>
          <InfoCard
            title="What's Coming"
            description="Expect sortable tables, recent form charts, and Diamond Pro scouting packs."
          >
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              <li>Split leaderboards by conference, last 10, and road/home.</li>
              <li>Spray chart heatmaps rendered with mobile pinch-zoom.</li>
              <li>Automated opponent prep packets delivered nightly.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Continue Building" description="Jump into adjacent workflows.">
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              {actions.map((action) => (
                <li key={action.href}>
                  <AccentLink href={action.href}>{action.label}</AccentLink>
                </li>
              ))}
            </ul>
          </InfoCard>
        </CardGrid>
      </section>
    </PageShell>
  );
}
