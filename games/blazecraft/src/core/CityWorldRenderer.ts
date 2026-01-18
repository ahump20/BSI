/**
 * CityWorldRenderer - Pixi.js isometric city visualization
 *
 * Renders the 6-district floating island using 2D isometric projection.
 * Works without 3D assets - uses programmatic shapes and sprites.
 *
 * Features (2.1.0):
 * - Camera zoom (scroll wheel) and pan (WASD/arrows/drag)
 * - Building placement with ghost preview
 * - Grid-based construction system
 * - Interactive minimap navigation
 */

import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from 'pixi.js';

import type { BuildingKind, Tier, CityState, BuildingState } from './BuildingSystem';
import { BUILDING_CONFIGS, getTierProgress } from './BuildingSystem';
import { AgentSimulation, createAgentSimulation } from './AgentSimulation';
import type { AgentVisual } from './AgentSimulation';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CityWorldRendererConfig {
  container: HTMLElement | string;
  onDistrictClick?: (district: BuildingKind) => void;
  onDistrictHover?: (district: BuildingKind | null) => void;
  onBuildingPlaced?: (buildingKind: BuildingKind, gridX: number, gridY: number) => void;
  onBuildingDeleted?: (buildingKind: BuildingKind, gridX: number, gridY: number) => void;
  onCameraChange?: (x: number, y: number, zoom: number) => void;
  onAgentClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
  onReady?: () => void;
}

interface DistrictVisual {
  id: BuildingKind;
  container: Container;
  pad: Graphics;
  building: Container;
  label: Text;
  tier: Tier;
  isHovered: boolean;
  isSelected: boolean;
}

interface PlacedBuilding {
  id: string;
  kind: BuildingKind;
  gridX: number;
  gridY: number;
  container: Container;
}

export interface GridCell {
  x: number;
  y: number;
  occupied: boolean;
  buildingId?: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const COLORS = {
  burntOrange: 0xBF5700,
  texasSoil: 0x8B4513,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  ember: 0xFF6B35,
  cream: 0xF5F5DC,
  gold: 0xFFD700,
  forestGreen: 0x4A6741,
  stone: 0x666666,
  selection: 0xFFFFFF,
  ghostValid: 0x00FF00,
  ghostInvalid: 0xFF0000,
  gridLine: 0x333333,
};

const DISTRICT_COLORS: Record<BuildingKind, number> = {
  townhall: 0xFFD700,
  workshop: 0xBF5700,
  market: 0x2ECC71,
  barracks: 0xE74C3C,
  stables: 0x3498DB,
  library: 0x9B59B6,
};

// Isometric projection helpers
const ISO_ANGLE = Math.PI / 6; // 30 degrees
const ISO_SCALE = { x: 1.0, y: 0.5 }; // Horizontal squash for isometric

// District positions in isometric grid (relative to center)
// Spread out across larger 24x24 grid
const DISTRICT_POSITIONS: Record<BuildingKind, { x: number; y: number }> = {
  townhall: { x: 0, y: 0 },
  workshop: { x: -4, y: -2 },
  market: { x: 4, y: -2 },
  barracks: { x: 4, y: 3 },
  stables: { x: -4, y: 3 },
  library: { x: 0, y: 5 },
};

const TILE_SIZE = 64; // Base tile size in pixels
const GRID_SIZE = 24; // Grid is 24x24 tiles (expanded for more building space)

// Camera constraints
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.1;
const PAN_SPEED = 10;

// ─────────────────────────────────────────────────────────────
// CityWorldRenderer Class
// ─────────────────────────────────────────────────────────────

export class CityWorldRenderer {
  private app: Application;
  private containerEl: HTMLElement;
  private config: CityWorldRendererConfig;

  // Layers
  private worldLayer: Container;
  private gridLayer: Container;
  private islandLayer: Container;
  private buildingLayer: Container;
  private districtLayer: Container;
  private agentLayer: Container;  // C2: Agent layer between districts and labels
  private labelLayer: Container;
  private effectLayer: Container;
  private ghostLayer: Container;

  // Agent simulation (C1)
  private agentSimulation: AgentSimulation | null = null;

  // State
  private districts: Map<BuildingKind, DistrictVisual> = new Map();
  private placedBuildings: Map<string, PlacedBuilding> = new Map();
  private grid: GridCell[][] = [];
  private selectedDistrict: BuildingKind | null = null;
  private hoveredDistrict: BuildingKind | null = null;
  private cityState: CityState | null = null;

  // Camera state
  private cameraX = 0;
  private cameraY = 0;
  private zoom = 1.0;
  private rotation: 0 | 90 | 180 | 270 = 0; // Camera rotation in degrees
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastCameraX = 0;
  private lastCameraY = 0;

  // Placement state
  private placementMode: BuildingKind | null = null;
  private ghostBuilding: Container | null = null;

  // Phase 3: Smoke particle intervals
  private smokeIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private ghostGridX = 0;
  private ghostGridY = 0;
  private isValidPlacement = false;

  // Input state
  private keysPressed: Set<string> = new Set();
  private animationFrameId: number | null = null;

  // Phase 3: Day/Night Cycle (Step 24)
  private timeOfDay = 0.5; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
  private dayNightEnabled = true;
  private ambientOverlay: Graphics | null = null;

  // Phase 3: Weather Effects (Step 26)
  private weatherType: 'clear' | 'rain' | 'snow' = 'clear';
  private weatherParticles: Container | null = null;

  // ─────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────

  private constructor(
    app: Application,
    containerEl: HTMLElement,
    config: CityWorldRendererConfig
  ) {
    this.app = app;
    this.containerEl = containerEl;
    this.config = config;

    // Create layers (order matters for z-index)
    this.worldLayer = new Container();
    this.gridLayer = new Container();
    this.islandLayer = new Container();
    this.buildingLayer = new Container();
    this.districtLayer = new Container();
    this.agentLayer = new Container();  // C2: Agents render above districts
    this.labelLayer = new Container();
    this.effectLayer = new Container();
    this.ghostLayer = new Container();

    // Add layers in order
    this.worldLayer.addChild(this.gridLayer);
    this.worldLayer.addChild(this.islandLayer);
    this.worldLayer.addChild(this.buildingLayer);
    this.worldLayer.addChild(this.districtLayer);
    this.worldLayer.addChild(this.agentLayer);  // C2: Between districts and labels
    this.worldLayer.addChild(this.ghostLayer);
    this.worldLayer.addChild(this.labelLayer);
    this.worldLayer.addChild(this.effectLayer);
    this.app.stage.addChild(this.worldLayer);

    // C2: Initialize agent simulation
    this.agentSimulation = createAgentSimulation(this.agentLayer, {
      onAgentClick: config.onAgentClick,
      onAgentHover: config.onAgentHover,
    });

    // Initialize grid
    this.initializeGrid();

    // Center the world
    this.centerWorld();

    // Build the city
    this.buildGrid();
    this.buildIsland();
    this.buildDistricts();

    // A4: Force initial frame render immediately
    this.app.renderer.render(this.app.stage);

    // Setup input handlers
    this.setupInputHandlers();
    this.setupResizeHandler();

    // Start animation loop
    this.startAnimationLoop();

    // Phase 3: Add fog of war vignette (Step 29)
    this.createVignetteOverlay();
  }

  // Phase 3: Fog of War Vignette Effect (Step 29)
  private createVignetteOverlay(): void {
    const vignette = new Graphics();
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    // Create radial gradient vignette using concentric ellipses
    for (let i = 10; i >= 0; i--) {
      const ratio = i / 10;
      const radius = maxRadius * (0.6 + ratio * 0.4);
      const alpha = (1 - ratio) * 0.25; // Max 0.25 alpha at edges

      vignette.ellipse(centerX, centerY, radius, radius * 0.7);
      vignette.fill({ color: 0x000000, alpha });
    }

    // Store reference for resize handling
    (this as unknown as { vignetteOverlay: Graphics }).vignetteOverlay = vignette;
    this.app.stage.addChild(vignette);
  }

  /**
   * Factory method - async initialization required for PixiJS 8
   */
  public static async create(config: CityWorldRendererConfig): Promise<CityWorldRenderer> {
    const containerEl = typeof config.container === 'string'
      ? document.querySelector<HTMLElement>(config.container)
      : config.container;

    if (!containerEl) {
      throw new Error('Container element not found');
    }

    const app = new Application();
    await app.init({
      background: COLORS.midnight,
      resizeTo: containerEl,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerEl.appendChild(app.canvas);

    const renderer = new CityWorldRenderer(app, containerEl, config);
    config.onReady?.();

    return renderer;
  }

  // ─────────────────────────────────────────────────────────────
  // Grid System
  // ─────────────────────────────────────────────────────────────

  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        this.grid[y][x] = {
          x,
          y,
          occupied: false,
        };
      }
    }

