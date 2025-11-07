/**
 * Statcast Adapter for Baseball Savant API
 *
 * Provides access to MLB's Statcast pitch-level and batted ball data including:
 * - Exit velocity, launch angle, barrel rate
 * - Spin rate, release point, pitch break
 * - Expected stats (xBA, xwOBA, xSLG)
 * - Sprint speed, Outs Above Average
 *
 * Data Source: Baseball Savant (baseballsavant.mlb.com)
 *
 * @see https://baseballsavant.mlb.com/
 * @see https://github.com/ahump20/mlb-data-lab
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Statcast Batted Ball Event
 * Represents a single batted ball with Statcast measurements
 */
export interface StatcastBattedBall {
  // Game context
  game_pk: number;
  game_date: string;

  // Player info
  player_id: number;
  player_name: string;
  batter: number;
  pitcher: number;

  // Event details
  events: string; // single, double, home_run, out, etc.
  description: string;
  zone: number | null;
  des: string; // Play description

  // Batted ball metrics
  launch_speed: number | null; // Exit velocity (mph)
  launch_angle: number | null; // Launch angle (degrees)

  // Hit location
  hc_x: number | null; // Hit coordinate X
  hc_y: number | null; // Hit coordinate Y
  hit_distance_sc: number | null; // Hit distance (feet)

  // Pitch info
  pitch_type: string | null;
  release_speed: number | null;
  release_pos_x: number | null;
  release_pos_z: number | null;

  // Count
  balls: number;
  strikes: number;

  // Expected stats
  estimated_ba_using_speedangle: number | null; // xBA
  estimated_woba_using_speedangle: number | null; // xwOBA
  woba_value: number | null;
  woba_denom: number | null;
  babip_value: number | null;
  iso_value: number | null;

  // Plate appearance outcome
  if_fielding_alignment: string | null;
  of_fielding_alignment: string | null;

  // Spin
  release_spin_rate: number | null;
  release_extension: number | null;

  // Movement
  pfx_x: number | null; // Horizontal break (inches)
  pfx_z: number | null; // Vertical break (inches)
  plate_x: number | null;
  plate_z: number | null;

  // Velocity
  vx0: number | null;
  vy0: number | null;
  vz0: number | null;

  // Acceleration
  ax: number | null;
  ay: number | null;
  az: number | null;

  // Effective metrics
  effective_speed: number | null;
  release_pos_y: number | null;

  // Barrel classification
  barrel: number | null; // 1 if barrel, 0 if not

  // Launch speed angle bucket
  launch_speed_angle: number | null;
}

/**
 * Statcast Player Season Summary
 * Aggregated Statcast metrics for a player's season
 */
export interface StatcastPlayerSeasonStats {
  // Player identification
  player_id: number;
  last_name: string;
  first_name: string;

  // Basic stats
  year: number;
  attempts: number; // Total batted balls

  // Exit velocity metrics
  avg_hit_speed: number; // Average exit velocity
  max_hit_speed: number; // Max exit velocity
  fbld: number; // Fly ball/line drive percentage
  gb: number; // Ground ball percentage

  // Launch angle
  avg_hit_angle: number;

  // Barrel metrics
  brl_percent: number; // Barrel percentage
  brl_pa: number; // Barrels per plate appearance

  // Distance
  avg_distance: number;

  // Hard hit metrics
  hard_hit_percent: number; // Hard hit percentage (95+ mph)

  // Expected stats
  xba: number; // Expected batting average
  xslg: number; // Expected slugging
  xwoba: number; // Expected wOBA
  xobp: number; // Expected on-base percentage
  xiso: number; // Expected isolated power

  // Actual stats for comparison
  ba: number;
  slg: number;
  woba: number;
  obp: number;
  iso: number;

  // Hit type percentages
  ld_percent: number; // Line drive %
  gb_percent: number; // Ground ball %
  fb_percent: number; // Fly ball %

  // Pull/Oppo/Center
  pull_percent: number;
  cent_percent: number;
  oppo_percent: number;

  // Sweet spot percentage (8-32 degree launch angle)
  sweet_spot_percent: number;

  // Competitive metrics
  competitive_runs: number;

  // Speed metrics (if available)
  sprint_speed?: number; // Sprint speed (ft/sec)
}

