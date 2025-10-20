import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const navTargets = [
  { href: '/baseball/ncaab/rankings', label: 'Power Ratings' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/hub', label: 'Hub Overview' }
];

export default function BaseballStandingsPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · Standings"
          title="Standings & Form Tracker"
          description="Standings tables, rolling expected wins, and postseason projections will render here. For now, this placeholder keeps navigation intact and signals the dark-mode design language heading toward launch."
        />
        <CardGrid>
          <InfoCard
            title="Coming Soon"
            description="Full-table visualizations with swipeable filters and conference toggles."
          >
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              <li>Auto-refreshing RPI, ISR, and KPI comparisons.</li>
              <li>Form tracker for last 10 games with sparkline trends.</li>
              <li>Bid probability modeling for Selection Monday scenarios.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Navigate" description="Move to another page while we pipe in the data.">
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              {navTargets.map((target) => (
                <li key={target.href}>
                  <AccentLink href={target.href}>{target.label}</AccentLink>
                </li>
              ))}
            </ul>
          </InfoCard>
        </CardGrid>
      </section>
    </PageShell>
  );
}
