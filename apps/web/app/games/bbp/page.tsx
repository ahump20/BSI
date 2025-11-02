'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { recordRuntimeEvent } from '../../../lib/observability/datadog-runtime';

const GAME_BUNDLE_PATH = '/games/bbp-web/index.html';

type SessionEvent = {
  source?: string;
  type?: 'session:start' | 'session:update' | 'session:end';
  payload?: Record<string, unknown>;
};

export default function BackyardBlazeBallPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const handleSessionEvent = useCallback(async (event: MessageEvent<SessionEvent>) => {
    if (!event.data || event.data.source !== 'bbp-web' || !event.data.type) return;
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return;
    await recordRuntimeEvent(`bbp_${event.data.type}`, { route: '/games/bbp' }, event.data.payload ?? {});
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    window.addEventListener('message', handleSessionEvent as EventListener);
    return () => window.removeEventListener('message', handleSessionEvent as EventListener);
  }, [hasStarted, handleSessionEvent]);

  const launchCopy = useMemo(
    () =>
      prefersReducedMotion
        ? 'Launch minimal mode'
        : 'Play Backyard Blaze Ball',
    [prefersReducedMotion]
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live Sandlot Build
        </p>
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Backyard Blaze Ball</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Thumb-primed, three-inning baseball built in Phaser. Tap once to swing, chase runs, and watch the postMessage analytics
          roll into our observability stack.
        </p>
      </header>

      <section className="space-y-4">
        {!hasStarted ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-6 text-center shadow-inner shadow-slate-900/60">
            <p className="text-sm text-slate-200">
              We keep the Phaser bundle off the critical path. Tap when you&apos;re ready—assets stream from Cloudflare edge cache and
              run isolated inside an iframe so the rest of BlazeSportsIntel stays fast.
            </p>
            <button
              type="button"
              onClick={() => setHasStarted(true)}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              {launchCopy}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-lg shadow-slate-950/60">
              {!iframeReady && (
                <div className="flex h-[520px] w-full flex-col items-center justify-center gap-3 text-slate-200">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                  <p className="text-sm">Loading Backyard Blaze Ball…</p>
                  <p className="text-xs text-slate-400">Bundle &lt; 250KB, fully cached at the edge.</p>
                </div>
              )}
              <iframe
                title="Backyard Blaze Ball"
                src={GAME_BUNDLE_PATH}
                loading="lazy"
                className="h-[640px] w-full border-0"
                onLoad={() => setIframeReady(true)}
                aria-label="Backyard Blaze Ball game iframe"
              />
            </div>
            <p className="text-xs text-slate-400">
              Tip: rotate to landscape for more plate coverage. Analytics respect Do Not Track and only capture anonymous session
              timing.
            </p>
          </div>
        )}
      </section>

      <footer className="flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Need provenance or licensing details?{' '}
          <Link className="text-amber-300 underline underline-offset-4" href="/games/bbp/legal">
            Read the legal brief
          </Link>
          .
        </span>
        <span>Version 0.1.0 – Phaser web, Godot native track ready.</span>
      </footer>
    </main>
  );
}
