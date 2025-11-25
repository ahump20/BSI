/**
 * Blaze Sports Intel - Live Game Monitoring Engine
 * Real-time event detection and data ingestion for MLB, NFL, NBA, NCAA
 *
 * @module lib/reconstruction/live-monitor
 * @version 1.0.0
 */

import type {
  LiveGame,
  LiveEvent,
  StartMonitoringRequest,
  StartMonitoringResponse,
  Sport,
  EventType,
  GameState,
  EventRawData,
  StatcastData,
} from './types';

// ============================================================================
// ENVIRONMENT & DATABASE
// ============================================================================

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

// ============================================================================
// MLB STATS API CLIENT
// ============================================================================

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1.1';

interface MLBGameData {
  gamePk: number;
  gameData: {
    teams: {
      home: { name: string };
      away: { name: string };
    };
    datetime: {
      dateTime: string;
    };
    status: {
      abstractGameState: string;
      detailedState: string;
    };
  };
  liveData: {
    plays: {
      currentPlay: unknown;
      allPlays: Array<{
        result: {
          event: string;
          description: string;
        };
        about: {
          inning: number;
          halfInning: string;
          atBatIndex: number;
        };
        count: {
          balls: number;
          strikes: number;
          outs: number;
        };
        matchup: {
          batter: { fullName: string; id: number };
          pitcher: { fullName: string; id: number };
        };
        playEvents: Array<{
          details: {
            event?: string;
            eventType?: string;
          };
          hitData?: {
            launchSpeed?: number;
            launchAngle?: number;
            totalDistance?: number;
            trajectory?: string;
            hardness?: string;
            location?: string;
            coordinates?: { coordX: number; coordY: number };
          };
          pitchData?: {
            startSpeed?: number;
            endSpeed?: number;
            strikeZoneTop?: number;
            strikeZoneBottom?: number;
            coordinates?: {
              x?: number;
              y?: number;
              pX?: number;
              pZ?: number;
            };
            breaks?: {
              breakAngle?: number;
              breakLength?: number;
              breakY?: number;
              spinRate?: number;
              spinDirection?: number;
            };
          };
        }>;
      }>;
    };
    linescore: {
      currentInning: number;
      currentInningOrdinal: string;
      inningState: string;
      innings: Array<{
        num: number;
        home: { runs: number };
        away: { runs: number };
      }>;
      teams: {
        home: { runs: number; hits: number; errors: number };
        away: { runs: number; hits: number; errors: number };
      };
    };
  };
}

/**
 * Fetch live MLB game data
 */
