/**
 * Blaze Blitz Football - Score System
 *
 * Tracks game clock, scoring, per-game/per-drive statistics,
 * and unlockable achievements across a full game session.
 */

import type { DriveResult } from './DriveSystem';

// ============================================================================
// Config
// ============================================================================

export interface ScoreConfig {
  quarterLengthSec: number;
  playClockSec: number;
  overtimeSuddenDeath: boolean;
  twoMinuteWarningEnabled: boolean;
}

const DEFAULT_CONFIG: ScoreConfig = {
  quarterLengthSec: 120,
  playClockSec: 25,
  overtimeSuddenDeath: true,
  twoMinuteWarningEnabled: true,
};

// ============================================================================
// Clock
// ============================================================================

export interface GameClock {
  quarter: number;             // 1-4, 5+ for overtime
  timeRemainingSec: number;    // Seconds left in current quarter
  playClockSec: number;        // Seconds left on play clock
  isRunning: boolean;
  isHalftime: boolean;
  isTwoMinuteWarning: boolean;
  isOvertime: boolean;
  isGameOver: boolean;
}

// ============================================================================
// Scoring
// ============================================================================

type Team = 'home' | 'away';

export interface TeamScore {
  team: Team;
  total: number;
  touchdowns: number;
  extraPoints: number;
  twoPointConversions: number;
  fieldGoals: number;
  safeties: number;
  quarterScores: number[];     // Index 0 = Q1, etc.
}

// ============================================================================
// Statistics
// ============================================================================

export interface PassingStats {
  attempts: number;
  completions: number;
  yards: number;
  touchdowns: number;
  interceptions: number;
  passerRating: number;
}

export interface RushingStats {
  attempts: number;
  yards: number;
  touchdowns: number;
  longestRun: number;
}

export interface ReceivingStats {
  receptions: number;
  yards: number;
  touchdowns: number;
  byReceiver: Map<string, { receptions: number; yards: number; touchdowns: number }>;
}

export interface DefenseStats {
  sacks: number;
  interceptions: number;
  fumbleRecoveries: number;
}

export interface GameStats {
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  defense: DefenseStats;
  bigPlays: number;            // 20+ yards
  explosivePlays: number;      // 40+ yards
  timeOfPossessionSec: number;
  thirdDownAttempts: number;
  thirdDownConversions: number;
  fourthDownAttempts: number;
  fourthDownConversions: number;
}

// ============================================================================
// Drive Summary
// ============================================================================

export interface DriveSummary {
  driveIndex: number;
  team: Team;
  plays: number;
  yards: number;
  result: DriveResult;
  elapsedSec: number;
  startQuarter: number;
  startTimeRemaining: number;
}

// ============================================================================
// Achievements
// ============================================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null;   // Game time (total elapsed seconds) when unlocked, null if locked
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_td', name: 'First Blood', description: 'Score your first touchdown' },
  { id: '100yd_passer', name: 'Arm Cannon', description: 'Pass for 100+ yards in a game' },
  { id: 'pick_six', name: 'Pick Six', description: 'Return an interception for a touchdown' },
  { id: 'shutout', name: 'Lockdown', description: 'Win without allowing a score' },
  { id: 'comeback', name: 'Never Say Die', description: 'Win after trailing by 14+' },
  { id: 'perfect_drive', name: 'Surgeon', description: 'Complete a drive with a perfect passer rating' },
  { id: 'hat_trick', name: 'Hat Trick', description: 'Score 3 touchdowns' },
];

// ============================================================================
// Score System
// ============================================================================

export class ScoreSystem {
  private config: ScoreConfig;
  private clock: GameClock;
  private scores: Record<Team, TeamScore>;
  private stats: Record<Team, GameStats>;
  private drives: DriveSummary[];
  private achievements: Map<string, Achievement>;
  private maxTrailingDeficit: number;

  // Tracking for current drive passer rating
  private currentDrivePassing: PassingStats | null;

  constructor(config: Partial<ScoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.clock = this.createClock();
    this.scores = { home: this.createTeamScore('home'), away: this.createTeamScore('away') };
    this.stats = { home: this.createGameStats(), away: this.createGameStats() };
    this.drives = [];
    this.achievements = new Map();
    this.maxTrailingDeficit = 0;
    this.currentDrivePassing = null;

    for (const def of ACHIEVEMENT_DEFS) {
      this.achievements.set(def.id, { ...def, unlockedAt: null });
    }
  }

  // --------------------------------------------------------------------------
  // Factory helpers
  // --------------------------------------------------------------------------

