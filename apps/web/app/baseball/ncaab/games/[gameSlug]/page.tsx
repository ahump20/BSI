import Link from 'next/link';
import type { Metadata } from 'next';
import { recordRuntimeEvent } from '../../../../../lib/observability/datadog-runtime';

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
    <div className="di-shell">
      <main className="di-container" aria-labelledby="game-detail-heading">
        <section className="di-hero" id="game-detail-heading">
          <span className="di-pill">Diamond Game Center</span>
          <h1 className="di-title">{formattedName.toUpperCase()}</h1>
          <p className="di-subtitle">
            Live telemetry, leverage scoring, and scouting packets sync here once Highlightly and TrackMan feeds finalize.
          </p>
        </section>

        <section className="di-section" aria-labelledby="game-detail-overview">
          <h2 id="game-detail-overview" className="di-page-title">
            Game Detail Blueprint
          </h2>
          <div className="di-card-grid">
            <article className="di-card">
              <h3>Live Game Thread</h3>
              <p>Edge runtime will hydrate pitch charts, baserunner visualizations, and leverage markers every 45 seconds.</p>
            </article>
            <article className="di-card">
              <h3>Scouting Stack</h3>
              <p>Attach bullpen notes, video timestamps, and biomech signals for staff workflows.</p>
            </article>
            <article className="di-card">
              <h3>Export Ready</h3>
              <p>Diamond Pro subscribers can export PDF packets directly to staff iPads postgame.</p>
            </article>
          </div>
          <Link className="di-inline-link" href="/baseball/ncaab/games">
            Return to Live Games
          </Link>
        </section>
      </main>
    </div>
  );
}
