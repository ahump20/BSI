'use client';

import { useState, useEffect } from 'react';
import type { Sport } from './SportTabs';

interface StandingsTeam {
  teamName: string;
  wins: number;
  losses: number;
  winPercentage?: number;
  winPct?: number;
  gamesBack?: number;
  division?: string;
  conference?: string;
}

interface StandingsTableProps {
  sport: Sport;
  limit?: number;
  className?: string;
}

export function StandingsTable({ sport, limit = 10, className = '' }: StandingsTableProps) {
  const [teams, setTeams] = useState<StandingsTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      const apiBase = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
      try {
        const res = await fetch(`${apiBase}/standings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { standings?: StandingsTeam[]; teams?: StandingsTeam[] };
        const list = data.standings || data.teams || [];
        setTeams(list.slice(0, limit));
      } catch {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [sport, limit]);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Standings</h3>
        <span className="text-xs text-white/40 uppercase tracking-wider">Top {limit}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 text-xs text-white/40 font-semibold">#</th>
              <th className="text-left p-3 text-xs text-white/40 font-semibold">Team</th>
              <th className="text-left p-3 text-xs text-white/40 font-semibold">W</th>
              <th className="text-left p-3 text-xs text-white/40 font-semibold">L</th>
              <th className="text-left p-3 text-xs text-white/40 font-semibold">PCT</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 bg-white/10 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : teams.map((team, idx) => {
                  const pct = team.winPercentage ?? team.winPct ?? ((team.wins / (team.wins + team.losses)) || 0);
                  return (
                    <tr key={team.teamName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-[#BF5700] font-bold text-sm">{idx + 1}</td>
                      <td className="p-3 text-white font-medium text-sm">{team.teamName}</td>
                      <td className="p-3 text-white/60 text-sm">{team.wins}</td>
                      <td className="p-3 text-white/60 text-sm">{team.losses}</td>
                      <td className="p-3 text-white/60 text-sm">{pct.toFixed(3).replace('0.', '.')}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
