/**
 * SteeringAI.ts
 * Yuka.js-based AI for defenders and receivers
 * 
 * Key behaviors:
 * - Pursuit: Defenders intercept ball carrier (not just chase)
 * - Flee: Ball carrier evades nearest defender
 * - Interpose: Safety positions between QB and receiver
 */

import * as YUKA from 'yuka';
import { PlayerState, Vec3 } from './types';

export class SteeringAI {
  private entityManager: YUKA.EntityManager;
  private vehicles: Map<string, YUKA.Vehicle> = new Map();
  private time: YUKA.Time;

  constructor() {
    this.entityManager = new YUKA.EntityManager();
    this.time = new YUKA.Time();
  }

  /**
   * Create a Yuka vehicle for an AI-controlled player
   */
  createAgent(id: string, position: Vec3, maxSpeed: number): YUKA.Vehicle {
    const vehicle = new YUKA.Vehicle();
    vehicle.position.set(position.x, 0, position.z);
    vehicle.maxSpeed = maxSpeed;
    vehicle.maxForce = 10;
    
    // Snappy turning for arcade feel
    vehicle.maxTurnRate = Math.PI * 2;
    
    this.vehicles.set(id, vehicle);
    this.entityManager.add(vehicle);
    
    return vehicle;
  }

  /**
   * Set defender to pursue the ball carrier
   * Uses PursuitBehavior which predicts where target will be
   */
  setPursuit(defenderId: string, targetId: string): void {
    const defender = this.vehicles.get(defenderId);
    const target = this.vehicles.get(targetId);
    
    if (!defender || !target) return;
    
    // Clear existing behaviors
    defender.steering.behaviors.length = 0;
    
    const pursuit = new YUKA.PursuitBehavior(target);
    pursuit.weight = 1.0;
    defender.steering.add(pursuit);
  }

  /**
   * Set player to flee from pursuer
   */
  setFlee(playerId: string, pursuerId: string): void {
    const player = this.vehicles.get(playerId);
    const pursuer = this.vehicles.get(pursuerId);
    
    if (!player || !pursuer) return;
    
    player.steering.behaviors.length = 0;
    
    const flee = new YUKA.FleeBehavior(pursuer.position);
    flee.weight = 1.0;
    player.steering.add(flee);
  }

  /**
   * Set safety to interpose between QB and receiver
   */
  setInterpose(safetyId: string, qbId: string, receiverId: string): void {
    const safety = this.vehicles.get(safetyId);
    const qb = this.vehicles.get(qbId);
    const receiver = this.vehicles.get(receiverId);
    
    if (!safety || !qb || !receiver) return;
    
    safety.steering.behaviors.length = 0;
    
    const interpose = new YUKA.InterposeBehavior(qb, receiver);
    interpose.weight = 1.0;
    safety.steering.add(interpose);
  }

  /**
   * Make receiver run a route (follow waypoints)
   */
  setRoute(receiverId: string, waypoints: Vec3[]): void {
    const receiver = this.vehicles.get(receiverId);
    if (!receiver) return;
    
    receiver.steering.behaviors.length = 0;
    
    const path = new YUKA.Path();
    for (const wp of waypoints) {
      path.add(new YUKA.Vector3(wp.x, 0, wp.z));
    }
    
    const followPath = new YUKA.FollowPathBehavior(path);
    followPath.weight = 1.0;
    receiver.steering.add(followPath);
  }

  /**
   * Make player seek a specific position
   */
  setSeek(playerId: string, target: Vec3): void {
    const player = this.vehicles.get(playerId);
    if (!player) return;
    
    player.steering.behaviors.length = 0;
    
    const seek = new YUKA.SeekBehavior(new YUKA.Vector3(target.x, 0, target.z));
    seek.weight = 1.0;
    player.steering.add(seek);
  }

  /**
   * Clear all behaviors (stop moving)
   */
  clearBehaviors(playerId: string): void {
    const player = this.vehicles.get(playerId);
    if (player) {
      player.steering.behaviors.length = 0;
      player.velocity.set(0, 0, 0);
    }
  }

  /**
   * Update all AI agents
   * Call once per frame
   */
  update(): Map<string, Vec3> {
    const delta = this.time.update().getDelta();
    this.entityManager.update(delta);
    
    // Return updated positions for all vehicles
    const positions = new Map<string, Vec3>();
    this.vehicles.forEach((vehicle, id) => {
      positions.set(id, {
        x: vehicle.position.x,
        y: 0,
        z: vehicle.position.z
      });
    });
    
    return positions;
  }

  /**
   * Sync a vehicle position from external source (e.g., player-controlled)
   */
  syncPosition(id: string, position: Vec3): void {
    const vehicle = this.vehicles.get(id);
    if (vehicle) {
      vehicle.position.set(position.x, 0, position.z);
    }
  }

  /**
   * Remove an agent
   */
  removeAgent(id: string): void {
    const vehicle = this.vehicles.get(id);
    if (vehicle) {
      this.entityManager.remove(vehicle);
      this.vehicles.delete(id);
    }
  }

  /**
   * Get vehicle rotation for facing direction
   */
  getRotation(id: string): number {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return 0;
    return Math.atan2(vehicle.velocity.x, vehicle.velocity.z);
  }
}