async function fetchMLBGame(gameId: string): Promise<MLBGameData> {
  const response = await fetch(`${MLB_API_BASE}/game/${gameId}/feed/live`);

  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate leverage index for MLB play
 */
function calculateLeverageIndex(
  inning: number,
  outs: number,
  runners: { first: boolean; second: boolean; third: boolean },
  scoreDiff: number
): number {
  // Simplified leverage index calculation
  // Peak leverage: close game, late innings, runners on base

  const inningFactor = Math.min(1, (inning - 1) / 8); // Increases through 9th inning
  const outsFactor = [0.8, 0.9, 1.0][outs] ?? 1.0;

  const runnersOnBase =
    (runners.first ? 1 : 0) + (runners.second ? 1 : 0) + (runners.third ? 1 : 0);
  const runnersFactor = 1 + runnersOnBase * 0.3;

  const scoreDiffFactor = 1 / (1 + Math.abs(scoreDiff) * 0.3);

  return inningFactor * outsFactor * runnersFactor * scoreDiffFactor * 2; // Scale to 0-2 range
}

/**
 * Calculate win probability delta (simplified)
 */
function calculateWinProbDelta(
  beforeState: { inning: number; outs: number; runners: string; score: number },
  afterState: { inning: number; outs: number; runners: string; score: number }
): number {
  // Simplified WP calculation - in production, use lookup tables
  const beforeWP = 0.5 + beforeState.score * 0.1;
  const afterWP = 0.5 + afterState.score * 0.1;

  return afterWP - beforeWP;
}

// ============================================================================
// EVENT DETECTION: MLB
// ============================================================================

/**
 * Detect analytically significant MLB events
 */
function detectMLBEvents(gameData: MLBGameData, previousPlays: Set<number>): LiveEvent[] {
  const events: LiveEvent[] = [];
  const plays = gameData.liveData.plays.allPlays;

  for (const play of plays) {
    const playIndex = play.about.atBatIndex;

    // Skip if already processed
    if (previousPlays.has(playIndex)) continue;
    previousPlays.add(playIndex);

    const hitData = play.playEvents.find((e) => e.hitData)?.hitData;
    const pitchData = play.playEvents[play.playEvents.length - 1]?.pitchData;

    // Detect batted ball events
    if (hitData && hitData.launchSpeed && hitData.launchAngle) {
      const exitVelo = hitData.launchSpeed;
      const launchAngle = hitData.launchAngle;
      const distance = hitData.totalDistance ?? 0;

      // Significance criteria
      let significanceScore = 0;

      // High exit velocity
      if (exitVelo >= 110) significanceScore += 30;
      else if (exitVelo >= 100) significanceScore += 20;

      // Extreme launch angles
      if (Math.abs(launchAngle) >= 40) significanceScore += 20;

      // Long distance
      if (distance >= 450) significanceScore += 30;
      else if (distance >= 400) significanceScore += 20;

      // Home run
      if (play.result.event === 'Home Run') significanceScore += 25;

      // Rare trajectory
      if (hitData.trajectory === 'bloop' || hitData.trajectory === 'popup') {
        significanceScore += 10;
      }

      if (significanceScore >= 40) {
        // This is an analytically interesting batted ball
        events.push(
          createMLBEvent(gameData, play, 'batted_ball', significanceScore, hitData, null)
        );
      }
    }

    // Detect pitch events with unusual characteristics
    if (pitchData && pitchData.breaks) {
      const spinRate = pitchData.breaks.spinRate ?? 0;
      const velocity = pitchData.startSpeed ?? 0;

      let significanceScore = 0;

      // Extreme spin rate
      if (spinRate >= 3000) significanceScore += 30;
      else if (spinRate >= 2700) significanceScore += 20;

      // Extreme velocity
      if (velocity >= 100) significanceScore += 30;
      else if (velocity >= 97) significanceScore += 20;

      // Unusual break
      const breakLength = pitchData.breaks.breakLength ?? 0;
      if (breakLength >= 15) significanceScore += 25;

      if (significanceScore >= 40) {
        events.push(createMLBEvent(gameData, play, 'pitch', significanceScore, null, pitchData));
      }
    }

    // Detect defensive plays (catches with low probability)
    if (play.result.event === 'Flyout' || play.result.event === 'Lineout') {
      // Estimate catch difficulty based on hit data
      if (hitData && hitData.launchSpeed && hitData.totalDistance) {
        const estimatedCatchDifficulty =
          (hitData.launchSpeed / 100) * (hitData.totalDistance / 300);

        if (estimatedCatchDifficulty > 1.2) {
          // Difficult catch
          const significanceScore = 50 + estimatedCatchDifficulty * 10;
          events.push(
            createMLBEvent(gameData, play, 'defensive_play', significanceScore, hitData, null)
          );
        }
      }
    }

    // Detect scoring plays with high leverage
    if (play.result.event.includes('RBI') || play.result.event === 'Home Run') {
      const runners = {
        first: play.about.halfInning.includes('1st'),
        second: play.about.halfInning.includes('2nd'),
        third: play.about.halfInning.includes('3rd'),
      };

      const scoreDiff = Math.abs(
        gameData.liveData.linescore.teams.home.runs - gameData.liveData.linescore.teams.away.runs
      );

      const leverageIndex = calculateLeverageIndex(
        play.about.inning,
        play.count.outs,
        runners,
        scoreDiff
      );

      if (leverageIndex >= 1.5) {
        const significanceScore = 60 + leverageIndex * 10;
        events.push(
          createMLBEvent(gameData, play, 'scoring_play', significanceScore, hitData, null)
        );
      }
    }
  }

  return events;
}

/**
 * Create MLB event object
 */
function createMLBEvent(
  gameData: MLBGameData,
  play: MLBGameData['liveData']['plays']['allPlays'][0],
  eventType: EventType,
  significanceScore: number,
  hitData: MLBGameData['liveData']['plays']['allPlays'][0]['playEvents'][0]['hitData'] | null,
  pitchData: MLBGameData['liveData']['plays']['allPlays'][0]['playEvents'][0]['pitchData'] | null
): Omit<LiveEvent, 'id' | 'gameId' | 'createdAt'> {
  const linescore = gameData.liveData.linescore;

  const rawData: EventRawData = {
    playId: `${gameData.gamePk}-${play.about.atBatIndex}`,
    description: play.result.description,
    players: [
      {
        id: play.matchup.batter.id.toString(),
        name: play.matchup.batter.fullName,
        position: 'Batter',
      },
      {
        id: play.matchup.pitcher.id.toString(),
        name: play.matchup.pitcher.fullName,
        position: 'Pitcher',
      },
    ],
    situation: {
      inning: play.about.inning,
      outs: play.count.outs,
      runners: `${play.count.balls}-${play.count.strikes}`,
    },
  };

  const statcastData: StatcastData | null = hitData
    ? {
        exitVelocity: hitData.launchSpeed,
        launchAngle: hitData.launchAngle,
        hitDistance: hitData.totalDistance,
      }
    : pitchData
      ? {
          pitchVelocity: pitchData.startSpeed,
          spinRate: pitchData.breaks?.spinRate,
          breakDistance: pitchData.breaks?.breakLength,
        }
      : null;

  const scoreDiff = Math.abs(linescore.teams.home.runs - linescore.teams.away.runs);
  const runners = { first: false, second: false, third: false }; // Simplified
  const leverageIndex = calculateLeverageIndex(
    play.about.inning,
    play.count.outs,
    runners,
    scoreDiff
  );

  return {
    sport: 'mlb',
    eventType,
    timestamp: new Date().toISOString(),
    gameTimestamp: `${play.about.halfInning} ${play.about.inning}, ${play.count.outs} outs`,
    leverageIndex,
    winProbDelta: null, // Calculate in production
    expectedValue: null,
    actualValue: null,
    significanceScore,
    rawData,
    statcastData,
    isReconstructed: false,
    isPublished: false,
  };
}

// ============================================================================
// LIVE MONITORING SERVICE
// ============================================================================

export class LiveMonitor {
  private env: Env;
  private monitoringIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Start monitoring a live game
   */
  async startMonitoring(request: StartMonitoringRequest): Promise<StartMonitoringResponse> {
    const liveGameId = `${request.sport}-${request.gameId}-${Date.now()}`;

    // Insert into database
    await this.env.DB.prepare(
      `INSERT INTO live_games
       (id, sport, game_id, home_team, away_team, is_active, start_time, poll_interval_seconds)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(
        liveGameId,
        request.sport,
        request.gameId,
        request.homeTeam,
        request.awayTeam,
        request.startTime,
        request.pollIntervalSeconds ?? 15
      )
      .run();

    // Start polling in background (for Cloudflare Workers Cron Trigger)
    // Note: In production, use Durable Objects or Cron Triggers
    console.log(`Started monitoring: ${liveGameId}`);

    return {
      success: true,
      liveGameId,
      message: `Monitoring started for ${request.sport} game ${request.gameId}`,
    };
  }

  /**
   * Poll a single game for updates (called by Cron Trigger)
   */
  async pollGame(liveGameId: string): Promise<void> {
    // Fetch game metadata
    const gameResult = await this.env.DB.prepare(
      'SELECT * FROM live_games WHERE id = ? AND is_active = 1'
    )
      .bind(liveGameId)
      .first<LiveGame>();

    if (!gameResult) {
      console.log(`Game ${liveGameId} not found or inactive`);
      return;
    }

    const game = gameResult;

    // Fetch live data based on sport
    try {
      if (game.sport === 'mlb') {
        await this.pollMLBGame(game);
      } else if (game.sport === 'nfl') {
        await this.pollNFLGame(game);
      } else if (game.sport === 'nba') {
        await this.pollNBAGame(game);
      }

      // Update last polled timestamp
      await this.env.DB.prepare('UPDATE live_games SET last_polled = ? WHERE id = ?')
        .bind(new Date().toISOString(), liveGameId)
        .run();
    } catch (error) {
      console.error(`Error polling game ${liveGameId}:`, error);
    }
  }

  /**
   * Poll MLB game
   */
  private async pollMLBGame(game: LiveGame): Promise<void> {
    const gameData = await fetchMLBGame(game.gameId);

    // Check if game is still active
    const gameStatus = gameData.gameData.status.abstractGameState;
    if (gameStatus === 'Final' || gameStatus === 'Completed') {
      await this.env.DB.prepare('UPDATE live_games SET is_active = 0 WHERE id = ?')
        .bind(game.id)
        .run();
      console.log(`Game ${game.id} completed`);
      return;
    }

    // Update game state
    const gameState: GameState = {
      period: gameData.liveData.linescore.currentInning,
      score: {
        home: gameData.liveData.linescore.teams.home.runs,
        away: gameData.liveData.linescore.teams.away.runs,
      },
      clock: null,
      status: 'in_progress',
      outs: 0, // From linescore if available
      baseRunners: { first: false, second: false, third: false },
    };

    await this.env.DB.prepare('UPDATE live_games SET game_state = ? WHERE id = ?')
      .bind(JSON.stringify(gameState), game.id)
      .run();

    // Retrieve previously processed plays from KV
    const kvKey = `mlb-plays-${game.gameId}`;
    const previousPlaysJSON = await this.env.KV.get(kvKey);
    const previousPlays = new Set<number>(previousPlaysJSON ? JSON.parse(previousPlaysJSON) : []);

    // Detect new events
    const newEvents = detectMLBEvents(gameData, previousPlays);

    // Store events in database
    for (const event of newEvents) {
      const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await this.env.DB.prepare(
        `INSERT INTO live_events
         (id, game_id, sport, event_type, timestamp, game_timestamp, leverage_index,
          win_prob_delta, significance_score, raw_data, statcast_data, is_reconstructed, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`
      )
        .bind(
          eventId,
          game.id,
          event.sport,
          event.eventType,
          event.timestamp,
          event.gameTimestamp,
          event.leverageIndex,
          event.winProbDelta,
          event.significanceScore,
          JSON.stringify(event.rawData),
          event.statcastData ? JSON.stringify(event.statcastData) : null
        )
        .run();

      console.log(
        `Detected event: ${eventId} - ${event.eventType} (score: ${event.significanceScore})`
      );
    }

    // Update KV with processed plays
    await this.env.KV.put(kvKey, JSON.stringify([...previousPlays]), { expirationTtl: 86400 });
  }

  /**
   * Poll NFL game using ESPN NFL API
   */
  private async pollNFLGame(game: LiveGame): Promise<void> {
    const kvKey = `nfl_processed_plays_${game.gameId}`;
    const previousPlaysData = await this.env.KV.get(kvKey);
    const previousPlays = new Set<string>(previousPlaysData ? JSON.parse(previousPlaysData) : []);

    // Fetch game data from ESPN NFL API
    const gameData = await fetchNFLGame(game.gameId);

    if (!gameData) {
      console.log(`No data for NFL game ${game.gameId}`);
      return;
    }

    // Update game state
    const gameState: GameState = {
      period: gameData.status.period,
      clock: gameData.status.displayClock,
      homeScore:
        gameData.competitions[0].competitors.find((c) => c.homeAway === 'home')?.score || '0',
      awayScore:
        gameData.competitions[0].competitors.find((c) => c.homeAway === 'away')?.score || '0',
      isActive: gameData.status.type.state === 'in',
    };

    await this.env.DB.prepare('UPDATE live_games SET game_state = ?, last_polled = ? WHERE id = ?')
      .bind(JSON.stringify(gameState), new Date().toISOString(), game.id)
      .run();

    // Detect significant events
    const events = detectNFLEvents(gameData, previousPlays);

    // Store events in database
    for (const event of events) {
      const eventId = `${game.id}-${event.eventType}-${event.timestamp}`;

      // Check if already exists
      const existing = await this.env.KV.get(`event_${eventId}`);
      if (existing) continue;

      await this.env.KV.put(`event_${eventId}`, '1', { expirationTtl: 86400 });

      await this.env.DB.prepare(
        `INSERT INTO live_events
         (id, game_id, sport, event_type, timestamp, game_timestamp, leverage_index,
          win_prob_delta, significance_score, raw_data, statcast_data, is_reconstructed, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`
      )
        .bind(
          eventId,
          game.id,
          event.sport,
          event.eventType,
          event.timestamp,
          event.gameTimestamp,
          event.leverageIndex,
          event.winProbDelta,
          event.significanceScore,
          JSON.stringify(event.rawData),
          event.statcastData ? JSON.stringify(event.statcastData) : null
        )
        .run();

      console.log(
        `Detected NFL event: ${eventId} - ${event.eventType} (score: ${event.significanceScore})`
      );
    }

    // Update KV with processed plays
    await this.env.KV.put(kvKey, JSON.stringify([...previousPlays]), { expirationTtl: 86400 });
  }

  /**
   * Poll NBA game using NBA Stats API
   */
  private async pollNBAGame(game: LiveGame): Promise<void> {
    const kvKey = `nba_processed_plays_${game.gameId}`;
    const previousPlaysData = await this.env.KV.get(kvKey);
    const previousPlays = new Set<string>(previousPlaysData ? JSON.parse(previousPlaysData) : []);

    // Fetch game data from NBA Stats API
    const gameData = await fetchNBAGame(game.gameId);

    if (!gameData) {
      console.log(`No data for NBA game ${game.gameId}`);
      return;
    }

    // Update game state
    const gameState: GameState = {
      period: gameData.game.period,
      clock: gameData.game.gameClock,
      homeScore: gameData.game.homeTeam.score.toString(),
      awayScore: gameData.game.awayTeam.score.toString(),
      isActive: gameData.game.gameStatus === 2, // 2 = Live
    };

    await this.env.DB.prepare('UPDATE live_games SET game_state = ?, last_polled = ? WHERE id = ?')
      .bind(JSON.stringify(gameState), new Date().toISOString(), game.id)
      .run();

    // Detect significant events
    const events = detectNBAEvents(gameData, previousPlays);

    // Store events in database
    for (const event of events) {
      const eventId = `${game.id}-${event.eventType}-${event.timestamp}`;

      // Check if already exists
      const existing = await this.env.KV.get(`event_${eventId}`);
      if (existing) continue;

      await this.env.KV.put(`event_${eventId}`, '1', { expirationTtl: 86400 });

      await this.env.DB.prepare(
        `INSERT INTO live_events
         (id, game_id, sport, event_type, timestamp, game_timestamp, leverage_index,
          win_prob_delta, significance_score, raw_data, statcast_data, is_reconstructed, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`
      )
        .bind(
          eventId,
          game.id,
          event.sport,
          event.eventType,
          event.timestamp,
          event.gameTimestamp,
          event.leverageIndex,
          event.winProbDelta,
          event.significanceScore,
          JSON.stringify(event.rawData),
          event.statcastData ? JSON.stringify(event.statcastData) : null
        )
        .run();

      console.log(
        `Detected NBA event: ${eventId} - ${event.eventType} (score: ${event.significanceScore})`
      );
    }

    // Update KV with processed plays
    await this.env.KV.put(kvKey, JSON.stringify([...previousPlays]), { expirationTtl: 86400 });
  }

  /**
   * Stop monitoring a game
   */
  async stopMonitoring(liveGameId: string): Promise<void> {
    await this.env.DB.prepare('UPDATE live_games SET is_active = 0 WHERE id = ?')
      .bind(liveGameId)
      .run();

    console.log(`Stopped monitoring: ${liveGameId}`);
  }

  /**
   * Get all active monitors
   */
  async getActiveMonitors(): Promise<LiveGame[]> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM live_games WHERE is_active = 1'
    ).all<LiveGame>();

    return result.results ?? [];
  }
}

// ============================================================================
// NFL ESPN API CLIENT
// ============================================================================

const ESPN_NFL_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

interface NFLGameData {
  id: string;
  status: {
    type: {
      state: string; // 'pre' | 'in' | 'post'
      completed: boolean;
    };
    period: number; // Quarter 1-4, 5+ for OT
    displayClock: string; // "12:34"
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      homeAway: 'home' | 'away';
      team: {
        id: string;
        displayName: string;
        abbreviation: string;
      };
      score: string;
    }>;
    situation?: {
      downDistanceText: string; // "1st & 10"
      possessionText: string;
      isRedZone: boolean;
      distance: number;
      down: number;
      yardLine: number;
      team: { id: string };
    };
    drives?: {
      current?: {
        plays: Array<{
          id: string;
          type: { text: string };
          text: string;
          scoringPlay: boolean;
          wallclock: string; // ISO timestamp
          clock: { displayValue: string };
          start: { yardLine: number; down: number; distance: number };
          end: { yardLine: number; down: number; distance: number };
          statYardage: number;
        }>;
      };
    };
  }>;
}

async function fetchNFLGame(gameId: string): Promise<NFLGameData | null> {
  try {
    const response = await fetch(`${ESPN_NFL_API_BASE}/summary?event=${gameId}`, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ESPN NFL API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as NFLGameData;
  } catch (error) {
    console.error('Error fetching NFL game:', error);
    return null;
  }
}

/**
 * Detect significant NFL events from game data
 */
function detectNFLEvents(gameData: NFLGameData, previousPlays: Set<string>): LiveEvent[] {
  const events: LiveEvent[] = [];
  const competition = gameData.competitions[0];
  if (!competition) return events;

  const drives = competition.drives;
  if (!drives?.current?.plays) return events;

  const plays = drives.current.plays;
  const situation = competition.situation;

  for (const play of plays) {
    const playId = play.id;

    // Skip if already processed
    if (previousPlays.has(playId)) continue;
    previousPlays.add(playId);

    // Calculate significance score
    let significanceScore = 0;

    // Scoring plays are always significant
    if (play.scoringPlay) {
      significanceScore += 50;
    }

    // Big plays (yards gained)
    const yards = Math.abs(play.statYardage);
    if (yards >= 40)
      significanceScore += 40; // Explosive plays
    else if (yards >= 25) significanceScore += 30;
    else if (yards >= 15) significanceScore += 20;

    // Turnovers (detected by play type text)
    const playType = play.type.text.toLowerCase();
    if (playType.includes('interception') || playType.includes('fumble')) {
      significanceScore += 45;
    }

    // Fourth down conversions
    if (play.start.down === 4 && yards >= play.start.distance) {
      significanceScore += 35;
    }

    // Red zone plays
    if (situation?.isRedZone) {
      significanceScore += 15;
    }

    // Two-minute drill (4th quarter under 2 minutes)
    if (gameData.status.period === 4) {
      const clockParts = gameData.status.displayClock.split(':');
      const minutes = parseInt(clockParts[0]);
      const seconds = parseInt(clockParts[1] || '0');
      const totalSeconds = minutes * 60 + seconds;

      if (totalSeconds <= 120) {
        significanceScore += 25; // Two-minute warning context
      }
    }

    // Overtime
    if (gameData.status.period >= 5) {
      significanceScore += 30; // Every play in OT is important
    }

    // Only store events with significance >= 40
    if (significanceScore >= 40) {
      // Calculate win probability delta (simplified)
      const homeScore = parseInt(
        competition.competitors.find((c) => c.homeAway === 'home')?.score || '0'
      );
      const awayScore = parseInt(
        competition.competitors.find((c) => c.homeAway === 'away')?.score || '0'
      );
      const scoreDiff = Math.abs(homeScore - awayScore);

      const winProbDelta = calculateNFLWinProbDelta(
        gameData.status.period,
        totalSeconds,
        scoreDiff,
        play.scoringPlay,
        yards
      );

      // Calculate leverage index
      const leverageIndex = calculateNFLLeverageIndex(
        gameData.status.period,
        totalSeconds,
        scoreDiff,
        situation?.down || 1,
        situation?.distance || 10
      );

      events.push({
        sport: 'nfl',
        eventType: determineNFLEventType(play, playType),
        timestamp: new Date().toISOString(),
        gameTimestamp: `Q${gameData.status.period} ${play.clock.displayValue}`,
        leverageIndex,
        winProbDelta,
        significanceScore,
        rawData: {
          play,
          situation: competition.situation || null,
          score: { home: homeScore, away: awayScore },
        },
        statcastData: null,
      });
    }
  }

  return events;
}

function determineNFLEventType(play: any, playType: string): EventType {
  if (play.scoringPlay) return 'scoring_play';
  if (playType.includes('interception') || playType.includes('fumble')) return 'turnover';
  if (Math.abs(play.statYardage) >= 25) return 'big_play';
  return 'big_play'; // Default for significant plays
}

/**
 * Calculate win probability delta for NFL plays
 */
function calculateNFLWinProbDelta(
  period: number,
  secondsRemaining: number,
  scoreDiff: number,
  isScoring: boolean,
  yards: number
): number {
  // Simplified win probability model
  let delta = 0;

  if (isScoring) {
    // Touchdowns are typically worth 10-15% win probability
    if (period <= 2)
      delta = 0.08; // Early game
    else if (period === 3)
      delta = 0.12; // Third quarter
    else if (period === 4) {
      if (secondsRemaining > 300)
        delta = 0.15; // 5+ minutes left
      else if (secondsRemaining > 120)
        delta = 0.25; // 2-5 minutes
      else delta = 0.4; // Under 2 minutes
    } else {
      delta = 0.5; // Overtime scoring
    }
  } else {
    // Big plays swing win probability based on game situation
    if (yards >= 40) delta = 0.1;
    else if (yards >= 25) delta = 0.06;
    else delta = 0.03;

    // Amplify in late-game situations
    if (period === 4 && secondsRemaining < 300) {
      delta *= 2.0;
    }
  }

  return delta;
}

/**
 * Calculate leverage index for NFL game situations
 * Based on quarter, time remaining, score, down/distance
 */
function calculateNFLLeverageIndex(
  period: number,
  secondsRemaining: number,
  scoreDiff: number,
  down: number,
  distance: number
): number {
  // Base leverage increases through the game
  let leverage = 0.5 + period / 8; // 0.625 in Q1, 1.125 in Q4

  // Time factor (peaks in final 5 minutes of 4th quarter)
  if (period === 4) {
    if (secondsRemaining <= 120)
      leverage *= 2.5; // Under 2 minutes
    else if (secondsRemaining <= 300)
      leverage *= 1.8; // Under 5 minutes
    else if (secondsRemaining <= 600) leverage *= 1.3; // Under 10 minutes
  }

  // Overtime is maximum leverage
  if (period >= 5) leverage = 3.0;

  // Score differential (close games have higher leverage)
  if (scoreDiff <= 3)
    leverage *= 1.5; // One-score game
  else if (scoreDiff <= 7)
    leverage *= 1.3; // One-possession game
  else if (scoreDiff <= 14)
    leverage *= 1.1; // Two-possession game
  else leverage *= 0.7; // Blowout

  // Down and distance (4th down is critical)
  if (down === 4) leverage *= 1.4;
  else if (down === 3 && distance > 7) leverage *= 1.2;

  return Math.min(leverage, 4.0); // Cap at 4.0
}

// ============================================================================
// NBA STATS API CLIENT
// ============================================================================

const NBA_STATS_API_BASE = 'https://stats.nba.com/stats';

interface NBAGameData {
  game: {
    gameId: string;
    gameStatus: number; // 1=Not Started, 2=Live, 3=Final
    period: number; // 1-4 quarters, 5+ for OT
    gameClock: string; // "PT12M34.00S" or "PT00M00.00S"
    homeTeam: {
      teamId: number;
      teamName: string;
      teamTricode: string;
      score: number;
    };
    awayTeam: {
      teamId: number;
      teamName: string;
      teamTricode: string;
      score: number;
    };
  };
  actions: Array<{
    actionId: string;
    actionNumber: number;
    clock: string;
    period: number;
    teamId: number;
    teamTricode: string;
    personId: number;
    playerName: string;
    actionType: string;
    subType: string;
    descriptor: string;
    qualifiers: string[];
    shotDistance: number;
    shotResult: string;
    shotActionNumber: number;
    pointsTotal: number;
    isFieldGoal: number;
    scoreHome: string;
    scoreAway: string;
  }>;
}

async function fetchNBAGame(gameId: string): Promise<NBAGameData | null> {
  try {
    // NBA Stats API requires specific headers
    const headers = {
      'User-Agent': 'BlazeSportsIntel/1.0',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Origin: 'https://www.nba.com',
      Referer: 'https://www.nba.com/',
    };

    // Fetch game data from NBA Stats API playbyplayv3 endpoint
    const response = await fetch(
      `${NBA_STATS_API_BASE}/playbyplayv3?GameID=${gameId}&StartPeriod=0&EndPeriod=14`,
      { headers }
    );

    if (!response.ok) {
      console.error(`NBA Stats API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as NBAGameData;
  } catch (error) {
    console.error('Error fetching NBA game:', error);
    return null;
  }
}

/**
 * Detect significant NBA events from game data
 */
function detectNBAEvents(gameData: NBAGameData, previousActions: Set<string>): LiveEvent[] {
  const events: LiveEvent[] = [];
  const actions = gameData.actions || [];
  const game = gameData.game;

  for (const action of actions) {
    const actionId = action.actionId;

    // Skip if already processed
    if (previousActions.has(actionId)) continue;
    previousActions.add(actionId);

    // Calculate significance score
    let significanceScore = 0;

    // Field goals (made baskets)
    if (action.isFieldGoal === 1 && action.shotResult === 'Made') {
      // Three-pointers are more significant
      if (action.actionType === '3pt') {
        significanceScore += 35;
      } else if (action.actionType === 'layup' || action.actionType === 'dunk') {
        significanceScore += 30; // Highlight-worthy plays
      } else {
        significanceScore += 20; // Regular field goals
      }

      // Clutch shots (Q4 or OT under 2 minutes)
      if (game.period >= 4) {
        const clockSeconds = parseNBAClock(action.clock);
        if (clockSeconds <= 120) {
          significanceScore += 40; // Clutch time bonus
        } else if (clockSeconds <= 300) {
          significanceScore += 20; // Late-game bonus
        }
      }
    }

    // Defensive plays
    if (action.actionType === 'block') {
      significanceScore += 35; // Blocks are highlight-worthy
    } else if (action.actionType === 'steal') {
      significanceScore += 30; // Steals create momentum
    }

    // Turnovers
    if (action.actionType === 'turnover') {
      significanceScore += 25;
    }

    // Rebounds
    if (action.actionType === 'rebound') {
      if (action.subType === 'offensive') {
        significanceScore += 15; // Offensive rebounds are more valuable
      } else {
        significanceScore += 5; // Defensive rebounds
      }
    }

    // Fouls
    if (action.actionType === 'foul') {
      if (action.subType?.includes('flagrant') || action.subType?.includes('technical')) {
        significanceScore += 35; // Flagrant/technical fouls are significant
      } else if (game.period >= 4 && parseNBAClock(action.clock) <= 120) {
        significanceScore += 20; // Late-game fouls are tactical
      }
    }

    // Assists on made field goals
    if (action.qualifiers?.includes('assist')) {
      significanceScore += 10; // Assists add value
    }

    // Buzzer-beaters (last 2 seconds of any quarter/OT)
    const clockSeconds = parseNBAClock(action.clock);
    if (clockSeconds <= 2 && action.shotResult === 'Made') {
      significanceScore += 50; // Buzzer-beaters are always significant
    }

    // Only store events with significance >= 40
    if (significanceScore >= 40) {
      // Calculate win probability delta
      const homeScore = parseInt(action.scoreHome);
      const awayScore = parseInt(action.scoreAway);
      const scoreDiff = Math.abs(homeScore - awayScore);

      const winProbDelta = calculateNBAWinProbDelta(
        game.period,
        clockSeconds,
        scoreDiff,
        action.isFieldGoal === 1 && action.shotResult === 'Made',
        action.actionType === '3pt'
      );

      // Calculate leverage index
      const leverageIndex = calculateNBALeverageIndex(game.period, clockSeconds, scoreDiff);

      events.push({
        sport: 'nba',
        eventType: determineNBAEventType(action),
        timestamp: new Date().toISOString(),
        gameTimestamp: `Q${action.period} ${action.clock}`,
        leverageIndex,
        winProbDelta,
        significanceScore,
        rawData: {
          action,
          gameState: {
            period: game.period,
            clock: game.gameClock,
            homeScore: game.homeTeam.score,
            awayScore: game.awayTeam.score,
          },
        },
        statcastData: null,
      });
    }
  }

  return events;
}

function determineNBAEventType(action: any): EventType {
  if (action.actionType === 'block' || action.actionType === 'steal') return 'defensive_play';
  if (action.actionType === 'turnover') return 'turnover';
  if (action.isFieldGoal === 1 && action.shotResult === 'Made') return 'scoring_play';
  return 'big_play'; // Default for significant plays
}

/**
 * Parse NBA clock format "PT12M34.00S" to seconds
 */
function parseNBAClock(clock: string): number {
  if (!clock || clock === 'PT00M00.00S') return 0;

  const match = clock.match(/PT(\d+)M(\d+\.\d+)S/);
  if (!match) return 0;

  const minutes = parseInt(match[1]);
  const seconds = parseFloat(match[2]);
  return minutes * 60 + seconds;
}

/**
 * Calculate win probability delta for NBA plays
 */
function calculateNBAWinProbDelta(
  period: number,
  secondsRemaining: number,
  scoreDiff: number,
  isScoring: boolean,
  isThreePointer: boolean
): number {
  let delta = 0;

  if (isScoring) {
    // Three-pointers swing win probability more than two-pointers
    const baseValue = isThreePointer ? 0.06 : 0.04;

    if (period <= 2) {
      delta = baseValue * 0.7; // Early game (Q1-Q2)
    } else if (period === 3) {
      delta = baseValue; // Third quarter
    } else if (period >= 4) {
      // Fourth quarter and OT
      if (secondsRemaining <= 24) {
        delta = baseValue * 4.0; // Final possession
      } else if (secondsRemaining <= 60) {
        delta = baseValue * 3.0; // Under 1 minute
      } else if (secondsRemaining <= 120) {
        delta = baseValue * 2.5; // Under 2 minutes
      } else if (secondsRemaining <= 300) {
        delta = baseValue * 1.5; // Under 5 minutes
      } else {
        delta = baseValue * 1.2; // Q4 general
      }
    }

    // Amplify for close games
    if (scoreDiff <= 3)
      delta *= 1.8; // One-possession game
    else if (scoreDiff <= 6)
      delta *= 1.4; // Two-possession game
    else if (scoreDiff <= 10) delta *= 1.1; // Competitive game
  } else {
    // Defensive plays (blocks, steals)
    delta = 0.03;
    if (period >= 4 && secondsRemaining <= 120) {
      delta *= 2.0; // Late-game defense is critical
    }
  }

  return Math.min(delta, 0.5); // Cap at 50%
}

/**
 * Calculate leverage index for NBA game situations
 * Based on quarter, time remaining, score differential
 */
function calculateNBALeverageIndex(
  period: number,
  secondsRemaining: number,
  scoreDiff: number
): number {
  // Base leverage increases through the game
  let leverage = 0.4 + period / 8; // 0.525 in Q1, 0.9 in Q4

  // Time factor (peaks in final 2 minutes of 4th quarter/OT)
  if (period >= 4) {
    if (secondsRemaining <= 24) {
      leverage *= 4.0; // Final possession
    } else if (secondsRemaining <= 60) {
      leverage *= 3.0; // Under 1 minute
    } else if (secondsRemaining <= 120) {
      leverage *= 2.5; // Under 2 minutes
    } else if (secondsRemaining <= 300) {
      leverage *= 1.8; // Under 5 minutes
    } else if (secondsRemaining <= 420) {
      leverage *= 1.3; // Under 7 minutes (typical substitution pattern)
    }
  }

  // Overtime is maximum leverage
  if (period >= 5) leverage *= 1.5; // OT amplification

  // Score differential (close games have higher leverage)
  if (scoreDiff <= 3)
    leverage *= 2.0; // One-possession game
  else if (scoreDiff <= 6)
    leverage *= 1.6; // Two-possession game
  else if (scoreDiff <= 10)
    leverage *= 1.3; // Competitive game
  else if (scoreDiff <= 15)
    leverage *= 1.0; // Moderate gap
  else leverage *= 0.6; // Blowout

  return Math.min(leverage, 5.0); // Cap at 5.0 (NBA has higher leverage than NFL due to more possessions)
}
