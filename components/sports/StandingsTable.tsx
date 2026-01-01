'use client';

import { useQuery } from '@tanstack/react-query';
import type { Sport } from './SportTabs';

const API_BASE = 'https://blazesportsintel.com/api';

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

// NBA API response structure - handles ESPN nested standings data
interface NBATeamRaw {
  name?: string;
  abbreviation?: string;
  wins?: number;
  losses?: number;
  streak?: string;
  // ESPN API nests streak under standings
  standings?: {
    streak?: string;
    gamesBack?: string;
  };
  record?: {
    wins?: number;
    losses?: number;
    winningPercentage?: string;
  };
}

interface NBAConference {
  name?: string; // API uses 'name' for conference name
  conference?: string; // Fallback
  teams?: NBATeamRaw[];
}

// Generic API response that handles various structures
interface APIResponse {
  standings?: TeamStanding[] | Record<string, Record<string, NFLTeamRaw[]>> | NBAConference[];
  rawData?: NFLTeamRaw[];
  data?: TeamStanding[];
}

function parseNFLStandings(rawData: NFLTeamRaw[]): TeamStanding[] {
  // Sort by conference rank and map to our format
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
      streak: String(team.Streak || '-'),
    }));
}

function parseNBAStandings(conferences: NBAConference[]): TeamStanding[] {
  // Flatten all teams from all conferences, sort by wins
  const allTeams: TeamStanding[] = [];

  conferences.forEach((conf) => {
    if (!conf?.teams || !Array.isArray(conf.teams)) return;
    conf.teams.forEach((team) => {
      if (!team) return;
      const teamName = team.name || 'Unknown';
      // Get wins/losses from direct properties or nested record
      const wins = team.wins ?? team.record?.wins ?? 0;
      const losses = team.losses ?? team.record?.losses ?? 0;
      // Get streak from direct property or nested standings - coerce to string for .startsWith() calls
      const rawStreak = team.streak || team.standings?.streak || '-';
      const streak = typeof rawStreak === 'string' ? rawStreak : String(rawStreak);
      // Calculate PCT or use provided value
      const pct = team.record?.winningPercentage
        ? team.record.winningPercentage.replace(/^0/, '')
        : wins && losses
          ? (wins / (wins + losses)).toFixed(3).replace(/^0/, '')
          : '.000';

      allTeams.push({
        rank: 0, // Will be set after sorting
        team: teamName,
        abbreviation: team.abbreviation || teamName.substring(0, 3).toUpperCase(),
        wins,
        losses,
        pct,
        streak,
        gb: team.standings?.gamesBack,
      });
    });
  });

  // Sort by wins descending, then update ranks
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

    // Handle NFL nested structure - use rawData which is a flat array
    if (sport === 'nfl' && data.rawData && Array.isArray(data.rawData)) {
      return parseNFLStandings(data.rawData);
    }

    // Handle NBA conference structure
    if (sport === 'nba' && data.standings && Array.isArray(data.standings)) {
      const standings = data.standings as NBAConference[];
      if (standings[0]?.teams) {
        return parseNBAStandings(standings);
      }
    }

    // Fallback to direct array (MLB, NCAA, or simple format)
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
      {
        rank: 1,
        team: 'Dodgers',
        abbreviation: 'LAD',
        wins: 98,
        losses: 64,
        pct: '.605',
        gb: '-',
        streak: 'W3',
        last10: '7-3',
      },
      {
        rank: 2,
        team: 'Braves',
        abbreviation: 'ATL',
        wins: 94,
        losses: 68,
        pct: '.580',
        gb: '4.0',
        streak: 'W1',
        last10: '6-4',
      },
      {
        rank: 3,
        team: 'Cardinals',
        abbreviation: 'STL',
        wins: 89,
        losses: 73,
        pct: '.549',
        gb: '9.0',
        streak: 'L1',
        last10: '5-5',
      },
    ],
    nfl: [
      {
        rank: 1,
        team: 'Chiefs',
        abbreviation: 'KC',
        wins: 15,
        losses: 2,
        pct: '.882',
        streak: 'W6',
      },
      {
        rank: 2,
        team: 'Bills',
        abbreviation: 'BUF',
        wins: 13,
        losses: 4,
        pct: '.765',
        streak: 'W3',
      },
      {
        rank: 3,
        team: 'Titans',
        abbreviation: 'TEN',
        wins: 8,
        losses: 9,
        pct: '.471',
        streak: 'L2',
      },
    ],
    nba: [
      {
        rank: 1,
        team: 'Celtics',
        abbreviation: 'BOS',
        wins: 42,
        losses: 12,
        pct: '.778',
        gb: '-',
        streak: 'W5',
        last10: '8-2',
      },
      {
        rank: 2,
        team: 'Thunder',
        abbreviation: 'OKC',
        wins: 40,
        losses: 14,
        pct: '.741',
        gb: '2.0',
        streak: 'W2',
        last10: '7-3',
      },
      {
        rank: 3,
        team: 'Grizzlies',
        abbreviation: 'MEM',
        wins: 35,
        losses: 19,
        pct: '.648',
        gb: '7.0',
        streak: 'W1',
        last10: '6-4',
      },
    ],
    ncaa: [
      { rank: 1, team: 'Texas', abbreviation: 'TEX', wins: 0, losses: 0, pct: '-', streak: '-' },
      { rank: 2, team: 'LSU', abbreviation: 'LSU', wins: 0, losses: 0, pct: '-', streak: '-' },
      {
        rank: 3,
        team: 'Tennessee',
        abbreviation: 'TENN',
        wins: 0,
        losses: 0,
        pct: '-',
        streak: '-',
      },
    ],
  };

  return standings[sport] || [];
}

