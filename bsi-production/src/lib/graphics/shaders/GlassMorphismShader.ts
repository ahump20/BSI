/**
 * GlassMorphismShader
 *
 * Frosted glass stat cards floating in 3D space.
 * Creates a premium, modern UI aesthetic with realistic
 * glass refraction, blur, and edge highlighting.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors for glass effects
 */
const GLASS_COLORS = {
  ember: new THREE.Color(0xFF6B35),
  burntOrange: new THREE.Color(0xBF5700),
  gold: new THREE.Color(0xC9A227),
  charcoal: new THREE.Color(0x1A1A1A),
  midnight: new THREE.Color(0x0D0D0D),
  cream: new THREE.Color(0xFAF8F5),
};

/**
 * Glass morphism vertex shader
 */
export const glassMorphismVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec4 vProjectedCoords;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    // Calculate projected coordinates for refraction
    vec4 projected = projectionMatrix * mvPosition;
    vProjectedCoords = projected;

    gl_Position = projected;
  }
`;

/**
 * Glass morphism fragment shader
 */
export const glassMorphismFragmentShader = `
  uniform float time;
  uniform vec3 tint;
  uniform float tintStrength;
  uniform float opacity;
  uniform float blur;
  uniform float refraction;
  uniform float edgeWidth;
  uniform vec3 edgeColor;
  uniform float edgeGlow;
  uniform float frosted;
  uniform float reflectivity;
  uniform float noiseScale;
  uniform float noiseStrength;
  uniform float iridescence;
  uniform sampler2D backgroundTexture;
  uniform vec2 resolution;
  uniform bool hasBackground;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec4 vProjectedCoords;

  // Hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Smooth noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal noise for frosted effect
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  // Fresnel effect
  float fresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - max(dot(normal, viewDir), 0.0), power);
  }

  // Box blur approximation
  vec3 boxBlur(sampler2D tex, vec2 uv, vec2 texelSize, float radius) {
    vec3 color = vec3(0.0);
    float total = 0.0;

    for (float x = -3.0; x <= 3.0; x += 1.0) {
      for (float y = -3.0; y <= 3.0; y += 1.0) {
        vec2 offset = vec2(x, y) * texelSize * radius;
        color += texture2D(tex, uv + offset).rgb;
        total += 1.0;
      }
    }

    return color / total;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Calculate screen UV with refraction
    vec2 screenUv = (vProjectedCoords.xy / vProjectedCoords.w) * 0.5 + 0.5;

    // Add frosted noise distortion
    vec2 frostedOffset = vec2(0.0);
    if (frosted > 0.0) {
      float n = fbm(vUv * noiseScale + time * 0.1);
      frostedOffset = (vec2(n) - 0.5) * frosted * 0.02;
    }

    // Refraction based on normal
    vec2 refractionOffset = normal.xy * refraction * 0.1;

    vec2 finalUv = screenUv + refractionOffset + frostedOffset;

    // Sample background with blur
    vec3 backgroundColor = vec3(0.1);
    if (hasBackground) {
      vec2 texelSize = 1.0 / resolution;
      backgroundColor = boxBlur(backgroundTexture, finalUv, texelSize, blur);
    }

    // Fresnel for edge effect
    float rim = fresnel(normal, viewDir, 3.0);

    // Edge detection based on UV
    float edgeX = smoothstep(0.0, edgeWidth, vUv.x) * smoothstep(0.0, edgeWidth, 1.0 - vUv.x);
    float edgeY = smoothstep(0.0, edgeWidth, vUv.y) * smoothstep(0.0, edgeWidth, 1.0 - vUv.y);
    float edge = 1.0 - edgeX * edgeY;
    edge = pow(edge, 2.0);

    // Iridescent color shift
    vec3 iridColor = vec3(0.0);
    if (iridescence > 0.0) {
      float hue = rim * 0.5 + dot(normal, vec3(0.0, 1.0, 0.0)) * 0.3 + time * 0.05;
      iridColor = vec3(
        sin(hue * 6.28) * 0.5 + 0.5,
        sin((hue + 0.33) * 6.28) * 0.5 + 0.5,
        sin((hue + 0.66) * 6.28) * 0.5 + 0.5
      ) * iridescence;
    }

    // Surface noise for subtle texture
    float surfaceNoise = noise(vUv * noiseScale * 10.0) * noiseStrength;

    // Combine colors
    vec3 color = backgroundColor;

    // Apply tint
    color = mix(color, tint, tintStrength);

    // Add iridescence
    color += iridColor * rim;

    // Add edge glow
    color += edgeColor * edge * edgeGlow;

    // Add surface noise
    color += surfaceNoise;

    // Reflection
    color += vec3(1.0) * rim * reflectivity;

    // Calculate alpha
    float alpha = opacity;
    alpha += edge * edgeGlow * 0.5;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Configuration interface for glass morphism material
 */
export interface GlassMorphismMaterialConfig {
  tint?: THREE.Color | number;
  tintStrength?: number;
  opacity?: number;
  blur?: number;
  refraction?: number;
  edgeWidth?: number;
  edgeColor?: THREE.Color | number;
  edgeGlow?: number;
  frosted?: number;
  reflectivity?: number;
  noiseScale?: number;
  noiseStrength?: number;
  iridescence?: number;
  backgroundTexture?: THREE.Texture;
  resolution?: THREE.Vector2;
}

/**
 * Create a glass morphism material
 */
export function createGlassMorphismMaterial(config?: GlassMorphismMaterialConfig): THREE.ShaderMaterial {
  const defaults: Required<GlassMorphismMaterialConfig> = {
    tint: GLASS_COLORS.charcoal,
    tintStrength: 0.3,
    opacity: 0.7,
    blur: 4.0,
    refraction: 0.5,
    edgeWidth: 0.05,
    edgeColor: GLASS_COLORS.ember,
    edgeGlow: 0.5,
    frosted: 0.5,
    reflectivity: 0.2,
    noiseScale: 5.0,
    noiseStrength: 0.02,
    iridescence: 0.1,
    backgroundTexture: undefined as unknown as THREE.Texture,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
  };

  const cfg = { ...defaults, ...config };

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      tint: {
        value: cfg.tint instanceof THREE.Color
          ? cfg.tint
          : new THREE.Color(cfg.tint)
      },
      tintStrength: { value: cfg.tintStrength },
      opacity: { value: cfg.opacity },
      blur: { value: cfg.blur },
      refraction: { value: cfg.refraction },
      edgeWidth: { value: cfg.edgeWidth },
      edgeColor: {
        value: cfg.edgeColor instanceof THREE.Color
          ? cfg.edgeColor
          : new THREE.Color(cfg.edgeColor)
      },
      edgeGlow: { value: cfg.edgeGlow },
      frosted: { value: cfg.frosted },
      reflectivity: { value: cfg.reflectivity },
      noiseScale: { value: cfg.noiseScale },
      noiseStrength: { value: cfg.noiseStrength },
      iridescence: { value: cfg.iridescence },
      backgroundTexture: { value: cfg.backgroundTexture || null },
      hasBackground: { value: !!cfg.backgroundTexture },
      resolution: { value: cfg.resolution },
    },
    vertexShader: glassMorphismVertexShader,
    fragmentShader: glassMorphismFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/**
 * Update glass morphism material
 */
export function updateGlassMorphismMaterial(
  material: THREE.ShaderMaterial,
  delta: number,
  backgroundTexture?: THREE.Texture
): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += delta;
  }

  if (backgroundTexture && material.uniforms.backgroundTexture) {
    material.uniforms.backgroundTexture.value = backgroundTexture;
    material.uniforms.hasBackground.value = true;
  }
}

