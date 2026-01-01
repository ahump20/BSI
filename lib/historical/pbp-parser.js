/**
 * Blaze Sports Intel - Play-by-Play Parser
 *
 * Parses raw play-by-play data from various providers into unified format
 * for historical analysis, coaching decisions, and pattern recognition.
 *
 * Supported Sports:
 * - MLB: Pitch-by-pitch data from MLB Stats API
 * - NFL: Drive-by-drive and play-by-play from SportsDataIO
 * - NBA: Shot-by-shot and possession data from SportsDataIO
 * - NCAA Football: Play-by-play from ESPN API
 */

/**
 * Parse MLB play-by-play data
 *
 * @param {string} gameId - MLB game PK
 * @param {Object} rawData - Raw MLB API response
 * @returns {Object} Parsed PBP with standardized format
 */
export function parseMLBPlayByPlay(gameId, rawData) {
  const plays = [];
  const pitches = [];
  const situationalStats = {
    risp: { ab: 0, hits: 0 },
    two_outs: { ab: 0, hits: 0 },
    high_leverage: { ab: 0, hits: 0 },
  };

  try {
    const allPlays = rawData.liveData?.plays?.allPlays || [];

    for (const play of allPlays) {
      const playData = {
        play_id: play.about.guid,
        game_id: gameId,
        inning: play.about.inning,
        inning_half: play.about.halfInning,
        at_bat_index: play.about.atBatIndex,
        play_type: play.result.type,
        description: play.result.description,
        event: play.result.event,
        event_type: play.result.eventType,
        rbi: play.result.rbi || 0,
        away_score: play.result.awayScore,
        home_score: play.result.homeScore,
        outs_before: play.count?.outs || 0,
        outs_after: play.about.hasOut ? (play.count?.outs || 0) + 1 : play.count?.outs || 0,
        runners_on_base: {
          first: play.matchup.postOnFirst || null,
          second: play.matchup.postOnSecond || null,
          third: play.matchup.postOnThird || null,
        },
        batter_id: play.matchup.batter.id,
        batter_name: play.matchup.batter.fullName,
        pitcher_id: play.matchup.pitcher.id,
        pitcher_name: play.matchup.pitcher.fullName,
        batting_team: play.about.halfInning === 'top' ? 'away' : 'home',
        leverage_index: calculateLeverageIndex(play),
        win_probability_added: null, // Calculated post-processing
      };

      // Situational stats
      const runnersOn = [
        play.matchup.postOnFirst,
        play.matchup.postOnSecond,
        play.matchup.postOnThird,
      ].filter(Boolean).length;

      if (runnersOn >= 2 || play.matchup.postOnSecond || play.matchup.postOnThird) {
        situationalStats.risp.ab++;
        if (
          play.result.event === 'Single' ||
          play.result.event === 'Double' ||
          play.result.event === 'Triple' ||
          play.result.event === 'Home Run'
        ) {
          situationalStats.risp.hits++;
        }
      }

      if ((play.count?.outs || 0) === 2) {
        situationalStats.two_outs.ab++;
        if (
          play.result.event === 'Single' ||
          play.result.event === 'Double' ||
          play.result.event === 'Triple' ||
          play.result.event === 'Home Run'
        ) {
          situationalStats.two_outs.hits++;
        }
      }

      plays.push(playData);

      // Parse pitch data
      for (const pitchData of play.playEvents || []) {
        if (pitchData.isPitch) {
          pitches.push({
            pitch_id: `${play.about.guid}_${pitchData.pitchNumber}`,
            play_id: play.about.guid,
            pitch_number: pitchData.pitchNumber,
            pitch_type: pitchData.details?.type?.code || null,
            pitch_type_description: pitchData.details?.type?.description || null,
            speed_mph: pitchData.pitchData?.startSpeed || null,
            spin_rate_rpm: pitchData.pitchData?.breaks?.spinRate || null,
            break_horizontal_inches: pitchData.pitchData?.breaks?.breakHorizontal || null,
            break_vertical_inches: pitchData.pitchData?.breaks?.breakVertical || null,
            zone_location: pitchData.pitchData?.zone || null,
            coordinates: {
              x: pitchData.pitchData?.coordinates?.x || null,
              y: pitchData.pitchData?.coordinates?.y || null,
            },
            result: pitchData.details?.description || null,
            count: {
              balls: pitchData.count?.balls || 0,
              strikes: pitchData.count?.strikes || 0,
              outs: pitchData.count?.outs || 0,
            },
          });
        }
      }
    }

    return {
      game_id: gameId,
      plays,
      pitches,
      situational_stats: situationalStats,
      summary: {
        total_plays: plays.length,
        total_pitches: pitches.length,
        avg_pitches_per_ab: pitches.length / plays.length,
      },
    };
  } catch (error) {
    console.error('MLB PBP parsing error:', error);
    throw error;
  }
}

/**
 * Parse NFL play-by-play data
 *
 * @param {string} gameId - NFL game key
 * @param {Object} rawData - Raw SportsDataIO response
 * @returns {Object} Parsed PBP with standardized format
 */
