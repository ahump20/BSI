/**
 * NeonGlowShader
 *
 * Glowing ember trails for player movement visualization.
 * Creates vibrant, pulsing neon effects with bloom-ready
 * HDR output and animated energy flow.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors for neon effects
 */
const NEON_COLORS = {
  ember: new THREE.Color(0xFF6B35),
  burntOrange: new THREE.Color(0xBF5700),
  gold: new THREE.Color(0xC9A227),
  cream: new THREE.Color(0xFAF8F5),
};

/**
 * Neon glow vertex shader
 */
export const neonGlowVertexShader = `
  uniform float time;
  uniform float pulseSpeed;
  uniform float pulseAmplitude;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vPulse;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    // Calculate pulse based on position for wave effect
    float positionPhase = length(position.xy) * 0.1;
    vPulse = sin(time * pulseSpeed + positionPhase) * pulseAmplitude;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Neon glow fragment shader
 */
export const neonGlowFragmentShader = `
  uniform float time;
  uniform vec3 coreColor;
  uniform vec3 glowColor;
  uniform vec3 outerColor;
  uniform float coreIntensity;
  uniform float glowIntensity;
  uniform float outerGlowRadius;
  uniform float flickerSpeed;
  uniform float flickerIntensity;
  uniform float energyFlowSpeed;
  uniform float energyFlowScale;
  uniform float opacity;
  uniform float fresnel;
  uniform bool animated;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vPulse;

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

  // Fractal noise
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
  float calculateFresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - max(dot(normal, viewDir), 0.0), power);
  }

  // Flicker effect
  float flicker(float t) {
    float f1 = sin(t * flickerSpeed * 10.0) * 0.1;
    float f2 = sin(t * flickerSpeed * 23.0) * 0.05;
    float f3 = sin(t * flickerSpeed * 47.0) * 0.025;

    // Random spikes
    float spike = 0.0;
    float spikeCheck = hash(vec2(floor(t * 20.0), 0.0));
    if (spikeCheck > 0.95) {
      spike = (hash(vec2(floor(t * 40.0), 1.0)) - 0.5) * 0.3;
    }

    return 1.0 + (f1 + f2 + f3 + spike) * flickerIntensity;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);

    // Distance from center for glow falloff
    float distFromCenter = length(vUv - vec2(0.5)) * 2.0;

    // Core glow (brightest at center)
    float coreGlow = 1.0 - smoothstep(0.0, 0.3, distFromCenter);
    coreGlow = pow(coreGlow, 2.0);

    // Middle glow layer
    float midGlow = 1.0 - smoothstep(0.0, 0.6, distFromCenter);
    midGlow = pow(midGlow, 1.5);

    // Outer glow (soft falloff)
    float outerGlow = 1.0 - smoothstep(0.0, outerGlowRadius, distFromCenter);

    // Energy flow pattern
    float energy = 0.0;
    if (animated) {
      vec2 flowUv = vUv * energyFlowScale;
      flowUv.y += time * energyFlowSpeed;
      energy = fbm(flowUv);
      energy += fbm(flowUv * 2.0 - time * energyFlowSpeed * 0.7) * 0.5;
      energy = smoothstep(0.3, 0.7, energy);
    }

    // Fresnel rim effect
    float rim = calculateFresnel(normal, viewDir, fresnel);

    // Combine layers
    vec3 color = coreColor * coreGlow * coreIntensity;
    color += glowColor * midGlow * glowIntensity;
    color += outerColor * outerGlow * 0.5;

    // Add energy flow
    if (animated) {
      color += glowColor * energy * 0.5;
    }

    // Add fresnel rim
    color += glowColor * rim * glowIntensity * 0.5;

    // Add pulse
    color *= 1.0 + vPulse;

    // Apply flicker
    if (animated) {
      color *= flicker(time);
    }

    // HDR output for bloom
    color = max(color, vec3(0.0));

    // Alpha based on glow
    float alpha = (coreGlow + midGlow * 0.5 + outerGlow * 0.2) * opacity;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Neon trail vertex shader (for line geometry)
 */
