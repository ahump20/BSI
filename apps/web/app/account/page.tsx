import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getUserAccountSnapshot } from '../../lib/auth/user';
import { hasDiamondProAccess } from '../../lib/auth/entitlements';
import { recordConversionEvent } from '../../lib/analytics/events';
import ProUpgradeBanner from '../../components/paywall/pro-upgrade-banner';

export default async function AccountPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/sign-in?redirect_url=/account');
  }

  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    undefined;

  const snapshot = await getUserAccountSnapshot(user.id);
  const entitlements = snapshot?.entitlements ?? [];
  const activeSubscription = snapshot?.subscriptions.find((sub) =>
    ['TRIALING', 'ACTIVE', 'PAST_DUE'].includes(sub.status)
  );
  const isPro = hasDiamondProAccess(entitlements);

  if (isPro) {
    await recordConversionEvent('diamond_pro_account_view', { surface: 'account', tier: 'pro' }, {
      clerkUserId: user.id
    });
  }

  return (
    <main className="di-page">
      <section className="di-section di-account">
        <span className="di-kicker">Diamond Insights · Account</span>
        <h1 className="di-page-title">Account Center</h1>
        <p className="di-page-subtitle">
          Manage authentication, subscription status, and Diamond Pro entitlements.
        </p>

        <div className="di-card-grid">
          <article className="di-card" aria-label="Profile summary">
            <h2>Profile</h2>
            <p className="di-card-subtitle">Signed in with Clerk</p>
            <ul className="di-list">
              <li>
                <strong>User ID:</strong> {user.id}
              </li>
              {email ? (
                <li>
                  <strong>Email:</strong> {email}
                </li>
              ) : null}
              <li>
                <strong>Status:</strong> {isPro ? 'Diamond Pro' : 'Free tier'}
              </li>
            </ul>
          </article>

          <article className="di-card" aria-label="Subscription summary">
            <h2>Subscription</h2>
            {activeSubscription ? (
              <ul className="di-list">
                <li>
                  <strong>Stripe Subscription ID:</strong> {activeSubscription.stripeSubscriptionId}
                </li>
                <li>
                  <strong>Price:</strong> {activeSubscription.stripePriceId ?? 'Diamond Pro'}
                </li>
                <li>
                  <strong>Status:</strong> {activeSubscription.status}
                </li>
                {activeSubscription.currentPeriodEnd ? (
                  <li>
                    <strong>Renews:</strong>{' '}
                    {activeSubscription.currentPeriodEnd.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="di-card-subtitle">
                No active Diamond Pro subscription detected. Upgrade to unlock scouting-grade analytics.
              </p>
            )}
            <div className="di-card-actions">
              {isPro ? (
                <Link className="di-inline-link" href="/account/subscribe?state=manage">
                  Manage billing
                </Link>
              ) : (
                <Link className="di-inline-link" href="/account/subscribe">
                  Upgrade to Diamond Pro
                </Link>
              )}
            </div>
          </article>
        </div>

        {!isPro ? (
          <ProUpgradeBanner />
        ) : (
          <div className="di-success-banner" role="status">
            <span className="di-success-kicker">Diamond Pro Active</span>
            <p>
              You have full access to advanced game intelligence, proprietary models, and Diamond Pro research. Keep
              an eye on your inbox for weekly scouting briefs.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
