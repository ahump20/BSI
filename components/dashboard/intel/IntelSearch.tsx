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
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search teams, games, signals... (press /)"
        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 font-mono text-[12px] text-white/80 placeholder:text-white/30 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.07]"
      />
    </div>
  );
}
