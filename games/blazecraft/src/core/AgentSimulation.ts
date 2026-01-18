/**
 * AgentSimulation - Agent movement and visual representation
 *
 * Manages agent units that move between districts on the city map.
 * Inspired by Warcraft III unit movement with smooth interpolation.
 *
 * Features:
 * - Bezier curve path generation between districts
 * - Status-based movement speed
 * - Visual idle/working/moving animations
 * - Agent selection and click handling
 */

import {
  Container,
  Graphics,
  Text,
  TextStyle,
} from 'pixi.js';

import type { BuildingKind } from './BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AgentVisual {
  id: string;
  name: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number } | null;
  container: Container;
  sprite: Graphics;
  label: Text;
  status: 'idle' | 'moving' | 'working';
  region: BuildingKind;
  animationProgress: number;
  pathPoints: { x: number; y: number }[];
}

export interface AgentSimulationConfig {
  onAgentClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const AGENT_COLORS = {
  idle: 0xF39C12,    // Yellow/gold
  working: 0x2ECC71, // Green
  moving: 0x3498DB,  // Blue
};

const REGION_COLORS: Record<BuildingKind, number> = {
  townhall: 0xFFD700,
  workshop: 0xBF5700,
  market: 0x2ECC71,
  barracks: 0xE74C3C,
  stables: 0x3498DB,
  library: 0x9B59B6,
};

// District positions matching CityWorldRenderer
const DISTRICT_SCREEN_POSITIONS: Record<BuildingKind, { x: number; y: number }> = {
  townhall: { x: 0, y: 0 },
  workshop: { x: -80, y: -20 },
  market: { x: 80, y: -20 },
  barracks: { x: 80, y: 60 },
  stables: { x: -80, y: 60 },
  library: { x: 0, y: 100 },
};

const MOVEMENT_SPEED = 0.015; // Progress per frame (0-1 over ~67 frames / ~1s)
const IDLE_BOB_SPEED = 0.05;
const IDLE_BOB_AMOUNT = 2;

// ─────────────────────────────────────────────────────────────
// AgentSimulation Class
// ─────────────────────────────────────────────────────────────

export class AgentSimulation {
  private agents: Map<string, AgentVisual> = new Map();
  private agentLayer: Container;
  private config: AgentSimulationConfig;
  private animationFrame = 0;
  private hoveredAgent: string | null = null;

  constructor(agentLayer: Container, config: AgentSimulationConfig = {}) {
    this.agentLayer = agentLayer;
    this.config = config;
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Add a new agent to the simulation
   */
  addAgent(id: string, name: string, region: BuildingKind): void {
    if (this.agents.has(id)) {
      // Update existing agent
      this.updateAgentRegion(id, region);
      return;
    }

    const position = this.getDistrictPosition(region);

    // Create container
    const container = new Container();
    container.x = position.x;
    container.y = position.y;

    // Create agent sprite
    const sprite = this.createAgentSprite('working');
    container.addChild(sprite);

    // Create name label
    const label = new Text({
      text: name,
      style: new TextStyle({
        fontFamily: 'Inter, sans-serif',
        fontSize: 9,
        fontWeight: '600',
        fill: 0xF5F5DC,
        dropShadow: {
          color: 0x000000,
          blur: 2,
          distance: 1,
          angle: Math.PI / 4,
        },
      }),
    });
    label.anchor.set(0.5);
    label.y = -25;
    container.addChild(label);

    // Setup interaction
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => {
      this.config.onAgentClick?.(id);
    });
    container.on('pointerover', () => {
      this.hoveredAgent = id;
      this.config.onAgentHover?.(id);
      this.highlightAgent(id, true);
    });
    container.on('pointerout', () => {
      this.hoveredAgent = null;
      this.config.onAgentHover?.(null);
      this.highlightAgent(id, false);
    });

    // Store agent
    const agent: AgentVisual = {
      id,
      name,
      position: { ...position },
      targetPosition: null,
      container,
      sprite,
      label,
      status: 'working',
      region,
      animationProgress: 0,
      pathPoints: [],
    };

    this.agents.set(id, agent);
    this.agentLayer.addChild(container);
  }