export function parseNFLPlayByPlay(gameId, rawData) {
  const drives = [];
  const plays = [];
  const fourthDownDecisions = [];

  try {
    const allPlays = rawData.Plays || [];

    // Group plays by drive
    const driveMap = new Map();

    for (const play of allPlays) {
      const driveKey = `Q${play.Quarter}_${play.PossessionTeam}`;

      if (!driveMap.has(driveKey)) {
        driveMap.set(driveKey, {
          drive_id: `${gameId}_${driveKey}`,
          quarter: play.Quarter,
          possession_team: play.PossessionTeam,
          plays: [],
          yards_gained: 0,
          time_of_possession: 0,
          result: null,
        });
      }

      const playData = {
        play_id: play.PlayID,
        game_id: gameId,
        drive_id: driveMap.get(driveKey).drive_id,
        quarter: play.Quarter,
        time: play.TimeRemaining,
        down: play.Down,
        distance: play.Distance,
        yard_line: play.YardLine,
        yard_line_territory: play.YardLineTerritory,
        possession_team: play.PossessionTeam,
        play_type: play.PlayType,
        description: play.Description,
        yards_gained: play.Yards || 0,
        formation: play.Formation || null,
        pass_result: play.IsPass ? play.PassResult : null,
        rush_type: play.IsRush ? play.RushType : null,
        is_touchdown: play.IsTouchdown || false,
        is_turnover: play.IsFumble || play.IsInterception || false,
        is_penalty: play.IsPenalty || false,
        penalty_team: play.PenaltyTeam || null,
        penalty_type: play.PenaltyType || null,
        penalty_yards: play.PenaltyYards || 0,
        scoring_play: play.IsScoringPlay || false,
        home_score: play.HomeScore,
        away_score: play.AwayScore,
      };

      // Track 4th down decisions
      if (play.Down === 4) {
        fourthDownDecisions.push({
          play_id: play.PlayID,
          decision: play.PlayType,
          down: 4,
          distance: play.Distance,
          yard_line: play.YardLine,
          score_differential: Math.abs(play.HomeScore - play.AwayScore),
          quarter: play.Quarter,
          time_remaining: play.TimeRemaining,
          success: play.Yards >= play.Distance,
        });
      }

      driveMap.get(driveKey).plays.push(playData);
      driveMap.get(driveKey).yards_gained += play.Yards || 0;

      plays.push(playData);
    }

    // Calculate drive results
    for (const [_key, drive] of driveMap) {
      const lastPlay = drive.plays[drive.plays.length - 1];

      if (lastPlay.is_touchdown) {
        drive.result = 'touchdown';
      } else if (lastPlay.play_type === 'Field Goal') {
        drive.result = 'field_goal';
      } else if (lastPlay.is_turnover) {
        drive.result = 'turnover';
      } else if (lastPlay.down === 4 && lastPlay.yards_gained < lastPlay.distance) {
        drive.result = 'turnover_on_downs';
      } else {
        drive.result = 'punt';
      }

      drives.push(drive);
    }

    return {
      game_id: gameId,
      drives,
      plays,
      fourth_down_decisions: fourthDownDecisions,
      summary: {
        total_drives: drives.length,
        total_plays: plays.length,
        avg_plays_per_drive: plays.length / drives.length,
        fourth_down_attempts: fourthDownDecisions.length,
        fourth_down_conversions: fourthDownDecisions.filter((d) => d.success).length,
      },
    };
  } catch (error) {
    console.error('NFL PBP parsing error:', error);
    throw error;
  }
}

/**
 * Parse NBA play-by-play data
 *
 * @param {string} gameId - NBA game ID
 * @param {Object} rawData - Raw SportsDataIO response
 * @returns {Object} Parsed PBP with standardized format
 */
