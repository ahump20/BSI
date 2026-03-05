/**
 * Blaze Blitz Football - Advanced AI System
 *
 * Layered defensive AI with zone/man coverage, blitz packages,
 * read-react logic, pursuit angles, and coverage probability.
 * Built on top of SteeringAI primitives.
 */

import { Vector3 } from '@babylonjs/core';
import { SteeringBehaviors, type SteeringAgent, type SteeringTarget } from './SteeringAI';

// ---------------------------------------------------------------------------
// Enums & Types
// ---------------------------------------------------------------------------

/** Coverage scheme the defense is running */
export enum CoverageScheme {
  Cover0 = 'cover0', // Pure man, no deep safety
  Cover1 = 'cover1', // Man + 1 deep safety
  Cover2 = 'cover2', // 2 deep safeties, 5 underneath zones
  Cover3 = 'cover3', // 3 deep thirds, 4 underneath
  Cover4 = 'cover4', // Quarters
  Cover6 = 'cover6', // Cover 2 on one side, Cover 4 on other
  ManPress = 'man_press',
  ManOff = 'man_off',
}

/** Role a defender fills within a play */
export type DefenderRole =
  | 'deep_third_left'
  | 'deep_third_mid'
  | 'deep_third_right'
  | 'deep_half_left'
  | 'deep_half_right'
  | 'flat_left'
  | 'flat_right'
  | 'hook_curl_left'
  | 'hook_curl_right'
  | 'seam_left'
  | 'seam_right'
  | 'man_coverage'
  | 'spy'
  | 'blitzer'
  | 'contain_left'
  | 'contain_right';

/** Blitz package identifier */
export type BlitzPackage =
  | 'none'
  | 'a_gap_left'
  | 'a_gap_right'
  | 'b_gap_left'
  | 'b_gap_right'
  | 'edge_left'
  | 'edge_right'
  | 'delayed'
  | 'zone_blitz'; // Lineman drops, DB blitzes

/** A rectangular zone on the field defined by yard-line and lateral boundaries */
export interface ZoneDefinition {
  /** Unique identifier for this zone */
  name: string;
  /** Minimum X (sideline-to-sideline, left edge) */
  xMin: number;
  /** Maximum X */
  xMax: number;
  /** Minimum Z (down-field, closer to own end zone) */
  zMin: number;
  /** Maximum Z (further toward opponent end zone) */
  zMax: number;
}

/** Per-defender attributes that drive probability-based outcomes */
interface CoverageAttributes {
  /** 0-1 rating. Higher = faster reaction, tighter coverage */
  coverageRating: number;
  /** Base reaction delay in seconds before defender reacts to a stimulus */
  baseReactionTime: number;
  /** Multiplier on max speed when closing on ball carrier or receiver */
  closingSpeedMultiplier: number;
  /** 0-1 probability of successfully contesting a catch at ideal range */
  contestProbability: number;
}

/** Internal state for a single AI-controlled defender */
interface DefenderState {
  agent: SteeringAgent;
  role: DefenderRole;
  attributes: CoverageAttributes;

  // Assignment state
  manAssignmentId: string | null;
  zone: ZoneDefinition | null;

  // Read-react timers
  reactionTimer: number;
  routeRecognitionTimer: number;
  hasRecognizedRoute: boolean;

  // Blitz state
  blitzPackage: BlitzPackage;
  blitzDelayTimer: number;
  isBlitzing: boolean;

  // Pursuit
  pursuitAngle: Vector3 | null;
  containSide: 'left' | 'right' | null;
}

// ---------------------------------------------------------------------------
// Zone Templates (relative to line of scrimmage at z=0, offense going +Z)
// Field width assumed -26.67 to 26.67 (53.33 yards = 160 feet)
// ---------------------------------------------------------------------------

const HALF_WIDTH = 26.67;
const THIRD_WIDTH = HALF_WIDTH / 1.5; // ~17.78

