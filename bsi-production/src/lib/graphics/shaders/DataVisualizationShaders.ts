/**
 * Data Visualization Shaders
 *
 * Custom shaders for 3D sports data visualization including
 * glowing bars, animated lines, holographic effects, and
 * stat comparison displays.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Data glow shader for bars and metrics
 */
export const DataGlowShader = {
  uniforms: {
    time: { value: 0.0 },
    baseColor: { value: new THREE.Color(0xBF5700) },
    glowColor: { value: new THREE.Color(0xFF6B35) },
    glowIntensity: { value: 1.5 },
    pulseSpeed: { value: 1.0 },
    pulseAmount: { value: 0.2 },
    value: { value: 1.0 }, // 0-1 representing the data value
    edgeGlow: { value: 0.3 },
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 baseColor;
    uniform vec3 glowColor;
    uniform float glowIntensity;
    uniform float pulseSpeed;
    uniform float pulseAmount;
    uniform float value;
    uniform float edgeGlow;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vViewPosition;

    void main() {
      // View direction for fresnel
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel for edge glow
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);

      // Pulsing animation
      float pulse = 1.0 + pulseAmount * sin(time * pulseSpeed);

      // Value-based coloring (higher values glow more)
      vec3 color = mix(baseColor, glowColor, value * 0.5);

      // Apply glow based on value and fresnel
      float glow = fresnel * edgeGlow + value * 0.3;
      color += glowColor * glow * glowIntensity * pulse;

      // Scanline effect
      float scanline = sin(vUv.y * 50.0 + time * 2.0) * 0.02 + 1.0;
      color *= scanline;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

/**
 * Animated data bar shader
 */
export const DataBarShader = {
  uniforms: {
    time: { value: 0.0 },
    fillAmount: { value: 0.75 }, // 0-1
    colorLow: { value: new THREE.Color(0xC9A227) },
    colorMid: { value: new THREE.Color(0xFF6B35) },
    colorHigh: { value: new THREE.Color(0xBF5700) },
    glowStrength: { value: 0.8 },
    animated: { value: true },
    animationSpeed: { value: 2.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform float fillAmount;
    uniform vec3 colorLow;
    uniform vec3 colorMid;
    uniform vec3 colorHigh;
    uniform float glowStrength;
    uniform bool animated;
    uniform float animationSpeed;

    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      // Animated fill
      float fill = fillAmount;
      if (animated) {
        float wave = sin(vUv.y * 10.0 - time * animationSpeed) * 0.02;
        fill += wave;
      }

      // Color gradient based on height
      vec3 color;
      if (vUv.y < 0.5) {
        color = mix(colorLow, colorMid, vUv.y * 2.0);
      } else {
        color = mix(colorMid, colorHigh, (vUv.y - 0.5) * 2.0);
      }

      // Fill mask
      float filled = step(vUv.y, fill);

      // Edge glow at fill line
      float edgeDist = abs(vUv.y - fill);
      float edgeGlow = (1.0 - smoothstep(0.0, 0.05, edgeDist)) * glowStrength;

      // Combine
      color = color * filled + vec3(edgeGlow) * colorHigh;

      // Add scanning line animation
      float scan = sin(vUv.y * 30.0 - time * 3.0) * 0.5 + 0.5;
      color += colorHigh * scan * 0.1 * filled;

      float alpha = max(filled, edgeGlow);

      gl_FragColor = vec4(color, alpha);
    }
  `,
};

/**
 * Animated data line shader (for charts/graphs)
 */
export const DataLineShader = {
  uniforms: {
    time: { value: 0.0 },
    lineColor: { value: new THREE.Color(0xFF6B35) },
    glowColor: { value: new THREE.Color(0xBF5700) },
    lineWidth: { value: 0.02 },
    glowWidth: { value: 0.05 },
    dashLength: { value: 0.0 }, // 0 for solid, >0 for dashed
    dashSpeed: { value: 1.0 },
    progress: { value: 1.0 }, // 0-1 for line draw animation
  },

  vertexShader: `
    attribute float lineDistance;

    varying float vLineDistance;
    varying vec2 vUv;

    void main() {
      vLineDistance = lineDistance;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 lineColor;
    uniform vec3 glowColor;
    uniform float lineWidth;
    uniform float glowWidth;
    uniform float dashLength;
    uniform float dashSpeed;
    uniform float progress;

    varying float vLineDistance;
    varying vec2 vUv;

    void main() {
      // Progress mask (for draw animation)
      float progressMask = step(vUv.x, progress);

      // Distance from line center
      float dist = abs(vUv.y - 0.5);

      // Core line
      float line = 1.0 - smoothstep(lineWidth * 0.5, lineWidth, dist);

      // Outer glow
      float glow = 1.0 - smoothstep(lineWidth, glowWidth, dist);

      // Dashing
      float dash = 1.0;
      if (dashLength > 0.0) {
        dash = step(0.5, fract((vLineDistance + time * dashSpeed) / dashLength));
      }

      // Color composition
      vec3 color = mix(glowColor * glow * 0.5, lineColor, line);
      float alpha = max(line, glow * 0.5) * dash * progressMask;

      gl_FragColor = vec4(color, alpha);
    }
  `,

  transparent: true,
  depthWrite: false,
};

/**
 * Holographic shader for futuristic data displays
 */
export const HolographicShader = {
  uniforms: {
    time: { value: 0.0 },
    primaryColor: { value: new THREE.Color(0xBF5700) },
    secondaryColor: { value: new THREE.Color(0x00FFFF) },
    scanlineIntensity: { value: 0.1 },
    scanlineFrequency: { value: 100.0 },
    scanlineSpeed: { value: 1.0 },
    fresnelPower: { value: 2.0 },
    fresnelStrength: { value: 0.8 },
    glitchIntensity: { value: 0.02 },
    opacity: { value: 0.85 },
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 primaryColor;
    uniform vec3 secondaryColor;
    uniform float scanlineIntensity;
    uniform float scanlineFrequency;
    uniform float scanlineSpeed;
    uniform float fresnelPower;
    uniform float fresnelStrength;
    uniform float glitchIntensity;
    uniform float opacity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel edge glow
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), fresnelPower);
      fresnel *= fresnelStrength;

      // Scanlines
      float scanline = sin((vWorldPosition.y + time * scanlineSpeed) * scanlineFrequency);
      scanline = (scanline * 0.5 + 0.5) * scanlineIntensity;

      // Horizontal scan bar
      float scanBar = smoothstep(0.0, 0.01, fract(vWorldPosition.y * 0.5 - time * 0.5));
      scanBar *= smoothstep(0.1, 0.09, fract(vWorldPosition.y * 0.5 - time * 0.5));

      // Glitch effect
      float glitch = 0.0;
      if (random(vec2(floor(time * 10.0), 0.0)) > 0.95) {
        glitch = random(vUv + time) * glitchIntensity;
      }

      // Color mixing
      vec3 color = mix(primaryColor, secondaryColor, fresnel);
      color += primaryColor * scanline;
      color += secondaryColor * scanBar * 0.5;
      color += glitch;

      // Edge enhancement
      color += primaryColor * fresnel * 0.5;

      float alpha = opacity * (0.5 + fresnel * 0.5 + scanBar * 0.2);

      gl_FragColor = vec4(color, alpha);
    }
  `,

  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
};

/**
 * Create a data glow material with preset options
 */
export function createDataGlowMaterial(options?: {
  baseColor?: THREE.Color;
  glowColor?: THREE.Color;
  value?: number;
  animated?: boolean;
}): THREE.ShaderMaterial {
  const defaults = {
    baseColor: new THREE.Color(0xBF5700),
    glowColor: new THREE.Color(0xFF6B35),
    value: 1.0,
    animated: true,
  };

  const settings = { ...defaults, ...options };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      baseColor: { value: settings.baseColor },
      glowColor: { value: settings.glowColor },
      glowIntensity: { value: 1.5 },
      pulseSpeed: { value: settings.animated ? 1.0 : 0.0 },
      pulseAmount: { value: settings.animated ? 0.2 : 0.0 },
      value: { value: settings.value },
      edgeGlow: { value: 0.3 },
    },
    vertexShader: DataGlowShader.vertexShader,
    fragmentShader: DataGlowShader.fragmentShader,
  });

  return material;
}

/**
 * Create holographic material for displays
 */
export function createHolographicMaterial(options?: {
  primaryColor?: THREE.Color;
  secondaryColor?: THREE.Color;
  scanlines?: boolean;
  glitch?: boolean;
}): THREE.ShaderMaterial {
  const defaults = {
    primaryColor: new THREE.Color(0xBF5700),
    secondaryColor: new THREE.Color(0x00FFFF),
    scanlines: true,
    glitch: true,
  };

  const settings = { ...defaults, ...options };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      primaryColor: { value: settings.primaryColor },
      secondaryColor: { value: settings.secondaryColor },
      scanlineIntensity: { value: settings.scanlines ? 0.1 : 0.0 },
      scanlineFrequency: { value: 100.0 },
      scanlineSpeed: { value: 1.0 },
      fresnelPower: { value: 2.0 },
      fresnelStrength: { value: 0.8 },
      glitchIntensity: { value: settings.glitch ? 0.02 : 0.0 },
      opacity: { value: 0.85 },
    },
    vertexShader: HolographicShader.vertexShader,
    fragmentShader: HolographicShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  return material;
}

export default {
  DataGlowShader,
  DataBarShader,
  DataLineShader,
  HolographicShader,
  createDataGlowMaterial,
  createHolographicMaterial,
};
