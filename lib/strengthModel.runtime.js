/**
 * Blaze Sports Intel - Schedule Strength & Optimization Engine
 * Runtime implementation used by both API and front-end contexts.
 * The TypeScript declaration lives alongside this file in `strengthModel.ts`.
 */

const DEFAULT_SIMULATIONS = 500;
const MAX_SIMULATIONS_PRO = 5000;
const MAX_SIMULATIONS_FREE = 200;
const POSTSEASON_RPI_THRESHOLD = 0.57;
const POSTSEASON_WIN_THRESHOLD = 38;

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class StrengthModel {
  constructor({ games = [], teams = [], season } = {}) {
    this.season = season || new Date().getFullYear();
    this.games = Array.isArray(games) ? games.map((game) => this.#normalizeGame(game)) : [];
    this.teams = Array.isArray(teams) ? teams.map((team) => this.#normalizeTeam(team)) : [];
    this.teamIndex = new Map();

    for (const team of this.teams) {
      if (team.id) {
        this.teamIndex.set(team.id, team);
      }
    }
  }

  #normalizeTeam(team = {}) {
    const normalizedId = this.#normalizeId(
      team.id || team.teamId || team.team_id || team.slug || team.name
    );

    const overallWins = toNumber(
      team.overallWins ?? team.wins ?? team.record?.overallWins ?? team.record?.wins ?? 0
    );
    const overallLosses = toNumber(
      team.overallLosses ?? team.losses ?? team.record?.overallLosses ?? team.record?.losses ?? 0
    );

    return {
      ...clone(team),
      id: normalizedId,
      conferenceId: this.#normalizeId(team.conferenceId || team.conference || team.league),
      overallWins,
      overallLosses,
      quad1Wins: toNumber(team.quad1Wins ?? team.q1Wins ?? team.q1 ?? 0),
      quad2Wins: toNumber(team.quad2Wins ?? team.q2Wins ?? team.q2 ?? 0),
      quad3Losses: toNumber(team.quad3Losses ?? team.q3Losses ?? team.q3 ?? 0),
      quad4Losses: toNumber(team.quad4Losses ?? team.q4Losses ?? team.q4 ?? 0),
      rpiValue: this.#extractRpi(team),
      strengthOfSchedule: toNumber(team.strengthOfSchedule ?? team.sos ?? team.strength_of_schedule ?? 0),
      netRating: toNumber(team.netRating ?? team.rating ?? team.net_rating ?? 0),
      tempoFreeRating: toNumber(team.tempoFreeRating ?? 0),
    };
  }

  #normalizeGame(game = {}) {
    return {
      ...clone(game),
      homeTeamId: this.#normalizeId(game.homeTeamId || game.home_team_id || game.homeTeam || game.home),
      awayTeamId: this.#normalizeId(game.awayTeamId || game.away_team_id || game.awayTeam || game.away),
      homeScore: toNumber(game.homeScore ?? game.homeRuns ?? game.home_score ?? 0),
      awayScore: toNumber(game.awayScore ?? game.awayRuns ?? game.away_score ?? 0),
      conferenceGame: Boolean(game.conferenceGame ?? game.isConference ?? game.conference_matchup),
      date: game.date || game.gameDate || game.played_at || null,
    };
  }

  #normalizeId(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed.toLowerCase() : null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return null;
  }

  getTeam(teamId) {
    if (!teamId) return null;
    const normalized = this.#normalizeId(teamId);
    return normalized ? this.teamIndex.get(normalized) || null : null;
  }

  #extractRpi(team = {}) {
    const rpiCandidates = [
      team.rpi,
      team.rpiValue,
      team.rpi_value,
      team.metrics?.rpi,
      team.metrics?.rpiValue,
      team.rating?.rpi,
      team.rating?.rpiValue,
    ];

    for (const candidate of rpiCandidates) {
      const value = toNumber(candidate, NaN);
      if (Number.isFinite(value) && value !== 0) {
        return value;
      }
    }

    return NaN;
  }

  #normalizeRpi(value) {
    if (!Number.isFinite(value)) return 0.5;
    if (value <= 1) {
      return clamp(value, 0, 1);
    }
    const adjusted = clamp(value, 1, 400);
    const normalized = 1 - (adjusted - 1) / 399;
    return clamp(normalized, 0, 1);
  }

  #extractRecord(team) {
    if (!team) return { wins: 0, losses: 0, games: 0, winPct: 0.5 };

    const wins = toNumber(team.overallWins ?? team.wins ?? team.record?.wins ?? 0, 0);
    const losses = toNumber(team.overallLosses ?? team.losses ?? team.record?.losses ?? 0, 0);

    if (wins + losses > 0) {
      const winPct = wins / (wins + losses);
      return { wins, losses, games: wins + losses, winPct };
    }

    const normalizedId = team.id;
    let derivedWins = 0;
    let derivedLosses = 0;

    for (const game of this.games) {
      if (game.homeTeamId === normalizedId || game.awayTeamId === normalizedId) {
        const homeTeamWon = game.homeScore > game.awayScore;
        if (game.homeTeamId === normalizedId) {
          if (homeTeamWon) derivedWins += 1; else derivedLosses += 1;
        } else if (game.awayTeamId === normalizedId) {
          if (!homeTeamWon) derivedWins += 1; else derivedLosses += 1;
        }
      }
    }

    const totalGames = derivedWins + derivedLosses;
    const winPct = totalGames > 0 ? derivedWins / totalGames : 0.5;
    return { wins: derivedWins, losses: derivedLosses, games: totalGames, winPct };
  }

  #teamRating(team) {
    if (!team) return 1500;
    const record = this.#extractRecord(team);
    const rpiNormalized = this.#normalizeRpi(team.rpiValue);

    const margin = (team.runDifferentialPerGame ?? team.runDifferential ?? 0) * 15;
    const schedule = team.strengthOfSchedule ?? 0;
    const netRating = team.netRating ?? 0;

    const rating = 1500 + (record.winPct - 0.5) * 400 + (rpiNormalized - 0.5) * 500 + margin + schedule * 3 + netRating * 15;
    return clamp(rating, 1200, 1900);
  }

  #estimateOpponentWinPct(team) {
    if (!team) return 0.5;
    const record = this.#extractRecord(team);
    if (record.games > 0) return clamp(record.winPct, 0.2, 0.9);
    const rpiNormalized = this.#normalizeRpi(team.rpiValue);
    return clamp(0.35 + (rpiNormalized - 0.5) * 0.9, 0.2, 0.85);
  }

  calculateConferenceStrength(conferenceId) {
    const normalizedConference = this.#normalizeId(conferenceId);
    const conferenceTeams = this.teams.filter((team) => {
      if (!normalizedConference) return false;
      if (team.conferenceId === normalizedConference) return true;
      const conferenceName = (team.conference || team.league || '').toLowerCase();
      return conferenceName.includes(normalizedConference);
    });

    if (conferenceTeams.length === 0) {
      return {
        conferenceId,
        season: this.season,
        teamCount: 0,
        rating: 0,
        confidence: 0.1,
        metrics: {
          crossConferenceRecord: { wins: 0, losses: 0, winPct: 0 },
          intraConferenceRecord: { wins: 0, losses: 0, winPct: 0 },
          averageRpi: null,
          normalizedRpi: 0,
          runDifferentialPerGame: 0,
          qualityWinScore: 0,
          top50Wins: 0,
        },
        notes: 'Insufficient data to evaluate conference strength.',
      };
    }

    const conferenceTeamIds = new Set(conferenceTeams.map((team) => team.id));

    let crossWins = 0;
    let crossLosses = 0;
    let intraWins = 0;
    let intraLosses = 0;
    let runDifferential = 0;
    let crossGames = 0;
    let intraGames = 0;
    let top50Wins = 0;

    for (const game of this.games) {
      const homeInConf = conferenceTeamIds.has(game.homeTeamId);
      const awayInConf = conferenceTeamIds.has(game.awayTeamId);

      if (!homeInConf && !awayInConf) continue;

      const homeWon = game.homeScore > game.awayScore;
      const awayWon = game.awayScore > game.homeScore;

      if (homeInConf && awayInConf) {
        intraGames += 1;
        if (homeWon) intraWins += 1; else if (awayWon) intraLosses += 1;
        runDifferential += game.homeScore - game.awayScore;

        const opponentRpi = Math.min(
          this.#normalizeRpi(this.getTeam(game.homeTeamId)?.rpiValue ?? NaN),
          this.#normalizeRpi(this.getTeam(game.awayTeamId)?.rpiValue ?? NaN)
        );
        if (opponentRpi >= 0.75) {
          top50Wins += 0.5;
        }
      } else if (homeInConf || awayInConf) {
        crossGames += 1;
        const confTeamIsHome = homeInConf;
        const confTeamId = confTeamIsHome ? game.homeTeamId : game.awayTeamId;
        const confWon = (confTeamIsHome && homeWon) || (!confTeamIsHome && awayWon);
        if (confWon) crossWins += 1; else crossLosses += 1;

        const margin = confTeamIsHome ? game.homeScore - game.awayScore : game.awayScore - game.homeScore;
        runDifferential += margin;

        const opponentTeam = this.getTeam(confTeamIsHome ? game.awayTeamId : game.homeTeamId);
        if (this.#normalizeRpi(this.#extractRpi(opponentTeam)) >= 0.75 && confWon) {
          top50Wins += 1;
        }
      }
    }

    const crossWinPct = crossGames > 0 ? crossWins / Math.max(1, crossWins + crossLosses) : 0.5;
    const intraWinPct = intraGames > 0 ? intraWins / Math.max(1, intraWins + intraLosses) : 0.5;
    const runDiffPerGame = (crossGames + intraGames) > 0 ? runDifferential / (crossGames + intraGames) : 0;

    const rpiValues = conferenceTeams
      .map((team) => this.#normalizeRpi(team.rpiValue))
      .filter((value) => Number.isFinite(value));
    const averageRpi = rpiValues.length ? rpiValues.reduce((sum, value) => sum + value, 0) / rpiValues.length : 0.5;

    const qualityWinScoreRaw = conferenceTeams.reduce((total, team) => {
      const q1 = toNumber(team.quad1Wins, 0);
      const q2 = toNumber(team.quad2Wins, 0);
      const q3Losses = toNumber(team.quad3Losses, 0);
      const q4Losses = toNumber(team.quad4Losses, 0);
      return total + q1 + q2 * 0.6 - q3Losses * 0.3 - q4Losses * 0.6;
    }, 0);

    const qualityWinScore = clamp(
      qualityWinScoreRaw / Math.max(1, conferenceTeams.length * 4),
      -1,
      1
    );

    const rating = clamp(
      crossWinPct * 40 + averageRpi * 35 + (0.5 + runDiffPerGame / 10) * 15 + (qualityWinScore + 1) * 5,
      0,
      100
    );

    const confidence = clamp(0.45 + (crossGames + intraGames) / 160, 0.45, 0.96);

    return {
      conferenceId,
      season: this.season,
      teamCount: conferenceTeams.length,
      rating: Math.round(rating * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      metrics: {
        crossConferenceRecord: {
          wins: crossWins,
          losses: crossLosses,
          winPct: Math.round(crossWinPct * 1000) / 1000,
        },
        intraConferenceRecord: {
          wins: intraWins,
          losses: intraLosses,
          winPct: Math.round(intraWinPct * 1000) / 1000,
        },
        averageRpi: Math.round(averageRpi * 1000) / 1000,
        normalizedRpi: Math.round(averageRpi * 1000) / 1000,
        runDifferentialPerGame: Math.round(runDiffPerGame * 10) / 10,
        qualityWinScore: Math.round(qualityWinScore * 100) / 100,
        top50Wins: Math.round(top50Wins * 10) / 10,
      },
      notes: `Cross-conference win rate ${Math.round(crossWinPct * 100)}%, average normalized RPI ${(averageRpi * 100).toFixed(1)}.`,
    };
  }

  projectRpiShift(teamId, prospectiveMatchups = []) {
    const team = this.getTeam(teamId);
    if (!team) {
      return {
        teamId,
        season: this.season,
        baselineRpi: null,
        projectedRpi: null,
        rpiDelta: 0,
        confidence: 0,
        expectedRecord: null,
        projectedRank: null,
        baselineRank: null,
        scenarioBreakdown: [],
        notes: 'Team not found in dataset.'
      };
    }

    const record = this.#extractRecord(team);
    const baselineRpiRaw = this.#extractRpi(team);
    const baselineRpi = this.#normalizeRpi(baselineRpiRaw);
    const baselineRank = this.#rpiToRank(baselineRpi);

    const baselineOppWp = this.#estimateHistoricalOpponentsWinPct(team.id);
    const baselineOppOppWp = this.#estimateHistoricalOpponentsOppWinPct(team.id);

    let expectedWins = record.wins;
    let expectedLosses = record.losses;
    let projectedOppWpTotal = baselineOppWp.count > 0 ? baselineOppWp.total : record.games * 0.5;
    let projectedOppOppWpTotal = baselineOppOppWp.count > 0 ? baselineOppOppWp.total : record.games * 0.5;
    let projectedOppGames = baselineOppWp.count > 0 ? baselineOppWp.count : record.games;
    let projectedOppOppGames = baselineOppOppWp.count > 0 ? baselineOppOppWp.count : record.games;

    const scenarioBreakdown = [];

    for (const matchup of prospectiveMatchups) {
      const opponentId = this.#normalizeId(matchup.opponentId || matchup.opponent || matchup.id);
      const opponent = this.getTeam(opponentId) || matchup.opponentSnapshot || {};
      const opponentRating = this.#teamRating(opponent);
      const teamRating = this.#teamRating(team);
      const location = (matchup.location || matchup.venue || 'neutral').toLowerCase();
      const locationBonus = location === 'home' ? 45 : location === 'away' ? -45 : 0;
      const baseProbability = 1 / (1 + Math.exp(-(teamRating - opponentRating + locationBonus) / 120));
      const winProbability = clamp(matchup.winProbability ?? matchup.probability ?? baseProbability, 0.05, 0.95);

      expectedWins += winProbability;
      expectedLosses += 1 - winProbability;

      const opponentWinPct = this.#estimateOpponentWinPct(opponent);
      projectedOppWpTotal += opponentWinPct;
      projectedOppGames += 1;

      const opponentOppWinPct = clamp(
        matchup.opponentOppWinPct ?? opponent?.opponentsWinPct ?? opponentWinPct * 0.55 + 0.225,
        0.2,
        0.85
      );
      projectedOppOppWpTotal += opponentOppWinPct;
      projectedOppOppGames += 1;

      const rpiImpact = (winProbability - 0.5) * 0.015 + (opponentWinPct - 0.5) * 0.01;

      scenarioBreakdown.push({
        opponentId: opponentId || matchup.opponentName || 'unknown',
        opponentName: opponent?.name || matchup.opponentName || 'TBD Opponent',
        location,
        winProbability: Math.round(winProbability * 1000) / 10,
        projectedNet: Math.round((winProbability - 0.5) * 10) / 10,
        rpiContribution: Math.round(rpiImpact * 1000) / 1000,
        opponentRpi: Math.round(this.#normalizeRpi(this.#extractRpi(opponent)) * 1000) / 1000,
      });
    }

    const projectedGames = expectedWins + expectedLosses;
    const projectedWp = projectedGames > 0 ? expectedWins / projectedGames : 0.5;
    const projectedOppWp = projectedOppGames > 0 ? projectedOppWpTotal / projectedOppGames : 0.5;
    const projectedOppOppWp = projectedOppOppGames > 0 ? projectedOppOppWpTotal / projectedOppOppGames : 0.5;

    const projectedRpi = clamp(
      0.25 * projectedWp + 0.5 * projectedOppWp + 0.25 * projectedOppOppWp,
      0,
      1
    );

    const rpiDelta = projectedRpi - baselineRpi;
    const projectedRank = this.#rpiToRank(projectedRpi);

    return {
      teamId,
      season: this.season,
      baselineRpi: Math.round(baselineRpi * 1000) / 1000,
      projectedRpi: Math.round(projectedRpi * 1000) / 1000,
      rpiDelta: Math.round(rpiDelta * 1000) / 1000,
      baselineRank,
      projectedRank,
      confidence: Math.round(clamp(0.55 + prospectiveMatchups.length * 0.05, 0.55, 0.92) * 100) / 100,
      expectedRecord: {
        baselineWins: record.wins,
        baselineLosses: record.losses,
        projectedWins: Math.round(expectedWins * 10) / 10,
        projectedLosses: Math.round(expectedLosses * 10) / 10,
      },
      scenarioBreakdown,
      strengthOfScheduleIndex: Math.round(this.#strengthOfSchedule(team, prospectiveMatchups) * 100) / 100,
      notes: `Projected to move ${rpiDelta >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(rpiDelta * 1000) / 10)} RPI points with ${prospectiveMatchups.length} additional matchups.`,
    };
  }

  simulateSchedulingImpact(teamId, prospectiveMatchups = [], options = {}) {
    const team = this.getTeam(teamId);
    if (!team) {
      return {
        teamId,
        season: this.season,
        simulations: 0,
        expectedWinsAdded: 0,
        expectedLossesAdded: 0,
        postseasonOdds: { baseline: 0, projected: 0, delta: 0 },
        distribution: [],
        gated: false,
        notes: 'Team not found in dataset.'
      };
    }

    const record = this.#extractRecord(team);
    const baselineRpiNormalized = this.#normalizeRpi(this.#extractRpi(team));
    const baselinePostseasonOdds = this.#baselinePostseasonOdds(team);

    const sanitizedMatchups = prospectiveMatchups.map((matchup) => {
      const opponentId = this.#normalizeId(matchup.opponentId || matchup.opponent || matchup.id);
      const opponent = this.getTeam(opponentId) || matchup.opponentSnapshot || {};
      const opponentRating = this.#teamRating(opponent);
      const teamRating = this.#teamRating(team);
      const location = (matchup.location || 'neutral').toLowerCase();
      const locationBonus = location === 'home' ? 45 : location === 'away' ? -45 : 0;
      const baseProbability = 1 / (1 + Math.exp(-(teamRating - opponentRating + locationBonus) / 120));
      const winProbability = clamp(matchup.winProbability ?? matchup.probability ?? baseProbability, 0.05, 0.95);
      const opponentWinPct = this.#estimateOpponentWinPct(opponent);
      const rpiContribution = (winProbability - 0.5) * 0.015 + (opponentWinPct - 0.5) * 0.01;
      return {
        opponentId,
        opponentName: opponent?.name || matchup.opponentName || 'TBD Opponent',
        opponentRating,
        winProbability,
        opponentWinPct,
        rpiContribution,
        location,
      };
    });

    const requestedSimulations = Math.max(1, Math.round(options.simulations ?? DEFAULT_SIMULATIONS));
    const gated = Boolean(options.restrictAdvanced);
    const maxSimulations = gated
      ? Math.min(requestedSimulations, MAX_SIMULATIONS_FREE)
      : Math.min(requestedSimulations, MAX_SIMULATIONS_PRO);

    let totalWinsAdded = 0;
    let totalLossesAdded = 0;
    let postseasonHits = 0;
    const distribution = new Map();

    const baselineOppWp = this.#estimateHistoricalOpponentsWinPct(team.id);
    const baselineOppOppWp = this.#estimateHistoricalOpponentsOppWinPct(team.id);
    const baselineOppWpAverage = baselineOppWp.count > 0 ? baselineOppWp.total / baselineOppWp.count : 0.5;
    const baselineOppOppAverage = baselineOppOppWp.count > 0 ? baselineOppOppWp.total / baselineOppOppWp.count : 0.5;

    for (let i = 0; i < maxSimulations; i += 1) {
      let wins = record.wins;
      let losses = record.losses;
      let rpiAccumulator = baselineRpiNormalized;
      let oppWpAccumulator = baselineOppWpAverage * record.games;
      let oppOppAccumulator = baselineOppOppAverage * record.games;
      let oppGames = record.games;
      let oppOppGames = record.games;

      for (const matchup of sanitizedMatchups) {
        const result = Math.random() < matchup.winProbability;
        wins += result ? 1 : 0;
        losses += result ? 0 : 1;
        rpiAccumulator += result ? matchup.rpiContribution : -matchup.rpiContribution * 0.5;
        oppWpAccumulator += matchup.opponentWinPct;
        oppOppAccumulator += matchup.opponentWinPct * 0.55 + 0.225;
        oppGames += 1;
        oppOppGames += 1;
      }

      const totalGames = wins + losses;
      const winPct = totalGames > 0 ? wins / totalGames : 0.5;
      const oppWp = oppGames > 0 ? oppWpAccumulator / oppGames : 0.5;
      const oppOppWp = oppOppGames > 0 ? oppOppAccumulator / oppOppGames : 0.5;
      const simulatedRpi = clamp(0.25 * winPct + 0.5 * oppWp + 0.25 * oppOppWp, 0, 1);

      if (simulatedRpi >= POSTSEASON_RPI_THRESHOLD || wins >= POSTSEASON_WIN_THRESHOLD) {
        postseasonHits += 1;
      }

      totalWinsAdded += wins - record.wins;
      totalLossesAdded += losses - record.losses;

      const key = wins.toString();
      distribution.set(key, (distribution.get(key) ?? 0) + 1);
    }

    const expectedWinsAdded = totalWinsAdded / maxSimulations;
    const expectedLossesAdded = totalLossesAdded / maxSimulations;
    const projectedPostseasonOdds = maxSimulations > 0 ? postseasonHits / maxSimulations : baselinePostseasonOdds;

    const distributionSummary = Array.from(distribution.entries())
      .map(([wins, count]) => ({
        wins: Number(wins),
        probability: Math.round((count / maxSimulations) * 1000) / 10,
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    return {
      teamId,
      season: this.season,
      simulations: maxSimulations,
      expectedWinsAdded: Math.round(expectedWinsAdded * 100) / 100,
      expectedLossesAdded: Math.round(expectedLossesAdded * 100) / 100,
      postseasonOdds: {
        baseline: Math.round(baselinePostseasonOdds * 1000) / 10,
        projected: Math.round(projectedPostseasonOdds * 1000) / 10,
        delta: Math.round((projectedPostseasonOdds - baselinePostseasonOdds) * 1000) / 10,
      },
      distribution: distributionSummary,
      gated,
      confidence: Math.round(clamp(0.6 + maxSimulations / 4000, 0.6, 0.97) * 100) / 100,
      notes: gated
        ? 'Advanced optimization capped for non Diamond Pro members.'
        : `Monte Carlo simulation across ${maxSimulations} paths indicates a ${Math.round(projectedPostseasonOdds * 100)}% postseason likelihood.`,
    };
  }

  #estimateHistoricalOpponentsWinPct(teamId) {
    const normalizedTeamId = this.#normalizeId(teamId);
    if (!normalizedTeamId) return { total: 0, count: 0 };

    let total = 0;
    let count = 0;

    for (const game of this.games) {
      if (game.homeTeamId === normalizedTeamId) {
        const opponent = this.getTeam(game.awayTeamId);
        const oppWinPct = this.#estimateOpponentWinPct(opponent);
        total += oppWinPct;
        count += 1;
      } else if (game.awayTeamId === normalizedTeamId) {
        const opponent = this.getTeam(game.homeTeamId);
        const oppWinPct = this.#estimateOpponentWinPct(opponent);
        total += oppWinPct;
        count += 1;
      }
    }

    return { total, count };
  }

  #estimateHistoricalOpponentsOppWinPct(teamId) {
    const normalizedTeamId = this.#normalizeId(teamId);
    if (!normalizedTeamId) return { total: 0, count: 0 };

    let total = 0;
    let count = 0;

    for (const game of this.games) {
      if (game.homeTeamId === normalizedTeamId || game.awayTeamId === normalizedTeamId) {
        const opponentId = game.homeTeamId === normalizedTeamId ? game.awayTeamId : game.homeTeamId;
        const opponent = this.getTeam(opponentId);
        if (!opponent) continue;
        const opponentOpp = this.#estimateHistoricalOpponentsWinPct(opponent.id);
        if (opponentOpp.count > 0) {
          total += opponentOpp.total / opponentOpp.count;
          count += 1;
        }
      }
    }

    return { total, count };
  }

  #rpiToRank(normalizedRpi) {
    if (!Number.isFinite(normalizedRpi)) return null;
    const rank = Math.round((1 - normalizedRpi) * 300) + 1;
    return clamp(rank, 1, 999);
  }

  #baselinePostseasonOdds(team) {
    const record = this.#extractRecord(team);
    const rpiNormalized = this.#normalizeRpi(this.#extractRpi(team));
    const sos = toNumber(team.strengthOfSchedule ?? 0, 0);

    const rating = clamp(
      rpiNormalized * 0.6 + record.winPct * 0.3 + clamp(0.5 + sos / 200, 0.3, 0.7) * 0.1,
      0,
      1
    );
    return rating;
  }

  #strengthOfSchedule(team, prospectiveMatchups) {
    const opponents = [];
    for (const game of this.games) {
      if (game.homeTeamId === team.id) {
        opponents.push(this.getTeam(game.awayTeamId));
      } else if (game.awayTeamId === team.id) {
        opponents.push(this.getTeam(game.homeTeamId));
      }
    }
    for (const matchup of prospectiveMatchups) {
      const opponentId = this.#normalizeId(matchup.opponentId || matchup.opponent || matchup.id);
      opponents.push(this.getTeam(opponentId) || matchup.opponentSnapshot);
    }

    const ratings = opponents
      .map((opponent) => (opponent ? this.#normalizeRpi(this.#extractRpi(opponent)) : 0.5))
      .filter((value) => Number.isFinite(value));

    if (ratings.length === 0) return 0.5;
    const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    return clamp(avg, 0, 1);
  }

  buildConferenceRanking(conferenceId, teamId, projectedRpi) {
    const normalizedConference = this.#normalizeId(conferenceId);
    if (!normalizedConference) return [];

    const entries = this.teams
      .filter((team) => {
        if (team.conferenceId === normalizedConference) return true;
        const conferenceName = (team.conference || team.league || '').toLowerCase();
        return conferenceName.includes(normalizedConference);
      })
      .map((team) => {
        const baseline = this.#normalizeRpi(this.#extractRpi(team));
        const projected = team.id === this.#normalizeId(teamId) ? projectedRpi : baseline;
        return {
          teamId: team.id,
          teamName: team.name || team.displayName || team.school || 'Unknown',
          baselineRank: this.#rpiToRank(baseline),
          projectedRank: this.#rpiToRank(projected),
          rpiBaseline: Math.round(baseline * 1000) / 1000,
          rpiProjected: Math.round(projected * 1000) / 1000,
        };
      })
      .sort((a, b) => a.projectedRank - b.projectedRank)
      .slice(0, 10);

    return entries;
  }
}

export default StrengthModel;
export { StrengthModel };
