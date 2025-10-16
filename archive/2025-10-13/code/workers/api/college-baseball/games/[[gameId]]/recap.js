/**
 * College Baseball Game Recap API Endpoint
 *
 * The Gap: ESPN shows final score and nothing else. No recap, no highlights, no context.
 * This endpoint provides comprehensive game recaps with narrative summary, key plays,
 * momentum analysis, and top performers that ESPN refuses to provide.
 *
 * Route: /api/college-baseball/games/:gameId/recap
 * Method: GET
 *
 * Response Structure:
 * {
 *   game: { id, teams, final score, date, venue },
 *   summary: "Narrative game summary with context",
 *   keyPlays: [{ inning, half, description, impact, context }],
 *   gameFlow: {
 *     momentum: [{ inning, awayScore, homeScore, momentum }],
 *     turningPoint: { inning, description, impact }
 *   },
 *   topPerformers: {
 *     hitting: [{ player, stats, highlight }],
 *     pitching: [{ player, stats, highlight }]
 *   },
 *   context: {
 *     recordImpact: "Team records after this game",
 *     conferenceImplications: "How this affects conference standings",
 *     streakInfo: "Winning/losing streak updates"
 *   },
 *   meta: { dataSource, lastUpdated, timezone }
 * }
 */

import { corsHeaders, ok, err } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const gameId = params.gameId?.[0];

  if (!gameId) {
    return err(new Error('Game ID is required'), 400);
  }

  try {
    const cacheKey = `college-baseball:recap:${gameId}`;

    // Cache recaps for 24 hours (game is over, recap won't change)
    const recap = await cache(env, cacheKey, async () => {
      return await generateGameRecap(env, parseInt(gameId));
    }, 86400); // 24 hour cache

    return ok(recap);
  } catch (error) {
    console.error('Game recap generation error:', error);
    // ESPN fallback (which doesn't provide recaps anyway)
    try {
      const espnRecap = await fetchESPNRecap(gameId);
      return ok(espnRecap);
    } catch (fallbackError) {
      console.error('ESPN fallback failed (as expected - they provide nothing):', fallbackError);
      return err(error);
    }
  }
}

/**
 * Generate comprehensive game recap from box score data
 */
