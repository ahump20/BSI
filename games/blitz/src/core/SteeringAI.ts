/**
 * Blaze Blitz Football - Steering AI
 *
 * Yuka.js-inspired steering behaviors for defender AI:
 * - Pursuit: Chase ball carrier with prediction
 * - Interpose: Get between receiver and ball
 * - Seek: Move directly toward target
 * - Flee: Move away from threat
 */

import { Vector3 } from '@babylonjs/core';

/** Agent state for AI calculations */
export interface SteeringAgent {
  id: string;
  position: Vector3;
  velocity: Vector3;
  maxSpeed: number;
  maxForce: number; // Max steering force
  mass: number;
  rotation: number; // Facing angle (radians)
}

/** Target for steering behaviors */
export interface SteeringTarget {
  position: Vector3;
  velocity?: Vector3;
}

/** Steering behavior weights */
export interface SteeringWeights {
  pursuit: number;
  interpose: number;
  seek: number;
  flee: number;
  separation: number; // Avoid clustering with teammates
  arrival: number; // Slow down when approaching target
}

const DEFAULT_WEIGHTS: SteeringWeights = {
  pursuit: 1.0,
  interpose: 0.8,
  seek: 1.0,
  flee: 1.0,
  separation: 0.5,
  arrival: 0.6,
};

/** Football-specific AI configuration */
export interface DefenderAIConfig {
  pursuitLookAhead: number; // How far ahead to predict (seconds)
  interposeRatio: number; // Position between ball and receiver (0-1)
  separationRadius: number; // Min distance from teammates
  arrivalRadius: number; // Start slowing when this close
  reactionTime: number; // Delay before reacting (seconds)
  coverageAggressiveness: number; // How tight to cover (0-1)
}

const DEFAULT_AI_CONFIG: DefenderAIConfig = {
  pursuitLookAhead: 0.5,
  interposeRatio: 0.6,
  separationRadius: 3,
  arrivalRadius: 5,
  reactionTime: 0.15,
  coverageAggressiveness: 0.7,
};

/** Steering behavior calculator */
export class SteeringBehaviors {
  private config: DefenderAIConfig;
  private weights: SteeringWeights;

