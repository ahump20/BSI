'use client';

import { useState, useEffect } from 'react';
import type { Sport } from './SportTabs';

interface TeamStanding {
  name: string;
  abbreviation?: string;
  wins: number;
  losses: number;
  winPct?: number;
  record?: { winningPercentage?: number };
  gamesBack?: number | string;
  logo?: string;
  standings?: { gamesBack?: number | string; streak?: string };
  streakCode?: string;
}

interface StandingsGroup {
  label: string;
  teams: TeamStanding[];
}

interface StandingsTableProps {
  sport: Sport;
  limit?: number;
  groupBy?: 'division' | 'conference' | 'none';
  showLogos?: boolean;
  className?: string;
}

function parseStandingsResponse(
  data: Record<string, unknown>,
  _sport: Sport
): StandingsGroup[] {
  const raw = (data.standings ?? data.teams ?? []) as Record<string, unknown>[];

  // If the API returns nested groups (NFL, NBA, MLB all do)
  if (raw.length > 0 && Array.isArray((raw[0] as Record<string, unknown>).teams)) {
    return raw.map((group) => ({
      label: (group.division ?? group.name ?? group.conference ?? '') as string,
      teams: ((group.teams ?? []) as Record<string, unknown>[]).map(normalizeTeam),
    }));
  }

  // Flat array fallback (NCAA or legacy)
  return [{ label: '', teams: raw.map((t) => normalizeTeam(t)) }];
}

function normalizeTeam(t: Record<string, unknown>): TeamStanding {
  return {
    name: (t.name ?? t.teamName ?? '') as string,
    abbreviation: (t.abbreviation ?? '') as string,
    wins: (t.wins ?? 0) as number,
    losses: (t.losses ?? 0) as number,
    winPct: (t.winPct ?? (t.record as Record<string, unknown>)?.winningPercentage) as number | undefined,
    gamesBack: (t.gamesBack ?? (t.standings as Record<string, unknown>)?.gamesBack) as number | string | undefined,
    logo: (t.logo ?? '') as string,
    streakCode: (t.streakCode ?? (t.standings as Record<string, unknown>)?.streak ?? '') as string,
  };
}

function getWinPct(t: TeamStanding): number {
  if (t.winPct != null) return t.winPct;
  const total = t.wins + t.losses;
  return total > 0 ? t.wins / total : 0;
}

export function StandingsTable({
  sport,
  limit = 10,
  groupBy = 'none',
  showLogos = false,
  className = '',
}: StandingsTableProps) {
  const [groups, setGroups] = useState<StandingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      setError(false);
      const apiBase = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
      try {
        const res = await fetch(`${apiBase}/standings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as Record<string, unknown>;
        setGroups(parseStandingsResponse(data, sport));
      } catch {
        setError(true);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [sport, limit]);

  // Flatten or group based on prop
  const displayGroups: StandingsGroup[] = (() => {
    if (groupBy === 'none' || groups.length <= 1) {
      const all = groups.flatMap((g) => g.teams);
      all.sort((a, b) => getWinPct(b) - getWinPct(a));
      return [{ label: '', teams: all.slice(0, limit) }];
    }
    if (groupBy === 'conference') {
      // Merge divisions into conferences (NFL: AFC East+North+South+West -> AFC)
      const confMap = new Map<string, TeamStanding[]>();
      for (const g of groups) {
        const conf = g.label.split(' ')[0]; // "AFC East" -> "AFC", "Eastern Conference" -> "Eastern"
        const existing = confMap.get(conf) ?? [];
        existing.push(...g.teams);
        confMap.set(conf, existing);
      }
      return Array.from(confMap.entries()).map(([label, teams]) => ({
        label,
        teams: teams.sort((a, b) => getWinPct(b) - getWinPct(a)).slice(0, limit),
      }));
    }
    // groupBy === 'division' — show each API group as-is
    return groups.map((g) => ({
      ...g,
      teams: g.teams.slice(0, limit),
    }));
  })();

  return (
    <div className={`bg-surface-light border border-border rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Standings</h3>
        {groupBy === 'none' && (
          <span className="text-xs text-text-muted uppercase tracking-wider">Top {limit}</span>
        )}
      </div>

      {error && (
        <div className="px-6 py-4 text-center">
          <p className="text-text-muted text-sm mb-2">Failed to load standings</p>
          <button
            onClick={() => { setError(false); setLoading(true); }}
            className="text-xs text-burnt-orange hover:text-ember transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!error && (
        <div className="overflow-x-auto">
          {displayGroups.map((group) => (
            <div key={group.label || 'all'}>
              {group.label && (
                <div className="px-4 py-2 bg-surface-light border-b border-border-subtle">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
              )}
              <table className="w-full" aria-label={`${group.label || sport} standings`}>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="text-left p-3 text-xs text-text-muted font-semibold">#</th>
                    <th scope="col" className="text-left p-3 text-xs text-text-muted font-semibold">Team</th>
                    <th scope="col" className="text-left p-3 text-xs text-text-muted font-semibold">W</th>
                    <th scope="col" className="text-left p-3 text-xs text-text-muted font-semibold">L</th>
                    <th scope="col" className="text-left p-3 text-xs text-text-muted font-semibold">PCT</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
                        <tr key={i} className="border-b border-border-subtle">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="p-3">
                              <div className="h-4 bg-surface rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : group.teams.map((team, idx) => (
                        <tr
                          key={team.name}
                          className="border-b border-border-subtle hover:bg-surface-light transition-colors"
                        >
                          <td className="p-3 text-burnt-orange font-bold text-sm">{idx + 1}</td>
                          <td className="p-3 text-text-primary font-medium text-sm">
                            <span className="flex items-center gap-2">
                              {showLogos && team.logo && (
                                <img
                                  src={team.logo}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="rounded-sm"
                                  loading="lazy"
                                />
                              )}
                              {team.abbreviation || team.name}
                            </span>
                          </td>
                          <td className="p-3 text-text-secondary text-sm">{team.wins}</td>
                          <td className="p-3 text-text-secondary text-sm">{team.losses}</td>
                          <td className="p-3 text-text-secondary text-sm">
                            {getWinPct(team).toFixed(3).replace('0.', '.')}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
