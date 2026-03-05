/**
 * Football Adapter — maps Blaze Blitz entities to 12-bit tokens.
 *
 * Token layout (12 bits):
 *   bits 0-2: PlayerType (QB/WR1/WR2/WR3/TE/RB/DEFENDER/BALL)
 *   bits 3-5: PlayAction (huddle/set/snap/throw/run-route/catch/tackle/score)
 *   bits 6-7: Stamina (0-3, bucketed from 0-100%)
 *   bits 8-11: FieldRegion (16 zones: 8 yard segments x 2 lateral halves)
 */

import { Vector3 } from '@babylonjs/core';

// ── Enums ────────────────────────────────────────────────

export enum PlayerType {
  QB = 0,
  WR1 = 1,
  WR2 = 2,
  WR3 = 3,
  TE = 4,
  RB = 5,
  DEFENDER = 6,
  BALL = 7,
}

export enum PlayAction {
  HUDDLE = 0,
  SET = 1,
  SNAP = 2,
  THROW = 3,
  RUN_ROUTE = 4,
  CATCH = 5,
  TACKLE = 6,
  SCORE = 7,
}

export enum Stamina {
  FRESH = 3,
  GOOD = 2,
  TIRED = 1,
  GASSED = 0,
}

// ── Token encode/decode ──────────────────────────────────

export function encode(
  type: PlayerType,
  action: PlayAction,
  stamina: number,
  region: number
): number {
  return (type & 0x7) | ((action & 0x7) << 3) | ((stamina & 0x3) << 6) | ((region & 0xF) << 8);
}

export function decode(token: number): {
  type: PlayerType;
  action: PlayAction;
  stamina: number;
  region: number;
} {
  return {
    type: token & 0x7,
    action: (token >> 3) & 0x7,
    stamina: (token >> 6) & 0x3,
    region: (token >> 8) & 0xF,
  };
}

// ── Field zone mapping ───────────────────────────────────
// 100-yard field split into 8 yard-line segments (12.5 yards each),
// each split laterally into left/right = 16 zones total.

const FIELD_LENGTH = 100; // yards
const FIELD_WIDTH = 53.3; // yards (standard)

export function positionToFieldZone(pos: Vector3, fieldLength: number = FIELD_LENGTH): number {
  // Z axis = downfield (0 = own endzone, fieldLength = opponent endzone)
  // X axis = lateral (-half width to +half width)
  const yardLine = Math.max(0, Math.min(fieldLength, pos.z));
  const segment = Math.min(7, Math.floor((yardLine / fieldLength) * 8));
  const lateral = pos.x >= 0 ? 1 : 0; // 0 = left, 1 = right
  return segment * 2 + lateral;
}

export function regionToFieldPosition(
  region: number,
  fieldLength: number = FIELD_LENGTH
): Vector3 {
  const segment = Math.floor(region / 2);
  const lateral = region % 2;
  const z = ((segment + 0.5) / 8) * fieldLength;
  const x = lateral === 1 ? 8 : -8;
  return new Vector3(x, 1, z);
}

// ── Entity-to-token helpers ──────────────────────────────

export interface FootballEntity {
  id: string;
  type: PlayerType;
  position: Vector3;
  action: PlayAction;
  stamina?: number; // 0-100
}

function bucketStamina(raw: number): number {
  if (raw >= 75) return Stamina.FRESH;
  if (raw >= 50) return Stamina.GOOD;
  if (raw >= 25) return Stamina.TIRED;
  return Stamina.GASSED;
}

export function entityToToken(entity: FootballEntity, fieldLength?: number): number {
  const region = positionToFieldZone(entity.position, fieldLength);
  const stamina = bucketStamina(entity.stamina ?? 100);
  return encode(entity.type, entity.action, stamina, region);
}

// Map Blitz position IDs to PlayerType
const POSITION_MAP: Record<string, PlayerType> = {
  qb: PlayerType.QB,
  wr1: PlayerType.WR1,
  wr2: PlayerType.WR2,
  wr3: PlayerType.WR3,
  te: PlayerType.TE,
  rb: PlayerType.RB,
};

export function blitzIdToPlayerType(id: string): PlayerType {
  return POSITION_MAP[id] ?? PlayerType.DEFENDER;
}
