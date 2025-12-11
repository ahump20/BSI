/**
 * Heat Distortion Shader
 *
 * Creates a realistic heat distortion effect using displacement mapping
 * and animated noise. Perfect for creating atmosphere around fire/ember
 * elements in the BSI visual identity.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

export const HeatDistortionShader: THREE.ShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    distortionStrength: { value: 0.02 },
    distortionFrequency: { value: 4.0 },
    heatCenter: { value: new THREE.Vector2(0.5, 0.3) },
    heatRadius: { value: 0.4 },
    aspectRatio: { value: 1.0 },
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
    uniform float time;
    uniform float distortionStrength;
    uniform float distortionFrequency;
    uniform vec2 heatCenter;
    uniform float heatRadius;
    uniform float aspectRatio;

    varying vec2 vUv;

    // Simplex noise functions
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec2 mod289(vec2 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec3 permute(vec3 x) {
      return mod289(((x * 34.0) + 1.0) * x);
    }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                          0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                         -0.577350269189626,  // -1.0 + 2.0 * C.x
                          0.024390243902439); // 1.0 / 41.0

      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);

      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;

      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                              + i.x + vec3(0.0, i1.x, 1.0));

      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;

      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // Fractal Brownian Motion for more natural heat waves
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }

      return value;
    }

    void main() {
      // Calculate distance from heat center (accounting for aspect ratio)
      vec2 adjustedUv = vUv;
      adjustedUv.x *= aspectRatio;
      vec2 adjustedCenter = heatCenter;
      adjustedCenter.x *= aspectRatio;

      float dist = length(adjustedUv - adjustedCenter);

      // Heat intensity falls off with distance
      float heatIntensity = smoothstep(heatRadius, 0.0, dist);

      // Rising heat animation
      vec2 noiseCoord = vUv * distortionFrequency;
      noiseCoord.y -= time * 0.5; // Heat rises upward

      // Multiple layers of noise for complex distortion
      float noise1 = fbm(noiseCoord);
      float noise2 = fbm(noiseCoord * 2.0 + vec2(time * 0.3, 0.0));

      // Combine noise layers
      float combinedNoise = (noise1 + noise2 * 0.5) / 1.5;

      // Apply distortion
      vec2 distortion = vec2(
        combinedNoise * distortionStrength * heatIntensity,
        abs(combinedNoise) * distortionStrength * heatIntensity * 0.5
      );

      // Sample the texture with distortion
      vec2 distortedUv = vUv + distortion;
      vec4 color = texture2D(tDiffuse, distortedUv);

      // Add subtle heat tint (burnt orange) in distorted areas
      vec3 heatTint = vec3(0.749, 0.341, 0.0); // #BF5700
      color.rgb = mix(color.rgb, color.rgb * (1.0 + heatTint * 0.1), heatIntensity * 0.5);

      gl_FragColor = color;
    }
  `,

  transparent: true,
  depthTest: false,
  depthWrite: false,
});

/**
 * Heat Distortion Pass for EffectComposer
 */
export const HeatDistortionPassShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    distortionStrength: { value: 0.015 },
    distortionFrequency: { value: 6.0 },
    heatCenter: { value: new THREE.Vector2(0.5, 0.4) },
    heatRadius: { value: 0.5 },
    aspectRatio: { value: 1.0 },
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
    uniform float time;
    uniform float distortionStrength;
    uniform float distortionFrequency;
    uniform vec2 heatCenter;
    uniform float heatRadius;
    uniform float aspectRatio;

    varying vec2 vUv;

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

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * snoise(p);
        a *= 0.5;
        p *= 2.0;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      vec2 adjustedUv = uv;
      adjustedUv.x *= aspectRatio;
      vec2 adjustedCenter = heatCenter;
      adjustedCenter.x *= aspectRatio;

      float dist = length(adjustedUv - adjustedCenter);
      float intensity = smoothstep(heatRadius, 0.0, dist);

      vec2 nCoord = uv * distortionFrequency;
      nCoord.y -= time * 0.4;

      float n = fbm(nCoord);

      vec2 offset = vec2(n, abs(n) * 0.5) * distortionStrength * intensity;

      gl_FragColor = texture2D(tDiffuse, uv + offset);
    }
  `,
};

export default HeatDistortionShader;
