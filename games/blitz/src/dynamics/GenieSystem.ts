/**
 * GenieSystem — Genie dynamics orchestrator for Blaze Blitz.
 *
 * Tracks QB, receivers, and defenders. After enough observations,
 * renders ghost receivers at predicted positions showing where
 * routes will go before/during the play.
 *
 * Killer feature: Route Prediction Ghosts — ghost receivers at
 * predicted positions 1-2 seconds ahead. Anomaly indicators flash
 * when a receiver breaks from predicted route (open receiver detection).
 */

import { Scene, Vector3, GlowLayer } from '@babylonjs/core';
import { GhostRenderer3D } from './GhostRenderer3D';
import {
  entityToToken,
  decode,
  regionToFieldPosition,
  FootballEntity,
  PlayerType,
  PlayAction,
  blitzIdToPlayerType,
} from './FootballAdapter';

// ── Inline DynamicsPredictor (TypeScript-native) ─────────

interface Prediction {
  token: number;
  probability: number;
  observations: number;
}

class DynamicsPredictor {
  private transitions: Map<number, Map<number, Map<number, number>>> = new Map();
  public totalObservations: number = 0;

  observe(prevToken: number | null, nextToken: number | null): void {
    if (prevToken === null || nextToken === null) {
      this.totalObservations++;
      return;
    }
    const actionKey = this._inferAction(prevToken, nextToken);
    if (!this.transitions.has(prevToken)) this.transitions.set(prevToken, new Map());
    const stateMap = this.transitions.get(prevToken)!;
    if (!stateMap.has(actionKey)) stateMap.set(actionKey, new Map());
    const actionMap = stateMap.get(actionKey)!;
    actionMap.set(nextToken, (actionMap.get(nextToken) ?? 0) + 1);
    this.totalObservations++;
  }

  predict(currentToken: number): Prediction[] {
    const stateMap = this.transitions.get(currentToken);
    if (!stateMap) return [{ token: currentToken, probability: 0.6, observations: 0 }];

    const counts = new Map<number, number>();
    let total = 0;
    for (const actionMap of stateMap.values()) {
      for (const [nextToken, count] of actionMap) {
        counts.set(nextToken, (counts.get(nextToken) ?? 0) + count);
        total += count;
      }
    }
    if (total === 0) return [{ token: currentToken, probability: 0.6, observations: 0 }];

    const predictions: Prediction[] = [];
    for (const [token, count] of counts) {
      predictions.push({ token, probability: count / total, observations: count });
    }
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, 5);
  }

  anomalyScore(prevToken: number, nextToken: number): number {
    const predictions = this.predict(prevToken);
    const match = predictions.find(p => p.token === nextToken);
    if (!match) return 1.0;
    return 1 - match.probability;
  }

  serialize(): string {
    const data: Record<string, Record<string, Record<string, number>>> = {};
    for (const [state, actionMap] of this.transitions) {
      data[state] = {};
      for (const [action, nextMap] of actionMap) {
        data[state][action] = Object.fromEntries(nextMap);
      }
    }
    return JSON.stringify({ version: 1, totalObservations: this.totalObservations, transitions: data });
  }

  static deserialize(json: string): DynamicsPredictor {
    const raw = JSON.parse(json);
    const p = new DynamicsPredictor();
    p.totalObservations = raw.totalObservations ?? 0;
    for (const [stateStr, actionObj] of Object.entries(raw.transitions ?? {})) {
      const state = parseInt(stateStr, 10);
      const stateMap = new Map<number, Map<number, number>>();
      for (const [actionStr, nextObj] of Object.entries(actionObj as Record<string, Record<string, number>>)) {
        const action = parseInt(actionStr, 10);
        const nextMap = new Map<number, number>(
          Object.entries(nextObj).map(([k, v]) => [parseInt(k, 10), v])
        );
        stateMap.set(action, nextMap);
      }
      p.transitions.set(state, stateMap);
    }
    return p;
  }

  private _inferAction(prevToken: number, nextToken: number): number {
    if (prevToken === nextToken) return 0;
    const prevRegion = (prevToken >> 8) & 0xF;
    const nextRegion = (nextToken >> 8) & 0xF;
    if (prevRegion !== nextRegion) return 1;
    const prevStamina = (prevToken >> 6) & 0x3;
    const nextStamina = (nextToken >> 6) & 0x3;
    if (nextStamina < prevStamina) return 3;
    if (nextStamina > prevStamina) return 4;
    return 2;
  }
}

