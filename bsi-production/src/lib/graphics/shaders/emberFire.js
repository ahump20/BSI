/**
 * Ember Fire Shader
 *
 * Custom GLSL shader for creating stunning ember/fire effects
 * using BSI brand colors (burnt orange, ember, flame).
 */

import * as THREE from 'three';

// Vertex Shader
export const emberFireVertex = `
  attribute vec3 position;
  attribute vec2 uv;
  attribute float size;
  attribute float life;
  attribute vec3 velocity;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uCameraPosition;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uModelViewMatrix;

  varying vec2 vUv;
  varying float vLife;
  varying float vDistance;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vLife = life;
    vPosition = position;

    // Calculate distance from camera for size attenuation
    vec4 mvPosition = uModelViewMatrix * vec4(position, 1.0);
    vDistance = length(mvPosition.xyz);

    // Size based on life and distance
    float finalSize = size * (0.5 + 0.5 * life) * (300.0 / (300.0 + vDistance));

    // Apply velocity over time
    vec3 pos = position + velocity * uTime * uIntensity;

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = finalSize;
  }
`;

// Fragment Shader
export const emberFireFragment = `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uEmberColor;
  uniform vec3 uFlameColor;
  uniform vec3 uCoreColor;
  uniform float uTurbulence;

  varying vec2 vUv;
  varying float vLife;
  varying float vDistance;
  varying vec3 vPosition;

  // Noise function for turbulence
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Calculate distance from center for radial gradient
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);

    // Noise-based turbulence
    vec3 noiseCoord = vPosition * 0.5 + vec3(0.0, uTime * 0.5, 0.0);
    float noise = snoise(noiseCoord) * uTurbulence;

    // Life-based alpha (fade out as particle dies)
    float alpha = smoothstep(1.0, 0.0, vLife);
    alpha *= smoothstep(0.0, 0.3, dist) * (1.0 - smoothstep(0.3, 1.0, dist));

    // Color gradient based on life and distance
    vec3 color;
    if (vLife > 0.7) {
      // Core: bright ember
      color = mix(uCoreColor, uEmberColor, (vLife - 0.7) / 0.3);
    } else if (vLife > 0.3) {
      // Mid: ember to flame
      color = mix(uEmberColor, uFlameColor, (vLife - 0.3) / 0.4);
    } else {
      // Outer: flame to dark
      color = mix(uFlameColor, vec3(0.1, 0.05, 0.0), (vLife - 0.0) / 0.3);
    }

    // Apply noise for turbulence
    color += noise * 0.2;

    // Distance-based intensity
    float intensity = 1.0 / (1.0 + vDistance * 0.01);
    color *= intensity;

    // Final color with alpha
    gl_FragColor = vec4(color * uIntensity, alpha);
  }
`;

// Shader Material Factory
export function createEmberFireMaterial(uniforms = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uEmberColor: { value: new THREE.Vector3(1.0, 0.42, 0.21) }, // #FF6B35
      uFlameColor: { value: new THREE.Vector3(0.91, 0.36, 0.02) }, // #E85D04
      uCoreColor: { value: new THREE.Vector3(1.0, 0.56, 0.31) }, // #FF8F50
      uTurbulence: { value: 0.5 },
      ...uniforms,
    },
    vertexShader: emberFireVertex,
    fragmentShader: emberFireFragment,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: false,
  });
}
