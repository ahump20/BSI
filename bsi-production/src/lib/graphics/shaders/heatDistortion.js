/**
 * Heat Distortion Shader
 *
 * Creates realistic heat wave/distortion effects
 * perfect for ember/fire visualizations.
 */

import * as THREE from 'three';

export const heatDistortionVertex = `
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 uProjectionMatrix;
  uniform mat4 uModelViewMatrix;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(position, 1.0);
  }
`;

export const heatDistortionFragment = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uResolution;
  uniform vec3 uHeatColor;

  varying vec2 vUv;
  varying vec3 vPosition;

  // Simple noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // Perlin-like noise
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Fractal noise
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Create distortion based on noise
    vec2 distortion = vec2(
      fbm(vUv * 3.0 + uTime * 0.5),
      fbm(vUv * 3.0 + uTime * 0.5 + 100.0)
    );

    // Apply distortion to UV coordinates
    vec2 distortedUv = vUv + distortion * uIntensity * 0.02;

    // Sample texture with distortion
    vec4 texColor = texture2D(uTexture, distortedUv);

    // Add heat color tint
    float heatFactor = fbm(vUv * 2.0 + uTime * 0.3) * 0.3;
    vec3 heatTint = mix(texColor.rgb, uHeatColor, heatFactor);

    // Add glow effect
    float glow = smoothstep(0.3, 0.7, fbm(vUv * 4.0 + uTime * 0.4));
    heatTint += uHeatColor * glow * 0.2;

    gl_FragColor = vec4(heatTint, texColor.a);
  }
`;

export function createHeatDistortionMaterial(uniforms = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uHeatColor: { value: new THREE.Vector3(1.0, 0.42, 0.21) }, // Ember color
      ...uniforms,
    },
    vertexShader: heatDistortionVertex,
    fragmentShader: heatDistortionFragment,
  });
}