  private createClock(): GameClock {
    return {
      quarter: 1,
      timeRemainingSec: this.config.quarterLengthSec,
      playClockSec: this.config.playClockSec,
      isRunning: false,
      isHalftime: false,
      isTwoMinuteWarning: false,
      isOvertime: false,
      isGameOver: false,
    };
  }

  private createTeamScore(team: Team): TeamScore {
    return {
      team,
      total: 0,
      touchdowns: 0,
      extraPoints: 0,
      twoPointConversions: 0,
      fieldGoals: 0,
      safeties: 0,
      quarterScores: [0, 0, 0, 0],
    };
  }

  private createGameStats(): GameStats {
    return {
      passing: { attempts: 0, completions: 0, yards: 0, touchdowns: 0, interceptions: 0, passerRating: 0 },
      rushing: { attempts: 0, yards: 0, touchdowns: 0, longestRun: 0 },
      receiving: { receptions: 0, yards: 0, touchdowns: 0, byReceiver: new Map() },
      defense: { sacks: 0, interceptions: 0, fumbleRecoveries: 0 },
      bigPlays: 0,
      explosivePlays: 0,
      timeOfPossessionSec: 0,
      thirdDownAttempts: 0,
      thirdDownConversions: 0,
      fourthDownAttempts: 0,
      fourthDownConversions: 0,
    };
  }

  // --------------------------------------------------------------------------
  // Clock
  // --------------------------------------------------------------------------

  getClock(): Readonly<GameClock> {
    return this.clock;
  }

  startClock(): void {
    if (!this.clock.isGameOver && !this.clock.isHalftime) {
      this.clock.isRunning = true;
    }
  }

  stopClock(): void {
    this.clock.isRunning = false;
  }

  resetPlayClock(): void {
    this.clock.playClockSec = this.config.playClockSec;
  }

  /** Advance the game clock by `dt` seconds. Returns true if the quarter ended. */
  tick(dt: number): boolean {
    if (!this.clock.isRunning || this.clock.isGameOver) return false;

    // Play clock
    this.clock.playClockSec = Math.max(0, this.clock.playClockSec - dt);

    // Game clock
    const prev = this.clock.timeRemainingSec;
    this.clock.timeRemainingSec = Math.max(0, this.clock.timeRemainingSec - dt);

    // Two-minute warning check
    if (
      this.config.twoMinuteWarningEnabled &&
      !this.clock.isTwoMinuteWarning &&
      (this.clock.quarter === 2 || this.clock.quarter === 4) &&
      prev > 120 &&
      this.clock.timeRemainingSec <= 120
    ) {
      this.clock.isTwoMinuteWarning = true;
      this.clock.isRunning = false;
      return false;
    }

    if (this.clock.timeRemainingSec <= 0) {
      return this.endQuarter();
    }

    return false;
  }

  clearTwoMinuteWarning(): void {
    this.clock.isTwoMinuteWarning = false;
  }

  private endQuarter(): boolean {
    this.clock.isRunning = false;

    if (this.clock.quarter === 2) {
      this.clock.isHalftime = true;
      return true;
    }

    if (this.clock.quarter === 4) {
      if (this.scores.home.total === this.scores.away.total && this.config.overtimeSuddenDeath) {
        this.clock.quarter = 5;
        this.clock.isOvertime = true;
        this.clock.timeRemainingSec = this.config.quarterLengthSec;
        return true;
      }
      this.clock.isGameOver = true;
      this.evaluateEndGameAchievements();
      return true;
    }

    // Overtime quarter ended — if still tied, add another OT quarter
    if (this.clock.isOvertime) {
      if (this.scores.home.total === this.scores.away.total) {
        this.clock.quarter += 1;
        this.clock.timeRemainingSec = this.config.quarterLengthSec;
        return true;
      }
      this.clock.isGameOver = true;
      this.evaluateEndGameAchievements();
      return true;
    }

    // Q1 or Q3 — advance normally
    this.clock.quarter += 1;
    this.clock.timeRemainingSec = this.config.quarterLengthSec;
    this.clock.isTwoMinuteWarning = false;
    return true;
  }

  endHalftime(): void {
    if (!this.clock.isHalftime) return;
    this.clock.isHalftime = false;
    this.clock.quarter = 3;
    this.clock.timeRemainingSec = this.config.quarterLengthSec;
    this.clock.isTwoMinuteWarning = false;
  }

  /** Total elapsed game seconds. */
  getElapsedSec(): number {
    const completedQuarters = this.clock.quarter - 1;
    const elapsed = completedQuarters * this.config.quarterLengthSec;
    return elapsed + (this.config.quarterLengthSec - this.clock.timeRemainingSec);
  }

