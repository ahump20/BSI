/**
 * Game State Manager - Original Baseball Game
 * Tracks score, innings, outs, and game progression
 */

import { GameConfig } from '@/config/GameConfig';

export interface TeamStats {
  score: number;
  hits: number;
  outs: number;
}

export class GameState {
  // Game status
  public inning: number = 1;
  public isTopOfInning: boolean = true;
  public balls: number = 0;
  public strikes: number = 0;
  public outs: number = 0;

  // Team stats
  public player: TeamStats = { score: 0, hits: 0, outs: 0 };
  public cpu: TeamStats = { score: 0, hits: 0, outs: 0 };

  // Game state
  public isGameOver: boolean = false;
  public winner: 'player' | 'cpu' | 'tie' | null = null;

  constructor() {
    this.reset();
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this.inning = 1;
    this.isTopOfInning = true;
    this.balls = 0;
    this.strikes = 0;
    this.outs = 0;
    this.player = { score: 0, hits: 0, outs: 0 };
    this.cpu = { score: 0, hits: 0, outs: 0 };
    this.isGameOver = false;
    this.winner = null;
  }

  /**
   * Add a strike
   */
  addStrike(): boolean {
    this.strikes++;
    if (this.strikes >= GameConfig.strikesPerOut) {
      this.addOut();
      return true;
    }
    return false;
  }

  /**
   * Add a ball
   */
  addBall(): boolean {
    this.balls++;
    if (this.balls >= GameConfig.ballsPerWalk) {
      this.resetCount();
      return true; // Walk
    }
    return false;
  }

  /**
   * Add an out
   */
  addOut(): void {
    this.outs++;
    this.resetCount();

    if (this.outs >= GameConfig.outsPerInning) {
      this.nextHalfInning();
    }
  }

  /**
   * Reset ball/strike count
   */
  resetCount(): void {
    this.balls = 0;
    this.strikes = 0;
  }

  /**
   * Record a hit and advance to next batter
   */
  recordHit(type: 'single' | 'double' | 'triple' | 'homerun'): void {
    this.player.hits++;

    // Simplified scoring - just add runs based on hit type
    switch (type) {
      case 'single':
        // 30% chance to score a run
        if (Math.random() < 0.3) this.player.score++;
        break;
      case 'double':
        // 50% chance to score a run
        if (Math.random() < 0.5) this.player.score++;
        break;
      case 'triple':
        // 75% chance to score a run
        if (Math.random() < 0.75) this.player.score++;
        break;
      case 'homerun':
        this.player.score++;
        break;
    }

    this.resetCount();
  }

  /**
   * Move to next half inning
   */
  nextHalfInning(): void {
    this.outs = 0;
    this.resetCount();

    if (this.isTopOfInning) {
      // Switch to bottom of inning (CPU turn - auto-simulate)
      this.isTopOfInning = false;
      this.simulateCPUInning();
    } else {
      // Move to next inning
      this.inning++;
      this.isTopOfInning = true;

      // Check if game is over
      if (this.inning > GameConfig.innings) {
        this.endGame();
      }
    }
  }

  /**
   * Simulate CPU half-inning
   * Simple random simulation for MVP
   */
  private simulateCPUInning(): void {
    // Random 0-3 runs
    const runs = Math.floor(Math.random() * 4);
    this.cpu.score += runs;
    this.cpu.hits += Math.floor(Math.random() * 3);
  }

  /**
   * End the game and determine winner
   */
  private endGame(): void {
    this.isGameOver = true;

    if (this.player.score > this.cpu.score) {
      this.winner = 'player';
    } else if (this.cpu.score > this.player.score) {
      this.winner = 'cpu';
    } else {
      this.winner = 'tie';
    }
  }

  /**
   * Get current at-bat summary
   */
  getAtBatSummary(): string {
    return `Inning ${this.inning} ${this.isTopOfInning ? '▲' : '▼'} | ${this.balls}-${this.strikes} | ${this.outs} out${this.outs !== 1 ? 's' : ''}`;
  }

  /**
   * Get score summary
   */
  getScoreSummary(): string {
    return `Player: ${this.player.score} | CPU: ${this.cpu.score}`;
  }
}
