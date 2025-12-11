/**
 * Ember Glow Shader
 *
 * Custom shader for rendering ember particles with realistic glow,
 * color temperature variation, and soft falloff. Integrates with
 * the BSI brand colors (burnt orange, ember, gold).
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Point sprite shader for ember particles
 */
export const EmberGlowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    pointSize: { value: 20.0 },
    colorCore: { value: new THREE.Color(0xFF6B35) },     // Ember core
    colorGlow: { value: new THREE.Color(0xBF5700) },     // Burnt orange glow
    colorOuter: { value: new THREE.Color(0xC9A227) },    // Gold outer
    glowIntensity: { value: 1.5 },
    flickerSpeed: { value: 2.0 },
    flickerAmount: { value: 0.3 },
    opacity: { value: 1.0 },
    sizeAttenuation: { value: true },
  },

  vertexShader: `
    uniform float time;
    uniform float pointSize;
    uniform float flickerSpeed;
    uniform float flickerAmount;
    uniform bool sizeAttenuation;

    attribute float aLifetime;
    attribute float aRandomSeed;
    attribute float aSize;

    varying float vLifetime;
    varying float vFlicker;
    varying float vRandomSeed;

    // Simple hash function for randomness
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    void main() {
      vLifetime = aLifetime;
      vRandomSeed = aRandomSeed;

      // Calculate flicker based on time and seed
      float flickerPhase = time * flickerSpeed + aRandomSeed * 6.28;
      vFlicker = 1.0 - flickerAmount + flickerAmount * (0.5 + 0.5 * sin(flickerPhase));

      // Additional random flicker
      float randomFlicker = hash(aRandomSeed + floor(time * 10.0)) * 0.1;
      vFlicker += randomFlicker;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // Size based on lifetime (fade in then out)
      float lifetimeSize = sin(vLifetime * 3.14159);

      // Size attenuation
      float finalSize = pointSize * aSize * lifetimeSize * vFlicker;
      if (sizeAttenuation) {
        finalSize *= (300.0 / -mvPosition.z);
      }

      gl_PointSize = finalSize;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    uniform vec3 colorCore;
    uniform vec3 colorGlow;
    uniform vec3 colorOuter;
    uniform float glowIntensity;
    uniform float opacity;

    varying float vLifetime;
    varying float vFlicker;
    varying float vRandomSeed;

    void main() {
      // Calculate distance from center of point
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);

      // Discard pixels outside circle
      if (dist > 0.5) discard;

      // Soft radial gradient
      float falloff = 1.0 - smoothstep(0.0, 0.5, dist);

      // Core/glow/outer color mixing
      float coreRadius = 0.15;
      float glowRadius = 0.35;

      vec3 color;
      if (dist < coreRadius) {
        // Hot core
        color = colorCore;
      } else if (dist < glowRadius) {
        // Middle glow
        float t = (dist - coreRadius) / (glowRadius - coreRadius);
        color = mix(colorCore, colorGlow, smoothstep(0.0, 1.0, t));
      } else {
        // Outer glow
        float t = (dist - glowRadius) / (0.5 - glowRadius);
        color = mix(colorGlow, colorOuter, smoothstep(0.0, 1.0, t));
      }

      // Apply glow intensity
      color *= glowIntensity * vFlicker;

      // Alpha based on falloff and lifetime
      float lifetimeAlpha = sin(vLifetime * 3.14159);
      float alpha = falloff * lifetimeAlpha * opacity;

      // Slightly vary color temperature based on random seed
      float tempVariation = vRandomSeed * 0.2 - 0.1;
      color.r += tempVariation;
      color.b -= tempVariation * 0.5;

      gl_FragColor = vec4(color, alpha);
    }
  `,

  transparent: true,
  blending: THREE.AdditiveBlending,
  depthTest: true,
  depthWrite: false,
});

/**
 * Create attributes for ember particle geometry
 */
export function createEmberAttributes(count: number): {
  lifetime: Float32Array;
  randomSeed: Float32Array;
  size: Float32Array;
} {
  const lifetime = new Float32Array(count);
  const randomSeed = new Float32Array(count);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    lifetime[i] = Math.random();
    randomSeed[i] = Math.random();
    size[i] = 0.5 + Math.random() * 1.0;
  }

  return { lifetime, randomSeed, size };
}

/**
 * Volumetric ember trail shader for streak effects
 */
export const EmberTrailShader = {
  uniforms: {
    time: { value: 0.0 },
    colorStart: { value: new THREE.Color(0xFF6B35) },
    colorEnd: { value: new THREE.Color(0xBF5700) },
    trailLength: { value: 1.0 },
    fadeSpeed: { value: 2.0 },
  },

  vertexShader: `
    attribute float aProgress;
    attribute vec3 aPrevPosition;

    uniform float time;
    uniform float trailLength;

    varying float vProgress;

    void main() {
      vProgress = aProgress;

      // Interpolate between current and previous position for trail
      vec3 trailPos = mix(aPrevPosition, position, aProgress);

      vec4 mvPosition = modelViewMatrix * vec4(trailPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    uniform vec3 colorStart;
    uniform vec3 colorEnd;
    uniform float fadeSpeed;

    varying float vProgress;

    void main() {
      // Color gradient along trail
      vec3 color = mix(colorEnd, colorStart, vProgress);

      // Alpha fades along trail
      float alpha = pow(vProgress, fadeSpeed);

      gl_FragColor = vec4(color, alpha);
    }
  `,
};

/**
 * Ember billboard shader for larger ember sprites
 */
export const EmberBillboardMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    map: { value: null },
    colorHot: { value: new THREE.Color(0xFF8F50) },
    colorCold: { value: new THREE.Color(0x994400) },
    glowStrength: { value: 2.0 },
    pulseSpeed: { value: 1.5 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying float vViewZ;

    void main() {
      vUv = uv;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewZ = -mvPosition.z;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform sampler2D map;
    uniform vec3 colorHot;
    uniform vec3 colorCold;
    uniform float glowStrength;
    uniform float pulseSpeed;

    varying vec2 vUv;
    varying float vViewZ;

    void main() {
      // Sample texture (if provided)
      vec4 texColor = texture2D(map, vUv);

      // Procedural ember pattern if no texture
      vec2 center = vUv - 0.5;
      float dist = length(center);

      // Animated noise for ember surface
      float noise = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time * 0.7) * 0.5 + 0.5;

      // Pulsing glow
      float pulse = 0.8 + 0.2 * sin(time * pulseSpeed);

      // Color temperature based on distance from center
      vec3 color = mix(colorHot, colorCold, smoothstep(0.0, 0.5, dist));

      // Apply noise variation
      color = mix(color, colorHot, noise * 0.3);

      // Glow intensity
      float glow = (1.0 - smoothstep(0.0, 0.5, dist)) * glowStrength * pulse;
      color *= glow;

      // Alpha falloff
      float alpha = (1.0 - smoothstep(0.3, 0.5, dist)) * texColor.a;

      gl_FragColor = vec4(color, alpha);
    }
  `,

  transparent: true,
  blending: THREE.AdditiveBlending,
  depthTest: true,
  depthWrite: false,
  side: THREE.DoubleSide,
});

export default EmberGlowMaterial;
