import Link from 'next/link';

import GamesClient from './games-client';
import { recordRuntimeEvent } from '../../../../lib/observability/datadog-runtime';

const plannerLinks = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/standings', label: 'Check Standings' },
  { href: '/baseball/ncaab/news', label: 'Latest Briefings' }
];

export default function BaseballGamesPage() {
  void recordRuntimeEvent('route_render', {
    route: '/baseball/ncaab/games',
    surface: 'scoreboard',
    sport: 'baseball',
  });

  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Games</span>
        <h1 className="di-page-title">Live Games &amp; Scoreboard</h1>
        <p className="di-page-subtitle">
          Real-time cards refresh every 45 seconds with Datadog-instrumented fetches. Diamond Pro members unlock leverage
          markers and win probabilities directly inside each matchup tile.
        </p>
      </section>

      <section className="di-section" aria-labelledby="live-scoreboard">
        <div className="di-nav-heading">
          <h2 id="live-scoreboard" className="di-page-title">
            Today&apos;s Slate
          </h2>
          <p className="di-page-subtitle">
            Filtered to today by default. Mobile-first layout keeps cards legible on the concourse while Pro gating protects
            premium telemetry.
          </p>
        </div>
        <GamesClient />
      </section>

      <section className="di-section" aria-labelledby="games-nav">
        <div className="di-card-grid">
          <article className="di-card">
            <h2 id="games-nav">Game Day Checklist</h2>
            <p>Edge runtime pushes highlight data, leverage index, and scouting overlays into this view.</p>
            <ul className="di-list">
              <li>Inning-by-inning refresh with <abbr title="Expected Runs Added">xRA</abbr> and leverage tags.</li>
              <li>Tabs for Box Score, Plays, and Team Tendencies in the full game center.</li>
              <li>Push alerts tuned to high-leverage moments for Diamond Pro programs.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Navigate</h2>
            <p>Select another surface to continue planning.</p>
            <ul className="di-list">
              {plannerLinks.map((item) => (
                <li key={item.href}>
                  <Link className="di-inline-link" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
