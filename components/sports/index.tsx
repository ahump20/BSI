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
    <div className={`bg-surface-light border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Data Sources</span>
        {refreshInterval && (
          <span className="ml-auto text-xs text-text-muted">Refreshing every {refreshInterval}s</span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {sources.map((source) => (
          <a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-burnt-orange hover:text-ember transition-colors"
          >
            {source.name}
          </a>
        ))}
      </div>
      {lastUpdated && (
        <p className="text-xs text-text-muted mt-2">
          Last updated: {new Date(lastUpdated).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
        </p>
      )}
    </div>
  );
}

// Bottom navigation for mobile
export interface BottomNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  onPress?: () => void;
}

export function BottomNav({ items, className = '' }: { items: BottomNavItem[]; className?: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-midnight/95 backdrop-blur-md border-t border-border ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          // Items with onPress are buttons (e.g., "More"), not links
          if (item.onPress) {
            return (
              <button
                key={item.label}
                onClick={item.onPress}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] transition-colors ${
                  active ? 'text-burnt-orange' : 'text-text-muted'
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] transition-colors ${
                active ? 'text-burnt-orange' : 'text-text-muted hover:text-text-primary'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
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
    <footer className={`border-t border-border pt-4 mt-8 ${className}`}>
      <p className="text-xs text-text-muted mb-2">Sources</p>
      <div className="flex flex-wrap gap-2">
        {resolvedSources.map((s) => (
          s.url ? (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-burnt-orange hover:text-ember transition-colors">{s.name}</a>
          ) : (
            <span key={s.name} className="text-xs text-text-muted">{s.name}</span>
          )
        ))}
        {additionalSources?.map((s) => (
          <span key={s} className="text-xs text-text-muted">{s}</span>
        ))}
      </div>
      {showFreshness && fetchedAt && (
        <p className="text-[10px] text-text-muted mt-1">Last updated: {fetchedAt}</p>
      )}
    </footer>
  );
}

export function DataDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[10px] text-text-muted ${className}`}>
      Data is provided for informational purposes only. Stats may be delayed or incomplete.
    </p>
  );
}
