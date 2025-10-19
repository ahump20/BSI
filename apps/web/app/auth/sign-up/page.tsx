import { SignUp } from '@clerk/nextjs';

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <main className="di-page">
      <section className="di-section di-auth">
        <span className="di-kicker">Diamond Insights · Auth</span>
        <h1 className="di-page-title">Create Account</h1>
        <p className="di-page-subtitle">
          Join Blaze Sports Intel to sync watchlists, configure alerts, and collaborate with your Diamond Pro staff.
        </p>
        <div className="di-auth-card">
          {hasClerkKey ? (
            <SignUp
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
              <h2>Sign-up is nearly ready</h2>
              <p className="di-text-muted">
                Provide NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to activate hosted onboarding and Diamond Pro enrollment flows.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
