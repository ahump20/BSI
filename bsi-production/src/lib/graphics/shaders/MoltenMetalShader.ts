/**
 * MoltenMetalShader
 *
 * Burnt orange liquid metal effect for statistics visualization.
 * Creates a flowing, molten appearance with realistic metallic
 * reflections and heat distortion.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors for molten metal effects
 */
const MOLTEN_COLORS = {
  burntOrange: new THREE.Color(0xBF5700),
  ember: new THREE.Color(0xFF6B35),
  gold: new THREE.Color(0xC9A227),
  texasSoil: new THREE.Color(0x8B4513),
  white: new THREE.Color(0xFFFFFF),
};

/**
 * Molten metal vertex shader
 */
export const moltenMetalVertexShader = `
  uniform float time;
  uniform float waveAmplitude;
  uniform float waveFrequency;
  uniform float waveSpeed;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  // Simplex noise functions
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

    // Calculate flowing displacement
    float t = time * waveSpeed;
    vec3 noisePos = position * waveFrequency + vec3(0.0, t, t * 0.5);

    float displacement = snoise(noisePos) * waveAmplitude;
    displacement += snoise(noisePos * 2.0) * waveAmplitude * 0.5;
    displacement += snoise(noisePos * 4.0) * waveAmplitude * 0.25;

    vDisplacement = displacement;

    // Apply displacement along normal
    vec3 newPosition = position + normal * displacement;

    // Recalculate normal based on displacement
    float eps = 0.01;
    vec3 tangent1 = vec3(1.0, 0.0, 0.0);
    vec3 tangent2 = cross(normal, tangent1);

    float d1 = snoise((position + tangent1 * eps) * waveFrequency + vec3(0.0, t, t * 0.5));
    float d2 = snoise((position + tangent2 * eps) * waveFrequency + vec3(0.0, t, t * 0.5));

    vec3 p1 = position + tangent1 * eps + normal * d1 * waveAmplitude;
    vec3 p2 = position + tangent2 * eps + normal * d2 * waveAmplitude;

    vNormal = normalize(cross(p1 - newPosition, p2 - newPosition));

    vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Molten metal fragment shader
 */
export const moltenMetalFragmentShader = `
  uniform float time;
  uniform vec3 hotColor;
  uniform vec3 coolColor;
  uniform vec3 coreColor;
  uniform float metalness;
  uniform float roughness;
  uniform float flowSpeed;
  uniform float flowScale;
  uniform float glowIntensity;
  uniform float temperatureVariation;
  uniform float specularIntensity;
  uniform vec3 lightPosition;
  uniform vec3 lightColor;
  uniform float envMapIntensity;
  uniform samplerCube envMap;
  uniform bool useEnvMap;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  // Hash function for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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

    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
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

  // GGX/Trowbridge-Reitz distribution
  float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = 3.14159265 * denom * denom;

    return nom / denom;
  }

  // Geometry function
  float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
  }

  float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
  }

  // Fresnel Schlick
  vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(lightPosition - vWorldPosition);
    vec3 halfDir = normalize(lightDir + viewDir);

    // Calculate flowing temperature pattern
    vec2 flowUv = vUv * flowScale + time * flowSpeed * vec2(0.3, 0.7);
    float flowPattern = fbm(flowUv, 5);
    flowPattern += fbm(flowUv * 2.0 - time * flowSpeed * 0.5, 4) * 0.5;

    // Add displacement-based temperature
    float displacement = (vDisplacement + 0.5) * temperatureVariation;
    float temperature = flowPattern * 0.6 + displacement * 0.4;
    temperature = clamp(temperature, 0.0, 1.0);

    // Color based on temperature
    vec3 color;
    if (temperature < 0.3) {
      color = mix(coolColor, hotColor, temperature / 0.3);
    } else if (temperature < 0.7) {
      color = mix(hotColor, coreColor, (temperature - 0.3) / 0.4);
    } else {
      color = mix(coreColor, vec3(1.0), (temperature - 0.7) / 0.3);
    }

    // PBR lighting
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, color, metalness);

    // Cook-Torrance BRDF
    float NDF = distributionGGX(normal, halfDir, roughness);
    float G = geometrySmith(normal, viewDir, lightDir, roughness);
    vec3 F = fresnelSchlick(max(dot(halfDir, viewDir), 0.0), F0);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(normal, viewDir), 0.0) * max(dot(normal, lightDir), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metalness;

    float NdotL = max(dot(normal, lightDir), 0.0);
    vec3 Lo = (kD * color / 3.14159265 + specular * specularIntensity) * lightColor * NdotL;

    // Environment reflection
    vec3 envColor = vec3(0.0);
    if (useEnvMap) {
      vec3 reflectDir = reflect(-viewDir, normal);
      envColor = textureCube(envMap, reflectDir).rgb * envMapIntensity;
      envColor = mix(envColor, envColor * color, 0.5);
    }

    // Fresnel rim glow
    float rim = fresnel(normal, viewDir, 2.0);
    vec3 rimGlow = coreColor * rim * glowIntensity;

    // Self-illumination based on temperature
    vec3 emission = color * temperature * glowIntensity;

    // Final color
    vec3 ambient = color * 0.1;
    vec3 finalColor = ambient + Lo + envColor * metalness + rimGlow + emission;

    // Tone mapping
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Configuration interface for molten metal material
 */
export interface MoltenMetalMaterialConfig {
  hotColor?: THREE.Color | number;
  coolColor?: THREE.Color | number;
  coreColor?: THREE.Color | number;
  metalness?: number;
  roughness?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  flowSpeed?: number;
  flowScale?: number;
  glowIntensity?: number;
  temperatureVariation?: number;
  specularIntensity?: number;
  lightPosition?: THREE.Vector3;
  lightColor?: THREE.Color | number;
  envMap?: THREE.CubeTexture;
  envMapIntensity?: number;
}

/**
 * Create a molten metal material
 */
export function createMoltenMetalMaterial(config?: MoltenMetalMaterialConfig): THREE.ShaderMaterial {
  const defaults: Required<MoltenMetalMaterialConfig> = {
    hotColor: MOLTEN_COLORS.burntOrange,
    coolColor: MOLTEN_COLORS.texasSoil,
    coreColor: MOLTEN_COLORS.ember,
    metalness: 0.9,
    roughness: 0.3,
    waveAmplitude: 0.1,
    waveFrequency: 2.0,
    waveSpeed: 0.5,
    flowSpeed: 0.2,
    flowScale: 3.0,
    glowIntensity: 1.5,
    temperatureVariation: 0.5,
    specularIntensity: 2.0,
    lightPosition: new THREE.Vector3(50, 50, 50),
    lightColor: MOLTEN_COLORS.white,
    envMap: undefined as unknown as THREE.CubeTexture,
    envMapIntensity: 0.5,
  };

  const cfg = { ...defaults, ...config };

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      hotColor: {
        value: cfg.hotColor instanceof THREE.Color
          ? cfg.hotColor
          : new THREE.Color(cfg.hotColor)
      },
      coolColor: {
        value: cfg.coolColor instanceof THREE.Color
          ? cfg.coolColor
          : new THREE.Color(cfg.coolColor)
      },
      coreColor: {
        value: cfg.coreColor instanceof THREE.Color
          ? cfg.coreColor
          : new THREE.Color(cfg.coreColor)
      },
      metalness: { value: cfg.metalness },
      roughness: { value: cfg.roughness },
      waveAmplitude: { value: cfg.waveAmplitude },
      waveFrequency: { value: cfg.waveFrequency },
      waveSpeed: { value: cfg.waveSpeed },
      flowSpeed: { value: cfg.flowSpeed },
      flowScale: { value: cfg.flowScale },
      glowIntensity: { value: cfg.glowIntensity },
      temperatureVariation: { value: cfg.temperatureVariation },
      specularIntensity: { value: cfg.specularIntensity },
      lightPosition: { value: cfg.lightPosition },
      lightColor: {
        value: cfg.lightColor instanceof THREE.Color
          ? cfg.lightColor
          : new THREE.Color(cfg.lightColor)
      },
      envMap: { value: cfg.envMap || null },
      useEnvMap: { value: !!cfg.envMap },
      envMapIntensity: { value: cfg.envMapIntensity },
    },
    vertexShader: moltenMetalVertexShader,
    fragmentShader: moltenMetalFragmentShader,
    side: THREE.DoubleSide,
  });
}

