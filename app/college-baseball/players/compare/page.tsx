'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Footer } from '@/components/layout-ds/Footer';
import { PlayerCompareCard } from '@/components/college-baseball/PlayerCompareCard';
import { useSportData } from '@/lib/hooks/useSportData';

// --- Types ---

interface PlayerSearchResult {
  id: string;
  name: string;
  team: string;
  position: string;
  classYear: string;
}

interface PlayersListResponse {
  players: PlayerSearchResult[];
  meta: { source: string; fetched_at: string; timezone: string };
}

interface PlayerData {
  player: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    jerseyNumber?: string;
    height?: string;
    weight?: number;
    team?: { id: number; name: string; shortName?: string; conference?: { name: string } };
  } | null;
  statistics: {
    batting?: {
      games: number; atBats: number; runs: number; hits: number; doubles: number;
      triples: number; homeRuns: number; rbi: number; walks: number; strikeouts: number;
      stolenBases: number; battingAverage: number; onBasePercentage: number;
      sluggingPercentage: number; ops: number;
    };
    pitching?: {
      games: number; gamesStarted: number; wins: number; losses: number; saves: number;
      inningsPitched: number; hits: number; earnedRuns: number; walks: number;
      strikeouts: number; era: number; whip: number;
    };
  } | null;
  meta?: { dataSource?: string; lastUpdated?: string };
}

interface CompareResponse {
  player1: PlayerData;
  player2: PlayerData;
  comparison: {
    type: 'batting' | 'pitching' | 'mixed';
    differentials: Record<string, number>;
  };
  meta: { source: string; fetched_at: string; timezone: string };
  error?: string;
}

// --- Autocomplete Hook ---

function usePlayerSearch(query: string) {
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/college-baseball/players?search=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = (await res.json()) as PlayersListResponse;
          setResults(data.players?.slice(0, 8) ?? []);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  return { results, searching };
}

// --- Player Search Input ---

function PlayerSearchInput({
  label,
  selected,
  onSelect,
  onClear,
  accentColor,
}: {
  label: string;
  selected: PlayerSearchResult | null;
  onSelect: (player: PlayerSearchResult) => void;
  onClear: () => void;
  accentColor: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, searching } = usePlayerSearch(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selected) {
    return (
      <div className="relative">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</label>
        <div className={`flex items-center justify-between p-3 rounded-lg border bg-surface-light`} style={{ borderColor: accentColor + '40' }}>
          <div>
            <span className="text-text-primary font-medium">{selected.name}</span>
            <span className="text-text-muted text-sm ml-2">{selected.team}</span>
            {selected.position && <span className="text-text-muted text-xs ml-2">{selected.position}</span>}
          </div>
          <button
            onClick={onClear}
            className="text-text-muted hover:text-text-primary transition-colors text-sm px-2"
            aria-label={`Clear ${label}`}
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="Search by name..."
        className="w-full p-3 rounded-lg border border-border-strong bg-surface-light text-text-primary placeholder-text-muted focus:outline-none focus:border-burnt-orange transition-colors"
      />
      {searching && (
        <div className="absolute right-3 top-[38px] mt-0.5">
          <div className="w-4 h-4 border-2 border-border border-t-text-tertiary rounded-full animate-spin" />
        </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-background-secondary border border-border-strong rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {results.map((p) => (
            <li key={p.id}>
              <button
                className="w-full text-left px-4 py-3 hover:bg-surface-medium transition-colors flex items-center justify-between"
                onClick={() => {
                  onSelect(p);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <div>
                  <span className="text-text-primary text-sm font-medium">{p.name}</span>
                  {p.team && <span className="text-text-muted text-xs ml-2">{p.team}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {p.position && <span className="text-text-muted text-xs">{p.position}</span>}
                  {p.classYear && <span className="text-text-muted text-xs">{p.classYear}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && !searching && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background-secondary border border-border-strong rounded-lg shadow-xl px-4 py-3">
          <span className="text-text-muted text-sm">No players found</span>
        </div>
      )}
    </div>
  );
}

// --- Page ---

export default function PlayerComparePage() {
  const [player1, setPlayer1] = useState<PlayerSearchResult | null>(null);
  const [player2, setPlayer2] = useState<PlayerSearchResult | null>(null);

  const compareUrl = player1 && player2
    ? `/api/college-baseball/players/compare/${player1.id}/${player2.id}`
    : null;

  const { data, loading, error, retry } = useSportData<CompareResponse>(compareUrl, {
    timeout: 15000,
  });

  const handleClear = useCallback((which: 1 | 2) => {
    if (which === 1) setPlayer1(null);
    else setPlayer2(null);
  }, []);

  return (
    <>
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-2">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/players" className="text-text-muted hover:text-burnt-orange transition-colors">
                Players
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Compare</span>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-[0.04em] text-text-primary mb-2">
              Player Comparison
            </h1>
            <p className="text-text-tertiary text-sm mb-8">
              Select two players to compare their statistics side by side.
            </p>

            {/* Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <PlayerSearchInput
                label="Player 1"
                selected={player1}
                onSelect={setPlayer1}
                onClear={() => handleClear(1)}
                accentColor="#BF5700"
              />
              <PlayerSearchInput
                label="Player 2"
                selected={player2}
                onSelect={setPlayer2}
                onClear={() => handleClear(2)}
                accentColor="#FF6B35"
              />
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <Card padding="lg" className="text-center mb-8">
                <p className="text-error mb-3">{error}</p>
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors text-sm"
                >
                  Retry
                </button>
              </Card>
            )}

            {/* Results */}
            {data && !loading && !data.error && (
              <div className="space-y-6">
                <PlayerCompareCard
                  player1={data.player1}
                  player2={data.player2}
                  comparison={data.comparison}
                />
                <DataAttribution
                  lastUpdated={data.meta?.fetched_at ?? ''}
                  source={data.meta?.source ?? 'Highlightly'}
                  className="mt-4"
                />
              </div>
            )}

            {/* API error (e.g. player not found) */}
            {data?.error && !loading && (
              <Card padding="lg" className="text-center">
                <p className="text-text-tertiary mb-2">{data.error}</p>
                <p className="text-text-muted text-sm">Try selecting different players.</p>
              </Card>
            )}

            {/* Empty state */}
            {!player1 && !player2 && !loading && (
              <Card padding="lg" className="text-center mt-4">
                <div className="py-8">
                  <p className="text-text-muted text-lg mb-2">Search for two players to get started</p>
                  <p className="text-text-muted text-sm">Compare batting averages, home runs, ERA, and more.</p>
                </div>
              </Card>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
