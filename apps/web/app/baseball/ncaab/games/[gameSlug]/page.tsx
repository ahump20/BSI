import type { Metadata } from 'next';
import { recordRuntimeEvent } from '../../../../../lib/observability/datadog-runtime';
import { AccentLink } from '../../../../(components)/AccentLink';
import { CardGrid } from '../../../../(components)/CardGrid';
import { InfoCard } from '../../../../(components)/InfoCard';
import { PageHeader } from '../../../../(components)/PageHeader';
import { PageShell } from '../../../../(components)/PageShell';

type GameDetailPageProps = {
  params: Promise<{ gameSlug: string }>;
};

export async function generateMetadata({ params }: GameDetailPageProps): Promise<Metadata> {
  const { gameSlug } = await params;
  const title = gameSlug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return {
    title: `${title} — Game Intel`,
    description: 'Diamond Insights game detail placeholder while live data wiring completes.'
  };
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { gameSlug } = await params;
  const formattedName = gameSlug.replace(/-/g, ' ');

  void recordRuntimeEvent('route_render', {
    route: '/baseball/ncaab/games/[gameSlug]',
    sport: 'baseball',
    slug: gameSlug
  });

  return (
    <PageShell variant="shell">
      <section aria-labelledby="game-detail-heading" className="flex flex-col gap-section-gap">
        <PageHeader
          id="game-detail-heading"
          kicker="Diamond Game Center"
          title={formattedName.toUpperCase()}
          description="Live telemetry, leverage scoring, and scouting packets sync here once Highlightly and TrackMan feeds finalize."
        />
        <section aria-labelledby="game-detail-overview" className="flex flex-col gap-6">
          <h2 className="font-heading text-2xl" id="game-detail-overview">
            Game Detail Blueprint
          </h2>
          <CardGrid className="xl:grid-cols-3">
            <InfoCard
              title="Live Game Thread"
              description="Edge runtime will hydrate pitch charts, baserunner visualizations, and leverage markers every 45 seconds."
            />
            <InfoCard
              title="Scouting Stack"
              description="Attach bullpen notes, video timestamps, and biomech signals for staff workflows."
            />
            <InfoCard
              title="Export Ready"
              description="Diamond Pro subscribers can export PDF packets directly to staff iPads postgame."
            />
          </CardGrid>
          <AccentLink href="/baseball/ncaab/games">Return to Live Games</AccentLink>
        </section>
      </section>
    </PageShell>
  );
}
