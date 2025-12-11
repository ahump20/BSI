/**
 * 3D Stat Comparison Visualization
 *
 * Interactive 3D visualization for comparing player statistics
 * using bar charts, radial graphs, and floating data points.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { threeColors } from '../../styles/tokens/colors';
import { createDataGlowMaterial, createHolographicMaterial } from '../shaders/DataVisualizationShaders';

// Stat data interface
export interface StatData {
  name: string;
  value: number;
  max?: number;      // Maximum possible value for scaling
  color?: number;    // Optional custom color
  label?: string;    // Display label
}

export interface PlayerStats {
  name: string;
  position?: string;
  team?: string;
  stats: StatData[];
  color?: number;    // Player's color for visualization
}

export interface StatComparison3DConfig {
  scale?: number;
  type?: 'bar' | 'radial' | 'floating';
  animated?: boolean;
  animationDuration?: number;
  showLabels?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  maxBars?: number;
  barWidth?: number;
  barSpacing?: number;
  radialRadius?: number;
  radialInnerRadius?: number;
  glowIntensity?: number;
  holographic?: boolean;
}

/**
 * 3D Statistics Comparison Visualization
 */
export class StatComparison3D extends THREE.Object3D {
  private config: Required<StatComparison3DConfig>;
  private players: PlayerStats[] = [];

  // Visual elements
  private bars: THREE.Group;
  private labels: THREE.Group;
  private grid: THREE.Group;
  private radialChart: THREE.Group;
  private floatingPoints: THREE.Group;

  // Animation state
  private time: number = 0;
  private animationProgress: number = 0;
  private isAnimating: boolean = false;

  // Materials
  private playerMaterials: Map<string, THREE.ShaderMaterial> = new Map();

  private static defaultConfig: Required<StatComparison3DConfig> = {
    scale: 1,
    type: 'bar',
    animated: true,
    animationDuration: 1.5,
    showLabels: true,
    showValues: true,
    showGrid: true,
    maxBars: 10,
    barWidth: 2,
    barSpacing: 1,
    radialRadius: 30,
    radialInnerRadius: 10,
    glowIntensity: 1.2,
    holographic: false,
  };

  // Default colors for players
  private static playerColors = [
    threeColors.burntOrange,
    0x3B82F6, // Blue
    0x22C55E, // Green
    0x8B5CF6, // Purple
    0xEC4899, // Pink
  ];

  constructor(config?: StatComparison3DConfig) {
    super();
    this.config = { ...StatComparison3D.defaultConfig, ...config };

    this.bars = new THREE.Group();
    this.labels = new THREE.Group();
    this.grid = new THREE.Group();
    this.radialChart = new THREE.Group();
    this.floatingPoints = new THREE.Group();

    this.add(this.bars);
    this.add(this.labels);
    this.add(this.grid);
    this.add(this.radialChart);
    this.add(this.floatingPoints);

    if (this.config.showGrid) {
      this.createGrid();
    }
  }

  /**
   * Create background grid
   */
  private createGrid(): void {
    const s = this.config.scale;

    const gridHelper = new THREE.GridHelper(100 * s, 20, 0x333333, 0x222222);
    gridHelper.position.y = 0;
    this.grid.add(gridHelper);

    // Add glowing floor plane
    const floorGeometry = new THREE.PlaneGeometry(100 * s, 100 * s);
    const floorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(threeColors.burntOrange) },
        opacity: { value: 0.05 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * opacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    this.grid.add(floor);
  }

  /**
   * Set player data for comparison
   */
  public setPlayers(players: PlayerStats[]): void {
    this.players = players;

    // Assign colors to players
    players.forEach((player, i) => {
      if (!player.color) {
        player.color = StatComparison3D.playerColors[i % StatComparison3D.playerColors.length];
      }

      // Create material for player
      const material = this.config.holographic
        ? createHolographicMaterial({ primaryColor: new THREE.Color(player.color) })
        : createDataGlowMaterial({ baseColor: new THREE.Color(player.color) });

      this.playerMaterials.set(player.name, material);
    });

    // Build visualization
    this.buildVisualization();

    // Start animation
    if (this.config.animated) {
      this.animationProgress = 0;
      this.isAnimating = true;
    } else {
      this.animationProgress = 1;
    }
  }

  /**
   * Build the appropriate visualization type
   */
  private buildVisualization(): void {
    // Clear existing
    this.clearVisualization();

    switch (this.config.type) {
      case 'bar':
        this.buildBarChart();
        break;
      case 'radial':
        this.buildRadialChart();
        break;
      case 'floating':
        this.buildFloatingPoints();
        break;
    }
  }

