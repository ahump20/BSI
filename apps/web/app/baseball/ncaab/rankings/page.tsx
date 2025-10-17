import Link from 'next/link';
import DiamondProGate from '../../../../components/DiamondProGate';
import { getSession } from '../../../../lib/session';

const quickActions = [
  { href: '/auth/login?returnTo=/baseball/ncaab/rankings', label: 'Upgrade to Diamond Pro' },
  { href: '/baseball/ncaab/news', label: 'Read Analysis Briefs' },
  { href: '/baseball/ncaab/standings', label: 'Review Standings' }
];

export default function BaseballRankingsPage() {
  const session = getSession();
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Rankings</span>
        <h1 className="di-page-title">Diamond Index & Polls</h1>
        <p className="di-page-subtitle">
          Our blended power rating—Diamond Index + RPI + human composite polls—lands here. Diamond Pro subscribers will unlock
          live recalculations and résumé scoring as Auth0 roles sync through the new pipeline.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>On Deck</h2>
            <p>Expect sortable poll cards, résumé snippets, and movement indicators.</p>
            <ul className="di-list">
              <li>Delta badges showing week-over-week shifts.</li>
              <li>Strength-of-schedule overlays and predictive tiers.</li>
              <li>Top 25 focus with quick filters for Freshman Impact, Pitching, and Offense.</li>
            </ul>
          </article>
          <DiamondProGate featureName="Diamond Index live recalculations" session={session} returnTo="/baseball/ncaab/rankings">
            <article className="di-card">
              <h2>Diamond Pro Projection Layer</h2>
              <p>
                Paid members unlock automated résumé scores, selection committee simulations, and opponent-adjusted power
                ratings. Stripe webhooks now tag Auth0 roles instantly so access mirrors your billing state.
              </p>
              <ul className="di-list">
                <li>Bid probability curves updated after every pitch.</li>
                <li>Scenario planner for Top 25 and at-large chaos.</li>
                <li>Exportable CSVs for staff meetings and broadcast notes.</li>
              </ul>
            </article>
          </DiamondProGate>
          <article className="di-card">
            <h2>Quick Actions</h2>
            <p>Stay productive while data sync finishes.</p>
            <ul className="di-list">
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link className="di-inline-link" href={action.href}>
                    {action.label}
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