async function generateGameRecap(env, gameId) {
  // Fetch box score for game analysis
  const boxScoreQuery = `
    SELECT
      g.id,
      g.ncaa_game_id,
      g.game_date,
      g.game_time,
      g.status,
      g.current_inning,
      g.inning_half,
      g.venue,
      g.attendance,
      g.conference_game,
      g.is_tournament,
      g.tournament_name,
      g.notes,
      g.weather,
      ht.id as home_team_id,
      ht.name as home_team_name,
      ht.conference as home_conference,
      ht.mascot as home_mascot,
      ht.colors as home_colors,
      g.home_score,
      g.home_winner,
      at.id as away_team_id,
      at.name as away_team_name,
      at.conference as away_conference,
      at.mascot as away_mascot,
      at.colors as away_colors,
      g.away_score,
      g.away_winner
    FROM college_baseball_games g
    INNER JOIN college_baseball_teams ht ON g.home_team_id = ht.id
    INNER JOIN college_baseball_teams at ON g.away_team_id = at.id
    WHERE g.id = ?
  `;

  const gameData = await env.DB.prepare(boxScoreQuery).bind(gameId).first();

  if (!gameData) {
    throw new Error('Game not found');
  }

  if (gameData.status !== 'final') {
    throw new Error('Game recap only available for completed games');
  }

  // Fetch hitting stats for both teams
  const hittingQuery = `
    SELECT
      gs.team_id,
      p.id as player_id,
      p.name,
      p.jersey,
      p.position,
      p.year,
      gs.batting_order,
      gs.ab,
      gs.r,
      gs.h,
      gs.doubles,
      gs.triples,
      gs.hr,
      gs.rbi,
      gs.bb,
      gs.k,
      gs.sb,
      gs.cs,
      CASE
        WHEN gs.ab > 0 THEN ROUND(CAST(gs.h AS REAL) / gs.ab, 3)
        ELSE 0
      END as avg
    FROM college_baseball_game_stats gs
    INNER JOIN college_baseball_players p ON gs.player_id = p.id
    WHERE gs.game_id = ?
      AND gs.ab > 0
    ORDER BY gs.team_id, gs.batting_order
  `;

  const hittingStats = await env.DB.prepare(hittingQuery).bind(gameId).all();

  // Fetch pitching stats for both teams
  const pitchingQuery = `
    SELECT
      gs.team_id,
      p.id as player_id,
      p.name,
      p.jersey,
      p.year,
      gs.ip,
      gs.h_allowed,
      gs.r_allowed,
      gs.er,
      gs.bb_allowed,
      gs.k_pitched,
      gs.decision,
      CASE
        WHEN gs.ip > 0 THEN ROUND((CAST(gs.er AS REAL) * 9) / gs.ip, 2)
        ELSE 0
      END as era
    FROM college_baseball_game_stats gs
    INNER JOIN college_baseball_players p ON gs.player_id = p.id
    WHERE gs.game_id = ?
      AND gs.ip > 0
    ORDER BY gs.team_id, gs.ip DESC
  `;

  const pitchingStats = await env.DB.prepare(pitchingQuery).bind(gameId).all();

  // Fetch inning-by-inning scoring for game flow analysis
  const linescoreQuery = `
    SELECT
      inning,
      away_runs,
      home_runs
    FROM college_baseball_linescore
    WHERE game_id = ?
    ORDER BY inning
  `;

  const linescore = await env.DB.prepare(linescoreQuery).bind(gameId).all();

  // Generate recap components
  const winner = gameData.home_winner ? gameData.home_team_name : gameData.away_team_name;
  const loser = gameData.home_winner ? gameData.away_team_name : gameData.home_team_name;
  const winningScore = gameData.home_winner ? gameData.home_score : gameData.away_score;
  const losingScore = gameData.home_winner ? gameData.home_score : gameData.away_score;

  // Analyze key plays from hitting stats
  const keyPlays = analyzeKeyPlays(hittingStats.results, pitchingStats.results, linescore.results, gameData);

  // Analyze game flow and momentum
  const gameFlow = analyzeGameFlow(linescore.results, gameData);

  // Identify top performers
  const topPerformers = identifyTopPerformers(hittingStats.results, pitchingStats.results, gameData);

  // Generate narrative summary
  const summary = generateNarrativeSummary(gameData, keyPlays, topPerformers, gameFlow);

  // Generate context about records, standings, streaks
  const context = await generateGameContext(env, gameData);

  return {
    game: {
      id: gameData.id,
      ncaaGameId: gameData.ncaa_game_id,
      date: gameData.game_date,
      time: gameData.game_time,
      venue: gameData.venue,
      attendance: gameData.attendance,
      conferenceGame: gameData.conference_game === 1,
      tournament: gameData.is_tournament === 1 ? {
        name: gameData.tournament_name,
        isTournament: true,
      } : null,
      weather: gameData.weather,
      teams: {
        away: {
          id: gameData.away_team_id,
          name: gameData.away_team_name,
          conference: gameData.away_conference,
          mascot: gameData.away_mascot,
          score: gameData.away_score,
          winner: gameData.away_winner === 1,
        },
        home: {
          id: gameData.home_team_id,
          name: gameData.home_team_name,
          conference: gameData.home_conference,
          mascot: gameData.home_mascot,
          score: gameData.home_score,
          winner: gameData.home_winner === 1,
        },
      },
      result: `${winner} ${winningScore}, ${loser} ${losingScore}`,
    },
    summary,
    keyPlays,
    gameFlow,
    topPerformers,
    context,
    meta: {
      dataSource: 'Blaze Sports Intel Game Analysis',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };
}

/**
 * Analyze key plays from hitting and pitching stats
 */
function analyzeKeyPlays(hittingStats, pitchingStats, linescore, gameData) {
  const keyPlays = [];

  // Find home runs (high impact)
  hittingStats.forEach(player => {
    if (player.hr > 0) {
      const teamName = player.team_id === gameData.home_team_id ? gameData.home_team_name : gameData.away_team_name;

      // Try to determine inning from scoring patterns
      const inning = estimatePlayInning(player, linescore);

      keyPlays.push({
        inning,
        half: player.team_id === gameData.away_team_id ? 'top' : 'bottom',
        description: `${player.name} ${player.hr > 1 ? `${player.hr} home runs` : 'home run'}`,
        type: 'homerun',
        player: {
          id: player.player_id,
          name: player.name,
          team: teamName,
        },
        impact: 'high',
        context: `${player.rbi} RBI${player.rbi > 1 ? 's' : ''}`,
      });
    }
  });

  // Find big innings (3+ runs scored in one inning)
  linescore.forEach((inning, idx) => {
    if (inning.away_runs >= 3) {
      keyPlays.push({
        inning: inning.inning,
        half: 'top',
        description: `${gameData.away_team_name} scores ${inning.away_runs} runs`,
        type: 'big_inning',
        impact: inning.away_runs >= 5 ? 'high' : 'medium',
        context: `${inning.away_runs}-run inning`,
      });
    }
    if (inning.home_runs >= 3) {
      keyPlays.push({
        inning: inning.inning,
        half: 'bottom',
        description: `${gameData.home_team_name} scores ${inning.home_runs} runs`,
        type: 'big_inning',
        impact: inning.home_runs >= 5 ? 'high' : 'medium',
        context: `${inning.home_runs}-run inning`,
      });
    }
  });

  // Find dominant pitching performances (10+ strikeouts or complete game)
  pitchingStats.forEach(pitcher => {
    if (pitcher.k_pitched >= 10) {
      const teamName = pitcher.team_id === gameData.home_team_id ? gameData.home_team_name : gameData.away_team_name;
      keyPlays.push({
        inning: 9,
        half: pitcher.team_id === gameData.away_team_id ? 'top' : 'bottom',
        description: `${pitcher.name} strikes out ${pitcher.k_pitched}`,
        type: 'dominant_pitching',
        player: {
          id: pitcher.player_id,
          name: pitcher.name,
          team: teamName,
        },
        impact: 'high',
        context: `${pitcher.ip} IP, ${pitcher.k_pitched} K`,
      });
    }

    // Complete game (7+ innings)
    if (pitcher.ip >= 7 && pitcher.decision) {
      const teamName = pitcher.team_id === gameData.home_team_id ? gameData.home_team_name : gameData.away_team_name;
      keyPlays.push({
        inning: 9,
        half: pitcher.team_id === gameData.away_team_id ? 'top' : 'bottom',
        description: `${pitcher.name} complete game`,
        type: 'complete_game',
        player: {
          id: pitcher.player_id,
          name: pitcher.name,
          team: teamName,
        },
        impact: 'high',
        context: `${pitcher.ip} IP, ${pitcher.decision}`,
      });
    }
  });

  // Find multi-hit games (3+ hits)
  hittingStats.forEach(player => {
    if (player.h >= 3) {
      const teamName = player.team_id === gameData.home_team_id ? gameData.home_team_name : gameData.away_team_name;
      keyPlays.push({
        inning: null,
        half: null,
        description: `${player.name} ${player.h}-for-${player.ab}`,
        type: 'multi_hit',
        player: {
          id: player.player_id,
          name: player.name,
          team: teamName,
        },
        impact: 'medium',
        context: `${player.h} hits, ${player.rbi} RBI`,
      });
    }
  });

  // Sort by impact (high first) and inning
  keyPlays.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
    if (impactDiff !== 0) return impactDiff;
    return (a.inning || 0) - (b.inning || 0);
  });

  return keyPlays.slice(0, 8); // Return top 8 key plays
}

