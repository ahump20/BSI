import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="di-page">
      <section className="di-section di-auth">
        <span className="di-kicker">Diamond Insights · Auth</span>
        <h1 className="di-page-title">Sign In</h1>
        <p className="di-page-subtitle">
          Clerk integration is in progress. While we finish hooking up the auth provider, this placeholder keeps the route,
          messaging, and responsive design intact.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Next Steps</h2>
            <p>Diamond Pro members will authenticate here to access premium scouting tools.</p>
            <ul className="di-list">
              <li>Secure magic links and passkeys.</li>
              <li>Multi-factor enrollment for staff accounts.</li>
              <li>Session management synced across devices.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Need an Account?</h2>
            <p>Choose an action below.</p>
            <ul className="di-list">
              <li>
                <Link className="di-inline-link" href="/auth/sign-up">
                  Create a Diamond Insights account
                </Link>
              </li>
              <li>
                <Link className="di-inline-link" href="/account">
                  Return to Account Center
                </Link>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
