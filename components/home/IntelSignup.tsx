'use client';

import { useState, type FormEvent } from 'react';
import { trackEmailSignup } from '@/lib/analytics/tracker';

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface IntelSignupProps {
  /** Sport context for analytics tagging. Defaults to auto-detect from URL. */
  sport?: string;
  /** Optional callback after successful signup */
  onSignup?: () => void;
}

/**
 * IntelSignup — email capture form for content pages.
 * Posts to existing /api/newsletter endpoint.
 * Fires trackEmailSignup with sport context on success.
 */
export function IntelSignup({ sport, onSignup }: IntelSignupProps = {}) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, source: 'intel-signup' }),
      });

      const data = await res.json() as { error?: string; success?: boolean };

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Subscription failed. Try again.');
        setState('error');
        return;
      }

      setState('success');
      setEmail('');
      trackEmailSignup(sport);
      onSignup?.();
    } catch {
      setErrorMsg('Network error. Try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="glass-default rounded-xl p-4 border border-green-500/20 mb-4">
        <p className="text-sm text-green-400 font-medium">You&apos;re in.</p>
        <p className="text-xs text-text-muted mt-1">Roster-market intelligence, delivered first.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-default rounded-xl p-4 border border-border-subtle mb-4">
      <p className="text-sm font-display text-text-primary uppercase tracking-wide mb-3">
        Get Portal &amp; Draft Intel
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          className="flex-1 min-w-0 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-burnt-orange/50 transition-colors"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="shrink-0 bg-gradient-to-r from-burnt-orange to-burnt-orange/80 hover:from-burnt-orange/90 hover:to-burnt-orange text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50"
        >
          {state === 'loading' ? '...' : 'Subscribe'}
        </button>
      </div>

      <label className="flex items-center gap-2 mt-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="rounded border-border-strong bg-surface-light text-burnt-orange focus:ring-burnt-orange/50 h-3.5 w-3.5"
        />
        <span className="text-[11px] text-text-muted">Portal &amp; draft intelligence — I agree to receive emails</span>
      </label>

      {state === 'error' && errorMsg && (
        <p className="text-xs text-red-400 mt-2">{errorMsg}</p>
      )}
    </form>
  );
}
