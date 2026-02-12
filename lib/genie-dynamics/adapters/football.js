/**
 * Football Adapter — maps Blaze Blitz entities to Genie tokens
 *
 * Type: QB=0, WR1=1, WR2=2, WR3=3, TE=4, RB=5, DEFENDER=6, BALL=7
 * Action: huddle=0, set=1, snap=2, throw=3, run-route=4, catch=5, tackle=6, score=7
 * Health: stamina 0-3 (mapped from 0-7 scale)
 * Region: 8 field zones doubled (own endzone to opponent endzone, left/right halves = 16)
 */

import { encode } from '../state-tokenizer.js';

export const PlayerType = Object.freeze({
  QB: 0, WR1: 1, WR2: 2, WR3: 3,
  TE: 4, RB: 5, DEFENDER: 6, BALL: 7,
});

export const PlayAction = Object.freeze({
  HUDDLE: 0, SET: 1, SNAP: 2, THROW: 3,
  RUN_ROUTE: 4, CATCH: 5, TACKLE: 6, SCORE: 7,
});

export function entityToToken(entity) {
  return encode({
    type: inferPlayerType(entity),
    action: inferPlayAction(entity),
    health: staminaToHealth(entity.stamina ?? 7),
    region: fieldPositionToRegion(entity.position, entity.fieldLength ?? 100),
  });
}

function inferPlayerType(entity) {
  const role = (entity.role || entity.position_name || '').toUpperCase();
  if (role.includes('QB')) return PlayerType.QB;
  if (role.includes('WR')) {
    if (role.includes('1')) return PlayerType.WR1;
    if (role.includes('2')) return PlayerType.WR2;
    if (role.includes('3')) return PlayerType.WR3;
    return PlayerType.WR1;
  }
  if (role.includes('TE')) return PlayerType.TE;
  if (role.includes('RB') || role.includes('HB')) return PlayerType.RB;
  if (role.includes('DEF') || role.includes('CB') || role.includes('LB') || role.includes('S'))
    return PlayerType.DEFENDER;
  if (entity.isBall) return PlayerType.BALL;
  return PlayerType.DEFENDER;
}

function inferPlayAction(entity) {
  const state = (entity.currentState || entity.state || '').toLowerCase();
  if (state.includes('huddle')) return PlayAction.HUDDLE;
  if (state.includes('set') || state.includes('line')) return PlayAction.SET;
  if (state.includes('snap')) return PlayAction.SNAP;
  if (state.includes('throw') || state.includes('pass')) return PlayAction.THROW;
  if (state.includes('route') || state.includes('run')) return PlayAction.RUN_ROUTE;
  if (state.includes('catch') || state.includes('receiv')) return PlayAction.CATCH;
  if (state.includes('tackle') || state.includes('sack')) return PlayAction.TACKLE;
  if (state.includes('score') || state.includes('touchdown')) return PlayAction.SCORE;
  return PlayAction.SET;
}

function staminaToHealth(stamina) {
  // stamina 0-7 -> health 0-3
  return Math.min(3, Math.floor(stamina / 2));
}

/**
 * Map field position to 16 zones.
 * Zones 0-7: own endzone to midfield (left half / right half per 4 chunks)
 * Zones 8-15: midfield to opponent endzone
 */
function fieldPositionToRegion(pos, fieldLength) {
  if (!pos) return 0;
  const yardLine = pos.z ?? pos.y ?? 0;
  const lateral = pos.x ?? 0;

  // Normalize to 0-1 along field
  const fieldPct = Math.max(0, Math.min(1, yardLine / fieldLength));
  const yardZone = Math.min(7, Math.floor(fieldPct * 8));

  // Left/right half
  const isRight = lateral > 0 ? 1 : 0;
  return yardZone * 2 + isRight;
}

export function regionToFieldPosition(region, fieldLength = 100) {
  const yardZone = Math.floor(region / 2);
  const isRight = region % 2;
  return {
    x: isRight ? 10 : -10,
    y: 0,
    z: (yardZone + 0.5) * (fieldLength / 8),
  };
}

export default {
  PlayerType, PlayAction,
  entityToToken, regionToFieldPosition,
};
