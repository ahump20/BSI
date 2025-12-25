'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { Sport } from './SportTabs';

const API_BASE = 'https://blazesportsintel.com/api';

// Sport-specific color theming
const sportThemes = {
  mlb: {
    accent: 'text-baseball',
    accentBg: 'bg-baseball',
    headerBg: 'bg-baseball/5',
    rowHover: 'hover:bg-baseball/5',
    rankBadge: 'bg-baseball/20 text-baseball',
  },
  nfl: {
    accent: 'text-football',
    accentBg: 'bg-football',
    headerBg: 'bg-football/5',
    rowHover: 'hover:bg-football/5',
    rankBadge: 'bg-football/20 text-football',
  },
  nba: {
    accent: 'text-basketball',
    accentBg: 'bg-basketball',
    headerBg: 'bg-basketball/5',
    rowHover: 'hover:bg-basketball/5',
    rankBadge: 'bg-basketball/20 text-basketball',
  },
  ncaa: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange',
    headerBg: 'bg-burnt-orange/5',
    rowHover: 'hover:bg-burnt-orange/5',
    rankBadge: 'bg-burnt-orange/20 text-burnt-orange',
  },
};

interface TeamStanding {
  rank: number;
  team: string;
  abbreviation: string;
  wins: number;
  losses: number;
  pct: string;
  gb?: string;
  streak?: string;
  last10?: string;
}

// NFL API response structure
interface NFLTeamRaw {
  Team: string;
  Name: string;
  Wins: number;
  Losses: number;
  Percentage: number;
  ConferenceRank: number;
  Streak: string;
}

// NBA API response structure
interface NBATeamRaw {
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  streak?: string;
}

interface NBAConference {
  conference: string;
  teams: NBATeamRaw[];
}

// Generic API response that handles various structures
interface APIResponse {
  standings?: TeamStanding[] | Record<string, Record<string, NFLTeamRaw[]>> | NBAConference[];
  rawData?: NFLTeamRaw[];
  data?: TeamStanding[];
}

function parseNFLStandings(rawData: NFLTeamRaw[]): TeamStanding[] {
  return rawData
    .sort((a, b) => (a.ConferenceRank || 99) - (b.ConferenceRank || 99))
    .slice(0, 10)
    .map((team, index) => ({
      rank: index + 1,
      team: team.Name || team.Team,
      abbreviation: team.Team?.substring(0, 3).toUpperCase() || 'UNK',
      wins: team.Wins || 0,
      losses: team.Losses || 0,
      pct: team.Percentage ? team.Percentage.toFixed(3).replace(/^0/, '') : '.000',
      streak: team.Streak || '-',
    }));
}

function parseNBAStandings(conferences: NBAConference[]): TeamStanding[] {
  const allTeams: TeamStanding[] = [];

  conferences.forEach((conf) => {
    if (!conf?.teams) return;
    conf.teams.forEach((team) => {
      if (!team) return;
      const teamName = team.name || 'Unknown';
      allTeams.push({
        rank: 0,
        team: teamName,
        abbreviation: team.abbreviation || teamName.substring(0, 3).toUpperCase(),
        wins: team.wins || 0,
        losses: team.losses || 0,
        pct: team.wins && team.losses ? (team.wins / (team.wins + team.losses)).toFixed(3).replace(/^0/, '') : '.000',
        streak: team.streak || '-',
      });
    });
  });

  return allTeams
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10)
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

