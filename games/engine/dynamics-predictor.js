/**
 * Dynamics Predictor — frequency-based transition model
 * Predicts next state from observed transitions. Computes anomaly scores.
 *
 * v2: order-2 transitions, exponential decay, Dirichlet smoothing,
 *     action-conditioned anomaly scoring.
 */

import { infer } from './action-inferrer.js';
import { decode } from './state-tokenizer.js';

const VOCABULARY_SIZE = 4096;
const ACTION_COUNT = 8;

export class DynamicsPredictor {
  constructor(options = {}) {
    this.smoothing = options.smoothing ?? 0.1;
    this.maxHistory = options.maxHistory ?? 10000;
    this.tau = options.tau ?? 300000; // 5 min decay half-life in ms
    this.order2Threshold = options.order2Threshold ?? 3;

    // Order-1: Map<prevToken, Map<action, Map<nextToken, {c,t}>>>
    this.transitions = new Map();
    // Order-2: Map<contextKey, Map<action, Map<nextToken, {c,t}>>>
    this.order2Transitions = new Map();
    // Per-agent rolling context: Map<agentId, {prev: token, prevPrev: token|null}>
    this.agentContext = new Map();

    this.totalObservations = 0;
    this.history = [];
  }

  // ── helpers ──────────────────────────────────────────────

  _now() { return Date.now(); }

  _getDecayedCount(entry, now) {
    const elapsed = now - entry.t;
    if (elapsed <= 0) return entry.c;
    return entry.c * Math.exp(-elapsed / this.tau);
  }

  _order2Key(prevPrev, prev) {
    return prevPrev | (prev << 12);
  }

  // ── observe ─────────────────────────────────────────────

  observe(prevToken, nextToken, agentId = null) {
    const now = this._now();
    const actionResult = infer(prevToken, nextToken);
    const actionKey = actionResult.action;

    // Order-1 update
    this._recordTransition(this.transitions, prevToken, actionKey, nextToken, now);

    // Order-2 update (only when agent context available)
    if (agentId != null) {
      const ctx = this.agentContext.get(agentId);
      if (ctx && ctx.prev === prevToken && ctx.prevPrev != null) {
        const key = this._order2Key(ctx.prevPrev, prevToken);
        this._recordTransition(this.order2Transitions, key, actionKey, nextToken, now);
      }
      // Update agent context
      const prevPrev = ctx ? ctx.prev : null;
      this.agentContext.set(agentId, { prev: nextToken, prevPrev: prevToken });
    }

    this.totalObservations++;

    this.history.push({ prev: prevToken, action: actionKey, next: nextToken, time: now });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  _recordTransition(table, key, actionKey, nextToken, now) {
    if (!table.has(key)) table.set(key, new Map());
    const stateMap = table.get(key);
    if (!stateMap.has(actionKey)) stateMap.set(actionKey, new Map());
    const actionMap = stateMap.get(actionKey);

    const existing = actionMap.get(nextToken);
    if (existing) {
      // Decay existing count, then add 1
      existing.c = this._getDecayedCount(existing, now) + 1;
      existing.t = now;
    } else {
      actionMap.set(nextToken, { c: 1, t: now });
    }
  }

  // ── predict ─────────────────────────────────────────────

  predict(currentToken, action = null, prevToken = null) {
    const now = this._now();

    // Try order-2 first
    if (prevToken != null) {
      const o2 = this._predictOrder2(prevToken, currentToken, action, now);
      if (o2) return o2;
    }

    // Order-1
    return this._predictFromTable(this.transitions, currentToken, action, now)
      || this._defaultPredictions(currentToken);
  }

  _predictOrder2(prevPrevToken, currentToken, action, now) {
    const key = this._order2Key(prevPrevToken, currentToken);
    const result = this._predictFromTable(this.order2Transitions, key, action, now);
    if (!result) return null;

    // Check total observations meet threshold
    const total = result.reduce((s, p) => s + p.observations, 0);
    if (total < this.order2Threshold) return null;
    return result;
  }

  _predictFromTable(table, key, action, now) {
    const stateTransitions = table.get(key);
    if (!stateTransitions) return null;

    const nextCounts = new Map();
    let totalCount = 0;
    const actionsToCheck = action !== null ? [action] : [...stateTransitions.keys()];

    for (const act of actionsToCheck) {
      const actionTransitions = stateTransitions.get(act);
      if (!actionTransitions) continue;
      for (const [nextToken, entry] of actionTransitions) {
        if (nextToken == null) continue; // null safety
        const decayed = this._getDecayedCount(entry, now);
        if (decayed < 0.001) continue; // prune negligible
        const existing = nextCounts.get(nextToken) || 0;
        nextCounts.set(nextToken, existing + decayed);
        totalCount += decayed;
      }
    }

    if (totalCount === 0) return null;

    // Dirichlet smoothing
    const alpha = this.smoothing;
    const defaultPreds = this._defaultPredictions(key);
    const priorMap = new Map(defaultPreds.map(p => [p.token, p.probability]));
    const denominator = totalCount + alpha;

    const predictions = [];
    const seen = new Set();
    for (const [token, count] of nextCounts) {
      const prior = priorMap.get(token) ?? (1 / VOCABULARY_SIZE);
      const prob = (count + alpha * prior) / denominator;
      predictions.push({ token, probability: prob, observations: count });
      seen.add(token);
    }
    // Add prior-only entries for default predictions not yet seen
    for (const [token, prior] of priorMap) {
      if (seen.has(token)) continue;
      const prob = (alpha * prior) / denominator;
      if (prob < 0.01) continue;
      predictions.push({ token, probability: prob, observations: 0 });
    }

    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, 5);
  }

