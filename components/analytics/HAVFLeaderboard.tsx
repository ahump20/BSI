'use client';

import { useState, useEffect } from 'react';
import { HAVFBadge } from './HAVFBadge';

interface HAVFEntry {
  player_id: string;
  player_name: string;
  team: string;
  league: string;
  season: number;
  h_score: number;
  a_score: number;
  v_score: number;
  f_score: number;
  havf_composite: number;
  havf_rank: number | null;
}

interface HAVFLeaderboardProps {
  league?: string;
  limit?: number;
  className?: string;
}

export function HAVFLeaderboard({ league = 'college-baseball', limit = 25, className = '' }: HAVFLeaderboardProps) {
  const [entries, setEntries] = useState<HAVFEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/analytics/havf/leaderboard?league=${league}&limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { data?: HAVFEntry[] };
        setEntries(data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [league, limit]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-2 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  if (entries.length === 0) {
    return <p className="text-white/40 text-sm">No HAV-F scores computed yet. Scores are populated when game data is processed.</p>;
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/[0.06]">
            <th className="text-left py-3 px-3">#</th>
            <th className="text-left py-3 px-3">Player</th>
            <th className="text-left py-3 px-3">Team</th>
            <th className="text-right py-3 px-3">H</th>
            <th className="text-right py-3 px-3">A</th>
            <th className="text-right py-3 px-3">V</th>
            <th className="text-right py-3 px-3">F</th>
            <th className="text-right py-3 px-3">HAV-F</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={entry.player_id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
              <td className="py-3 px-3 text-white/30 tabular-nums">{i + 1}</td>
              <td className="py-3 px-3 font-semibold text-white">{entry.player_name}</td>
              <td className="py-3 px-3 text-white/60">{entry.team}</td>
              <td className="py-3 px-3 text-right tabular-nums text-white/60">{entry.h_score.toFixed(1)}</td>
              <td className="py-3 px-3 text-right tabular-nums text-white/60">{entry.a_score.toFixed(1)}</td>
              <td className="py-3 px-3 text-right tabular-nums text-white/60">{entry.v_score.toFixed(1)}</td>
              <td className="py-3 px-3 text-right tabular-nums text-white/60">{entry.f_score.toFixed(1)}</td>
              <td className="py-3 px-3 text-right">
                <HAVFBadge score={entry.havf_composite} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
