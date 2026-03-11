'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

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
      });

      const data = (await response.json()) as { valid?: boolean; error?: string };

      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'Invalid API key');
      }

      // Store key and redirect to dashboard
      localStorage.setItem('bsi-api-key', trimmedKey);
      window.location.href = '/dashboard';
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Invalid API key');
    } finally {
      setKeyLoading(false);
    }
  };

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6 min-h-screen relative overflow-hidden">
          {/* Branded background treatment */}
          <HeroGlow shape="80% 60%" position="50% 0%" intensity={0.08} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

          <Container>
            <div className="max-w-md mx-auto">
              <ScrollReveal direction="up">
                <div className="text-center mb-10">
                  <span className="section-label block mb-3">
                    Subscriber Access
                  </span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mb-3">
                    Welcome <span className="text-gradient-blaze">Back</span>
                  </h1>
                  <p className="text-text-secondary">
                    Sign in with your BSI API key to access pro-tier analytics, Savant leaderboards, and game intelligence.
                  </p>
                </div>
              </ScrollReveal>

              {/* Section 1: Send My Key */}
              <ScrollReveal direction="up" delay={80}>
                <Card padding="lg" className="mb-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-1">
                    Need Your Key?
                  </h2>
                  <p className="text-text-tertiary text-sm mb-4">
                    Enter your email and we&apos;ll resend your API key.
                  </p>

                  <form onSubmit={handleSendKey} className="space-y-4">
                    {emailError && (
                      <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                        {emailError}
                      </div>
                    )}
                    {emailMessage && (
                      <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
                        {emailMessage}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-text-secondary mb-2"
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="secondary"
                      size="md"
                      className="w-full"
                      disabled={emailLoading}
                    >
                      {emailLoading ? 'Sending...' : 'Send My Key'}
                    </Button>
                  </form>
                </Card>
              </ScrollReveal>

              {/* Section 2: I Have My Key */}
              <ScrollReveal direction="up" delay={140}>
                <Card padding="lg">
                  <h2 className="text-lg font-semibold text-text-primary mb-1">
                    Have Your Key?
                  </h2>
                  <p className="text-text-tertiary text-sm mb-4">
                    Paste your API key to access the dashboard.
                  </p>

                  <form onSubmit={handleValidateKey} className="space-y-4">
                    {keyError && (
                      <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                        {keyError}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="api-key"
                        className="block text-sm font-medium text-text-secondary mb-2"
                      >
                        API Key
                      </label>
                      <Input
                        id="api-key"
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        required
                        autoComplete="off"
                        className="font-mono text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={keyLoading}
                    >
                      {keyLoading ? 'Validating...' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-text-tertiary text-sm">
                      Don&apos;t have an account?{' '}
                      <Link
                        href="/pricing"
                        className="text-burnt-orange hover:text-ember transition-colors font-semibold"
                      >
                        Subscribe
                      </Link>
                    </p>
                  </div>
                </Card>
              </ScrollReveal>

              {/* Trust signals */}
              <ScrollReveal direction="up" delay={200}>
                <div className="mt-8 flex items-center justify-center gap-6 text-text-muted">
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
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
