/**
 * Blaze Sports Intel | Advanced Statistics Calculator
 *
 * Calculates advanced baseball metrics:
 * - wOBA (Weighted On-Base Average)
 * - FIP (Fielding Independent Pitching)
 * - WAR (Wins Above Replacement)
 * - wRC+ (Weighted Runs Created Plus)
 * - K%, BB%, BABIP
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const AdvancedStats = {
  // 2025 NCAA Linear Weights (approximated from MLB, adjusted for college)
  // These are approximations - actual values vary by season/league
  WEIGHTS: {
    wBB: 0.69,    // Walk weight
    wHBP: 0.72,   // Hit by pitch weight
    w1B: 0.88,    // Single weight
    w2B: 1.24,    // Double weight
    w3B: 1.56,    // Triple weight
    wHR: 1.95,    // Home run weight
    wOBAScale: 1.20,  // Scale factor
    runsPALeague: 0.12,  // League runs per PA
    runsPerWin: 9.5,  // Runs per win
    cFIP: 3.10    // FIP constant (varies by year/league)
  },

  /**
   * Calculate wOBA (Weighted On-Base Average)
   * @param {Object} stats - Player batting stats
   * @returns {number} wOBA value (typically 0.280-0.420)
   */
  wOBA(stats) {
    const { bb = 0, hbp = 0, singles = 0, doubles = 0, triples = 0, hr = 0, ab = 0, sf = 0 } = stats;

    // Calculate singles if not provided
    const h = stats.hits || stats.h || 0;
    const actualSingles = singles || (h - doubles - triples - hr);

    const numerator =
      (this.WEIGHTS.wBB * bb) +
      (this.WEIGHTS.wHBP * hbp) +
      (this.WEIGHTS.w1B * actualSingles) +
      (this.WEIGHTS.w2B * doubles) +
      (this.WEIGHTS.w3B * triples) +
      (this.WEIGHTS.wHR * hr);

    const denominator = ab + bb - (stats.ibb || 0) + sf + hbp;

    if (denominator === 0) return 0;

    return Math.round((numerator / denominator) * 1000) / 1000;
  },

  /**
   * Calculate wRC+ (Weighted Runs Created Plus)
   * 100 is average, >100 is above average
   * @param {Object} stats - Player batting stats
   * @param {number} leagueWOBA - League average wOBA (default: 0.320)
   * @returns {number} wRC+ value
   */
  wRCPlus(stats, leagueWOBA = 0.320) {
    const playerWOBA = this.wOBA(stats);
    const pa = stats.pa || (stats.ab + stats.bb + stats.hbp + stats.sf) || 1;

    // wRAA = ((wOBA - league wOBA) / wOBA scale) * PA
    const wRAA = ((playerWOBA - leagueWOBA) / this.WEIGHTS.wOBAScale) * pa;

    // wRC = wRAA + (league runs per PA * PA)
    const wRC = wRAA + (this.WEIGHTS.runsPALeague * pa);

    // wRC+ = (wRC / PA / league runs per PA) * 100
    const wRCPlus = (wRC / pa / this.WEIGHTS.runsPALeague) * 100;

    return Math.round(wRCPlus);
  },

  /**
   * Calculate FIP (Fielding Independent Pitching)
   * @param {Object} stats - Pitcher stats
   * @returns {number} FIP value (ERA-like scale)
   */
  FIP(stats) {
    const { hr = 0, bb = 0, hbp = 0, so = 0, ip = 0 } = stats;

    // Convert IP to actual innings (5.1 = 5.33)
    const innings = this.parseInnings(ip);

    if (innings === 0) return 0;

    // FIP = ((13*HR) + (3*(BB+HBP)) - (2*K)) / IP + cFIP
    const fip = ((13 * hr) + (3 * (bb + hbp)) - (2 * so)) / innings + this.WEIGHTS.cFIP;

    return Math.round(fip * 100) / 100;
  },

  /**
   * Calculate xFIP (Expected FIP with league-average HR/FB rate)
   * @param {Object} stats - Pitcher stats
   * @param {number} leagueHRFB - League HR/FB rate (default: 0.10)
   * @returns {number} xFIP value
   */
  xFIP(stats, leagueHRFB = 0.10) {
    const { bb = 0, hbp = 0, so = 0, ip = 0, fb = 0 } = stats;

    const innings = this.parseInnings(ip);
    if (innings === 0 || fb === 0) return this.FIP(stats);

    // Expected HR based on league HR/FB rate
    const xHR = fb * leagueHRFB;

    const xfip = ((13 * xHR) + (3 * (bb + hbp)) - (2 * so)) / innings + this.WEIGHTS.cFIP;

    return Math.round(xfip * 100) / 100;
  },

  /**
   * Calculate Batting WAR (simplified)
   * @param {Object} stats - Player batting stats
   * @returns {number} WAR value
   */
  battingWAR(stats) {
    const playerWOBA = this.wOBA(stats);
    const pa = stats.pa || (stats.ab + stats.bb + stats.hbp + stats.sf) || 1;
    const leagueWOBA = 0.320;

    // Batting runs = ((wOBA - lgWOBA) / wOBA scale) * PA
    const battingRuns = ((playerWOBA - leagueWOBA) / this.WEIGHTS.wOBAScale) * pa;

    // Simplified: ignore baserunning and defense
    // Replacement level adjustment
    const replacementRuns = (pa / 600) * 20;  // Roughly 20 runs per 600 PA

    const war = (battingRuns + replacementRuns) / this.WEIGHTS.runsPerWin;

    return Math.round(war * 10) / 10;
  },

  /**
   * Calculate Pitching WAR (simplified)
   * @param {Object} stats - Pitcher stats
   * @returns {number} WAR value
   */
  pitchingWAR(stats) {
    const fip = this.FIP(stats);
    const ip = this.parseInnings(stats.ip || 0);
    const leagueFIP = 4.00;  // Approximate league average

    if (ip === 0) return 0;

    // FIP-based runs above average
    const runsAA = ((leagueFIP - fip) / 9) * ip;

    // Replacement level (roughly 5.5 FIP pitcher)
    const replacementRuns = ((5.5 - leagueFIP) / 9) * ip;

    const war = (runsAA + replacementRuns) / this.WEIGHTS.runsPerWin;

    return Math.round(war * 10) / 10;
  },

  /**
   * Calculate K% (Strikeout Rate)
   * @param {Object} stats - Player/pitcher stats
   * @returns {number} K% as decimal
   */
  kRate(stats) {
    const so = stats.so || stats.strikeouts || 0;
    const pa = stats.pa || stats.bf || (stats.ab + stats.bb) || 1;

    return Math.round((so / pa) * 1000) / 10;  // Returns as percentage
  },

  /**
   * Calculate BB% (Walk Rate)
   * @param {Object} stats - Player/pitcher stats
   * @returns {number} BB% as decimal
   */
  bbRate(stats) {
    const bb = stats.bb || stats.walks || 0;
    const pa = stats.pa || stats.bf || (stats.ab + bb) || 1;

    return Math.round((bb / pa) * 1000) / 10;  // Returns as percentage
   },

  /**
   * Calculate BABIP (Batting Average on Balls in Play)
   * @param {Object} stats - Batting stats
   * @returns {number} BABIP value
   */
  BABIP(stats) {
    const { hits = 0, hr = 0, ab = 0, so = 0, sf = 0 } = stats;
    const h = stats.h || hits;

    const numerator = h - hr;
    const denominator = ab - so - hr + sf;

    if (denominator <= 0) return 0;

    return Math.round((numerator / denominator) * 1000) / 1000;
  },

  /**
   * Calculate ISO (Isolated Power)
   * @param {Object} stats - Batting stats
   * @returns {number} ISO value
   */
  ISO(stats) {
    const slg = stats.slg || this.slugging(stats);
    const avg = stats.avg || this.battingAvg(stats);

    return Math.round((slg - avg) * 1000) / 1000;
  },

  /**
   * Calculate Batting Average
   * @param {Object} stats - Batting stats
   * @returns {number} BA
   */
  battingAvg(stats) {
    const h = stats.hits || stats.h || 0;
    const ab = stats.ab || 1;

    return Math.round((h / ab) * 1000) / 1000;
  },

  /**
   * Calculate Slugging Percentage
   * @param {Object} stats - Batting stats
   * @returns {number} SLG
   */
  slugging(stats) {
    const { singles = 0, doubles = 0, triples = 0, hr = 0, ab = 1 } = stats;
    const h = stats.hits || stats.h || 0;
    const actualSingles = singles || (h - doubles - triples - hr);

    const totalBases = actualSingles + (2 * doubles) + (3 * triples) + (4 * hr);

    return Math.round((totalBases / ab) * 1000) / 1000;
  },

  /**
   * Calculate OPS
   * @param {Object} stats - Batting stats
   * @returns {number} OPS
   */
  OPS(stats) {
    const obp = stats.obp || this.onBasePercentage(stats);
    const slg = stats.slg || this.slugging(stats);

    return Math.round((obp + slg) * 1000) / 1000;
  },

  /**
   * Calculate On-Base Percentage
   * @param {Object} stats - Batting stats
   * @returns {number} OBP
   */
  onBasePercentage(stats) {
    const { hits = 0, bb = 0, hbp = 0, ab = 0, sf = 0 } = stats;
    const h = stats.h || hits;

    const numerator = h + bb + hbp;
    const denominator = ab + bb + hbp + sf;

    if (denominator === 0) return 0;

    return Math.round((numerator / denominator) * 1000) / 1000;
  },

  /**
   * Calculate WHIP
   * @param {Object} stats - Pitcher stats
   * @returns {number} WHIP
   */
  WHIP(stats) {
    const { bb = 0, hits = 0, ip = 0 } = stats;
    const h = stats.h || hits;
    const innings = this.parseInnings(ip);

    if (innings === 0) return 0;

    return Math.round(((bb + h) / innings) * 100) / 100;
  },

  /**
   * Calculate K/9 (Strikeouts per 9 innings)
   * @param {Object} stats - Pitcher stats
   * @returns {number} K/9
   */
  kPer9(stats) {
    const so = stats.so || stats.strikeouts || 0;
    const innings = this.parseInnings(stats.ip || 0);

    if (innings === 0) return 0;

    return Math.round((so / innings * 9) * 10) / 10;
  },

  /**
   * Calculate BB/9 (Walks per 9 innings)
   * @param {Object} stats - Pitcher stats
   * @returns {number} BB/9
   */
  bbPer9(stats) {
    const bb = stats.bb || stats.walks || 0;
    const innings = this.parseInnings(stats.ip || 0);

    if (innings === 0) return 0;

    return Math.round((bb / innings * 9) * 10) / 10;
  },

  /**
   * Calculate K/BB ratio
   * @param {Object} stats - Pitcher stats
   * @returns {number} K/BB
   */
  kBB(stats) {
    const so = stats.so || stats.strikeouts || 0;
    const bb = stats.bb || stats.walks || 1;

    return Math.round((so / bb) * 100) / 100;
  },

  /**
   * Parse innings pitched (5.1 -> 5.33)
   * @param {number|string} ip - Innings pitched
   * @returns {number} Actual innings
   */
  parseInnings(ip) {
    if (typeof ip === 'string') {
      const parts = ip.split('.');
      const full = parseInt(parts[0]) || 0;
      const partial = parseInt(parts[1]) || 0;
      return full + (partial / 3);
    }

    const full = Math.floor(ip);
    const decimal = ip - full;
    // If decimal is .1 or .2, treat as thirds
    if (decimal > 0 && decimal < 0.4) {
      return full + (Math.round(decimal * 10) / 3);
    }
    return ip;
  },

  /**
   * Get quality tier for a stat
   * @param {string} stat - Stat name
   * @param {number} value - Stat value
   * @returns {string} Tier: 'elite', 'above', 'average', 'below', 'poor'
   */
  getTier(stat, value) {
    const thresholds = {
      wOBA: { elite: 0.400, above: 0.350, average: 0.320, below: 0.290 },
      'wRC+': { elite: 140, above: 115, average: 100, below: 85 },
      FIP: { elite: 2.75, above: 3.25, average: 3.75, below: 4.25 },  // Lower is better
      'K%': { elite: 30, above: 25, average: 20, below: 15 },
      'BB%': { elite: 12, above: 10, average: 8, below: 6 },
      BABIP: { elite: 0.350, above: 0.320, average: 0.300, below: 0.270 },
      ISO: { elite: 0.250, above: 0.200, average: 0.150, below: 0.100 },
      WAR: { elite: 4.0, above: 2.0, average: 1.0, below: 0.5 }
    };

    const t = thresholds[stat];
    if (!t) return 'average';

    // For FIP (lower is better)
    if (stat === 'FIP') {
      if (value <= t.elite) return 'elite';
      if (value <= t.above) return 'above';
      if (value <= t.average) return 'average';
      if (value <= t.below) return 'below';
      return 'poor';
    }

    // Standard (higher is better)
    if (value >= t.elite) return 'elite';
    if (value >= t.above) return 'above';
    if (value >= t.average) return 'average';
    if (value >= t.below) return 'below';
    return 'poor';
  },

  /**
   * Calculate all advanced stats for a batter
   * @param {Object} stats - Raw batting stats
   * @returns {Object} All calculated advanced stats
   */
  calculateBattingAdvanced(stats) {
    return {
      wOBA: this.wOBA(stats),
      'wRC+': this.wRCPlus(stats),
      WAR: this.battingWAR(stats),
      'K%': this.kRate(stats),
      'BB%': this.bbRate(stats),
      BABIP: this.BABIP(stats),
      ISO: this.ISO(stats),
      OPS: this.OPS(stats)
    };
  },

  /**
   * Calculate all advanced stats for a pitcher
   * @param {Object} stats - Raw pitching stats
   * @returns {Object} All calculated advanced stats
   */
  calculatePitchingAdvanced(stats) {
    return {
      FIP: this.FIP(stats),
      xFIP: this.xFIP(stats),
      WAR: this.pitchingWAR(stats),
      'K%': this.kRate(stats),
      'BB%': this.bbRate(stats),
      WHIP: this.WHIP(stats),
      'K/9': this.kPer9(stats),
      'BB/9': this.bbPer9(stats),
      'K/BB': this.kBB(stats)
    };
  }
};

// Export
window.AdvancedStats = AdvancedStats;