function buildZoneTemplates(los: number): Record<string, ZoneDefinition> {
  return {
    // Deep thirds (15+ yards from LOS)
    deep_third_left: {
      name: 'deep_third_left',
      xMin: -HALF_WIDTH,
      xMax: -THIRD_WIDTH / 2,
      zMin: los + 15,
      zMax: los + 40,
    },
    deep_third_mid: {
      name: 'deep_third_mid',
      xMin: -THIRD_WIDTH / 2,
      xMax: THIRD_WIDTH / 2,
      zMin: los + 15,
      zMax: los + 40,
    },
    deep_third_right: {
      name: 'deep_third_right',
      xMin: THIRD_WIDTH / 2,
      xMax: HALF_WIDTH,
      zMin: los + 15,
      zMax: los + 40,
    },
    // Deep halves
    deep_half_left: {
      name: 'deep_half_left',
      xMin: -HALF_WIDTH,
      xMax: 0,
      zMin: los + 15,
      zMax: los + 40,
    },
    deep_half_right: {
      name: 'deep_half_right',
      xMin: 0,
      xMax: HALF_WIDTH,
      zMin: los + 15,
      zMax: los + 40,
    },
    // Flats (0-8 yards, outside)
    flat_left: {
      name: 'flat_left',
      xMin: -HALF_WIDTH,
      xMax: -10,
      zMin: los,
      zMax: los + 8,
    },
    flat_right: {
      name: 'flat_right',
      xMin: 10,
      xMax: HALF_WIDTH,
      zMin: los,
      zMax: los + 8,
    },
    // Hook/curl (5-15 yards, inside-ish)
    hook_curl_left: {
      name: 'hook_curl_left',
      xMin: -15,
      xMax: -2,
      zMin: los + 5,
      zMax: los + 15,
    },
    hook_curl_right: {
      name: 'hook_curl_right',
      xMin: 2,
      xMax: 15,
      zMin: los + 5,
      zMax: los + 15,
    },
    // Seams (10-20 yards, between hashes)
    seam_left: {
      name: 'seam_left',
      xMin: -10,
      xMax: -2,
      zMin: los + 10,
      zMax: los + 20,
    },
    seam_right: {
      name: 'seam_right',
      xMin: 2,
      xMax: 10,
      zMin: los + 10,
      zMax: los + 20,
    },
  };
}

function zoneCenter(zone: ZoneDefinition): Vector3 {
  return new Vector3(
    (zone.xMin + zone.xMax) * 0.5,
    0,
    (zone.zMin + zone.zMax) * 0.5,
  );
}

function isInsideZone(pos: Vector3, zone: ZoneDefinition): boolean {
  return (
    pos.x >= zone.xMin &&
    pos.x <= zone.xMax &&
    pos.z >= zone.zMin &&
    pos.z <= zone.zMax
  );
}

// ---------------------------------------------------------------------------
// Default coverage attributes by archetype
// ---------------------------------------------------------------------------

function defaultAttributes(role: DefenderRole): CoverageAttributes {
  switch (role) {
    case 'deep_third_left':
    case 'deep_third_mid':
    case 'deep_third_right':
    case 'deep_half_left':
    case 'deep_half_right':
      return { coverageRating: 0.8, baseReactionTime: 0.2, closingSpeedMultiplier: 1.1, contestProbability: 0.6 };
    case 'man_coverage':
      return { coverageRating: 0.75, baseReactionTime: 0.18, closingSpeedMultiplier: 1.05, contestProbability: 0.55 };
    case 'flat_left':
    case 'flat_right':
    case 'hook_curl_left':
    case 'hook_curl_right':
      return { coverageRating: 0.65, baseReactionTime: 0.22, closingSpeedMultiplier: 1.0, contestProbability: 0.45 };
    case 'seam_left':
    case 'seam_right':
      return { coverageRating: 0.7, baseReactionTime: 0.2, closingSpeedMultiplier: 1.0, contestProbability: 0.5 };
    case 'blitzer':
      return { coverageRating: 0.4, baseReactionTime: 0.12, closingSpeedMultiplier: 1.15, contestProbability: 0.25 };
    case 'spy':
      return { coverageRating: 0.6, baseReactionTime: 0.15, closingSpeedMultiplier: 1.1, contestProbability: 0.35 };
    case 'contain_left':
    case 'contain_right':
      return { coverageRating: 0.5, baseReactionTime: 0.18, closingSpeedMultiplier: 1.05, contestProbability: 0.3 };
    default:
      return { coverageRating: 0.5, baseReactionTime: 0.2, closingSpeedMultiplier: 1.0, contestProbability: 0.4 };
  }
}