    // Mark district positions as occupied
    for (const [id, pos] of Object.entries(DISTRICT_POSITIONS)) {
      const gridX = Math.floor(pos.x + GRID_SIZE / 2);
      const gridY = Math.floor(pos.y + GRID_SIZE / 2);
      if (this.isValidGridPosition(gridX, gridY)) {
        this.grid[gridY][gridX].occupied = true;
        this.grid[gridY][gridX].buildingId = id;
      }
    }
  }

  private isValidGridPosition(x: number, y: number): boolean {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
  }

  private isOnIsland(gridX: number, gridY: number): boolean {
    // Check if position is within the diamond-shaped island
    const centerX = GRID_SIZE / 2;
    const centerY = GRID_SIZE / 2;
    const dx = Math.abs(gridX - centerX);
    const dy = Math.abs(gridY - centerY);
    return (dx + dy) <= GRID_SIZE / 2;
  }

  private buildGrid(): void {
    const grid = new Graphics();
    grid.alpha = 0.3;

    // Draw isometric grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!this.isOnIsland(x, y)) continue;

        const screenPos = this.gridToScreen(x, y);
        const halfTile = TILE_SIZE / 2;
        const tileHeight = TILE_SIZE * ISO_SCALE.y;

        // Draw diamond tile outline
        grid.setStrokeStyle({ width: 1, color: COLORS.gridLine, alpha: 0.5 });
        grid.moveTo(screenPos.x, screenPos.y - tileHeight / 2);
        grid.lineTo(screenPos.x + halfTile, screenPos.y);
        grid.lineTo(screenPos.x, screenPos.y + tileHeight / 2);
        grid.lineTo(screenPos.x - halfTile, screenPos.y);
        grid.closePath();
        grid.stroke();
      }
    }

    this.gridLayer.addChild(grid);
  }

  private gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
    // Convert grid coordinates to isometric screen coordinates
    const offsetX = gridX - GRID_SIZE / 2;
    const offsetY = gridY - GRID_SIZE / 2;
    return {
      x: (offsetX - offsetY) * TILE_SIZE * 0.5,
      y: (offsetX + offsetY) * TILE_SIZE * ISO_SCALE.y * 0.5,
    };
  }

  private screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    // Convert screen coordinates to grid coordinates (inverse of gridToScreen)
    // Account for camera position and zoom
    const worldX = (screenX - this.app.screen.width / 2) / this.zoom - this.cameraX;
    const worldY = (screenY - this.app.screen.height / 2 + 50) / this.zoom - this.cameraY;

    // Inverse isometric projection
    const halfTile = TILE_SIZE * 0.5;
    const tileHeight = TILE_SIZE * ISO_SCALE.y;

    const gridX = Math.floor((worldX / halfTile + worldY / (tileHeight / 2)) / 2 + GRID_SIZE / 2);
    const gridY = Math.floor((worldY / (tileHeight / 2) - worldX / halfTile) / 2 + GRID_SIZE / 2);

    return { x: gridX, y: gridY };
  }

  // ─────────────────────────────────────────────────────────────
  // Camera Controls
  // ─────────────────────────────────────────────────────────────

  private centerWorld(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    this.updateCamera();
  }

  private updateCamera(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.worldLayer.x = width / 2 + this.cameraX * this.zoom;
    this.worldLayer.y = height / 2 - 50 + this.cameraY * this.zoom;
    this.worldLayer.scale.set(this.zoom);

    // Apply rotation (convert degrees to radians)
    this.worldLayer.rotation = (this.rotation * Math.PI) / 180;

    this.config.onCameraChange?.(this.cameraX, this.cameraY, this.zoom);
  }

  public setZoom(newZoom: number, centerX?: number, centerY?: number): void {
    const clampedZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));

    if (centerX !== undefined && centerY !== undefined) {
      // Zoom toward cursor position
      const worldX = (centerX - this.app.screen.width / 2) / this.zoom;
      const worldY = (centerY - this.app.screen.height / 2 + 50) / this.zoom;

      this.cameraX -= worldX * (clampedZoom / this.zoom - 1);
      this.cameraY -= worldY * (clampedZoom / this.zoom - 1);
    }

    this.zoom = clampedZoom;
    this.updateCamera();
  }

  public pan(dx: number, dy: number): void {
    this.cameraX += dx / this.zoom;
    this.cameraY += dy / this.zoom;
    this.updateCamera();
  }

  public panTo(worldX: number, worldY: number): void {
    this.cameraX = -worldX;
    this.cameraY = -worldY;
    this.updateCamera();
  }

  public panToBuilding(buildingKind: BuildingKind): void {
    const pos = DISTRICT_POSITIONS[buildingKind];
    if (!pos) return;
    const screenPos = this.gridToScreen(
      Math.floor(pos.x + GRID_SIZE / 2),
      Math.floor(pos.y + GRID_SIZE / 2)
    );
    this.panTo(screenPos.x, screenPos.y);
  }

  public getCamera(): { x: number; y: number; zoom: number; rotation: number } {
    return { x: this.cameraX, y: this.cameraY, zoom: this.zoom, rotation: this.rotation };
  }

  /**
   * Rotate camera by delta degrees (90 degree increments)
   */
  public rotateCamera(delta: number): void {
    const newRotation = (this.rotation + delta + 360) % 360;
    this.rotation = newRotation as 0 | 90 | 180 | 270;
    this.updateCamera();
  }

  /**
   * Set camera rotation to specific angle (0, 90, 180, 270)
   */
  public setRotation(angle: 0 | 90 | 180 | 270): void {
    this.rotation = angle;
    this.updateCamera();
  }

  public getRotation(): number {
    return this.rotation;
  }

  public getViewportBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfWidth = this.app.screen.width / 2 / this.zoom;
    const halfHeight = this.app.screen.height / 2 / this.zoom;
    return {
      minX: -this.cameraX - halfWidth,
      minY: -this.cameraY - halfHeight,
      maxX: -this.cameraX + halfWidth,
      maxY: -this.cameraY + halfHeight,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Input Handling
  // ─────────────────────────────────────────────────────────────

  private setupInputHandlers(): void {
    const canvas = this.app.canvas;

    // Mouse wheel for zoom
    canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Mouse drag for pan
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Click for placement
    canvas.addEventListener('click', this.handleClick.bind(this));

    // Keyboard for pan and shortcuts
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Make canvas focusable
    canvas.tabIndex = 0;
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    this.setZoom(this.zoom + delta, e.offsetX, e.offsetY);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse or shift+left for pan
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.lastCameraX = this.cameraX;
      this.lastCameraY = this.cameraY;
      this.containerEl.style.cursor = 'grabbing';
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.isDragging) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.cameraX = this.lastCameraX + dx / this.zoom;
      this.cameraY = this.lastCameraY + dy / this.zoom;
      this.updateCamera();
    } else if (this.placementMode) {
      // Update ghost building position
      this.updateGhostPosition(e.offsetX, e.offsetY);
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.containerEl.style.cursor = this.placementMode ? 'crosshair' : 'default';
    }
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDragging) return;

    if (this.placementMode && this.isValidPlacement) {
      // Place the building
      this.placeBuilding(this.placementMode, this.ghostGridX, this.ghostGridY);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keysPressed.add(e.key.toLowerCase());

    // Number keys for building selection (1-6)
    if (e.key >= '1' && e.key <= '6') {
      const buildingIndex = parseInt(e.key) - 1;
      const buildingKinds: BuildingKind[] = ['townhall', 'workshop', 'market', 'barracks', 'stables', 'library'];
      if (buildingIndex < buildingKinds.length) {
        this.setPlacementMode(buildingKinds[buildingIndex]);
      }
    }

    // Escape to cancel placement or deselect
    if (e.key === 'Escape') {
      if (this.placementMode) {
        this.setPlacementMode(null);
      } else if (this.selectedDistrict) {
        this.selectDistrict(null);
      }
    }

    // Delete to remove selected player-placed building
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedDistrict) {
      // Find if selected district is a player-placed building
      for (const [id, building] of this.placedBuildings) {
        if (building.kind === this.selectedDistrict) {
          // Clear grid cell
          this.grid[building.gridY][building.gridX].occupied = false;
          this.grid[building.gridY][building.gridX].buildingId = undefined;
          // Remove visual
          building.container.destroy();
          this.placedBuildings.delete(id);
          // Callback
          this.config.onBuildingDeleted?.(building.kind, building.gridX, building.gridY);
          this.selectDistrict(null);
          break;
        }
      }
    }

    // Q/E to rotate camera 90 degrees
    if (e.key === 'q' || e.key === 'Q') {
      this.rotateCamera(-90);
    }
    if (e.key === 'e' || e.key === 'E') {
      this.rotateCamera(90);
    }

    // R to rotate building preview (if in placement mode)
    if (e.key === 'r' || e.key === 'R') {
      // Future: rotate building preview
    }

    // Space to pause (emit event for parent to handle)
    if (e.key === ' ') {
      e.preventDefault();
    }

    // Zoom with +/- keys
    if (e.key === '+' || e.key === '=') {
      this.setZoom(this.zoom + ZOOM_STEP);
    }
    if (e.key === '-' || e.key === '_') {
      this.setZoom(this.zoom - ZOOM_STEP);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysPressed.delete(e.key.toLowerCase());
  }

  private startAnimationLoop(): void {
    const animate = () => {
      // Handle keyboard pan
      let panX = 0;
      let panY = 0;

      if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
        panY += PAN_SPEED;
      }
      if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
        panY -= PAN_SPEED;
      }
      if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
        panX += PAN_SPEED;
      }
      if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
        panX -= PAN_SPEED;
      }

      if (panX !== 0 || panY !== 0) {
        this.pan(panX, panY);
      }

      // C2: Update agent simulation
      this.agentSimulation?.update(1);

      // Phase 3: Update day/night cycle (Step 24)
      if (this.dayNightEnabled) {
        this.timeOfDay = (this.timeOfDay + 0.00002) % 1; // Full day cycle in ~14 minutes
        this.updateAmbientLighting();
      }

      // Phase 3: Update weather particles (Step 26)
      this.updateWeatherParticles();

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // Phase 3: Day/Night Cycle (Step 24)
  private updateAmbientLighting(): void {
    if (!this.ambientOverlay) {
      this.ambientOverlay = new Graphics();
      this.ambientOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
      this.app.stage.addChild(this.ambientOverlay);
    }

    // Calculate light based on time
    // 0 = midnight (dark), 0.25 = sunrise (orange), 0.5 = noon (no tint), 0.75 = sunset (orange)
    let alpha = 0;
    let color = 0x000033; // Default night color

    if (this.timeOfDay < 0.2) {
      // Night (midnight to pre-dawn)
      alpha = 0.3 - this.timeOfDay * 0.5;
      color = 0x000033;
    } else if (this.timeOfDay < 0.3) {
      // Sunrise
      const t = (this.timeOfDay - 0.2) / 0.1;
      alpha = 0.2 * (1 - t);
      color = this.lerpColor(0x000033, 0xFF6B35, t);
    } else if (this.timeOfDay < 0.7) {
      // Day
      alpha = 0;
    } else if (this.timeOfDay < 0.8) {
      // Sunset
      const t = (this.timeOfDay - 0.7) / 0.1;
      alpha = 0.15 * t;
      color = this.lerpColor(0xFFFFFF, 0xFF6B35, t);
    } else {
      // Night (post-sunset)
      const t = (this.timeOfDay - 0.8) / 0.2;
      alpha = 0.15 + t * 0.15;
      color = this.lerpColor(0xFF6B35, 0x000033, t);
    }

    this.ambientOverlay.clear();
    this.ambientOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.ambientOverlay.fill({ color, alpha });
  }

  private lerpColor(c1: number, c2: number, t: number): number {
    const r1 = (c1 >> 16) & 0xFF;
    const g1 = (c1 >> 8) & 0xFF;
    const b1 = c1 & 0xFF;
    const r2 = (c2 >> 16) & 0xFF;
    const g2 = (c2 >> 8) & 0xFF;
    const b2 = c2 & 0xFF;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return (r << 16) | (g << 8) | b;
  }

  // Phase 3: Weather Effects (Step 26)
  private updateWeatherParticles(): void {
    if (!this.weatherParticles) {
      this.weatherParticles = new Container();
      this.app.stage.addChild(this.weatherParticles);
    }

    if (this.weatherType === 'clear') return;

    // Spawn new particles occasionally
    if (Math.random() < 0.3) {
      const particle = new Graphics();
      const x = Math.random() * this.app.screen.width;

      if (this.weatherType === 'rain') {
        particle.moveTo(0, 0);
        particle.lineTo(2, 10);
        particle.stroke({ color: 0x6B9DC4, width: 1, alpha: 0.6 });
        particle.x = x;
        particle.y = -10;
        (particle as unknown as { vy: number }).vy = 15 + Math.random() * 5;
      } else if (this.weatherType === 'snow') {
        particle.circle(0, 0, 2 + Math.random() * 2);
        particle.fill({ color: 0xFFFFFF, alpha: 0.8 });
        particle.x = x;
        particle.y = -10;
        (particle as unknown as { vy: number; vx: number }).vy = 2 + Math.random() * 2;
        (particle as unknown as { vy: number; vx: number }).vx = (Math.random() - 0.5) * 2;
      }

      this.weatherParticles.addChild(particle);
    }

    // Update existing particles
    for (let i = this.weatherParticles.children.length - 1; i >= 0; i--) {
      const p = this.weatherParticles.children[i] as unknown as { x: number; y: number; vy: number; vx?: number };
      p.y += p.vy;
      if (p.vx) p.x += p.vx;

      if (p.y > this.app.screen.height + 20) {
        this.weatherParticles.removeChildAt(i);
      }
    }
  }

  public setWeather(type: 'clear' | 'rain' | 'snow'): void {
    this.weatherType = type;
    if (this.weatherParticles) {
      this.weatherParticles.removeChildren();
    }
  }

  public setDayNightEnabled(enabled: boolean): void {
    this.dayNightEnabled = enabled;
    if (!enabled && this.ambientOverlay) {
      this.ambientOverlay.clear();
    }
  }

  public setTimeOfDay(time: number): void {
    this.timeOfDay = Math.max(0, Math.min(1, time));
  }

  // ─────────────────────────────────────────────────────────────
  // Agent Management (C2)
  // ─────────────────────────────────────────────────────────────

  /**
   * Add an agent to the simulation
   */
  public addAgent(id: string, name: string, region: BuildingKind): void {
    this.agentSimulation?.addAgent(id, name, region);
  }

  /**
   * Remove an agent from the simulation
   */
  public removeAgent(id: string): void {
    this.agentSimulation?.removeAgent(id);
  }

  /**
   * Move an agent to a different district
   */
  public moveAgent(id: string, targetRegion: BuildingKind): void {
    this.agentSimulation?.moveAgent(id, targetRegion);
  }

  /**
   * Update an agent's region without animation
   */
  public updateAgentRegion(id: string, region: BuildingKind): void {
    this.agentSimulation?.updateAgentRegion(id, region);
  }

  /**
   * Set agent status
   */
  public setAgentStatus(id: string, status: 'idle' | 'moving' | 'working'): void {
    this.agentSimulation?.setAgentStatus(id, status);
  }

  /**
   * Get all current agent IDs
   */
  public getAgentIds(): string[] {
    return this.agentSimulation?.getAgentIds() ?? [];
  }

  // ─────────────────────────────────────────────────────────────
  // Building Placement
  // ─────────────────────────────────────────────────────────────

  public setPlacementMode(buildingKind: BuildingKind | null): void {
    this.placementMode = buildingKind;

    // Remove existing ghost
    if (this.ghostBuilding) {
      this.ghostLayer.removeChild(this.ghostBuilding);
      this.ghostBuilding = null;
    }

    if (buildingKind) {
      // Create ghost building
      this.ghostBuilding = new Container();
      this.ghostBuilding.alpha = 0.6;
      this.createGhostBuilding(buildingKind);
      this.ghostLayer.addChild(this.ghostBuilding);
      this.containerEl.style.cursor = 'crosshair';
    } else {
      this.containerEl.style.cursor = 'default';
    }
  }

  public getPlacementMode(): BuildingKind | null {
    return this.placementMode;
  }

  private createGhostBuilding(kind: BuildingKind): void {
    if (!this.ghostBuilding) return;

    const color = DISTRICT_COLORS[kind];
    const g = new Graphics();

    // Draw simplified building shape
    const baseWidth = 30;
    const baseDepth = 30;
    const height = 40;

    // Building box
    g.moveTo(-baseWidth / 2, 0);
    g.lineTo(-baseWidth / 2, -height);
    g.lineTo(0, -height - baseDepth * ISO_SCALE.y / 2);
    g.lineTo(0, -baseDepth * ISO_SCALE.y / 2);
    g.closePath();
    g.fill({ color, alpha: 0.6 });

    g.moveTo(baseWidth / 2, 0);
    g.lineTo(baseWidth / 2, -height);
    g.lineTo(0, -height - baseDepth * ISO_SCALE.y / 2);
    g.lineTo(0, -baseDepth * ISO_SCALE.y / 2);
    g.closePath();
    g.fill({ color, alpha: 0.4 });

    g.moveTo(0, -height - baseDepth * ISO_SCALE.y / 2);
    g.lineTo(baseWidth / 2, -height);
    g.lineTo(0, -height + baseDepth * ISO_SCALE.y / 2);
    g.lineTo(-baseWidth / 2, -height);
    g.closePath();
    g.fill({ color, alpha: 0.8 });

    this.ghostBuilding.addChild(g);

    // Add placement indicator
    const indicator = new Graphics();
    const indicatorSize = TILE_SIZE * 0.8;
    indicator.moveTo(0, -indicatorSize * ISO_SCALE.y / 2);
    indicator.lineTo(indicatorSize / 2, 0);
    indicator.lineTo(0, indicatorSize * ISO_SCALE.y / 2);
    indicator.lineTo(-indicatorSize / 2, 0);
    indicator.closePath();
    indicator.fill({ color: COLORS.ghostValid, alpha: 0.3 });
    indicator.setStrokeStyle({ width: 2, color: COLORS.ghostValid });
    indicator.stroke();
    this.ghostBuilding.addChildAt(indicator, 0);
  }

  private updateGhostPosition(screenX: number, screenY: number): void {
    if (!this.ghostBuilding || !this.placementMode) return;

    const gridPos = this.screenToGrid(screenX, screenY);
    this.ghostGridX = gridPos.x;
    this.ghostGridY = gridPos.y;

    // Check validity
    this.isValidPlacement = this.canPlaceBuilding(this.ghostGridX, this.ghostGridY);

    // Update ghost position
    const screenPos = this.gridToScreen(this.ghostGridX, this.ghostGridY);
    this.ghostBuilding.x = screenPos.x;
    this.ghostBuilding.y = screenPos.y;

    // Update indicator color
    const indicator = this.ghostBuilding.children[0] as Graphics;
    if (indicator) {
      indicator.clear();
      const indicatorSize = TILE_SIZE * 0.8;
      const color = this.isValidPlacement ? COLORS.ghostValid : COLORS.ghostInvalid;

      indicator.moveTo(0, -indicatorSize * ISO_SCALE.y / 2);
      indicator.lineTo(indicatorSize / 2, 0);
      indicator.lineTo(0, indicatorSize * ISO_SCALE.y / 2);
      indicator.lineTo(-indicatorSize / 2, 0);
      indicator.closePath();
      indicator.fill({ color, alpha: 0.3 });
      indicator.setStrokeStyle({ width: 2, color });
      indicator.stroke();
    }
  }

  private canPlaceBuilding(gridX: number, gridY: number): boolean {
    // Check bounds
    if (!this.isValidGridPosition(gridX, gridY)) return false;

    // Check if on island
    if (!this.isOnIsland(gridX, gridY)) return false;

    // Check if occupied
    if (this.grid[gridY][gridX].occupied) return false;

    return true;
  }

  private placeBuilding(kind: BuildingKind, gridX: number, gridY: number): void {
    if (!this.canPlaceBuilding(gridX, gridY)) return;

    const id = `player-${kind}-${Date.now()}`;
    const config = BUILDING_CONFIGS[kind];
    const color = DISTRICT_COLORS[kind];
    const screenPos = this.gridToScreen(gridX, gridY);

    // Create building container
    const container = new Container();
    container.x = screenPos.x;
    container.y = screenPos.y;

    // Draw building
    this.drawBuilding(container, kind, 0, color);

    // Add to layer
    this.buildingLayer.addChild(container);

    // Add label
    const label = new Text({
      text: config.name,
      style: new TextStyle({
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        fontWeight: '600',
        fill: COLORS.cream,
        dropShadow: {
          color: 0x000000,
          blur: 2,
          distance: 1,
          angle: Math.PI / 4,
        },
      }),
    });
    label.anchor.set(0.5);
    label.x = screenPos.x;
    label.y = screenPos.y - 55;
    this.labelLayer.addChild(label);

    // Update grid
    this.grid[gridY][gridX].occupied = true;
    this.grid[gridY][gridX].buildingId = id;

    // Store building
    this.placedBuildings.set(id, {
      id,
      kind,
      gridX,
      gridY,
      container,
    });

    // Play placement effect
    this.playPlacementEffect(screenPos.x, screenPos.y);

    // Notify callback
    this.config.onBuildingPlaced?.(kind, gridX, gridY);

    // Don't auto-exit placement mode (allow multiple placements)
    // If shift is not held, exit placement mode
    if (!this.keysPressed.has('shift')) {
      this.setPlacementMode(null);
    }
  }

  private playPlacementEffect(x: number, y: number): void {
    const effect = new Graphics();
    effect.circle(0, -20, 30);
    effect.fill({ color: COLORS.gold, alpha: 0.5 });
    effect.x = x;
    effect.y = y;
    this.effectLayer.addChild(effect);

    // Animate and remove
    const startTime = performance.now();
    const duration = 300;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      effect.scale.set(1 + progress);
      effect.alpha = 0.5 * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.effectLayer.removeChild(effect);
      }
    };

    animate();
  }

  // ─────────────────────────────────────────────────────────────
  // World Building
  // ─────────────────────────────────────────────────────────────

  private buildIsland(): void {
    const island = new Graphics();

    // Main island platform (isometric diamond) - doubled size for 24x24 grid
    const platformSize = TILE_SIZE * 10;

    // Water/void below island
    island.ellipse(0, platformSize * ISO_SCALE.y + 60, platformSize * 1.4, platformSize * ISO_SCALE.y * 0.9);
    island.fill({ color: 0x0a1628, alpha: 0.7 });

    // Second water layer for depth
    island.ellipse(0, platformSize * ISO_SCALE.y + 80, platformSize * 1.5, platformSize * ISO_SCALE.y);
    island.fill({ color: 0x060d1a, alpha: 0.5 });

    // Draw soft shadow under island
    island.moveTo(0, platformSize * ISO_SCALE.y + 40);
    island.lineTo(platformSize * 1.1, 40);
    island.lineTo(0, -platformSize * ISO_SCALE.y + 40);
    island.lineTo(-platformSize * 1.1, 40);
    island.closePath();
    island.fill({ color: 0x000000, alpha: 0.35 });

    // Enhanced cliff edge with multiple rock layers
    const cliffHeight = 70;

    // Deepest rock layer (darkest)
    island.moveTo(-platformSize, 0);
    island.lineTo(-platformSize, cliffHeight + 20);
    island.lineTo(0, platformSize * ISO_SCALE.y + cliffHeight + 20);
    island.lineTo(platformSize, cliffHeight + 20);
    island.lineTo(platformSize, 0);
    island.lineTo(0, platformSize * ISO_SCALE.y);
    island.closePath();
    island.fill({ color: 0x1A1410 });

    // Middle rock layer
    island.moveTo(-platformSize, 0);
    island.lineTo(-platformSize, cliffHeight + 10);
    island.lineTo(0, platformSize * ISO_SCALE.y + cliffHeight + 10);
    island.lineTo(platformSize, cliffHeight + 10);
    island.lineTo(platformSize, 0);
    island.lineTo(0, platformSize * ISO_SCALE.y);
    island.closePath();
    island.fill({ color: 0x2A1F18 });

    // Main cliff face
    island.moveTo(-platformSize, 0);
    island.lineTo(-platformSize, cliffHeight);
    island.lineTo(0, platformSize * ISO_SCALE.y + cliffHeight);
    island.lineTo(platformSize, cliffHeight);
    island.lineTo(platformSize, 0);
    island.lineTo(0, platformSize * ISO_SCALE.y);
    island.closePath();
    island.fill({ color: 0x4A3728 });

    // Cliff detail - vertical striations
    for (let i = 0; i < 12; i++) {
      const startX = -platformSize * 0.8 + i * (platformSize * 0.15);
      const startY = (startX / platformSize) * (platformSize * ISO_SCALE.y) * 0.3;
      island.moveTo(startX, startY + 5);
      island.lineTo(startX + Math.random() * 10 - 5, startY + cliffHeight - 10 - Math.random() * 15);
      island.stroke({ color: 0x3D2D1E, width: 2 + Math.random() * 2, alpha: 0.5 });
    }

    // Cliff highlights (left edge)
    island.moveTo(-platformSize + 15, 8);
    island.lineTo(-platformSize + 12, cliffHeight - 10);
    island.stroke({ color: 0x6D5A46, width: 4, alpha: 0.5 });

    // Draw main platform surface with natural grass colors
    island.moveTo(0, -platformSize * ISO_SCALE.y);
    island.lineTo(platformSize, 0);
    island.lineTo(0, platformSize * ISO_SCALE.y);
    island.lineTo(-platformSize, 0);
    island.closePath();
    island.fill({ color: 0x3D6B35 });

    // Grass variation overlay - darker patches
    island.moveTo(0, -platformSize * ISO_SCALE.y);
    island.lineTo(platformSize * 0.6, -platformSize * ISO_SCALE.y * 0.4);
    island.lineTo(0, platformSize * ISO_SCALE.y * 0.2);
    island.lineTo(-platformSize * 0.4, -platformSize * ISO_SCALE.y * 0.3);
    island.closePath();
    island.fill({ color: 0x4A7A42, alpha: 0.4 });

    // Lighter grass patch
    island.moveTo(platformSize * 0.2, platformSize * ISO_SCALE.y * 0.3);
    island.lineTo(platformSize * 0.7, platformSize * ISO_SCALE.y * 0.1);
    island.lineTo(platformSize * 0.5, platformSize * ISO_SCALE.y * 0.6);
    island.lineTo(platformSize * 0.1, platformSize * ISO_SCALE.y * 0.5);
    island.closePath();
    island.fill({ color: 0x5A8A52, alpha: 0.3 });

    // Add dirt paths between districts
    this.drawDirtPaths(island, platformSize);

    // Add grass texture with more natural variation
    for (let i = -8; i <= 8; i++) {
      const offset = i * (platformSize / 9);
      const wobble = Math.sin(i * 0.7) * 8;
      island.moveTo(offset + wobble, -platformSize * ISO_SCALE.y + Math.abs(offset) * ISO_SCALE.y);
      island.lineTo(offset - wobble, platformSize * ISO_SCALE.y - Math.abs(offset) * ISO_SCALE.y);
      island.stroke({ width: 1, color: 0x2D5225, alpha: 0.25 });
    }

    // Cross-hatch texture
    for (let i = -8; i <= 8; i++) {
      const offset = i * (platformSize / 9);
      const wobble = Math.cos(i * 0.8) * 6;
      island.moveTo(-platformSize + Math.abs(offset), (offset + wobble) * ISO_SCALE.y);
      island.lineTo(platformSize - Math.abs(offset), (offset - wobble) * ISO_SCALE.y);
      island.stroke({ width: 1, color: 0x3A5A32, alpha: 0.2 });
    }

    this.islandLayer.addChild(island);

    // Add decorative elements
    this.addTerrainDecorations(platformSize);
  }

  // Draw natural dirt paths connecting districts
  private drawDirtPaths(island: Graphics, platformSize: number): void {
    const pathColor = 0x5D4E37;
    const pathWidth = 18;

    // Central path from townhall to library
    island.moveTo(-pathWidth/2, -20);
    island.lineTo(pathWidth/2, -20);
    island.lineTo(pathWidth/2 + 4, platformSize * ISO_SCALE.y * 0.4);
    island.lineTo(-pathWidth/2 - 4, platformSize * ISO_SCALE.y * 0.4);
    island.closePath();
    island.fill({ color: pathColor, alpha: 0.5 });

    // Path to workshop (upper left)
    island.moveTo(-20, -15);
    island.lineTo(-platformSize * 0.35, -platformSize * ISO_SCALE.y * 0.15);
    island.stroke({ color: pathColor, width: pathWidth, alpha: 0.4 });

    // Path to market (upper right)
    island.moveTo(20, -15);
    island.lineTo(platformSize * 0.35, -platformSize * ISO_SCALE.y * 0.15);
    island.stroke({ color: pathColor, width: pathWidth, alpha: 0.4 });

    // Path to stables (lower left)
    island.moveTo(-20, 30);
    island.lineTo(-platformSize * 0.35, platformSize * ISO_SCALE.y * 0.25);
    island.stroke({ color: pathColor, width: pathWidth, alpha: 0.4 });

    // Path to barracks (lower right)
    island.moveTo(20, 30);
    island.lineTo(platformSize * 0.35, platformSize * ISO_SCALE.y * 0.25);
    island.stroke({ color: pathColor, width: pathWidth, alpha: 0.4 });
  }

  // Terrain decorations - scaled for larger map
  private addTerrainDecorations(platformSize: number): void {
    const decorations = new Graphics();

    // Many more grass tufts for larger terrain
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * platformSize * 0.8;
      const x = Math.cos(angle) * dist * 0.7;
      const y = Math.sin(angle) * dist * ISO_SCALE.y * 0.7;

      // Grass tuft with variation
      const grassHeight = 6 + Math.random() * 6;
      const grassColor = [0x6B8E23, 0x556B2F, 0x4A7A1C, 0x5D7A2E][Math.floor(Math.random() * 4)];
      decorations.moveTo(x, y);
      decorations.lineTo(x - 2 - Math.random() * 2, y - grassHeight);
      decorations.stroke({ color: grassColor, width: 1.5, alpha: 0.8 });
      decorations.moveTo(x, y);
      decorations.lineTo(x + 2 + Math.random() * 2, y - grassHeight * 0.9);
      decorations.stroke({ color: 0x556B2F, width: 1.5, alpha: 0.7 });
      decorations.moveTo(x, y);
      decorations.lineTo(x, y - grassHeight * 0.7);
      decorations.stroke({ color: 0x4A6A1E, width: 1, alpha: 0.6 });
    }

    // Scattered rocks of varying sizes
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = platformSize * 0.3 + Math.random() * platformSize * 0.5;
      const x = Math.cos(angle) * dist * 0.7;
      const y = Math.sin(angle) * dist * ISO_SCALE.y * 0.7;
      const size = 4 + Math.random() * 8;

      // Rock base
      decorations.ellipse(x, y, size, size * 0.5);
      decorations.fill({ color: 0x555555, alpha: 0.75 });
      // Rock highlight
      decorations.ellipse(x - 1, y - 1, size * 0.6, size * 0.3);
      decorations.fill({ color: 0x777777, alpha: 0.4 });
      // Rock shadow
      decorations.ellipse(x + 1, y + 1, size * 0.5, size * 0.25);
      decorations.fill({ color: 0x333333, alpha: 0.3 });
    }

    // Larger boulders at edges
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = platformSize * 0.7 + Math.random() * platformSize * 0.15;
      const x = Math.cos(angle) * dist * 0.75;
      const y = Math.sin(angle) * dist * ISO_SCALE.y * 0.75;
      const size = 10 + Math.random() * 12;

      decorations.ellipse(x, y, size, size * 0.6);
      decorations.fill({ color: 0x4A4A4A });
      decorations.ellipse(x - 2, y - 2, size * 0.5, size * 0.3);
      decorations.fill({ color: 0x6A6A6A, alpha: 0.6 });
    }

    // Dirt patches scattered around
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * platformSize * 0.6;
      const x = Math.cos(angle) * dist * 0.65;
      const y = Math.sin(angle) * dist * ISO_SCALE.y * 0.65;

      decorations.ellipse(x, y, 10 + Math.random() * 10, 5 + Math.random() * 5);
      decorations.fill({ color: 0x5D4E37, alpha: 0.35 });
    }

    // Small flowers/wildflowers scattered
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * platformSize * 0.6;
      const x = Math.cos(angle) * dist * 0.6;
      const y = Math.sin(angle) * dist * ISO_SCALE.y * 0.6;
      const flowerColor = [0xFFD700, 0xE8E8E8, 0x9370DB, 0xFF6B6B][Math.floor(Math.random() * 4)];

      decorations.circle(x, y - 3, 2);
      decorations.fill({ color: flowerColor, alpha: 0.8 });
    }

    this.islandLayer.addChild(decorations);
  }

  private buildDistricts(): void {
    // Build districts in order (back to front for proper layering)
    const orderedDistricts: BuildingKind[] = [
      'workshop', 'market', 'townhall', 'stables', 'barracks', 'library'
    ];

    for (const id of orderedDistricts) {
      this.createDistrict(id);
    }
  }

  private createDistrict(id: BuildingKind): void {
    const config = BUILDING_CONFIGS[id];
    const pos = DISTRICT_POSITIONS[id];
    const color = DISTRICT_COLORS[id];

    const container = new Container();

    // Convert grid position to isometric screen position
    const screenX = (pos.x - pos.y) * TILE_SIZE * 0.5;
    const screenY = (pos.x + pos.y) * TILE_SIZE * ISO_SCALE.y * 0.5;
    container.x = screenX;
    container.y = screenY;

    // Create district pad
    const padSize = TILE_SIZE * 1.2;
    const pad = new Graphics();
    this.drawIsometricPad(pad, padSize, color);
    pad.eventMode = 'static';
    pad.cursor = 'pointer';
    container.addChild(pad);

    // Create building
    const building = new Container();
    this.drawBuilding(building, id, 0, color);
    container.addChild(building);

    // Create label
    const label = new Text({
      text: config.name,
      style: new TextStyle({
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        fontWeight: '600',
        fill: COLORS.cream,
        dropShadow: {
          color: 0x000000,
          blur: 2,
          distance: 1,
          angle: Math.PI / 4,
        },
      }),
    });
    label.anchor.set(0.5);
    label.y = -this.getBuildingHeight(0) - 10;
    this.labelLayer.addChild(label);

    // Store position for label
    label.x = container.x;
    label.y = container.y - this.getBuildingHeight(0) - 15;

    // Setup interaction
    pad.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.selectDistrict(id);
      this.config.onDistrictClick?.(id);
    });

    pad.on('pointerover', () => {
      this.hoverDistrict(id);
      this.config.onDistrictHover?.(id);
    });

    pad.on('pointerout', () => {
      this.unhoverDistrict(id);
      this.config.onDistrictHover?.(null);
    });

    // Store visual
    const visual: DistrictVisual = {
      id,
      container,
      pad,
      building,
      label,
      tier: 0,
      isHovered: false,
      isSelected: false,
    };
    this.districts.set(id, visual);

    this.districtLayer.addChild(container);
  }

  private drawIsometricPad(g: Graphics, size: number, color: number): void {
    const halfSize = size / 2;
    const height = size * ISO_SCALE.y;

    // Top surface
    g.moveTo(0, -height / 2);
    g.lineTo(halfSize, 0);
    g.lineTo(0, height / 2);
    g.lineTo(-halfSize, 0);
    g.closePath();
    g.fill({ color, alpha: 0.4 });

    // Border
    g.setStrokeStyle({ width: 2, color });
    g.moveTo(0, -height / 2);
    g.lineTo(halfSize, 0);
    g.lineTo(0, height / 2);
    g.lineTo(-halfSize, 0);
    g.closePath();
    g.stroke();
  }

  private drawBuilding(container: Container, id: BuildingKind, tier: Tier, color: number): void {
    container.removeChildren();

    const g = new Graphics();
    const baseWidth = 30 + tier * 10;
    const baseDepth = 30 + tier * 10;
    const height = this.getBuildingHeight(tier);

    // Phase 3: Shadow (Step 28)
    g.ellipse(0, 5, baseWidth * 0.6, baseDepth * 0.2);
    g.fill({ color: 0x000000, alpha: 0.3 });

    // Building base (isometric box)
    // Left face
    g.moveTo(-baseWidth / 2, 0);
    g.lineTo(-baseWidth / 2, -height);
    g.lineTo(0, -height - baseDepth * ISO_SCALE.y / 2);
    g.lineTo(0, -baseDepth * ISO_SCALE.y / 2);
    g.closePath();
    g.fill({ color: this.darkenColor(color, 0.3) });

    // Right face
    g.moveTo(baseWidth / 2, 0);
    g.lineTo(baseWidth / 2, -height);
    g.lineTo(0, -height - baseDepth * ISO_SCALE.y / 2);
    g.lineTo(0, -baseDepth * ISO_SCALE.y / 2);
    g.closePath();
    g.fill({ color: this.darkenColor(color, 0.15) });

    // Top face
    g.moveTo(0, -height - baseDepth * ISO_SCALE.y / 2);
    g.lineTo(baseWidth / 2, -height);
    g.lineTo(0, -height + baseDepth * ISO_SCALE.y / 2);
    g.lineTo(-baseWidth / 2, -height);
    g.closePath();
    g.fill({ color });

    // Phase 3: Building-specific details (Step 21)
    this.drawBuildingDetails(g, id, tier, baseWidth, baseDepth, height, color);

    // Roof (for tier 1+)
    if (tier >= 1) {
      const roofHeight = 15 + tier * 8;
      const roofWidth = baseWidth * 0.95;

      // Building-specific roof styles
      if (id === 'library' || id === 'townhall') {
        // Dome roof for library/townhall
        g.ellipse(0, -height - roofHeight * 0.4, roofWidth * 0.4, roofHeight * 0.6);
        g.fill({ color: id === 'library' ? 0x4A5568 : COLORS.gold });
      } else if (id === 'barracks') {
        // Flat roof with crenelations
        g.rect(-roofWidth / 2, -height - 8, roofWidth, 8);
        g.fill({ color: COLORS.stone });
        for (let i = 0; i < 4; i++) {
          const cx = -roofWidth / 2 + (roofWidth / 4) * (i + 0.5);
          g.rect(cx - 3, -height - 14, 6, 6);
          g.fill({ color: COLORS.stone });
        }
      } else {
        // Pyramid roof for others
        g.moveTo(0, -height - roofHeight - baseDepth * ISO_SCALE.y / 2);
        g.lineTo(roofWidth / 2, -height);
        g.lineTo(0, -height + baseDepth * ISO_SCALE.y / 2);
        g.lineTo(-roofWidth / 2, -height);
        g.closePath();
        g.fill({ color: id === 'stables' ? 0x6B4423 : COLORS.texasSoil });

        // Roof shadow
        g.moveTo(0, -height - roofHeight - baseDepth * ISO_SCALE.y / 2);
        g.lineTo(-roofWidth / 2, -height);
        g.lineTo(0, -height + baseDepth * ISO_SCALE.y / 2);
        g.closePath();
        g.fill({ color: this.darkenColor(COLORS.texasSoil, 0.25) });
      }
    }

    // Tier 2: Add tower/spire
    if (tier >= 2) {
      if (id === 'townhall') {
        // Gold spire
        const spireHeight = 30;
        g.moveTo(0, -height - 20 - baseDepth * ISO_SCALE.y / 2);
        g.lineTo(0, -height - 20 - spireHeight - baseDepth * ISO_SCALE.y / 2);
        g.lineTo(8, -height - 20 - baseDepth * ISO_SCALE.y / 2 + 5);
        g.closePath();
        g.fill({ color: COLORS.gold });
        // Flag
        g.moveTo(0, -height - 50);
        g.lineTo(0, -height - 65);
        g.stroke({ color: 0x4A3728, width: 2 });
        g.moveTo(0, -height - 65);
        g.lineTo(12, -height - 60);
        g.lineTo(0, -height - 55);
        g.closePath();
        g.fill({ color: COLORS.burntOrange });
      } else if (id === 'workshop') {
        // Chimney with smoke
        g.rect(baseWidth / 4, -height - 25, 8, 20);
        g.fill({ color: 0x555555 });
        g.rect(baseWidth / 4 - 2, -height - 28, 12, 5);
        g.fill({ color: 0x444444 });
      } else if (id === 'barracks') {
        // Banner/flag
        g.moveTo(-baseWidth / 4, -height - 15);
        g.lineTo(-baseWidth / 4, -height - 35);
        g.stroke({ color: 0x4A3728, width: 2 });
        g.rect(-baseWidth / 4, -height - 35, 12, 10);
        g.fill({ color: 0xE74C3C });
      }
    }

    // Windows for tier 1+
    if (tier >= 1) {
      const windowY = -height / 2;
      const windowColor = 0x87CEEB;
      const windowGlow = 0xFFF3B0;

      // Left window
      g.rect(-baseWidth / 4 - 4, windowY - 6, 8, 10);
      g.fill({ color: windowColor, alpha: 0.7 });
      g.rect(-baseWidth / 4 - 2, windowY - 4, 4, 6);
      g.fill({ color: windowGlow, alpha: 0.4 });

      // Right window
      g.rect(baseWidth / 4 - 4, windowY - 6, 8, 10);
      g.fill({ color: windowColor, alpha: 0.7 });
      g.rect(baseWidth / 4 - 2, windowY - 4, 4, 6);
      g.fill({ color: windowGlow, alpha: 0.4 });

      // Window frames
      g.rect(-baseWidth / 4 - 4, windowY - 6, 8, 10);
      g.stroke({ color: 0x4A3728, width: 1 });
      g.rect(baseWidth / 4 - 4, windowY - 6, 8, 10);
      g.stroke({ color: 0x4A3728, width: 1 });
    }

    // Door
    g.roundRect(-6, -14, 12, 14, 2);
    g.fill({ color: 0x4A3728 });
    // Door frame
    g.roundRect(-6, -14, 12, 14, 2);
    g.stroke({ color: 0x3A2718, width: 1 });
    // Door handle
    g.circle(3, -7, 1.5);
    g.fill({ color: COLORS.gold });

    container.addChild(g);

    // Schedule smoke particles for workshop tier 2
    const smokeKey = `smoke_${id}`;
    if (id === 'workshop' && tier >= 2 && !this.smokeIntervals.has(smokeKey)) {
      const smokeInterval = setInterval(() => {
        if (!container.parent) {
          clearInterval(smokeInterval);
          this.smokeIntervals.delete(smokeKey);
          return;
        }
        this.spawnSmokeParticle(container.x + baseWidth / 4 + 4, container.y - height - 28);
      }, 800);
      this.smokeIntervals.set(smokeKey, smokeInterval);
    }
  }

  private drawBuildingDetails(g: Graphics, id: BuildingKind, tier: Tier, baseWidth: number, baseDepth: number, height: number, color: number): void {
    // Building-specific decorative details
    switch (id) {
      case 'townhall':
        // Columns
        if (tier >= 1) {
          g.rect(-baseWidth / 2 + 4, -height + 10, 4, height - 20);
          g.fill({ color: 0xE0D4C8 });
          g.rect(baseWidth / 2 - 8, -height + 10, 4, height - 20);
          g.fill({ color: 0xE0D4C8 });
        }
        // Steps
        g.rect(-baseWidth / 3, -4, baseWidth * 2 / 3, 4);
        g.fill({ color: 0xCCBBA8 });
        break;

      case 'workshop':
        // Anvil shape on front
        g.rect(-8, -18, 16, 4);
        g.fill({ color: 0x555555 });
        // Gear decoration
        if (tier >= 1) {
          g.circle(baseWidth / 3, -height / 2, 6);
          g.stroke({ color: 0x777777, width: 2 });
        }
        break;

      case 'market':
        // Awning
        for (let i = 0; i < 3; i++) {
          const ax = -baseWidth / 3 + (baseWidth / 3) * i;
          g.moveTo(ax, -height + 5);
          g.lineTo(ax + baseWidth / 6, -height + 15);
          g.lineTo(ax + baseWidth / 3, -height + 5);
          g.closePath();
          g.fill({ color: i % 2 === 0 ? 0xE74C3C : 0xF5F5DC });
        }
        break;

      case 'barracks':
        // Shield emblem
        g.moveTo(0, -height / 2 - 8);
        g.lineTo(-6, -height / 2);
        g.lineTo(0, -height / 2 + 8);
        g.lineTo(6, -height / 2);
        g.closePath();
        g.fill({ color: 0xC0C0C0 });
        g.fill({ color: 0xE74C3C, alpha: 0.5 });
        break;

      case 'stables':
        // Fence posts
        g.rect(-baseWidth / 2 - 5, -10, 3, 15);
        g.fill({ color: 0x6B4423 });
        g.rect(baseWidth / 2 + 2, -10, 3, 15);
        g.fill({ color: 0x6B4423 });
        // Hay pile
        g.ellipse(baseWidth / 3, -5, 8, 4);
        g.fill({ color: 0xD4A017 });
        break;

      case 'library':
        // Book stack decoration
        if (tier >= 1) {
          g.rect(baseWidth / 4, -height / 2 - 5, 3, 12);
          g.fill({ color: 0x8B4513 });
          g.rect(baseWidth / 4 + 4, -height / 2 - 3, 3, 10);
          g.fill({ color: 0x2E4A62 });
          g.rect(baseWidth / 4 + 8, -height / 2 - 6, 3, 14);
          g.fill({ color: 0x5D3A1A });
        }
        // Arch over door
        g.arc(0, -14, 8, Math.PI, 0);
        g.stroke({ color: 0xE0D4C8, width: 3 });
        break;
    }
  }

  private spawnSmokeParticle(x: number, y: number): void {
    const particle = new Graphics();
    const size = 4 + Math.random() * 3;
    particle.circle(0, 0, size);
    particle.fill({ color: 0x888888, alpha: 0.5 });

    particle.x = x;
    particle.y = y;
    this.effectLayer.addChild(particle);

    const startTime = performance.now();
    const lifetime = 1200 + Math.random() * 400;
    const vx = (Math.random() - 0.5) * 0.5;

    const animateSmoke = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / lifetime;

      if (progress >= 1) {
        this.effectLayer.removeChild(particle);
        particle.destroy();
        return;
      }

      particle.x += vx;
      particle.y -= 0.8;
      particle.alpha = (1 - progress) * 0.5;
      particle.scale.set(1 + progress * 1.5);

      requestAnimationFrame(animateSmoke);
    };

    requestAnimationFrame(animateSmoke);
  }

  private getBuildingHeight(tier: Tier): number {
    return 40 + tier * 20;
  }

  private darkenColor(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xFF) * (1 - amount));
    const g = Math.max(0, ((color >> 8) & 0xFF) * (1 - amount));
    const b = Math.max(0, (color & 0xFF) * (1 - amount));
    return (r << 16) | (g << 8) | b;
  }

  // ─────────────────────────────────────────────────────────────
  // Interaction
  // ─────────────────────────────────────────────────────────────

  private hoverDistrict(id: BuildingKind): void {
    const visual = this.districts.get(id);
    if (!visual || visual.isHovered) return;

    visual.isHovered = true;
    visual.container.y -= 5; // Lift up
    visual.label.y -= 5;

    // Brighten pad
    visual.pad.alpha = 1.2;
  }

  private unhoverDistrict(id: BuildingKind): void {
    const visual = this.districts.get(id);
    if (!visual || !visual.isHovered) return;

    visual.isHovered = false;
    visual.container.y += 5;
    visual.label.y += 5;
    visual.pad.alpha = 1.0;
  }

  public selectDistrict(id: BuildingKind | null): void {
    // Deselect previous
    if (this.selectedDistrict) {
      const prev = this.districts.get(this.selectedDistrict);
      if (prev) {
        prev.isSelected = false;
        prev.pad.alpha = 1.0;
      }
    }

    this.selectedDistrict = id;

    // Select new
    if (id) {
      const visual = this.districts.get(id);
      if (visual) {
        visual.isSelected = true;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // State Updates
  // ─────────────────────────────────────────────────────────────

  public updateCityState(state: CityState): void {
    this.cityState = state;

    for (const [id, buildingState] of Object.entries(state.buildings)) {
      const visual = this.districts.get(id as BuildingKind);
      if (!visual) continue;

      // Check for tier upgrade
      if (buildingState.tier !== visual.tier) {
        this.upgradeBuilding(id as BuildingKind, buildingState.tier);
      }

      // Update progress indicator
      this.updateProgressIndicator(id as BuildingKind, buildingState);
    }
  }

  private upgradeBuilding(id: BuildingKind, newTier: Tier): void {
    const visual = this.districts.get(id);
    if (!visual) return;

    // Play upgrade animation
    this.playUpgradeAnimation(visual);

    // Rebuild building at new tier
    const color = DISTRICT_COLORS[id];
    this.drawBuilding(visual.building, id, newTier, color);

    // Update label position
    const pos = DISTRICT_POSITIONS[id];
    const screenX = (pos.x - pos.y) * TILE_SIZE * 0.5;
    const screenY = (pos.x + pos.y) * TILE_SIZE * ISO_SCALE.y * 0.5;
    visual.label.y = screenY - this.getBuildingHeight(newTier) - 15;

    visual.tier = newTier;
  }

  private playUpgradeAnimation(visual: DistrictVisual): void {
    const startY = visual.container.y;
    const labelStartY = visual.label.y;
    const duration = 600;
    const startTime = performance.now();

    // C4: Spawn dust particles at base
    this.spawnDustParticles(visual.container.x, visual.container.y, 8);

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Bounce effect
      const bounce = Math.sin(progress * Math.PI) * 15;
      visual.container.y = startY - bounce;
      visual.label.y = labelStartY - bounce;

      // Flash effect
      visual.building.alpha = 1 + Math.sin(progress * Math.PI * 4) * 0.3;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        visual.container.y = startY;
        visual.label.y = labelStartY;
        visual.building.alpha = 1;

        // C4: Spawn gold sparkles on completion
        this.spawnSparkles(visual.container.x, visual.container.y - 40, 12);
      }
    };

    animate();
  }

  // ─────────────────────────────────────────────────────────────
  // Particle Effects (C4)
  // ─────────────────────────────────────────────────────────────

  private spawnDustParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = new Graphics();
      const size = 3 + Math.random() * 4;
      particle.circle(0, 0, size);
      particle.fill({ color: 0x8B7355, alpha: 0.7 });

      particle.x = x + (Math.random() - 0.5) * 40;
      particle.y = y;
      this.effectLayer.addChild(particle);

      // Animate particle
      const vx = (Math.random() - 0.5) * 3;
      const vy = -Math.random() * 2 - 1;
      const startTime = performance.now();
      const lifetime = 400 + Math.random() * 200;

      const animateParticle = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / lifetime;

        if (progress >= 1) {
          this.effectLayer.removeChild(particle);
          particle.destroy();
          return;
        }

        particle.x += vx;
        particle.y += vy + progress * 2; // Gravity
        particle.alpha = (1 - progress) * 0.7;
        particle.scale.set(1 - progress * 0.5);

        requestAnimationFrame(animateParticle);
      };

      requestAnimationFrame(animateParticle);
    }
  }

  private spawnSparkles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = new Graphics();

      // Star shape
      const size = 2 + Math.random() * 3;
      particle.star(0, 0, 4, size, size * 0.5);
      particle.fill({ color: 0xFFD700, alpha: 0.9 });

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 20 + Math.random() * 30;

      particle.x = x;
      particle.y = y;
      this.effectLayer.addChild(particle);

      // Animate particle outward
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      const startTime = performance.now();
      const lifetime = 500 + Math.random() * 300;

      const animateParticle = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / lifetime;

        if (progress >= 1) {
          this.effectLayer.removeChild(particle);
          particle.destroy();
          return;
        }

        // Ease out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        particle.x = x + (targetX - x) * easeProgress;
        particle.y = y + (targetY - y) * easeProgress - Math.sin(progress * Math.PI) * 20;
        particle.alpha = 1 - progress;
        particle.rotation = progress * Math.PI * 2;
        particle.scale.set(1 - progress * 0.3);

        requestAnimationFrame(animateParticle);
      };

      // Stagger particle starts
      setTimeout(() => requestAnimationFrame(animateParticle), i * 30);
    }
  }

  private updateProgressIndicator(id: BuildingKind, state: BuildingState): void {
    const visual = this.districts.get(id);
    if (!visual) return;

    const config = BUILDING_CONFIGS[id];
    const tierName = config.tierNames[state.tier];
    visual.label.text = `${config.name}\n${tierName} (${state.completions})`;
  }

  // ─────────────────────────────────────────────────────────────
  // Phase 1: Flash Building Effect
  // ─────────────────────────────────────────────────────────────

  /**
   * Flash a building with a colored glow effect
   * @param buildingId - The BuildingKind to flash
   * @param color - Hex color for the flash (default: gold)
   * @param duration - Duration in ms (default: 800)
   */
  public flashBuilding(buildingId: BuildingKind, color: number = COLORS.gold, duration: number = 800): void {
    const visual = this.districts.get(buildingId);
    if (!visual) return;

    // Create expanding glow ring
    this.createGlowRing(visual.container.x, visual.container.y - 20, color, duration);

    // Pulse the building itself
    this.pulseBuilding(visual, duration);
  }

  /**
   * Create an expanding gold glow ring at position
   */
  private createGlowRing(x: number, y: number, color: number, duration: number): void {
    const ring = new Graphics();
    ring.x = x;
    ring.y = y;
    this.effectLayer.addChild(ring);

    const startTime = performance.now();
    const maxRadius = 80;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const radius = easeProgress * maxRadius;
      const alpha = (1 - progress) * 0.6;

      ring.clear();

      // Outer glow ring
      ring.circle(0, 0, radius);
      ring.stroke({ color, width: 4, alpha });

      // Inner glow
      ring.circle(0, 0, radius * 0.6);
      ring.fill({ color, alpha: alpha * 0.3 });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.effectLayer.removeChild(ring);
        ring.destroy();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Pulse a building's scale for emphasis
   */
  private pulseBuilding(visual: DistrictVisual, duration: number): void {
    const startTime = performance.now();
    const originalScale = visual.building.scale.x;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Bounce effect: scale up then back down
      const scale = originalScale + Math.sin(progress * Math.PI) * 0.15;
      visual.building.scale.set(scale);

      // Brightness flash
      visual.building.alpha = 1 + Math.sin(progress * Math.PI * 2) * 0.2;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        visual.building.scale.set(originalScale);
        visual.building.alpha = 1;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Show a floating text indicator (e.g., "+1 TIER")
   * @param buildingId - The building to show text above
   * @param text - Text to display
   * @param color - Text color (default: gold)
   */
  public showFloatingText(buildingId: BuildingKind, text: string, color: number = COLORS.gold): void {
    const visual = this.districts.get(buildingId);
    if (!visual) return;

    const floatText = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: '700',
        fill: color,
        dropShadow: {
          color: 0x000000,
          blur: 4,
          distance: 2,
          angle: Math.PI / 4,
        },
      }),
    });

    floatText.anchor.set(0.5);
    floatText.x = visual.container.x;
    floatText.y = visual.container.y - 60;
    this.effectLayer.addChild(floatText);

    const startTime = performance.now();
    const duration = 1200;
    const startY = floatText.y;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Float upward
      floatText.y = startY - progress * 40;

      // Fade out in last 30%
      if (progress > 0.7) {
        floatText.alpha = 1 - ((progress - 0.7) / 0.3);
      }

      // Scale pulse at start
      if (progress < 0.2) {
        floatText.scale.set(1 + Math.sin((progress / 0.2) * Math.PI) * 0.2);
      } else {
        floatText.scale.set(1);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.effectLayer.removeChild(floatText);
        floatText.destroy();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Trigger a full tier upgrade effect (flash + floating text + sparkles)
   */
  public playTierUpgradeEffect(buildingId: BuildingKind): void {
    const visual = this.districts.get(buildingId);
    if (!visual) return;

    // Flash the building with gold
    this.flashBuilding(buildingId, COLORS.gold, 1000);

    // Show floating tier text
    this.showFloatingText(buildingId, '+1 TIER', COLORS.gold);

    // Spawn gold sparkles
    this.spawnSparkles(visual.container.x, visual.container.y - 40, 16);
  }

  // ─────────────────────────────────────────────────────────────
  // Minimap
  // ─────────────────────────────────────────────────────────────

  public generateMinimapData(): { districts: Record<string, { x: number; y: number; color: number; tier: number }> } {
    const districts: Record<string, { x: number; y: number; color: number; tier: number }> = {};

    for (const [id, visual] of this.districts) {
      const pos = DISTRICT_POSITIONS[id];
      districts[id] = {
        x: pos.x,
        y: pos.y,
        color: DISTRICT_COLORS[id],
        tier: visual.tier,
      };
    }

    return { districts };
  }

  // ─────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────

  private setupResizeHandler(): void {
    const onResize = () => {
      this.updateCamera();
    };
    window.addEventListener('resize', onResize);
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.app.destroy(true, { children: true });
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export async function createCityWorldRenderer(
  config: CityWorldRendererConfig
): Promise<CityWorldRenderer> {
  return CityWorldRenderer.create(config);
}