/**
 * Statcast Pitch-Level Data
 * Detailed pitch tracking information
 */
export interface StatcastPitch {
  // Game context
  game_pk: number;
  game_date: string;

  // Pitcher/Batter
  pitcher: number;
  pitcher_name: string;
  batter: number;
  batter_name: string;

  // Pitch classification
  pitch_type: string; // FF, SL, CH, CU, etc.
  pitch_name: string; // Four-Seam Fastball, Slider, etc.

  // Velocity
  release_speed: number; // Velocity at release (mph)
  effective_speed: number; // Perceived velocity

  // Release point
  release_pos_x: number; // Horizontal release point (feet)
  release_pos_z: number; // Vertical release point (feet)
  release_pos_y: number; // Distance from home plate
  release_extension: number; // Extension (feet)

  // Spin
  release_spin_rate: number; // Spin rate (rpm)
  spin_axis: number | null; // Spin axis (degrees)

  // Movement
  pfx_x: number; // Horizontal break (inches)
  pfx_z: number; // Induced vertical break (inches)

  // Location at plate
  plate_x: number; // Horizontal location (feet, catcher's perspective)
  plate_z: number; // Vertical location (feet)
  zone: number | null; // Strike zone (1-9 in zone, 11-14 out of zone)

  // Velocities (components)
  vx0: number;
  vy0: number;
  vz0: number;

  // Acceleration (components)
  ax: number;
  ay: number;
  az: number;

  // Outcome
  type: string; // S (strike), B (ball), X (in play)
  description: string; // ball, called_strike, swinging_strike, foul, hit_into_play
  events: string | null; // single, strikeout, walk, etc.

  // Count
  balls: number;
  strikes: number;

  // Hit data (if applicable)
  launch_speed: number | null;
  launch_angle: number | null;
  hit_distance_sc: number | null;

  // Expected stats
  estimated_ba_using_speedangle: number | null;
  estimated_woba_using_speedangle: number | null;

  // Swing/Contact
  swing: number | null; // 1 if swing, 0 if no swing
  whiff: number | null; // 1 if swinging strike, 0 otherwise
}

/**
 * Statcast Pitcher Season Summary
 * Aggregated pitch-level metrics for a pitcher
 */
export interface StatcastPitcherSeasonStats {
  // Player identification
  player_id: number;
  last_name: string;
  first_name: string;
  year: number;

  // Pitch counts
  n_ff: number; // Four-seam fastballs
  n_sl: number; // Sliders
  n_ch: number; // Changeups
  n_cu: number; // Curveballs
  n_fc: number; // Cutters
  n_si: number; // Sinkers
  n_fs: number; // Splitters
  n_total_pitches: number;

  // Velocity by pitch type
  ff_avg_speed: number | null;
  sl_avg_speed: number | null;
  ch_avg_speed: number | null;
  cu_avg_speed: number | null;
  fc_avg_speed: number | null;
  si_avg_speed: number | null;
  fs_avg_speed: number | null;

  // Spin rate by pitch type
  ff_avg_spin: number | null;
  sl_avg_spin: number | null;
  ch_avg_spin: number | null;
  cu_avg_spin: number | null;
  fc_avg_spin: number | null;
  si_avg_spin: number | null;
  fs_avg_spin: number | null;

  // Movement (horizontal and vertical break)
  ff_avg_break_x: number | null;
  ff_avg_break_z: number | null;
  sl_avg_break_x: number | null;
  sl_avg_break_z: number | null;
  ch_avg_break_x: number | null;
  ch_avg_break_z: number | null;

  // Results allowed
  xba: number; // Expected batting average against
  xslg: number; // Expected slugging against
  xwoba: number; // Expected wOBA against
  xiso: number; // Expected ISO against

  // Actual results for comparison
  ba: number;
  slg: number;
  woba: number;
  iso: number;

  // Barrel rate allowed
  barrel_batted_rate: number;

  // Exit velocity allowed
  avg_hit_speed: number;
  avg_hyper_speed: number;

  // Whiff rates
  whiff_percent: number; // Overall whiff %
  k_percent: number; // Strikeout %
  bb_percent: number; // Walk %

  // Zone control
  zone_percent: number; // % pitches in zone

  // Out of zone metrics
  o_swing_percent: number; // Chase rate
  z_swing_percent: number; // In-zone swing %

