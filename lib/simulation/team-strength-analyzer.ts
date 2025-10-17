import { TeamPerformanceRow, TeamStrengthProfile } from './types';

interface StrengthMap {
  [teamId: string]: TeamStrengthProfile;
}

export class TeamStrengthAnalyzer {
  constructor(private readonly games: TeamPerformanceRow[]) {}

  calculate(teamIds?: string[]): StrengthMap {
    const filteredGames = teamIds
      ? this.games.filter((game) => teamIds.includes(game.team_id))
      : this.games;

    if (filteredGames.length === 0) {
      return {};
    }

    const grouped = new Map<string, TeamPerformanceRow[]>();
    filteredGames.forEach((game) => {
      if (!grouped.has(game.team_id)) {
        grouped.set(game.team_id, []);
      }
      grouped.get(game.team_id)!.push(game);
    });

    const leagueAverages = this.calculateLeagueAverages(filteredGames);

    const strengths: StrengthMap = {};

    grouped.forEach((teamGames, teamId) => {
      strengths[teamId] = this.calculateTeamProfile(
        teamId,
        teamGames,
        leagueAverages
      );
    });

    return strengths;
  }

  private calculateLeagueAverages(games: TeamPerformanceRow[]): {
    pointsFor: number;
    pointsAgainst: number;
    offensiveEPA: number;
    defensiveEPA: number;
    successRate: number;
  } {
    let totalFor = 0;
    let totalAgainst = 0;
    let totalOffEPA = 0;
    let totalDefEPA = 0;
    let totalSuccess = 0;
    let count = 0;

    games.forEach((game) => {
      if (game.points_scored !== null) {
        totalFor += game.points_scored;
        count += 1;
      }
      if (game.points_allowed !== null) {
        totalAgainst += game.points_allowed;
      }
      if (typeof game.offensive_epa === 'number') {
        totalOffEPA += game.offensive_epa;
      }
      if (typeof game.defensive_epa === 'number') {
        totalDefEPA += game.defensive_epa;
      }
      if (typeof game.success_rate === 'number') {
        totalSuccess += game.success_rate;
      }
    });

    const divisor = Math.max(1, count);

    return {
      pointsFor: totalFor / divisor,
      pointsAgainst: totalAgainst / divisor,
      offensiveEPA: totalOffEPA / divisor,
      defensiveEPA: totalDefEPA / divisor,
      successRate: totalSuccess / divisor,
    };
  }

  private calculateTeamProfile(
    teamId: string,
    games: TeamPerformanceRow[],
    league: {
      pointsFor: number;
      pointsAgainst: number;
      offensiveEPA: number;
      defensiveEPA: number;
      successRate: number;
    }
  ): TeamStrengthProfile {
    const sorted = [...games].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let totalFor = 0;
    let totalAgainst = 0;
    let totalOffEPA = 0;
    let totalDefEPA = 0;
    let totalSuccess = 0;
    let validGames = 0;

    const form: number[] = [];

    sorted.forEach((game) => {
      if (game.points_scored !== null && game.points_allowed !== null) {
        totalFor += game.points_scored;
        totalAgainst += game.points_allowed;
        validGames += 1;

        if (form.length >= 5) {
          form.shift();
        }
        form.push(game.points_scored > game.points_allowed ? 1 : 0);
      }

      if (typeof game.offensive_epa === 'number') {
        totalOffEPA += game.offensive_epa;
      }
      if (typeof game.defensive_epa === 'number') {
        totalDefEPA += game.defensive_epa;
      }
      if (typeof game.success_rate === 'number') {
        totalSuccess += game.success_rate;
      }
    });

    const gamesPlayed = Math.max(1, validGames);
    const avgFor = totalFor / gamesPlayed;
    const avgAgainst = totalAgainst / gamesPlayed;
    const avgOffEPA = totalOffEPA / gamesPlayed;
    const avgDefEPA = totalDefEPA / gamesPlayed;
    const avgSuccess = totalSuccess / gamesPlayed;

    const attackStrength = league.pointsFor > 0 ? avgFor / league.pointsFor : 1;
    const defenseStrength = league.pointsAgainst > 0 ? league.pointsAgainst / Math.max(avgAgainst, 1) : 1;

    const formRating = form.length > 0 ? form.reduce((acc, value) => acc + value, 0) / form.length : 0.5;

    const baselineRating = 0.6 * attackStrength + 0.4 * defenseStrength;

    const teamOPS = this.estimateOPS(avgOffEPA, avgSuccess);

    return {
      teamId,
      attackStrength,
      defenseStrength,
      recentForm: form,
      offensiveEPA: avgOffEPA || 0,
      defensiveEPA: avgDefEPA || 0,
      successRate: avgSuccess || 0.5,
      baselineRating,
      formRating,
      teamOPS,
    };
  }

  private estimateOPS(offensiveEPA: number, successRate: number): number {
    const baseOPS = 0.7 + 0.6 * offensiveEPA + 0.3 * (successRate - 0.5);
    return Math.max(0.55, Math.min(0.95, baseOPS));
  }
}
