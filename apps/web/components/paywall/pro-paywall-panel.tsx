'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { trackClientConversion } from '../../lib/analytics/events';

interface ProPaywallPanelProps {
  surface: string;
  gameId?: string;
}

export default function ProPaywallPanel({ surface, gameId }: ProPaywallPanelProps) {
  useEffect(() => {
    trackClientConversion('diamond_pro_paywall_viewed', { surface, gameId });
  }, [surface, gameId]);

  return (
    <section className="di-paywall" aria-labelledby="diamond-pro-paywall-heading">
      <div className="di-paywall__badge">Diamond Pro</div>
      <h1 id="diamond-pro-paywall-heading">Advanced intel is gated for Diamond Pro members</h1>
      <p className="di-paywall__subtitle">
        Secure the scouting edge with pitch quality models, portal alerts, and historical comps that power the Diamond
        Insights war room.
      </p>
      <div className="di-paywall__grid">
        <article className="di-paywall__card">
          <h2>What you get</h2>
          <ul>
            <li>Pitch-by-pitch run value and tunneling diagnostics</li>
            <li>Game pace, leverage, and matchup threat indicators</li>
            <li>Automated spray charts and player development comp tables</li>
          </ul>
        </article>
        <article className="di-paywall__card">
          <h2>Diamond Pro perks</h2>
          <ul>
            <li>Weekly recruiting &amp; portal intelligence briefs</li>
            <li>Exportable scouting packets for staff distribution</li>
            <li>Priority access to postseason player models</li>
          </ul>
        </article>
      </div>
      <div className="di-paywall__actions">
        <Link
          className="di-action"
          href="/account/subscribe"
          onClick={() =>
            trackClientConversion('diamond_pro_paywall_cta_clicked', {
              surface,
              placement: 'paywall-panel',
              gameId
            })
          }
        >
          Upgrade to Diamond Pro
        </Link>
        <Link className="di-action di-action--secondary" href="/auth/sign-in">
          Already a member? Sign in
        </Link>
      </div>
    </section>
  );
}
