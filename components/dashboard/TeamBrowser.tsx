'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface TeamItem {
  id: number;
  name: string;
  abbreviation: string;
  slug: string;
  logo: string;
  primaryColor: string;
  conference: string;
  conferenceId: number;
  record: { wins: number; losses: number };
  ranking?: number;
  source: 'highlightly' | 'espn' | 'merged';
}

interface TeamsAllResponse {
  teams: TeamItem[];
  meta: { source: string; fetched_at: string; timezone: string; teamCount: number };
}

const CONFERENCES = [
  'All', 'SEC', 'Big 12', 'ACC', 'Big Ten', 'Pac-12',
  'Big East', 'AAC', 'Mountain West', 'Sun Belt', 'Conference USA',
  'MAC', 'WCC', 'Missouri Valley', 'Colonial', 'A-10',
];

export function TeamBrowser() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [conference, setConference] = useState('All');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/college-baseball/teams/all')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<TeamsAllResponse>;
      })
      .then((data) => {
        if (!cancelled) {
          setTeams(data.teams ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load teams');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(id);
  }, [search]);

  const filteredTeams = useMemo(() => {
    let result = teams;
    if (conference !== 'All') {
      result = result.filter((t) => t.conference === conference);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.abbreviation.toLowerCase().includes(q)
      );
    }
    return result;
  }, [teams, conference, debouncedSearch]);

  // Extract actual conferences from data
  const availableConferences = useMemo(() => {
    const confs = new Set(teams.map((t) => t.conference));
    return ['All', ...CONFERENCES.filter((c) => c === 'All' || confs.has(c)), ...[...confs].filter((c) => !CONFERENCES.includes(c)).sort()];
  }, [teams]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  if (loading) {
    return (
      <div>
        {/* Search skeleton */}
        <div className="h-10 bg-surface-medium rounded-lg animate-pulse mb-4" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-medium rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted text-sm mb-2">Failed to load teams</p>
        <p className="text-text-tertiary text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search teams..."
          aria-label="Search teams"
          className="w-full px-4 py-2.5 bg-surface-light border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-burnt-orange/50 transition-colors"
        />
      </div>

      {/* Conference filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {availableConferences.filter((c, i, a) => a.indexOf(c) === i).map((conf) => (
          <button
            key={conf}
            onClick={() => setConference(conf)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              conference === conf
                ? 'bg-burnt-orange text-white'
                : 'bg-surface-light text-text-muted hover:text-text-primary hover:bg-surface-medium'
            }`}
          >
            {conf}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted mb-3">
        {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
        {conference !== 'All' ? ` in ${conference}` : ''}
        {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
      </p>

      {/* Team grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredTeams.map((team) => (
            <motion.div
              key={team.id}
              layout
              layoutId={`team-${team.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href={`/college-baseball/teams/${team.slug}`}
                className="block p-3 bg-surface-light border border-border rounded-lg hover:border-burnt-orange/40 hover:bg-surface-medium transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-burnt-orange transition-colors truncate">
                      {team.abbreviation}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">{team.conference}</p>
                    {(team.record.wins > 0 || team.record.losses > 0) && (
                      <p className="text-[10px] text-text-tertiary">
                        {team.record.wins}-{team.record.losses}
                      </p>
                    )}
                  </div>
                </div>
                {team.ranking && team.ranking <= 25 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-burnt-orange/20 text-burnt-orange text-[10px] font-bold rounded">
                    #{team.ranking}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm">No teams found</p>
          <button
            onClick={() => { setSearch(''); setConference('All'); }}
            className="mt-2 text-xs text-burnt-orange hover:text-burnt-orange/80 underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
