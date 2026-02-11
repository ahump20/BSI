export { SportTabs, SportTabsCompact } from './SportTabs';
export type { Sport } from './SportTabs';
export { LiveScoresPanel } from './LiveScoresPanel';
export { StandingsTable } from './StandingsTable';
export { SportLeaders } from './SportLeaders';

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
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-midnight/95 backdrop-blur-md border-t border-white/10 ${className}`}>
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export function CitationFooter() {
  return (
    <p className="text-xs text-white/20 text-center mt-2">
      Sources cited where available. Data via ESPN public API.
    </p>
  );
}

export function DataDisclaimer() {
  return (
    <p className="text-xs text-white/20 text-center mt-4">
      Data provided for informational purposes. Statistics sourced from official league APIs and public sources.
    </p>
  );
}
