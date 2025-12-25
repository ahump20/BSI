/**
 * BSI Team Store - Organization & Standings State Management
 *
 * Manages team listings, standings, schedules, and team-specific data
 * Supports MLB, NFL, NBA, and NCAA (all covered sports)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Sport } from './gameStore';

// Types
export type Conference =
  // MLB
  | 'AL'
  | 'NL'
  // NFL
  | 'AFC'
  | 'NFC'
  // NBA
  | 'Eastern'
  | 'Western'
  // NCAA Baseball
  | 'SEC'
  | 'Big 12'
  | 'ACC'
  | 'Pac-12'
  | 'Big Ten'
  | 'AAC'
  | 'Mountain West'
  | 'Conference USA'
  | 'Sun Belt'
  | 'WAC'
  | 'Big West'
  | 'Colonial'
  | 'Southland'
  | 'SWAC'
  | 'MEAC'
  | 'OVC'
  | 'Missouri Valley'
  | 'WCC'
  | 'A-10'
  | 'Big East'
  | 'Ivy'
  | 'Patriot'
  | 'Independent';

export type Division =
  // MLB
  | 'AL East'
  | 'AL Central'
  | 'AL West'
  | 'NL East'
  | 'NL Central'
  | 'NL West'
  // NFL
  | 'AFC East'
  | 'AFC North'
  | 'AFC South'
  | 'AFC West'
  | 'NFC East'
  | 'NFC North'
  | 'NFC South'
  | 'NFC West';

export interface TeamRecord {
  wins: number;
  losses: number;
  ties?: number;
  pct: number;
  streak?: string; // "W3", "L2"
  last10?: string; // "7-3"
  homeRecord?: string;
  awayRecord?: string;
  conferenceRecord?: string;
  divisionRecord?: string;
}

export interface TeamStanding {
  rank: number;
  gamesBack?: number;
  clinched?: string; // "x", "y", "z" for playoff markers
  eliminated?: boolean;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  nickname?: string;
  city: string;
  sport: Sport;
  conference?: Conference;
  division?: Division;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  venue?: {
    name: string;
    city: string;
    state: string;
    capacity?: number;
  };
  record: TeamRecord;
  standing?: TeamStanding;
  espnId?: string;
  sportsDataId?: string;
  lastUpdated: string;
}

export interface StandingsView {
  sport: Sport;
  groupBy: 'conference' | 'division' | 'league' | 'overall';
}

interface TeamState {
  // Data
  teams: Map<string, Team>;
  favoriteTeams: string[]; // Team IDs

  // Owner's favorite teams (Austin's teams per CLAUDE.md)
  ownerFavorites: {
    mlb: string; // Cardinals
    nfl: string; // Titans
    nba: string; // Grizzlies
    college: string; // Longhorns
  };

  // Standings
  standingsView: StandingsView;

  // Loading states
  isLoading: boolean;
  lastStandingsUpdate: string | null;
  error: string | null;

  // Actions - Teams
  setTeam: (team: Team) => void;
  setTeams: (teams: Team[]) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  updateRecord: (teamId: string, record: Partial<TeamRecord>) => void;
  updateStanding: (teamId: string, standing: Partial<TeamStanding>) => void;

  // Actions - Favorites
  addFavorite: (teamId: string) => void;
  removeFavorite: (teamId: string) => void;
  toggleFavorite: (teamId: string) => void;
  isFavorite: (teamId: string) => boolean;

  // Actions - View
  setStandingsView: (view: Partial<StandingsView>) => void;

  // Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getTeam: (teamId: string) => Team | undefined;
  getTeamsBySport: (sport: Sport) => Team[];
  getTeamsByConference: (conference: Conference) => Team[];
  getTeamsByDivision: (division: Division) => Team[];
  getStandings: (sport: Sport, groupBy?: 'conference' | 'division') => Map<string, Team[]>;
  getFavoriteTeams: () => Team[];
  isOwnerFavorite: (teamId: string) => boolean;
}

// Austin's favorite teams per CLAUDE.md
const OWNER_FAVORITES = {
  mlb: 'stl-cardinals',
  nfl: 'ten-titans',
  nba: 'mem-grizzlies',
  college: 'tex-longhorns',
};

export const useTeamStore = create<TeamState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        teams: new Map(),
        favoriteTeams: Object.values(OWNER_FAVORITES), // Pre-populate with Austin's favorites
        ownerFavorites: OWNER_FAVORITES,
        standingsView: {
          sport: 'mlb',
          groupBy: 'division',
        },
        isLoading: false,
        lastStandingsUpdate: null,
        error: null,

        // Team actions
        setTeam: (team) =>
          set(
            (state) => {
              const newTeams = new Map(state.teams);
              newTeams.set(team.id, team);
              return { teams: newTeams };
            },
            false,
            'setTeam'
          ),

        setTeams: (teams) =>
          set(
            (state) => {
              const newTeams = new Map(state.teams);
              teams.forEach((t) => newTeams.set(t.id, t));
              return {
                teams: newTeams,
                lastStandingsUpdate: new Date().toISOString(),
              };
            },
            false,
            'setTeams'
          ),

        updateTeam: (teamId, updates) =>
          set(
            (state) => {
              const team = state.teams.get(teamId);
              if (!team) return state;

              const newTeams = new Map(state.teams);
              newTeams.set(teamId, {
                ...team,
                ...updates,
                lastUpdated: new Date().toISOString(),
              });
              return { teams: newTeams };
            },
            false,
            'updateTeam'
          ),

        updateRecord: (teamId, record) =>
          set(
            (state) => {
              const team = state.teams.get(teamId);
              if (!team) return state;

              const newTeams = new Map(state.teams);
              newTeams.set(teamId, {
                ...team,
                record: { ...team.record, ...record },
                lastUpdated: new Date().toISOString(),
              });
              return { teams: newTeams };
            },
            false,
            'updateRecord'
          ),

        updateStanding: (teamId, standing) =>
          set(
            (state) => {
              const team = state.teams.get(teamId);
              if (!team) return state;

              const newTeams = new Map(state.teams);
              newTeams.set(teamId, {
                ...team,
                standing: { ...team.standing, ...standing } as TeamStanding,
                lastUpdated: new Date().toISOString(),
              });
              return { teams: newTeams };
            },
            false,
            'updateStanding'
          ),

        // Favorite actions
        addFavorite: (teamId) =>
          set(
            (state) => ({
              favoriteTeams: state.favoriteTeams.includes(teamId)
                ? state.favoriteTeams
                : [...state.favoriteTeams, teamId],
            }),
            false,
            'addFavorite'
          ),

        removeFavorite: (teamId) =>
          set(
            (state) => ({
              favoriteTeams: state.favoriteTeams.filter((id) => id !== teamId),
            }),
            false,
            'removeFavorite'
          ),

        toggleFavorite: (teamId) =>
          set(
            (state) => ({
              favoriteTeams: state.favoriteTeams.includes(teamId)
                ? state.favoriteTeams.filter((id) => id !== teamId)
                : [...state.favoriteTeams, teamId],
            }),
            false,
            'toggleFavorite'
          ),

        isFavorite: (teamId) => get().favoriteTeams.includes(teamId),

        // View actions
        setStandingsView: (view) =>
          set(
            (state) => ({ standingsView: { ...state.standingsView, ...view } }),
            false,
            'setStandingsView'
          ),

        // Loading actions
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
        setError: (error) => set({ error }, false, 'setError'),

        // Selectors
        getTeam: (teamId) => get().teams.get(teamId),

        getTeamsBySport: (sport) => {
          const { teams } = get();
          return Array.from(teams.values()).filter((t) => t.sport === sport);
        },

        getTeamsByConference: (conference) => {
          const { teams } = get();
          return Array.from(teams.values()).filter((t) => t.conference === conference);
        },

        getTeamsByDivision: (division) => {
          const { teams } = get();
          return Array.from(teams.values()).filter((t) => t.division === division);
        },

        getStandings: (sport, groupBy = 'division') => {
          const teams = get().getTeamsBySport(sport);
          const grouped = new Map<string, Team[]>();

          teams.forEach((team) => {
            const key =
              groupBy === 'division' ? team.division || 'Unknown' : team.conference || 'Unknown';

            const existing = grouped.get(key) || [];
            grouped.set(key, [...existing, team]);
          });

          // Sort each group by standing rank or win percentage
          grouped.forEach((teamList, key) => {
            grouped.set(
              key,
              teamList.sort((a, b) => {
                if (a.standing?.rank && b.standing?.rank) {
                  return a.standing.rank - b.standing.rank;
                }
                return b.record.pct - a.record.pct;
              })
            );
          });

          return grouped;
        },

        getFavoriteTeams: () => {
          const { teams, favoriteTeams } = get();
          return favoriteTeams.map((id) => teams.get(id)).filter((t): t is Team => t !== undefined);
        },

        isOwnerFavorite: (teamId) => {
          const { ownerFavorites } = get();
          return Object.values(ownerFavorites).includes(teamId);
        },
      }),
      {
        name: 'bsi-team-store',
        partialize: (state) => ({
          favoriteTeams: state.favoriteTeams,
          standingsView: state.standingsView,
        }),
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const data = JSON.parse(str);
            return {
              ...data,
              state: {
                ...data.state,
                teams: new Map(),
                ownerFavorites: OWNER_FAVORITES,
              },
            };
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      }
    ),
    { name: 'TeamStore' }
  )
);

export default useTeamStore;
