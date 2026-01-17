/**
 * IsometricWorldRenderer - Three.js based Night Elf themed isometric city
 *
 * Renders the Night Elf floating island city with 6 districts and units.
 * Falls back to CSS-based isometric tiles if WebGL unavailable.
 *
 * Architecture:
 * - Loads assets from manifest.json (v1 or v2)
 * - Manages district visibility and selection
 * - Handles building tier upgrades with visual feedback
 * - Supports unit loading and placement
 * - Handles emissive/glow materials for Night Elf aesthetic
 * - Provides moonlit atmosphere with fog and particles
 * - Provides minimap texture generation
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { BuildingKind, Tier, CityState } from './BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface WorldManifest {
  version: string;
  name: string;
  theme?: 'default' | 'night_elf';
  grid: {
    tileSize: number;
    width: number;
    height: number;
  };
  camera: {
    type: 'orthographic' | 'perspective';
    angle: number;
    pitch: number;
    zoom: number;
  };
  districts: Record<string, DistrictConfig>;
  units?: Record<string, UnitConfig>;
  props?: Record<string, PropConfig>;
  lighting?: LightingConfig;
  atmosphere?: AtmosphereConfig;
  fallback: {
    enabled: boolean;
    colors: Record<string, string>;
  };
}

export interface UnitConfig {
  id: string;
  displayName: string;
  description: string;
  asset: string;
  type: 'worker' | 'ranged' | 'melee' | 'heavy' | 'hero';
  speed: number;
  scale: number;
  glowColor?: string;
  glowIntensity?: number;
}

export interface PropConfig {
  asset: string;
  scale: number;
  emissive?: boolean;
  glowColor?: string;
}

export interface LightingConfig {
  ambient: { color: string; intensity: number };
  directional: { color: string; intensity: number; position: { x: number; y: number; z: number } };
  moonlight?: { color: string; intensity: number; position: { x: number; y: number; z: number } };
  fog?: { color: string; near: number; far: number };
}

export interface AtmosphereConfig {
  timeOfDay: 'day' | 'night' | 'dusk' | 'dawn';
  moonPhase?: string;
  particles?: {
    wisps?: { enabled: boolean; count: number; color: string; speed: number };
    fireflies?: { enabled: boolean; count: number; color: string; speed: number };
  };
}

export interface DistrictConfig {
  id: string;
  displayName: string;
  description: string;
  gridPosition: { x: number; y: number };
  footprint: { width: number; height: number };
  buildings: {
    tier0: { asset: string; name: string };
    tier1: { asset: string; name: string };
    tier2: { asset: string; name: string };
  };
  terrain: string;
  color: string;
  accent: string;
}

export interface RendererConfig {
  container: HTMLElement;
  assetBasePath?: string;
  assetVersion?: 'v1' | 'v2';  // v1 = original BSI, v2 = Night Elf theme
  enableShadows?: boolean;
  enablePostProcessing?: boolean;
  onDistrictClick?: (districtId: string) => void;
  onDistrictHover?: (districtId: string | null) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

interface DistrictObject {
  id: string;
  group: THREE.Group;
  pad: THREE.Mesh;
  building: THREE.Object3D | null;
  tier: Tier;
  label: THREE.Sprite;
  units: UnitObject[];
}

interface UnitObject {
  id: string;
  type: string;
  model: THREE.Object3D;
  position: THREE.Vector3;
  districtId: string;
}

interface ParticleSystem {
  group: THREE.Group;
  particles: THREE.Mesh[];
  speeds: number[];
  colors: number[];
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const COLORS = {
  // Night Elf theme colors
  ancientPurple: 0x5B3A89,
  moonsilver: 0xC0C0C0,
  eluneGlow: 0x00FFFF,
  ancientBark: 0x3D2817,
  silverleaf: 0x7B9E89,
  shadowPurple: 0x2D1B4E,
  moonWhite: 0xE8E8F0,
  deepViolet: 0x4C2574,
  twilightBlue: 0x323F74,
  forestShadow: 0x1F2E25,

  // Legacy BSI colors (for v1 compatibility)
  burntOrange: 0xBF5700,
  texasSoil: 0x8B4513,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  ember: 0xFF6B35,
  cream: 0xF5F5DC,

  // UI colors
  selection: 0xFFFFFF,
  hover: 0x00FFFF,
};

// Night Elf district colors (v2)
const NIGHT_ELF_DISTRICT_COLORS: Record<string, number> = {
  tree_of_life: 0x5B3A89,
  ancient_of_lore: 0x4C2574,
  moon_wells: 0x323F74,
  ancient_of_war: 0x3D2817,
  chimaera_roost: 0x7B9E89,
  ancient_of_wonders: 0x2D1B4E,
};

// Legacy district colors (v1)
const DISTRICT_COLORS: Record<BuildingKind, number> = {
  townhall: 0xFFD700,
  workshop: 0xBF5700,
  market: 0x2ECC71,
  barracks: 0xE74C3C,
  stables: 0x3498DB,
  library: 0x9B59B6,
};

// ─────────────────────────────────────────────────────────────
// IsometricWorldRenderer Class
// ─────────────────────────────────────────────────────────────

export class IsometricWorldRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private config: RendererConfig;
  private manifest: WorldManifest | null = null;

  private gltfLoader: GLTFLoader;
  private loadedAssets: Map<string, THREE.Object3D> = new Map();
  private districts: Map<string, DistrictObject> = new Map();

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredDistrict: string | null = null;
  private selectedDistrict: string | null = null;

  private units: Map<string, UnitObject> = new Map();
  private particleSystems: ParticleSystem[] = [];
  private isNightElfTheme = false;

  private isReady = false;
  private disposed = false;

  // ─────────────────────────────────────────────────────────────
  // Constructor & Initialization
  // ─────────────────────────────────────────────────────────────

  constructor(config: RendererConfig) {
    const version = config.assetVersion ?? 'v2';
    this.config = {
      assetBasePath: config.assetBasePath ?? `/assets/world/${version}`,
      assetVersion: version,
      enableShadows: true,
      enablePostProcessing: false,
      ...config,
    };
    this.container = config.container;

    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.midnight);

    // Orthographic camera for isometric view
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const frustumSize = 15;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      0.1,
      1000
    );

    // Set isometric camera position (45 degrees, 30 degree pitch)
    const distance = 20;
    const angle = Math.PI / 4; // 45 degrees
    const pitch = Math.PI / 6; // 30 degrees
    this.camera.position.set(
      Math.cos(angle) * distance * Math.cos(pitch),
      distance * Math.sin(pitch),
      Math.sin(angle) * distance * Math.cos(pitch)
    );
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.maxPolarAngle = Math.PI / 2.5;
    this.controls.minPolarAngle = Math.PI / 6;

    // Loaders
    this.gltfLoader = new GLTFLoader();

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Event listeners
    this.setupEventListeners();

    // Setup lighting
    this.setupLighting();

    // Start render loop
    this.animate();
  }

  // ─────────────────────────────────────────────────────────────
  // Setup Methods
  // ─────────────────────────────────────────────────────────────

  private setupLighting(): void {
    // Default lighting - will be overridden by setupNightElfLighting if theme is night_elf
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xFFFAF0, 1.0);
    directional.position.set(10, 15, 10);
    directional.castShadow = this.config.enableShadows ?? false;

    if (this.config.enableShadows) {
      directional.shadow.mapSize.width = 2048;
      directional.shadow.mapSize.height = 2048;
      directional.shadow.camera.near = 0.5;
      directional.shadow.camera.far = 50;
      directional.shadow.camera.left = -20;
      directional.shadow.camera.right = 20;
      directional.shadow.camera.top = 20;
      directional.shadow.camera.bottom = -20;
    }

    this.scene.add(directional);

    const fill = new THREE.DirectionalLight(0x88AAFF, 0.3);
    fill.position.set(-5, 5, -5);
    this.scene.add(fill);
  }

  private setupNightElfLighting(): void {
    // Clear existing lights
    const lightsToRemove: THREE.Light[] = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Light) {
        lightsToRemove.push(obj);
      }
    });
    lightsToRemove.forEach((light) => this.scene.remove(light));

    // Night atmosphere background
    this.scene.background = new THREE.Color(0x0D0D1A);

    // Dim ambient light (moonlit night)
    const ambient = new THREE.AmbientLight(0x1A1A2E, 0.3);
    this.scene.add(ambient);

    // Moonlight (cool blue-white)
    const moonlight = new THREE.DirectionalLight(0xA0A0E0, 0.8);
    moonlight.position.set(-5, 20, 5);
    moonlight.castShadow = this.config.enableShadows ?? false;

    if (this.config.enableShadows) {
      moonlight.shadow.mapSize.width = 2048;
      moonlight.shadow.mapSize.height = 2048;
      moonlight.shadow.camera.near = 0.5;
      moonlight.shadow.camera.far = 50;
      moonlight.shadow.camera.left = -20;
      moonlight.shadow.camera.right = 20;
      moonlight.shadow.camera.top = 20;
      moonlight.shadow.camera.bottom = -20;
    }

    this.scene.add(moonlight);

    // Secondary moonlight (fill)
    const moonFill = new THREE.DirectionalLight(0xE8E8F0, 0.4);
    moonFill.position.set(3, 15, -3);
    this.scene.add(moonFill);

    // Elune glow (subtle cyan rim light)
    const eluneGlow = new THREE.PointLight(0x00FFFF, 0.3, 30);
    eluneGlow.position.set(0, 5, 0);
    this.scene.add(eluneGlow);

    // Add fog for atmosphere
    this.scene.fog = new THREE.Fog(0x0D0D1A, 15, 50);
  }

  private setupAtmosphereParticles(): void {
    if (!this.manifest?.atmosphere?.particles) return;

    const { wisps, fireflies } = this.manifest.atmosphere.particles;

    // Wisp particles
    if (wisps?.enabled) {
      const wispSystem = this.createParticleSystem(
        wisps.count,
        new THREE.Color(wisps.color),
        wisps.speed,
        0.15
      );
      this.particleSystems.push(wispSystem);
      this.scene.add(wispSystem.group);
    }

    // Firefly particles
    if (fireflies?.enabled) {
      const fireflySystem = this.createParticleSystem(
        fireflies.count,
        new THREE.Color(fireflies.color),
        fireflies.speed,
        0.05
      );
      this.particleSystems.push(fireflySystem);
      this.scene.add(fireflySystem.group);
    }
  }

  private createParticleSystem(count: number, color: THREE.Color, speed: number, size: number): ParticleSystem {
    const group = new THREE.Group();
    const particles: THREE.Mesh[] = [];
    const speeds: number[] = [];

    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 20
      );
      particles.push(mesh);
      speeds.push(speed * (0.5 + Math.random() * 0.5));
      group.add(mesh);
    }

    return { group, particles, speeds, colors: [color.getHex()] };
  }

  private updateParticles(deltaTime: number): void {
    for (const system of this.particleSystems) {
      for (let i = 0; i < system.particles.length; i++) {
        const particle = system.particles[i];
        const speed = system.speeds[i];

        // Gentle floating motion
        particle.position.y += Math.sin(performance.now() * 0.001 + i) * speed * deltaTime;
        particle.position.x += Math.cos(performance.now() * 0.0005 + i * 0.5) * speed * deltaTime * 0.5;

        // Wrap around bounds
        if (particle.position.y > 8) particle.position.y = 1;
        if (particle.position.y < 0.5) particle.position.y = 5;

        // Pulsing glow
        const material = particle.material as THREE.MeshBasicMaterial;
        material.opacity = 0.5 + Math.sin(performance.now() * 0.002 + i) * 0.3;
      }
    }
  }

  private setupEventListeners(): void {
    // Resize handler
    const onResize = () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const aspect = width / height;
      const frustumSize = 15;

      this.camera.left = -frustumSize * aspect;
      this.camera.right = frustumSize * aspect;
      this.camera.top = frustumSize;
      this.camera.bottom = -frustumSize;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // Mouse move for hover
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.updateHover();
    });

    // Click for selection
    this.renderer.domElement.addEventListener('click', () => {
      if (this.hoveredDistrict) {
        this.selectDistrict(this.hoveredDistrict);
        this.config.onDistrictClick?.(this.hoveredDistrict);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Asset Loading
  // ─────────────────────────────────────────────────────────────

  async loadManifest(): Promise<void> {
    try {
      const response = await fetch(`${this.config.assetBasePath}/manifest.json`);
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.statusText}`);
      }
      this.manifest = await response.json();
      await this.buildWorld();
    } catch (error) {
      console.error('[IsometricWorldRenderer] Failed to load manifest:', error);
      this.buildFallbackWorld();
    }
  }

  private async loadGLTF(path: string): Promise<THREE.Object3D | null> {
    if (this.loadedAssets.has(path)) {
      return this.loadedAssets.get(path)!.clone();
    }

    return new Promise((resolve) => {
      const fullPath = `${this.config.assetBasePath}/${path}`;
      this.gltfLoader.load(
        fullPath,
        (gltf) => {
          const model = gltf.scene;
          this.loadedAssets.set(path, model);
          resolve(model.clone());
        },
        undefined,
        (error) => {
          console.warn(`[IsometricWorldRenderer] Failed to load ${path}:`, error);
          resolve(null);
        }
      );
    });
  }

  // ─────────────────────────────────────────────────────────────
  // World Building
  // ─────────────────────────────────────────────────────────────

  private async buildWorld(): Promise<void> {
    if (!this.manifest) return;

    // Detect theme and apply appropriate styling
    this.isNightElfTheme = this.manifest.theme === 'night_elf' ||
                          this.manifest.version.startsWith('2.');

    if (this.isNightElfTheme) {
      this.setupNightElfLighting();
      this.createNightElfIslandBase();
    } else {
      this.createIslandBase();
    }

    // Create districts
    for (const [id, districtConfig] of Object.entries(this.manifest.districts)) {
      await this.createDistrict(id as BuildingKind, districtConfig);
    }

    // Create paths between districts
    this.createPaths();

    // Setup atmosphere particles for Night Elf theme
    if (this.isNightElfTheme) {
      this.setupAtmosphereParticles();
    }

    this.isReady = true;
    this.config.onReady?.();
  }

  private createNightElfIslandBase(): void {
    // Main platform (darker, more mystical)
    const platformGeo = new THREE.CylinderGeometry(12, 14, 2, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1F2E25,  // forestShadow
      roughness: 0.9,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -1;
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Cliff edges (ancient purple stone)
    const cliffGeo = new THREE.ConeGeometry(14, 8, 32);
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x2D1B4E,  // shadowPurple
      roughness: 0.95,
    });
    const cliff = new THREE.Mesh(cliffGeo, cliffMat);
    cliff.position.y = -6;
    cliff.rotation.x = Math.PI;
    this.scene.add(cliff);

    // Glowing roots around the base
    const rootGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 0.3,
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rootGeo = new THREE.TorusGeometry(12, 0.1, 8, 32, Math.PI / 4);
      const root = new THREE.Mesh(rootGeo, rootGlowMat);
      root.position.y = -0.5;
      root.rotation.x = Math.PI / 2;
      root.rotation.z = angle;
      this.scene.add(root);
    }
  }

  private buildFallbackWorld(): void {
    // Fallback: Create simple colored boxes for districts
    const districtPositions: Record<string, [number, number]> = {
      townhall: [0, 0],
      workshop: [-5, -3],
      market: [5, -3],
      barracks: [5, 3],
      stables: [-5, 3],
      library: [0, 5],
    };

    for (const [id, [x, z]] of Object.entries(districtPositions)) {
      const color = DISTRICT_COLORS[id as BuildingKind] ?? 0x888888;
      this.createFallbackDistrict(id as BuildingKind, x, z, color);
    }

    this.createIslandBase();
    this.isReady = true;
    this.config.onReady?.();
  }

  private createIslandBase(): void {
    // Main platform
    const platformGeo = new THREE.CylinderGeometry(12, 14, 2, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x4A5D4A,
      roughness: 0.9,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -1;
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Cliff edges
    const cliffGeo = new THREE.ConeGeometry(14, 8, 32);
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x5D4E37,
      roughness: 0.95,
    });
    const cliff = new THREE.Mesh(cliffGeo, cliffMat);
    cliff.position.y = -6;
    cliff.rotation.x = Math.PI;
    this.scene.add(cliff);
  }

  private async createDistrict(id: BuildingKind, config: DistrictConfig): Promise<void> {
    const group = new THREE.Group();
    const tileSize = this.manifest?.grid.tileSize ?? 2;

    // Calculate position
    const centerX = (this.manifest?.grid.width ?? 12) / 2;
    const centerZ = (this.manifest?.grid.height ?? 12) / 2;
    const x = (config.gridPosition.x - centerX) * tileSize;
    const z = (config.gridPosition.y - centerZ) * tileSize;
    group.position.set(x, 0, z);

    // Create district pad
    const padWidth = config.footprint.width * tileSize;
    const padDepth = config.footprint.height * tileSize;
    const padGeo = new THREE.BoxGeometry(padWidth, 0.2, padDepth);
    const padMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.color),
      roughness: 0.7,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.1;
    pad.receiveShadow = true;
    pad.userData.districtId = id;
    group.add(pad);

    // Create text label
    const label = this.createTextSprite(config.displayName, config.color);
    label.position.y = 4;
    group.add(label);

    // Store district object
    const districtObj: DistrictObject = {
      id,
      group,
      pad,
      building: null,
      tier: 0,
      label,
      units: [],
    };
    this.districts.set(id, districtObj);

    // Try to load tier 0 building
    const buildingModel = await this.loadGLTF(config.buildings.tier0.asset);
    if (buildingModel) {
      buildingModel.position.y = 0.2;
      buildingModel.castShadow = true;
      buildingModel.receiveShadow = true;
      group.add(buildingModel);
      districtObj.building = buildingModel;
    } else {
      // Fallback building
      const fallbackBuilding = this.createFallbackBuilding(config.color, 0);
      group.add(fallbackBuilding);
      districtObj.building = fallbackBuilding;
    }

    this.scene.add(group);
  }

  private createFallbackDistrict(id: BuildingKind, x: number, z: number, color: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Pad
    const padGeo = new THREE.BoxGeometry(3, 0.2, 3);
    const padMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.1;
    pad.receiveShadow = true;
    pad.userData.districtId = id;
    group.add(pad);

    // Fallback building
    const building = this.createFallbackBuilding(`#${color.toString(16).padStart(6, '0')}`, 0);
    group.add(building);

    // Label
    const label = this.createTextSprite(id.charAt(0).toUpperCase() + id.slice(1), `#${color.toString(16).padStart(6, '0')}`);
    label.position.y = 3;
    group.add(label);

    const districtObj: DistrictObject = {
      id,
      group,
      pad,
      building,
      tier: 0,
      label,
      units: [],
    };
    this.districts.set(id, districtObj);
    this.scene.add(group);
  }

  // ─────────────────────────────────────────────────────────────
  // Unit Management
  // ─────────────────────────────────────────────────────────────

  async spawnUnit(unitType: string, districtId: string): Promise<string | null> {
    if (!this.manifest?.units) return null;

    const unitConfig = this.manifest.units[unitType];
    if (!unitConfig) {
      console.warn(`[IsometricWorldRenderer] Unknown unit type: ${unitType}`);
      return null;
    }

    const district = this.districts.get(districtId);
    if (!district) {
      console.warn(`[IsometricWorldRenderer] Unknown district: ${districtId}`);
      return null;
    }

    // Load unit model
    const model = await this.loadGLTF(unitConfig.asset);
    if (!model) {
      // Create fallback unit
      return this.spawnFallbackUnit(unitType, unitConfig, district);
    }

    // Apply scale
    model.scale.setScalar(unitConfig.scale);

    // Apply glow effect if specified
    if (unitConfig.glowColor && unitConfig.glowIntensity) {
      this.applyGlowEffect(model, unitConfig.glowColor, unitConfig.glowIntensity);
    }

    // Position unit in district
    const unitId = `${unitType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offset = this.calculateUnitOffset(district.units.length);
    const position = new THREE.Vector3(
      district.group.position.x + offset.x,
      0.3,
      district.group.position.z + offset.z
    );

    model.position.copy(position);
    model.castShadow = true;
    this.scene.add(model);

    const unitObj: UnitObject = {
      id: unitId,
      type: unitType,
      model,
      position,
      districtId,
    };

    this.units.set(unitId, unitObj);
    district.units.push(unitObj);

    return unitId;
  }

  private spawnFallbackUnit(unitType: string, config: UnitConfig, district: DistrictObject): string {
    const group = new THREE.Group();

    // Simple geometric representation based on unit type
    let geometry: THREE.BufferGeometry;
    let color: number;

    switch (config.type) {
      case 'worker':
        geometry = new THREE.SphereGeometry(0.2, 8, 8);
        color = COLORS.eluneGlow;
        break;
      case 'ranged':
        geometry = new THREE.ConeGeometry(0.15, 0.4, 6);
        color = COLORS.moonsilver;
        break;
      case 'melee':
        geometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
        color = COLORS.ancientPurple;
        break;
      case 'heavy':
        geometry = new THREE.BoxGeometry(0.4, 0.35, 0.5);
        color = COLORS.ancientBark;
        break;
      case 'hero':
        geometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
        color = COLORS.deepViolet;
        break;
      default:
        geometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
        color = COLORS.moonsilver;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      emissive: config.glowColor ? new THREE.Color(config.glowColor) : undefined,
      emissiveIntensity: config.glowIntensity ?? 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.2;
    group.add(mesh);

    // Scale
    group.scale.setScalar(config.scale);

    // Position
    const unitId = `${unitType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offset = this.calculateUnitOffset(district.units.length);
    const position = new THREE.Vector3(
      district.group.position.x + offset.x,
      0.3,
      district.group.position.z + offset.z
    );

    group.position.copy(position);
    group.castShadow = true;
    this.scene.add(group);

    const unitObj: UnitObject = {
      id: unitId,
      type: unitType,
      model: group,
      position,
      districtId: district.id,
    };

    this.units.set(unitId, unitObj);
    district.units.push(unitObj);

    return unitId;
  }

  private calculateUnitOffset(existingUnits: number): { x: number; z: number } {
    // Arrange units in a spiral pattern around the building
    const radius = 1.5 + Math.floor(existingUnits / 8) * 0.5;
    const angle = (existingUnits % 8) * (Math.PI / 4);

    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
    };
  }

  private applyGlowEffect(model: THREE.Object3D, glowColor: string, intensity: number): void {
    const color = new THREE.Color(glowColor);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.isMeshStandardMaterial) {
          material.emissive = color;
          material.emissiveIntensity = intensity;
        }
      }
    });
  }

  removeUnit(unitId: string): boolean {
    const unit = this.units.get(unitId);
    if (!unit) return false;

    // Remove from scene
    this.scene.remove(unit.model);

    // Remove from district's unit list
    const district = this.districts.get(unit.districtId);
    if (district) {
      const index = district.units.findIndex((u) => u.id === unitId);
      if (index !== -1) {
        district.units.splice(index, 1);
      }
    }

    // Remove from units map
    this.units.delete(unitId);

    return true;
  }

  getUnitsInDistrict(districtId: string): UnitObject[] {
    const district = this.districts.get(districtId);
    return district?.units ?? [];
  }

  private createFallbackBuilding(color: string, tier: Tier): THREE.Object3D {
    const group = new THREE.Group();
    const scale = 1 + tier * 0.3;
    const height = 1.5 + tier * 0.8;

    // Main box
    const boxGeo = new THREE.BoxGeometry(1.5 * scale, height, 1.5 * scale);
    const boxMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.75,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = height / 2 + 0.2;
    box.castShadow = true;
    group.add(box);

    // Roof cone
    const roofGeo = new THREE.ConeGeometry(1.1 * scale, 0.8 + tier * 0.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + 0.6 + tier * 0.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    return group;
  }

  private createPaths(): void {
    // Simple path representation - lines between districts
    const pathMat = new THREE.LineBasicMaterial({ color: 0x888888 });

    const townhall = this.districts.get('townhall');
    if (!townhall) return;

    const townhallPos = townhall.group.position.clone();

    for (const [id, district] of this.districts) {
      if (id === 'townhall') continue;

      const points = [
        townhallPos.clone().add(new THREE.Vector3(0, 0.15, 0)),
        district.group.position.clone().add(new THREE.Vector3(0, 0.15, 0)),
      ];

      const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
      const path = new THREE.Line(pathGeo, pathMat);
      this.scene.add(path);
    }
  }

  private createTextSprite(text: string, color: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
    ctx.fill();

    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4, 1, 1);

    return sprite;
  }

  // ─────────────────────────────────────────────────────────────
  // Interaction
  // ─────────────────────────────────────────────────────────────

  private updateHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersectables: THREE.Object3D[] = [];
    for (const district of this.districts.values()) {
      intersectables.push(district.pad);
    }

    const intersects = this.raycaster.intersectObjects(intersectables);

    if (intersects.length > 0) {
      const districtId = intersects[0].object.userData.districtId;
      if (districtId !== this.hoveredDistrict) {
        // Unhover previous
        if (this.hoveredDistrict) {
          this.setDistrictHighlight(this.hoveredDistrict, false);
        }
        // Hover new
        this.hoveredDistrict = districtId;
        this.setDistrictHighlight(districtId, true);
        this.config.onDistrictHover?.(districtId);
      }
    } else if (this.hoveredDistrict) {
      this.setDistrictHighlight(this.hoveredDistrict, false);
      this.hoveredDistrict = null;
      this.config.onDistrictHover?.(null);
    }
  }

  private setDistrictHighlight(districtId: string, highlight: boolean): void {
    const district = this.districts.get(districtId);
    if (!district) return;

    const mat = district.pad.material as THREE.MeshStandardMaterial;
    if (highlight) {
      mat.emissive.setHex(0x333333);
      district.group.position.y = 0.2;
    } else {
      mat.emissive.setHex(0x000000);
      district.group.position.y = 0;
    }
  }

  selectDistrict(districtId: string | null): void {
    // Deselect previous
    if (this.selectedDistrict) {
      const prev = this.districts.get(this.selectedDistrict);
      if (prev) {
        (prev.pad.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      }
    }

    this.selectedDistrict = districtId;

    // Select new
    if (districtId) {
      const district = this.districts.get(districtId);
      if (district) {
        (district.pad.material as THREE.MeshStandardMaterial).emissive.setHex(0x222222);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // State Updates
  // ─────────────────────────────────────────────────────────────

  async updateCityState(state: CityState): Promise<void> {
    for (const [id, buildingState] of Object.entries(state.buildings)) {
      const district = this.districts.get(id);
      if (!district) continue;

      if (buildingState.tier !== district.tier) {
        await this.upgradeBuilding(id as BuildingKind, buildingState.tier);
      }
    }
  }

  private async upgradeBuilding(districtId: BuildingKind, newTier: Tier): Promise<void> {
    const district = this.districts.get(districtId);
    if (!district || !this.manifest) return;

    const config = this.manifest.districts[districtId];
    if (!config) return;

    // Remove old building
    if (district.building) {
      district.group.remove(district.building);
      district.building = null;
    }

    // Load new building
    const tierKey = `tier${newTier}` as keyof typeof config.buildings;
    const buildingConfig = config.buildings[tierKey];
    const buildingModel = await this.loadGLTF(buildingConfig.asset);

    if (buildingModel) {
      buildingModel.position.y = 0.2;
      buildingModel.castShadow = true;
      district.group.add(buildingModel);
      district.building = buildingModel;
    } else {
      // Fallback
      const fallback = this.createFallbackBuilding(config.color, newTier);
      district.group.add(fallback);
      district.building = fallback;
    }

    district.tier = newTier;

    // Play upgrade animation
    this.playUpgradeEffect(district);
  }

  private playUpgradeEffect(district: DistrictObject): void {
    // Simple bounce animation
    const startY = district.group.position.y;
    const duration = 500;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Bounce curve
      const bounce = Math.sin(progress * Math.PI) * 0.5;
      district.group.position.y = startY + bounce;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        district.group.position.y = startY;
      }
    };

    animate();
  }

  // ─────────────────────────────────────────────────────────────
  // Minimap
  // ─────────────────────────────────────────────────────────────

  generateMinimapTexture(width: number = 256, height: number = 256): string {
    // Create offscreen renderer
    const offscreenRenderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    offscreenRenderer.setSize(width, height);

    // Top-down camera
    const minimapCamera = new THREE.OrthographicCamera(-15, 15, 15, -15, 0.1, 100);
    minimapCamera.position.set(0, 30, 0);
    minimapCamera.lookAt(0, 0, 0);

    // Render
    offscreenRenderer.render(this.scene, minimapCamera);

    // Get data URL
    const dataUrl = offscreenRenderer.domElement.toDataURL('image/png');

    // Cleanup
    offscreenRenderer.dispose();

    return dataUrl;
  }

  // ─────────────────────────────────────────────────────────────
  // Render Loop
  // ─────────────────────────────────────────────────────────────

  private lastFrameTime = 0;

  private animate = (): void => {
    if (this.disposed) return;

    requestAnimationFrame(this.animate);

    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Update controls
    this.controls.update();

    // Update particle systems (Night Elf atmosphere)
    if (this.isNightElfTheme && this.particleSystems.length > 0) {
      this.updateParticles(deltaTime);
    }

    // Update unit animations (idle bobbing for wisps, etc.)
    this.updateUnitAnimations(deltaTime);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  private updateUnitAnimations(deltaTime: number): void {
    for (const unit of this.units.values()) {
      // Wisp units have floating animation
      if (unit.type === 'wisp') {
        unit.model.position.y = unit.position.y + Math.sin(performance.now() * 0.003) * 0.1;
        unit.model.rotation.y += deltaTime * 0.5;
      }

      // Hero units have subtle breathing animation
      if (unit.type === 'demon_hunter') {
        const breathScale = 1 + Math.sin(performance.now() * 0.002) * 0.02;
        unit.model.scale.y = breathScale;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────

  dispose(): void {
    this.disposed = true;
    this.controls.dispose();
    this.renderer.dispose();

    // Remove canvas
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    // Clear scene
    this.scene.clear();
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export async function createIsometricWorldRenderer(
  config: RendererConfig
): Promise<IsometricWorldRenderer> {
  const renderer = new IsometricWorldRenderer(config);
  await renderer.loadManifest();
  return renderer;
}
