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

const STANDINGS_FALLBACK: Record<Sport, TeamStanding[]> = {
  mlb: [
    { name: 'Los Angeles Dodgers', abbreviation: 'LAD', wins: 98, losses: 64, winPct: 0.605 },
    { name: 'Philadelphia Phillies', abbreviation: 'PHI', wins: 95, losses: 67, winPct: 0.586 },
    { name: 'New York Yankees', abbreviation: 'NYY', wins: 94, losses: 68, winPct: 0.58 },
    { name: 'Baltimore Orioles', abbreviation: 'BAL', wins: 91, losses: 71, winPct: 0.562 },
    { name: 'Atlanta Braves', abbreviation: 'ATL', wins: 89, losses: 73, winPct: 0.549 },
  ],
  nfl: [
    { name: 'Kansas City Chiefs', abbreviation: 'KC', wins: 12, losses: 5, winPct: 0.706 },
    { name: 'Baltimore Ravens', abbreviation: 'BAL', wins: 11, losses: 6, winPct: 0.647 },
    { name: 'Miami Dolphins', abbreviation: 'MIA', wins: 11, losses: 6, winPct: 0.647 },
    { name: 'Buffalo Bills', abbreviation: 'BUF', wins: 10, losses: 7, winPct: 0.588 },
    { name: 'Dallas Cowboys', abbreviation: 'DAL', wins: 10, losses: 7, winPct: 0.588 },
  ],
  nba: [
    { name: 'Boston Celtics', abbreviation: 'BOS', wins: 64, losses: 18, winPct: 0.78 },
    { name: 'Oklahoma City Thunder', abbreviation: 'OKC', wins: 57, losses: 25, winPct: 0.695 },
    { name: 'Minnesota Timberwolves', abbreviation: 'MIN', wins: 56, losses: 26, winPct: 0.683 },
    { name: 'Denver Nuggets', abbreviation: 'DEN', wins: 54, losses: 28, winPct: 0.659 },
    { name: 'Milwaukee Bucks', abbreviation: 'MIL', wins: 49, losses: 33, winPct: 0.598 },
  ],
  ncaa: [
    { name: 'Tennessee Volunteers', abbreviation: 'TENN', wins: 53, losses: 13, winPct: 0.803 },
    { name: 'Texas A&M Aggies', abbreviation: 'TAMU', wins: 50, losses: 15, winPct: 0.769 },
    { name: 'Kentucky Wildcats', abbreviation: 'UK', wins: 46, losses: 16, winPct: 0.742 },
    { name: 'Arkansas Razorbacks', abbreviation: 'ARK', wins: 44, losses: 17, winPct: 0.721 },
    { name: 'LSU Tigers', abbreviation: 'LSU', wins: 43, losses: 18, winPct: 0.705 },
  ],
};

interface StandingsTableProps {
  sport: Sport;
  limit?: number;
  groupBy?: 'division' | 'conference' | 'none';
  showLogos?: boolean;
  className?: string;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function parseStandingsResponse(
  data: Record<string, unknown>,
  sport: Sport
): StandingsGroup[] {
  const raw = (data.standings ?? data.teams ?? data.groups ?? []) as Record<string, unknown>[];

  // If the API returns nested groups (NFL, NBA, MLB all do)
  if (raw.length > 0 && Array.isArray((raw[0] as Record<string, unknown>).teams)) {
    const groups = raw.map((group) => ({
      label: (group.division ?? group.name ?? group.conference ?? '') as string,
      teams: ((group.teams ?? []) as Record<string, unknown>[])
        .map(normalizeTeam)
        .filter((team) => Boolean(team.name)),
    }));
    if (groups.some((group) => group.teams.length > 0)) return groups;
    return [{ label: '', teams: STANDINGS_FALLBACK[sport] }];
  }

  // Flat array fallback (NCAA or legacy)
  const normalized = raw.map((t) => normalizeTeam(t)).filter((team) => team.name);
  return [{ label: '', teams: normalized.length > 0 ? normalized : STANDINGS_FALLBACK[sport] }];
}

function normalizeTeam(t: Record<string, unknown>): TeamStanding {
  const wins = toNumber(t.wins ?? t.Wins);
  const losses = toNumber(t.losses ?? t.Losses);
  const winPct = toNumber(
    t.winPct ??
      t.winPercentage ??
      t.Percentage ??
      (t.record as Record<string, unknown>)?.winningPercentage
  );

  return {
    name: (t.name ?? t.teamName ?? '') as string,
    abbreviation: (t.abbreviation ?? t.key ?? t.Team ?? '') as string,
    wins,
    losses,
    winPct: winPct > 0 ? winPct : wins + losses > 0 ? wins / (wins + losses) : 0,
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
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      setError(false);
      setUsingFallback(false);
      const apiBase = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
      try {
        const res = await fetch(`${apiBase}/standings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as Record<string, unknown>;
        const parsed = parseStandingsResponse(data, sport);
        const hasRealTeams = parsed.some((group) => {
          const firstTeam = group.teams[0];
          return group.teams.length > 0 && firstTeam != null && !STANDINGS_FALLBACK[sport].includes(firstTeam);
        });
        setGroups(parsed);
        setUsingFallback(!hasRealTeams);
      } catch {
        setError(false);
        setGroups([{ label: '', teams: STANDINGS_FALLBACK[sport] }]);
        setUsingFallback(true);
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
    <div className={`bg-white/5 border border-white/10 rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Standings</h3>
        {groupBy === 'none' && (
          <span className="text-xs text-white/40 uppercase tracking-wider">Top {limit}</span>
        )}
      </div>

      {usingFallback && !loading && (
        <div className="px-6 py-2 border-b border-white/10 text-xs text-white/50">
          Showing last known standings snapshot while live feed recovers.
        </div>
      )}

      {error && (
        <div className="px-6 py-4 text-center">
          <p className="text-white/40 text-sm mb-2">Failed to load standings</p>
          <button
            onClick={() => { setError(false); setLoading(true); }}
            className="text-xs text-[#BF5700] hover:text-[#FF6B35] transition-colors"
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
                <div className="px-4 py-2 bg-white/3 border-b border-white/5">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
              )}
              <table className="w-full" aria-label={`${sport.toUpperCase()} standings table`}>
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
                    ? Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
                        <tr key={i} className="border-b border-white/5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="p-3">
                              <div className="h-4 bg-white/10 rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : group.teams.map((team, idx) => (
                        <tr
                          key={team.name}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-3 text-[#BF5700] font-bold text-sm">{idx + 1}</td>
                          <td className="p-3 text-white font-medium text-sm">
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
                          <td className="p-3 text-white/60 text-sm">{team.wins}</td>
                          <td className="p-3 text-white/60 text-sm">{team.losses}</td>
                          <td className="p-3 text-white/60 text-sm">
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
