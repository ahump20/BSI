'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <main className="di-auth-shell">
        <section className="di-auth-card">
          <span className="di-badge">Diamond Insights</span>
          <h1 className="di-page-title">Sign up unavailable</h1>
          <p className="di-card-subtitle">
            Provision NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable hosted sign-up. Until then, use the contact form to
            request access.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="di-auth-shell">
      <section className="di-auth-card" aria-label="Create your Diamond Insights account">
        <SignUp
          routing="path"
          path="/auth/sign-up"
          signInUrl="/auth/sign-in"
          afterSignUpUrl="/account"
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
