/**
 * main.ts
 * Entry point for Blaze Blitz arcade football
 * Initializes Babylon.js, creates game systems, starts loop
 */

import * as BABYLON from '@babylonjs/core';
import { GameLoop } from './game/GameLoop';
import { Field } from './game/Field';
import { PlayerController } from './game/PlayerController';
import { SteeringAI } from './game/SteeringAI';
import { GameManager } from './game/GameManager';
import { PHYSICS_CONFIG, Play } from './game/types';

class BlazeBlitz {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private gameLoop: GameLoop;
  private field: Field;
  private controller: PlayerController;
  private ai: SteeringAI;
  private manager: GameManager;
  
  // Player meshes
  private playerMeshes: Map<string, BABYLON.Mesh> = new Map();
  private ballMesh: BABYLON.Mesh | null = null;
  private controlledPlayerId = 'qb';

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    this.scene = this.createScene();
    this.gameLoop = new GameLoop(this.engine, this.scene);
    this.field = new Field(this.scene);
    this.controller = new PlayerController(this.canvas);
    this.ai = new SteeringAI();
    this.manager = new GameManager();
    
    this.init();
  }

  private createScene(): BABYLON.Scene {
    const scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.08, 1);
    
    // Camera - TV broadcast style, elevated behind offense
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 4,
      50,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(this.canvas, false);
    camera.lowerRadiusLimit = 30;
    camera.upperRadiusLimit = 70;
    
    // Lighting
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.7;
    
    const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-1, -2, -1), scene);
    dir.intensity = 0.5;
    
    // Stadium lights glow effect
    const glow = new BABYLON.GlowLayer('glow', scene);
    glow.intensity = 0.5;
    
    return scene;
  }

  private async init(): Promise<void> {
    // Create players
    this.createPlayers();
    
    // Create ball
    this.createBall();
    
    // Setup play selection UI
    this.setupPlaySelection();
    
    // Setup game callbacks
    this.setupCallbacks();
    
    // Add update callback
    this.gameLoop.addUpdateCallback((dt) => this.update(dt));
    
    // Handle resize
    window.addEventListener('resize', () => this.engine.resize());

    // Hide loading screen and start
    setTimeout(() => {
      const loading = document.getElementById('loading-screen');
      if (loading) loading.classList.add('hidden');
      
      this.gameLoop.start();
      this.manager.startGame();
    }, 1500);
  }

  private createPlayers(): void {
    // Home team (Blaze - orange)
    const homePositions = [
      { id: 'qb', x: 0, z: -5, role: 'qb' },
      { id: 'wr1', x: -8, z: -3, role: 'wr' },
      { id: 'wr2', x: 8, z: -3, role: 'wr' },
      { id: 'wr3', x: -4, z: -2, role: 'wr' },
      { id: 'rb', x: 0, z: -8, role: 'rb' },
      { id: 'ol1', x: -2, z: -3, role: 'ol' },
      { id: 'ol2', x: 2, z: -3, role: 'ol' }
    ];
    
    // Away team (Wolves - gray)
    const awayPositions = [
      { id: 'dl1', x: -2, z: 0, role: 'dl' },
      { id: 'dl2', x: 2, z: 0, role: 'dl' },
      { id: 'lb1', x: -4, z: 3, role: 'lb' },
      { id: 'lb2', x: 0, z: 4, role: 'lb' },
      { id: 'lb3', x: 4, z: 3, role: 'lb' },
      { id: 'db1', x: -8, z: 8, role: 'db' },
      { id: 'db2', x: 8, z: 8, role: 'db' }
    ];
    
    // Create home team meshes
    for (const p of homePositions) {
      const mesh = this.createPlayerMesh(p.id, true);
      mesh.position.set(p.x, 0.75, p.z);
      this.playerMeshes.set(p.id, mesh);
      this.ai.createAgent(p.id, { x: p.x, y: 0, z: p.z }, PHYSICS_CONFIG.maxSpeed);
    }
    
    // Create away team meshes
    for (const p of awayPositions) {
      const mesh = this.createPlayerMesh(p.id, false);
      mesh.position.set(p.x, 0.75, p.z);
      this.playerMeshes.set(p.id, mesh);
      this.ai.createAgent(p.id, { x: p.x, y: 0, z: p.z }, PHYSICS_CONFIG.maxSpeed * 0.9);
    }
  }

  private createPlayerMesh(id: string, isHome: boolean): BABYLON.Mesh {
    // Capsule-style player (blocky low-poly per spec)
    const body = BABYLON.MeshBuilder.CreateCapsule(id, {
      height: 1.5,
      radius: 0.35
    }, this.scene);
    
    const material = new BABYLON.StandardMaterial(`mat_${id}`, this.scene);
    
    if (isHome) {
      // Blaze team - burnt orange
      material.diffuseColor = new BABYLON.Color3(0.75, 0.35, 0);
      material.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);
    } else {
      // Wolves team - steel gray
      material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
      material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.12);
    }
    
    body.material = material;
    return body;
  }

  private createBall(): void {
    // Football approximation (stretched sphere)
    this.ballMesh = BABYLON.MeshBuilder.CreateSphere('ball', {
      diameterX: 0.3,
      diameterY: 0.2,
      diameterZ: 0.5
    }, this.scene);
    
    const mat = new BABYLON.StandardMaterial('ballMat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1);
    this.ballMesh.material = mat;
    
    // Start at QB position
    this.ballMesh.position.set(0, 1.2, -5);
  }

  private setupPlaySelection(): void {
    const plays: Play[] = [
      { id: 'hb_dive', name: 'HB DIVE', icon: '🏈', type: 'run', routes: new Map() },
      { id: 'slant', name: 'SLANT', icon: '↗', type: 'pass', routes: new Map() },
      { id: 'streak', name: 'STREAK', icon: '↑', type: 'pass', routes: new Map() },
      { id: 'out', name: 'OUT', icon: '→', type: 'pass', routes: new Map() },
      { id: 'curl', name: 'CURL', icon: '↩', type: 'pass', routes: new Map() },
      { id: 'screen', name: 'SCREEN', icon: '⤵', type: 'pass', routes: new Map() },
      { id: 'hb_toss', name: 'HB TOSS', icon: '↖', type: 'run', routes: new Map() },
      { id: 'post', name: 'POST', icon: '⤴', type: 'pass', routes: new Map() },
      { id: 'hail_mary', name: 'HAIL MARY', icon: '🔥', type: 'pass', routes: new Map() }
    ];
    
    const grid = document.getElementById('play-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    for (const play of plays) {
      const card = document.createElement('div');
      card.className = 'play-card';
      card.innerHTML = `
        <div class="icon">${play.icon}</div>
        <div class="name">${play.name}</div>
      `;
      card.addEventListener('click', () => {
        this.manager.selectPlay(play);
        this.setupPlay(play);
      });
      grid.appendChild(card);
    }
  }

  private setupPlay(play: Play): void {
    // Reset positions and setup routes based on play
    // Simplified for prototype - full route logic would go here
    this.controller.resetStamina();
  }

  private setupCallbacks(): void {
    this.manager.setOnScoreChange((home, away) => {
      const homeEl = document.getElementById('home-score');
      const awayEl = document.getElementById('away-score');
      if (homeEl) homeEl.textContent = String(home);
      if (awayEl) awayEl.textContent = String(away);
    });
    
    this.manager.setOnDownChange((down, yards, pos) => {
      const downEl = document.getElementById('down-indicator');
      const posEl = document.getElementById('field-position');
      if (downEl) {
        const ordinal = ['1ST', '2ND', '3RD', '4TH'][down - 1] || '4TH';
        downEl.textContent = `${ordinal} & ${yards}`;
      }
      if (posEl) {
        const side = pos >= 0 ? 'OPP' : 'OWN';
        posEl.textContent = `${side} ${Math.abs(pos)}`;
      }
    });
  }

  private update(deltaTime: number): void {
    const phase = this.manager.getPhase();
    
    if (phase !== 'playing' && phase !== 'presnap') return;
    
    // Update player controller
    const { velocity, speed } = this.controller.update(deltaTime);
    const input = this.controller.getInput();
    
    // Move controlled player
    const controlled = this.playerMeshes.get(this.controlledPlayerId);
    if (controlled && (velocity.x !== 0 || velocity.z !== 0)) {
      controlled.position.x += velocity.x * deltaTime;
      controlled.position.z += velocity.z * deltaTime;
      
      // Face movement direction
      controlled.rotation.y = Math.atan2(velocity.x, velocity.z);
      
      // Sync AI position
      this.ai.syncPosition(this.controlledPlayerId, {
        x: controlled.position.x,
        y: 0,
        z: controlled.position.z
      });
    }
