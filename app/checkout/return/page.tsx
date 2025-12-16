'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'College Baseball', href: '/college-baseball' },
];

function LoadingState() {
  return (
    <>
      <Navbar items={navItems} />
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mx-auto mb-4"></div>
            <p className="text-text-secondary">Confirming your subscription...</p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'cancelled'>('loading');

  useEffect(() => {
    const sessionStatus = searchParams.get('status');
    if (sessionStatus === 'success') {
      setStatus('success');
    } else {
      setStatus('cancelled');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return <LoadingState />;
  }

  return (
    <>
      <Navbar items={navItems} />
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container center>
            <ScrollReveal direction="up">
              <Card padding="lg" className="max-w-lg mx-auto text-center">
                {status === 'success' ? (
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
                    <p className="text-text-secondary mb-8">
                      Your subscription is active. You now have full access to Blaze Sports Intel.
                    </p>
                    <div className="space-y-4">
                      <Link href="/dashboard">
                        <Button variant="primary" size="lg" className="w-full">
                          Go to Dashboard
                        </Button>
                      </Link>
                      <Link href="/college-baseball">
                        <Button variant="secondary" size="lg" className="w-full">
                          Explore College Baseball
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
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
                      No worries - your checkout was cancelled and you were not charged.
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
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutReturnContent />
    </Suspense>
  );
}
