# BSI 3D Graphics Engine - Integration Guide

## Quick Integration into Existing Site

### Option 1: Hero Background (Easiest)

Add this to your hero section in `index.html`:

```html
<section class="hero" id="hero-section">
  <!-- Your existing hero content -->
  <div class="hero-content">
    <!-- ... -->
  </div>
</section>

<script type="module">
  import { HeroBackground3D } from './src/lib/graphics/effects/HeroBackground3D.js';

  const heroSection = document.getElementById('hero-section');
  const heroBackground = new HeroBackground3D(heroSection, {
    particleCount: 2000,
    intensity: 0.8, // Slightly reduced for subtlety
    interactive: true,
  });
</script>
```

### Option 2: Analytics Dashboard Visualization

Add 3D data visualizations to your analytics pages:

```html
<div id="stats-viz" style="width: 100%; height: 600px;"></div>

<script type="module">
  import { BSI3DEngine } from './src/lib/graphics/engine/BSI3DEngine.js';
  import { DataVisualization3D } from './src/lib/graphics/visualizations/DataVisualization3D.js';

  const container = document.getElementById('stats-viz');
  const engine = new BSI3DEngine(container);

  // Example: Team batting stats
  const battingData = [
    { label: 'AVG', value: 0.312 },
    { label: 'OBP', value: 0.389 },
    { label: 'SLG', value: 0.487 },
    { label: 'OPS', value: 0.876 },
    { label: 'HR', value: 23 },
    { label: 'RBI', value: 87 },
  ];

  const viz = new DataVisualization3D(engine, battingData, {
    type: 'bar',
    interactive: true,
    animated: true,
  });
</script>
```

### Option 3: Standalone Particle Effect

Add ember particles to any section:

```html
<div id="particle-effect" style="width: 100%; height: 400px; position: relative;"></div>

<script type="module">
  import { BSI3DEngine } from './src/lib/graphics/engine/BSI3DEngine.js';
  import { EmberParticleSystem } from './src/lib/graphics/particles/EmberParticleSystem.js';

  const container = document.getElementById('particle-effect');
  const engine = new BSI3DEngine(container);

  const particles = new EmberParticleSystem(1500, {
    intensity: 1.0,
    turbulence: 0.6,
  });

  engine.addParticleSystem(particles);
</script>
```

## Using with Cloudflare Workers

Since your site uses Cloudflare Workers, you'll need to:

1. **Bundle the modules** - Use a bundler like Vite or esbuild to create a single bundle
2. **Serve from R2** - Upload the bundled files to your R2 bucket
3. **Import in HTML** - Reference the bundled file

### Build Setup (package.json)

```json
{
  "scripts": {
    "build:graphics": "vite build src/lib/graphics/index.js --outDir dist/graphics --format es",
    "deploy:graphics": "wrangler r2 object put blazesports-assets/origin/graphics/bundle.js --file=dist/graphics/index.js"
  },
  "dependencies": {
    "three": "^0.160.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### Worker Integration

Update your `worker.js` to serve the graphics bundle:

```javascript
// In your Cloudflare Worker
if (url.pathname === '/graphics/bundle.js') {
  const bundle = await env.ASSETS.get('origin/graphics/bundle.js');
  return new Response(bundle.body, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
```

## Performance Considerations

- **Particle Count**: Start with 1000-2000 particles, increase only if needed
- **Mobile**: Reduce particle count on mobile devices
- **Lazy Load**: Only initialize graphics when section is visible
- **Dispose**: Always call `dispose()` when removing components

## Brand Color Integration

All components automatically use BSI brand colors:
- Burnt Orange (#BF5700)
- Ember (#FF6B35)
- Flame (#E85D04)
- Gold (#C9A227)

No additional color configuration needed!

## Examples

See `demo.html` for full working examples of all components.

---

*Built for Blaze Sports Intel - Born to Blaze the Path Less Beaten*