  /**
   * Clear all visualization elements
   */
  private clearVisualization(): void {
    [this.bars, this.radialChart, this.floatingPoints].forEach((group) => {
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      }
    });
  }

  /**
   * Build 3D bar chart
   */
  private buildBarChart(): void {
    if (this.players.length === 0) return;

    const s = this.config.scale;
    const barWidth = this.config.barWidth * s;
    const spacing = this.config.barSpacing * s;

    // Get all unique stat names
    const statNames = this.players[0].stats.slice(0, this.config.maxBars).map((stat) => stat.name);
    const numStats = statNames.length;
    const numPlayers = this.players.length;

    // Calculate total width
    const groupWidth = barWidth * numPlayers + spacing * (numPlayers - 1);
    const totalWidth = groupWidth * numStats + spacing * 2 * (numStats - 1);
    const startX = -totalWidth / 2 + groupWidth / 2;

    statNames.forEach((statName, statIndex) => {
      const groupX = startX + statIndex * (groupWidth + spacing * 2);

      this.players.forEach((player, playerIndex) => {
        const stat = player.stats.find((s) => s.name === statName);
        if (!stat) return;

        const barX = groupX + (playerIndex - (numPlayers - 1) / 2) * (barWidth + spacing);
        const normalizedValue = stat.max ? stat.value / stat.max : stat.value / 100;
        const barHeight = normalizedValue * 30 * s;

        // Create bar geometry
        const geometry = new THREE.BoxGeometry(barWidth, barHeight, barWidth);

        // Get player material or create default
        let material = this.playerMaterials.get(player.name);
        if (!material) {
          material = createDataGlowMaterial({ value: normalizedValue });
        }

        const bar = new THREE.Mesh(geometry, material.clone());
        bar.position.set(barX, barHeight / 2, 0);
        bar.castShadow = true;
        bar.receiveShadow = true;

        // Store metadata for animation
        bar.userData = {
          targetHeight: barHeight,
          currentHeight: 0,
          playerIndex,
          statIndex,
        };

        this.bars.add(bar);
      });

      // Add stat label
      if (this.config.showLabels) {
        this.addTextLabel(statName, new THREE.Vector3(groupX, -2 * s, 0), 0.8);
      }
    });
  }

  /**
   * Build radial chart (spider/radar)
   */
  private buildRadialChart(): void {
    if (this.players.length === 0) return;

    const s = this.config.scale;
    const radius = this.config.radialRadius * s;
    const innerRadius = this.config.radialInnerRadius * s;

    // Get stat names
    const statNames = this.players[0].stats.map((stat) => stat.name);
    const numStats = statNames.length;
    const angleStep = (Math.PI * 2) / numStats;

    // Draw axis lines
    statNames.forEach((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, 0, z),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(geometry, material);
      this.radialChart.add(line);
    });

    // Draw concentric circles
    for (let r = 0.25; r <= 1; r += 0.25) {
      const circlePoints: THREE.Vector3[] = [];
      for (let i = 0; i <= numStats; i++) {
        const angle = i * angleStep - Math.PI / 2;
        circlePoints.push(new THREE.Vector3(
          Math.cos(angle) * radius * r,
          0,
          Math.sin(angle) * radius * r
        ));
      }
      const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
      const circleMaterial = new THREE.LineBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3,
      });
      const circle = new THREE.Line(circleGeometry, circleMaterial);
      this.radialChart.add(circle);
    }

    // Draw player data polygons
    this.players.forEach((player, playerIndex) => {
      const points: THREE.Vector3[] = [];

      player.stats.forEach((stat, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const normalizedValue = stat.max ? stat.value / stat.max : stat.value / 100;
        const r = innerRadius + (radius - innerRadius) * normalizedValue;

        points.push(new THREE.Vector3(
          Math.cos(angle) * r,
          playerIndex * 0.5 * s, // Slight Y offset for multiple players
          Math.sin(angle) * r
        ));
      });

      // Close the polygon
      points.push(points[0].clone());

      // Create line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: player.color || StatComparison3D.playerColors[playerIndex],
        linewidth: 2,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);

      // Store for animation
      line.userData = {
        targetPoints: points.map((p) => p.clone()),
        currentScale: 0,
        playerIndex,
      };

      this.radialChart.add(line);

      // Create filled area
      const areaShape = new THREE.Shape();
      areaShape.moveTo(points[0].x, points[0].z);
      for (let i = 1; i < points.length; i++) {
        areaShape.lineTo(points[i].x, points[i].z);
      }

      const areaGeometry = new THREE.ShapeGeometry(areaShape);
      areaGeometry.rotateX(-Math.PI / 2);

      const areaMaterial = new THREE.MeshBasicMaterial({
        color: player.color || StatComparison3D.playerColors[playerIndex],
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });

      const area = new THREE.Mesh(areaGeometry, areaMaterial);
      area.position.y = playerIndex * 0.5 * s;
      this.radialChart.add(area);
    });

    // Add stat labels
    if (this.config.showLabels) {
      statNames.forEach((name, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radius * 1.15;
        this.addTextLabel(
          name,
          new THREE.Vector3(
            Math.cos(angle) * labelRadius,
            0,
            Math.sin(angle) * labelRadius
          ),
          0.6
        );
      });
    }
  }

  /**
   * Build floating point cloud visualization
   */
  private buildFloatingPoints(): void {
    if (this.players.length === 0) return;

    const s = this.config.scale;

    this.players.forEach((player, playerIndex) => {
      const playerGroup = new THREE.Group();
      const color = player.color || StatComparison3D.playerColors[playerIndex];

      player.stats.forEach((stat, statIndex) => {
        const normalizedValue = stat.max ? stat.value / stat.max : stat.value / 100;

        // Position in 3D space
        const theta = (statIndex / player.stats.length) * Math.PI * 2;
        const phi = (playerIndex / this.players.length) * Math.PI - Math.PI / 2;
        const r = 20 * s + normalizedValue * 30 * s;

        const x = r * Math.cos(theta) * Math.cos(phi);
        const y = normalizedValue * 30 * s;
        const z = r * Math.sin(theta) * Math.cos(phi);

        // Create point sphere
        const geometry = new THREE.SphereGeometry(0.5 * s + normalizedValue * 1 * s, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.6 + normalizedValue * 0.4,
        });

        const point = new THREE.Mesh(geometry, material);
        point.position.set(x, y, z);

        // Store for animation
        point.userData = {
          targetPosition: new THREE.Vector3(x, y, z),
          startPosition: new THREE.Vector3(0, 0, 0),
          statIndex,
          value: normalizedValue,
        };

        playerGroup.add(point);

        // Add glow
        const glowGeometry = new THREE.SphereGeometry(1 * s + normalizedValue * 1.5 * s, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.1 + normalizedValue * 0.1,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(point.position);
        playerGroup.add(glow);

        // Connect to center
        const linePoints = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(x, y, z),
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.2,
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        playerGroup.add(line);
      });

      this.floatingPoints.add(playerGroup);
    });
  }

  /**
   * Add text label (using sprite for simplicity)
   */
  private addTextLabel(text: string, position: THREE.Vector3, size: number = 1): void {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = '#FAF8F5';
    context.font = 'bold 24px IBM Plex Sans';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.scale.set(8 * size * this.config.scale, 2 * size * this.config.scale, 1);

    this.labels.add(sprite);
  }

  /**
   * Update animation
   */
  public update(delta: number): void {
    this.time += delta;

    // Animate entrance
    if (this.isAnimating) {
      this.animationProgress += delta / this.config.animationDuration;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.isAnimating = false;
      }

      const eased = this.easeOutCubic(this.animationProgress);
      this.applyAnimation(eased);
    }

    // Update shader uniforms
    for (const material of this.playerMaterials.values()) {
      if (material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = this.time;
      }
    }

    // Floating animation for floating points
    if (this.config.type === 'floating') {
      this.floatingPoints.children.forEach((group, i) => {
        group.rotation.y = this.time * 0.1 + i * 0.5;
      });
    }
  }

  /**
   * Apply animation progress
   */
  private applyAnimation(progress: number): void {
    // Animate bars
    this.bars.children.forEach((bar) => {
      if (bar instanceof THREE.Mesh && bar.userData.targetHeight) {
        const targetHeight = bar.userData.targetHeight;
        const currentHeight = targetHeight * progress;
        bar.scale.y = Math.max(0.001, progress);
        bar.position.y = (currentHeight * bar.scale.y) / 2;
      }
    });

    // Animate floating points
    this.floatingPoints.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.targetPosition) {
        child.position.lerpVectors(
          child.userData.startPosition,
          child.userData.targetPosition,
          progress
        );
      }
    });
  }

  /**
   * Easing function
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Change visualization type
   */
  public setType(type: StatComparison3DConfig['type']): void {
    if (this.config.type === type) return;
    this.config.type = type!;
    this.buildVisualization();

    if (this.config.animated) {
      this.animationProgress = 0;
      this.isAnimating = true;
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.clearVisualization();

    this.grid.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });

    this.labels.traverse((child) => {
      if (child instanceof THREE.Sprite) {
        child.material.dispose();
        if (child.material.map) {
          child.material.map.dispose();
        }
      }
    });

    for (const material of this.playerMaterials.values()) {
      material.dispose();
    }
  }
}

export default StatComparison3D;