/**
 * Create a glass card geometry with rounded corners
 */
export function createGlassCardGeometry(
  width: number,
  height: number,
  borderRadius: number = 0.1,
  segments: number = 8
): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  const r = Math.min(borderRadius, width / 2, height / 2);
  const w = width / 2;
  const h = height / 2;

  // Start at bottom left corner (after radius)
  shape.moveTo(-w + r, -h);

  // Bottom edge
  shape.lineTo(w - r, -h);

  // Bottom right corner
  shape.quadraticCurveTo(w, -h, w, -h + r);

  // Right edge
  shape.lineTo(w, h - r);

  // Top right corner
  shape.quadraticCurveTo(w, h, w - r, h);

  // Top edge
  shape.lineTo(-w + r, h);

  // Top left corner
  shape.quadraticCurveTo(-w, h, -w, h - r);

  // Left edge
  shape.lineTo(-w, -h + r);

  // Bottom left corner
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const geometry = new THREE.ShapeGeometry(shape, segments);

  // Compute normals and UVs
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Preset configurations for common use cases
 */
export const GlassMorphismPresets = {
  /** Standard stat card */
  statCard: {
    tint: GLASS_COLORS.charcoal,
    tintStrength: 0.4,
    opacity: 0.8,
    blur: 5.0,
    edgeColor: GLASS_COLORS.ember,
    edgeGlow: 0.3,
    frosted: 0.6,
  },

  /** Premium player card */
  playerCard: {
    tint: GLASS_COLORS.midnight,
    tintStrength: 0.5,
    opacity: 0.85,
    blur: 6.0,
    edgeColor: GLASS_COLORS.gold,
    edgeGlow: 0.5,
    frosted: 0.4,
    iridescence: 0.15,
  },

  /** Holographic overlay */
  holographic: {
    tint: GLASS_COLORS.charcoal,
    tintStrength: 0.2,
    opacity: 0.6,
    blur: 3.0,
    edgeColor: GLASS_COLORS.ember,
    edgeGlow: 0.8,
    frosted: 0.3,
    iridescence: 0.3,
    reflectivity: 0.3,
  },

  /** Minimal clean glass */
  minimal: {
    tint: GLASS_COLORS.cream,
    tintStrength: 0.1,
    opacity: 0.5,
    blur: 8.0,
    edgeColor: GLASS_COLORS.charcoal,
    edgeGlow: 0.1,
    frosted: 0.8,
    iridescence: 0.0,
  },

  /** Dark mode panel */
  darkPanel: {
    tint: GLASS_COLORS.midnight,
    tintStrength: 0.7,
    opacity: 0.9,
    blur: 4.0,
    edgeColor: GLASS_COLORS.burntOrange,
    edgeGlow: 0.4,
    frosted: 0.5,
  },

  /** Floating HUD element */
  hud: {
    tint: GLASS_COLORS.charcoal,
    tintStrength: 0.3,
    opacity: 0.7,
    blur: 2.0,
    edgeColor: GLASS_COLORS.ember,
    edgeGlow: 0.6,
    edgeWidth: 0.02,
    frosted: 0.2,
    reflectivity: 0.1,
  },

  /** Celebration card */
  celebration: {
    tint: GLASS_COLORS.gold,
    tintStrength: 0.2,
    opacity: 0.75,
    blur: 5.0,
    edgeColor: GLASS_COLORS.gold,
    edgeGlow: 1.0,
    frosted: 0.4,
    iridescence: 0.25,
    reflectivity: 0.4,
  },
};

export default createGlassMorphismMaterial;
