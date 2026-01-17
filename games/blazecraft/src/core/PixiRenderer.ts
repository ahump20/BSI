/**
 * PixiRenderer - 2D rendering layer for Blazecraft
 *
 * Renders map, units, and visual indicators using PixiJS 8.x.
 * Top-down RTS view inspired by classic Warcraft aesthetics.
 */

import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from 'pixi.js';

import type {
  MapData,
  MapCell,
  Unit,
  UnitType,
  TeamId,
  ReplayTick,
} from '@data/replay-schema';

// ─────────────────────────────────────────────────────────────
// Constants & Colors
// ─────────────────────────────────────────────────────────────

const COLORS = {
  // BSI Brand
  burntOrange: 0xBF5700,
  texasSoil: 0x8B4513,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  ember: 0xFF6B35,
  cream: 0xF5F5DC,

  // Terrain
  ground: 0x4A6741,      // Forest green
  wall: 0x555555,        // Gray stone
  resource: 0xFFD700,    // Gold

  // Teams
  team0: 0x3498DB,       // Blue
  team1: 0xE74C3C,       // Red
  neutral: 0x888888,     // Gray

  // UI
  health: 0x2ECC71,      // Green
  healthLow: 0xE74C3C,   // Red
  selection: 0xFFFFFF,   // White
  grid: 0x2A3A28,        // Dark green
};