  // --------------------------------------------------------------------------
  // Scoring
  // --------------------------------------------------------------------------

  getScore(team: Team): Readonly<TeamScore> {
    return this.scores[team];
  }

  scoreTouchdown(team: Team): void {
    this.addPoints(team, 6);
    this.scores[team].touchdowns += 1;
    this.checkScoringAchievements(team);
  }

  scoreExtraPoint(team: Team): void {
    this.addPoints(team, 1);
    this.scores[team].extraPoints += 1;
  }

  scoreTwoPointConversion(team: Team): void {
    this.addPoints(team, 2);
    this.scores[team].twoPointConversions += 1;
  }

  scoreFieldGoal(team: Team): void {
    this.addPoints(team, 3);
    this.scores[team].fieldGoals += 1;
    this.checkOvertimeEnd();
  }

  scoreSafety(team: Team): void {
    this.addPoints(team, 2);
    this.scores[team].safeties += 1;
    this.checkOvertimeEnd();
  }

  private addPoints(team: Team, pts: number): void {
    this.scores[team].total += pts;
    const qi = Math.min(this.clock.quarter - 1, this.scores[team].quarterScores.length - 1);
    if (qi >= 0) {
      // Extend array for overtime quarters
      while (this.scores[team].quarterScores.length <= qi) {
        this.scores[team].quarterScores.push(0);
      }
      this.scores[team].quarterScores[qi] += pts;
    }

    this.trackDeficit();
  }

  private checkOvertimeEnd(): void {
    if (this.clock.isOvertime && this.scores.home.total !== this.scores.away.total) {
      this.clock.isGameOver = true;
      this.evaluateEndGameAchievements();
    }
  }

