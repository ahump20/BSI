/**
 * Physics System - Original Baseball Game
 * Handles ball physics, trajectories, and hit detection
 */

import { GameConfig } from '@/config/GameConfig';

export interface HitResult {
  type: 'homerun' | 'triple' | 'double' | 'single' | 'foul' | 'out';
  distance: number;
  angle: number;
}

export class PhysicsSystem {
  /**
   * Calculate hit result based on timing and pitch speed
   * @param timingOffset - Milliseconds from perfect timing (0 = perfect)
   * @param pitchSpeed - Speed of the incoming pitch
   * @returns Hit result with type and distance
   */
  static calculateHit(timingOffset: number, pitchSpeed: number): HitResult {
    const absOffset = Math.abs(timingOffset);

    // Perfect timing
    if (absOffset <= GameConfig.batting.perfectTimingMs) {
      const distance = 700 + Math.random() * 100;
      return {
        type: 'homerun',
        distance,
        angle: this.calculateAngle(timingOffset, 25, 35)
      };
    }

    // Good timing
    if (absOffset <= GameConfig.batting.goodTimingMs) {
      const distance = 400 + Math.random() * 200;
      const hitType = distance > 500 ? 'triple' : 'double';
      return {
        type: hitType,
        distance,
        angle: this.calculateAngle(timingOffset, 20, 40)
      };
    }

    // Early/late timing
    if (absOffset <= GameConfig.batting.earlyLateMs) {
      const distance = 200 + Math.random() * 150;
      return {
        type: 'single',
        distance,
        angle: this.calculateAngle(timingOffset, 15, 45)
      };
    }

    // Very early or very late - foul or out
    const isFoul = Math.random() > 0.5;
    return {
      type: isFoul ? 'foul' : 'out',
      distance: 100 + Math.random() * 100,
      angle: isFoul ? this.calculateAngle(timingOffset, -20, 70) : 10
    };
  }

  /**
   * Calculate launch angle based on timing
   */
  private static calculateAngle(
    timingOffset: number,
    minAngle: number,
    maxAngle: number
  ): number {
    // Early swing = higher angle, late swing = lower angle
    const normalized = Math.max(-1, Math.min(1, timingOffset / 200));
    return minAngle + ((maxAngle - minAngle) * (1 - normalized)) / 2;
  }

  /**
   * Calculate ball trajectory points for animation
   */
  static calculateTrajectory(
    startX: number,
    startY: number,
    distance: number,
    angle: number,
    steps: number = 30
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const angleRad = (angle * Math.PI) / 180;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + distance * t * Math.cos(angleRad);

      // Parabolic arc
      const h = 4 * t * (1 - t); // Peak at t=0.5
      const y = startY - h * distance * Math.sin(angleRad) * 0.5;

      points.push({ x, y });
    }

    return points;
  }

  /**
   * Check if ball is in strike zone
   */
  static isInStrikeZone(x: number, y: number, zoneRect: Phaser.Geom.Rectangle): boolean {
    return Phaser.Geom.Rectangle.Contains(zoneRect, x, y);
  }
}