const UNIT_SIZES: Record<UnitType, number> = {
  base: 2,
  barracks: 1.5,
  worker: 0.6,
  light: 0.7,
  heavy: 0.9,
  ranged: 0.7,
  resource: 0.5,
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PixiRendererConfig {
  /** Container element or selector */
  container: HTMLElement | string;
  /** Tile size in pixels */
  tileSize?: number;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show health bars */
  showHealthBars?: boolean;
  /** Show unit IDs (debug) */
  showUnitIds?: boolean;
  /** Enable fog of war */
  enableFog?: boolean;
  /** Team to render fog for (null = no fog) */
  fogTeam?: TeamId | null;
}

export interface PixiRendererEvents {
  onUnitClick: (unit: Unit) => void;
  onUnitHover: (unit: Unit | null) => void;
  onCellClick: (x: number, y: number) => void;
  onReady: () => void;
}

const DEFAULT_CONFIG: Required<Omit<PixiRendererConfig, 'container'>> = {
  tileSize: 32,
  showGrid: true,
  showHealthBars: true,
  showUnitIds: false,
  enableFog: false,
  fogTeam: null,
};

// ─────────────────────────────────────────────────────────────
// PixiRenderer Class
// ─────────────────────────────────────────────────────────────

export class PixiRenderer {
  private app: Application;
  private config: Required<Omit<PixiRendererConfig, 'container'>>;
  private containerEl: HTMLElement;
  private events: Partial<PixiRendererEvents> = {};

  // Layers (bottom to top)
  private mapLayer: Container;
  private gridLayer: Container;
  private unitLayer: Container;
  private effectLayer: Container;
  private uiLayer: Container;

  // State
  private mapData: MapData | null = null;
  private units: Map<string, Unit> = new Map();
  private unitGraphics: Map<string, Container> = new Map();
  private selectedUnitId: string | null = null;
  private hoveredUnitId: string | null = null;

  // ─────────────────────────────────────────────────────────────
  // Constructor & Initialization
  // ─────────────────────────────────────────────────────────────

  private constructor(
    app: Application,
    containerEl: HTMLElement,
    config: PixiRendererConfig
  ) {
    this.app = app;
    this.containerEl = containerEl;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create layer containers
    this.mapLayer = new Container();
    this.gridLayer = new Container();
    this.unitLayer = new Container();
    this.effectLayer = new Container();
    this.uiLayer = new Container();

    // Add layers in order (bottom to top)
    this.app.stage.addChild(this.mapLayer);
    this.app.stage.addChild(this.gridLayer);
    this.app.stage.addChild(this.unitLayer);
    this.app.stage.addChild(this.effectLayer);
    this.app.stage.addChild(this.uiLayer);

    // Setup interaction
    this.setupInteraction();
  }

  /**
   * Factory method - async initialization required for PixiJS 8
   */
  public static async create(config: PixiRendererConfig): Promise<PixiRenderer> {
    // Resolve container element
    const containerEl = typeof config.container === 'string'
      ? document.querySelector<HTMLElement>(config.container)
      : config.container;

    if (!containerEl) {
      throw new Error('Container element not found');
    }

    // Create PixiJS application
    const app = new Application();
    await app.init({
      background: COLORS.midnight,
      resizeTo: containerEl,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add canvas to container
    containerEl.appendChild(app.canvas);

    const renderer = new PixiRenderer(app, containerEl, config);
    renderer.emit('onReady');

    return renderer;
  }

  // ─────────────────────────────────────────────────────────────
  // Event System
  // ─────────────────────────────────────────────────────────────

  public on<K extends keyof PixiRendererEvents>(
    event: K,
    callback: PixiRendererEvents[K]
  ): void {
    this.events[event] = callback;
  }

  public off<K extends keyof PixiRendererEvents>(event: K): void {
    delete this.events[event];
  }

  private emit<K extends keyof PixiRendererEvents>(
    event: K,
    ...args: Parameters<PixiRendererEvents[K]>
  ): void {
    const handler = this.events[event];
    if (handler) {
      // @ts-expect-error - TypeScript limitation with spread args
      handler(...args);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Map Rendering
  // ─────────────────────────────────────────────────────────────

  /**
   * Set and render the map
   */
  public setMap(mapData: MapData): void {
    this.mapData = mapData;
    this.renderMap();
    this.centerView();
  }

  private renderMap(): void {
    if (!this.mapData) return;

    // Clear existing
    this.mapLayer.removeChildren();
    this.gridLayer.removeChildren();

    const { width, height, cells } = this.mapData;
    const tileSize = this.config.tileSize;

    // Draw terrain
    const terrainGraphics = new Graphics();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y]?.[x];
        if (!cell) continue;

        const color = this.getCellColor(cell);
        const px = x * tileSize;
        const py = y * tileSize;

        terrainGraphics.rect(px, py, tileSize, tileSize);
        terrainGraphics.fill(color);
      }
    }

    this.mapLayer.addChild(terrainGraphics);

    // Draw grid lines if enabled
    if (this.config.showGrid) {
      this.renderGrid(width, height);
    }
  }

  private getCellColor(cell: MapCell): number {
    switch (cell.terrain) {
      case 'ground': return COLORS.ground;
      case 'wall': return COLORS.wall;
      case 'resource': return COLORS.resource;
      default: return COLORS.ground;
    }
  }

  private renderGrid(width: number, height: number): void {
    const tileSize = this.config.tileSize;
    const gridGraphics = new Graphics();

    gridGraphics.setStrokeStyle({ width: 1, color: COLORS.grid, alpha: 0.3 });

    // Vertical lines
    for (let x = 0; x <= width; x++) {
      gridGraphics.moveTo(x * tileSize, 0);
      gridGraphics.lineTo(x * tileSize, height * tileSize);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y++) {
      gridGraphics.moveTo(0, y * tileSize);
      gridGraphics.lineTo(width * tileSize, y * tileSize);
    }

    gridGraphics.stroke();
    this.gridLayer.addChild(gridGraphics);
  }

  // ─────────────────────────────────────────────────────────────
  // Unit Rendering
  // ─────────────────────────────────────────────────────────────

  /**
   * Update all units from replay tick
   */
  public updateUnits(tick: ReplayTick): void {
    const newUnits = new Map(tick.units.map(u => [u.id, u]));

    // Remove units that no longer exist
    for (const [id, graphics] of this.unitGraphics) {
      if (!newUnits.has(id)) {
        graphics.destroy();
        this.unitGraphics.delete(id);
      }
    }

    // Update or create units
    for (const unit of tick.units) {
      this.renderUnit(unit);
    }

    this.units = newUnits;
  }

  private renderUnit(unit: Unit): void {
    let container = this.unitGraphics.get(unit.id);

    if (!container) {
      // Create new unit container
      container = new Container();
      container.eventMode = 'static';
      container.cursor = 'pointer';

      // Setup interaction
      container.on('pointerdown', (e: FederatedPointerEvent) => {
        e.stopPropagation();
        this.selectUnit(unit.id);
        this.emit('onUnitClick', unit);
      });

      container.on('pointerover', () => {
        this.hoveredUnitId = unit.id;
        this.emit('onUnitHover', unit);
      });

      container.on('pointerout', () => {
        if (this.hoveredUnitId === unit.id) {
          this.hoveredUnitId = null;
          this.emit('onUnitHover', null);
        }
      });

      this.unitGraphics.set(unit.id, container);
      this.unitLayer.addChild(container);
    }

    // Update position
    const tileSize = this.config.tileSize;
    container.x = (unit.position.x + 0.5) * tileSize;
    container.y = (unit.position.y + 0.5) * tileSize;

    // Redraw unit graphics
    container.removeChildren();

    // Unit body
    const body = this.drawUnitBody(unit);
    container.addChild(body);

    // Health bar
    if (this.config.showHealthBars && unit.type !== 'resource') {
      const healthBar = this.drawHealthBar(unit);
      container.addChild(healthBar);
    }

    // Selection indicator
    if (this.selectedUnitId === unit.id) {
      const selection = this.drawSelectionIndicator(unit);
      container.addChild(selection);
    }

    // Unit ID label (debug)
    if (this.config.showUnitIds) {
      const label = this.drawUnitLabel(unit);
      container.addChild(label);
    }
  }

  private drawUnitBody(unit: Unit): Graphics {
    const graphics = new Graphics();
    const size = UNIT_SIZES[unit.type] * this.config.tileSize * 0.4;
    const color = this.getTeamColor(unit.team);

    // Different shapes for different unit types
    switch (unit.type) {
      case 'base':
      case 'barracks':
        // Buildings are squares
        graphics.rect(-size, -size, size * 2, size * 2);
        graphics.fill(color);
        graphics.setStrokeStyle({ width: 2, color: 0x000000 });
        graphics.stroke();
        break;

      case 'resource':
        // Resources are diamonds
        graphics.moveTo(0, -size);
        graphics.lineTo(size, 0);
        graphics.lineTo(0, size);
        graphics.lineTo(-size, 0);
        graphics.closePath();
        graphics.fill(COLORS.resource);
        break;

      default:
        // Combat units are circles
        graphics.circle(0, 0, size);
        graphics.fill(color);
        graphics.setStrokeStyle({ width: 1, color: 0x000000 });
        graphics.stroke();

        // Direction indicator for units with targets
        if (unit.targetPosition || unit.targetId) {
          graphics.moveTo(0, 0);
          graphics.lineTo(size * 0.8, 0);
          graphics.setStrokeStyle({ width: 2, color: 0xFFFFFF });
          graphics.stroke();
        }
    }

    return graphics;
  }

  private drawHealthBar(unit: Unit): Container {
    const container = new Container();
    const width = this.config.tileSize * 0.8;
    const height = 4;
    const yOffset = -this.config.tileSize * 0.4;

    const healthPercent = unit.hp / unit.maxHp;
    const healthColor = healthPercent > 0.3 ? COLORS.health : COLORS.healthLow;

    // Background
    const bg = new Graphics();
    bg.rect(-width / 2, yOffset, width, height);
    bg.fill(0x000000);
    container.addChild(bg);

    // Health fill
    const fill = new Graphics();
    fill.rect(-width / 2, yOffset, width * healthPercent, height);
    fill.fill(healthColor);
    container.addChild(fill);

    return container;
  }

  private drawSelectionIndicator(unit: Unit): Graphics {
    const graphics = new Graphics();
    const size = UNIT_SIZES[unit.type] * this.config.tileSize * 0.5;

    graphics.circle(0, 0, size);
    graphics.setStrokeStyle({ width: 2, color: COLORS.selection, alpha: 0.8 });
    graphics.stroke();

    return graphics;
  }

  private drawUnitLabel(unit: Unit): Text {
    const style = new TextStyle({
      fontSize: 10,
      fill: 0xFFFFFF,
      fontFamily: 'monospace',
    });
    const text = new Text({ text: unit.id.slice(0, 4), style });
    text.anchor.set(0.5);
    text.y = this.config.tileSize * 0.5;
    return text;
  }

  private getTeamColor(team: TeamId): number {
    switch (team) {
      case '0': return COLORS.team0;
      case '1': return COLORS.team1;
      default: return COLORS.neutral;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Selection & Interaction
  // ─────────────────────────────────────────────────────────────

  private setupInteraction(): void {
    // Make stage interactive for background clicks
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
      // Deselect when clicking background
      this.selectUnit(null);

      // Calculate cell position
      if (this.mapData) {
        const tileSize = this.config.tileSize;
        const x = Math.floor(e.global.x / tileSize);
        const y = Math.floor(e.global.y / tileSize);
        this.emit('onCellClick', x, y);
      }
    });
  }

  /**
   * Select a unit by ID (or null to deselect)
   */
  public selectUnit(unitId: string | null): void {
    const previousSelection = this.selectedUnitId;
    this.selectedUnitId = unitId;

    // Re-render previously selected unit to remove selection
    if (previousSelection && this.units.has(previousSelection)) {
      const unit = this.units.get(previousSelection)!;
      this.renderUnit(unit);
    }

    // Re-render newly selected unit to show selection
    if (unitId && this.units.has(unitId)) {
      const unit = this.units.get(unitId)!;
      this.renderUnit(unit);
    }
  }

  /**
   * Get currently selected unit
   */
  public getSelectedUnit(): Unit | null {
    if (!this.selectedUnitId) return null;
    return this.units.get(this.selectedUnitId) ?? null;
  }

  // ─────────────────────────────────────────────────────────────
  // View Control
  // ─────────────────────────────────────────────────────────────

  /**
   * Center view on map
   */
  public centerView(): void {
    if (!this.mapData) return;

    const mapWidth = this.mapData.width * this.config.tileSize;
    const mapHeight = this.mapData.height * this.config.tileSize;
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    this.app.stage.x = (screenWidth - mapWidth) / 2;
    this.app.stage.y = (screenHeight - mapHeight) / 2;
  }

  /**
   * Set zoom level
   */
  public setZoom(scale: number): void {
    this.app.stage.scale.set(scale);
    this.centerView();
  }

  // ─────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────

  public setShowGrid(show: boolean): void {
    this.config.showGrid = show;
    this.renderMap();
  }

  public setShowHealthBars(show: boolean): void {
    this.config.showHealthBars = show;
    // Re-render units
    for (const unit of this.units.values()) {
      this.renderUnit(unit);
    }
  }

  public setShowUnitIds(show: boolean): void {
    this.config.showUnitIds = show;
    for (const unit of this.units.values()) {
      this.renderUnit(unit);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────

  /**
   * Clear all rendered content
   */
  public clear(): void {
    this.mapLayer.removeChildren();
    this.gridLayer.removeChildren();
    this.unitLayer.removeChildren();
    this.effectLayer.removeChildren();
    this.uiLayer.removeChildren();

    this.units.clear();
    this.unitGraphics.clear();
    this.mapData = null;
    this.selectedUnitId = null;
    this.hoveredUnitId = null;
  }

  /**
   * Dispose of renderer and release resources
   */
  public dispose(): void {
    this.clear();
    this.app.destroy(true, { children: true });
    this.events = {};
  }

  // ─────────────────────────────────────────────────────────────
  // Accessors
  // ─────────────────────────────────────────────────────────────

  public getApp(): Application {
    return this.app;
  }

  public getTileSize(): number {
    return this.config.tileSize;
  }
}

// ─────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────

export async function createPixiRenderer(
  config: PixiRendererConfig
): Promise<PixiRenderer> {
  return PixiRenderer.create(config);
}
