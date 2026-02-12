/**
 * Baseball Adapter — maps Sandlot Sluggers entities to Genie tokens
 *
 * Type vocabulary:
 *   0=batter, 1=pitcher, 2=ball, 3=catcher, 4=1B, 5=2B, 6=SS, 7=3B
 *
 * Action vocabulary:
 *   0=idle, 1=windup, 2=pitch, 3=swing, 4=hit, 5=running, 6=fielding, 7=throwing
 *
 * Health: performance metric bucketed (batting avg, pitch control, etc.)
 *
 * Region (field zones):
 *   0=home, 1=mound, 2=infield-L, 3=infield-R,
 *   4=left-field, 5=center-field, 6=right-field, 7=foul-L,
 *   8=foul-R, 9=1B-area, 10=2B-area, 11=SS-area,
 *   12=3B-area, 13=deep-left, 14=deep-center, 15=deep-right
 */

import { encode } from '../state-tokenizer.js';

export const EntityType = Object.freeze({
  BATTER: 0, PITCHER: 1, BALL: 2, CATCHER: 3,
  FIRST_BASE: 4, SECOND_BASE: 5, SHORTSTOP: 6, THIRD_BASE: 7,
});

export const BallAction = Object.freeze({
  IDLE: 0, WINDUP: 1, PITCH: 2, SWING: 3,
  HIT: 4, RUNNING: 5, FIELDING: 6, THROWING: 7,
});

export const FieldZone = Object.freeze({
  HOME: 0, MOUND: 1, INFIELD_L: 2, INFIELD_R: 3,
  LEFT: 4, CENTER: 5, RIGHT: 6, FOUL_L: 7,
  FOUL_R: 8, FIRST_AREA: 9, SECOND_AREA: 10, SS_AREA: 11,
  THIRD_AREA: 12, DEEP_LEFT: 13, DEEP_CENTER: 14, DEEP_RIGHT: 15,
});

/**
 * Convert a ball entity (position Vector3 + velocity) to a token.
 */
export function ballToToken(ball) {
  return encode({
    type: EntityType.BALL,
    action: inferBallAction(ball),
    health: ballSpeedToHealth(ball.velocity),
    region: positionToFieldZone(ball.position),
  });
}

/**
 * Convert a player entity to a token.
 */
export function playerToToken(player, entityType) {
  return encode({
    type: entityType,
    action: inferPlayerAction(player),
    health: performanceToHealth(player),
    region: positionToFieldZone(player.position),
  });
}

function inferBallAction(ball) {
  if (!ball.inPlay && !ball.pitched) return BallAction.IDLE;
  if (ball.pitched && !ball.hit) return BallAction.PITCH;
  if (ball.hit) return BallAction.HIT;
  if (ball.thrown) return BallAction.THROWING;
  return BallAction.IDLE;
}

function inferPlayerAction(player) {
  const state = (player.currentState || player.state || '').toLowerCase();
  if (state.includes('windup')) return BallAction.WINDUP;
  if (state.includes('pitch')) return BallAction.PITCH;
  if (state.includes('swing')) return BallAction.SWING;
  if (state.includes('run')) return BallAction.RUNNING;
  if (state.includes('field')) return BallAction.FIELDING;
  if (state.includes('throw')) return BallAction.THROWING;
  return BallAction.IDLE;
}

function ballSpeedToHealth(velocity) {
  if (!velocity) return 0;
  const speed = Math.sqrt(velocity.x ** 2 + (velocity.y ?? 0) ** 2 + (velocity.z ?? 0) ** 2);
  if (speed > 90) return 3;  // Fastball territory
  if (speed > 70) return 2;
  if (speed > 50) return 1;
  return 0;
}

function performanceToHealth(player) {
  const metric = player.battingAvg ?? player.pitchControl ?? player.fieldingPct ?? 0.5;
  if (metric >= 0.75) return 3;
  if (metric >= 0.50) return 2;
  if (metric >= 0.25) return 1;
  return 0;
}

/**
 * Map 3D world position to one of 16 field zones.
 * Assumes standard diamond: home at origin, mound at (0,0,18.4),
 * bases at ~27m intervals.
 */
export function positionToFieldZone(pos) {
  if (!pos) return FieldZone.HOME;
  const x = pos.x ?? 0;
  const z = pos.z ?? 0;
  const dist = Math.sqrt(x * x + z * z);

  // Near home plate
  if (dist < 5) return FieldZone.HOME;
  // Mound area
  if (dist < 22 && Math.abs(x) < 5) return FieldZone.MOUND;

  // Foul territory
  if (x < -2 && z < 0) return FieldZone.FOUL_L;
  if (x > 2 && z < 0) return FieldZone.FOUL_R;

  // Infield
  if (dist < 30) {
    if (x < -8) return FieldZone.THIRD_AREA;
    if (x > 8) return FieldZone.FIRST_AREA;
    if (x < 0) return FieldZone.SS_AREA;
    return FieldZone.SECOND_AREA;
  }

  // Outfield
  if (dist < 60) {
    if (x < -15) return FieldZone.LEFT;
    if (x > 15) return FieldZone.RIGHT;
    return FieldZone.CENTER;
  }

  // Deep outfield
  if (x < -15) return FieldZone.DEEP_LEFT;
  if (x > 15) return FieldZone.DEEP_RIGHT;
  return FieldZone.DEEP_CENTER;
}

/**
 * Convert a field zone back to approximate world position (for ghost rendering).
 */
export function fieldZoneToWorld(zone) {
  const positions = {
    [FieldZone.HOME]:        { x: 0,   y: 0, z: 0 },
    [FieldZone.MOUND]:       { x: 0,   y: 0, z: 18.4 },
    [FieldZone.INFIELD_L]:   { x: -12, y: 0, z: 20 },
    [FieldZone.INFIELD_R]:   { x: 12,  y: 0, z: 20 },
    [FieldZone.LEFT]:        { x: -40, y: 0, z: 50 },
    [FieldZone.CENTER]:      { x: 0,   y: 0, z: 60 },
    [FieldZone.RIGHT]:       { x: 40,  y: 0, z: 50 },
    [FieldZone.FOUL_L]:      { x: -20, y: 0, z: -5 },
    [FieldZone.FOUL_R]:      { x: 20,  y: 0, z: -5 },
    [FieldZone.FIRST_AREA]:  { x: 19,  y: 0, z: 19 },
    [FieldZone.SECOND_AREA]: { x: 5,   y: 0, z: 27 },
    [FieldZone.SS_AREA]:     { x: -5,  y: 0, z: 27 },
    [FieldZone.THIRD_AREA]:  { x: -19, y: 0, z: 19 },
    [FieldZone.DEEP_LEFT]:   { x: -60, y: 0, z: 70 },
    [FieldZone.DEEP_CENTER]: { x: 0,   y: 0, z: 80 },
    [FieldZone.DEEP_RIGHT]:  { x: 60,  y: 0, z: 70 },
  };
  return positions[zone] ?? positions[FieldZone.HOME];
}

export default {
  EntityType, BallAction, FieldZone,
  ballToToken, playerToToken,
  positionToFieldZone, fieldZoneToWorld,
};
