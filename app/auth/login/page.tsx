'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

export default function LoginPage() {
  // --- Send My Key section ---
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  // --- I Have My Key section ---
  const [apiKey, setApiKey] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState('');

  const handleSendKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError('');
    setEmailMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        signal: AbortSignal.timeout(8000),
      });

      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send key');
      }

      setEmailMessage(data.message || 'API key sent to your email.');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send key');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleValidateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyLoading(true);
    setKeyError('');

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setKeyError('Please enter your API key.');
      setKeyLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: { 'X-BSI-Key': trimmedKey },
        signal: AbortSignal.timeout(8000),
      });

      const data = (await response.json()) as { valid?: boolean; error?: string };

      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'That key didn\'t work — double-check and try again');
      }

      // Store key and redirect to dashboard
      localStorage.setItem('bsi-api-key', trimmedKey);
      window.location.href = '/dashboard';
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'That key didn\'t work — double-check and try again');
    } finally {
      setKeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen grain-overlay bg-surface-scoreboard text-bsi-bone">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        {/* Ember glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(191, 87, 0, 0.06) 0%, transparent 60%)' }}
          aria-hidden="true"
        />

        <div className="max-w-md mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <span className="heritage-stamp mb-4">Subscriber Access</span>
              <h1
                className="mt-4 font-bold uppercase tracking-tight leading-none mb-4"
                style={{
                  fontFamily: 'var(--bsi-font-display-hero)',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  color: 'var(--bsi-bone)',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                }}
              >
                Welcome <span style={{ color: 'var(--bsi-primary)' }}>Back</span>
              </h1>
              <div className="flex justify-center mb-6">
                <div className="section-rule-thick w-12" />
              </div>
              <p className="font-serif italic text-base leading-relaxed text-bsi-dust">
                Sign in with your BSI key to access pro-tier analytics, Savant leaderboards, and game intelligence.
              </p>
            </div>
          </ScrollReveal>

          {/* Section 1: Send My Key */}
          <ScrollReveal direction="up" delay={80}>
            <div className="heritage-card p-6 mb-6">
              <h2
                className="text-lg font-bold uppercase tracking-wide mb-1"
                style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
              >
                Need Your Key?
              </h2>
              <p className="text-sm font-serif mb-4 text-bsi-dust">
                Enter your email and we&apos;ll resend your key.
              </p>

              <form onSubmit={handleSendKey} className="space-y-4">
                {emailError && (
                  <div
                    className="p-3 text-sm"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.20)',
                      borderRadius: '2px',
                      color: 'var(--bsi-error)',
                    }}
                  >
                    {emailError}
                  </div>
                )}
                {emailMessage && (
                  <div
                    className="p-3 text-sm"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '2px',
                      color: 'var(--bsi-success)',
                    }}
                  >
                    {emailMessage}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2 text-bsi-dust"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2.5 transition-colors focus:outline-none"
                    style={{
                      background: 'var(--surface-dugout)',
                      border: '1px solid var(--border-vintage)',
                      borderRadius: '2px',
                      color: 'var(--bsi-bone)',
                      fontFamily: 'var(--bsi-font-body)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bsi-primary)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-vintage)'; }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-heritage w-full px-6 py-3"
                  disabled={emailLoading}
                >
                  {emailLoading ? 'Sending...' : 'Send My Key'}
                </button>
              </form>
            </div>
          </ScrollReveal>

          {/* Section 2: I Have My Key */}
          <ScrollReveal direction="up" delay={140}>
            <div className="heritage-card p-6" style={{ borderTop: '3px solid var(--bsi-primary)' }}>
              <h2
                className="text-lg font-bold uppercase tracking-wide mb-1"
                style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
              >
                Have Your Key?
              </h2>
              <p className="text-sm font-serif mb-4 text-bsi-dust">
                Paste your key to access the dashboard.
              </p>

              <form onSubmit={handleValidateKey} className="space-y-4">
                {keyError && (
                  <div
                    className="p-3 text-sm"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.20)',
                      borderRadius: '2px',
                      color: 'var(--bsi-error)',
                    }}
                  >
                    {keyError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="api-key"
                    className="block text-sm font-medium mb-2 text-bsi-dust"
                  >
                    API Key
                  </label>
                  <input
                    id="api-key"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    required
                    autoComplete="off"
                    className="w-full px-4 py-2.5 transition-colors focus:outline-none"
                    style={{
                      background: 'var(--surface-dugout)',
                      border: '1px solid var(--border-vintage)',
                      borderRadius: '2px',
                      color: 'var(--bsi-bone)',
                      fontFamily: 'var(--bsi-font-data)',
                      fontSize: '0.875rem',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bsi-primary)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-vintage)'; }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-heritage-fill w-full px-6 py-3"
                  disabled={keyLoading}
                >
                  {keyLoading ? 'Validating...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm font-serif text-bsi-dust">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/pricing"
                    className="transition-colors font-semibold text-bsi-primary"
                  >
                    Subscribe
                  </Link>
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Trust signals */}
          <ScrollReveal direction="up" delay={200}>
            <div className="mt-8 flex items-center justify-center gap-6" style={{ color: 'var(--bsi-dust)', opacity: 0.6 }}>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-xs">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-xs">No passwords</span>
              </div>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-xs">Stripe-backed</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
