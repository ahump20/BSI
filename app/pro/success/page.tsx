'use client';

/**
 * /pro/success — API Key Display
 *
 * Landing page after a Stripe Payment Link checkout completes.
 * Calls /api/key/from-session to retrieve the API key provisioned by the webhook.
 *
 * The key is shown once (1-hour reveal TTL in KV). After that, users must
 * check their email or contact Austin@BlazeSportsIntel.com.
 *
 * Configure in Stripe Dashboard → Payment Links → each link's confirmation page:
 *   https://blazesportsintel.com/pro/success?session_id={CHECKOUT_SESSION_ID}
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeyFromSessionResponse {
  tier?: string;
  api_key?: string | null;
  error?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mx-auto mb-4" />
            <p className="text-text-secondary">Activating your subscription…</p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Key display block
// ---------------------------------------------------------------------------

function ApiKeyDisplay({ apiKey, tier }: { apiKey: string; tier: string }) {
  const [copied, setCopied] = useState(false);

  const tierLabel =
    tier === 'api' ? 'Data API' : tier === 'embed' ? 'Embed License' : 'Pro';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-text-tertiary text-xs uppercase tracking-widest mb-2 font-display">
          BSI {tierLabel} API Key
        </p>
        <div className="relative">
          <pre
            className="bg-midnight text-burnt-orange font-mono text-sm p-4 rounded-lg border border-burnt-orange/20 overflow-x-auto whitespace-pre-wrap break-all"
          >
            {apiKey}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-charcoal hover:bg-surface-raised text-text-secondary transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-burnt-orange/10 border border-burnt-orange/30 rounded-lg p-4 text-sm text-burnt-orange">
        <strong>Save this key now — it won&apos;t be shown again.</strong>
        <br />
        It was also sent to your email.
      </div>

      <div className="bg-charcoal rounded-lg p-4 text-sm text-text-secondary space-y-2">
        <p>
          <span className="text-white font-semibold">Usage:</span> include as{' '}
          <code className="bg-midnight px-1.5 py-0.5 rounded text-burnt-orange font-mono text-xs">
            X-BSI-Key
          </code>{' '}
          in every API request header.
        </p>
        <pre className="bg-midnight text-text-tertiary font-mono text-xs p-3 rounded mt-2 overflow-x-auto">
{`curl https://blazesportsintel.com/api/premium/live/tex-lam-20260217 \\
  -H "X-BSI-Key: ${apiKey.slice(0, 16)}..."`}
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ready' | 'expired' | 'error'>('loading');
  const [tier, setTier] = useState<string>('pro');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No session ID found. Did you come from a Stripe checkout?');
      return;
    }

    fetch(`/api/key/from-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json() as Promise<KeyFromSessionResponse>)
      .then((data) => {
        if (data.error) {
          setStatus('error');
          setErrorMessage(data.error);
          return;
        }
        setTier(data.tier ?? 'pro');
        if (data.api_key) {
          setApiKey(data.api_key);
          setStatus('ready');
        } else {
          // Key was provisioned but reveal TTL already expired
          setStatus('expired');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Failed to retrieve your API key. Your subscription is active — check your email.');
      });
  }, [searchParams]);

  if (status === 'loading') {
    return <LoadingState />;
  }

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container center>
            <Card padding="lg" className="max-w-xl mx-auto">
              {status === 'ready' && apiKey && (
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
                  <h1 className="font-display text-3xl font-bold uppercase tracking-display text-center mb-2">
                    You&apos;re In
                  </h1>
                  <p className="text-text-secondary text-center text-sm mb-8">
                    BSI {tier === 'api' ? 'Data API' : tier === 'embed' ? 'Embed License' : 'Pro'} is active.
                  </p>

                  <ApiKeyDisplay apiKey={apiKey} tier={tier} />

                  <div className="mt-8 space-y-3">
                    <Link href="/college-baseball">
                      <Button variant="primary" size="lg" className="w-full">
                        Start Exploring
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="secondary" size="lg" className="w-full">
                        Go to Dashboard
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {status === 'expired' && (
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
                  <h1 className="font-display text-3xl font-bold uppercase tracking-display text-center mb-4">
                    Subscription Active
                  </h1>
                  <p className="text-text-secondary text-center mb-4">
                    Your BSI {tier === 'api' ? 'Data API' : tier === 'embed' ? 'Embed License' : 'Pro'} subscription
                    is active — your API key was sent to your email.
                  </p>
                  <p className="text-text-tertiary text-sm text-center mb-8">
                    Didn&apos;t get it? Check spam or contact{' '}
                    <a
                      href="mailto:Austin@BlazeSportsIntel.com"
                      className="text-burnt-orange hover:text-ember"
                    >
                      Austin@BlazeSportsIntel.com
                    </a>
                  </p>
                  <div className="space-y-3">
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
                  <h1 className="font-display text-3xl font-bold uppercase tracking-display text-center mb-4">
                    Something Went Wrong
                  </h1>
                  <p className="text-text-secondary text-center mb-4">
                    {errorMessage ?? "We couldn't retrieve your API key."}
                  </p>
                  <p className="text-text-tertiary text-sm text-center mb-8">
                    If you were charged, your subscription is active — your key was emailed.
                    Contact{' '}
                    <a
                      href="mailto:Austin@BlazeSportsIntel.com"
                      className="text-burnt-orange hover:text-ember"
                    >
                      Austin@BlazeSportsIntel.com
                    </a>
                  </p>
                  <div className="space-y-3">
                    <Link href="/pro">
                      <Button variant="primary" size="lg" className="w-full">
                        Back to Plans
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
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function ProSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  );
}