  _defaultPredictions(currentToken) {
    if (currentToken == null) return [];
    // For order-2 composite keys, extract the current token (upper 12 bits)
    const token = currentToken > VOCABULARY_SIZE ? (currentToken >> 12) : currentToken;

    const predictions = [{ token, probability: 0.6, observations: 0 }];
    const minorChange = this._perturbToken(token, 'action');
    if (minorChange !== token) {
      predictions.push({ token: minorChange, probability: 0.25, observations: 0 });
    }
    const healthChange = this._perturbToken(token, 'health');
    if (healthChange !== token) {
      predictions.push({ token: healthChange, probability: 0.15, observations: 0 });
    }
    return predictions;
  }

  _perturbToken(token, dimension) {
    const state = decode(token);
    switch (dimension) {
      case 'action': state.action = (state.action + 1) % 8; break;
      case 'health': state.health = Math.max(0, state.health - 1); break;
      case 'region': state.region = (state.region + 1) % 16; break;
      case 'type': state.type = (state.type + 1) % 8; break;
    }
    return state.type | (state.action << 3) | (state.health << 6) | (state.region << 8);
  }

  // ── anomaly ─────────────────────────────────────────────

  anomalyScore(prevToken, nextToken) {
    const actionResult = infer(prevToken, nextToken);
    const actionKey = actionResult.action;

    // Try action-conditioned prediction first
    const conditioned = this.predict(prevToken, actionKey);
    const hasData = conditioned.some(p => p.observations > 0);
    if (hasData) {
      const match = conditioned.find(p => p.token === nextToken);
      if (!match) return 1.0;
      return 1 - match.probability;
    }

    // Fallback to unconditioned
    const predictions = this.predict(prevToken);
    if (predictions.length === 0) return 0.5;
    const match = predictions.find(p => p.token === nextToken);
    if (!match) return 1.0;
    return 1 - match.probability;
  }

  // ── stats ───────────────────────────────────────────────

  getStats() {
    let uniqueTransitions = 0;
    for (const stateMap of this.transitions.values()) {
      for (const actionMap of stateMap.values()) {
        uniqueTransitions += actionMap.size;
      }
    }
    const maxPossible = VOCABULARY_SIZE * ACTION_COUNT * 10;
    return {
      totalObservations: this.totalObservations,
      uniqueTransitions,
      coverage: uniqueTransitions / maxPossible,
      statesObserved: this.transitions.size,
      order2States: this.order2Transitions.size,
    };
  }

  // ── serialization ───────────────────────────────────────

  serialize() {
    const data = {
      version: 2,
      totalObservations: this.totalObservations,
      transitions: this._serializeTable(this.transitions),
      order2: this._serializeTable(this.order2Transitions),
    };
    return JSON.stringify(data);
  }

  _serializeTable(table) {
    const out = {};
    for (const [state, actionMap] of table) {
      out[state] = {};
      for (const [action, nextMap] of actionMap) {
        out[state][action] = {};
        for (const [next, entry] of nextMap) {
          out[state][action][next] = { c: entry.c, t: entry.t };
        }
      }
    }
    return out;
  }

  static deserialize(json) {
    const data = JSON.parse(json);
    const predictor = new DynamicsPredictor();
    predictor.totalObservations = data.totalObservations || 0;

    const isV2 = data.version === 2;
    const now = Date.now();

    predictor.transitions = DynamicsPredictor._deserializeTable(
      data.transitions || {}, isV2, now
    );

    if (isV2 && data.order2) {
      predictor.order2Transitions = DynamicsPredictor._deserializeTable(
        data.order2, true, now
      );
    }

    return predictor;
  }

  static _deserializeTable(obj, isV2, now) {
    const table = new Map();
    for (const [stateStr, actionObj] of Object.entries(obj)) {
      const state = parseInt(stateStr, 10);
      const stateMap = new Map();
      for (const [actionStr, nextObj] of Object.entries(actionObj)) {
        const action = parseInt(actionStr, 10);
        const nextMap = new Map();
        for (const [k, v] of Object.entries(nextObj)) {
          const nextToken = parseInt(k, 10);
          if (isV2 && typeof v === 'object') {
            nextMap.set(nextToken, { c: v.c, t: v.t });
          } else {
            nextMap.set(nextToken, { c: typeof v === 'number' ? v : v.c ?? 0, t: now });
          }
        }
        stateMap.set(action, nextMap);
      }
      table.set(state, stateMap);
    }
    return table;
  }

  // ── merge ───────────────────────────────────────────────

  merge(other) {
    const now = this._now();
    this._mergeTables(this.transitions, other.transitions, now);
    this._mergeTables(this.order2Transitions, other.order2Transitions, now);
    this.totalObservations += other.totalObservations;
  }

  _mergeTables(target, source, now) {
    for (const [state, actionMap] of source) {
      if (!target.has(state)) target.set(state, new Map());
      const thisStateMap = target.get(state);
      for (const [action, nextMap] of actionMap) {
        if (!thisStateMap.has(action)) thisStateMap.set(action, new Map());
        const thisActionMap = thisStateMap.get(action);
        for (const [next, entry] of nextMap) {
          const existing = thisActionMap.get(next);
          if (existing) {
            existing.c = this._getDecayedCount(existing, now) + this._getDecayedCount(entry, now);
            existing.t = now;
          } else {
            thisActionMap.set(next, { c: this._getDecayedCount(entry, now), t: now });
          }
        }
      }
    }
  }
}

export default DynamicsPredictor;
