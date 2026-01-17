/**
 * Blazecraft Replay Schema
 *
 * Central data contract for replay files. The AgentState structure
 * is the key differentiator - it captures WHY agents made decisions,
 * not just WHAT they did.
 *
 * Compatible with MicroRTS-Py output format with instrumentation extensions.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Core Enums
// ─────────────────────────────────────────────────────────────

export const UnitTypeSchema = z.enum([
  'base',
  'barracks',
  'worker',
  'light',
  'heavy',
  'ranged',
  'resource',
]);
export type UnitType = z.infer<typeof UnitTypeSchema>;

export const ActionTypeSchema = z.enum([
  'idle',
  'move',
  'attack',
  'harvest',
  'return',
  'produce',
  'build',
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const IntentTypeSchema = z.enum([
  'rush',      // Early aggression, minimal eco
  'tech',      // Building up tech/structures
  'eco',       // Economic expansion
  'defend',    // Defensive posture
  'harass',    // Harassment/distraction
  'scout',     // Information gathering
  'retreat',   // Tactical withdrawal
  'unknown',   // Unclear intent
]);
export type IntentType = z.infer<typeof IntentTypeSchema>;

export const TeamIdSchema = z.enum(['0', '1', 'neutral']);
export type TeamId = z.infer<typeof TeamIdSchema>;

// ─────────────────────────────────────────────────────────────
// Position & Map
// ─────────────────────────────────────────────────────────────

export const PositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});
export type Position = z.infer<typeof PositionSchema>;

export const MapCellSchema = z.object({
  terrain: z.enum(['ground', 'wall', 'resource']),
  resourceAmount: z.number().int().min(0).optional(),
});
export type MapCell = z.infer<typeof MapCellSchema>;

export const MapDataSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  cells: z.array(z.array(MapCellSchema)),
  name: z.string().optional(),
});
export type MapData = z.infer<typeof MapDataSchema>;

// ─────────────────────────────────────────────────────────────
// Units & Actions
// ─────────────────────────────────────────────────────────────

export const UnitSchema = z.object({
  id: z.string(),
  type: UnitTypeSchema,
  team: TeamIdSchema,
  position: PositionSchema,
  hp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  resources: z.number().int().min(0).optional(),  // For workers carrying resources
  currentAction: ActionTypeSchema.optional(),
  targetId: z.string().optional(),                // Target unit ID
  targetPosition: PositionSchema.optional(),      // Target location
  productionProgress: z.number().min(0).max(1).optional(), // 0-1 progress
});
export type Unit = z.infer<typeof UnitSchema>;

export const ActionSchema = z.object({
  unitId: z.string(),
  type: ActionTypeSchema,
  targetId: z.string().optional(),
  targetPosition: PositionSchema.optional(),
  producingType: UnitTypeSchema.optional(),
  executedAtTick: z.number().int().min(0),
});
export type Action = z.infer<typeof ActionSchema>;

// ─────────────────────────────────────────────────────────────
// Resource State
// ─────────────────────────────────────────────────────────────

export const ResourceStateSchema = z.object({
  minerals: z.number().int().min(0),
  supplyUsed: z.number().int().min(0),
  supplyMax: z.number().int().min(0),
});
export type ResourceState = z.infer<typeof ResourceStateSchema>;

// ─────────────────────────────────────────────────────────────
// Agent State - THE KEY DIFFERENTIATOR
// ─────────────────────────────────────────────────────────────

/**
 * AgentState captures the internal decision-making of an AI agent.
 * This is what makes Blazecraft more than a replay viewer.
 */
export const AgentStateSchema = z.object({
  agentId: z.string(),

  // Current strategic intent
  intent: IntentTypeSchema,

  // Human-readable explanation of WHY this intent
  reason: z.string(),

  // How confident is the agent in this intent? (0-1)
  confidence: z.number().min(0).max(1),

  // Policy entropy - higher = more uncertain about action choice
  entropy: z.number().min(0),

  // Which actions were considered valid this tick?
  // Maps action index to whether it was masked as valid
  actionMask: z.array(z.boolean()).optional(),

  // Action probabilities from policy network (if available)
  actionProbabilities: z.array(z.number().min(0).max(1)).optional(),

  // Time taken to compute decision (ms)
  timeToDecision: z.number().min(0),

  // Value function estimate (expected future reward)
  valueEstimate: z.number().optional(),

  // Optional: key-value pairs for model-specific data
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AgentState = z.infer<typeof AgentStateSchema>;

// ─────────────────────────────────────────────────────────────
// Per-Tick State
// ─────────────────────────────────────────────────────────────

export const ReplayTickSchema = z.object({
  tick: z.number().int().min(0),

  // All units at this tick
  units: z.array(UnitSchema),

  // Resource state per team
  resources: z.record(TeamIdSchema, ResourceStateSchema),

  // Actions executed this tick
  actions: z.array(ActionSchema),

  // Agent decision states - THE KEY DATA
  agentStates: z.array(AgentStateSchema),

  // Optional: events that happened (unit died, building completed, etc.)
  events: z.array(z.object({
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
  })).optional(),
});
export type ReplayTick = z.infer<typeof ReplayTickSchema>;

// ─────────────────────────────────────────────────────────────
// Agent Info (Metadata)
// ─────────────────────────────────────────────────────────────

export const AgentInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: TeamIdSchema,
  type: z.string(),              // 'ppo', 'a2c', 'scripted', etc.
  version: z.string().optional(),
  modelPath: z.string().optional(),
  color: z.string().optional(),   // Hex color for UI
});
export type AgentInfo = z.infer<typeof AgentInfoSchema>;

// ─────────────────────────────────────────────────────────────
// Full Replay
// ─────────────────────────────────────────────────────────────

export const ReplayMetadataSchema = z.object({
  matchId: z.string(),
  timestamp: z.string(),          // ISO 8601, America/Chicago
  map: MapDataSchema,
  agents: z.array(AgentInfoSchema),
  duration: z.number().int().positive(),  // Total ticks
  winner: TeamIdSchema.optional(),
  gameVersion: z.string().optional(),
  simulatorVersion: z.string().optional(),
});
export type ReplayMetadata = z.infer<typeof ReplayMetadataSchema>;

export const BlazecraftReplaySchema = z.object({
  version: z.string(),
  metadata: ReplayMetadataSchema,
  ticks: z.array(ReplayTickSchema),
});
export type BlazecraftReplay = z.infer<typeof BlazecraftReplaySchema>;

// ─────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Parse and validate a replay file
 */
export function parseReplay(data: unknown): BlazecraftReplay {
  return BlazecraftReplaySchema.parse(data);
}

/**
 * Safely parse replay, returning null on failure
 */
export function safeParseReplay(data: unknown): BlazecraftReplay | null {
  const result = BlazecraftReplaySchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate replay structure without parsing
 */
export function validateReplay(data: unknown): { success: boolean; errors?: string[] } {
  const result = BlazecraftReplaySchema.safeParse(data);
  if (result.success) {
    return { success: true };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}
