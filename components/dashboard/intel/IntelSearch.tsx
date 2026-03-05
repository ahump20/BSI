'use client';

import { Search } from 'lucide-react';

interface IntelSearchProps {
  query: string;
  onChange: (query: string) => void;
  onFocus?: () => void;
  className?: string;
}

export function IntelSearch({ query, onChange, onFocus, className = '' }: IntelSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search teams, games, signals... (press /)"
        aria-label="Search teams, games, and signals"
        className="h-9 w-full rounded-lg border border-border bg-surface-light pl-8 pr-3 font-mono text-[12px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-border-strong focus:bg-surface-light"
      />
    </div>
  );
}
