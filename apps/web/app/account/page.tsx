import Link from 'next/link';
import { getSession } from '../../lib/session';
import { summarizeAccess } from '../../lib/access-control';
import { startDiamondProCheckout } from './actions';

const upgradePlans = [
  {
    value: 'monthly',
    headline: 'Diamond Pro — Monthly',
    price: '$4.99',
    summary: 'For operations staffs that need recruiting telemetry, scouting packets, and nightly win probability pushes.'
  },
  {
    value: 'annual',
    headline: 'Diamond Pro — Annual',
    price: '$49.99',
    summary: 'Season-long access for front offices and analysts. Includes historical splits, exporting, and early feature drops.'
  }
];

type AccountPageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default function AccountPage({ searchParams }: AccountPageProps) {
  const session = getSession();
  const access = summarizeAccess(session?.roles);
  const status = typeof searchParams?.upgrade === 'string' ? searchParams?.upgrade : null;
  const authStatus = typeof searchParams?.auth === 'string' ? searchParams.auth : null;

  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Account</span>
        <h1 className="di-page-title">Account Center</h1>
        <p className="di-page-subtitle">
          Manage authentication, subscription status, and feature access for the Diamond Insights platform. Auth0 provides
          secure sign-in while Stripe powers Diamond Pro billing.
        </p>

        {authStatus === 'error' && (
          <div className="di-card di-card--gated" role="alert">
            <h2>Authentication Error</h2>
            <p>We could not complete your sign-in with Auth0. Please try again or contact support if the issue persists.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="di-card" role="status">
            <h2>Diamond Pro Activated</h2>
            <p>Your Stripe checkout completed successfully. Access may take a few seconds to propagate across Auth0 roles.</p>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="di-card" role="status">
            <h2>Checkout Cancelled</h2>
            <p>No charges were made. You can restart the Diamond Pro upgrade at any time below.</p>
          </div>
        )}

        <div className="di-card-grid">
          <article className="di-card">
            <h2>Profile</h2>
            {session ? (
              <>
                <p className="di-page-subtitle">Signed in as {session.email || session.name || session.userId}</p>
                <ul className="di-list">
                  <li>Access tier: {access.tier.toUpperCase()}</li>
                  <li>Roles: {session.roles.join(', ') || 'viewer'}</li>
                </ul>
                <div className="di-actions di-actions--inline">
                  <Link className="di-inline-link" href="/auth/login?returnTo=/account">
                    Refresh session
                  </Link>
                  <Link className="di-inline-link" href="/privacy">
                    Privacy controls
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p>You are browsing as a guest. Sign in to manage saved teams, alerts, and Diamond Pro billing.</p>
                <div className="di-actions di-actions--inline">
                  <Link className="di-action" href="/auth/login?returnTo=/account">
                    Sign in with Auth0
                  </Link>
                </div>
              </>
            )}
          </article>

          <article className="di-card">
            <h2>Diamond Pro</h2>
            {access.isDiamondPro ? (
              <>
                <p>Thanks for backing the Diamond Pro roadmap. Your Stripe subscription keeps live data and scouting intel sharp.</p>
                <p className="di-page-subtitle">Need to adjust billing? Reach out to support@blazesportsintel.com.</p>
              </>
            ) : session ? (
              <>
                <p>Upgrade to unlock premium telemetry, recruiting signals, and collaborative scouting workspaces.</p>
                <div className="di-card-grid">
                  {upgradePlans.map((plan) => (
                    <form key={plan.value} action={startDiamondProCheckout} className="di-card di-card--gated">
                      <h3>{plan.headline}</h3>
                      <p className="di-page-subtitle">{plan.summary}</p>
                      <p className="di-pill">{plan.price}</p>
                      <input type="hidden" name="billingInterval" value={plan.value} />
                      <button type="submit" className="di-action" style={{ marginTop: '1rem' }}>
                        Start {plan.value === 'annual' ? 'Annual' : 'Monthly'} Checkout
                      </button>
                    </form>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>Sign in to launch the Diamond Pro upgrade flow and unlock premium features.</p>
                <Link className="di-action" href="/auth/login?returnTo=/account">
                  Sign in to Upgrade
                </Link>
              </>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
