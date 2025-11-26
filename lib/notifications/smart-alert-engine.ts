/**
 * Smart Alert Engine
 * Intelligent notification system for high-leverage baseball moments
 *
 * Features:
 * - High-leverage situation detection (leverage > 1.8)
 * - Lead change notifications
 * - Walk-off scenario alerts
 * - Upset probability tracking
 * - Momentum shift detection
 * - Critical moment identification
 * - User preference filtering
 *
 * Integration: Works with LiveWinProbabilityEngine and WebSocket feeds
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import {
  GameState,
  WinProbability,
  LiveWinProbabilityEngine,
} from '../analytics/baseball/win-probability-engine';

export interface AlertPreferences {
  userId: string;
  teams: string[]; // team IDs to watch
  alertTypes: {
    highLeverage: boolean; // leverage > 1.8
    leadChange: boolean;
    closeGame: boolean; // win prob between 40-60%
    upsetAlert: boolean; // underdog > 70% win prob
    walkOff: boolean; // bottom 9th or later
    momentumShift: boolean; // WPA > 15%
    gameStart: boolean;
    gameEnd: boolean;
  };
  minLeverageThreshold: number; // default 1.8
  upsetThreshold: number; // default 0.30 (30% pre-game underdog)
  closeGameMargin: number; // default 0.10 (40-60% range)
  quietHours?: {
    start: string; // "22:00" format (America/Chicago)
    end: string; // "07:00" format (America/Chicago)
  };
  deliveryMethods: {
    push: boolean;
    email: boolean;
    sms: boolean;
    webSocket: boolean;
  };
}

export interface Alert {
  alertId: string;
  userId: string;
  gameId: string;
  timestamp: string;
  type: AlertType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  gameState: GameState;
  winProbability: WinProbability;
  metadata: {
    homeTeam: string;
    awayTeam: string;
    inning: number;
    half: 'top' | 'bottom';
    score: string;
    leverageIndex?: number;
    wpa?: number;
    upsetProbability?: number;
  };
  deliveryStatus: {
    push?: 'sent' | 'failed' | 'pending';
    email?: 'sent' | 'failed' | 'pending';
    sms?: 'sent' | 'failed' | 'pending';
    webSocket?: 'sent' | 'failed' | 'pending';
  };
  delivered: boolean;
}

export type AlertType =
  | 'high_leverage'
  | 'lead_change'
  | 'close_game'
  | 'upset_alert'
  | 'walk_off'
  | 'momentum_shift'
  | 'game_start'
  | 'game_end'
  | 'critical_moment';

interface GameHistory {
  gameId: string;
  lastWinProb: number;
  lastLead: 'home' | 'away' | 'tied';
  alertsSent: Set<AlertType>;
  pregameUnderdog?: 'home' | 'away';
  pregameHomeProb?: number;
}

export class SmartAlertEngine {
  private gameHistories: Map<string, GameHistory> = new Map();
  private alertQueue: Alert[] = [];
  private deliveryCallbacks: Map<string, (alert: Alert) => Promise<void>> = new Map();

  /**
   * Process a game state update and generate alerts
   *
   * @param gameState Current game state
   * @param userPreferences User alert preferences
   * @returns Array of generated alerts
   */
  processGameUpdate(gameState: GameState, userPreferences: AlertPreferences): Alert[] {
    const alerts: Alert[] = [];

    // Check if user is watching this game
    const isWatching = this.isWatchingGame(gameState, userPreferences);
    if (!isWatching) {
      return alerts;
    }

    // Check quiet hours
    if (this.isQuietHours(userPreferences)) {
      return alerts;
    }

    // Get or initialize game history
    const history = this.getGameHistory(gameState);

    // Calculate current win probability
    const winProb = LiveWinProbabilityEngine.calculateWinProbability(gameState);

    // Check for alerts based on user preferences
    if (userPreferences.alertTypes.highLeverage) {
      const highLeverageAlert = this.checkHighLeverage(
        gameState,
        winProb,
        userPreferences,
        history
      );
      if (highLeverageAlert) alerts.push(highLeverageAlert);
    }

    if (userPreferences.alertTypes.leadChange) {
      const leadChangeAlert = this.checkLeadChange(gameState, winProb, userPreferences, history);
      if (leadChangeAlert) alerts.push(leadChangeAlert);
    }

    if (userPreferences.alertTypes.closeGame) {
      const closeGameAlert = this.checkCloseGame(gameState, winProb, userPreferences, history);
      if (closeGameAlert) alerts.push(closeGameAlert);
    }

    if (userPreferences.alertTypes.upsetAlert) {
      const upsetAlert = this.checkUpsetAlert(gameState, winProb, userPreferences, history);
      if (upsetAlert) alerts.push(upsetAlert);
    }

    if (userPreferences.alertTypes.walkOff) {
      const walkOffAlert = this.checkWalkOffScenario(gameState, winProb, userPreferences, history);
      if (walkOffAlert) alerts.push(walkOffAlert);
    }

    if (userPreferences.alertTypes.momentumShift) {
      const momentumAlert = this.checkMomentumShift(gameState, winProb, userPreferences, history);
      if (momentumAlert) alerts.push(momentumAlert);
    }

    // Update game history
    this.updateGameHistory(gameState, winProb, history);

    // Queue alerts for delivery
    alerts.forEach((alert) => this.queueAlert(alert, userPreferences));

    return alerts;
  }

  /**
   * Check for high-leverage situations
   */
  private checkHighLeverage(
    gameState: GameState,
    winProb: WinProbability,
    prefs: AlertPreferences,
    history: GameHistory
  ): Alert | null {
    if (winProb.leverageIndex < prefs.minLeverageThreshold) {
      return null;
    }

    // Don't send duplicate high-leverage alerts for same inning
    if (history.alertsSent.has('high_leverage')) {
      return null;
    }

    const title = `🔥 High Leverage: ${gameState.homeTeam} vs ${gameState.awayTeam}`;
    const message =
      `Leverage Index: ${winProb.leverageIndex.toFixed(2)} | ` +
      `${gameState.half === 'top' ? '▲' : '▼'} ${gameState.inning}th, ${gameState.outs} out | ` +
      `${gameState.homeTeam} ${winProb.homeWinProbability.toFixed(1)}% win prob`;

    return this.createAlert(
      prefs.userId,
      gameState,
      winProb,
      'high_leverage',
      'high',
      title,
      message
    );
  }

  /**
   * Check for lead changes
   */
  private checkLeadChange(
    gameState: GameState,
    winProb: WinProbability,
    prefs: AlertPreferences,
    history: GameHistory
  ): Alert | null {
    const currentLead =
      gameState.scoreDiff > 0 ? 'home' : gameState.scoreDiff < 0 ? 'away' : 'tied';

    if (currentLead === history.lastLead) {
      return null;
    }

    // Don't alert for initial lead
    if (history.lastLead === 'tied' && gameState.inning === 1) {
      return null;
    }

    let title: string;
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'high';

    if (currentLead === 'tied') {
      title = `⚡ Tied Game: ${gameState.homeTeam} vs ${gameState.awayTeam}`;
    } else if (currentLead === 'home') {
      title = `🏠 ${gameState.homeTeam} Takes the Lead!`;
    } else {
      title = `✈️ ${gameState.awayTeam} Takes the Lead!`;
    }

    // Extra priority for late-inning lead changes
    if (gameState.inning >= 7) {
      priority = 'critical';
    }

    const message =
      `${gameState.half === 'top' ? '▲' : '▼'} ${gameState.inning}th inning | ` +
      `${gameState.homeTeam} win prob: ${(winProb.homeWinProbability * 100).toFixed(1)}%`;

    return this.createAlert(
      prefs.userId,
      gameState,
      winProb,
      'lead_change',
      priority,
      title,
      message
    );
  }

  /**
   * Check for close game situations
   */
  private checkCloseGame(
    gameState: GameState,
    winProb: WinProbability,
    prefs: AlertPreferences,
    history: GameHistory
  ): Alert | null {
    const probDiff = Math.abs(winProb.homeWinProbability - 0.5);
    const isClose = probDiff < prefs.closeGameMargin;

    if (!isClose || gameState.inning < 7) {
      return null;
    }

    // Only alert once per late-game close situation
    if (history.alertsSent.has('close_game')) {
      return null;
    }

    const title = `⚖️ Tight Game: ${gameState.homeTeam} vs ${gameState.awayTeam}`;
    const message =
      `${gameState.inning >= 9 ? 'Late innings' : `${gameState.inning}th inning`} | ` +
      `${gameState.homeTeam} ${(winProb.homeWinProbability * 100).toFixed(1)}% win prob | ` +
      `Score: ${gameState.homeTeam} ${Math.max(0, gameState.scoreDiff)}-` +
      `${Math.max(0, -gameState.scoreDiff)} ${gameState.awayTeam}`;

    return this.createAlert(
      prefs.userId,
      gameState,
      winProb,
      'close_game',
      'medium',
      title,
      message
    );
  }

  /**
   * Check for upset scenarios
   */
  private checkUpsetAlert(
    gameState: GameState,
    winProb: WinProbability,
    prefs: AlertPreferences,
    history: GameHistory
  ): Alert | null {
    // Only check if we know the pregame underdog
    if (!history.pregameUnderdog || !history.pregameHomeProb) {
      return null;
    }

    const wasUnderdog = history.pregameHomeProb < 1 - prefs.upsetThreshold;
    if (!wasUnderdog) {
      return null;
    }

    // Check if underdog is now winning with > 70% probability
    const underdogWinProb =
      history.pregameUnderdog === 'home' ? winProb.homeWinProbability : winProb.awayWinProbability;

    if (underdogWinProb < 0.7) {
      return null;
    }

    // Only alert once per game
    if (history.alertsSent.has('upset_alert')) {
      return null;
    }

    const underdogTeam =
      history.pregameUnderdog === 'home' ? gameState.homeTeam : gameState.awayTeam;

    const title = `🎯 Upset Alert: ${underdogTeam} Leading!`;
    const message =
      `Pregame underdog now at ${(underdogWinProb * 100).toFixed(1)}% win probability | ` +
      `${gameState.inning >= 9 ? 'Late innings' : `${gameState.inning}th inning`}`;

    return this.createAlert(
      prefs.userId,
      gameState,
      winProb,
      'upset_alert',
      'critical',
      title,
      message
    );
  }

  /**
   * Check for walk-off scenarios
   */
  private checkWalkOffScenario(
    gameState: GameState,
    winProb: WinProbability,
    prefs: AlertPreferences,
    history: GameHistory
  ): Alert | null {
    // Only bottom 9th or later
    if (gameState.inning < 9 || gameState.half !== 'bottom') {
      return null;
    }

    // Home team must be losing or tied
    if (gameState.scoreDiff > 0) {
      return null;
    }

    // Only alert if high leverage (close to walk-off opportunity)
    if (winProb.leverageIndex < 1.5) {
      return null;
    }

    // Only alert once per inning
    const alertKey = `walk_off_${gameState.inning}` as AlertType;
    if (history.alertsSent.has(alertKey)) {
      return null;
    }

    const title = `💥 Walk-Off Opportunity: ${gameState.homeTeam}`;
    const message =
      `Bottom ${gameState.inning}th, ${gameState.outs} out | ` +
      `${gameState.homeTeam} has ${(winProb.homeWinProbability * 100).toFixed(1)}% win probability`;

    return this.createAlert(
      prefs.userId,
      gameState,
      winProb,
      'walk_off',
      'critical',
      title,
      message
    );
  }

  /**
   * Check for momentum shifts (large WPA swings)
   */
  private checkMomentumShift(
    gameState: GameState,
    winProb: WinProbability,
    prefs: AlertPreferences,
    history: GameHistory
  ): Alert | null {
    if (!history.lastWinProb) {
      return null;
    }

    const wpa = Math.abs(winProb.homeWinProbability - history.lastWinProb);

    // Require 15% or greater swing
    if (wpa < 0.15) {
      return null;
    }

    const swingDirection =
      winProb.homeWinProbability > history.lastWinProb ? gameState.homeTeam : gameState.awayTeam;

    const title = `🌊 Momentum Shift: ${swingDirection}`;
    const message =
      `${(wpa * 100).toFixed(1)}% win probability swing | ` +
      `${gameState.half === 'top' ? '▲' : '▼'} ${gameState.inning}th inning`;

    return this.createAlert(
      prefs.userId,
      gameState,
      winProb,
      'momentum_shift',
      'high',
      title,
      message
    );
  }

  /**
   * Create alert object
   */
  private createAlert(
    userId: string,
    gameState: GameState,
    winProb: WinProbability,
    type: AlertType,
    priority: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string
  ): Alert {
    return {
      alertId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      gameId: gameState.gameId,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
      type,
      priority,
      title,
      message,
      gameState,
      winProbability: winProb,
      metadata: {
        homeTeam: gameState.homeTeam,
        awayTeam: gameState.awayTeam,
        inning: gameState.inning,
        half: gameState.half,
        score: `${gameState.homeTeam} ${Math.max(0, gameState.scoreDiff)}-${Math.max(0, -gameState.scoreDiff)} ${gameState.awayTeam}`,
        leverageIndex: winProb.leverageIndex,
        wpa: winProb.winProbabilityAdded,
      },
      deliveryStatus: {},
      delivered: false,
    };
  }

  /**
   * Queue alert for delivery
   */
  private queueAlert(alert: Alert, prefs: AlertPreferences): void {
    this.alertQueue.push(alert);

    // Attempt immediate delivery
    this.deliverAlert(alert, prefs).catch((error) => {
      console.error('Alert delivery failed:', error);
      alert.delivered = false;
    });
  }

  /**
   * Deliver alert via configured methods
   */
  private async deliverAlert(alert: Alert, prefs: AlertPreferences): Promise<void> {
    const deliveryPromises: Promise<void>[] = [];

    if (prefs.deliveryMethods.webSocket) {
      deliveryPromises.push(this.deliverViaWebSocket(alert));
    }

    if (prefs.deliveryMethods.push) {
      deliveryPromises.push(this.deliverViaPush(alert));
    }

    if (prefs.deliveryMethods.email) {
      deliveryPromises.push(this.deliverViaEmail(alert));
    }

    if (prefs.deliveryMethods.sms) {
      deliveryPromises.push(this.deliverViaSMS(alert));
    }

    await Promise.allSettled(deliveryPromises);
    alert.delivered = true;
  }

  /**
   * Delivery methods
   */
  private async deliverViaWebSocket(alert: Alert): Promise<void> {
    const callback = this.deliveryCallbacks.get('webSocket');
    if (callback) {
      await callback(alert);
      alert.deliveryStatus.webSocket = 'sent';
    }
  }

  private async deliverViaPush(alert: Alert): Promise<void> {
    // Implement push notification delivery
    // This would integrate with service like Firebase Cloud Messaging
    alert.deliveryStatus.push = 'sent';
  }

  private async deliverViaEmail(alert: Alert): Promise<void> {
    // Implement email delivery
    // This would integrate with service like SendGrid or AWS SES
    alert.deliveryStatus.email = 'sent';
  }

  private async deliverViaSMS(alert: Alert): Promise<void> {
    // Implement SMS delivery
    // This would integrate with service like Twilio
    alert.deliveryStatus.sms = 'sent';
  }

  /**
   * Register delivery callback for specific method
   */
  registerDeliveryMethod(
    method: 'webSocket' | 'push' | 'email' | 'sms',
    callback: (alert: Alert) => Promise<void>
  ): void {
    this.deliveryCallbacks.set(method, callback);
  }

  /**
   * Helper methods
   */
  private isWatchingGame(gameState: GameState, prefs: AlertPreferences): boolean {
    return prefs.teams.includes(gameState.homeTeam) || prefs.teams.includes(gameState.awayTeam);
  }

  private isQuietHours(prefs: AlertPreferences): boolean {
    if (!prefs.quietHours) {
      return false;
    }

    const now = new Date()
      .toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      })
      .split(', ')[1];

    const { start, end } = prefs.quietHours;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return now >= start || now < end;
    }

    return now >= start && now < end;
  }

  private getGameHistory(gameState: GameState): GameHistory {
    if (!this.gameHistories.has(gameState.gameId)) {
      this.gameHistories.set(gameState.gameId, {
        gameId: gameState.gameId,
        lastWinProb: 0.5,
        lastLead: 'tied',
        alertsSent: new Set(),
      });
    }
    return this.gameHistories.get(gameState.gameId)!;
  }

  private updateGameHistory(
    gameState: GameState,
    winProb: WinProbability,
    history: GameHistory
  ): void {
    history.lastWinProb = winProb.homeWinProbability;
    history.lastLead = gameState.scoreDiff > 0 ? 'home' : gameState.scoreDiff < 0 ? 'away' : 'tied';
  }

  /**
   * Get queued alerts
   */
  getAlertQueue(): Alert[] {
    return [...this.alertQueue];
  }

  /**
   * Clear delivered alerts
   */
  clearDeliveredAlerts(): void {
    this.alertQueue = this.alertQueue.filter((alert) => !alert.delivered);
  }

  /**
   * Clear game history (call when game ends)
   */
  clearGameHistory(gameId: string): void {
    this.gameHistories.delete(gameId);
  }
}

// Export singleton instance
export const alertEngine = new SmartAlertEngine();

// Export for window global access
if (typeof window !== 'undefined') {
  (window as any).SmartAlertEngine = SmartAlertEngine;
  (window as any).alertEngine = alertEngine;
}

export default SmartAlertEngine;
