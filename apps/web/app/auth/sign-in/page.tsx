'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <main className="di-auth-shell">
        <section className="di-auth-card">
          <span className="di-badge">Diamond Insights</span>
          <h1 className="di-page-title">Sign in unavailable</h1>
          <p className="di-card-subtitle">
            Authentication keys are not configured in this environment. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY via Vercel or
            Cloudflare secrets to enable live sign-in.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="di-auth-shell">
      <section className="di-auth-card" aria-label="Sign in to Diamond Insights">
        <SignIn
          routing="path"
          path="/auth/sign-in"
          signUpUrl="/auth/sign-up"
          afterSignInUrl="/account"
          appearance={{
            variables: {
              colorBackground: 'rgba(17, 24, 39, 0.85)',
              colorInputBackground: '#0b1120',
              colorPrimary: '#fbbf24',
              borderRadius: '18px'
            }
          }}
        />
      </section>
    </main>
  );
}
