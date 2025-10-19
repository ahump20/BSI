import { SignIn } from '@clerk/nextjs';

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  return (
    <main className="di-page">
      <section className="di-section di-auth">
        <span className="di-kicker">Diamond Insights · Auth</span>
        <h1 className="di-page-title">Sign In</h1>
        <p className="di-page-subtitle">
          Access your personalized watchlists, alert preferences, and Diamond Pro tools with secure Clerk authentication.
        </p>
        <div className="di-auth-card">
          {hasClerkKey ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'di-card di-card--surface',
                  card: 'di-auth-card-inner'
                }
              }}
              routing="hash"
            />
          ) : (
            <article className="di-card">
              <h2>Authentication is provisioning</h2>
              <p className="di-text-muted">
                Clerk keys are not configured in this environment. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable the hosted sign in experience.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
