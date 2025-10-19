import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { createCheckoutSessionAction } from './actions';
import { getUserAccountSnapshot } from '../../../lib/auth/user';
import { hasDiamondProAccess } from '../../../lib/auth/entitlements';
import { recordConversionEvent } from '../../../lib/analytics/events';

type SubscribeSearchParams = Record<string, string | string[] | undefined>;

export default async function SubscribePage({
  searchParams
}: {
  searchParams?: Promise<SubscribeSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const user = await currentUser();
  if (!user) {
    redirect('/auth/sign-in?redirect_url=/account/subscribe');
  }

  const snapshot = await getUserAccountSnapshot(user.id);
  const entitlements = snapshot?.entitlements ?? [];
  const isPro = hasDiamondProAccess(entitlements);
  const state = typeof resolvedSearchParams.state === 'string' ? resolvedSearchParams.state : undefined;

  await recordConversionEvent(
    'diamond_pro_subscribe_page_view',
    { surface: 'account-subscribe' },
    { clerkUserId: user.id, state }
  );

  if (isPro && state !== 'manage') {
    redirect('/account');
  }

  return (
    <main className="di-page">
      <section className="di-section di-subscribe">
        <span className="di-kicker">Diamond Insights · Diamond Pro</span>
        <h1 className="di-page-title">Subscribe to Diamond Pro</h1>
        <p className="di-page-subtitle">
          Lock in the Deep South&apos;s best college baseball intelligence: live models, portal intel, and postseason
          scouting packets.
        </p>

        {state === 'success' ? (
          <div className="di-success-banner" role="status">
            <span className="di-success-kicker">Checkout complete</span>
            <p>Thanks for joining Diamond Pro. Your entitlements will refresh within a few seconds.</p>
          </div>
        ) : null}

        {state === 'cancelled' ? (
          <div className="di-warning-banner" role="status">
            <span className="di-warning-kicker">Checkout cancelled</span>
            <p>No charge was made. You can restart checkout at any time below.</p>
          </div>
        ) : null}

        <div className="di-card di-card--full">
          <h2>Diamond Pro includes</h2>
          <ul className="di-list di-list--inline">
            <li>Advanced matchup &amp; leverage models</li>
            <li>Recruiting + portal intel dashboards</li>
            <li>Historical comps &amp; draft readiness tiers</li>
          </ul>
        </div>

        <form className="di-checkout-form" action={createCheckoutSessionAction}>
          <button type="submit" className="di-action">
            Start Diamond Pro checkout
          </button>
        </form>
      </section>
    </main>
  );
}