// ---------------------------------------------------------------------------
// Pursuit helpers
// ---------------------------------------------------------------------------

/** Calculate an intercept point using pursuit angle rather than direct chase */
function computePursuitAngle(
  defenderPos: Vector3,
  targetPos: Vector3,
  targetVel: Vector3,
  defenderSpeed: number,
): Vector3 {
  const toTarget = targetPos.subtract(defenderPos);
  const dist = toTarget.length();
  if (dist < 0.5) return targetPos.clone();

  const targetSpeed = targetVel.length();
  if (targetSpeed < 0.1) return targetPos.clone();

  // Time-to-intercept estimate
  const closingSpeed = defenderSpeed + targetSpeed;
  const t = dist / closingSpeed;

  // Predict where the target will be
  const intercept = targetPos.add(targetVel.scale(t));
  return intercept;
}

/** Determine contain target: force runner toward sideline or funnel inside */
function computeContainTarget(
  defenderPos: Vector3,
  runnerPos: Vector3,
  side: 'left' | 'right',
): Vector3 {
  // Position outside the runner to force them toward the sideline
  const offsetX = side === 'left' ? -4 : 4;
  return new Vector3(
    runnerPos.x + offsetX,
    0,
    runnerPos.z + 2, // Slightly ahead
  );
}

// ---------------------------------------------------------------------------
// Scheme Assignments
// ---------------------------------------------------------------------------

type RoleAssignmentMap = DefenderRole[];

function rolesForScheme(scheme: CoverageScheme, blitz: BlitzPackage): RoleAssignmentMap {
  // Returns a list of 7 roles for a typical front-7 + 4 DBs = 11, but we
  // only control defensive non-linemen in the arcade game. Assume 7 AI defenders.
  switch (scheme) {
    case CoverageScheme.Cover3:
      return applyBlitz([
        'deep_third_left', 'deep_third_mid', 'deep_third_right',
        'flat_left', 'flat_right', 'hook_curl_left', 'hook_curl_right',
      ], blitz);
    case CoverageScheme.Cover2:
      return applyBlitz([
        'deep_half_left', 'deep_half_right',
        'flat_left', 'flat_right', 'hook_curl_left', 'hook_curl_right', 'seam_left',
      ], blitz);
    case CoverageScheme.Cover4:
      return applyBlitz([
        'deep_third_left', 'deep_third_right', 'deep_half_left', 'deep_half_right',
        'hook_curl_left', 'hook_curl_right', 'seam_right',
      ], blitz);
    case CoverageScheme.Cover1:
      return applyBlitz([
        'deep_third_mid', 'man_coverage', 'man_coverage',
        'man_coverage', 'man_coverage', 'hook_curl_left', 'hook_curl_right',
      ], blitz);
    case CoverageScheme.Cover0:
      return applyBlitz([
        'man_coverage', 'man_coverage', 'man_coverage',
        'man_coverage', 'man_coverage', 'blitzer', 'blitzer',
      ], blitz);
    case CoverageScheme.ManPress:
      return applyBlitz([
        'deep_third_mid', 'man_coverage', 'man_coverage',
        'man_coverage', 'man_coverage', 'man_coverage', 'spy',
      ], blitz);
    case CoverageScheme.ManOff:
      return applyBlitz([
        'deep_third_mid', 'man_coverage', 'man_coverage',
        'man_coverage', 'man_coverage', 'hook_curl_left', 'hook_curl_right',
      ], blitz);
    case CoverageScheme.Cover6:
      return applyBlitz([
        'deep_half_left', 'deep_third_right', 'deep_half_right',
        'flat_left', 'flat_right', 'hook_curl_left', 'seam_right',
      ], blitz);
    default:
      return rolesForScheme(CoverageScheme.Cover3, blitz);
  }
}

