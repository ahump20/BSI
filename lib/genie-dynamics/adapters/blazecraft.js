/**
 * Blazecraft Adapter — maps Worker status to Genie token state
 * Canvas: 1280x720, grid: 4x4 (16 zones)
 */

import { AgentType, ActionState, HealthLevel, encode } from '../state-tokenizer.js';

const CANVAS_W = 1280;
const CANVAS_H = 720;

const STATUS_TO_TYPE = {
  idle: AgentType.IDLE,
  working: AgentType.ANALYST,
  moving: AgentType.FETCHER,
  blocked: AgentType.BLOCKED,
  complete: AgentType.COMPLETE,
  terminated: AgentType.ERROR,
  hold: AgentType.BLOCKED,
};

const TASK_TO_ACTION = {
  idle: ActionState.IDLE,
  reading: ActionState.READING,
  writing: ActionState.WRITING,
  waiting: ActionState.WAITING,
  executing: ActionState.EXECUTING,
  communicating: ActionState.COMMUNICATING,
  thinking: ActionState.THINKING,
  done: ActionState.DONE,
};

export function workerToState(worker) {
  const type = STATUS_TO_TYPE[worker.status] ?? AgentType.IDLE;
  const action = inferActionFromTask(worker);
  const health = progressToHealth(worker.progress ?? 0);
  const region = positionToRegion(worker.position?.x ?? 0, worker.position?.y ?? 0);
  return { type, action, health, region };
}

export function workerToToken(worker) {
  return encode(workerToState(worker));
}

function inferActionFromTask(worker) {
  if (worker.status === 'complete') return ActionState.DONE;
  if (worker.status === 'idle') return ActionState.IDLE;
  const task = (worker.currentTask || '').toLowerCase();
  for (const [keyword, action] of Object.entries(TASK_TO_ACTION)) {
    if (task.includes(keyword)) return action;
  }
  return ActionState.EXECUTING;
}

function progressToHealth(progress) {
  if (progress < 0.25) return HealthLevel.CRITICAL;
  if (progress < 0.50) return HealthLevel.LOW;
  if (progress < 0.75) return HealthLevel.NOMINAL;
  return HealthLevel.OPTIMAL;
}

function positionToRegion(x, y) {
  const zoneX = Math.max(0, Math.min(3, Math.floor((x / CANVAS_W) * 4)));
  const zoneY = Math.max(0, Math.min(3, Math.floor((y / CANVAS_H) * 4)));
  return zoneY * 4 + zoneX;
}

export function regionToCanvasPosition(region) {
  const gx = region % 4;
  const gy = Math.floor(region / 4);
  return { x: (gx + 0.5) * (CANVAS_W / 4), y: (gy + 0.5) * (CANVAS_H / 4) };
}

export default { workerToState, workerToToken, regionToCanvasPosition };
