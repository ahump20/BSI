import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const plannerLinks = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/standings', label: 'Check Standings' },
  { href: '/baseball/ncaab/news', label: 'Latest Briefings' }
];

export default function BaseballGamesPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · Games"
          title="Live Games & Scoreboard"
          description="Live data wiring is underway. This mobile-first shell confirms routing, theming, and accessibility while we attach the Highlightly feed, probabilistic win models, and shot charts."
        />
        <CardGrid>
          <InfoCard
            title="Game Day Checklist"
            description="Expect inning-by-inning updates, leverage index, and situational spray charts in this slot."
          >
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              <li>
                Live win probability model with <abbr title="Expected Runs Added">xRA</abbr> overlays.
              </li>
              <li>Tabbed views for Box Score, Plays, and Team Tendencies.</li>
              <li>Push alerts tuned to leverage moments.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Navigate" description="Select another surface to continue planning.">
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              {plannerLinks.map((item) => (
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
