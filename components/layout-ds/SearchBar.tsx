'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface SearchResult {
  type: 'team' | 'player';
  id: string;
  name: string;
  subtitle: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (!res.ok) { setResults([]); return; }
      const data = await res.json() as { results?: SearchResult[] };
      setResults(data.results ?? []);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setResults([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length >= 2) { timerRef.current = setTimeout(() => search(query), 300); } else { setResults([]); }
    return () => clearTimeout(timerRef.current);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search teams, players..." aria-label="Search teams and players" className="w-48 lg:w-64 px-3 py-1.5 rounded-lg bg-charcoal border border-border-subtle text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-burnt-orange transition-colors" />
      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#1A1A1A] border border-border-subtle rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-4 text-text-tertiary text-sm text-center">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-text-tertiary text-sm text-center">No results</div>
          ) : (
            results.map((r) => (
              <Link key={`${r.type}-${r.id}`} href={r.type === 'team' ? `/college-baseball/teams/${r.id}` : `/college-baseball/players/${r.id}`} onClick={() => { setOpen(false); setQuery(''); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-charcoal transition-colors border-b border-border-subtle last:border-0">
                <span className="text-[10px] uppercase tracking-wider text-text-tertiary w-12">{r.type}</span>
                <div>
                  <div className="text-white text-sm font-medium">{r.name}</div>
                  <div className="text-text-tertiary text-xs">{r.subtitle}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
