/**
 * GameLoop.ts
 * Main update loop with delta time handling
 * Coordinates physics, AI, rendering, and game logic
 */

import * as BABYLON from '@babylonjs/core';

type UpdateCallback = (deltaTime: number) => void;

export class GameLoop {
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private updateCallbacks: UpdateCallback[] = [];
  private lastTime = 0;
  private isRunning = false;
  
  // Fixed timestep for physics stability
  private readonly fixedDeltaTime = 1 / 60;
  private accumulator = 0;

  constructor(engine: BABYLON.Engine, scene: BABYLON.Scene) {
    this.engine = engine;
    this.scene = scene;
  }

  /** Add an update callback to be called each frame */
  addUpdateCallback(callback: UpdateCallback): void {
    this.updateCallbacks.push(callback);
  }

  /** Remove an update callback */
  removeUpdateCallback(callback: UpdateCallback): void {
    const idx = this.updateCallbacks.indexOf(callback);
    if (idx !== -1) {
      this.updateCallbacks.splice(idx, 1);
    }
  }

  /** Start the game loop */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    
    this.engine.runRenderLoop(() => {
      this.tick();
    });
  }

  /** Stop the game loop */
  stop(): void {
    this.isRunning = false;
    this.engine.stopRenderLoop();
  }

  /** Main tick function */
  private tick(): void {
    const currentTime = performance.now();
    const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;
    
    // Fixed timestep accumulator for consistent physics
    this.accumulator += frameTime;
    
    while (this.accumulator >= this.fixedDeltaTime) {
      // Run all update callbacks with fixed delta
      for (const callback of this.updateCallbacks) {
        callback(this.fixedDeltaTime);
      }
      this.accumulator -= this.fixedDeltaTime;
    }
    
    // Render the scene
    this.scene.render();
  }

  /** Get the Babylon scene */
  getScene(): BABYLON.Scene {
    return this.scene;
  }

  /** Get the Babylon engine */
  getEngine(): BABYLON.Engine {
    return this.engine;
  }
}
