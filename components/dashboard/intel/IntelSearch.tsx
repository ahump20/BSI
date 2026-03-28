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
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(196,184,165,0.35)]" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search teams, games, signals... (press /)"
        aria-label="Search teams, games, and signals"
        className="h-9 w-full rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)] pl-8 pr-3 font-mono text-[12px] text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.35)] outline-none transition-colors focus:border-[rgba(140,98,57,0.5)] focus:bg-[var(--surface-press-box)]"
      />
    </div>
  );
}
