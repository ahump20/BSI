'use client';

/**
 * Stripe Checkout Return Page
 *
 * Handles the return from Stripe embedded checkout.
 * Verifies session status via API and displays appropriate result.
 *
 * Last Updated: 2025-01-07
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ============================================================================
// Types
// ============================================================================

interface SessionStatusResponse {
  status: 'complete' | 'open' | 'expired';
  customer_email: string | null;
  subscription_id: string | null;
  tier: string | null;
  payment_status: string;
  error?: string;
}

type CheckoutStatus = 'loading' | 'success' | 'cancelled' | 'error';

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mx-auto mb-4" />
            <p className="text-text-secondary">Confirming your subscription...</p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

// ============================================================================
// Checkout Return Content
// ============================================================================

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    // No session ID means checkout was likely cancelled
    if (!sessionId) {
      setStatus('cancelled');
      return;
    }

    // Verify session with backend
    async function verifySession() {
      try {
        const response = await fetch(`/api/stripe/session-status?session_id=${sessionId}`);
        const data: SessionStatusResponse = await response.json();

        if (data.error) {
          setStatus('error');
          setErrorMessage(data.error);
          return;
        }

        if (data.status === 'complete') {
          setStatus('success');
          setCustomerEmail(data.customer_email);
          setTier(data.tier);
        } else if (data.status === 'open') {
          // Session still open - redirect back to checkout
          router.push('/checkout');
        } else {
          // Expired or other status
          setStatus('cancelled');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Failed to verify your subscription. Please contact support.');
      }
    }

    verifySession();
  }, [searchParams, router]);

  if (status === 'loading') {
    return <LoadingState />;
  }

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container center>
            <ScrollReveal direction="up">
              <Card padding="lg" className="max-w-lg mx-auto text-center">
                {status === 'success' && (
                  <>
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-8 h-8 text-success"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-display mb-4">
                      Welcome to <span className="text-gradient-blaze">BSI</span>
                    </h1>
                    <p className="text-text-secondary mb-2">
                      Your {tier === 'enterprise' ? 'Enterprise' : 'Pro'} subscription is now
                      active.
                    </p>
                    {customerEmail && (
                      <p className="text-text-tertiary text-sm mb-4">
                        Your API key has been sent to {customerEmail}. Use it to access your dashboard.
                      </p>
                    )}
                    {tier === 'pro' && (
                      <div className="bg-burnt-orange/10 border border-burnt-orange/30 rounded-lg p-4 mb-6">
                        <p className="text-burnt-orange text-sm">
                          Your 14-day free trial has started. You won&apos;t be charged until the trial
                          ends.
                        </p>
                      </div>
                    )}
                    <div className="bg-charcoal/50 border border-white/10 rounded-lg p-4 mb-8">
                      <p className="text-text-secondary text-sm">
                        Check your inbox for an email from BSI with your API key.
                        Enter it on the login page to access your dashboard.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <Link href="/auth/login">
                        <Button variant="primary" size="lg" className="w-full">
                          Enter My Key
                        </Button>
                      </Link>
                      <Link href="/college-baseball">
                        <Button variant="secondary" size="lg" className="w-full">
                          Explore College Baseball
                        </Button>
                      </Link>
                    </div>
                  </>
                )}

                {status === 'cancelled' && (
                  <>
                    <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-8 h-8 text-warning"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-display mb-4">
                      Checkout <span className="text-text-tertiary">Cancelled</span>
                    </h1>
                    <p className="text-text-secondary mb-8">
                      No worries—your checkout was cancelled and you were not charged.
                    </p>
                    <div className="space-y-4">
                      <Link href="/pricing">
                        <Button variant="primary" size="lg" className="w-full">
                          Back to Pricing
                        </Button>
                      </Link>
                      <Link href="/">
                        <Button variant="secondary" size="lg" className="w-full">
                          Go Home
                        </Button>
                      </Link>
                    </div>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-8 h-8 text-error"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    </div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-display mb-4">
                      Something <span className="text-error">Went Wrong</span>
                    </h1>
                    <p className="text-text-secondary mb-4">
                      {errorMessage || "We couldn't verify your subscription."}
                    </p>
                    <p className="text-text-tertiary text-sm mb-8">
                      If you were charged, please contact{' '}
                      <a
                        href="mailto:Austin@blazesportsintel.com"
                        className="text-burnt-orange hover:text-ember"
                      >
                        Austin@blazesportsintel.com
                      </a>
                    </p>
                    <div className="space-y-4">
                      <Link href="/pricing">
                        <Button variant="primary" size="lg" className="w-full">
                          Try Again
                        </Button>
                      </Link>
                      <Link href="/">
                        <Button variant="secondary" size="lg" className="w-full">
                          Go Home
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

// ============================================================================
// Page Export
// ============================================================================

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutReturnContent />
    </Suspense>
  );
}
