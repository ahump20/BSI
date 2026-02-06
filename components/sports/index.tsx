'use client';

export { SportTabs, SportTabsCompact } from './SportTabs';
export type { Sport } from './SportTabs';
export { LiveScoresPanel } from './LiveScoresPanel';
export { StandingsTable } from './StandingsTable';
export { SportLeaders } from './SportLeaders';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Data attribution components

export interface DataSource {
  name: string;
  url: string;
  fetchedAt: string;
  description?: string;
}

interface DataSourcePanelProps {
  sources: DataSource[];
  lastUpdated?: string;
  refreshInterval?: number;
  className?: string;
}

export function DataSourcePanel({ sources, lastUpdated, refreshInterval, className = '' }: DataSourcePanelProps) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Data Sources</span>
        {refreshInterval && (
          <span className="ml-auto text-xs text-white/30">Refreshing every {refreshInterval}s</span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {sources.map((source) => (
          <a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#BF5700] hover:text-[#FF6B35] transition-colors"
          >
            {source.name}
          </a>
        ))}
      </div>
      {lastUpdated && (
        <p className="text-xs text-white/20 mt-2">
          Last updated: {new Date(lastUpdated).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
        </p>
      )}
    </div>
  );
}

// Bottom navigation for mobile
interface BottomNavItem {
  label: string;
  href: string;
  icon?: string;
}

export const DEFAULT_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'More', href: '/dashboard' },
];

export function BottomNav({ items, className = '' }: { items: BottomNavItem[]; className?: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-midnight/95 backdrop-blur-md border-t border-white/10 ${className}`}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive(item.href)
                ? 'text-[#BF5700]'
                : 'text-white/40 hover:text-white'
            }`}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}


export function CitationFooter({ sources, source, fetchedAt, additionalSources, showFreshness, className = "" }: {
  sources?: DataSource[];
  source?: string;
  fetchedAt?: string;
  additionalSources?: string[];
  showFreshness?: boolean;
  className?: string;
}) {
  const resolvedSources = sources ?? (source ? [{ name: source, url: '', fetchedAt: fetchedAt ?? '' }] : []);
  if (resolvedSources.length === 0) return null;
  return (
    <footer className={`border-t border-white/10 pt-4 mt-8 ${className}`}>
      <p className="text-xs text-white/30 mb-2">Sources</p>
      <div className="flex flex-wrap gap-2">
        {resolvedSources.map((s) => (
          s.url ? (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#BF5700] hover:text-[#FF6B35] transition-colors">{s.name}</a>
          ) : (
            <span key={s.name} className="text-xs text-white/40">{s.name}</span>
          )
        ))}
        {additionalSources?.map((s) => (
          <span key={s} className="text-xs text-white/40">{s}</span>
        ))}
      </div>
      {showFreshness && fetchedAt && (
        <p className="text-[10px] text-white/20 mt-1">Last updated: {fetchedAt}</p>
      )}
    </footer>
  );
}

export function DataDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[10px] text-white/20 ${className}`}>
      Data is provided for informational purposes only. Stats may be delayed or incomplete.
    </p>
  );
}
