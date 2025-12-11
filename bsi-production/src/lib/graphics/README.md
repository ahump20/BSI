# BSI 3D Graphics Engine

A cutting-edge WebGL/Three.js graphics engine designed specifically for Blaze Sports Intel. Features advanced particle systems, custom shaders, real-time visualizations, and stunning visual effects using BSI brand colors.

## Features

- 🎨 **Brand Color Integration** - All effects use BSI brand colors (burnt orange, ember, flame, gold)
- 🔥 **Ember Particle Systems** - Volumetric fire/ember effects with physics-based movement
- 📊 **3D Data Visualizations** - Interactive charts, heatmaps, and volumetric representations
- ✨ **Custom GLSL Shaders** - High-performance custom shaders for unique visual effects
- 🎬 **Post-Processing Pipeline** - Bloom, film grain, color grading, and more
- 🖱️ **Interactive Elements** - Mouse/touch-responsive 3D objects
- ⚡ **Performance Optimized** - Efficient rendering with FPS tracking

## Installation

This engine uses Three.js and requires a module bundler (Vite, Webpack, etc.) or ES modules.

```bash
npm install three
```

## Quick Start

### Hero Background with Ember Particles

```javascript
import { HeroBackground3D } from './effects/HeroBackground3D.js';

const heroContainer = document.querySelector('.hero');
const heroBackground = new HeroBackground3D(heroContainer, {
  particleCount: 2000,
  intensity: 1.0,
  interactive: true,
});
```

### 3D Data Visualization

```javascript
import { BSI3DEngine } from './engine/BSI3DEngine.js';
import { DataVisualization3D } from './visualizations/DataVisualization3D.js';

const container = document.getElementById('viz-container');
const engine = new BSI3DEngine(container);

const data = [
  { label: 'Hits', value: 145 },
  { label: 'Runs', value: 98 },
  { label: 'RBIs', value: 87 },
];

const viz = new DataVisualization3D(engine, data, {
  type: 'bar', // 'bar', 'line', 'heatmap', 'volumetric'
  interactive: true,
  animated: true,
});
```

### Custom Particle System

```javascript
import { BSI3DEngine } from './engine/BSI3DEngine.js';
import { EmberParticleSystem } from './particles/EmberParticleSystem.js';

const container = document.getElementById('particle-container');
const engine = new BSI3DEngine(container);

const particles = new EmberParticleSystem(1000, {
  intensity: 1.0,
  turbulence: 0.6,
  speed: 0.8,
  lifeTime: 3.0,
});

engine.addParticleSystem(particles);
```

## API Reference

### BSI3DEngine

Core 3D rendering engine built on Three.js.

```javascript
const engine = new BSI3DEngine(container, {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
```

**Methods:**

- `addParticleSystem(system)` - Add a particle system to the scene
- `removeParticleSystem(system)` - Remove a particle system
- `addInteractiveObject(obj)` - Add an interactive 3D object
- `removeInteractiveObject(obj)` - Remove an interactive object
- `dispose()` - Clean up all resources
- `getFPS()` - Get current FPS
- `getScene()` - Get Three.js scene
- `getCamera()` - Get Three.js camera
- `getRenderer()` - Get Three.js renderer

### EmberParticleSystem

Advanced particle system for ember/fire effects.

```javascript
const particles = new EmberParticleSystem(count, {
  spawnRate: 10,
  lifeTime: 3.0,
  size: 0.1,
  speed: 0.5,
  turbulence: 0.5,
  intensity: 1.0,
});
```

**Methods:**

- `setIntensity(intensity)` - Adjust particle intensity
- `setTurbulence(turbulence)` - Adjust turbulence amount
- `update(delta, elapsed)` - Update particles (called automatically)
- `dispose()` - Clean up resources

### DataVisualization3D

3D data visualization component.

```javascript
const viz = new DataVisualization3D(engine, data, {
  type: 'bar', // 'bar', 'line', 'heatmap', 'volumetric'
  interactive: true,
  animated: true,
});
```

**Types:**

- `bar` - 3D bar chart with brand color gradients
- `line` - 3D line chart with animated curves
- `heatmap` - 3D heatmap grid
- `volumetric` - Volumetric cloud visualization

### HeroBackground3D

Ready-to-use hero section background with ember effects.

```javascript
const hero = new HeroBackground3D(container, {
  particleCount: 2000,
  intensity: 1.0,
  interactive: true,
});
```

**Methods:**

- `setIntensity(intensity)` - Adjust overall intensity
- `dispose()` - Clean up resources

## Custom Shaders

### Ember Fire Shader

Creates volumetric fire/ember effects with turbulence.

```javascript
import { createEmberFireMaterial } from './shaders/emberFire.js';

const material = createEmberFireMaterial({
  uIntensity: { value: 1.0 },
  uTurbulence: { value: 0.5 },
});
```

### Heat Distortion Shader

Creates heat wave/distortion effects.

```javascript
import { createHeatDistortionMaterial } from './shaders/heatDistortion.js';

const material = createHeatDistortionMaterial({
  uIntensity: { value: 1.0 },
  uHeatColor: { value: new THREE.Vector3(1.0, 0.42, 0.21) },
});
```

## Brand Colors

All components use BSI brand colors from the design system:

- **Burnt Orange**: `#BF5700` (0xBF5700)
- **Texas Soil**: `#8B4513` (0x8B4513)
- **Ember**: `#FF6B35` (0xFF6B35)
- **Gold**: `#C9A227` (0xC9A227)
- **Flame**: `#E85D04` (0xE85D04)
- **Charcoal**: `#1A1A1A` (0x1A1A1A)
- **Midnight**: `#0D0D0D` (0x0D0D0D)

## Performance

The engine is optimized for performance:

- Automatic FPS tracking
- Efficient particle systems with GPU acceleration
- Post-processing effects with configurable quality
- Responsive rendering based on device capabilities
- Automatic cleanup and memory management

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires WebGL 2.0 support

## License

© 2025 Blaze Sports Intel. All rights reserved.

---

_Born to Blaze the Path Less Beaten_
