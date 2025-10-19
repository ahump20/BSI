import { AccentLink } from '../../../(components)/AccentLink';
import { CardGrid } from '../../../(components)/CardGrid';
import { InfoCard } from '../../../(components)/InfoCard';
import { PageHeader } from '../../../(components)/PageHeader';
import { PageShell } from '../../../(components)/PageShell';

const quickActions = [
  { href: '/auth/sign-up', label: 'Upgrade to Diamond Pro' },
  { href: '/baseball/ncaab/news', label: 'Read Analysis Briefs' },
  { href: '/baseball/ncaab/standings', label: 'Review Standings' }
];

export default function BaseballRankingsPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Diamond Insights · Rankings"
          title="Diamond Index & Polls"
          description="Our blended power rating, featuring Diamond Index, RPI, and human composite polls, will populate this view. The placeholder maintains UX continuity and dark theme while we finalize ranking algorithms."
        />
        <CardGrid>
          <InfoCard
            title="On Deck"
            description="Expect sortable poll cards, résumé snippets, and movement indicators."
          >
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              <li>Delta badges showing week-over-week shifts.</li>
              <li>Strength-of-schedule overlays and predictive tiers.</li>
              <li>Top 25 focus with quick filters for Freshman Impact, Pitching, and Offense.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Quick Actions" description="Stay productive while data sync finishes.">
            <ul className="ml-5 list-disc space-y-list-gap text-sm leading-relaxed text-di-text-muted">
              {quickActions.map((action) => (
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