  // Contact rates
  z_contact_percent: number; // In-zone contact %
  o_contact_percent: number; // Out-of-zone contact %
  contact_percent: number; // Overall contact %

  // Swinging strike rate
  swstr_percent: number;

  // Hard hit rate allowed
  hard_hit_percent: number;
}

/**
 * Sprint Speed Data
 * Player sprint speed metrics
 */
export interface StatcastSprintSpeed {
  player_id: number;
  last_name: string;
  first_name: string;
  year: number;

  // Sprint speed
  sprint_speed: number; // ft/sec, competitive runs only

  // Sprint opportunities
  competitive_runs: number; // Number of competitive runs

  // Percentile
  sprint_speed_top_pct: number; // Top sprint speed percentile

  // HP to 1B times
  hp_to_1b: number | null; // Home to first (left-handed batter)
  hp_to_1b_righty: number | null; // Home to first (right-handed batter)
}

/**
 * Outs Above Average (Defensive Metrics)
 */
export interface StatcastOAA {
  player_id: number;
  last_name: string;
  first_name: string;
  year: number;
  team: string;

  // Primary position
  primary_pos_formatted: string;

  // Outs Above Average
  outs_above_average: number; // Total OAA

  // Success rate
  success_rate: number;
  success_rate_ci: number; // Confidence interval

  // Attempts
  attempts: number;
  plays_made: number;

  // Range (for outfielders)
  est_outs_above_avg_range?: number;

  // Arm (for outfielders and catchers)
  est_outs_above_avg_arm?: number;
}

/**
 * Expected Stats Leaderboard Entry
 */
export interface StatcastXStatsLeader {
  player_id: number;
  last_name: string;
  first_name: string;
  year: number;

  // Attempts
  pa: number; // Plate appearances
  abs: number; // At-bats

  // Expected stats
  xba: number;
  xslg: number;
  xwoba: number;
  xobp: number;
  xiso: number;

  // Actual stats for comparison
  ba: number;
  slg: number;
  woba: number;
  obp: number;
  iso: number;

  // Differences (actual - expected)
  ba_minus_xba: number;
  slg_minus_xslg: number;
  woba_minus_xwoba: number;

  // Barrel metrics
  barrel_batted_rate: number;

  // Exit velocity
  avg_hit_speed: number;
  max_hit_speed: number;

  // Launch angle
  avg_hit_angle: number;

  // Sweet spot percentage
  sweet_spot_percent: number;

  // Hard hit percentage
  hard_hit_percent: number;
}

// ============================================================================
// Cache Configuration
// ============================================================================

interface CacheConfig {
  battedBalls: number;
  pitchData: number;
  playerSeasonStats: number;
  pitcherSeasonStats: number;
  leaderboards: number;
  sprintSpeed: number;
  oaa: number;
}

const CACHE_TTLS: CacheConfig = {
  battedBalls: 3600,         // 1 hour
  pitchData: 3600,           // 1 hour
  playerSeasonStats: 21600,  // 6 hours
  pitcherSeasonStats: 21600, // 6 hours
  leaderboards: 3600,        // 1 hour
  sprintSpeed: 86400,        // 24 hours (updated less frequently)
  oaa: 86400,                // 24 hours
};

// ============================================================================
// API Configuration
// ============================================================================

const STATCAST_API_BASE = 'https://baseballsavant.mlb.com/statcast_search';
const LEADERBOARDS_API_BASE = 'https://baseballsavant.mlb.com/leaderboard';

// ============================================================================
// Statcast Adapter Class
// ============================================================================

export class StatcastAdapter {
  private kv?: KVNamespace;

  constructor(kv?: KVNamespace) {
    this.kv = kv;
  }

  // --------------------------------------------------------------------------
  // Cache Helper Methods
  // --------------------------------------------------------------------------

  private async getCached<T>(key: string): Promise<T | null> {
    if (!this.kv) return null;

    try {
      const cached = await this.kv.get(key, 'json');
      return cached as T | null;
    } catch (error) {
      console.warn(`KV cache read failed for ${key}:`, error);
      return null;
    }
  }

