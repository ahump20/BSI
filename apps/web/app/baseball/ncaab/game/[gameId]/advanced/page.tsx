import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

import ProPaywallPanel from '../../../../../../components/paywall/pro-paywall-panel';
import { recordConversionEvent } from '../../../../../../lib/analytics/events';
import { getActiveEntitlements, hasDiamondProAccess } from '../../../../../../lib/auth/entitlements';

type AdvancedGameParams = { gameId: string };

export default async function AdvancedGamePage({
  params
}: {
  params: Promise<AdvancedGameParams>;
}) {
  const resolvedParams = await params;
  const { userId } = await auth();
  const entitlements = userId ? await getActiveEntitlements(userId) : [];
  const isPro = hasDiamondProAccess(entitlements);

  if (!isPro) {
    await recordConversionEvent(
      'diamond_pro_paywall_server_viewed',
      { surface: 'ncaab-advanced-game', gameId: resolvedParams.gameId },
      { clerkUserId: userId, entitlements }
    );

    return <ProPaywallPanel surface="ncaab-advanced-game" gameId={resolvedParams.gameId} />;
  }

  await recordConversionEvent(
    'diamond_pro_advanced_game_view',
    { surface: 'ncaab-advanced-game' },
    { gameId: resolvedParams.gameId, clerkUserId: userId }
  );

  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Pro · Advanced Game Intelligence</span>
        <h1 className="di-page-title">Advanced report — Game {resolvedParams.gameId}</h1>
        <p className="di-page-subtitle">
          Diamond Pro unlocks pitch-by-pitch expected value, leverage scenarios, and player development comps built for
          college baseball staffs. Everything below syncs live with our Highlightly ingest once credentials are active.
        </p>

        <div className="di-card-grid di-card-grid--two">
          <article className="di-card">
            <h2>Pitch quality &amp; run value</h2>
            <p className="di-card-subtitle">
              Tunneling index, chase probability, and expected run value by pitch type with heatmap overlays. Updated
              every plate appearance.
            </p>
            <ul className="di-list">
              <li>Pitcher tunneling delta vs. national median</li>
              <li>Whiff leverage score &amp; chase profile</li>
              <li>Spray chart variance + platoon advantage</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Game context &amp; leverage</h2>
            <p className="di-card-subtitle">
              Situational success rate, base-out leverage ladders, and bullpen fatigue forecasts to support in-game
              decisions.
            </p>
            <ul className="di-list">
              <li>Win probability swings &amp; leverage ladder</li>
              <li>Bullpen availability + fatigue index</li>
              <li>Offensive success rate vs. national splits</li>
            </ul>
          </article>
        </div>

        <div className="di-card di-card--full">
          <h2>Player development comps</h2>
          <p className="di-card-subtitle">
            Automated comp tables blending TrackMan, biomechanics, and production curves to map pro projection tiers.
          </p>
          <ul className="di-list di-list--inline">
            <li>Recruiting target comps</li>
            <li>MLB draft outlook</li>
            <li>Portal risk index</li>
          </ul>
        </div>

        <div className="di-card di-card--cta">
          <h2>Need adjustments?</h2>
          <p className="di-card-subtitle">
            Email <a href="mailto:pro@blazesportsintel.com">pro@blazesportsintel.com</a> for roster uploads or custom
            reporting pipelines.
          </p>
          <Link className="di-inline-link" href="/account">Return to account center</Link>
        </div>
      </section>
    </main>
  );
}