export function parseNBAPlayByPlay(gameId, rawData) {
  const plays = [];
  const shots = [];
  const possessions = [];

  try {
    const allPlays = rawData.Plays || [];

    let currentPossession = null;

    for (const play of allPlays) {
      const playData = {
        play_id: play.PlayID,
        game_id: gameId,
        quarter: play.QuarterID,
        time: play.TimeRemainingMinutes,
        play_type: play.Type,
        description: play.Description,
        team: play.TeamID,
        player_id: play.PlayerID,
        player_name: play.PlayerName,
        points_scored: play.Points || 0,
        home_score: play.HomeScore,
        away_score: play.AwayScore,
        is_shot: play.Type?.includes('Shot') || play.Type?.includes('Made') || false,
        is_make: play.Type?.includes('Made') || false,
        shot_type: play.ShotType || null,
        distance: play.ShotDistance || null,
      };

      // Track shots
      if (playData.is_shot) {
        shots.push({
          shot_id: play.PlayID,
          player_id: play.PlayerID,
          shot_type: play.ShotType,
          distance: play.ShotDistance,
          made: playData.is_make,
          coordinates: {
            x: play.CoordinateX || null,
            y: play.CoordinateY || null,
          },
        });
      }

      // Track possession changes
      if (play.Type === 'Turnover' || play.Type === 'Rebound' || playData.is_shot) {
        if (currentPossession && currentPossession.team !== play.TeamID) {
          possessions.push(currentPossession);
          currentPossession = null;
        }

        if (!currentPossession) {
          currentPossession = {
            possession_id: `${gameId}_${possessions.length}`,
            team: play.TeamID,
            quarter: play.QuarterID,
            start_time: play.TimeRemainingMinutes,
            plays: [],
            points_scored: 0,
          };
        }

        currentPossession.plays.push(playData);
        currentPossession.points_scored += playData.points_scored;
      }

      plays.push(playData);
    }

    // Add final possession
    if (currentPossession) {
      possessions.push(currentPossession);
    }

    return {
      game_id: gameId,
      plays,
      shots,
      possessions,
      summary: {
        total_plays: plays.length,
        total_shots: shots.length,
        total_possessions: possessions.length,
        fg_percentage: ((shots.filter((s) => s.made).length / shots.length) * 100).toFixed(1),
      },
    };
  } catch (error) {
    console.error('NBA PBP parsing error:', error);
    throw error;
  }
}

/**
 * Parse NCAA Football play-by-play data
 *
 * @param {string} gameId - NCAA game ID
 * @param {Object} rawData - Raw ESPN API response
 * @returns {Object} Parsed PBP with standardized format
 */
export function parseNCAAFootballPlayByPlay(gameId, rawData) {
  const drives = [];
  const plays = [];

  try {
    const allDrives = rawData.drives?.previous || [];

    for (const drive of allDrives) {
      const driveData = {
        drive_id: `${gameId}_${drive.id}`,
        team: drive.team.abbreviation,
        plays_count: drive.plays,
        yards: drive.yards,
        time_elapsed_seconds: drive.timeElapsed?.totalSeconds || 0,
        result: drive.result || null,
        start: {
          yard_line: drive.start?.yardLine || null,
          quarter: drive.start?.period?.number || null,
          time: drive.start?.clock?.displayValue || null,
        },
        end: {
          yard_line: drive.end?.yardLine || null,
          quarter: drive.end?.period?.number || null,
          time: drive.end?.clock?.displayValue || null,
        },
      };

      drives.push(driveData);

      // Parse individual plays within drive
      for (const play of drive.plays || []) {
        plays.push({
          play_id: play.id,
          game_id: gameId,
          drive_id: driveData.drive_id,
          down: play.start?.down || null,
          distance: play.start?.distance || null,
          yard_line: play.start?.yardLine || null,
          play_type: play.type?.text || null,
          description: play.text || null,
          yards_gained: play.statYardage || 0,
          scoring_play: play.scoringPlay || false,
          turnover: play.type?.text?.includes('Turnover') || false,
        });
      }
    }

    return {
      game_id: gameId,
      drives,
      plays,
      summary: {
        total_drives: drives.length,
        total_plays: plays.length,
        avg_plays_per_drive: plays.length / drives.length || 0,
      },
    };
  } catch (error) {
    console.error('NCAA Football PBP parsing error:', error);
    throw error;
  }
}

/**
 * Calculate leverage index for MLB situations
 * (simplified version - full implementation would use win expectancy table)
 */
function calculateLeverageIndex(play) {
  const inning = play.about.inning;
  const halfInning = play.about.halfInning;
  const scoreDiff = Math.abs(play.result.homeScore - play.result.awayScore);
  const outs = play.count?.outs || 0;

  // Late innings = higher leverage
  let leverage = 1.0;

  if (inning >= 7) {
    leverage *= 1.5;
  }
  if (inning >= 9) {
    leverage *= 2.0;
  }

  // Close game = higher leverage
  if (scoreDiff === 0) {
    leverage *= 2.0;
  } else if (scoreDiff === 1) {
    leverage *= 1.5;
  } else if (scoreDiff === 2) {
    leverage *= 1.2;
  }

  // Two outs = higher leverage
  if (outs === 2) {
    leverage *= 1.3;
  }

  // Runners in scoring position
  if (play.matchup.postOnSecond || play.matchup.postOnThird) {
    leverage *= 1.5;
  }

  return Math.round(leverage * 100) / 100;
}

/**
 * Unified parser interface - auto-detects sport
 */
export function parsePlayByPlay(gameId, sport, rawData) {
  switch (sport.toUpperCase()) {
    case 'MLB':
      return parseMLBPlayByPlay(gameId, rawData);
    case 'NFL':
      return parseNFLPlayByPlay(gameId, rawData);
    case 'NBA':
      return parseNBAPlayByPlay(gameId, rawData);
    case 'NCAA_FOOTBALL':
    case 'NCAAF':
      return parseNCAAFootballPlayByPlay(gameId, rawData);
    default:
      throw new Error(`Unsupported sport: ${sport}`);
  }
}