function applyBlitz(roles: DefenderRole[], blitz: BlitzPackage): DefenderRole[] {
  if (blitz === 'none') return roles;

  const result = [...roles];

  if (blitz === 'zone_blitz') {
    // Swap: a zone defender becomes blitzer, last blitzer-capable slot drops into coverage
    const zoneIdx = result.findIndex(r =>
      r === 'hook_curl_left' || r === 'hook_curl_right' || r === 'flat_left' || r === 'flat_right',
    );
    if (zoneIdx !== -1) {
      const originalRole = result[zoneIdx];
      result[zoneIdx] = 'blitzer';
      // Find a man or deep defender to replace the vacated zone
      const deepIdx = result.findIndex(r => r === 'man_coverage' || r === 'spy');
      if (deepIdx !== -1) result[deepIdx] = originalRole;
    }
    return result;
  }

  if (blitz === 'delayed') {
    // Mark last non-blitzer as blitzer (will use delay timer)
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i] !== 'blitzer') {
        result[i] = 'blitzer';
        break;
      }
    }
    return result;
  }

  // Standard blitz: convert one defender to blitzer
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i] !== 'blitzer' && result[i] !== 'deep_third_mid') {
      result[i] = 'blitzer';
      break;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Blitz gap targets (relative to LOS center)
// ---------------------------------------------------------------------------

function blitzTarget(pkg: BlitzPackage, los: number): Vector3 {
  switch (pkg) {
    case 'a_gap_left': return new Vector3(-1.5, 0, los - 2);
    case 'a_gap_right': return new Vector3(1.5, 0, los - 2);
    case 'b_gap_left': return new Vector3(-4, 0, los - 2);
    case 'b_gap_right': return new Vector3(4, 0, los - 2);
    case 'edge_left': return new Vector3(-8, 0, los - 1);
    case 'edge_right': return new Vector3(8, 0, los - 1);
    case 'delayed': return new Vector3(0, 0, los - 2);
    case 'zone_blitz': return new Vector3(0, 0, los - 2);
    default: return new Vector3(0, 0, los);
  }
}

// ---------------------------------------------------------------------------
// AISystem
// ---------------------------------------------------------------------------

export class AISystem {
  private steering: SteeringBehaviors;
  private defenders: Map<string, DefenderState> = new Map();
  private scheme: CoverageScheme = CoverageScheme.Cover3;
  private blitzPackage: BlitzPackage = 'none';
  private lineOfScrimmage: number = 0;
  private zones: Record<string, ZoneDefinition> = {};

  // Read-react state
  private qbEyeDirection: Vector3 = Vector3.Forward();
  private isPlayAction: boolean = false;
  private playElapsed: number = 0;

  /** Route recognition delay in seconds */
  private static readonly ROUTE_BREAK_DELAY = 0.5;

  constructor() {
    this.steering = new SteeringBehaviors(
      { pursuitLookAhead: 0.6, separationRadius: 2.5, arrivalRadius: 4, coverageAggressiveness: 0.8 },
      { pursuit: 1.2, interpose: 0.9, seek: 1.0, separation: 0.4, arrival: 0.7, flee: 0.0 },
    );
  }

  // -----------------------------------------------------------------------
  // Setup
  // -----------------------------------------------------------------------

  /** Register a defender agent with the system */
  public addDefender(
    agent: SteeringAgent,
    role: DefenderRole = 'hook_curl_left',
    attributes?: Partial<CoverageAttributes>,
  ): void {
    const baseAttrs = defaultAttributes(role);
    const state: DefenderState = {
      agent,
      role,
      attributes: { ...baseAttrs, ...attributes },
      manAssignmentId: null,
      zone: null,
      reactionTimer: 0,
      routeRecognitionTimer: 0,
      hasRecognizedRoute: false,
      blitzPackage: 'none',
      blitzDelayTimer: 0,
      isBlitzing: false,
      pursuitAngle: null,
      containSide: null,
    };
    this.defenders.set(agent.id, state);
  }

  /** Remove a defender */
  public removeDefender(id: string): void {
    this.defenders.delete(id);
  }

  /** Set line of scrimmage and rebuild zones */
  public setLineOfScrimmage(los: number): void {
    this.lineOfScrimmage = los;
    this.zones = buildZoneTemplates(los);
  }

  /** Apply a coverage scheme. Distributes roles across registered defenders. */
  public setScheme(scheme: CoverageScheme, blitz: BlitzPackage = 'none'): void {
    this.scheme = scheme;
    this.blitzPackage = blitz;

    const roles = rolesForScheme(scheme, blitz);
    const defenderIds = Array.from(this.defenders.keys());

    for (let i = 0; i < defenderIds.length; i++) {
      const state = this.defenders.get(defenderIds[i])!;
      const role = roles[i % roles.length];
      state.role = role;
      state.attributes = { ...defaultAttributes(role), ...state.attributes };
      state.isBlitzing = role === 'blitzer';
      state.blitzPackage = role === 'blitzer' ? blitz : 'none';
      state.blitzDelayTimer = blitz === 'delayed' && role === 'blitzer' ? 0.8 + Math.random() * 0.4 : 0;

      // Assign zone
      if (this.zones[role]) {
        state.zone = this.zones[role];
      } else {
        state.zone = null;
      }

      // Contain assignments for edge rushers
      if (role === 'contain_left') state.containSide = 'left';
      else if (role === 'contain_right') state.containSide = 'right';
      else state.containSide = null;
    }
  }

  /** Assign a specific defender to man-cover a receiver */
  public assignManCoverage(defenderId: string, receiverId: string): void {
    const state = this.defenders.get(defenderId);
    if (!state) return;
    state.role = 'man_coverage';
    state.manAssignmentId = receiverId;
    state.zone = null;
  }

  // -----------------------------------------------------------------------
  // Read-React Inputs
  // -----------------------------------------------------------------------

  /** Feed QB eye direction so defenders can read it */
  public setQBEyeDirection(dir: Vector3): void {
    this.qbEyeDirection = dir.normalize();
  }

  /** Flag play-action so defenders can recognize it */
  public setPlayAction(active: boolean): void {
    this.isPlayAction = active;
  }

  // -----------------------------------------------------------------------
  // Main Update
  // -----------------------------------------------------------------------

  /**
   * Tick every frame.
   *
   * @param dt - Delta time in seconds
   * @param ballCarrierPos - Position of the ball carrier (null pre-throw)
   * @param ballCarrierVel - Velocity of the ball carrier
   * @param ballPos - Current ball position
   * @param receiverPositions - Map of receiver ID -> position
   * @param receiverVelocities - Map of receiver ID -> velocity
   */
  public update(
    dt: number,
    ballCarrierPos: Vector3 | null,
    ballCarrierVel: Vector3 | null,
    ballPos: Vector3 | null,
    receiverPositions: Map<string, Vector3>,
    receiverVelocities: Map<string, Vector3>,
  ): void {
    this.playElapsed += dt;
    const allAgents = this.getAllAgents();

    for (const [, state] of this.defenders) {
      // Tick timers
      state.reactionTimer = Math.max(0, state.reactionTimer - dt);
      if (state.reactionTimer > 0) continue; // Still reacting

      // Route recognition timer
      if (!state.hasRecognizedRoute) {
        state.routeRecognitionTimer += dt;
        if (state.routeRecognitionTimer >= AISystem.ROUTE_BREAK_DELAY) {
          state.hasRecognizedRoute = true;
        }
      }

      // Delayed blitz timer
      if (state.blitzDelayTimer > 0) {
        state.blitzDelayTimer -= dt;
        // While waiting, play zone
        this.updateZoneCoverage(state, dt, receiverPositions, ballPos, allAgents);
        continue;
      }

      // Determine behavior
      if (state.isBlitzing) {
        this.updateBlitzer(state, dt, ballCarrierPos, ballCarrierVel, allAgents);
      } else if (ballCarrierPos) {
        this.updatePursuit(state, dt, ballCarrierPos, ballCarrierVel, allAgents);
      } else if (state.role === 'man_coverage') {
        this.updateManCoverage(state, dt, receiverPositions, receiverVelocities, ballPos, allAgents);
      } else if (state.role === 'spy') {
        this.updateSpy(state, dt, ballCarrierPos, ballCarrierVel, ballPos, allAgents);
      } else if (state.containSide) {
        this.updateContain(state, dt, ballCarrierPos, ballPos, allAgents);
      } else {
        this.updateZoneCoverage(state, dt, receiverPositions, ballPos, allAgents);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Behavior Implementations
  // -----------------------------------------------------------------------

  private updateZoneCoverage(
    state: DefenderState,
    dt: number,
    receiverPositions: Map<string, Vector3>,
    ballPos: Vector3 | null,
    allAgents: SteeringAgent[],
  ): void {
    if (!state.zone) {
      // No zone assigned, hold position
      this.steering.applySteeringForce(state.agent, Vector3.Zero(), dt);
      return;
    }

    // Check if any receiver is in this zone
    let closestInZone: { id: string; pos: Vector3; dist: number } | null = null;
    for (const [id, pos] of receiverPositions) {
      if (isInsideZone(pos, state.zone)) {
        const dist = Vector3.Distance(state.agent.position, pos);
        if (!closestInZone || dist < closestInZone.dist) {
          closestInZone = { id, pos, dist };
        }
      }
    }

    let force: Vector3;
    if (closestInZone && state.hasRecognizedRoute) {
      // React to receiver in zone: interpose between ball and receiver
      if (ballPos) {
        force = this.steering.interpose(
          state.agent,
          { position: ballPos },
          { position: closestInZone.pos },
        );
      } else {
        force = this.steering.seek(state.agent, closestInZone.pos);
      }

      // Read QB eyes: if QB is looking this direction, close faster
      const toReceiver = closestInZone.pos.subtract(state.agent.position).normalize();
      const eyeAlignment = Vector3.Dot(this.qbEyeDirection, toReceiver);
      if (eyeAlignment > 0.6) {
        force.scaleInPlace(1.0 + state.attributes.coverageRating * 0.3);
      }
    } else {
      // No receiver in zone, settle at zone center
      const center = zoneCenter(state.zone);
      force = this.steering.arrival(state.agent, center);
    }

    // Separation
    const sep = this.steering.separation(state.agent, allAgents);
    force.addInPlace(sep.scale(0.4));

    this.applyWithRating(state, force, dt);
  }

  private updateManCoverage(
    state: DefenderState,
    dt: number,
    receiverPositions: Map<string, Vector3>,
    receiverVelocities: Map<string, Vector3>,
    ballPos: Vector3 | null,
    allAgents: SteeringAgent[],
  ): void {
    if (!state.manAssignmentId) {
      // No assignment, fall back to zone center
      this.steering.applySteeringForce(state.agent, Vector3.Zero(), dt);
      return;
    }

    const recPos = receiverPositions.get(state.manAssignmentId);
    if (!recPos) return;

    const recVel = receiverVelocities.get(state.manAssignmentId) || Vector3.Zero();

    // Press vs off coverage: press stays tight, off maintains cushion
    const isPress = this.scheme === CoverageScheme.ManPress || this.scheme === CoverageScheme.Cover0;
    const cushion = isPress ? 1.0 : 5.0;

    const toReceiver = recPos.subtract(state.agent.position);
    const dist = toReceiver.length();

    let force: Vector3;

    if (dist > cushion && !state.hasRecognizedRoute) {
      // Maintain cushion: arrival to a point between defender and receiver
      const cushionPoint = recPos.subtract(toReceiver.normalize().scale(cushion));
      force = this.steering.arrival(state.agent, cushionPoint);
    } else {
      // Shadow the receiver
      const target: SteeringTarget = { position: recPos, velocity: recVel };

      if (ballPos && state.hasRecognizedRoute) {
        // Route recognized, jump the route: interpose between ball and receiver
        force = this.steering.interpose(state.agent, { position: ballPos }, target);
        force.scaleInPlace(1.0 + state.attributes.coverageRating * 0.2);
      } else {
        // Mirror: pursuit on the receiver
        force = this.steering.pursuit(state.agent, target);
      }
    }

    // Separation
    const sep = this.steering.separation(state.agent, allAgents);
    force.addInPlace(sep.scale(0.3));

    this.applyWithRating(state, force, dt);
  }

  private updateBlitzer(
    state: DefenderState,
    dt: number,
    ballCarrierPos: Vector3 | null,
    ballCarrierVel: Vector3 | null,
    allAgents: SteeringAgent[],
  ): void {
    const target = ballCarrierPos
      ? ballCarrierPos
      : blitzTarget(state.blitzPackage, this.lineOfScrimmage);

    const vel = ballCarrierVel || Vector3.Zero();
    const blitzTarget_: SteeringTarget = { position: target, velocity: vel };

    const force = this.steering.pursuit(state.agent, blitzTarget_);
    // Blitzers get a speed boost
    force.scaleInPlace(1.15);

    const sep = this.steering.separation(state.agent, allAgents);
    force.addInPlace(sep.scale(0.2));

    this.steering.applySteeringForce(state.agent, force, dt);
  }

  private updatePursuit(
    state: DefenderState,
    dt: number,
    ballCarrierPos: Vector3,
    ballCarrierVel: Vector3 | null,
    allAgents: SteeringAgent[],
  ): void {
    const vel = ballCarrierVel || Vector3.Zero();

    // Contain assignment: force sideline
    if (state.containSide) {
      const containTarget = computeContainTarget(state.agent.position, ballCarrierPos, state.containSide);
      const force = this.steering.seek(state.agent, containTarget);
      const sep = this.steering.separation(state.agent, allAgents);
      force.addInPlace(sep.scale(0.3));
      this.applyWithRating(state, force, dt);
      return;
    }

    // Angle-based pursuit
    const interceptPoint = computePursuitAngle(
      state.agent.position,
      ballCarrierPos,
      vel,
      state.agent.maxSpeed * state.attributes.closingSpeedMultiplier,
    );

    state.pursuitAngle = interceptPoint.clone();
    const force = this.steering.seek(state.agent, interceptPoint);

    // Play-action recognition: if play-action is detected, defenders hesitate
    if (this.isPlayAction && this.playElapsed < 1.0) {
      force.scaleInPlace(0.5); // Half-speed commitment during play-action read
    }

    const sep = this.steering.separation(state.agent, allAgents);
    force.addInPlace(sep.scale(0.3));

    this.applyWithRating(state, force, dt);
  }

  private updateSpy(
    state: DefenderState,
    dt: number,
    ballCarrierPos: Vector3 | null,
    ballCarrierVel: Vector3 | null,
    ballPos: Vector3 | null,
    allAgents: SteeringAgent[],
  ): void {
    // Spy mirrors QB laterally, stays at LOS depth
    const targetX = ballPos ? ballPos.x : 0;
    const spyPos = new Vector3(targetX, 0, this.lineOfScrimmage + 3);

    let force: Vector3;
    if (ballCarrierPos) {
      // QB scramble detected: pursue
      const target: SteeringTarget = {
        position: ballCarrierPos,
        velocity: ballCarrierVel || undefined,
      };
      force = this.steering.pursuit(state.agent, target);
    } else {
      force = this.steering.arrival(state.agent, spyPos);
    }

    const sep = this.steering.separation(state.agent, allAgents);
    force.addInPlace(sep.scale(0.3));
    this.applyWithRating(state, force, dt);
  }

  private updateContain(
    state: DefenderState,
    dt: number,
    ballCarrierPos: Vector3 | null,
    ballPos: Vector3 | null,
    allAgents: SteeringAgent[],
  ): void {
    const referencePos = ballCarrierPos || ballPos || new Vector3(0, 0, this.lineOfScrimmage);
    const containTarget = computeContainTarget(
      state.agent.position,
      referencePos,
      state.containSide!,
    );

    const force = this.steering.seek(state.agent, containTarget);
    const sep = this.steering.separation(state.agent, allAgents);
    force.addInPlace(sep.scale(0.3));
    this.applyWithRating(state, force, dt);
  }

  // -----------------------------------------------------------------------
  // Coverage Probability
  // -----------------------------------------------------------------------

  /** Apply steering force modulated by coverage rating (closing speed) */
  private applyWithRating(state: DefenderState, force: Vector3, dt: number): void {
    // Coverage rating affects effective closing speed
    const speedMod = 0.85 + state.attributes.coverageRating * 0.3; // 0.85-1.15 range
    const modulated = force.scale(speedMod);
    this.steering.applySteeringForce(state.agent, modulated, dt);
  }

  // -----------------------------------------------------------------------
  // Public Queries
  // -----------------------------------------------------------------------

  /** Trigger reaction delay on all defenders (snap, pass thrown, etc.) */
  public triggerReaction(overrideDelay?: number): void {
    for (const [, state] of this.defenders) {
      const delay = overrideDelay ?? state.attributes.baseReactionTime;
      // Modulate by coverage rating: better players react faster
      state.reactionTimer = delay * (1.3 - state.attributes.coverageRating * 0.5);
    }
    this.playElapsed = 0;
    // Reset route recognition
    for (const [, state] of this.defenders) {
      state.routeRecognitionTimer = 0;
      state.hasRecognizedRoute = false;
    }
  }

  /** Check if a specific defender can tackle the ball carrier */
  public canTackle(defenderId: string, targetPos: Vector3, tackleRadius: number = 1.5): boolean {
    const state = this.defenders.get(defenderId);
    if (!state) return false;
    const dist = Vector3.Distance(state.agent.position, targetPos);
    return dist <= tackleRadius;
  }

  /** Get the SteeringAgent for a defender */
  public getAgent(defenderId: string): SteeringAgent | null {
    return this.defenders.get(defenderId)?.agent ?? null;
  }

  /** Get all registered agents */
  public getAllAgents(): SteeringAgent[] {
    const agents: SteeringAgent[] = [];
    for (const [, state] of this.defenders) {
      agents.push(state.agent);
    }
    return agents;
  }

  /** Get defender count */
  public get defenderCount(): number {
    return this.defenders.size;
  }

  /** Get the current scheme */
  public get currentScheme(): CoverageScheme {
    return this.scheme;
  }

  /** Evaluate catch contest probability for a defender near a receiver */
  public contestCatchProbability(defenderId: string, receiverPos: Vector3): number {
    const state = this.defenders.get(defenderId);
    if (!state) return 0;

    const dist = Vector3.Distance(state.agent.position, receiverPos);
    if (dist > 3) return 0; // Too far to contest

    // Base probability scaled by distance (closer = better contest)
    const distanceFactor = 1 - dist / 3;
    return state.attributes.contestProbability * distanceFactor * state.attributes.coverageRating;
  }

  /** Reset the system between plays */
  public reset(): void {
    this.playElapsed = 0;
    this.isPlayAction = false;
    this.qbEyeDirection = Vector3.Forward();
    for (const [, state] of this.defenders) {
      state.reactionTimer = 0;
      state.routeRecognitionTimer = 0;
      state.hasRecognizedRoute = false;
      state.pursuitAngle = null;
      state.blitzDelayTimer = 0;
    }
  }
}
