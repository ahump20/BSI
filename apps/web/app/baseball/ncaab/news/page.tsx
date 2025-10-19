import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const navigation = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/games', label: 'Scoreboard' },
  { href: '/baseball/ncaab/players', label: 'Player Intel' }
];

export default function BaseballNewsPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · Briefings"
          title="Newsroom & Portal Tracker"
          description="The editorial desk is preparing live game capsules, transfer portal updates, and recruiting intel. Until feeds go live, this placeholder keeps navigation warm and communicates what to expect from the newsroom cadence."
        />
        <CardGrid>
          <InfoCard
            title="Editorial Roadmap"
            description="Expect automated recaps with human verification and curated storylines per market."
          >
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              <li>Instant recaps sourced from verified game data.</li>
              <li>Portal tracker with commitment verification workflows.</li>
              <li>Diamond Pro premium briefs for operations staffs.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Navigate" description="Access adjacent areas while coverage spins up.">
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              {navigation.map((item) => (
                <li key={item.href}>
                  <AccentLink href={item.href}>{item.label}</AccentLink>
                </li>
              ))}
            </ul>
          </InfoCard>
        </CardGrid>
      </section>
    </PageShell>
  );
}