/**
 * Estimate which inning a play occurred based on scoring patterns
 */
function estimatePlayInning(player, linescore) {
  // This is a simplified estimation - in production you'd want play-by-play data
  // For now, just estimate based on total runs scored
  if (!linescore || linescore.length === 0) return null;

  // Find innings with scoring
  const scoringInnings = linescore.filter(inning => {
    return (inning.away_runs > 0 || inning.home_runs > 0);
  });

  if (scoringInnings.length === 0) return null;

  // Return middle scoring inning as estimate
  return scoringInnings[Math.floor(scoringInnings.length / 2)]?.inning || null;
}

/**
 * Analyze game flow and momentum shifts
 */
function analyzeGameFlow(linescore, gameData) {
  if (!linescore || linescore.length === 0) {
    return {
      momentum: [],
      turningPoint: null,
    };
  }

  const momentum = [];
  let awayTotal = 0;
  let homeTotal = 0;
  let biggestMomentumShift = { inning: 0, magnitude: 0, description: '' };

  linescore.forEach((inning, idx) => {
    awayTotal += inning.away_runs;
    homeTotal += inning.home_runs;

    const differential = homeTotal - awayTotal;
    const previousDifferential = idx > 0 ? momentum[idx - 1].differential : 0;
    const momentumShift = Math.abs(differential - previousDifferential);

    // Track biggest momentum shift
    if (momentumShift > biggestMomentumShift.magnitude && momentumShift >= 3) {
      biggestMomentumShift = {
        inning: inning.inning,
        magnitude: momentumShift,
        description: inning.away_runs > inning.home_runs
          ? `${gameData.away_team_name} scores ${inning.away_runs} runs to shift momentum`
          : `${gameData.home_team_name} scores ${inning.home_runs} runs to shift momentum`,
      };
    }

    momentum.push({
      inning: inning.inning,
      awayScore: awayTotal,
      homeScore: homeTotal,
      differential,
      momentum: differential > 0 ? 'home' : differential < 0 ? 'away' : 'even',
      shift: momentumShift,
    });
  });

  return {
    momentum,
    turningPoint: biggestMomentumShift.magnitude >= 3 ? {
      inning: biggestMomentumShift.inning,
      description: biggestMomentumShift.description,
      impact: 'high',
    } : null,
  };
}

