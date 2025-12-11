/**
 * Volumetric Light Shader
 *
 * God rays / volumetric light scattering effect that creates
 * dramatic lighting for sports visualizations. Uses BSI brand
 * colors for atmospheric enhancement.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Radial blur for god rays effect
 */
export const VolumetricLightShader = {
  uniforms: {
    tDiffuse: { value: null },
    lightPosition: { value: new THREE.Vector2(0.5, 0.3) },
    exposure: { value: 0.3 },
    decay: { value: 0.95 },
    density: { value: 0.8 },
    weight: { value: 0.4 },
    samples: { value: 50 },
    lightColor: { value: new THREE.Color(0xBF5700) }, // Burnt orange
    clampMax: { value: 1.0 },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 lightPosition;
    uniform float exposure;
    uniform float decay;
    uniform float density;
    uniform float weight;
    uniform int samples;
    uniform vec3 lightColor;
    uniform float clampMax;

    varying vec2 vUv;

    void main() {
      // Direction from pixel to light
      vec2 deltaTextCoord = (vUv - lightPosition) * (1.0 / float(samples)) * density;
      vec2 textCoord = vUv;

      // Initial sample
      vec4 color = texture2D(tDiffuse, textCoord);
      float illuminationDecay = 1.0;

      // Ray march toward light
      for (int i = 0; i < 100; i++) {
        if (i >= samples) break;

        textCoord -= deltaTextCoord;
        vec4 sampleColor = texture2D(tDiffuse, textCoord);
        sampleColor *= illuminationDecay * weight;
        color += sampleColor;
        illuminationDecay *= decay;
      }

      // Apply exposure and light color tint
      color *= exposure;
      color.rgb *= lightColor;
      color = clamp(color, 0.0, clampMax);

      gl_FragColor = color;
    }
  `,
};

/**
 * Screen-space god rays (more performant version)
 */
export const GodRaysShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    lightScreenPosition: { value: new THREE.Vector2(0.5, 0.5) },
    lightIntensity: { value: 1.0 },
    rayLength: { value: 1.0 },
    rayDecay: { value: 0.96 },
    rayDensity: { value: 1.0 },
    rayWeight: { value: 0.3 },
    rayColor: { value: new THREE.Color(0xFF6B35) }, // Ember
    blendMode: { value: 1 }, // 0 = add, 1 = screen
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 lightScreenPosition;
    uniform float lightIntensity;
    uniform float rayLength;
    uniform float rayDecay;
    uniform float rayDensity;
    uniform float rayWeight;
    uniform vec3 rayColor;
    uniform int blendMode;

    varying vec2 vUv;

    #define NUM_SAMPLES 30

    float getLuminance(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vec4 originalColor = texture2D(tDiffuse, vUv);

      // Calculate ray direction
      vec2 rayDir = vUv - lightScreenPosition;
      float rayDist = length(rayDir);
      rayDir = normalize(rayDir);

      // Fade rays based on distance from light
      float distanceFade = 1.0 - smoothstep(0.0, rayLength, rayDist);

      // Accumulate ray color
      vec3 rayAccum = vec3(0.0);
      float illuminationDecay = 1.0;

      vec2 samplePos = vUv;
      float stepSize = rayDist / float(NUM_SAMPLES) * rayDensity;

      for (int i = 0; i < NUM_SAMPLES; i++) {
        samplePos -= rayDir * stepSize;

        // Sample scene
        vec4 sampleColor = texture2D(tDiffuse, samplePos);

        // Use luminance for ray intensity
        float sampleLum = getLuminance(sampleColor.rgb);

        rayAccum += sampleColor.rgb * sampleLum * illuminationDecay * rayWeight;
        illuminationDecay *= rayDecay;
      }

      // Apply ray color and intensity
      rayAccum *= rayColor * lightIntensity * distanceFade;

      // Blend with original
      vec3 finalColor;
      if (blendMode == 0) {
        // Additive
        finalColor = originalColor.rgb + rayAccum;
      } else {
        // Screen
        finalColor = 1.0 - (1.0 - originalColor.rgb) * (1.0 - rayAccum);
      }

      gl_FragColor = vec4(finalColor, originalColor.a);
    }
  `,
};

/**
 * Atmospheric scattering shader for sky/environment
 */
export const AtmosphericScatteringShader = {
  uniforms: {
    sunPosition: { value: new THREE.Vector3(0, 100, 0) },
    sunColor: { value: new THREE.Color(0xFFFFFF) },
    sunIntensity: { value: 1.0 },
    rayleighCoefficient: { value: 2.0 },
    mieCoefficient: { value: 0.005 },
    mieDirectionalG: { value: 0.8 },
    turbidity: { value: 2.0 },
    luminance: { value: 1.0 },
    // BSI brand sunset colors
    horizonColor: { value: new THREE.Color(0xBF5700) },
    zenithColor: { value: new THREE.Color(0x0D0D0D) },
  },

  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vSunDirection;

    uniform vec3 sunPosition;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vSunDirection = normalize(sunPosition);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 sunColor;
    uniform float sunIntensity;
    uniform float rayleighCoefficient;
    uniform float mieCoefficient;
    uniform float mieDirectionalG;
    uniform float turbidity;
    uniform float luminance;
    uniform vec3 horizonColor;
    uniform vec3 zenithColor;

    varying vec3 vWorldPosition;
    varying vec3 vSunDirection;

    const vec3 up = vec3(0.0, 1.0, 0.0);

    // Rayleigh phase function
    float rayleighPhase(float cosTheta) {
      return (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
    }

    // Mie phase function (Henyey-Greenstein)
    float miePhase(float cosTheta, float g) {
      float g2 = g * g;
      float num = (1.0 - g2);
      float denom = pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
      return (3.0 / (8.0 * 3.14159)) * num / denom;
    }

    void main() {
      vec3 viewDir = normalize(vWorldPosition);
      float sunDot = dot(viewDir, vSunDirection);

      // Height factor (0 at horizon, 1 at zenith)
      float heightFactor = max(0.0, viewDir.y);

      // Atmospheric scattering
      float rayleigh = rayleighPhase(sunDot) * rayleighCoefficient;
      float mie = miePhase(sunDot, mieDirectionalG) * mieCoefficient * turbidity;

      // Base sky color gradient
      vec3 skyColor = mix(horizonColor, zenithColor, pow(heightFactor, 0.5));

      // Add scattering
      vec3 scatter = sunColor * sunIntensity * (rayleigh + mie);

      // Sun disc
      float sunDisc = smoothstep(0.9995, 0.9998, sunDot);
      vec3 sun = sunColor * sunIntensity * sunDisc * 2.0;

      // Combine
      vec3 finalColor = skyColor + scatter + sun;
      finalColor *= luminance;

      // Tone mapping
      finalColor = finalColor / (finalColor + vec3(1.0));

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,

  side: THREE.BackSide,
  depthWrite: false,
};

/**
 * Create a light shaft mesh
 */
export function createLightShaft(
  width: number = 10,
  height: number = 100,
  color: THREE.Color = new THREE.Color(0xBF5700)
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, height, 1, 32);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: color },
      opacity: { value: 0.3 },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vY;

      void main() {
        vUv = uv;
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float time;

      varying vec2 vUv;
      varying float vY;

      void main() {
        // Vertical fade
        float vertFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

        // Horizontal fade (narrower at top)
        float horizFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
        horizFade = pow(horizFade, mix(2.0, 4.0, vUv.y));

        // Animated shimmer
        float shimmer = sin(vUv.y * 30.0 - time * 2.0) * 0.1 + 0.9;

        float alpha = vertFade * horizFade * opacity * shimmer;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

export default VolumetricLightShader;
