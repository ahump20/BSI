/**
 * FireStormShader
 *
 * Procedural flames for dramatic moments - home runs, touchdowns,
 * and championship celebrations. Uses multi-octave noise with
 * realistic fire color gradients and animated turbulence.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors for fire effects
 */
const FIRE_COLORS = {
  ember: new THREE.Color(0xFF6B35),
  burntOrange: new THREE.Color(0xBF5700),
  gold: new THREE.Color(0xC9A227),
  texasSoil: new THREE.Color(0x8B4513),
  white: new THREE.Color(0xFFFFFF),
  black: new THREE.Color(0x000000),
};

/**
 * Fire storm vertex shader
 */
export const fireStormVertexShader = `
  uniform float time;
  uniform float windStrength;
  uniform vec2 windDirection;
  uniform float turbulence;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vNoise;

  // Simplex noise implementation
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
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

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vUv = uv;
    vPosition = position;

    // Calculate wind displacement
    float t = time * 2.0;
    vec3 noisePos = position * turbulence + vec3(0.0, -t, 0.0);

    float noise = snoise(noisePos);
    noise += snoise(noisePos * 2.0) * 0.5;
    noise += snoise(noisePos * 4.0) * 0.25;

    vNoise = noise;

    // Apply wind
    vec3 displaced = position;
    float heightFactor = max(position.y, 0.0) / 10.0;
    displaced.x += windDirection.x * windStrength * heightFactor * (noise * 0.5 + 0.5);
    displaced.z += windDirection.y * windStrength * heightFactor * (noise * 0.5 + 0.5);

    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

/**
 * Fire storm fragment shader
 */
export const fireStormFragmentShader = `
  uniform float time;
  uniform vec3 coreColor;
  uniform vec3 innerColor;
  uniform vec3 outerColor;
  uniform vec3 smokeColor;
  uniform float coreIntensity;
  uniform float flameIntensity;
  uniform float flameSpeed;
  uniform float flameScale;
  uniform float smokeOpacity;
  uniform float flickerSpeed;
  uniform float flickerIntensity;
  uniform float distortion;
  uniform float heightFade;
  uniform float edgeSoftness;
  uniform bool volumetric;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vNoise;

  // Hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  // Value noise
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
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  // Turbulent noise for flame shape
  float turbulence(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * abs(noise(p) * 2.0 - 1.0);
      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  // Fire color gradient
  vec3 fireGradient(float t) {
    vec3 color;

    if (t < 0.2) {
      // Core: white-yellow
      color = mix(coreColor, innerColor, t / 0.2);
    } else if (t < 0.5) {
      // Inner: yellow-orange
      color = mix(innerColor, outerColor, (t - 0.2) / 0.3);
    } else if (t < 0.8) {
      // Outer: orange-red
      color = mix(outerColor, outerColor * 0.5, (t - 0.5) / 0.3);
    } else {
      // Edge: red-black
      color = mix(outerColor * 0.5, smokeColor, (t - 0.8) / 0.2);
    }

    return color;
  }

  void main() {
    vec2 uv = vUv;

    // Center the UV
    vec2 centeredUv = (uv - vec2(0.5)) * 2.0;

    // Distort UV for flame movement
    float t = time * flameSpeed;
    vec2 distortedUv = centeredUv;
    distortedUv.y -= t; // Rising motion
    distortedUv.x += sin(uv.y * 10.0 + t * 2.0) * distortion * 0.1;

    // Multi-octave noise for flame shape
    float flameNoise = fbm(distortedUv * flameScale, 6);
    float turbNoise = turbulence(distortedUv * flameScale * 0.5, 5);

    // Combine noises
    float flame = flameNoise * 0.6 + turbNoise * 0.4;

    // Height-based fade (stronger flames at bottom)
    float heightGradient = 1.0 - uv.y;
    heightGradient = pow(heightGradient, heightFade);

    // Radial fade from center
    float radialDist = length(centeredUv);
    float radialFade = 1.0 - smoothstep(0.0, 1.0, radialDist);

    // Combine factors
    float fireIntensity = flame * heightGradient * radialFade;
    fireIntensity = clamp(fireIntensity, 0.0, 1.0);

    // Add vertex noise influence
    fireIntensity += vNoise * 0.2;
    fireIntensity = clamp(fireIntensity, 0.0, 1.0);

    // Flicker effect
    float flicker = 1.0;
    flicker += sin(time * flickerSpeed * 10.0) * 0.05;
    flicker += sin(time * flickerSpeed * 23.0 + uv.x * 10.0) * 0.03;
    flicker += sin(time * flickerSpeed * 47.0 + uv.y * 5.0) * 0.02;

    // Random spikes
    float spikeChance = hash(floor(time * 15.0));
    if (spikeChance > 0.9) {
      flicker += (hash(floor(time * 30.0)) - 0.5) * flickerIntensity;
    }

    fireIntensity *= flicker;

    // Get color from gradient
    vec3 color = fireGradient(1.0 - fireIntensity);

    // Apply intensity
    color *= coreIntensity + fireIntensity * (flameIntensity - coreIntensity);

    // Add HDR bloom contribution
    float bloomContrib = fireIntensity * fireIntensity;
    color += coreColor * bloomContrib * 0.5;

    // Volumetric layering
    if (volumetric) {
      float depth = fbm(uv * 3.0 + time * 0.2, 3);
      color *= 0.8 + depth * 0.4;
    }

    // Edge softness
    float alpha = fireIntensity;
    alpha = smoothstep(0.0, edgeSoftness, alpha);

    // Add smoke at edges
    if (smokeOpacity > 0.0) {
      float smokeMask = (1.0 - fireIntensity) * heightGradient * 0.5;
      float smokeNoise = fbm(distortedUv * 2.0 + vec2(0.0, t * 0.3), 4);
      vec3 smoke = smokeColor * smokeNoise * smokeMask * smokeOpacity;
      color += smoke;
      alpha = max(alpha, smokeMask * smokeOpacity * smokeNoise);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Configuration interface for fire storm material
 */
export interface FireStormMaterialConfig {
  coreColor?: THREE.Color | number;
  innerColor?: THREE.Color | number;
  outerColor?: THREE.Color | number;
  smokeColor?: THREE.Color | number;
  coreIntensity?: number;
  flameIntensity?: number;
  flameSpeed?: number;
  flameScale?: number;
  smokeOpacity?: number;
  flickerSpeed?: number;
  flickerIntensity?: number;
  distortion?: number;
  heightFade?: number;
  edgeSoftness?: number;
  windStrength?: number;
  windDirection?: THREE.Vector2;
  turbulence?: number;
  volumetric?: boolean;
  transparent?: boolean;
}

/**
 * Create a fire storm material
 */
export function createFireStormMaterial(config?: FireStormMaterialConfig): THREE.ShaderMaterial {
  const defaults: Required<FireStormMaterialConfig> = {
    coreColor: FIRE_COLORS.white,
    innerColor: FIRE_COLORS.gold,
    outerColor: FIRE_COLORS.ember,
    smokeColor: FIRE_COLORS.texasSoil,
    coreIntensity: 3.0,
    flameIntensity: 2.0,
    flameSpeed: 1.0,
    flameScale: 3.0,
    smokeOpacity: 0.3,
    flickerSpeed: 1.0,
    flickerIntensity: 0.3,
    distortion: 0.5,
    heightFade: 1.5,
    edgeSoftness: 0.2,
    windStrength: 1.0,
    windDirection: new THREE.Vector2(1, 0),
    turbulence: 1.0,
    volumetric: true,
    transparent: true,
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
      innerColor: {
        value: cfg.innerColor instanceof THREE.Color
          ? cfg.innerColor
          : new THREE.Color(cfg.innerColor)
      },
      outerColor: {
        value: cfg.outerColor instanceof THREE.Color
          ? cfg.outerColor
          : new THREE.Color(cfg.outerColor)
      },
      smokeColor: {
        value: cfg.smokeColor instanceof THREE.Color
          ? cfg.smokeColor
          : new THREE.Color(cfg.smokeColor)
      },
      coreIntensity: { value: cfg.coreIntensity },
      flameIntensity: { value: cfg.flameIntensity },
      flameSpeed: { value: cfg.flameSpeed },
      flameScale: { value: cfg.flameScale },
      smokeOpacity: { value: cfg.smokeOpacity },
      flickerSpeed: { value: cfg.flickerSpeed },
      flickerIntensity: { value: cfg.flickerIntensity },
      distortion: { value: cfg.distortion },
      heightFade: { value: cfg.heightFade },
      edgeSoftness: { value: cfg.edgeSoftness },
      windStrength: { value: cfg.windStrength },
      windDirection: { value: cfg.windDirection },
      turbulence: { value: cfg.turbulence },
      volumetric: { value: cfg.volumetric },
    },
    vertexShader: fireStormVertexShader,
    fragmentShader: fireStormFragmentShader,
    transparent: cfg.transparent,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Update fire storm material time uniform
 */
export function updateFireStormMaterial(material: THREE.ShaderMaterial, delta: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += delta;
  }
}

/**
 * Create fire particle geometry (billboard quad)
 */
export function createFireGeometry(width: number = 10, height: number = 20): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(width, height, 32, 64);
}

/**
 * Preset configurations for common use cases
 */
export const FireStormPresets = {
  /** Standard BSI fire */
  standard: {
    coreColor: FIRE_COLORS.white,
    innerColor: FIRE_COLORS.gold,
    outerColor: FIRE_COLORS.ember,
    coreIntensity: 3.0,
    flameIntensity: 2.0,
  },

  /** Home run celebration */
  homeRun: {
    coreColor: FIRE_COLORS.white,
    innerColor: FIRE_COLORS.gold,
    outerColor: FIRE_COLORS.ember,
    coreIntensity: 5.0,
    flameIntensity: 4.0,
    flameSpeed: 1.5,
    flickerIntensity: 0.5,
    distortion: 0.8,
  },

  /** Burnt orange brand fire */
  burntOrange: {
    coreColor: FIRE_COLORS.gold,
    innerColor: FIRE_COLORS.burntOrange,
    outerColor: FIRE_COLORS.texasSoil,
    coreIntensity: 2.5,
    flameIntensity: 1.8,
  },

  /** Intense inferno */
  inferno: {
    coreColor: new THREE.Color(0xFFFFFF),
    innerColor: new THREE.Color(0xFFFF00),
    outerColor: FIRE_COLORS.ember,
    coreIntensity: 6.0,
    flameIntensity: 5.0,
    flameSpeed: 2.0,
    flickerIntensity: 0.6,
    distortion: 1.0,
    smokeOpacity: 0.5,
  },

  /** Campfire / subtle */
  campfire: {
    coreColor: FIRE_COLORS.gold,
    innerColor: FIRE_COLORS.ember,
    outerColor: FIRE_COLORS.burntOrange,
    coreIntensity: 1.5,
    flameIntensity: 1.2,
    flameSpeed: 0.6,
    flickerIntensity: 0.2,
    distortion: 0.3,
    smokeOpacity: 0.4,
  },

  /** Championship celebration */
  championship: {
    coreColor: new THREE.Color(0xFFFFFF),
    innerColor: FIRE_COLORS.gold,
    outerColor: FIRE_COLORS.ember,
    coreIntensity: 8.0,
    flameIntensity: 6.0,
    flameSpeed: 2.5,
    flameScale: 2.0,
    flickerIntensity: 0.8,
    distortion: 1.2,
    volumetric: true,
  },

  /** Ember glow (low intensity) */
  emberGlow: {
    coreColor: FIRE_COLORS.ember,
    innerColor: FIRE_COLORS.burntOrange,
    outerColor: FIRE_COLORS.texasSoil,
    coreIntensity: 1.0,
    flameIntensity: 0.8,
    flameSpeed: 0.3,
    flameScale: 5.0,
    flickerIntensity: 0.1,
    distortion: 0.2,
    smokeOpacity: 0.0,
    volumetric: false,
  },
};

export default createFireStormMaterial;
