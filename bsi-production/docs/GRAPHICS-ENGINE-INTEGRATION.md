# BSI Graphics Engine Integration Guide

> **Version 3.0.0** | World-class 3D graphics for Blaze Sports Intel

This document provides comprehensive guidance for integrating the BSI Graphics Engine into existing pages and new features.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Core Engine](#core-engine)
4. [Shaders](#shaders)
5. [Particle Systems](#particle-systems)
6. [Sports Visualizations](#sports-visualizations)
7. [UI Effects](#ui-effects)
8. [Performance Optimization](#performance-optimization)
9. [Mobile Considerations](#mobile-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

The graphics engine is built with TypeScript and requires Three.js as a peer dependency:

```bash
# Add to package.json
npm install three @types/three
```

### Basic Usage

```typescript
import { BlazeEngine } from '@/lib/graphics';

// Create engine instance
const engine = new BlazeEngine({
  container: document.getElementById('canvas-container'),
  postProcessing: true,
  shadows: true,
});

// Add default lighting
engine.addDefaultLighting();

// Start rendering
engine.start();

// Cleanup on unmount
engine.dispose();
```

### CDN Usage (for static HTML pages)

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/examples/jsm/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>

<script type="module">
  import * as THREE from 'three';
  // Your graphics code here
</script>
```

---

## Architecture Overview

```
src/lib/graphics/
├── engine/                 # Core rendering engine
│   └── BlazeEngine.ts     # Main engine class
├── shaders/               # Custom GLSL shaders
│   ├── HeatDistortionShader.ts
│   ├── EmberGlowShader.ts
│   ├── VolumetricLightShader.ts
│   └── DataVisualizationShaders.ts
├── particles/             # Particle systems
│   ├── EmberParticleSystem.ts
│   └── DataTrailSystem.ts
├── visualizations/        # Sports-specific 3D viz
│   ├── BaseballDiamond.ts
│   ├── PitchTunnel.ts
│   └── StatComparison3D.ts
├── effects/               # UI effects
│   ├── ParallaxBackground.ts
│   ├── Card3DFlip.ts
│   └── LoadingAnimation.ts
└── index.ts               # Main export
```

---

## Core Engine

### BlazeEngine Class

The core engine handles:
- WebGL renderer setup with optimizations
- Post-processing pipeline (bloom, chromatic aberration, film grain)
- Automatic performance tier detection
- Resize handling
- Animation loop management

```typescript
import { BlazeEngine, PerformanceTier } from '@/lib/graphics';

const engine = new BlazeEngine({
  container: document.getElementById('container'),
  width: 800,          // Optional, defaults to container size
  height: 600,
  backgroundColor: 0x0D0D0D,
  antialias: true,
  alpha: true,         // Transparent background
  shadows: true,
  postProcessing: true,
  autoResize: true,
  performanceTier: PerformanceTier.HIGH, // Or let it auto-detect
  maxFPS: 60,
  onInit: () => console.log('Engine initialized'),
  onRender: (delta) => { /* Per-frame logic */ },
  onResize: (w, h) => { /* Handle resize */ },
});
```

### Performance Tiers

The engine automatically detects device capabilities and adjusts settings:

| Tier | Antialias | Pixel Ratio | Shadows | Post-Processing |
|------|-----------|-------------|---------|-----------------|
| ULTRA | Yes | Device DPR | PCFSoft | Full |
| HIGH | Yes | 1.5 max | PCF | Full |
| MEDIUM | Yes | 1.0 | Basic | Bloom only |
| LOW | No | 1.0 | None | None |
| MINIMAL | No | 0.75 | None | None |

### Post-Processing Controls

```typescript
// Adjust bloom (glow effect)
engine.setBloom(
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold
);

// Chromatic aberration (cinematic effect)
engine.setChromaticAberration(0.002);

// Film grain (editorial aesthetic)
engine.setFilmGrain(0.08);
```

---

## Shaders

### Heat Distortion

Creates realistic heat shimmer effects:

```typescript
import { HeatDistortionPassShader } from '@/lib/graphics';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

const heatPass = new ShaderPass(HeatDistortionPassShader);
heatPass.uniforms.distortionStrength.value = 0.02;
heatPass.uniforms.heatCenter.value.set(0.5, 0.4);
heatPass.uniforms.heatRadius.value = 0.5;

// Add to composer
engine.composer.addPass(heatPass);

// Update in render loop
engine.onUpdate((delta, elapsed) => {
  heatPass.uniforms.time.value = elapsed;
});
```

### Ember Glow

Custom material for glowing particles:

```typescript
import { EmberGlowMaterial, createEmberAttributes } from '@/lib/graphics';

const geometry = new THREE.BufferGeometry();
const { lifetime, randomSeed, size } = createEmberAttributes(1000);

geometry.setAttribute('aLifetime', new THREE.BufferAttribute(lifetime, 1));
geometry.setAttribute('aRandomSeed', new THREE.BufferAttribute(randomSeed, 1));
geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

const points = new THREE.Points(geometry, EmberGlowMaterial);
scene.add(points);
```

### Data Visualization Shaders

```typescript
import { createDataGlowMaterial, createHolographicMaterial } from '@/lib/graphics';

// Glowing data bars
const material = createDataGlowMaterial({
  baseColor: new THREE.Color(0xBF5700),
  glowColor: new THREE.Color(0xFF6B35),
  value: 0.75, // 0-1 normalized
  animated: true,
});

// Holographic effect
const holoMaterial = createHolographicMaterial({
  primaryColor: new THREE.Color(0xBF5700),
  scanlines: true,
  glitch: true,
});
```

---

## Particle Systems

### Ember Particle System

GPU-accelerated ember particles:

```typescript
import { EmberParticleSystem, ParticlePresets } from '@/lib/graphics';

// Create with preset
const embers = new EmberParticleSystem(ParticlePresets.backgroundEmbers);

// Or custom configuration
const embers = new EmberParticleSystem({
  count: 200,
  emitterPosition: new THREE.Vector3(0, -50, 0),
  emitterRadius: 100,
  emitterHeight: 20,
  particleSize: 8,
  lifespan: 4,
  riseSpeed: 15,
  drift: 5,
  turbulence: 2,
  glowIntensity: 1.5,
});

scene.add(embers);

// Update each frame
engine.onUpdate((delta) => {
  embers.update(delta);
});

// Change settings dynamically
embers.setConfig({ particleSize: 10, glowIntensity: 2.0 });
embers.setEmitterPosition(new THREE.Vector3(10, 0, 0));
```

### Data Trail System

Animated trajectory lines:

```typescript
import { DataTrailSystem, createCurvedTrail, createSpiralTrail, TrailPresets } from '@/lib/graphics';

// Basic trail
const trail = new DataTrailSystem(TrailPresets.pitchTrajectory);

// Add points
trail.addPoint(new THREE.Vector3(0, 0, 0), 1.0);
trail.addPoint(new THREE.Vector3(10, 5, 10), 0.8);

// Or set full path
trail.setPath(arrayOfVector3Points, arrayOfValues);

// Preset curved trail
const curvedTrail = createCurvedTrail(
  new THREE.Vector3(-30, 0, 0),
  new THREE.Vector3(30, 0, 0),
  50, // peak height
  50  // segments
);

// Spiral trail
const spiralTrail = createSpiralTrail(
  new THREE.Vector3(0, 0, 0), // center
  10,  // start radius
  30,  // end radius
  50,  // height
  3,   // rotations
  100  // segments
);
```

---

## Sports Visualizations

### Baseball Diamond

3D field with spray chart and hit tracking:

```typescript
import { BaseballDiamond, VisualizationPresets } from '@/lib/graphics';

const diamond = new BaseballDiamond(VisualizationPresets.sprayChart);
scene.add(diamond);

// Add hits
diamond.addHit({
  angle: 30,           // Launch angle
  exitVelocity: 105,   // mph
  distance: 410,       // feet
  result: 'homerun',   // 'single' | 'double' | 'triple' | 'homerun' | 'out' | 'error'
});

// Show heatmap overlay
diamond.setHeatmapVisible(true);

// Animate trajectory
diamond.animateTrajectory(
  new THREE.Vector3(0, 0, 0),    // start (home plate)
  new THREE.Vector3(100, 0, 300), // end (outfield)
  60,                             // peak height
  2000,                           // duration ms
  () => console.log('Complete')   // callback
);

// Clear all hits
diamond.clearHits();

// Update each frame
engine.onUpdate((delta) => diamond.update(delta));
```

### Pitch Tunnel

Pitch trajectory analysis:

```typescript
import { PitchTunnel, VisualizationPresets } from '@/lib/graphics';

const tunnel = new PitchTunnel(VisualizationPresets.pitchTunnel);
scene.add(tunnel);

// Add pitches
tunnel.addPitch({
  type: 'fastball',
  velocity: 96,
  spinRate: 2400,
  horizontalBreak: 2,
  verticalBreak: 15,
  releaseHeight: 6.0,
  releaseAngle: 45,
  location: { x: 0.2, y: 0.3 }, // -1 to 1 normalized
  result: 'strike',
});

tunnel.addPitch({
  type: 'curveball',
  velocity: 82,
  spinRate: 2800,
  horizontalBreak: 5,
  verticalBreak: -8,
  releaseHeight: 5.8,
  releaseAngle: 50,
  location: { x: -0.1, y: -0.2 },
  result: 'swinging_strike',
});

// Compare two pitches
tunnel.comparePitches(pitch1, pitch2);

// Adjust tunnel point
tunnel.setTunnelPoint(25); // 25 feet from plate

// Clear
tunnel.clearPitches();

// Update
engine.onUpdate((delta) => tunnel.update(delta));
```

### Stat Comparison

3D stat visualizations:

```typescript
import { StatComparison3D, VisualizationPresets, BaseballStatPresets } from '@/lib/graphics';

const comparison = new StatComparison3D(VisualizationPresets.playerComparison);
scene.add(comparison);

// Set player data
comparison.setPlayers([
  {
    name: 'Player 1',
    team: 'Cardinals',
    color: 0xBF5700,
    stats: [
      { name: 'AVG', value: 0.310, max: 0.400 },
      { name: 'HR', value: 35, max: 60 },
      { name: 'RBI', value: 95, max: 150 },
      { name: 'OBP', value: 0.400, max: 0.500 },
      { name: 'SLG', value: 0.550, max: 0.800 },
    ],
  },
  {
    name: 'Player 2',
    team: 'Cubs',
    color: 0x3B82F6,
    stats: [
      { name: 'AVG', value: 0.285, max: 0.400 },
      { name: 'HR', value: 28, max: 60 },
      { name: 'RBI', value: 82, max: 150 },
      { name: 'OBP', value: 0.365, max: 0.500 },
      { name: 'SLG', value: 0.485, max: 0.800 },
    ],
  },
]);

// Change visualization type
comparison.setType('bar');    // 3D bar chart
comparison.setType('radial'); // Radar/spider chart
comparison.setType('floating'); // 3D point cloud

// Update animation
engine.onUpdate((delta) => comparison.update(delta));
```

---

## UI Effects

### Parallax Background

Interactive 3D background with depth:

```typescript
import { ParallaxBackground, EffectPresets } from '@/lib/graphics';

const parallax = new ParallaxBackground({
  container: document.getElementById('hero'),
  ...EffectPresets.heroParallax,
});

// Adjust settings
parallax.setParallaxStrength(0.08);
parallax.setEmbers(false);

// Cleanup
parallax.dispose();
```

### 3D Card Flip

Interactive cards with tilt and flip:

```typescript
import { Card3DFlip, EffectPresets } from '@/lib/graphics';

const card = new Card3DFlip({
  container: document.getElementById('card-container'),
  width: 300,
  height: 400,
  ...EffectPresets.holographicCard,
});

// Programmatic flip
card.flip();

// Check state
if (card.getIsFlipped()) {
  // ...
}

// Set state without animation
card.setFlipped(true);

// Cleanup
card.dispose();
```

### Loading Animation

WebGL loading spinners:

```typescript
import { LoadingAnimation, EffectPresets } from '@/lib/graphics';

const loading = new LoadingAnimation({
  container: document.getElementById('loading'),
  type: 'ember', // 'ring' | 'dots' | 'bars' | 'ember'
  size: 80,
  ...EffectPresets.emberLoading,
});

// Control
loading.start();
loading.stop();
loading.setProgress(0.5); // 0-1

// Cleanup
loading.dispose();
```

---

## Performance Optimization

### Best Practices

1. **Use the right performance tier**
   ```typescript
   // Let engine auto-detect
   const engine = new BlazeEngine({ container });

   // Or force a tier for testing
   const engine = new BlazeEngine({
     container,
     performanceTier: PerformanceTier.LOW,
   });
   ```

2. **Dispose resources properly**
   ```typescript
   // Always clean up
   useEffect(() => {
     const engine = new BlazeEngine({ container });
     return () => engine.dispose();
   }, []);
   ```

3. **Use LOD (Level of Detail)**
   ```typescript
   // Reduce particle count on mobile
   const isMobile = /Android|iPhone/i.test(navigator.userAgent);
   const embers = new EmberParticleSystem({
     count: isMobile ? 50 : 200,
   });
   ```

4. **Lazy load 3D content**
   ```typescript
   // Use Intersection Observer
   const observer = new IntersectionObserver((entries) => {
     if (entries[0].isIntersecting) {
       initGraphics();
       observer.disconnect();
     }
   });
   observer.observe(container);
   ```

5. **Monitor performance**
   ```typescript
   engine.onUpdate(() => {
     const metrics = engine.getPerformanceMetrics();
     if (metrics.fps < 30) {
       // Reduce quality
       engine.setBloom(0, 0, 1);
     }
   });
   ```

---

## Mobile Considerations

### Responsive Setup

```typescript
const engine = new BlazeEngine({
  container,
  autoResize: true, // Handles orientation changes
});

// Manual resize if needed
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    engine.resize(container.clientWidth, container.clientHeight);
  }, 100);
});
```

### Touch Interactions

```typescript
// ParallaxBackground handles touch automatically
const parallax = new ParallaxBackground({
  container,
  mouseParallax: true, // Also responds to touch
});

// Card3DFlip responds to tap
const card = new Card3DFlip({ container });
// Tap to flip works out of the box
```

### Battery Considerations

```typescript
// Stop rendering when page is not visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    engine.stop();
  } else {
    engine.start();
  }
});
```

---

## Troubleshooting

### Common Issues

**WebGL not supported**
```typescript
if (!window.WebGLRenderingContext) {
  showFallback();
} else {
  initGraphics();
}
```

**Black screen / no render**
- Check container has dimensions (width/height > 0)
- Ensure camera is positioned correctly
- Verify scene has objects and lighting

**Low FPS**
- Reduce particle count
- Disable post-processing
- Lower pixel ratio
- Use simpler geometries

**Memory leaks**
- Always call `.dispose()` on cleanup
- Remove event listeners
- Clear references to Three.js objects

### Debug Mode

```typescript
// Enable Three.js renderer info
const metrics = engine.getPerformanceMetrics();
console.log({
  fps: metrics.fps,
  drawCalls: metrics.drawCalls,
  triangles: metrics.triangles,
  geometries: metrics.memory.geometries,
  textures: metrics.memory.textures,
});

// Enable GPU info
const gl = engine.renderer.getContext();
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
console.log(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
```

---

## Design Token Integration

The graphics engine uses BSI design tokens from `src/styles/tokens/`:

```typescript
import { colors, threeColors, gradients } from '@/styles/tokens';

// CSS colors
const burntOrange = colors.brand.burntOrange; // '#BF5700'

// Three.js compatible
const burntOrangeHex = threeColors.burntOrange; // 0xBF5700

// Gradients
const gradient = gradients.brandPrimary;
```

---

## Demo Page

A complete demonstration of all features is available at:

```
/graphics-demo.html
```

This includes:
- Hero parallax background
- Ember particle system
- Data trails
- Loading animations
- 3D card effects
- Baseball diamond with spray chart
- Pitch tunnel visualization
- Stat comparison charts
- Performance monitoring

---

## Support

For issues or feature requests:
- Email: austin@blazesportsintel.com
- Repository: github.com/ahump20/BSI

---

*BSI Graphics Engine v3.0.0 - Born to Blaze the Path Less Beaten*
