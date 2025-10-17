import Link from 'next/link';
import DiamondProGate from '../../../../components/DiamondProGate';
import { getSession } from '../../../../lib/session';

const quickRoutes = [
  { href: '/auth/login?returnTo=/baseball/ncaab/players', label: 'Sign in for Diamond Pro scouting reports' },
  { href: '/baseball/ncaab/news', label: 'Read latest player movement notes' },
  { href: '/baseball/ncaab/rankings', label: 'Check Draft Boards & Rankings' }
];

export default function BaseballPlayersPage() {
  const session = getSession();
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Player Intel</span>
        <h1 className="di-page-title">Player Profiles</h1>
        <p className="di-page-subtitle">
          Our player knowledge graph—linking pitch characteristics, biomechanics, and recruiting momentum—is loading soon. The
          interface below stands in so routing, theming, and accessibility remain stable during data hookups.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Pipeline</h2>
            <p>Expect pitch mix visuals, health monitors, and NIL valuations with audit trails.</p>
            <ul className="di-list">
              <li>Unified datasets from TrackMan, Synergy, and school feeds.</li>
              <li>Progressive release schedule with freshness badges.</li>
              <li>Diamond Pro tagging for private board collaboration.</li>
            </ul>
          </article>
          <DiamondProGate featureName="Scouting Packet Exports" session={session} returnTo="/baseball/ncaab/players">
            <article className="di-card">
              <h2>Diamond Pro Preview</h2>
              <p>
                Subscribers will generate scouting packets, velocity trend charts, and biomechanics overlays. Auth0 roles now
                map directly to these controls—upgrade to see the full player intelligence stack.
              </p>
              <ul className="di-list">
                <li>Automated pitch quality grades with historical comps.</li>
                <li>Recruiting heatmaps linked to portal and JUCO intel.</li>
                <li>Export-ready PDFs for staff briefings and draft prep.</li>
              </ul>
            </article>
          </DiamondProGate>
          <article className="di-card">
            <h2>Quick Links</h2>
            <p>Keep momentum while the feeds finalize.</p>
            <ul className="di-list">
              {quickRoutes.map((route) => (
                <li key={route.href}>
                  <Link className="di-inline-link" href={route.href}>
                    {route.label}
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
