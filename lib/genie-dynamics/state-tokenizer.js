/**
 * State Tokenizer — 12-bit token encode/decode
 * Encodes agent state into a 4096-state vocabulary.
 *
 * Bit layout:
 *   [0-2]  type   (8 agent types)
 *   [3-5]  action (8 action states)
 *   [6-7]  health (4 levels)
 *   [8-11] region (16 zones)
 */

export const AgentType = Object.freeze({
  IDLE: 0, ANALYST: 1, FETCHER: 2, WRITER: 3,
  REVIEWER: 4, BLOCKED: 5, COMPLETE: 6, ERROR: 7,
});

export const ActionState = Object.freeze({
  IDLE: 0, READING: 1, WRITING: 2, WAITING: 3,
  EXECUTING: 4, COMMUNICATING: 5, THINKING: 6, DONE: 7,
});

export const HealthLevel = Object.freeze({
  CRITICAL: 0, LOW: 1, NOMINAL: 2, OPTIMAL: 3,
});

const TYPE_MASK = 0x7, ACTION_MASK = 0x7, HEALTH_MASK = 0x3, REGION_MASK = 0xF;
const ACTION_SHIFT = 3, HEALTH_SHIFT = 6, REGION_SHIFT = 8;

export function encode(state) {
  return (state.type & TYPE_MASK) |
    ((state.action & ACTION_MASK) << ACTION_SHIFT) |
    ((state.health & HEALTH_MASK) << HEALTH_SHIFT) |
    ((state.region & REGION_MASK) << REGION_SHIFT);
}

export function decode(token) {
  return {
    type: token & TYPE_MASK,
    action: (token >> ACTION_SHIFT) & ACTION_MASK,
    health: (token >> HEALTH_SHIFT) & HEALTH_MASK,
    region: (token >> REGION_SHIFT) & REGION_MASK,
  };
}

export function fromAgent(agent, gridWidth = 4, gridHeight = 4) {
  return {
    type: inferType(agent),
    action: inferAction(agent),
    health: inferHealth(agent),
    region: computeRegion(agent.x, agent.y, gridWidth, gridHeight),
  };
}

function inferType(agent) {
  if (agent.error) return AgentType.ERROR;
  if (agent.complete || agent.status === 'complete') return AgentType.COMPLETE;
  if (agent.blocked || agent.status === 'blocked') return AgentType.BLOCKED;
  const role = (agent.role || agent.type || '').toLowerCase();
  if (role.includes('analy')) return AgentType.ANALYST;
  if (role.includes('fetch') || role.includes('read')) return AgentType.FETCHER;
  if (role.includes('writ')) return AgentType.WRITER;
  if (role.includes('review') || role.includes('check')) return AgentType.REVIEWER;
  if (agent.status === 'idle' || !agent.task) return AgentType.IDLE;
  return AgentType.ANALYST;
}

function inferAction(agent) {
  if (agent.complete || agent.status === 'complete') return ActionState.DONE;
  if (!agent.task && !agent.currentAction) return ActionState.IDLE;
  const action = (agent.currentAction || agent.task || '').toLowerCase();
  if (action.includes('read') || action.includes('fetch')) return ActionState.READING;
  if (action.includes('writ') || action.includes('edit')) return ActionState.WRITING;
  if (action.includes('wait') || action.includes('pend')) return ActionState.WAITING;
  if (action.includes('exec') || action.includes('run')) return ActionState.EXECUTING;
  if (action.includes('comm') || action.includes('send')) return ActionState.COMMUNICATING;
  if (action.includes('think') || action.includes('plan')) return ActionState.THINKING;
  return ActionState.EXECUTING;
}

function inferHealth(agent) {
  if (agent.error) return HealthLevel.CRITICAL;
  const progress = agent.progress ?? agent.completion ?? 1;
  if (progress < 0.25) return HealthLevel.CRITICAL;
  if (progress < 0.50) return HealthLevel.LOW;
  if (progress < 0.75) return HealthLevel.NOMINAL;
  return HealthLevel.OPTIMAL;
}

function computeRegion(x, y, gridWidth, gridHeight) {
  const zoneX = Math.max(0, Math.min(3, Math.floor((x / gridWidth) * 4)));
  const zoneY = Math.max(0, Math.min(3, Math.floor((y / gridHeight) * 4)));
  return zoneY * 4 + zoneX;
}

export function describe(token) {
  const state = decode(token);
  const typeNames = Object.keys(AgentType);
  const actionNames = Object.keys(ActionState);
  const healthNames = Object.keys(HealthLevel);
  return `${typeNames[state.type]}/${actionNames[state.action]} [${healthNames[state.health]}] R${state.region}`;
}

export default { AgentType, ActionState, HealthLevel, encode, decode, fromAgent, describe };
