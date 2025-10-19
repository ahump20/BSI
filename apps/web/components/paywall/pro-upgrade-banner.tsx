'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { trackClientConversion } from '../../lib/analytics/events';

export default function ProUpgradeBanner() {
  useEffect(() => {
    trackClientConversion('diamond_pro_paywall_banner_viewed', { surface: 'account' });
  }, []);

  return (
    <aside className="di-upgrade-banner" role="note">
      <div className="di-upgrade-header">
        <span className="di-badge">Diamond Pro</span>
        <h2>Unlock Diamond Pro advanced reports</h2>
      </div>
      <p>
        Elevate your scouting stack with pitch-by-pitch models, portal intel, and live win probability tuned for
        college baseball staffs.
      </p>
      <ul className="di-upgrade-list">
        <li>Advanced game intelligence &amp; matchup breakdowns</li>
        <li>Portal + recruiting tracking with alerts</li>
        <li>Historical player development and draft comps</li>
      </ul>
      <Link
        className="di-action"
        href="/account/subscribe"
        onClick={() =>
          trackClientConversion('diamond_pro_paywall_cta_clicked', { surface: 'account', placement: 'banner' })
        }
      >
        Upgrade to Diamond Pro
      </Link>
    </aside>
  );
}
