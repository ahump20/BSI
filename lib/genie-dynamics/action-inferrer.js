/**
 * Action Inferrer — delta-based action inference
 * Infers discrete actions from consecutive state token pairs without labels.
 */

import { decode } from './state-tokenizer.js';

export const InferredAction = Object.freeze({
  NOOP: 0,
  MOVE: 1,
  TRANSITION: 2,
  DEGRADE: 3,
  RECOVER: 4,
  COMPLETE: 5,
  SPAWN: 6,
  DESPAWN: 7,
});

export function infer(prevToken, nextToken) {
  if (prevToken === null && nextToken !== null) {
    return { action: InferredAction.SPAWN, magnitude: 1, delta: { spawned: true } };
  }
  if (prevToken !== null && nextToken === null) {
    return { action: InferredAction.DESPAWN, magnitude: 1, delta: { despawned: true } };
  }
  if (prevToken === null && nextToken === null) {
    return { action: InferredAction.NOOP, magnitude: 0, delta: {} };
  }

  const prev = decode(prevToken);
  const next = decode(nextToken);

  const delta = {
    type: next.type - prev.type,
    action: next.action - prev.action,
    health: next.health - prev.health,
    region: next.region !== prev.region,
    regionFrom: prev.region,
    regionTo: next.region,
  };

  if (prevToken === nextToken) {
    return { action: InferredAction.NOOP, magnitude: 0, delta };
  }

  const COMPLETE_TYPE = 6, DONE_ACTION = 7;
  if (next.type === COMPLETE_TYPE || next.action === DONE_ACTION) {
    return { action: InferredAction.COMPLETE, magnitude: 1, delta };
  }

  if (delta.region) {
    const distance = regionDistance(prev.region, next.region);
    return { action: InferredAction.MOVE, magnitude: distance / 6, delta };
  }

  if (delta.health < 0) {
    return { action: InferredAction.DEGRADE, magnitude: Math.abs(delta.health) / 3, delta };
  }
  if (delta.health > 0) {
    return { action: InferredAction.RECOVER, magnitude: delta.health / 3, delta };
  }

  if (delta.type !== 0 || delta.action !== 0) {
    const changeMagnitude = (Math.abs(delta.type) + Math.abs(delta.action)) / 14;
    return { action: InferredAction.TRANSITION, magnitude: changeMagnitude, delta };
  }

  return { action: InferredAction.NOOP, magnitude: 0, delta };
}

function regionDistance(r1, r2) {
  const x1 = r1 % 4, y1 = Math.floor(r1 / 4);
  const x2 = r2 % 4, y2 = Math.floor(r2 / 4);
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

export function inferSequence(tokenSequence) {
  if (tokenSequence.length < 2) return [];
  const actions = [];
  for (let i = 1; i < tokenSequence.length; i++) {
    actions.push(infer(tokenSequence[i - 1], tokenSequence[i]));
  }
  return actions;
}

export function packAction(result) {
  const actionBits = result.action & 0x07;
  const magnitudeBits = Math.round(result.magnitude * 31) & 0x1F;
  return actionBits | (magnitudeBits << 3);
}

export function unpackAction(packed) {
  return {
    action: packed & 0x07,
    magnitude: ((packed >> 3) & 0x1F) / 31,
  };
}

export function actionName(action) {
  return Object.keys(InferredAction)[action] || 'UNKNOWN';
}

export default { InferredAction, infer, inferSequence, packAction, unpackAction, actionName };