/**
 * Update molten metal material time uniform
 */
export function updateMoltenMetalMaterial(material: THREE.ShaderMaterial, delta: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += delta;
  }
}

/**
 * Preset configurations for common use cases
 */
export const MoltenMetalPresets = {
  /** Standard burnt orange molten metal */
  standard: {
    hotColor: MOLTEN_COLORS.burntOrange,
    coolColor: MOLTEN_COLORS.texasSoil,
    coreColor: MOLTEN_COLORS.ember,
    glowIntensity: 1.5,
  },

  /** Molten gold for highlights */
  gold: {
    hotColor: MOLTEN_COLORS.gold,
    coolColor: MOLTEN_COLORS.burntOrange,
    coreColor: new THREE.Color(0xFFD700),
    glowIntensity: 2.0,
    metalness: 0.95,
  },

  /** Intense ember for active stats */
  ember: {
    hotColor: MOLTEN_COLORS.ember,
    coolColor: MOLTEN_COLORS.burntOrange,
    coreColor: new THREE.Color(0xFFFFFF),
    glowIntensity: 2.5,
    flowSpeed: 0.4,
  },

  /** Cooled metal for inactive states */
  cooled: {
    hotColor: MOLTEN_COLORS.texasSoil,
    coolColor: new THREE.Color(0x3A2A1A),
    coreColor: MOLTEN_COLORS.burntOrange,
    glowIntensity: 0.5,
    flowSpeed: 0.1,
    temperatureVariation: 0.2,
  },

  /** Liquid chrome with orange tint */
  chrome: {
    hotColor: new THREE.Color(0xE8E8E8),
    coolColor: MOLTEN_COLORS.burntOrange,
    coreColor: new THREE.Color(0xFFFFFF),
    metalness: 1.0,
    roughness: 0.1,
    glowIntensity: 0.8,
    specularIntensity: 4.0,
  },
};

export default createMoltenMetalMaterial;
