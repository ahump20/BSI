'use client';

import { useQuery } from '@tanstack/react-query';
import type { Sport } from './SportTabs';

const API_BASE = 'https://blazesportsintel.com/api';
const REFETCH_INTERVAL_MS = 300_000; // 5 minutes
const STALE_TIME_MS = 60_000; // 1 minute
const MAX_DISPLAY = 10;

interface TeamStanding {
  rank: number;
  team: string;
  abbreviation: string;
  wins: number;
  losses: number;
  pct: string;
  gb?: string;
  streak?: string;
}

/** Format win percentage: 0.605 -> ".605" */
function formatPct(wins: number, losses: number, rawPct?: number): string {
  if (rawPct !== undefined) {
    return rawPct.toFixed(3).replace(/^0/, '');
  }
  if (wins + losses === 0) return '.000';
  return (wins / (wins + losses)).toFixed(3).replace(/^0/, '');
}

/** Extract abbreviation from team name or use provided */
function getAbbreviation(abbr: string | undefined, teamName: string): string {
  return abbr || teamName.substring(0, 3).toUpperCase();
}

/** Normalize any raw team record to TeamStanding */
function normalizeTeam(raw: Record<string, unknown>, rank: number): TeamStanding {
  // Handle various API field naming conventions
  const teamName = (raw.Name || raw.name || raw.teamName || 'Unknown') as string;
  const abbr = (raw.Team || raw.abbreviation || raw.teamAbbr) as string | undefined;

  // Wins/losses: direct or nested in record object
  const record = raw.record as Record<string, unknown> | undefined;
  const wins = (raw.Wins ?? raw.wins ?? record?.wins ?? 0) as number;
  const losses = (raw.Losses ?? raw.losses ?? record?.losses ?? 0) as number;

  // Win percentage: various field names
  const rawPct = (raw.Percentage ?? raw.winPercentage) as number | undefined;
  const pctString = record?.winningPercentage as string | undefined;
  const pct = pctString?.replace(/^0/, '') ?? formatPct(wins, losses, rawPct);

  // Streak: direct or nested in standings object
  const standings = raw.standings as Record<string, unknown> | undefined;
  const rawStreak = (raw.Streak ??
    raw.streak ??
    raw.streakCode ??
    standings?.streak ??
    '-') as string;
  const streak = String(rawStreak);

  // Games back
  const gb =
    raw.gamesBack !== undefined
      ? String(raw.gamesBack)
      : (standings?.gamesBack as string | undefined);

  return {
    rank,
    team: teamName,
    abbreviation: getAbbreviation(abbr, teamName),
    wins,
    losses,
    pct,
    streak,
    gb,
  };
}

/** Sort teams by conference rank (NFL) or win percentage (others) */
function sortTeams(teams: Record<string, unknown>[], sport: Sport): Record<string, unknown>[] {
  if (sport === 'nfl') {
    return [...teams].sort((a, b) => {
      const rankA = (a.ConferenceRank ?? 99) as number;
      const rankB = (b.ConferenceRank ?? 99) as number;
      return rankA - rankB;
    });
  }

  return [...teams].sort((a, b) => {
    const winsA = (a.Wins ?? a.wins ?? 0) as number;
    const lossesA = (a.Losses ?? a.losses ?? 0) as number;
    const winsB = (b.Wins ?? b.wins ?? 0) as number;
    const lossesB = (b.Losses ?? b.losses ?? 0) as number;
    const pctA = winsA + lossesA > 0 ? winsA / (winsA + lossesA) : 0;
    const pctB = winsB + lossesB > 0 ? winsB / (winsB + lossesB) : 0;
    return pctB - pctA;
  });
}

/** Flatten NBA conference structure to team array */
function flattenNBAConferences(conferences: unknown[]): Record<string, unknown>[] {
  const teams: Record<string, unknown>[] = [];
  for (const conf of conferences) {
    const confObj = conf as Record<string, unknown>;
    const confTeams = confObj?.teams as Record<string, unknown>[] | undefined;
    if (Array.isArray(confTeams)) {
      teams.push(...confTeams);
    }
  }
  return teams;
}

