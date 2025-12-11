/**
 * BSI Graphics Engine - Shader Library
 *
 * World-class custom GLSL shaders for sports visualization.
 * Includes holographic overlays, molten metal effects,
 * neon glow trails, glass morphism, and procedural fire.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

// =============================================================================
// NEW SPECTACULAR SHADERS
// =============================================================================

// Holographic Overlay - ESPN-style but 10x better
export {
  createHolographicMaterial as createHolographicOverlayMaterial,
  updateHolographicMaterial,
  holographicVertexShader,
  holographicFragmentShader,
  HolographicPresets,
} from './HolographicOverlayShader';
export type { HolographicMaterialConfig } from './HolographicOverlayShader';

// Molten Metal - Burnt orange liquid metal
export {
  createMoltenMetalMaterial,
  updateMoltenMetalMaterial,
  moltenMetalVertexShader,
  moltenMetalFragmentShader,
  MoltenMetalPresets,
} from './MoltenMetalShader';
export type { MoltenMetalMaterialConfig } from './MoltenMetalShader';

// Neon Glow - Glowing ember trails
export {
  createNeonGlowMaterial,
  createNeonTrailMaterial,
  updateNeonMaterial,
  neonGlowVertexShader,
  neonGlowFragmentShader,
  neonTrailVertexShader,
  neonTrailFragmentShader,
  NeonGlowPresets,
} from './NeonGlowShader';
export type { NeonGlowMaterialConfig, NeonTrailMaterialConfig } from './NeonGlowShader';

// Glass Morphism - Frosted glass stat cards
export {
  createGlassMorphismMaterial,
  updateGlassMorphismMaterial,
  createGlassCardGeometry,
  glassMorphismVertexShader,
  glassMorphismFragmentShader,
  GlassMorphismPresets,
} from './GlassMorphismShader';
export type { GlassMorphismMaterialConfig } from './GlassMorphismShader';

// Fire Storm - Procedural flames
export {
  createFireStormMaterial,
  updateFireStormMaterial,
  createFireGeometry,
  fireStormVertexShader,
  fireStormFragmentShader,
  FireStormPresets,
} from './FireStormShader';
export type { FireStormMaterialConfig } from './FireStormShader';

// =============================================================================
// LEGACY SHADERS (backwards compatibility)
// =============================================================================

// Heat distortion effects
export { HeatDistortionShader, HeatDistortionPassShader } from './HeatDistortionShader';

// Ember and particle glow
export {
  EmberGlowMaterial,
  EmberBillboardMaterial,
  EmberTrailShader,
  createEmberAttributes,
} from './EmberGlowShader';

// Volumetric lighting
export {
  VolumetricLightShader,
  GodRaysShader,
  AtmosphericScatteringShader,
  createLightShaft,
} from './VolumetricLightShader';

// Data visualization shaders
export {
  DataGlowShader,
  DataBarShader,
  DataLineShader,
  HolographicShader,
  createDataGlowMaterial,
  createHolographicMaterial,
} from './DataVisualizationShaders';

// Utility shader functions
export const ShaderChunks = {
  // Noise functions
  noise: `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m*m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
  `,

  // Fractal Brownian Motion
  fbm: `
    float fbm(vec2 p, int octaves) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        v += a * snoise(p);
        a *= 0.5;
        p *= 2.0;
      }
      return v;
    }
  `,

  // Color utilities
  colorUtils: `
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    float luminance(vec3 c) {
      return dot(c, vec3(0.299, 0.587, 0.114));
    }
  `,

  // BSI brand colors as uniforms block
  bsiColors: `
    #define BSI_BURNT_ORANGE vec3(0.749, 0.341, 0.0)
    #define BSI_TEXAS_SOIL vec3(0.545, 0.271, 0.075)
    #define BSI_EMBER vec3(1.0, 0.420, 0.208)
    #define BSI_GOLD vec3(0.788, 0.635, 0.153)
    #define BSI_CHARCOAL vec3(0.102, 0.102, 0.102)
    #define BSI_MIDNIGHT vec3(0.051, 0.051, 0.051)
    #define BSI_CREAM vec3(0.980, 0.973, 0.961)
  `,

  // Glow/bloom helper
  glow: `
    vec3 applyGlow(vec3 color, float intensity, vec3 glowColor) {
      float lum = luminance(color);
      float bloom = smoothstep(0.5, 1.0, lum);
      return color + glowColor * bloom * intensity;
    }
  `,

  // Vignette
  vignette: `
    float vignette(vec2 uv, float strength, float radius) {
      vec2 center = uv - 0.5;
      float dist = length(center);
      return 1.0 - smoothstep(radius - strength, radius, dist);
    }
  `,
};

// Preset shader configurations for common use cases
export const ShaderPresets = {
  // Stadium lighting preset
  stadiumLighting: {
    ambientIntensity: 0.4,
    keyLightIntensity: 1.2,
    keyLightColor: 0xFFFFFF,
    fillLightIntensity: 0.3,
    fillLightColor: 0xBF5700,
    rimLightIntensity: 0.5,
    rimLightColor: 0xC9A227,
  },

  // Night game preset
  nightGame: {
    ambientIntensity: 0.2,
    keyLightIntensity: 1.5,
    keyLightColor: 0xFFF5E0,
    bloomStrength: 0.8,
    bloomRadius: 0.5,
    godRaysIntensity: 0.3,
  },

  // Analytics dashboard preset
  analyticsDark: {
    backgroundColor: 0x0D0D0D,
    glowIntensity: 1.2,
    holographicStrength: 0.8,
    dataLineGlow: 0.6,
  },

  // Hero section preset
  heroVisual: {
    bloomStrength: 0.5,
    chromaticAberration: 0.002,
    filmGrain: 0.08,
    vignetteStrength: 0.3,
  },
};
