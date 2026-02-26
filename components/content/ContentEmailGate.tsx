'use client';

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { trackPaywallHit, trackEmailSignup, detectSport } from '@/lib/analytics/tracker';

interface ContentEmailGateProps {
  children: ReactNode;
  /** When true, gates content behind email capture. Default: false (shows everything). */
  gated?: boolean;
  /** Sport context for analytics tagging. Auto-detected from URL if omitted. */
  sport?: string;
  /** Content type for analytics. */
  contentType?: string;
}

type GateState = 'idle' | 'loading' | 'success' | 'error';

/**
 * ContentEmailGate — scaffolding for the Day 75 email-gating experiment.
 *
 * When `gated={false}` (default), renders children directly — no gate.
 * When `gated={true}`, shows the first ~30% of content as a teaser,
 * then an email capture form, and hides the rest until email is captured.
 *
 * Checks localStorage for `bsi_email_captured` to skip gate for returning users.
 * Fires `paywall_hit` when gate is shown, `email_signup` on form submission.
 */
export function ContentEmailGate({
  children,
  gated = false,
  sport,
  contentType,
}: ContentEmailGateProps) {
  const [captured, setCaptured] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<GateState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [gateFired, setGateFired] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCaptured(localStorage.getItem('bsi_email_captured') === 'true');
    }
  }, []);

  // Fire paywall_hit once when gate is actually shown
  useEffect(() => {
    if (gated && !captured && !gateFired) {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      trackPaywallHit(path, sport ?? detectSport(path), contentType);
      setGateFired(true);
    }
  }, [gated, captured, gateFired, sport, contentType]);

  // Not gated or already captured — show everything
  if (!gated || captured) {
    return <>{children}</>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Enter a valid email.');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent: true, source: 'content-gate' }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed. Try again.');
        setState('error');
        return;
      }

      localStorage.setItem('bsi_email_captured', 'true');
      setCaptured(true);
      setState('success');

      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      trackEmailSignup(sport ?? detectSport(path));
    } catch {
      setErrorMsg('Network error. Try again.');
      setState('error');
    }
  }

  return (
    <div className="relative">
      {/* Teaser — first ~30% of content with gradient fade */}
      <div className="max-h-[40vh] overflow-hidden relative">
        {children}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-midnight to-transparent pointer-events-none" />
      </div>

      {/* Email gate */}
      <div className="relative -mt-8 bg-midnight border border-border rounded-xl p-6 md:p-8 text-center">
        <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-display text-text-primary mb-2">
          Continue Reading
        </h3>
        <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
          Get full access to BSI analysis and intel drops. Free — just enter your email.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="flex-1 min-w-0 bg-surface-light border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-burnt-orange/50 transition-colors"
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="shrink-0 bg-gradient-to-r from-burnt-orange to-burnt-orange/80 hover:from-burnt-orange/90 hover:to-burnt-orange text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          >
            {state === 'loading' ? 'Joining...' : 'Unlock'}
          </button>
        </form>

        {state === 'error' && errorMsg && (
          <p className="text-xs text-red-400 mt-3">{errorMsg}</p>
        )}

        <p className="text-[11px] text-text-muted mt-4">
          No spam. College baseball intel first. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