async function fetchStandings(sport: Sport): Promise<TeamStanding[]> {
  const res = await fetch(`${API_BASE}/${sport}/standings`);
  if (!res.ok) {
    throw new Error(`Standings API returned ${res.status}`);
  }

  const data = (await res.json()) as Record<string, unknown>;

  // Extract raw team array from various response shapes
  let rawTeams: Record<string, unknown>[];

  if (sport === 'nfl' && Array.isArray(data.rawData)) {
    rawTeams = data.rawData as Record<string, unknown>[];
  } else if (sport === 'nba' && Array.isArray(data.standings)) {
    // NBA nests teams inside conference objects
    const conferences = data.standings as unknown[];
    rawTeams = flattenNBAConferences(conferences);
  } else if (Array.isArray(data.standings)) {
    rawTeams = data.standings as Record<string, unknown>[];
  } else if (Array.isArray(data.data)) {
    rawTeams = data.data as Record<string, unknown>[];
  } else {
    throw new Error('Unexpected standings response shape');
  }

  // Sort, limit, normalize
  const sorted = sortTeams(rawTeams, sport);
  return sorted.slice(0, MAX_DISPLAY).map((team, idx) => normalizeTeam(team, idx + 1));
}

/** Get streak color class based on W/L prefix */
function getStreakColor(streak: string | undefined): string {
  if (!streak) return 'text-white/50';
  if (streak.startsWith('W')) return 'text-success';
  if (streak.startsWith('L')) return 'text-error';
  return 'text-white/50';
}

/** Format timestamp for display */
function formatUpdateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });
}

const SKELETON_ROWS = 5;
const SKELETON_CELLS = [
  { width: 'w-6' },
  { width: 'w-24' },
  { width: 'w-8', center: true },
  { width: 'w-8', center: true },
  { width: 'w-10', center: true },
  { width: 'w-8', center: true },
  { width: 'w-8', center: true },
];

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr key={index}>
      {SKELETON_CELLS.map((cell, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`skeleton ${cell.width} h-4 rounded ${cell.center ? 'mx-auto' : ''}`} />
        </td>
      ))}
    </tr>
  );
}

interface StandingsTableProps {
  sport: Sport;
  limit?: number;
}

export function StandingsTable({ sport, limit = MAX_DISPLAY }: StandingsTableProps) {
  const {
    data: standings,
    isLoading,
    isError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['standings', sport],
    queryFn: () => fetchStandings(sport),
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: STALE_TIME_MS,
  });

  const displayStandings = standings?.slice(0, limit) ?? [];
  const showGamesBack = sport === 'mlb' || sport === 'nba';

  const thClass = 'px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-white">STANDINGS</h2>
        {dataUpdatedAt && (
          <span className="text-xs text-white/40">
            Updated {formatUpdateTime(dataUpdatedAt)} CT
          </span>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`${thClass} text-left`}>#</th>
                <th className={`${thClass} text-left`}>Team</th>
                <th className={`${thClass} text-center`}>W</th>
                <th className={`${thClass} text-center`}>L</th>
                <th className={`${thClass} text-center`}>PCT</th>
                {showGamesBack && <th className={`${thClass} text-center`}>GB</th>}
                <th className={`${thClass} text-center`}>STRK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading &&
                Array.from({ length: SKELETON_ROWS }, (_, i) => <SkeletonRow key={i} index={i} />)}

              {isError && (
                <tr>
                  <td
                    colSpan={showGamesBack ? 7 : 6}
                    className="px-4 py-8 text-center text-white/50"
                  >
                    Unable to load standings
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                displayStandings.map((team) => (
                  <tr
                    key={`${team.abbreviation}-${team.rank}`}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-white/50 text-sm">{team.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                          {team.abbreviation.slice(0, 2)}
                        </div>
                        <span className="text-white font-medium">{team.team}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-white font-mono">{team.wins}</td>
                    <td className="px-4 py-3 text-center text-white/70 font-mono">{team.losses}</td>
                    <td className="px-4 py-3 text-center text-white/70 font-mono">{team.pct}</td>
                    {showGamesBack && (
                      <td className="px-4 py-3 text-center text-white/50 font-mono text-sm">
                        {team.gb ?? '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-mono ${getStreakColor(team.streak)}`}>
                        {team.streak}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
