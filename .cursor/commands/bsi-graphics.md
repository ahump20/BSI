# /bsi-graphics — 3D graphics development

When working on the Blaze Graphics Engine or 3D visualizations:

## Architecture reference
```
bsi-production/src/lib/graphics/
├── engine/          # BlazeEngine, BlazeGraphicsEngine
├── shaders/         # Custom GLSL shaders
├── particles/       # Ember, DataTrail, DataRiver systems
├── visualizations/  # BaseballDiamond, PitchTunnel, StrikeZone3D
├── effects/         # Parallax, Card3D, Loading
├── postprocessing/  # BlazeComposer
└── react/           # BlazeCanvas, useBlaze3D, BlazeBackground
```

## Development checklist
1. What type of visualization? (shader, particle, 3D scene)
2. Performance target? (60fps mobile required)
3. Data source? (live stats, historical)
4. React integration needed?

## Performance guidelines
- Use instanced geometry for repeated objects
- Implement LOD (Level of Detail)
- Dispose geometries/materials on cleanup
- Test on mobile devices

## Shader development
```glsl
// Include required uniforms
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uTexture;

// Output
varying vec2 vUv;
```

## React integration
```tsx
import { BlazeCanvas, useBlaze3D } from '@/lib/graphics/react';

function MyVisualization() {
  const { scene, camera, addObject } = useBlaze3D();
  // Setup scene...
  return <BlazeCanvas />;
}
```

## Testing
- Test across GPU tiers (integrated, dedicated)
- Verify mobile performance
- Check memory usage over time
- Test animation smoothness

## Common tasks
| Task | Location |
|------|----------|
| Add new shader | `src/lib/graphics/shaders/` |
| Add particle effect | `src/lib/graphics/particles/` |
| Add 3D component | `src/components/3d/` |
| Add visualization | `src/lib/graphics/visualizations/` |