  constructor(config: Partial<DefenderAIConfig> = {}, weights: Partial<SteeringWeights> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * SEEK - Move directly toward a target position
   * Basic steering: desired velocity - current velocity
   */
  public seek(agent: SteeringAgent, targetPos: Vector3): Vector3 {
    const desired = targetPos.subtract(agent.position).normalize().scale(agent.maxSpeed);
    const steering = desired.subtract(agent.velocity);
    return this.truncate(steering, agent.maxForce);
  }

  /**
   * FLEE - Move directly away from a position
   */
  public flee(agent: SteeringAgent, threatPos: Vector3): Vector3 {
    const desired = agent.position.subtract(threatPos).normalize().scale(agent.maxSpeed);
    const steering = desired.subtract(agent.velocity);
    return this.truncate(steering, agent.maxForce);
  }

  /**
   * PURSUIT - Chase a moving target with prediction
   * Predicts where target will be and seeks that point
   */
  public pursuit(agent: SteeringAgent, target: SteeringTarget): Vector3 {
    // Calculate distance to target
    const toTarget = target.position.subtract(agent.position);
    const distance = toTarget.length();

    // Determine look-ahead time based on distance
    const speed = agent.velocity.length();
    const lookAhead =
      speed > 0
        ? Math.min(distance / speed, this.config.pursuitLookAhead * 2)
        : this.config.pursuitLookAhead;

    // Predict future position
    const futurePos = target.position.clone();
    if (target.velocity) {
      futurePos.addInPlace(target.velocity.scale(lookAhead));
    }

    // Seek the predicted position
    return this.seek(agent, futurePos);
  }

  /**
   * INTERPOSE - Position between two targets (e.g., ball and receiver)
   * Used for coverage - get between QB and receiver
   */
  public interpose(
    agent: SteeringAgent,
    targetA: SteeringTarget, // Ball/QB
    targetB: SteeringTarget // Receiver
  ): Vector3 {
    // Calculate midpoint weighted by interpose ratio
    const midpoint = targetA.position
      .scale(1 - this.config.interposeRatio)
      .add(targetB.position.scale(this.config.interposeRatio));

    // Seek the interpose point
    return this.seek(agent, midpoint);
  }

  /**
   * SEPARATION - Avoid clustering with teammates
   * Keeps defenders spread out for better coverage
   */
  public separation(agent: SteeringAgent, neighbors: SteeringAgent[]): Vector3 {
    const steering = Vector3.Zero();

    for (const neighbor of neighbors) {
      if (neighbor.id === agent.id) continue;

      const toAgent = agent.position.subtract(neighbor.position);
      const distance = toAgent.length();

      if (distance > 0 && distance < this.config.separationRadius) {
        // Weight by inverse distance (closer = stronger repulsion)
        const force = toAgent.normalize().scale(this.config.separationRadius / distance);
        steering.addInPlace(force);
      }
    }

    if (steering.length() > 0) {
      steering.normalize().scaleInPlace(agent.maxSpeed);
      steering.subtractInPlace(agent.velocity);
      return this.truncate(steering, agent.maxForce);
    }

    return Vector3.Zero();
  }

  /**
   * ARRIVAL - Slow down when approaching target
   * Prevents overshooting the target position
   */
  public arrival(agent: SteeringAgent, targetPos: Vector3): Vector3 {
    const toTarget = targetPos.subtract(agent.position);
    const distance = toTarget.length();

    if (distance < 0.1) return Vector3.Zero();

    // Calculate desired speed based on distance
    let desiredSpeed: number;
    if (distance <= this.config.arrivalRadius) {
      // Slow down as we approach
      desiredSpeed = agent.maxSpeed * (distance / this.config.arrivalRadius);
    } else {
      desiredSpeed = agent.maxSpeed;
    }

    const desired = toTarget.normalize().scale(desiredSpeed);
    const steering = desired.subtract(agent.velocity);
    return this.truncate(steering, agent.maxForce);
  }

  /**
   * Calculate combined steering force for a defender
   */
  public calculateDefenderSteering(
    agent: SteeringAgent,
    ballCarrier: SteeringTarget | null,
    assignment: SteeringTarget | null, // Man coverage assignment
    teammates: SteeringAgent[],
    ballPosition: Vector3 | null
  ): Vector3 {
    const steering = Vector3.Zero();

    // If ball carrier exists, pursue them
    if (ballCarrier) {
      const pursuitForce = this.pursuit(agent, ballCarrier);
      steering.addInPlace(pursuitForce.scale(this.weights.pursuit));
    }
    // If we have a coverage assignment (man or zone), cover them
    else if (assignment && ballPosition) {
      // Interpose between ball and receiver
      const interposeForce = this.interpose(agent, { position: ballPosition }, assignment);
      steering.addInPlace(interposeForce.scale(this.weights.interpose));
    }
    // Default: return to zone position
    else if (assignment) {
      const seekForce = this.arrival(agent, assignment.position);
      steering.addInPlace(seekForce.scale(this.weights.seek));
    }

    // Always add separation from teammates
    const separationForce = this.separation(agent, teammates);
    steering.addInPlace(separationForce.scale(this.weights.separation));

    return this.truncate(steering, agent.maxForce);
  }

  /**
   * Apply steering force to agent and update position
   */
  public applySteeringForce(agent: SteeringAgent, force: Vector3, deltaTime: number): void {
    // F = ma, so a = F/m
    const acceleration = force.scale(1 / agent.mass);

    // Update velocity
    agent.velocity.addInPlace(acceleration.scale(deltaTime));

    // Clamp to max speed
    if (agent.velocity.length() > agent.maxSpeed) {
      agent.velocity.normalize().scaleInPlace(agent.maxSpeed);
    }

    // Update position
    agent.position.addInPlace(agent.velocity.scale(deltaTime));

    // Update rotation to face movement direction
    if (agent.velocity.length() > 0.1) {
      agent.rotation = Math.atan2(agent.velocity.x, agent.velocity.z);
    }
  }

  /** Truncate vector to max length */
  private truncate(vector: Vector3, maxLength: number): Vector3 {
    if (vector.length() > maxLength) {
      return vector.normalize().scale(maxLength);
    }
    return vector;
  }

  /** Update configuration */
  public updateConfig(config: Partial<DefenderAIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Update weights */
  public updateWeights(weights: Partial<SteeringWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }
}

/**
 * Defender AI Controller
 * High-level AI that uses steering behaviors
 */
export class DefenderAI {
  private steering: SteeringBehaviors;
  private agent: SteeringAgent;
  private reactionTimer: number = 0;
  private coverageType: 'man' | 'zone' = 'zone';
  private zonePosition: Vector3 | null = null;
  private manAssignment: string | null = null;

  constructor(agent: SteeringAgent, config?: Partial<DefenderAIConfig>) {
    this.agent = agent;
    this.steering = new SteeringBehaviors(config);
  }

  /** Set zone coverage position */
  public setZoneCoverage(position: Vector3): void {
    this.coverageType = 'zone';
    this.zonePosition = position.clone();
    this.manAssignment = null;
  }

  /** Set man coverage assignment */
  public setManCoverage(receiverId: string): void {
    this.coverageType = 'man';
    this.manAssignment = receiverId;
    this.zonePosition = null;
  }

  /** Update defender AI */
  public update(
    deltaTime: number,
    ballCarrierPosition: Vector3 | null,
    ballCarrierVelocity: Vector3 | null,
    receiverPositions: Map<string, Vector3>,
    ballPosition: Vector3 | null,
    teammates: SteeringAgent[]
  ): void {
    // Add reaction delay
    this.reactionTimer -= deltaTime;
    if (this.reactionTimer > 0) return;

    let assignment: SteeringTarget | null = null;

    // Determine assignment target
    if (this.coverageType === 'man' && this.manAssignment) {
      const receiverPos = receiverPositions.get(this.manAssignment);
      if (receiverPos) {
        assignment = { position: receiverPos };
      }
    } else if (this.coverageType === 'zone' && this.zonePosition) {
      assignment = { position: this.zonePosition };
    }

    // Create ball carrier target if exists
    let ballCarrier: SteeringTarget | null = null;
    if (ballCarrierPosition) {
      ballCarrier = {
        position: ballCarrierPosition,
        velocity: ballCarrierVelocity || undefined,
      };
    }

    // Calculate steering force
    const steeringForce = this.steering.calculateDefenderSteering(
      this.agent,
      ballCarrier,
      assignment,
      teammates,
      ballPosition
    );

    // Apply force to agent
    this.steering.applySteeringForce(this.agent, steeringForce, deltaTime);
  }

  /** Trigger reaction delay (e.g., when ball is snapped) */
  public triggerReaction(delay: number = 0.15): void {
    this.reactionTimer = delay;
  }

  /** Get agent data */
  public getAgent(): SteeringAgent {
    return this.agent;
  }

  /** Update agent position (for syncing with game state) */
  public setPosition(position: Vector3): void {
    this.agent.position = position.clone();
  }

  /** Check if defender can make a tackle (within range) */
  public canTackle(targetPosition: Vector3, tackleRadius: number = 1.5): boolean {
    const distance = Vector3.Distance(this.agent.position, targetPosition);
    return distance <= tackleRadius;
  }
}
