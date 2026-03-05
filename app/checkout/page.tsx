'use client';

/**
 * Stripe Embedded Checkout Page
 *
 * Renders the Stripe Checkout form using embedded mode.
 * Expects `client_secret` query parameter from pricing page redirect.
 *
 * Last Updated: 2025-01-07
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// Initialize Stripe outside component to avoid recreating on re-renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <>
      <div>
        <Section padding="lg" className="pt-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mx-auto mb-4" />
            <p className="text-text-secondary">Loading checkout...</p>
          </div>
        </Section>
      </div>
      <Footer />
    </>
  );
}

// ============================================================================
// Error State
// ============================================================================

function ErrorState({ message }: { message: string }) {
  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container center>
            <ScrollReveal direction="up">
              <Card padding="lg" className="max-w-lg mx-auto text-center">
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
                <h1 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
                  Checkout Error
                </h1>
                <p className="text-text-secondary mb-8">{message}</p>
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
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}

// ============================================================================
// Checkout Content
// ============================================================================

function CheckoutContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const clientSecret = searchParams.get('client_secret');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Validate client secret format
  useEffect(() => {
    // Skip validation when returning from Stripe with session_id
    if (sessionId && !clientSecret) return;

    if (!clientSecret) {
      setError('No checkout session found. Please select a plan from pricing.');
      return;
    }

    // Stripe client secrets follow pattern: cs_xxx_secret_xxx
    if (!clientSecret.includes('_secret_')) {
      setError('Invalid checkout session. Please try again from pricing.');
      return;
    }

    setIsReady(true);
  }, [clientSecret, sessionId]);

  // Callback for EmbeddedCheckoutProvider
  const fetchClientSecret = useCallback(async () => {
    // Client secret already provided via URL param
    return clientSecret as string;
  }, [clientSecret]);

  // Post-payment return from Stripe — redirect to the verified return page
  if (sessionId && !clientSecret) {
    if (typeof window !== 'undefined') {
      window.location.href = `/checkout/return/?session_id=${sessionId}`;
    }
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // Loading until ready
  if (!isReady || !clientSecret) {
    return <LoadingState />;
  }

  // Render checkout
  return (
    <>
      <div>
        <Section padding="lg" className="pt-6 min-h-screen">
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mb-2">
                    Complete Your <span className="text-gradient-blaze">Subscription</span>
                  </h1>
                  <p className="text-text-secondary">Secure checkout powered by Stripe</p>
                </div>

                {/* Stripe Embedded Checkout */}
                <Card padding="none" className="overflow-hidden">
                  <div className="bg-white rounded-lg min-h-[500px]">
                    <EmbeddedCheckoutProvider
                      stripe={stripePromise}
                      options={{ fetchClientSecret }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
                </Card>

                {/* Security Note */}
                <p className="text-text-tertiary text-xs text-center mt-6">
                  Your payment information is encrypted and secure. We never store your card
                  details.
                </p>

                {/* Back Link */}
                <div className="text-center mt-4">
                  <Link
                    href="/pricing"
                    className="text-burnt-orange hover:text-ember transition-colors text-sm"
                  >
                    ← Back to pricing
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}

// ============================================================================
// Page Export
// ============================================================================

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutContent />
    </Suspense>
  );
}
