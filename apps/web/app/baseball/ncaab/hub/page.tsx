import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const sections = [
  { href: '/baseball/ncaab/games', label: 'Scoreboard & Live Games', summary: 'Track real-time scores, win probability, and inning-by-inning context.' },
  { href: '/baseball/ncaab/teams', label: 'Programs & Scouting', summary: 'Browse SEC, ACC, Big 12, and national profiles with rolling efficiency metrics.' },
  { href: '/baseball/ncaab/players', label: 'Player Intelligence', summary: 'Monitor player trends, pitch data, and recruiting signals as rosters evolve.' },
  { href: '/baseball/ncaab/conferences', label: 'Conference Pulse', summary: 'Assess power rankings, standings, and RPI movement by league.' },
  { href: '/baseball/ncaab/standings', label: 'Standings & Splits', summary: 'Compare division races, streaks, and form ahead of Selection Monday.' },
  { href: '/baseball/ncaab/rankings', label: 'Diamond Index', summary: 'Dive into data-backed polls, KPIs, and momentum indicators.' },
  { href: '/baseball/ncaab/news', label: 'News & Briefings', summary: 'Stay informed on transfers, injuries, and portal commitments.' },
  { href: '/account', label: 'Manage Account', summary: 'Adjust notifications, Diamond Pro access, and personalization.' }
];

export default function BaseballHubPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · NCAA Division I Baseball"
          title="College Baseball Command Center"
          description="Your single landing zone for live game telemetry, advanced scouting intel, and conference health across the national landscape. Final visuals and data hooks are en route; this shell keeps navigation live while we finish the ingest plumbing."
        />
        <CardGrid className="xl:grid-cols-3">
          {sections.map((section) => (
            <InfoCard key={section.href} title={section.label} description={section.summary}>
              <AccentLink href={section.href}>Enter {section.label}</AccentLink>
            </InfoCard>
          ))}
        </CardGrid>
      </section>
    </PageShell>
  );
}
