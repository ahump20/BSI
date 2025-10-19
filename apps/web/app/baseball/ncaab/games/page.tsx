import Link from 'next/link';
import ScoreboardClient from './scoreboard-client';

const plannerLinks = [
  { href: '/baseball/ncaab/hub', label: 'Return to Hub' },
  { href: '/baseball/ncaab/standings', label: 'Check Standings' },
  { href: '/baseball/ncaab/news', label: 'Latest Briefings' }
];

export default function BaseballGamesPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Games</span>
        <h1 className="di-page-title">Live Games & Scoreboard</h1>
        <p className="di-page-subtitle">
          Our edge runtime normalizes ESPN&apos;s feed, caches it for 45 seconds in Upstash, and keeps this board idempotent
          for every refresh.
        </p>
      </section>
      <section className="di-section">
        <ScoreboardClient />
      </section>
      <section className="di-section">
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Game Day Checklist</h2>
            <p>Expect inning-by-inning updates, leverage index, and situational spray charts in this slot.</p>
            <ul className="di-list">
              <li>Live win probability model with <abbr title="Expected Runs Added">xRA</abbr> overlays.</li>
              <li>Tabbed views for Box Score, Plays, and Team Tendencies.</li>
              <li>Push alerts tuned to leverage moments.</li>
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
