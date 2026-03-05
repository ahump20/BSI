/**
 * Blaze Blitz Football - Drive System
 *
 * Manages the multi-down drive: field position, first-down chains,
 * penalties, turnovers on downs, and scoring drives.
 */

// ============================================================================
// Types
// ============================================================================

export type DriveResult =
  | 'touchdown'
  | 'field_goal'
  | 'turnover_on_downs'
  | 'interception'
  | 'fumble_lost'
  | 'safety'
  | 'timeout'
  | 'in_progress';

export interface PlayResult {
  yardsGained: number;
  isComplete: boolean;       // Pass completed
  isTouchdown: boolean;
  isTurnover: boolean;
  isFirstDown: boolean;
  isSack: boolean;
  isFumble: boolean;
  isInterception: boolean;
  isPenalty: boolean;
  penaltyYards: number;
  bigPlay: boolean;          // 20+ yards
  explosivePlay: boolean;    // 40+ yards
}

export interface DriveState {
  down: number;              // 1-4
  yardsToGo: number;
  lineOfScrimmage: number;   // 0-100 (own 0 to opponent's 0)
  firstDownMarker: number;   // Yard line of first-down marker
  playCount: number;
  driveYards: number;
  driveResult: DriveResult;
  isRedZone: boolean;        // Inside opponent 20
  fieldPosition: 'own' | 'midfield' | 'opponent';
  lastPlayResult: PlayResult | null;
}

export interface DriveConfig {
  startingYardLine: number;
  enableTurnovers: boolean;
  maxDowns: number;          // Usually 4
  firstDownDistance: number;  // Usually 10
  fieldLength: number;       // 100 yards
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DRIVE_CONFIG: DriveConfig = {
  startingYardLine: 25,
  enableTurnovers: true,
  maxDowns: 4,
  firstDownDistance: 10,
  fieldLength: 100,
};

// ============================================================================
// Drive System
// ============================================================================

export class DriveSystem {
  private config: DriveConfig;
  private state: DriveState;
  private playHistory: PlayResult[] = [];

  constructor(config: Partial<DriveConfig> = {}) {
    this.config = { ...DEFAULT_DRIVE_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): DriveState {
    const los = this.config.startingYardLine;
    return {
      down: 1,
      yardsToGo: this.config.firstDownDistance,
      lineOfScrimmage: los,
      firstDownMarker: Math.min(los + this.config.firstDownDistance, this.config.fieldLength),
      playCount: 0,
      driveYards: 0,
      driveResult: 'in_progress',
      isRedZone: los >= 80,
      fieldPosition: los < 40 ? 'own' : los < 60 ? 'midfield' : 'opponent',
      lastPlayResult: null,
    };
  }

  /** Reset for new drive */
  public reset(startYardLine?: number): void {
    if (startYardLine !== undefined) {
      this.config.startingYardLine = startYardLine;
    }
    this.state = this.createInitialState();
    this.playHistory = [];
  }

  /** Process the result of a play */
  public processPlay(yards: number, opts: {
    isComplete?: boolean;
    isSack?: boolean;
    isFumble?: boolean;
    isInterception?: boolean;
    isPenalty?: boolean;
    penaltyYards?: number;
  } = {}): PlayResult {
    const actualYards = opts.isPenalty ? (opts.penaltyYards ?? 0) : yards;

    const result: PlayResult = {
      yardsGained: actualYards,
      isComplete: opts.isComplete ?? (actualYards > 0),
      isTouchdown: false,
      isTurnover: false,
      isFirstDown: false,
      isSack: opts.isSack ?? false,
      isFumble: opts.isFumble ?? false,
      isInterception: opts.isInterception ?? false,
      isPenalty: opts.isPenalty ?? false,
      penaltyYards: opts.penaltyYards ?? 0,
      bigPlay: actualYards >= 20,
      explosivePlay: actualYards >= 40,
    };

    // Update line of scrimmage
    const newLos = this.state.lineOfScrimmage + actualYards;

    // Check touchdown
    if (newLos >= this.config.fieldLength) {
      result.isTouchdown = true;
      this.state.driveResult = 'touchdown';
      this.state.lineOfScrimmage = this.config.fieldLength;
      this.finalizPlay(result);
      return result;
    }

    // Check safety (sacked behind own goal)
    if (newLos <= 0) {
      result.isTurnover = true;
      this.state.driveResult = 'safety';
      this.state.lineOfScrimmage = 0;
      this.finalizPlay(result);
      return result;
    }

    // Check turnovers
    if (this.config.enableTurnovers) {
      if (result.isInterception) {
        result.isTurnover = true;
        this.state.driveResult = 'interception';
        this.finalizPlay(result);
        return result;
      }
      if (result.isFumble) {
        result.isTurnover = true;
        this.state.driveResult = 'fumble_lost';
        this.finalizPlay(result);
        return result;
      }
    }

    // Apply yards
    this.state.lineOfScrimmage = newLos;
    this.state.driveYards += Math.max(0, actualYards);

    // Check first down
    if (newLos >= this.state.firstDownMarker) {
      result.isFirstDown = true;
      this.state.down = 1;
      this.state.yardsToGo = this.config.firstDownDistance;
      this.state.firstDownMarker = Math.min(
        newLos + this.config.firstDownDistance,
        this.config.fieldLength,
      );
    } else {
      // Advance down
      this.state.down++;
      this.state.yardsToGo = Math.max(1, this.state.firstDownMarker - newLos);

      // Turnover on downs
      if (this.state.down > this.config.maxDowns) {
        result.isTurnover = true;
        this.state.driveResult = 'turnover_on_downs';
      }
    }

    this.finalizPlay(result);
    return result;
  }

  private finalizPlay(result: PlayResult): void {
    this.state.playCount++;
    this.state.lastPlayResult = result;
    this.state.isRedZone = this.state.lineOfScrimmage >= 80;
    this.state.fieldPosition =
      this.state.lineOfScrimmage < 40 ? 'own' :
      this.state.lineOfScrimmage < 60 ? 'midfield' : 'opponent';
    this.playHistory.push(result);
  }

  // ── Accessors ──

  public getState(): DriveState {
    return { ...this.state };
  }

  public isOver(): boolean {
    return this.state.driveResult !== 'in_progress';
  }

  public getDown(): number {
    return this.state.down;
  }

  public getYardsToGo(): number {
    return this.state.yardsToGo;
  }

  public getLineOfScrimmage(): number {
    return this.state.lineOfScrimmage;
  }

  public getFirstDownMarker(): number {
    return this.state.firstDownMarker;
  }

  public isRedZone(): boolean {
    return this.state.isRedZone;
  }

  public getPlayHistory(): PlayResult[] {
    return [...this.playHistory];
  }

  /** Get short description: "1st & 10 at OWN 25" */
  public getDownAndDistance(): string {
    const ordinal = ['1st', '2nd', '3rd', '4th'][this.state.down - 1] ?? `${this.state.down}th`;
    const los = this.state.lineOfScrimmage;
    const side = los <= 50 ? `OWN ${los}` : `OPP ${100 - los}`;
    if (this.state.yardsToGo >= this.config.fieldLength - los) {
      return `${ordinal} & Goal at ${side}`;
    }
    return `${ordinal} & ${this.state.yardsToGo} at ${side}`;
  }

  /** Average yards per play this drive */
  public getAvgYardsPerPlay(): number {
    if (this.state.playCount === 0) return 0;
    return this.state.driveYards / this.state.playCount;
  }
}