interface StandingsTableProps {
  sport: Sport;
  limit?: number;
}

export function StandingsTable({ sport, limit = 10 }: StandingsTableProps) {
  const {
    data: standings,
    isLoading,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['standings', sport],
    queryFn: () => fetchStandings(sport),
    refetchInterval: 5 * 60_000, // 5 minutes
    staleTime: 60_000,
  });

  const displayStandings = standings?.slice(0, limit) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display text-white">STANDINGS</h2>
        {dataUpdatedAt && (
          <span className="text-xs text-white/40">
            Updated{' '}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/50 uppercase tracking-wider">
                  W
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/50 uppercase tracking-wider">
                  L
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/50 uppercase tracking-wider">
                  PCT
                </th>
                {(sport === 'mlb' || sport === 'nba') && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-white/50 uppercase tracking-wider">
                    GB
                  </th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium text-white/50 uppercase tracking-wider">
                  STRK
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="skeleton w-6 h-4 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton w-24 h-4 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton w-8 h-4 rounded mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton w-8 h-4 rounded mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton w-10 h-4 rounded mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton w-8 h-4 rounded mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton w-8 h-4 rounded mx-auto" />
                      </td>
                    </tr>
                  ))
                : displayStandings.map((team) => (
                    <tr
                      key={team.abbreviation || team.team || String(team.rank)}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white/50 text-sm">{team.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                            {(team.abbreviation || team.team || '??').slice(0, 2)}
                          </div>
                          <span className="text-white font-medium">{team.team || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-white font-mono">{team.wins}</td>
                      <td className="px-4 py-3 text-center text-white/70 font-mono">
                        {team.losses}
                      </td>
                      <td className="px-4 py-3 text-center text-white/70 font-mono">{team.pct}</td>
                      {(sport === 'mlb' || sport === 'nba') && (
                        <td className="px-4 py-3 text-center text-white/50 font-mono text-sm">
                          {team.gb}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-mono ${
                            team.streak?.startsWith('W')
                              ? 'text-success'
                              : team.streak?.startsWith('L')
                                ? 'text-error'
                                : 'text-white/50'
                          }`}
                        >
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