  /**
   * Remove an agent from the simulation
   */
  removeAgent(id: string): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    this.agentLayer.removeChild(agent.container);
    agent.container.destroy({ children: true });
    this.agents.delete(id);
  }

  /**
   * Move an agent to a different district
   */
  moveAgent(id: string, targetRegion: BuildingKind): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    const targetPos = this.getDistrictPosition(targetRegion);

    // Generate Bezier path
    agent.pathPoints = this.generatePath(agent.position, targetPos);
    agent.targetPosition = targetPos;
    agent.animationProgress = 0;
    agent.status = 'moving';
    agent.region = targetRegion;

    this.updateAgentSprite(agent);
  }

  /**
   * Update agent region without animation
   */
  updateAgentRegion(id: string, region: BuildingKind): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    const position = this.getDistrictPosition(region);
    agent.position = { ...position };
    agent.container.x = position.x;
    agent.container.y = position.y;
    agent.region = region;
    agent.status = 'working';
    this.updateAgentSprite(agent);
  }

  /**
   * Update agent status
   */
  setAgentStatus(id: string, status: 'idle' | 'moving' | 'working'): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    agent.status = status;
    this.updateAgentSprite(agent);
  }

  /**
   * Animation tick - call each frame
   */
  update(deltaTime: number = 1): void {
    this.animationFrame += deltaTime;

    for (const agent of this.agents.values()) {
      if (agent.status === 'moving' && agent.targetPosition) {
        // Update movement progress
        agent.animationProgress += MOVEMENT_SPEED * deltaTime;

        if (agent.animationProgress >= 1) {
          // Movement complete
          agent.animationProgress = 1;
          agent.position = { ...agent.targetPosition };
          agent.targetPosition = null;
          agent.pathPoints = [];
          agent.status = 'working';
          this.updateAgentSprite(agent);
        } else {
          // Interpolate along path
          const pos = this.interpolatePath(agent.pathPoints, agent.animationProgress);
          agent.position = pos;
        }

        agent.container.x = agent.position.x;
        agent.container.y = agent.position.y;
      } else if (agent.status === 'idle' || agent.status === 'working') {
        // Idle bobbing animation
        const bobOffset = Math.sin(this.animationFrame * IDLE_BOB_SPEED) * IDLE_BOB_AMOUNT;
        agent.container.y = agent.position.y + bobOffset;
      }
    }
  }

  /**
   * Get all agent IDs
   */
  getAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentVisual | undefined {
    return this.agents.get(id);
  }

  /**
   * Clear all agents
   */
  clear(): void {
    for (const agent of this.agents.values()) {
      this.agentLayer.removeChild(agent.container);
      agent.container.destroy({ children: true });
    }
    this.agents.clear();
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private getDistrictPosition(region: BuildingKind): { x: number; y: number } {
    const pos = DISTRICT_SCREEN_POSITIONS[region] ?? DISTRICT_SCREEN_POSITIONS.townhall;
    // Add small random offset so agents don't stack
    const jitter = 15;
    return {
      x: pos.x + (Math.random() - 0.5) * jitter,
      y: pos.y + (Math.random() - 0.5) * jitter - 10, // Slightly above building
    };
  }

  private createAgentSprite(status: 'idle' | 'moving' | 'working'): Graphics {
    const g = new Graphics();
    const color = AGENT_COLORS[status];

    // --- Shadow (ground plane) ---
    g.ellipse(0, 4, 7, 3);
    g.fill({ color: 0x000000, alpha: 0.35 });

    // --- Body (torso) - rounded rectangle shape ---
    g.roundRect(-5, -12, 10, 14, 3);
    g.fill({ color: 0x4A4A4A }); // Dark gray body
    g.setStrokeStyle({ width: 1, color: 0x2A2A2A });
    g.stroke();

    // --- Belt/waist detail ---
    g.rect(-5, -4, 10, 3);
    g.fill({ color: 0x8B4513 }); // Brown leather belt

    // --- Head (circle with slight highlight) ---
    g.circle(0, -16, 5);
    g.fill({ color: 0xE8C4A0 }); // Skin tone
    g.setStrokeStyle({ width: 1, color: 0xA88060 });
    g.stroke();

    // --- Eyes (two dots) ---
    g.circle(-2, -17, 1);
    g.fill({ color: 0x2A2A2A });
    g.circle(2, -17, 1);
    g.fill({ color: 0x2A2A2A });

    // --- Hard hat / helmet (status-colored) ---
    g.moveTo(-5, -20);
    g.lineTo(5, -20);
    g.lineTo(4, -23);
    g.lineTo(-4, -23);
    g.closePath();
    g.fill({ color });
    g.setStrokeStyle({ width: 1, color: 0x000000, alpha: 0.4 });
    g.stroke();

    // --- Hat brim ---
    g.rect(-6, -20, 12, 2);
    g.fill({ color });

    // --- Status glow ring around worker ---
    g.circle(0, -10, 14);
    g.setStrokeStyle({ width: 2, color, alpha: 0.4 });
    g.stroke();

    // --- Arms (small rectangles on sides) ---
    // Left arm
    g.roundRect(-8, -10, 4, 8, 1);
    g.fill({ color: 0xE8C4A0 });
    // Right arm
    g.roundRect(4, -10, 4, 8, 1);
    g.fill({ color: 0xE8C4A0 });

    // --- Tool based on status ---
    if (status === 'working') {
      // Hammer in right hand
      g.rect(6, -14, 2, 10); // Handle
      g.fill({ color: 0x8B4513 });
      g.rect(4, -16, 6, 4); // Head
      g.fill({ color: 0x888888 });
    } else if (status === 'moving') {
      // Clipboard/plans
      g.rect(5, -8, 5, 7);
      g.fill({ color: 0xF5F5DC });
      g.setStrokeStyle({ width: 1, color: 0x888888 });
      g.stroke();
    }
    // Idle: no tool, hands at sides

    return g;
  }

  private updateAgentSprite(agent: AgentVisual): void {
    // Remove old sprite
    agent.container.removeChild(agent.sprite);
    agent.sprite.destroy();

    // Create new sprite
    agent.sprite = this.createAgentSprite(agent.status);
    agent.container.addChildAt(agent.sprite, 0);
  }

  private highlightAgent(id: string, highlighted: boolean): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    if (highlighted) {
      agent.container.scale.set(1.2);
      agent.label.style.fill = 0xFFD700; // Gold
    } else {
      agent.container.scale.set(1);
      agent.label.style.fill = 0xF5F5DC; // Cream
    }
  }

  /**
   * Generate a curved path between two points
   */
  private generatePath(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    // Control point for curve (offset perpendicular to line)
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const perpX = -(end.y - start.y) * 0.3;
    const perpY = (end.x - start.x) * 0.3;
    const controlX = midX + perpX;
    const controlY = midY + perpY;

    // Generate points along quadratic Bezier curve
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlX + t * t * end.x;
      const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlY + t * t * end.y;
      points.push({ x, y });
    }

    return points;
  }

  /**
   * Interpolate position along path
   */
  private interpolatePath(
    points: { x: number; y: number }[],
    progress: number
  ): { x: number; y: number } {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];

    const index = Math.min(
      Math.floor(progress * (points.length - 1)),
      points.length - 2
    );
    const localProgress = (progress * (points.length - 1)) - index;

    const p0 = points[index];
    const p1 = points[index + 1];

    return {
      x: p0.x + (p1.x - p0.x) * localProgress,
      y: p0.y + (p1.y - p0.y) * localProgress,
    };
  }
}

/**
 * Factory function
 */
export function createAgentSimulation(
  agentLayer: Container,
  config: AgentSimulationConfig = {}
): AgentSimulation {
  return new AgentSimulation(agentLayer, config);
}
