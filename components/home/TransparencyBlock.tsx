/**
 * TransparencyBlock — "How BSI Stays Accurate" trust signal.
 * Static content: data sources, refresh cadence, season caveats, AI disclosure.
 * No client-side logic needed.
 */

import Link from 'next/link';

const TRANSPARENCY_ITEMS = [
  {
    label: 'Sources',
    text: 'SportsDataIO + Highlightly Pro + ESPN (NCAA Baseball)',
  },
  {
    label: 'Refresh',
    text: 'Live scores every 15–60s depending on league and game state',
  },
  {
    label: 'Season Note',
    text: 'Spring Training and early-season coverage may be limited until regular season opens',
  },
  {
    label: 'Attribution',
    text: 'Every feed includes timestamps and source attribution — no anonymous data',
  },
];

export function TransparencyBlock() {
  return (
    <div className="glass-default rounded-2xl p-6 sm:p-8 border border-border-subtle max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </div>
        <h2 className="text-lg font-display text-text-primary uppercase tracking-wide">
          How BSI Stays Accurate
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TRANSPARENCY_ITEMS.map((item) => (
          <div key={item.label} className="flex gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-burnt-orange mt-0.5 shrink-0 w-16">
              {item.label}
            </span>
            <p className="text-sm text-text-muted leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle flex flex-wrap gap-4 text-xs text-text-muted">
        <Link href="/models/data-quality" className="hover:text-text-secondary transition-colors">
          Data Quality & Sources
        </Link>
        <span className="text-text-muted">|</span>
        <Link href="/legal/accessibility" className="hover:text-text-secondary transition-colors">
          Accessibility
        </Link>
        <span className="text-text-muted">|</span>
        <span>AI-assisted analysis is labeled where used</span>
      </div>
    </div>
  );
}
