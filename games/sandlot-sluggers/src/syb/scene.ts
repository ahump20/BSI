/**
 * Sandlot Sluggers - Scene Loader & Node Index
 * Loads GLB field asset and indexes nodes/cameras/anchors by name.
 *
 * Required GLB nodes are defined in the GLB_CONTRACT.
 * The game engine relies on stable naming from Blender export.
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ============================================================================
// GLB Contract - Required node names
// ============================================================================

export const GLB_CONTRACT = {
  ROOT: 'SYB_Root',

  ANCHORS: {
    HOME: 'SYB_Anchor_Home',
    FIRST_BASE: 'SYB_Anchor_1B',
    SECOND_BASE: 'SYB_Anchor_2B',
    THIRD_BASE: 'SYB_Anchor_3B',
    MOUND: 'SYB_Anchor_Mound',
    BATTER: 'SYB_Anchor_Batter',
    CATCHER: 'SYB_Anchor_Catcher',
    // Fielder positions
    FIRST_BASEMAN: 'SYB_Anchor_1B_F',
    SECOND_BASEMAN: 'SYB_Anchor_2B_F',
    SHORTSTOP: 'SYB_Anchor_SS_F',
    THIRD_BASEMAN: 'SYB_Anchor_3B_F',
    LEFT_FIELD: 'SYB_Anchor_LF',
    CENTER_FIELD: 'SYB_Anchor_CF',
    RIGHT_FIELD: 'SYB_Anchor_RF',
  },

  AIM_TARGETS: {
    STRIKE_ZONE: 'SYB_Aim_StrikeZone',
    MOUND: 'SYB_Aim_Mound',
  },

  CAMERAS: {
    BEHIND_BATTER: 'SYB_Cam_BehindBatter',
    STRIKE_ZONE_HIGH: 'SYB_Cam_StrikeZoneHigh',
    ISOMETRIC: 'SYB_Cam_Isometric',
  },
} as const;

// All required nodes for validation
export const REQUIRED_NODES = [
  GLB_CONTRACT.ROOT,
  ...Object.values(GLB_CONTRACT.ANCHORS),
  ...Object.values(GLB_CONTRACT.AIM_TARGETS),
  ...Object.values(GLB_CONTRACT.CAMERAS),
];

// ============================================================================
// Types
// ============================================================================

export type SceneIndex = {
  gltf: GLTF;
  root: THREE.Object3D;
  nodes: Map<string, THREE.Object3D>;
  cameras: Map<string, THREE.Camera>;
  anchors: Map<string, THREE.Object3D>;
  aimTargets: Map<string, THREE.Object3D>;
};

export type ValidationResult = {
  valid: boolean;
  missing: string[];
  warnings: string[];
};

// ============================================================================
// Scene Loading
// ============================================================================

const DEFAULT_ANCHOR_PREFIX = 'SYB_Anchor_';
const DEFAULT_AIM_PREFIX = 'SYB_Aim_';

export async function loadSYBScene(params: {
  loader: { loadAsync(url: string): Promise<GLTF> };
  url: string;
  anchorPrefix?: string;
  aimPrefix?: string;
  expectedRootName?: string;
}): Promise<SceneIndex> {
  const { loader, url } = params;
  const anchorPrefix = params.anchorPrefix ?? DEFAULT_ANCHOR_PREFIX;
  const aimPrefix = params.aimPrefix ?? DEFAULT_AIM_PREFIX;
  const expectedRootName = params.expectedRootName ?? GLB_CONTRACT.ROOT;

  const gltf = await loader.loadAsync(url);
  const namedRoot = gltf.scene.getObjectByName(expectedRootName);
  const root = namedRoot ?? gltf.scene;

  const nodes = new Map<string, THREE.Object3D>();
  const cameras = new Map<string, THREE.Camera>();
  const anchors = new Map<string, THREE.Object3D>();
  const aimTargets = new Map<string, THREE.Object3D>();

  root.traverse((obj) => {
    if (!obj.name) return;
    nodes.set(obj.name, obj);

    if ((obj as unknown as THREE.Camera).isCamera) {
      cameras.set(obj.name, obj as unknown as THREE.Camera);
    }

    if (obj.name.startsWith(anchorPrefix)) {
      anchors.set(obj.name, obj);
    }

    if (obj.name.startsWith(aimPrefix)) {
      aimTargets.set(obj.name, obj);
    }
  });

  return { gltf, root, nodes, cameras, anchors, aimTargets };
}

// ============================================================================
// Validation
// ============================================================================

export function validateSceneIndex(index: SceneIndex): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const nodeName of REQUIRED_NODES) {
    if (!index.nodes.has(nodeName)) {
      missing.push(nodeName);
    }
  }

  // Check for cameras specifically
  if (index.cameras.size === 0) {
    warnings.push('No cameras found in GLB - fallback cameras will be used');
  }

  // Check for fielder anchors (optional but recommended)
  const fielderAnchors = [
    GLB_CONTRACT.ANCHORS.LEFT_FIELD,
    GLB_CONTRACT.ANCHORS.CENTER_FIELD,
    GLB_CONTRACT.ANCHORS.RIGHT_FIELD,
  ];
  const missingFielders = fielderAnchors.filter((name) => !index.anchors.has(name));
  if (missingFielders.length > 0) {
    warnings.push(
      `Missing outfielder anchors: ${missingFielders.join(', ')} - fielding may be inaccurate`
    );
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function formatValidationError(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return 'GLB validation passed!';
  }

  const lines: string[] = [];

  if (!result.valid) {
    lines.push('GLB VALIDATION FAILED');
    lines.push('');
    lines.push('Missing required nodes:');
    for (const node of result.missing) {
      lines.push(`  - ${node}`);
    }
    lines.push('');
    lines.push('Please ensure the GLB was exported from Blender with the correct node naming.');
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Node Access Utilities
// ============================================================================

export function tryGetNode<T extends THREE.Object3D>(index: SceneIndex, name: string): T | null {
  return (index.nodes.get(name) as T) ?? null;
}

export function getNode<T extends THREE.Object3D>(index: SceneIndex, name: string): T {
  const obj = index.nodes.get(name);
  if (!obj) throw new Error(`SYB node not found: ${name}`);
  return obj as T;
}

export function getAnchor(index: SceneIndex, name: string): THREE.Object3D {
  const obj = index.anchors.get(name);
  if (!obj) throw new Error(`SYB anchor not found: ${name}`);
  return obj;
}

export function getCamera(index: SceneIndex, name: string): THREE.Camera {
  const cam = index.cameras.get(name);
  if (!cam) throw new Error(`SYB camera not found: ${name}`);
  return cam;
}

// ============================================================================
// Camera Utilities
// ============================================================================

export function applyCameraViewport(camera: THREE.Camera, w: number, h: number) {
  if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
    const c = camera as THREE.PerspectiveCamera;
    c.aspect = w / h;
    c.updateProjectionMatrix();
  } else if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
    const c = camera as THREE.OrthographicCamera;
    c.updateProjectionMatrix();
  }
}

// ============================================================================
// Position Utilities
// ============================================================================

export function worldPos(obj: THREE.Object3D): THREE.Vector3 {
  const v = new THREE.Vector3();
  obj.getWorldPosition(v);
  return v;
}

export function worldPosOf(index: SceneIndex, name: string): THREE.Vector3 {
  const obj = tryGetNode(index, name);
  if (!obj) {
    console.warn(`Node ${name} not found, returning origin`);
    return new THREE.Vector3();
  }
  return worldPos(obj);
}

export function childrenRecursive(obj: THREE.Object3D): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  const stack: THREE.Object3D[] = [obj];
  while (stack.length) {
    const a = stack.pop()!;
    for (const ch of a.children) {
      out.push(ch);
      stack.push(ch);
    }
  }
  return out;
}

// ============================================================================
// High-Level Loading API (for engine.ts)
// ============================================================================

const gltfLoader = new GLTFLoader();

export type LoadedScene = {
  scene: THREE.Group;
  index: SceneIndex;
};

export async function loadGLB(url: string): Promise<LoadedScene> {
  const index = await loadSYBScene({
    loader: gltfLoader,
    url,
  });
  return {
    scene: index.gltf.scene,
    index,
  };
}

export function validateRequiredNodes(index: SceneIndex): ValidationResult {
  return validateSceneIndex(index);
}

// ============================================================================
// Fallback Scene Builder
// ============================================================================

export function buildFallbackScene(scene: THREE.Scene): SceneIndex {
  // Create a simple baseball field using primitives
  const nodes = new Map<string, THREE.Object3D>();
  const cameras = new Map<string, THREE.Camera>();
  const anchors = new Map<string, THREE.Object3D>();
  const aimTargets = new Map<string, THREE.Object3D>();

  // Ground plane (dirt infield + grass outfield)
  const groundGeo = new THREE.PlaneGeometry(120, 120);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x3d9140,
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeo, grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Dirt infield (diamond shape approximation with circle)
  const dirtGeo = new THREE.CircleGeometry(25, 32);
  const dirtMat = new THREE.MeshStandardMaterial({
    color: 0xc4a77d,
    roughness: 0.95,
  });
  const dirt = new THREE.Mesh(dirtGeo, dirtMat);
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = 0.01;
  scene.add(dirt);

  // Root node
  const root = new THREE.Group();
  root.name = GLB_CONTRACT.ROOT;
  scene.add(root);
  nodes.set(root.name, root);

  // Youth baseball field dimensions (60ft bases)
  const BASE_DISTANCE = 18.3; // 60ft in meters
  const MOUND_DISTANCE = 14.0; // ~46ft
  const OUTFIELD_DISTANCE = 60.0;

  // Helper to create anchor
  function createAnchor(name: string, pos: THREE.Vector3): THREE.Object3D {
    const anchor = new THREE.Object3D();
    anchor.name = name;
    anchor.position.copy(pos);
    root.add(anchor);
    nodes.set(name, anchor);
    anchors.set(name, anchor);
    return anchor;
  }

  // Helper to create visible base marker
  function createBase(name: string, pos: THREE.Vector3): THREE.Object3D {
    const anchor = createAnchor(name, pos);
    const baseGeo = new THREE.BoxGeometry(0.4, 0.05, 0.4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.y = Math.PI / 4;
    anchor.add(baseMesh);
    return anchor;
  }

  // Create base anchors (Z-up convention, Y is forward toward outfield)
  createBase(GLB_CONTRACT.ANCHORS.HOME, new THREE.Vector3(0, 0, 0));
  createBase(
    GLB_CONTRACT.ANCHORS.FIRST_BASE,
    new THREE.Vector3(BASE_DISTANCE * 0.707, BASE_DISTANCE * 0.707, 0)
  );
  createBase(GLB_CONTRACT.ANCHORS.SECOND_BASE, new THREE.Vector3(0, BASE_DISTANCE * 1.414, 0));
  createBase(
    GLB_CONTRACT.ANCHORS.THIRD_BASE,
    new THREE.Vector3(-BASE_DISTANCE * 0.707, BASE_DISTANCE * 0.707, 0)
  );

  // Mound
  const moundGeo = new THREE.CylinderGeometry(1.5, 2, 0.25, 16);
  const moundMat = new THREE.MeshStandardMaterial({ color: 0xc4a77d });
  const moundMesh = new THREE.Mesh(moundGeo, moundMat);
  moundMesh.position.set(0, MOUND_DISTANCE, 0.125);
  scene.add(moundMesh);
  createAnchor(GLB_CONTRACT.ANCHORS.MOUND, new THREE.Vector3(0, MOUND_DISTANCE, 0.3));

  // Batter and catcher positions
  createAnchor(GLB_CONTRACT.ANCHORS.BATTER, new THREE.Vector3(0.6, -0.5, 0));
  createAnchor(GLB_CONTRACT.ANCHORS.CATCHER, new THREE.Vector3(0, -1.5, 0.3));

  // Fielder positions
  createAnchor(
    GLB_CONTRACT.ANCHORS.FIRST_BASEMAN,
    new THREE.Vector3(BASE_DISTANCE * 0.9, BASE_DISTANCE * 0.5, 0)
  );
  createAnchor(
    GLB_CONTRACT.ANCHORS.SECOND_BASEMAN,
    new THREE.Vector3(BASE_DISTANCE * 0.3, BASE_DISTANCE * 1.1, 0)
  );
  createAnchor(
    GLB_CONTRACT.ANCHORS.SHORTSTOP,
    new THREE.Vector3(-BASE_DISTANCE * 0.3, BASE_DISTANCE * 1.1, 0)
  );
  createAnchor(
    GLB_CONTRACT.ANCHORS.THIRD_BASEMAN,
    new THREE.Vector3(-BASE_DISTANCE * 0.9, BASE_DISTANCE * 0.5, 0)
  );

  // Outfielders
  createAnchor(
    GLB_CONTRACT.ANCHORS.LEFT_FIELD,
    new THREE.Vector3(-OUTFIELD_DISTANCE * 0.6, OUTFIELD_DISTANCE * 0.8, 0)
  );
  createAnchor(GLB_CONTRACT.ANCHORS.CENTER_FIELD, new THREE.Vector3(0, OUTFIELD_DISTANCE, 0));
  createAnchor(
    GLB_CONTRACT.ANCHORS.RIGHT_FIELD,
    new THREE.Vector3(OUTFIELD_DISTANCE * 0.6, OUTFIELD_DISTANCE * 0.8, 0)
  );

  // Aim targets
  const strikeZone = new THREE.Object3D();
  strikeZone.name = GLB_CONTRACT.AIM_TARGETS.STRIKE_ZONE;
  strikeZone.position.set(0, 0, 0.8); // Waist high at plate
  root.add(strikeZone);
  nodes.set(strikeZone.name, strikeZone);
  aimTargets.set(strikeZone.name, strikeZone);

  const moundAim = new THREE.Object3D();
  moundAim.name = GLB_CONTRACT.AIM_TARGETS.MOUND;
  moundAim.position.set(0, MOUND_DISTANCE, 1.2);
  root.add(moundAim);
  nodes.set(moundAim.name, moundAim);
  aimTargets.set(moundAim.name, moundAim);

  // Cameras (as Object3D - actual camera created by CameraRig)
  const camBehindBatter = new THREE.Object3D();
  camBehindBatter.name = GLB_CONTRACT.CAMERAS.BEHIND_BATTER;
  camBehindBatter.position.set(0, -3, 1.8);
  camBehindBatter.lookAt(0, MOUND_DISTANCE, 0.8);
  root.add(camBehindBatter);
  nodes.set(camBehindBatter.name, camBehindBatter);

  const camStrikeZone = new THREE.Object3D();
  camStrikeZone.name = GLB_CONTRACT.CAMERAS.STRIKE_ZONE_HIGH;
  camStrikeZone.position.set(0, -2, 2.5);
  camStrikeZone.lookAt(0, 0, 0.8);
  root.add(camStrikeZone);
  nodes.set(camStrikeZone.name, camStrikeZone);

  const camIso = new THREE.Object3D();
  camIso.name = GLB_CONTRACT.CAMERAS.ISOMETRIC;
  camIso.position.set(25, -25, 20);
  camIso.lookAt(0, 15, 0);
  root.add(camIso);
  nodes.set(camIso.name, camIso);

  // Fences (simple box geometry for outfield wall)
  const fenceGeo = new THREE.BoxGeometry(0.3, 3, 100);
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x2e5a1f });

  const fenceLeft = new THREE.Mesh(fenceGeo, fenceMat);
  fenceLeft.position.set(-45, 50, 1.5);
  fenceLeft.rotation.y = Math.PI / 4;
  scene.add(fenceLeft);

  const fenceRight = new THREE.Mesh(fenceGeo, fenceMat);
  fenceRight.position.set(45, 50, 1.5);
  fenceRight.rotation.y = -Math.PI / 4;
  scene.add(fenceRight);

  const fenceCenter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 60), fenceMat);
  fenceCenter.position.set(0, 70, 1.5);
  scene.add(fenceCenter);

  // Create a fake GLTF object for the index
  const fakeGltf = {
    scene: root,
    scenes: [root],
    cameras: [],
    animations: [],
    asset: { version: '2.0' },
    parser: null as unknown as GLTF['parser'],
    userData: {},
  } as GLTF;

  return {
    gltf: fakeGltf,
    root,
    nodes,
    cameras,
    anchors,
    aimTargets,
  };
}
