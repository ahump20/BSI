'use client';

import dynamic from 'next/dynamic';

// Non-critical layout components — lazy-loaded to reduce initial JS bundle.
// These are interactive-only and produce no meaningful SSR HTML.
const CommandPalette = dynamic(() => import('@/components/layout-ds/CommandPalette').then(m => ({ default: m.CommandPalette })), { ssr: false });
const KonamiCodeWrapper = dynamic(() => import('@/components/easter-eggs').then(m => ({ default: m.KonamiCodeWrapper })), { ssr: false });
const FeedbackButton = dynamic(() => import('@/components/ui/FeedbackModal').then(m => ({ default: m.FeedbackButton })), { ssr: false });
const ScrollToTopButton = dynamic(() => import('@/components/ui/ScrollToTopButton').then(m => ({ default: m.ScrollToTopButton })), { ssr: false });
const ScrollProgress = dynamic(() => import('@/components/ui/ScrollProgress').then(m => ({ default: m.ScrollProgress })), { ssr: false });

export function LazyLayoutExtras() {
  return (
    <>
      <ScrollProgress />
      <CommandPalette />
      <KonamiCodeWrapper />
      <FeedbackButton />
      <ScrollToTopButton />
    </>
  );
}
