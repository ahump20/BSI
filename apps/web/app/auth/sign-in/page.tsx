import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <main className="di-page">
        <section className="di-section di-auth">
          <span className="di-kicker">Diamond Insights · Auth</span>
          <h1 className="di-page-title">Sign In</h1>
          <p className="di-page-subtitle">
            Authentication is offline while Clerk environment keys are missing. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable
            sign-in flows.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="di-page">
      <section className="di-section di-auth">
        <span className="di-kicker">Diamond Insights · Auth</span>
        <h1 className="di-page-title">Sign In</h1>
        <p className="di-page-subtitle">
          Log into Diamond Insights to sync your scouting boards, manage alerts, and unlock Diamond Pro automation.
        </p>
        <div className="di-card di-auth-card">
          <SignIn
            path="/auth/sign-in"
            routing="path"
            signUpUrl="/auth/sign-up"
            appearance={{
              elements: {
                card: 'di-card di-auth-widget',
                headerTitle: 'di-page-title',
                headerSubtitle: 'di-page-subtitle'
              }
            }}
            afterSignInUrl="/account"
          />
        </div>
      </section>
    </main>
  );
}