  private async setCached<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.kv) return;

    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.warn(`KV cache write failed for ${key}:`, error);
    }
  }

  private async fetchWithRetry<T>(
    url: string,
    maxRetries: number = 3
  ): Promise<T> {
    const delays = [250, 500, 1000]; // Exponential backoff

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.getCached<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API with retry logic
    const data = await this.fetchWithRetry<T>(url);

    // Cache the result
    await this.setCached(cacheKey, data, ttl);

    return data;
  }

  // --------------------------------------------------------------------------
  // Batted Ball Data Methods
  // --------------------------------------------------------------------------

  /**
   * Fetch batted ball events for a specific player
   *
   * @param playerId - MLB player ID
   * @param season - Season year (default: current year)
   * @param minExitVelo - Minimum exit velocity filter (optional)
   * @param minDistance - Minimum hit distance filter (optional)
   */
  async fetchPlayerBattedBalls(
    playerId: number,
    season?: number,
    minExitVelo?: number,
    minDistance?: number
  ): Promise<StatcastBattedBall[]> {
    const year = season || new Date().getFullYear();

    const params = new URLSearchParams({
      hfPT: '',
      hfAB: '',
      hfGT: 'R|',
      hfPR: '',
      hfZ: '',
      stadium: '',
      hfBBL: '',
      hfNewZones: '',
      hfPull: '',
      hfC: '',
      hfSea: `${year}|`,
      hfSit: '',
      player_type: 'batter',
      hfOuts: '',
      opponent: '',
      pitcher_throws: '',
      batter_stands: '',
      hfSA: '',
      game_date_gt: '',
      game_date_lt: '',
      hfMo: '',
      team: '',
      home_road: '',
      hfRO: '',
      position: '',
      hfInfield: '',
      hfOutfield: '',
      hfInn: '',
      hfBBT: '',
      batters_lookup: `${playerId}`,
      type: 'details',
      csv: 'true',
    });

    if (minExitVelo) {
      params.set('hfBBL', `${minExitVelo}|`);
    }

    const url = `${STATCAST_API_BASE}?${params.toString()}`;
    const cacheKey = `statcast:batted:${playerId}:${year}:${minExitVelo || 'all'}`;

    return this.fetchWithCache<StatcastBattedBall[]>(
      url,
      cacheKey,
      CACHE_TTLS.battedBalls
    );
  }

  /**
   * Fetch player season batting statistics with Statcast metrics
   */
  async fetchPlayerSeasonStats(
    playerId: number,
    season?: number
  ): Promise<StatcastPlayerSeasonStats | null> {
    const year = season || new Date().getFullYear();

    const url = `${LEADERBOARDS_API_BASE}/expected_statistics?type=batter&year=${year}&position=&team=&min=q&player_id=${playerId}`;
    const cacheKey = `statcast:player:season:${playerId}:${year}`;

    const data = await this.fetchWithCache<StatcastPlayerSeasonStats[]>(
      url,
      cacheKey,
      CACHE_TTLS.playerSeasonStats
    );

    return data.length > 0 ? data[0] : null;
  }

  /**
   * Fetch expected stats leaderboard
   *
   * @param season - Season year
   * @param minPA - Minimum plate appearances (default: 'q' for qualified)
   * @param limit - Number of results (default: 50)
   */
  async fetchExpectedStatsLeaderboard(
    season?: number,
    minPA: number | 'q' = 'q',
    limit: number = 50
  ): Promise<StatcastXStatsLeader[]> {
    const year = season || new Date().getFullYear();

    const url = `${LEADERBOARDS_API_BASE}/expected_statistics?type=batter&year=${year}&position=&team=&min=${minPA}&csv=true`;
    const cacheKey = `statcast:xstats:leaderboard:${year}:${minPA}`;

    const data = await this.fetchWithCache<StatcastXStatsLeader[]>(
      url,
      cacheKey,
      CACHE_TTLS.leaderboards
    );

    return data.slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // Pitch-Level Data Methods
  // --------------------------------------------------------------------------

  /**
   * Fetch pitch-by-pitch data for a specific pitcher
   */
  async fetchPitcherPitches(
    pitcherId: number,
    season?: number,
    pitchType?: string
  ): Promise<StatcastPitch[]> {
    const year = season || new Date().getFullYear();

    const params = new URLSearchParams({
      hfPT: pitchType || '',
      hfAB: '',
      hfGT: 'R|',
      hfPR: '',
      hfZ: '',
      stadium: '',
      hfBBL: '',
      hfNewZones: '',
      hfPull: '',
      hfC: '',
      hfSea: `${year}|`,
      hfSit: '',
      player_type: 'pitcher',
      hfOuts: '',
      opponent: '',
      pitcher_throws: '',
      batter_stands: '',
      hfSA: '',
      game_date_gt: '',
      game_date_lt: '',
      hfMo: '',
      team: '',
      home_road: '',
      hfRO: '',
      position: '',
      hfInfield: '',
      hfOutfield: '',
      hfInn: '',
      hfBBT: '',
      pitchers_lookup: `${pitcherId}`,
      type: 'details',
      csv: 'true',
    });

    const url = `${STATCAST_API_BASE}?${params.toString()}`;
    const cacheKey = `statcast:pitches:${pitcherId}:${year}:${pitchType || 'all'}`;

    return this.fetchWithCache<StatcastPitch[]>(
      url,
      cacheKey,
      CACHE_TTLS.pitchData
    );
  }

  /**
   * Fetch pitcher season statistics with Statcast metrics
   */
  async fetchPitcherSeasonStats(
    pitcherId: number,
    season?: number
  ): Promise<StatcastPitcherSeasonStats | null> {
    const year = season || new Date().getFullYear();

    const url = `${LEADERBOARDS_API_BASE}/pitch-arsenal-stats?type=pitcher&pitchType=&year=${year}&team=&min=q&player_id=${pitcherId}`;
    const cacheKey = `statcast:pitcher:season:${pitcherId}:${year}`;

    const data = await this.fetchWithCache<StatcastPitcherSeasonStats[]>(
      url,
      cacheKey,
      CACHE_TTLS.pitcherSeasonStats
    );

    return data.length > 0 ? data[0] : null;
  }

  // --------------------------------------------------------------------------
  // Sprint Speed Methods
  // --------------------------------------------------------------------------

  /**
   * Fetch sprint speed data for a player
   */
  async fetchSprintSpeed(
    playerId: number,
    season?: number
  ): Promise<StatcastSprintSpeed | null> {
    const year = season || new Date().getFullYear();

    const url = `${LEADERBOARDS_API_BASE}/sprint_speed?year=${year}&position=&team=&player_id=${playerId}`;
    const cacheKey = `statcast:sprint:${playerId}:${year}`;

    const data = await this.fetchWithCache<StatcastSprintSpeed[]>(
      url,
      cacheKey,
      CACHE_TTLS.sprintSpeed
    );

    return data.length > 0 ? data[0] : null;
  }

  /**
   * Fetch sprint speed leaderboard
   */
  async fetchSprintSpeedLeaderboard(
    season?: number,
    limit: number = 50
  ): Promise<StatcastSprintSpeed[]> {
    const year = season || new Date().getFullYear();

    const url = `${LEADERBOARDS_API_BASE}/sprint_speed?year=${year}&position=&team=&min=10&csv=true`;
    const cacheKey = `statcast:sprint:leaderboard:${year}`;

    const data = await this.fetchWithCache<StatcastSprintSpeed[]>(
      url,
      cacheKey,
      CACHE_TTLS.leaderboards
    );

    return data.slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // Defensive Metrics Methods
  // --------------------------------------------------------------------------

  /**
   * Fetch Outs Above Average (OAA) for a player
   */
  async fetchOAA(
    playerId: number,
    season?: number
  ): Promise<StatcastOAA | null> {
    const year = season || new Date().getFullYear();

    const url = `${LEADERBOARDS_API_BASE}/outs_above_average?year=${year}&team=&position=&player_id=${playerId}`;
    const cacheKey = `statcast:oaa:${playerId}:${year}`;

    const data = await this.fetchWithCache<StatcastOAA[]>(
      url,
      cacheKey,
      CACHE_TTLS.oaa
    );

    return data.length > 0 ? data[0] : null;
  }

  /**
   * Fetch OAA leaderboard
   */
  async fetchOAALeaderboard(
    season?: number,
    position?: string,
    limit: number = 50
  ): Promise<StatcastOAA[]> {
    const year = season || new Date().getFullYear();

    const posParam = position ? `&position=${position}` : '';
    const url = `${LEADERBOARDS_API_BASE}/outs_above_average?year=${year}&team=${posParam}&min=q&csv=true`;
    const cacheKey = `statcast:oaa:leaderboard:${year}:${position || 'all'}`;

    const data = await this.fetchWithCache<StatcastOAA[]>(
      url,
      cacheKey,
      CACHE_TTLS.leaderboards
    );

    return data.slice(0, limit);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Classify barrel based on exit velocity and launch angle
 *
 * Barrel definition:
 * - Exit velocity >= 98 mph
 * - Launch angle between 26-30 degrees
 * OR
 * - Exit velocity and launch angle combination in "sweet spot"
 */
export function isBarrel(exitVelo: number, launchAngle: number): boolean {
  if (exitVelo < 98) return false;

  // Perfect barrel range
  if (launchAngle >= 26 && launchAngle <= 30) return true;

  // Extended barrel zone (velocity-dependent)
  const minAngle = 26 - ((exitVelo - 98) / 2);
  const maxAngle = 30 + ((exitVelo - 98) / 2);

  return launchAngle >= minAngle && launchAngle <= maxAngle;
}

/**
 * Classify hard-hit ball (exit velocity >= 95 mph)
 */
export function isHardHit(exitVelo: number): boolean {
  return exitVelo >= 95;
}

/**
 * Get exit velocity tier classification
 */
export function getExitVeloTier(avgExitVelo: number): string {
  if (avgExitVelo >= 92) return 'Elite (92+ mph)';
  if (avgExitVelo >= 90) return 'Excellent (90-92 mph)';
  if (avgExitVelo >= 88) return 'Above Average (88-90 mph)';
  if (avgExitVelo >= 86) return 'Average (86-88 mph)';
  if (avgExitVelo >= 84) return 'Below Average (84-86 mph)';
  return 'Poor (<84 mph)';
}

/**
 * Get barrel rate tier classification
 */
export function getBarrelRateTier(barrelRate: number): string {
  if (barrelRate >= 15) return 'Elite (15%+)';
  if (barrelRate >= 10) return 'Excellent (10-15%)';
  if (barrelRate >= 6) return 'Above Average (6-10%)';
  if (barrelRate >= 4) return 'Average (4-6%)';
  if (barrelRate >= 2) return 'Below Average (2-4%)';
  return 'Poor (<2%)';
}

/**
 * Calculate expected batting average (xBA) from exit velocity and launch angle
 *
 * This is a simplified formula. Baseball Savant uses a more complex model.
 */
export function calculateXBA(exitVelo: number, launchAngle: number): number {
  // Simplified model based on known patterns
  if (exitVelo < 60) return 0.0;

  // Ground balls
  if (launchAngle < 10) {
    return Math.min(0.5, (exitVelo - 60) / 80);
  }

  // Line drives (sweet spot)
  if (launchAngle >= 10 && launchAngle <= 25) {
    return Math.min(0.8, 0.3 + ((exitVelo - 70) / 50));
  }

  // Fly balls
  if (launchAngle > 25 && launchAngle <= 50) {
    const optimalAngle = 30;
    const anglePenalty = Math.abs(launchAngle - optimalAngle) / 20;
    return Math.max(0.0, Math.min(1.0, ((exitVelo - 70) / 40) - anglePenalty));
  }

  // Pop-ups
  return 0.0;
}

/**
 * Format sprint speed with percentile tier
 */
export function formatSprintSpeed(speed: number): string {
  const mph = (speed * 0.681818).toFixed(1); // Convert ft/sec to mph

  let tier = '';
  if (speed >= 30) tier = ' (Elite)';
  else if (speed >= 29) tier = ' (Plus)';
  else if (speed >= 28) tier = ' (Above Avg)';
  else if (speed >= 27) tier = ' (Average)';
  else tier = ' (Below Avg)';

  return `${speed.toFixed(1)} ft/sec (${mph} mph)${tier}`;
}

/**
 * Format OAA with context
 */
export function formatOAA(oaa: number): string {
  const rounded = oaa.toFixed(0);

  if (oaa >= 10) return `+${rounded} (Gold Glove caliber)`;
  if (oaa >= 5) return `+${rounded} (Excellent defender)`;
  if (oaa >= 0) return `+${rounded} (Above average)`;
  if (oaa >= -5) return `${rounded} (Below average)`;
  return `${rounded} (Poor defender)`;
}