// ── GenieSystem ──────────────────────────────────────────

const MIN_PLAYS_FOR_GHOSTS = 3;
const ANOMALY_THRESHOLD = 0.65;

export class GenieSystem {
  private scene: Scene;
  private ghostRenderer: GhostRenderer3D;
  private predictor: DynamicsPredictor;

  private playCount: number = 0;
  private prevTokens: Map<string, number> = new Map();

  /** Anomaly callbacks for UI integration */
  public onAnomaly: ((entityId: string, score: number) => void) | null = null;

  constructor(scene: Scene, glowLayer: GlowLayer | null = null) {
    this.scene = scene;
    this.ghostRenderer = new GhostRenderer3D(scene, glowLayer);
    this.predictor = new DynamicsPredictor();
  }

  /**
   * Observe entity state change (call after each position/action update).
   */
  observeEntity(entity: FootballEntity): void {
    const token = entityToToken(entity);
    const prevToken = this.prevTokens.get(entity.id) ?? null;

    if (prevToken !== null) {
      this.predictor.observe(prevToken, token);

      // Anomaly detection
      const score = this.predictor.anomalyScore(prevToken, token);
      if (score > ANOMALY_THRESHOLD && this.playCount >= MIN_PLAYS_FOR_GHOSTS) {
        this.onAnomaly?.(entity.id, score);
      }
    } else {
      this.predictor.observe(null, token);
    }

    this.prevTokens.set(entity.id, token);
  }

  /**
   * Call when a new play starts.
   */
  onPlayStart(): void {
    this.playCount++;
  }

  /**
   * Call when a play ends. Clears per-play entity tokens.
   */
  onPlayEnd(): void {
    // Observe "despawn" for all tracked entities
    for (const [id, token] of this.prevTokens) {
      this.predictor.observe(token, null);
    }
    this.prevTokens.clear();
  }

  /**
   * Render ghost predictions. Call each frame during play_active.
   */
  renderGhosts(
    currentEntities: Map<string, { position: Vector3; type: PlayerType }>
  ): void {
    this.ghostRenderer.clear();

    if (this.playCount < MIN_PLAYS_FOR_GHOSTS) return;

    for (const [entityId, currentToken] of this.prevTokens) {
      const entityInfo = currentEntities.get(entityId);
      if (!entityInfo) continue;

      // Only predict for receivers (not QB, not defenders)
      const pType = entityInfo.type;
      if (
        pType === PlayerType.QB ||
        pType === PlayerType.DEFENDER ||
        pType === PlayerType.BALL
      ) {
        continue;
      }

      const predictions = this.predictor.predict(currentToken);

      let rendered = 0;
      for (const pred of predictions) {
        if (pred.probability < 0.1 || rendered >= 2) break;
        if (pred.observations === 0) continue;

        const decoded = decode(pred.token);
        const predictedPos = regionToFieldPosition(decoded.region);

        // Place ghost at predicted position
        this.ghostRenderer.placeGhost(predictedPos, pred.probability, pType);

        // Draw route line from current to predicted
        this.ghostRenderer.renderRoutePrediction(
          entityInfo.position,
          predictedPos,
          pred.probability,
          pType
        );

        rendered++;
      }
    }
  }

  serialize(): string {
    return this.predictor.serialize();
  }

  restore(json: string): void {
    this.predictor = DynamicsPredictor.deserialize(json);
    this.playCount = Math.floor(this.predictor.totalObservations / 10);
  }

  getStats(): { playCount: number; totalObservations: number } {
    return {
      playCount: this.playCount,
      totalObservations: this.predictor.totalObservations,
    };
  }

  dispose(): void {
    this.ghostRenderer.dispose();
  }
}
