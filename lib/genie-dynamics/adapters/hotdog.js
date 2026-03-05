/**
 * Hot Dog Dash Adapter — maps game entities to Genie tokens
 *
 * Type: player=0, hotdog=1, bun=2, mustard=3, ketchup=4, obstacle=5, powerup=6, bonus=7
 * Action: idle=0, falling=1, caught=2, missed=3, boosted=4, slowed=5, spawning=6, despawning=7
 * Health: rarity (common=0, uncommon=1, rare=2, legendary=3)
 * Region: 8 columns doubled by top/bottom half = 16 zones
 */

import { encode, decode } from '../state-tokenizer.js';

export const ItemType = Object.freeze({
  PLAYER: 0, HOTDOG: 1, BUN: 2, MUSTARD: 3,
  KETCHUP: 4, OBSTACLE: 5, POWERUP: 6, BONUS: 7,
});

export const ItemAction = Object.freeze({
  IDLE: 0, FALLING: 1, CAUGHT: 2, MISSED: 3,
  BOOSTED: 4, SLOWED: 5, SPAWNING: 6, DESPAWNING: 7,
});

export const Rarity = Object.freeze({
  COMMON: 0, UNCOMMON: 1, RARE: 2, LEGENDARY: 3,
});

export function entityToToken(entity) {
  return encode({
    type: inferItemType(entity),
    action: inferItemAction(entity),
    health: entity.rarity ?? Rarity.COMMON,
    region: positionToColumn(entity.x, entity.y, entity.fieldWidth ?? 800, entity.fieldHeight ?? 600),
  });
}

function inferItemType(entity) {
  const kind = (entity.type || entity.kind || '').toLowerCase();
  if (kind.includes('player') || entity.isPlayer) return ItemType.PLAYER;
  if (kind.includes('hotdog') || kind.includes('hot dog')) return ItemType.HOTDOG;
  if (kind.includes('bun')) return ItemType.BUN;
  if (kind.includes('mustard')) return ItemType.MUSTARD;
  if (kind.includes('ketchup')) return ItemType.KETCHUP;
  if (kind.includes('obstacle')) return ItemType.OBSTACLE;
  if (kind.includes('power')) return ItemType.POWERUP;
  if (kind.includes('bonus')) return ItemType.BONUS;
  return ItemType.HOTDOG;
}

function inferItemAction(entity) {
  const state = (entity.state || entity.currentState || '').toLowerCase();
  if (state.includes('fall')) return ItemAction.FALLING;
  if (state.includes('caught') || state.includes('collect')) return ItemAction.CAUGHT;
  if (state.includes('miss')) return ItemAction.MISSED;
  if (state.includes('boost') || state.includes('speed')) return ItemAction.BOOSTED;
  if (state.includes('slow')) return ItemAction.SLOWED;
  if (state.includes('spawn') && !state.includes('de')) return ItemAction.SPAWNING;
  if (state.includes('despawn') || state.includes('remove')) return ItemAction.DESPAWNING;
  return ItemAction.IDLE;
}

/**
 * 8 columns x 2 vertical halves = 16 zones
 */
function positionToColumn(x, y, fieldWidth, fieldHeight) {
  const col = Math.max(0, Math.min(7, Math.floor((x / fieldWidth) * 8)));
  const isBottom = y > fieldHeight / 2 ? 1 : 0;
  return col * 2 + isBottom;
}

export function regionToPosition(region, fieldWidth = 800, fieldHeight = 600) {
  const col = Math.floor(region / 2);
  const isBottom = region % 2;
  return {
    x: (col + 0.5) * (fieldWidth / 8),
    y: isBottom ? fieldHeight * 0.75 : fieldHeight * 0.25,
  };
}

export default {
  ItemType, ItemAction, Rarity,
  entityToToken, regionToPosition,
};
