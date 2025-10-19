import Link from 'next/link';
import type { Metadata } from 'next';
import { recordRuntimeEvent } from '../../../../../lib/observability/datadog-runtime';
import {
  card,
  cardBody,
  cardHeading,
  commandContainer,
  featureGrid,
  heroPill,
  heroSection,
  heroSubtitle,
  heroTitle,
  inlineLink,
  landingShell,
  navHeadingTitle,
  sectionWrapper
} from '../../../../../lib/ui/styles';

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
    <div className={landingShell}>
      <main className={commandContainer} aria-labelledby="game-detail-heading">
        <section className={heroSection} id="game-detail-heading">
          <span className={heroPill}>Diamond Game Center</span>
          <h1 className={heroTitle}>{formattedName.toUpperCase()}</h1>
          <p className={heroSubtitle}>
            Live telemetry, leverage scoring, and scouting packets sync here once Highlightly and TrackMan feeds finalize.
          </p>
        </section>

        <section className={sectionWrapper} aria-labelledby="game-detail-overview">
          <h2 id="game-detail-overview" className={navHeadingTitle}>
            Game Detail Blueprint
          </h2>
          <div className={featureGrid}>
            <article className={card}>
              <h3 className={cardHeading}>Live Game Thread</h3>
              <p className={cardBody}>
                Edge runtime will hydrate pitch charts, baserunner visualizations, and leverage markers every 45 seconds.
              </p>
            </article>
            <article className={card}>
              <h3 className={cardHeading}>Scouting Stack</h3>
              <p className={cardBody}>Attach bullpen notes, video timestamps, and biomech signals for staff workflows.</p>
            </article>
            <article className={card}>
              <h3 className={cardHeading}>Export Ready</h3>
              <p className={cardBody}>Diamond Pro subscribers can export PDF packets directly to staff iPads postgame.</p>
            </article>
          </div>
          <Link className={inlineLink} href="/baseball/ncaab/games">
            Return to Live Games
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