async function fetchStandings(sport: Sport): Promise<TeamStanding[]> {
  const endpoints: Record<Sport, string> = {
    mlb: `${API_BASE}/mlb/standings`,
    nfl: `${API_BASE}/nfl/standings`,
    nba: `${API_BASE}/nba/standings`,
    ncaa: `${API_BASE}/ncaa/standings`,
  };

  try {
    const res = await fetch(endpoints[sport]);
    if (!res.ok) {
      return getMockStandings(sport);
    }
    const data = (await res.json()) as APIResponse;

    if (sport === 'nfl' && data.rawData && Array.isArray(data.rawData)) {
      return parseNFLStandings(data.rawData);
    }

    if (sport === 'nba' && data.standings && Array.isArray(data.standings)) {
      const standings = data.standings as NBAConference[];
      if (standings[0]?.teams) {
        return parseNBAStandings(standings);
      }
    }

    if (data.standings && Array.isArray(data.standings)) {
      return data.standings as TeamStanding[];
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return getMockStandings(sport);
  } catch {
    return getMockStandings(sport);
  }
}

function getMockStandings(sport: Sport): TeamStanding[] {
  const standings: Record<Sport, TeamStanding[]> = {
    mlb: [
      { rank: 1, team: 'Dodgers', abbreviation: 'LAD', wins: 98, losses: 64, pct: '.605', gb: '-', streak: 'W3', last10: '7-3' },
      { rank: 2, team: 'Braves', abbreviation: 'ATL', wins: 94, losses: 68, pct: '.580', gb: '4.0', streak: 'W1', last10: '6-4' },
      { rank: 3, team: 'Cardinals', abbreviation: 'STL', wins: 89, losses: 73, pct: '.549', gb: '9.0', streak: 'L1', last10: '5-5' },
    ],
    nfl: [
      { rank: 1, team: 'Chiefs', abbreviation: 'KC', wins: 15, losses: 2, pct: '.882', streak: 'W6' },
      { rank: 2, team: 'Bills', abbreviation: 'BUF', wins: 13, losses: 4, pct: '.765', streak: 'W3' },
      { rank: 3, team: 'Titans', abbreviation: 'TEN', wins: 8, losses: 9, pct: '.471', streak: 'L2' },
    ],
    nba: [
      { rank: 1, team: 'Celtics', abbreviation: 'BOS', wins: 42, losses: 12, pct: '.778', gb: '-', streak: 'W5', last10: '8-2' },
      { rank: 2, team: 'Thunder', abbreviation: 'OKC', wins: 40, losses: 14, pct: '.741', gb: '2.0', streak: 'W2', last10: '7-3' },
      { rank: 3, team: 'Grizzlies', abbreviation: 'MEM', wins: 35, losses: 19, pct: '.648', gb: '7.0', streak: 'W1', last10: '6-4' },
    ],
    ncaa: [
      { rank: 1, team: 'Texas', abbreviation: 'TEX', wins: 0, losses: 0, pct: '-', streak: '-' },
      { rank: 2, team: 'LSU', abbreviation: 'LSU', wins: 0, losses: 0, pct: '-', streak: '-' },
      { rank: 3, team: 'Tennessee', abbreviation: 'TENN', wins: 0, losses: 0, pct: '-', streak: '-' },
    ],
  };
  return standings[sport] || [];
}

interface StandingsTableProps {
  sport: Sport;
  limit?: number;
  showViewAll?: boolean;
}

export function StandingsTable({ sport, limit = 10, showViewAll = true }: StandingsTableProps) {
  const theme = sportThemes[sport] || sportThemes.mlb;

  const {
    data: standings,
    isLoading,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['standings', sport],
    queryFn: () => fetchStandings(sport),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  const displayStandings = standings?.slice(0, limit) || [];

  // Sport-specific route
  const sportRoute = sport === 'ncaa' ? '/college-baseball' : `/${sport}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display text-white">STANDINGS</h2>
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${theme.rankBadge}`}>
            {sport.toUpperCase()}
          </span>
        </div>
        {dataUpdatedAt && (
          <span className="text-xs text-white/40">
            {new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/Chicago',
            })}{' '}
            CT
          </span>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className={`border-b border-white/10 ${theme.headerBg}`}>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-white/60 uppercase tracking-wider w-10">
                  #
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-semibold text-white/60 uppercase tracking-wider w-12">
                  W
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-semibold text-white/60 uppercase tracking-wider w-12">
                  L
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-semibold text-white/60 uppercase tracking-wider w-14">
                  PCT
                </th>
                {(sport === 'mlb' || sport === 'nba') && (
                  <th className="px-3 py-3 text-center text-[10px] font-semibold text-white/60 uppercase tracking-wider w-12">
                    GB
                  </th>
                )}
                <th className="px-3 py-3 text-center text-[10px] font-semibold text-white/60 uppercase tracking-wider w-14">
                  STRK
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading
                ? Array.from({ length: limit }).map((_, i) => (
                    <StandingsRowSkeleton
                      key={i}
                      showGB={sport === 'mlb' || sport === 'nba'}
                      delay={i * 50}
                    />
                  ))
                : displayStandings.map((team, index) => (
                    <tr
                      key={team.abbreviation || team.team || String(team.rank)}
                      className={`${theme.rowHover} transition-colors duration-150 group`}
                    >
                      {/* Rank */}
                      <td className="px-3 py-3">
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold
                          ${team.rank <= 3 ? theme.rankBadge : 'text-white/40'}
                        `}>
                          {team.rank}
                        </span>
                      </td>
                      {/* Team */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`
                            w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold
                            ${team.rank <= 3 ? `${theme.accentBg}/20 ${theme.accent}` : 'bg-white/10 text-white/70'}
                            transition-colors duration-150
                          `}>
                            {(team.abbreviation || team.team || '??').slice(0, 2)}
                          </div>
                          <span className="text-white font-medium text-sm group-hover:text-white transition-colors">
                            {team.team || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      {/* Wins */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-white font-mono text-sm font-semibold tabular-nums">
                          {team.wins}
                        </span>
                      </td>
                      {/* Losses */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-white/60 font-mono text-sm tabular-nums">
                          {team.losses}
                        </span>
                      </td>
                      {/* PCT */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-white/60 font-mono text-sm tabular-nums">
                          {team.pct}
                        </span>
                      </td>
                      {/* GB */}
                      {(sport === 'mlb' || sport === 'nba') && (
                        <td className="px-3 py-3 text-center">
                          <span className="text-white/40 font-mono text-xs tabular-nums">
                            {team.gb || '-'}
                          </span>
                        </td>
                      )}
                      {/* Streak */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                            team.streak?.startsWith('W')
                              ? 'bg-success/20 text-success'
                              : team.streak?.startsWith('L')
                                ? 'bg-error/20 text-error'
                                : 'text-white/40'
                          }`}
                        >
                          {team.streak || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* View All Footer */}
        {showViewAll && !isLoading && displayStandings.length > 0 && (
          <div className="border-t border-white/5">
            <Link
              href={`${sportRoute}/standings`}
              className={`
                flex items-center justify-center gap-2 py-3 text-sm font-medium
                ${theme.accent} hover:bg-white/5 transition-colors duration-150
              `}
            >
              View Full Standings
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton row with stagger animation
 */
function StandingsRowSkeleton({ showGB, delay = 0 }: { showGB: boolean; delay?: number }) {
  return (
    <tr style={{ animationDelay: `${delay}ms` }}>
      <td className="px-3 py-3">
        <div className="skeleton w-6 h-6 rounded" />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="skeleton w-7 h-7 rounded-md" />
          <div className="skeleton w-20 h-4 rounded" />
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="skeleton w-6 h-4 rounded mx-auto" />
      </td>
      <td className="px-3 py-3">
        <div className="skeleton w-6 h-4 rounded mx-auto" />
      </td>
      <td className="px-3 py-3">
        <div className="skeleton w-10 h-4 rounded mx-auto" />
      </td>
      {showGB && (
        <td className="px-3 py-3">
          <div className="skeleton w-6 h-4 rounded mx-auto" />
        </td>
      )}
      <td className="px-3 py-3">
        <div className="skeleton w-8 h-5 rounded mx-auto" />
      </td>
    </tr>
  );
}
