/**
 * GameManager.ts
 * State machine for game flow: play selection → snap → play → tackle/touchdown
 * Handles scoring, downs, On-Fire status
 */

import { GameState, GamePhase, Team, Play, PlayerRole, FIELD_CONFIG, PHYSICS_CONFIG } from './types';

export class GameManager {
  private state: GameState;
  private onFireStreak = 0;
  private readonly onFireThreshold = 3;
  
  // Callbacks for UI updates
  private onScoreChange?: (home: number, away: number) => void;
  private onDownChange?: (down: number, yards: number, position: number) => void;
  private onPhaseChange?: (phase: GamePhase) => void;
  private onFireChange?: (active: boolean) => void;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'loading',
      homeScore: 0,
      awayScore: 0,
      down: 1,
      yardsToGo: FIELD_CONFIG.firstDownDistance,
      lineOfScrimmage: 20,
      possession: 'home',
      quarter: 1,
      timeRemaining: 300,
      players: new Map(),
      ball: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        isThrown: false,
        isSnapped: false,
        carrier: null,
        target: null
      }
    };
  }

  /** Start the game */
  startGame(): void {
    this.setPhase('playSelect');
  }

  /** Transition to a new phase */
  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
    this.onPhaseChange?.(phase);
    
    if (phase === 'playSelect') {
      this.showPlaySelection();
    }
  }

  /** Show play selection UI */
  private showPlaySelection(): void {
    const selectEl = document.getElementById('play-select');
    if (selectEl) selectEl.classList.add('active');
  }

  /** Hide play selection UI */
  private hidePlaySelection(): void {
    const selectEl = document.getElementById('play-select');
    if (selectEl) selectEl.classList.remove('active');
  }

  /** Called when player selects a play */
  selectPlay(play: Play): void {
    this.hidePlaySelection();
    this.setPhase('presnap');
  }

  /** Snap the ball - begin the play */
  snapBall(): void {
    this.state.ball.isSnapped = true;
    this.setPhase('playing');
  }

  /**
   * Check for tackle collision
   * Arcade-style: sphere overlap check, not mesh collision
   */
  checkTackle(ballCarrierPos: { x: number; z: number }, defenderPos: { x: number; z: number }): boolean {
    const dx = ballCarrierPos.x - defenderPos.x;
    const dz = ballCarrierPos.z - defenderPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    return dist <= PHYSICS_CONFIG.tackleRadius;
  }

  /**
   * Handle a tackle event
   * Returns launch impulse vectors for both players
   */
  handleTackle(ballCarrierPos: { x: number; z: number }, defenderPos: { x: number; z: number }): {
    carrierImpulse: { x: number; z: number };
    defenderImpulse: { x: number; z: number };
  } {
    // Calculate direction from defender to carrier
    const dx = ballCarrierPos.x - defenderPos.x;
    const dz = ballCarrierPos.z - defenderPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    
    // Normalize and apply launch force
    const force = PHYSICS_CONFIG.launchForce;
    
    // Ball carrier gets launched in direction of hit
    const carrierImpulse = {
      x: (dx / dist) * force,
      z: (dz / dist) * force
    };
    
    // Defender gets opposite reaction (Newton's third law, but exaggerated)
    const defenderImpulse = {
      x: -(dx / dist) * force * 0.5,
      z: -(dz / dist) * force * 0.5
    };
    
    // Update game state
    this.advancePlay(ballCarrierPos.z);
    this.setPhase('tackle');
    
    // Reset On-Fire streak on failed play
    this.resetOnFireStreak();
    
    return { carrierImpulse, defenderImpulse };
  }

  /** Check if position is in end zone */
  checkTouchdown(zPosition: number): boolean {
    const endZoneZ = this.state.possession === 'home' 
      ? FIELD_CONFIG.length / 2 - FIELD_CONFIG.endZoneDepth
      : -FIELD_CONFIG.length / 2 + FIELD_CONFIG.endZoneDepth;
    
    return this.state.possession === 'home' 
      ? zPosition >= endZoneZ
      : zPosition <= endZoneZ;
  }

  /** Score a touchdown */
  scoreTouchdown(): void {
    const points = 7; // TD + auto PAT for arcade simplicity
    
    if (this.state.possession === 'home') {
      this.state.homeScore += points;
    } else {
      this.state.awayScore += points;
    }
    
    // Increment On-Fire streak
    this.incrementOnFireStreak();
    
    this.onScoreChange?.(this.state.homeScore, this.state.awayScore);
    this.setPhase('touchdown');
    
    // Reset for kickoff (simplified: just reset possession)
    setTimeout(() => {
      this.resetDrive(this.state.possession === 'home' ? 'away' : 'home');
      this.setPhase('playSelect');
    }, 3000);
  }

  /**
   * Check for catch within magnetic radius
   * Arcade-style: ball snaps to receiver if within catch radius
   */
  checkCatch(ballPos: { x: number; z: number }, receiverPos: { x: number; z: number }): boolean {
    const dx = ballPos.x - receiverPos.x;
    const dz = ballPos.z - receiverPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    return dist <= PHYSICS_CONFIG.catchRadius;
  }

  /** Successful catch - increment streak */
  handleCatch(): void {
    this.incrementOnFireStreak();
  }

  /** Advance the down after a play */
  private advancePlay(finalZ: number): void {
    const yardsGained = finalZ - this.state.lineOfScrimmage;
    
    // Check for first down (30 yards in Blitz)
    if (yardsGained >= this.state.yardsToGo) {
      this.state.down = 1;
      this.state.yardsToGo = FIELD_CONFIG.firstDownDistance;
      this.state.lineOfScrimmage = finalZ;
    } else {
      this.state.down++;
      this.state.yardsToGo -= yardsGained;
      this.state.lineOfScrimmage = finalZ;
      
      // Turnover on downs after 4th
      if (this.state.down > 4) {
        this.turnover();
        return;
      }
    }
    
    this.onDownChange?.(this.state.down, this.state.yardsToGo, this.state.lineOfScrimmage);
  }

  /** Handle turnover on downs or interception */
  private turnover(): void {
    this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
    this.resetDrive(this.state.possession);
    this.resetOnFireStreak();
    this.setPhase('turnover');
  }

  /** Reset for new drive */
  private resetDrive(team: Team): void {
    this.state.possession = team;
    this.state.down = 1;
    this.state.yardsToGo = FIELD_CONFIG.firstDownDistance;
    this.state.lineOfScrimmage = team === 'home' ? 20 : -20;
    this.onDownChange?.(this.state.down, this.state.yardsToGo, this.state.lineOfScrimmage);
  }

  /** On-Fire streak management */
  private incrementOnFireStreak(): void {
    this.onFireStreak++;
    if (this.onFireStreak >= this.onFireThreshold) {
      this.activateOnFire();
    }
  }

  private resetOnFireStreak(): void {
    this.onFireStreak = 0;
    this.deactivateOnFire();
  }

  private activateOnFire(): void {
    const indicator = document.getElementById('on-fire');
    if (indicator) indicator.classList.add('active');
    this.onFireChange?.(true);
  }

  private deactivateOnFire(): void {
    const indicator = document.getElementById('on-fire');
    if (indicator) indicator.classList.remove('active');
    this.onFireChange?.(false);
  }

  isOnFire(): boolean {
    return this.onFireStreak >= this.onFireThreshold;
  }

  /** Callbacks */
  setOnScoreChange(cb: (home: number, away: number) => void): void {
    this.onScoreChange = cb;
  }

  setOnDownChange(cb: (down: number, yards: number, position: number) => void): void {
    this.onDownChange = cb;
  }

  setOnPhaseChange(cb: (phase: GamePhase) => void): void {
    this.onPhaseChange = cb;
  }

  setOnFireChange(cb: (active: boolean) => void): void {
    this.onFireChange = cb;
  }

  getState(): GameState {
    return this.state;
  }

  getPhase(): GamePhase {
    return this.state.phase;
  }
}
