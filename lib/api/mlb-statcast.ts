/**
 * MLB StatCast API Integration
 * Fetches real pitch tracking data from MLB's StatCast system
 */

interface MLBStatCastPitch {
  game_pk: number;
  pitch_number: number;
  start_speed: number;
  end_speed: number;
  spin_rate: number;
  release_pos_x: number;
  release_pos_y: number;
  release_pos_z: number;
  plate_x: number;
  plate_z: number;
  pfx_x: number;
  pfx_z: number;
  pitch_type: string;
  description: string;
  pitcher: {
    id: number;
    fullName: string;
  };
  batter: {
    id: number;
    fullName: string;
  };
}

interface EnrichedPitchData {
  pitch_id: string;
  game_id: string;
  pitcher_id: string;
  batter_id: string;
  velocity: number;
  spin_rate: number;
  release_x: number;
  release_y: number;
  release_z: number;
  plate_x: number;
  plate_z: number;
  break_x: number;
  break_z: number;
  pitch_type: string;
  result: string;
  timestamp: string;
  pitcher_name: string;
  batter_name: string;
  pitch_number: number;
  inning: number;
  balls: number;
  strikes: number;
  outs: number;
}

/**
 * Fetch live game data from MLB Stats API
 */
export async function fetchMLBGameData(gameId: string): Promise<any> {
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BlazeSportsIntel/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`MLB API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching MLB game data:', error);
    throw error;
  }
}

/**
 * Transform MLB StatCast data to our format
 */
export function transformStatCastPitch(
  pitch: MLBStatCastPitch,
  gameId: string,
  timestamp: string,
  inning: number,
  balls: number,
  strikes: number,
  outs: number
): EnrichedPitchData {
  return {
    pitch_id: `${gameId}_${pitch.pitch_number}`,
    game_id: gameId,
    pitcher_id: String(pitch.pitcher.id),
    batter_id: String(pitch.batter.id),
    velocity: pitch.start_speed || 0,
    spin_rate: pitch.spin_rate || 0,
    release_x: pitch.release_pos_x || 0,
    release_y: pitch.release_pos_y || 54,
    release_z: pitch.release_pos_z || 6,
    plate_x: pitch.plate_x || 0,
    plate_z: pitch.plate_z || 2,
    break_x: pitch.pfx_x || 0,
    break_z: pitch.pfx_z || 0,
    pitch_type: pitch.pitch_type || 'UN',
    result: pitch.description || 'Unknown',
    timestamp,
    pitcher_name: pitch.pitcher.fullName,
    batter_name: pitch.batter.fullName,
    pitch_number: pitch.pitch_number,
    inning,
    balls,
    strikes,
    outs
  };
}

/**
 * Extract all pitches from a game feed
 */
export function extractPitchesFromGameFeed(gameFeed: any, gameId: string): EnrichedPitchData[] {
  const pitches: EnrichedPitchData[] = [];

  try {
    const allPlays = gameFeed.liveData?.plays?.allPlays || [];

    for (const play of allPlays) {
      const playEvents = play.playEvents || [];
      const inning = play.about?.inning || 1;

      for (const event of playEvents) {
        if (event.isPitch && event.pitchData) {
          const pitchData = event.pitchData;
          const matchup = play.matchup || {};

          const pitch: MLBStatCastPitch = {
            game_pk: parseInt(gameId),
            pitch_number: event.pitchNumber || 1,
            start_speed: pitchData.startSpeed || 0,
            end_speed: pitchData.endSpeed || 0,
            spin_rate: pitchData.breaks?.spinRate || 0,
            release_pos_x: pitchData.coordinates?.x || 0,
            release_pos_y: pitchData.coordinates?.y || 54,
            release_pos_z: pitchData.coordinates?.z || 6,
            plate_x: pitchData.coordinates?.pX || 0,
            plate_z: pitchData.coordinates?.pZ || 2,
            pfx_x: pitchData.breaks?.breakHorizontal || 0,
            pfx_z: pitchData.breaks?.breakVertical || 0,
            pitch_type: pitchData.details?.type?.code || 'UN',
            description: event.details?.description || '',
            pitcher: {
              id: matchup.pitcher?.id || 0,
              fullName: matchup.pitcher?.fullName || 'Unknown Pitcher'
            },
            batter: {
              id: matchup.batter?.id || 0,
              fullName: matchup.batter?.fullName || 'Unknown Batter'
            }
          };

          const transformed = transformStatCastPitch(
            pitch,
            gameId,
            event.startTime || new Date().toISOString(),
            inning,
            play.count?.balls || 0,
            play.count?.strikes || 0,
            play.count?.outs || 0
          );

          pitches.push(transformed);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting pitches from game feed:', error);
  }

  return pitches;
}

/**
 * Store pitch data in D1 database
 */
export async function storePitchData(
  db: D1Database,
  pitch: EnrichedPitchData
): Promise<void> {
  await db.prepare(`
    INSERT INTO pitches (
      pitch_id, game_id, pitcher_id, batter_id,
      velocity, spin_rate,
      release_x, release_y, release_z,
      plate_x, plate_z,
      break_x, break_z,
      pitch_type, result, timestamp,
      pitch_number, inning, balls, strikes, outs
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(pitch_id) DO UPDATE SET
      velocity = excluded.velocity,
      spin_rate = excluded.spin_rate,
      break_x = excluded.break_x,
      break_z = excluded.break_z
  `).bind(
    pitch.pitch_id,
    pitch.game_id,
    pitch.pitcher_id,
    pitch.batter_id,
    pitch.velocity,
    pitch.spin_rate,
    pitch.release_x,
    pitch.release_y,
    pitch.release_z,
    pitch.plate_x,
    pitch.plate_z,
    pitch.break_x,
    pitch.break_z,
    pitch.pitch_type,
    pitch.result,
    pitch.timestamp,
    pitch.pitch_number,
    pitch.inning,
    pitch.balls,
    pitch.strikes,
    pitch.outs
  ).run();
}

/**
 * Store player information in database
 */
export async function storePlayerData(
  db: D1Database,
  playerId: string,
  playerName: string,
  team?: string,
  position?: string
): Promise<void> {
  await db.prepare(`
    INSERT INTO players (player_id, name, team, position)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      name = excluded.name,
      team = excluded.team,
      position = excluded.position
  `).bind(playerId, playerName, team || null, position || null).run();
}

/**
 * Sync game data from MLB API to D1 database
 */
export async function syncGameData(
  db: D1Database,
  gameId: string
): Promise<{ pitchCount: number; success: boolean }> {
  try {
    // Fetch game data from MLB API
    const gameFeed = await fetchMLBGameData(gameId);

    // Extract pitches
    const pitches = extractPitchesFromGameFeed(gameFeed, gameId);

    // Store each pitch
    for (const pitch of pitches) {
      // Store player data
      await storePlayerData(db, pitch.pitcher_id, pitch.pitcher_name);
      await storePlayerData(db, pitch.batter_id, pitch.batter_name);

      // Store pitch data
      await storePitchData(db, pitch);
    }

    return {
      pitchCount: pitches.length,
      success: true
    };
  } catch (error) {
    console.error('Error syncing game data:', error);
    return {
      pitchCount: 0,
      success: false
    };
  }
}

/**
 * Get today's MLB games
 */
export async function getTodaysGames(): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const games = data.dates?.[0]?.games || [];
    return games.map((game: any) => ({
      gameId: String(game.gamePk),
      gameName: `${game.teams.away.team.name} @ ${game.teams.home.team.name}`,
      gameDate: game.gameDate,
      status: game.status.detailedState
    }));
  } catch (error) {
    console.error('Error fetching todays games:', error);
    return [];
  }
}
