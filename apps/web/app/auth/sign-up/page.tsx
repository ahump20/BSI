import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="di-page">
      <section className="di-section di-auth">
        <span className="di-kicker">Diamond Insights · Auth</span>
        <h1 className="di-page-title">Create Account</h1>
        <p className="di-page-subtitle">
          Registration flows are nearly online. This placeholder maintains the URL structure and dark-mode design while we hook
          Clerk onboarding, Stripe trials, and paywall states.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Diamond Pro Access</h2>
            <p>Expect gated content, staff collaboration spaces, and live alert configuration post sign-up.</p>
            <ul className="di-list">
              <li>Choose between Free and Diamond Pro tiers.</li>
              <li>Invite teammates with shared permissions.</li>
              <li>Sync saved boards to mobile devices.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Already have an account?</h2>
            <p>Jump back to the sign-in flow.</p>
            <ul className="di-list">
              <li>
                <Link className="di-inline-link" href="/auth/sign-in">
                  Sign in to Diamond Insights
                </Link>
              </li>
              <li>
                <Link className="di-inline-link" href="/account">
                  Manage existing settings
                </Link>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