  private trackDeficit(): void {
    const deficit = this.scores.away.total - this.scores.home.total;
    // Track max deficit the home team faced (positive means home was trailing)
    if (deficit > this.maxTrailingDeficit) {
      this.maxTrailingDeficit = deficit;
    }
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStats(team: Team): Readonly<GameStats> {
    return this.stats[team];
  }

  recordPassAttempt(team: Team, completed: boolean, yards: number, isTd: boolean, isInt: boolean): void {
    const p = this.stats[team].passing;
    p.attempts += 1;
    if (completed) {
      p.completions += 1;
      p.yards += yards;
      if (isTd) p.touchdowns += 1;
    }
    if (isInt) p.interceptions += 1;
    p.passerRating = ScoreSystem.computePasserRating(p);

    if (completed) {
      if (yards >= 40) this.stats[team].explosivePlays += 1;
      else if (yards >= 20) this.stats[team].bigPlays += 1;
    }

    // Current drive passer tracking
    if (this.currentDrivePassing) {
      this.currentDrivePassing.attempts += 1;
      if (completed) {
        this.currentDrivePassing.completions += 1;
        this.currentDrivePassing.yards += yards;
        if (isTd) this.currentDrivePassing.touchdowns += 1;
      }
      if (isInt) this.currentDrivePassing.interceptions += 1;
      this.currentDrivePassing.passerRating = ScoreSystem.computePasserRating(this.currentDrivePassing);
    }

    this.checkStatAchievements(team);
  }

  recordReception(team: Team, receiverId: string, yards: number, isTd: boolean): void {
    const r = this.stats[team].receiving;
    r.receptions += 1;
    r.yards += yards;
    if (isTd) r.touchdowns += 1;

    const existing = r.byReceiver.get(receiverId);
    if (existing) {
      existing.receptions += 1;
      existing.yards += yards;
      if (isTd) existing.touchdowns += 1;
    } else {
      r.byReceiver.set(receiverId, { receptions: 1, yards, touchdowns: isTd ? 1 : 0 });
    }
  }

  recordRush(team: Team, yards: number, isTd: boolean): void {
    const r = this.stats[team].rushing;
    r.attempts += 1;
    r.yards += yards;
    if (isTd) r.touchdowns += 1;
    if (yards > r.longestRun) r.longestRun = yards;

    if (yards >= 40) this.stats[team].explosivePlays += 1;
    else if (yards >= 20) this.stats[team].bigPlays += 1;
  }

  recordSack(defensiveTeam: Team): void {
    this.stats[defensiveTeam].defense.sacks += 1;
  }

  recordInterception(defensiveTeam: Team): void {
    this.stats[defensiveTeam].defense.interceptions += 1;
  }

  recordFumbleRecovery(defensiveTeam: Team): void {
    this.stats[defensiveTeam].defense.fumbleRecoveries += 1;
  }

  recordPickSix(defensiveTeam: Team): void {
    this.recordInterception(defensiveTeam);
    this.unlock('pick_six');
  }

  recordThirdDown(team: Team, converted: boolean): void {
    this.stats[team].thirdDownAttempts += 1;
    if (converted) this.stats[team].thirdDownConversions += 1;
  }

  recordFourthDown(team: Team, converted: boolean): void {
    this.stats[team].fourthDownAttempts += 1;
    if (converted) this.stats[team].fourthDownConversions += 1;
  }

  addTimeOfPossession(team: Team, seconds: number): void {
    this.stats[team].timeOfPossessionSec += seconds;
  }

  // --------------------------------------------------------------------------
  // Passer Rating (NFL formula, clamped 0-158.3)
  // --------------------------------------------------------------------------

  static computePasserRating(p: PassingStats): number {
    if (p.attempts === 0) return 0;

    const a = Math.min(Math.max(((p.completions / p.attempts) - 0.3) * 5, 0), 2.375);
    const b = Math.min(Math.max(((p.yards / p.attempts) - 3) * 0.25, 0), 2.375);
    const c = Math.min(Math.max((p.touchdowns / p.attempts) * 20, 0), 2.375);
    const d = Math.min(Math.max(2.375 - ((p.interceptions / p.attempts) * 25), 0), 2.375);

    return Math.round(((a + b + c + d) / 6) * 100 * 10) / 10;
  }

  // --------------------------------------------------------------------------
  // Drives
  // --------------------------------------------------------------------------

  getDrives(): readonly DriveSummary[] {
    return this.drives;
  }

  startDrive(team: Team): void {
    this.currentDrivePassing = {
      attempts: 0,
      completions: 0,
      yards: 0,
      touchdowns: 0,
      interceptions: 0,
      passerRating: 0,
    };
  }

  endDrive(team: Team, plays: number, yards: number, result: DriveResult, elapsedSec: number): void {
    const summary: DriveSummary = {
      driveIndex: this.drives.length,
      team,
      plays,
      yards,
      result,
      elapsedSec,
      startQuarter: this.clock.quarter,
      startTimeRemaining: this.clock.timeRemainingSec + elapsedSec,
    };
    this.drives.push(summary);

    // Check perfect drive
    if (
      this.currentDrivePassing &&
      this.currentDrivePassing.attempts > 0 &&
      result === 'touchdown' &&
      this.currentDrivePassing.passerRating >= 158.3
    ) {
      this.unlock('perfect_drive');
    }

    this.currentDrivePassing = null;
  }

  // --------------------------------------------------------------------------
  // Achievements
  // --------------------------------------------------------------------------

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getUnlockedAchievements(): Achievement[] {
    return this.getAchievements().filter((a) => a.unlockedAt !== null);
  }

  isUnlocked(id: string): boolean {
    return (this.achievements.get(id)?.unlockedAt ?? null) !== null;
  }

  private unlock(id: string): void {
    const a = this.achievements.get(id);
    if (a && a.unlockedAt === null) {
      a.unlockedAt = this.getElapsedSec();
    }
  }

  private checkScoringAchievements(team: Team): void {
    const s = this.scores[team];

    if (s.touchdowns >= 1) this.unlock('first_td');
    if (s.touchdowns >= 3) this.unlock('hat_trick');

    // Overtime sudden-death TD ends the game
    if (this.clock.isOvertime && this.scores.home.total !== this.scores.away.total) {
      this.clock.isGameOver = true;
      this.evaluateEndGameAchievements();
    }
  }

  private checkStatAchievements(team: Team): void {
    if (this.stats[team].passing.yards >= 100) this.unlock('100yd_passer');
  }

  private evaluateEndGameAchievements(): void {
    // Shutout: winner allowed 0 points
    const winner: Team = this.scores.home.total > this.scores.away.total ? 'home' : 'away';
    const loser: Team = winner === 'home' ? 'away' : 'home';
    if (this.scores[loser].total === 0) this.unlock('shutout');

    // Comeback: home team won after trailing by 14+
    if (winner === 'home' && this.maxTrailingDeficit >= 14) {
      this.unlock('comeback');
    }
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  reset(config?: Partial<ScoreConfig>): void {
    if (config) this.config = { ...DEFAULT_CONFIG, ...config };
    this.clock = this.createClock();
    this.scores = { home: this.createTeamScore('home'), away: this.createTeamScore('away') };
    this.stats = { home: this.createGameStats(), away: this.createGameStats() };
    this.drives = [];
    this.maxTrailingDeficit = 0;
    this.currentDrivePassing = null;
    for (const [id, a] of this.achievements) {
      a.unlockedAt = null;
    }
  }
}
