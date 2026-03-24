import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ScoresState {
  activeSport: string;
  favoriteTeams: string[];
  setActiveSport: (sport: string) => void;
  setFavoriteTeams: (teams: string[]) => void;
  addFavoriteTeam: (team: string) => void;
  removeFavoriteTeam: (team: string) => void;
}

export const useScoresStore = create<ScoresState>()(
  persist(
    (set) => ({
      activeSport: 'all',
      favoriteTeams: [],
      setActiveSport: (sport) => set({ activeSport: sport }),
      setFavoriteTeams: (teams) => set({ favoriteTeams: teams }),
      addFavoriteTeam: (team) =>
        set((state) => ({
          favoriteTeams: state.favoriteTeams.includes(team)
            ? state.favoriteTeams
            : [...state.favoriteTeams, team]
        })),
      removeFavoriteTeam: (team) =>
        set((state) => ({ favoriteTeams: state.favoriteTeams.filter((entry) => entry !== team) }))
    }),
    {
      name: 'bsi-scores-store',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
