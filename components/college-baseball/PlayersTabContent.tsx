'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonTableRow } from '@/components/ui/Skeleton';

interface PlayerResult {
  id: string;
  name: string;
  team: string;
  jersey?: string;
  position: string;
  classYear?: string;
  conference?: string;
}

export function PlayersTabContent() {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const searchParam = debouncedSearch.length >= 2 ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
  const { data, loading } = useSportData<{ players?: PlayerResult[] }>(
    searchParam ? `/api/college-baseball/players${searchParam}` : null
  );
  const filtered = useMemo(() => {
    const players = data?.players || [];
    let list = players;
    if (posFilter !== 'All') list = list.filter(p => p.position === posFilter);
    if (classFilter !== 'All') list = list.filter(p => p.classYear === classFilter);
    return list;
  }, [data?.players, posFilter, classFilter]);

  return (
    <Card variant="default" padding="lg">
      <CardHeader><CardTitle>Player Search</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name (min 2 chars)..."
            aria-label="Search players by name"
            className="flex-1 px-4 py-2.5 bg-surface-light border border-border rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
          />
          <select
            aria-label="Filter by position"
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="px-3 py-2.5 bg-surface-light border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
          >
            <option value="All">All Positions</option>
            {['P', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'UTL'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            aria-label="Filter by class year"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2.5 bg-surface-light border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
          >
            <option value="All">All Classes</option>
            {['Fr', 'So', 'Jr', 'Sr', 'Gr'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {!searchParam && (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-4">Enter at least 2 characters to search D1 baseball players.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/college-baseball/players"><Button variant="primary">Browse Players</Button></Link>
              <Link href="/college-baseball/transfer-portal"><Button variant="secondary">Transfer Portal</Button></Link>
            </div>
          </div>
        )}

        {searchParam && loading && (
          <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={5} />)}</tbody></table>
        )}

        {searchParam && !loading && filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-muted">No players found for &quot;{debouncedSearch}&quot;</p>
          </div>
        )}

        {searchParam && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-burnt-orange">
                  {['Name', 'Team', 'Pos', 'Class', ''].map((h) => (
                    <th key={h} className="text-left p-3 text-text-muted font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 25).map((player) => (
                  <tr key={player.id} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                    <td className="p-3 font-semibold text-text-primary">{player.name}</td>
                    <td className="p-3 text-text-secondary">{player.team}</td>
                    <td className="p-3 text-text-secondary">{player.position}</td>
                    <td className="p-3 text-text-secondary">{player.classYear || '-'}</td>
                    <td className="p-3">
                      <Link href={`/college-baseball/players/${player.id}`} className="text-burnt-orange text-xs hover:text-ember transition-colors">
                        Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
