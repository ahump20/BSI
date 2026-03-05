import { ESPNUnifiedAdapter } from '../../lib/adapters/espn-unified-adapter.js';
import type { SportKey, ESPNGame, ESPNRankingPoll, ESPNTeam } from '../../lib/adapters/espn-unified-adapter.js';
import { HighlightlyApiClient } from '../../lib/api-clients/highlightly-api.js';
import type { HighlightlyMatch } from '../../lib/api-clients/highlightly-api.js';
import { MlbAdapter } from '../../lib/adapters/mlb-adapter.js';
import type { ScheduleGame } from '../../lib/adapters/mlb-adapter.js';

type ScoresResult = ESPNGame[] | HighlightlyMatch[] | ScheduleGame[];

export class SportsClient {
  private espn: ESPNUnifiedAdapter;
  private highlightly: HighlightlyApiClient | null;
  private mlb: MlbAdapter;

  constructor(rapidApiKey?: string) {
    this.espn = new ESPNUnifiedAdapter();
    this.mlb = new MlbAdapter();
    this.highlightly = rapidApiKey
      ? new HighlightlyApiClient({ rapidApiKey })
      : null;
  }

  async getScores(sport: SportKey, date?: string): Promise<ScoresResult> {
    try {
      if (sport === 'cbb' && this.highlightly) {
        const response = date
          ? await this.highlightly.getGamesByDate(new Date(date))
          : await this.highlightly.getTodayGames();
        return response.data?.data ?? [];
      }

      if (sport === 'mlb') {
        const dateStr = date ?? new Date().toISOString().split('T')[0];
        return await this.mlb.fetchSchedule(dateStr);
      }

      return await this.espn.getScoreboard(sport, date ? { date } : {});
    } catch {
      return [];
    }
  }

  async getRankings(sport: 'ncaaf' | 'ncaab' | 'wcbb'): Promise<ESPNRankingPoll[]> {
    try {
      return await this.espn.getRankings(sport);
    } catch {
      return [];
    }
  }

  async getTeamInfo(sport: SportKey, teamName: string): Promise<ESPNTeam | null> {
    try {
      const teams = await this.espn.getTeams(sport);
      const lower = teamName.toLowerCase();
      return (
        teams.find(
          (t) =>
            t.displayName.toLowerCase().includes(lower) ||
            t.abbreviation.toLowerCase() === lower ||
            t.name.toLowerCase().includes(lower)
        ) ?? null
      );
    } catch {
      return null;
    }
  }

  async searchGames(
    sport: SportKey,
    teamName?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ESPNGame[]> {
    try {
      if (!teamName) {
        return await this.espn.getScoreboard(sport);
      }

      const team = await this.getTeamInfo(sport, teamName);
      if (!team) return [];

      const games = await this.espn.getTeamSchedule(sport, team.id);

      if (!startDate && !endDate) return games;

      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Infinity;

      return games.filter((g) => {
        const gameTime = new Date(g.scheduledAt).getTime();
        return gameTime >= start && gameTime <= end;
      });
    } catch {
      return [];
    }
  }
}
