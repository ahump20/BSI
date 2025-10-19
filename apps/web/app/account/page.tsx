import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import CheckoutButton from './checkout-button';
import { getSubscriptionForUser } from '@/lib/subscriptions';

const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});

export default async function AccountPage() {
  const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkConfigured) {
    return (
      <main className="di-page">
        <section className="di-section">
          <span className="di-kicker">Diamond Insights · Account</span>
          <h1 className="di-page-title">Account Center</h1>
          <p className="di-page-subtitle">
            Authentication is offline while Clerk environment keys are missing. Add CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            to enable Diamond Pro account management.
          </p>
        </section>
      </main>
    );
  }

  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in?redirect_url=/account');
  }

  const subscription = await getSubscriptionForUser(userId);
  const status = subscription?.status ?? 'none';
  const isActive = status === 'active' || status === 'trialing';
  const nextRenewal = subscription?.currentPeriodEnd
    ? formatter.format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Account</span>
        <h1 className="di-page-title">Account Center</h1>
        <p className="di-page-subtitle">
          Manage authentication, billing, and Diamond Pro entitlements from a single command surface. Everything here syncs
          across mobile and desktop instantly.
        </p>

        <div className="di-card-grid">
          <article className="di-card">
            <h2>Subscription</h2>
            <p className="di-body-copy">
              Status: <strong>{isActive ? 'Diamond Pro — Active' : 'Free Tier'}</strong>
            </p>
            {isActive ? (
              <ul className="di-list">
                <li>Stripe Subscription ID: {subscription?.stripeSubscriptionId ?? 'pending'}</li>
                <li>Customer ID: {subscription?.stripeCustomerId ?? 'pending'}</li>
                <li>Renews: {nextRenewal ?? 'TBD'}</li>
              </ul>
            ) : (
              <p className="di-body-copy">
                Upgrade to Diamond Pro to unlock automated scouting packets, alert routing, and pro-grade live win probability.
              </p>
            )}
          </article>

          <article className="di-card">
            <h2>Quick Actions</h2>
            <ul className="di-list">
              <li>
                <Link className="di-inline-link" href="/account/settings">
                  Configure notifications
                </Link>
              </li>
              <li>
                <Link className="di-inline-link" href="/baseball/ncaab/hub">
                  Open college baseball hub
                </Link>
              </li>
              <li>
                <Link className="di-inline-link" href="mailto:billing@blazesportsintel.com">
                  Request invoice assistance
                </Link>
              </li>
            </ul>
          </article>
        </div>

        {isActive ? null : <CheckoutButton />}
      </section>
    </main>
  );
}