/**
 * Identify top performers in hitting and pitching
 */
function identifyTopPerformers(hittingStats, pitchingStats, gameData) {
  // Top 3 hitters by weighted performance score
  const hitters = hittingStats.map(player => {
    const teamName = player.team_id === gameData.home_team_id ? gameData.home_team_name : gameData.away_team_name;

    // Calculate weighted performance score
    const score = (player.h * 1) + (player.doubles * 1) + (player.triples * 2) +
                  (player.hr * 4) + (player.rbi * 1.5) + (player.r * 1) +
                  (player.sb * 0.5);

    return {
      player: {
        id: player.player_id,
        name: player.name,
        jersey: player.jersey,
        position: player.position,
        year: player.year,
        team: teamName,
      },
      stats: {
        ab: player.ab,
        r: player.r,
        h: player.h,
        doubles: player.doubles,
        triples: player.triples,
        hr: player.hr,
        rbi: player.rbi,
        bb: player.bb,
        k: player.k,
        avg: player.avg.toFixed(3),
      },
      performanceScore: score,
      highlight: generateHitterHighlight(player),
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 3);

  // Top 3 pitchers by weighted performance score
  const pitchers = pitchingStats.map(pitcher => {
    const teamName = pitcher.team_id === gameData.home_team_id ? gameData.home_team_name : gameData.away_team_name;

    // Calculate weighted performance score (lower is better for ERA, higher for K)
    const score = (pitcher.ip * 2) + (pitcher.k_pitched * 1.5) - (pitcher.er * 2) -
                  (pitcher.h_allowed * 0.5) - (pitcher.bb_allowed * 0.5);

    return {
      player: {
        id: pitcher.player_id,
        name: pitcher.name,
        jersey: pitcher.jersey,
        year: pitcher.year,
        team: teamName,
      },
      stats: {
        ip: pitcher.ip.toFixed(1),
        h: pitcher.h_allowed,
        r: pitcher.r_allowed,
        er: pitcher.er,
        bb: pitcher.bb_allowed,
        k: pitcher.k_pitched,
        decision: pitcher.decision,
        era: pitcher.era.toFixed(2),
      },
      performanceScore: score,
      highlight: generatePitcherHighlight(pitcher),
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 3);

  return {
    hitting: hitters,
    pitching: pitchers,
  };
}

/**
 * Generate highlight text for a hitter
 */
function generateHitterHighlight(player) {
  const highlights = [];

  if (player.hr > 0) {
    highlights.push(`${player.hr} HR`);
  }
  if (player.rbi >= 3) {
    highlights.push(`${player.rbi} RBI`);
  }
  if (player.h >= 3) {
    highlights.push(`${player.h}-for-${player.ab}`);
  }
  if (player.sb >= 2) {
    highlights.push(`${player.sb} SB`);
  }

  return highlights.length > 0
    ? highlights.join(', ')
    : `${player.h}-for-${player.ab}, ${player.rbi} RBI`;
}

/**
 * Generate highlight text for a pitcher
 */
function generatePitcherHighlight(pitcher) {
  const highlights = [];

  if (pitcher.ip >= 7) {
    highlights.push(`${pitcher.ip} IP`);
  }
  if (pitcher.k_pitched >= 10) {
    highlights.push(`${pitcher.k_pitched} K`);
  }
  if (pitcher.era <= 1.0 && pitcher.ip >= 5) {
    highlights.push(`${pitcher.era} ERA`);
  }
  if (pitcher.decision === 'W') {
    highlights.push('Win');
  }
  if (pitcher.decision === 'S') {
    highlights.push('Save');
  }

  return highlights.length > 0
    ? highlights.join(', ')
    : `${pitcher.ip} IP, ${pitcher.k_pitched} K, ${pitcher.era} ERA`;
}

/**
 * Generate narrative summary of the game
 */
function generateNarrativeSummary(gameData, keyPlays, topPerformers, gameFlow) {
  const winner = gameData.home_winner ? gameData.home_team_name : gameData.away_team_name;
  const loser = gameData.home_winner ? gameData.away_team_name : gameData.home_team_name;
  const winningScore = gameData.home_winner ? gameData.home_score : gameData.away_score;
  const losingScore = gameData.home_winner ? gameData.home_score : gameData.away_score;
  const margin = winningScore - losingScore;

  let summary = `${winner} defeated ${loser} ${winningScore}-${losingScore}`;

  // Add context about margin
  if (margin === 1) {
    summary += ' in a close contest';
  } else if (margin >= 10) {
    summary += ' in a dominant performance';
  } else if (margin >= 5) {
    summary += ' in a convincing victory';
  }

  // Add venue context
  if (gameData.attendance) {
    summary += ` at ${gameData.venue} in front of ${gameData.attendance.toLocaleString()} fans`;
  } else {
    summary += ` at ${gameData.venue}`;
  }

  summary += '. ';

  // Add top performer context
  if (topPerformers.hitting.length > 0) {
    const topHitter = topPerformers.hitting[0];
    summary += `${topHitter.player.name} led the offense with ${topHitter.highlight}. `;
  }

  if (topPerformers.pitching.length > 0) {
    const topPitcher = topPerformers.pitching[0];
    summary += `${topPitcher.player.name} dominated on the mound with ${topPitcher.highlight}. `;
  }

  // Add turning point context
  if (gameFlow.turningPoint) {
    summary += `The turning point came in the ${gameFlow.turningPoint.inning}${getOrdinalSuffix(gameFlow.turningPoint.inning)} inning when ${gameFlow.turningPoint.description.toLowerCase()}. `;
  }

  // Add conference/tournament context
  if (gameData.conference_game === 1) {
    summary += `The ${gameData.home_conference} conference matchup has significant implications for the standings.`;
  } else if (gameData.is_tournament === 1) {
    summary += `The ${gameData.tournament_name} victory keeps ${winner}'s tournament hopes alive.`;
  }

  return summary;
}

/**
 * Get ordinal suffix for inning number (1st, 2nd, 3rd, 4th, etc)
 */
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/**
 * Generate context about how this game affects records, standings, streaks
 */
async function generateGameContext(env, gameData) {
  const context = {
    recordImpact: null,
    conferenceImplications: null,
    streakInfo: null,
  };

  // Fetch updated team records
  const winnerId = gameData.home_winner ? gameData.home_team_id : gameData.away_team_id;
  const loserId = gameData.home_winner ? gameData.away_team_id : gameData.home_team_id;
  const winnerName = gameData.home_winner ? gameData.home_team_name : gameData.away_team_name;
  const loserName = gameData.home_winner ? gameData.away_team_name : gameData.home_team_name;

  // Calculate records after this game
  const recordQuery = `
    SELECT
      COUNT(*) FILTER (WHERE
        (home_team_id = ? AND home_winner = 1) OR
        (away_team_id = ? AND away_winner = 1)
      ) as wins,
      COUNT(*) FILTER (WHERE
        (home_team_id = ? AND home_winner = 0) OR
        (away_team_id = ? AND away_winner = 0)
      ) as losses,
      COUNT(*) FILTER (WHERE
        conference_game = 1 AND (
          (home_team_id = ? AND home_winner = 1) OR
          (away_team_id = ? AND away_winner = 1)
        )
      ) as conf_wins,
      COUNT(*) FILTER (WHERE
        conference_game = 1 AND (
          (home_team_id = ? AND home_winner = 0) OR
          (away_team_id = ? AND away_winner = 0)
        )
      ) as conf_losses
    FROM college_baseball_games
    WHERE status = 'final'
      AND strftime('%Y', game_date) = strftime('%Y', ?)
      AND game_date <= ?
      AND (home_team_id = ? OR away_team_id = ?)
  `;

  const winnerRecord = await env.DB.prepare(recordQuery)
    .bind(winnerId, winnerId, winnerId, winnerId, winnerId, winnerId, winnerId, winnerId,
          gameData.game_date, gameData.game_date, winnerId, winnerId)
    .first();

  const loserRecord = await env.DB.prepare(recordQuery)
    .bind(loserId, loserId, loserId, loserId, loserId, loserId, loserId, loserId,
          gameData.game_date, gameData.game_date, loserId, loserId)
    .first();

  if (winnerRecord && loserRecord) {
    context.recordImpact = `${winnerName} improves to ${winnerRecord.wins}-${winnerRecord.losses} ` +
                          `(${winnerRecord.conf_wins}-${winnerRecord.conf_losses} in conference). ` +
                          `${loserName} falls to ${loserRecord.wins}-${loserRecord.losses} ` +
                          `(${loserRecord.conf_wins}-${loserRecord.conf_losses} in conference).`;
  }

  // Conference implications for conference games
  if (gameData.conference_game === 1) {
    context.conferenceImplications = `This ${gameData.home_conference} conference game affects the race for the ` +
                                    `conference tournament. ${winnerName} strengthens their position while ` +
                                    `${loserName} will need to bounce back.`;
  }

  // Calculate current streaks
  const streakQuery = `
    SELECT
      game_date,
      CASE
        WHEN (home_team_id = ? AND home_winner = 1) OR (away_team_id = ? AND away_winner = 1) THEN 'W'
        ELSE 'L'
      END as result
    FROM college_baseball_games
    WHERE (home_team_id = ? OR away_team_id = ?)
      AND status = 'final'
      AND strftime('%Y', game_date) = strftime('%Y', ?)
      AND game_date <= ?
    ORDER BY game_date DESC
    LIMIT 10
  `;

  const winnerStreak = await env.DB.prepare(streakQuery)
    .bind(winnerId, winnerId, winnerId, winnerId, gameData.game_date, gameData.game_date)
    .all();

  if (winnerStreak.results && winnerStreak.results.length > 0) {
    let streak = 0;
    const streakType = winnerStreak.results[0].result;
    for (const game of winnerStreak.results) {
      if (game.result === streakType) {
        streak++;
      } else {
        break;
      }
    }

    if (streak >= 3) {
      context.streakInfo = `${winnerName} extends their ${streakType === 'W' ? 'winning' : 'losing'} ` +
                          `streak to ${streak} games.`;
    } else if (streak === 1 && winnerStreak.results.length > 1 && winnerStreak.results[1].result !== streakType) {
      context.streakInfo = `${winnerName} snaps a ${winnerStreak.results.filter((g, i) => i > 0 && g.result === winnerStreak.results[1].result).length} game ` +
                          `${winnerStreak.results[1].result === 'W' ? 'winning' : 'losing'} streak.`;
    }
  }

  return context;
}

/**
 * ESPN fallback (which doesn't provide recaps)
 */
async function fetchESPNRecap(gameId) {
  // ESPN doesn't provide game recaps for college baseball
  // Return minimal data with disclaimer
  return {
    game: null,
    summary: 'ESPN does not provide game recaps for college baseball.',
    keyPlays: [],
    gameFlow: { momentum: [], turningPoint: null },
    topPerformers: { hitting: [], pitching: [] },
    context: {
      recordImpact: null,
      conferenceImplications: null,
      streakInfo: null,
    },
    meta: {
      dataSource: 'ESPN API (No Recap Available)',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      disclaimer: 'ESPN does not provide game recaps for college baseball. This is why Blaze Sports Intel exists.',
    },
  };
}

/**
 * Cache helper function
 */
async function cache(env, key, fetcher, ttl = 300) {
  if (!env.CACHE) return await fetcher();

  const cached = await env.CACHE.get(key, 'json');
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const fresh = await fetcher();
  await env.CACHE.put(key, JSON.stringify({
    data: fresh,
    expires: Date.now() + (ttl * 1000),
  }), { expirationTtl: ttl });

  return fresh;
}
