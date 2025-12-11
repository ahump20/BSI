/**
 * HolographicOverlayShader
 *
 * ESPN-style holographic effect but 10x better with scanlines,
 * chromatic aberration, and authentic CRT flicker. Creates a
 * futuristic broadcast overlay aesthetic.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors for holographic effects
 */
const HOLO_COLORS = {
  ember: new THREE.Color(0xFF6B35),
  burntOrange: new THREE.Color(0xBF5700),
  gold: new THREE.Color(0xC9A227),
  cyan: new THREE.Color(0x00F5FF),
  magenta: new THREE.Color(0xFF00FF),
};

/**
 * Holographic overlay vertex shader
 */
export const holographicVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Holographic overlay fragment shader
 */
export const holographicFragmentShader = `
  uniform float time;
  uniform vec3 primaryColor;
  uniform vec3 secondaryColor;
  uniform vec3 accentColor;
  uniform float scanlineIntensity;
  uniform float scanlineSpeed;
  uniform float scanlineCount;
  uniform float chromaticOffset;
  uniform float flickerIntensity;
  uniform float flickerSpeed;
  uniform float glitchIntensity;
  uniform float glitchSpeed;
  uniform float opacity;
  uniform float fresnelPower;
  uniform float noiseScale;
  uniform sampler2D noiseTexture;
  uniform bool useTexture;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  // Pseudo-random hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Noise function
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

  // Fractal Brownian Motion
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  // Scanline effect
  float scanlines(vec2 uv, float t) {
    float scan = sin((uv.y + t * scanlineSpeed) * scanlineCount * 3.14159) * 0.5 + 0.5;
    scan = pow(scan, 3.0);
    return 1.0 - scan * scanlineIntensity;
  }

  // Horizontal glitch lines
  float glitchLines(vec2 uv, float t) {
    float glitch = 0.0;
    float glitchTime = floor(t * glitchSpeed);
    float glitchRand = hash(vec2(glitchTime, 0.0));

    if (glitchRand > 0.95 - glitchIntensity * 0.1) {
      float lineY = hash(vec2(glitchTime, 1.0));
      float lineHeight = hash(vec2(glitchTime, 2.0)) * 0.1;

      if (uv.y > lineY && uv.y < lineY + lineHeight) {
        glitch = (hash(vec2(uv.x * 100.0, glitchTime)) - 0.5) * 2.0 * glitchIntensity;
      }
    }

    return glitch;
  }

  // Chromatic aberration
  vec3 chromaticAberration(vec2 uv, float offset) {
    vec2 direction = normalize(uv - vec2(0.5));
    float dist = length(uv - vec2(0.5));

    vec3 color;
    color.r = fbm((uv + direction * offset * dist) * noiseScale);
    color.g = fbm(uv * noiseScale);
    color.b = fbm((uv - direction * offset * dist) * noiseScale);

    return color;
  }

  // Flicker effect
  float flicker(float t) {
    float f1 = sin(t * flickerSpeed * 10.0) * 0.02;
    float f2 = sin(t * flickerSpeed * 23.0) * 0.01;
    float f3 = sin(t * flickerSpeed * 57.0) * 0.005;

    // Random flicker spikes
    float spike = 0.0;
    float spikeChance = hash(vec2(floor(t * 30.0), 0.0));
    if (spikeChance > 0.98) {
      spike = (hash(vec2(floor(t * 60.0), 1.0)) - 0.5) * flickerIntensity * 0.5;
    }

    return 1.0 + (f1 + f2 + f3 + spike) * flickerIntensity;
  }

  // Fresnel rim effect
  float fresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - max(dot(normal, viewDir), 0.0), power);
  }

  void main() {
    vec2 uv = vUv;

    // Apply glitch displacement
    float glitch = glitchLines(uv, time);
    uv.x += glitch * 0.02;

    // Base holographic pattern
    vec3 pattern = chromaticAberration(uv, chromaticOffset);

    // Color mixing based on pattern
    float colorMix1 = pattern.r;
    float colorMix2 = pattern.g;
    float colorMix3 = pattern.b;

    vec3 color = mix(primaryColor, secondaryColor, colorMix1);
    color = mix(color, accentColor, colorMix2 * 0.3);

    // Add iridescent effect based on view angle
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = fresnel(vNormal, viewDir, fresnelPower);

    // Rainbow shift based on angle
    float hueShift = rim * 0.5 + time * 0.1;
    vec3 rainbow = vec3(
      sin(hueShift * 6.28) * 0.5 + 0.5,
      sin((hueShift + 0.33) * 6.28) * 0.5 + 0.5,
      sin((hueShift + 0.66) * 6.28) * 0.5 + 0.5
    );

    color = mix(color, rainbow, rim * 0.3);

    // Apply scanlines
    float scanline = scanlines(uv, time);
    color *= scanline;

    // Apply flicker
    float flickerValue = flicker(time);
    color *= flickerValue;

    // Edge glow
    color += primaryColor * rim * 0.5;

    // Horizontal scan bar (like old CRT)
    float scanBar = smoothstep(0.0, 0.02, abs(fract(uv.y + time * 0.1) - 0.5)) * 0.1 + 0.9;
    color *= scanBar;

    // Vignette
    float vignette = 1.0 - length(uv - vec2(0.5)) * 0.5;
    color *= vignette;

    // Alpha based on pattern and rim
    float alpha = opacity * (0.6 + rim * 0.4 + pattern.g * 0.2);

    // Add subtle noise to break up banding
    float dither = hash(uv * 1000.0 + time) * 0.02;
    color += dither;

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Configuration interface for holographic material
 */
export interface HolographicMaterialConfig {
  primaryColor?: THREE.Color | number;
  secondaryColor?: THREE.Color | number;
  accentColor?: THREE.Color | number;
  scanlineIntensity?: number;
  scanlineSpeed?: number;
  scanlineCount?: number;
  chromaticOffset?: number;
  flickerIntensity?: number;
  flickerSpeed?: number;
  glitchIntensity?: number;
  glitchSpeed?: number;
  opacity?: number;
  fresnelPower?: number;
  noiseScale?: number;
  transparent?: boolean;
}

/**
 * Create a holographic overlay material
 */
export function createHolographicMaterial(config?: HolographicMaterialConfig): THREE.ShaderMaterial {
  const defaults: Required<HolographicMaterialConfig> = {
    primaryColor: HOLO_COLORS.ember,
    secondaryColor: HOLO_COLORS.burntOrange,
    accentColor: HOLO_COLORS.gold,
    scanlineIntensity: 0.15,
    scanlineSpeed: 0.5,
    scanlineCount: 100,
    chromaticOffset: 0.01,
    flickerIntensity: 0.3,
    flickerSpeed: 1.0,
    glitchIntensity: 0.2,
    glitchSpeed: 4.0,
    opacity: 0.8,
    fresnelPower: 2.0,
    noiseScale: 10.0,
    transparent: true,
  };

  const cfg = { ...defaults, ...config };

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      primaryColor: {
        value: cfg.primaryColor instanceof THREE.Color
          ? cfg.primaryColor
          : new THREE.Color(cfg.primaryColor)
      },
      secondaryColor: {
        value: cfg.secondaryColor instanceof THREE.Color
          ? cfg.secondaryColor
          : new THREE.Color(cfg.secondaryColor)
      },
      accentColor: {
        value: cfg.accentColor instanceof THREE.Color
          ? cfg.accentColor
          : new THREE.Color(cfg.accentColor)
      },
      scanlineIntensity: { value: cfg.scanlineIntensity },
      scanlineSpeed: { value: cfg.scanlineSpeed },
      scanlineCount: { value: cfg.scanlineCount },
      chromaticOffset: { value: cfg.chromaticOffset },
      flickerIntensity: { value: cfg.flickerIntensity },
      flickerSpeed: { value: cfg.flickerSpeed },
      glitchIntensity: { value: cfg.glitchIntensity },
      glitchSpeed: { value: cfg.glitchSpeed },
      opacity: { value: cfg.opacity },
      fresnelPower: { value: cfg.fresnelPower },
      noiseScale: { value: cfg.noiseScale },
      noiseTexture: { value: null },
      useTexture: { value: false },
    },
    vertexShader: holographicVertexShader,
    fragmentShader: holographicFragmentShader,
    transparent: cfg.transparent,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Update holographic material time uniform
 */
export function updateHolographicMaterial(material: THREE.ShaderMaterial, delta: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += delta;
  }
}

/**
 * Preset configurations for common use cases
 */
export const HolographicPresets = {
  /** Classic broadcast overlay */
  broadcast: {
    scanlineIntensity: 0.2,
    scanlineCount: 150,
    flickerIntensity: 0.1,
    glitchIntensity: 0.05,
    opacity: 0.7,
  },

  /** Futuristic sports HUD */
  sportsHUD: {
    primaryColor: HOLO_COLORS.ember,
    scanlineIntensity: 0.1,
    scanlineCount: 80,
    flickerIntensity: 0.2,
    glitchIntensity: 0.1,
    chromaticOffset: 0.02,
    opacity: 0.85,
  },

  /** Intense glitch effect */
  glitchHeavy: {
    glitchIntensity: 0.5,
    glitchSpeed: 8.0,
    flickerIntensity: 0.4,
    chromaticOffset: 0.03,
    scanlineIntensity: 0.25,
  },

  /** Subtle ambient hologram */
  ambient: {
    scanlineIntensity: 0.05,
    flickerIntensity: 0.05,
    glitchIntensity: 0.0,
    opacity: 0.5,
    fresnelPower: 3.0,
  },

  /** Player card holographic */
  playerCard: {
    primaryColor: HOLO_COLORS.gold,
    secondaryColor: HOLO_COLORS.burntOrange,
    scanlineIntensity: 0.08,
    scanlineCount: 60,
    flickerIntensity: 0.15,
    glitchIntensity: 0.02,
    fresnelPower: 2.5,
    opacity: 0.9,
  },
};

export default createHolographicMaterial;
