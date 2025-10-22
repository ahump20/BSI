import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <main className="di-page">
        <section className="di-section di-auth">
          <span className="di-kicker">Diamond Insights · Auth</span>
          <h1 className="di-page-title">Create Account</h1>
          <p className="di-page-subtitle">
            Clerk credentials are not configured. Supply NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to activate the hosted sign-up
            experience.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="di-page">
      <section className="di-section di-auth">
        <span className="di-kicker">Diamond Insights · Auth</span>
        <h1 className="di-page-title">Create Account</h1>
        <p className="di-page-subtitle">
          Join the Diamond Insights roster to track college baseball with pro-grade context and unlock Diamond Pro upgrades.
        </p>
        <div className="di-card di-auth-card">
          <SignUp
            path="/auth/sign-up"
            routing="path"
            signInUrl="/auth/sign-in"
            appearance={{
              elements: {
                card: 'di-card di-auth-widget',
                headerTitle: 'di-page-title',
                headerSubtitle: 'di-page-subtitle'
              }
            }}
            afterSignUpUrl="/account"
          />
        </div>
      </section>
    </main>
  );
}