export const neonTrailVertexShader = `
  attribute float aProgress;
  attribute float aThickness;

  uniform float time;
  uniform float trailLength;

  varying float vProgress;
  varying float vThickness;

  void main() {
    vProgress = aProgress;
    vThickness = aThickness;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Neon trail fragment shader (for line geometry)
 */
export const neonTrailFragmentShader = `
  uniform float time;
  uniform vec3 coreColor;
  uniform vec3 glowColor;
  uniform float intensity;
  uniform float fadeLength;
  uniform bool animated;

  varying float vProgress;
  varying float vThickness;

  void main() {
    // Fade based on progress along trail
    float fade = smoothstep(0.0, fadeLength, vProgress);
    fade *= 1.0 - smoothstep(1.0 - fadeLength * 0.5, 1.0, vProgress);

    // Core to glow gradient based on thickness
    float t = vThickness;
    vec3 color = mix(glowColor, coreColor, t);

    // Pulse animation
    float pulse = 1.0;
    if (animated) {
      pulse = 0.8 + 0.2 * sin(time * 3.0 + vProgress * 10.0);
    }

    color *= intensity * pulse;

    // HDR output
    color = max(color, vec3(0.0));

    gl_FragColor = vec4(color, fade);
  }
`;

/**
 * Configuration interface for neon glow material
 */
export interface NeonGlowMaterialConfig {
  coreColor?: THREE.Color | number;
  glowColor?: THREE.Color | number;
  outerColor?: THREE.Color | number;
  coreIntensity?: number;
  glowIntensity?: number;
  outerGlowRadius?: number;
  flickerSpeed?: number;
  flickerIntensity?: number;
  energyFlowSpeed?: number;
  energyFlowScale?: number;
  opacity?: number;
  fresnel?: number;
  pulseSpeed?: number;
  pulseAmplitude?: number;
  animated?: boolean;
  transparent?: boolean;
  blending?: THREE.Blending;
}

/**
 * Create a neon glow material
 */
export function createNeonGlowMaterial(config?: NeonGlowMaterialConfig): THREE.ShaderMaterial {
  const defaults: Required<NeonGlowMaterialConfig> = {
    coreColor: NEON_COLORS.cream,
    glowColor: NEON_COLORS.ember,
    outerColor: NEON_COLORS.burntOrange,
    coreIntensity: 3.0,
    glowIntensity: 2.0,
    outerGlowRadius: 1.0,
    flickerSpeed: 1.0,
    flickerIntensity: 0.2,
    energyFlowSpeed: 0.5,
    energyFlowScale: 5.0,
    opacity: 1.0,
    fresnel: 2.0,
    pulseSpeed: 2.0,
    pulseAmplitude: 0.1,
    animated: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
  };

  const cfg = { ...defaults, ...config };

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      coreColor: {
        value: cfg.coreColor instanceof THREE.Color
          ? cfg.coreColor
          : new THREE.Color(cfg.coreColor)
      },
      glowColor: {
        value: cfg.glowColor instanceof THREE.Color
          ? cfg.glowColor
          : new THREE.Color(cfg.glowColor)
      },
      outerColor: {
        value: cfg.outerColor instanceof THREE.Color
          ? cfg.outerColor
          : new THREE.Color(cfg.outerColor)
      },
      coreIntensity: { value: cfg.coreIntensity },
      glowIntensity: { value: cfg.glowIntensity },
      outerGlowRadius: { value: cfg.outerGlowRadius },
      flickerSpeed: { value: cfg.flickerSpeed },
      flickerIntensity: { value: cfg.flickerIntensity },
      energyFlowSpeed: { value: cfg.energyFlowSpeed },
      energyFlowScale: { value: cfg.energyFlowScale },
      opacity: { value: cfg.opacity },
      fresnel: { value: cfg.fresnel },
      pulseSpeed: { value: cfg.pulseSpeed },
      pulseAmplitude: { value: cfg.pulseAmplitude },
      animated: { value: cfg.animated },
    },
    vertexShader: neonGlowVertexShader,
    fragmentShader: neonGlowFragmentShader,
    transparent: cfg.transparent,
    blending: cfg.blending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/**
 * Configuration interface for neon trail material
 */
export interface NeonTrailMaterialConfig {
  coreColor?: THREE.Color | number;
  glowColor?: THREE.Color | number;
  intensity?: number;
  fadeLength?: number;
  animated?: boolean;
}

/**
 * Create a neon trail material for line geometry
 */
export function createNeonTrailMaterial(config?: NeonTrailMaterialConfig): THREE.ShaderMaterial {
  const defaults: Required<NeonTrailMaterialConfig> = {
    coreColor: NEON_COLORS.cream,
    glowColor: NEON_COLORS.ember,
    intensity: 2.0,
    fadeLength: 0.3,
    animated: true,
  };

  const cfg = { ...defaults, ...config };

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      coreColor: {
        value: cfg.coreColor instanceof THREE.Color
          ? cfg.coreColor
          : new THREE.Color(cfg.coreColor)
      },
      glowColor: {
        value: cfg.glowColor instanceof THREE.Color
          ? cfg.glowColor
          : new THREE.Color(cfg.glowColor)
      },
      intensity: { value: cfg.intensity },
      fadeLength: { value: cfg.fadeLength },
      animated: { value: cfg.animated },
    },
    vertexShader: neonTrailVertexShader,
    fragmentShader: neonTrailFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Update neon material time uniform
 */
export function updateNeonMaterial(material: THREE.ShaderMaterial, delta: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += delta;
  }
}

/**
 * Preset configurations for common use cases
 */
export const NeonGlowPresets = {
  /** Standard ember glow */
  ember: {
    coreColor: NEON_COLORS.cream,
    glowColor: NEON_COLORS.ember,
    outerColor: NEON_COLORS.burntOrange,
    coreIntensity: 3.0,
    glowIntensity: 2.0,
  },

  /** Burnt orange brand glow */
  burntOrange: {
    coreColor: NEON_COLORS.ember,
    glowColor: NEON_COLORS.burntOrange,
    outerColor: new THREE.Color(0x5F2800),
    coreIntensity: 2.5,
    glowIntensity: 1.8,
  },

  /** Gold highlight glow */
  gold: {
    coreColor: NEON_COLORS.cream,
    glowColor: NEON_COLORS.gold,
    outerColor: NEON_COLORS.burntOrange,
    coreIntensity: 3.5,
    glowIntensity: 2.2,
  },

  /** Intense energy for highlights */
  intense: {
    coreColor: new THREE.Color(0xFFFFFF),
    glowColor: NEON_COLORS.ember,
    outerColor: NEON_COLORS.burntOrange,
    coreIntensity: 5.0,
    glowIntensity: 3.0,
    flickerIntensity: 0.3,
    energyFlowSpeed: 1.0,
  },

  /** Subtle ambient glow */
  subtle: {
    coreColor: NEON_COLORS.gold,
    glowColor: NEON_COLORS.burntOrange,
    outerColor: new THREE.Color(0x3F1700),
    coreIntensity: 1.5,
    glowIntensity: 1.0,
    flickerIntensity: 0.05,
    animated: false,
  },

  /** Player tracking trail */
  playerTrail: {
    coreColor: NEON_COLORS.cream,
    glowColor: NEON_COLORS.ember,
    outerColor: NEON_COLORS.burntOrange,
    coreIntensity: 2.0,
    glowIntensity: 1.5,
    energyFlowSpeed: 2.0,
    energyFlowScale: 3.0,
  },

  /** Home run celebration */
  celebration: {
    coreColor: new THREE.Color(0xFFFFFF),
    glowColor: NEON_COLORS.gold,
    outerColor: NEON_COLORS.ember,
    coreIntensity: 6.0,
    glowIntensity: 4.0,
    flickerIntensity: 0.4,
    flickerSpeed: 2.0,
    pulseSpeed: 4.0,
    pulseAmplitude: 0.3,
  },
};

export default createNeonGlowMaterial;
