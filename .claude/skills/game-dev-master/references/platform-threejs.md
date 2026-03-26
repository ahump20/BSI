# Platform: Three.js (In-Chat 3D Viewer)

Use for rapid 3D prototyping that renders directly in the chat window. No server, no build step — just code and see.

## When to Use

- Quick 3D concept validation before committing to a full engine.
- Visual prototypes: camera angles, lighting setups, spatial layouts.
- Interactive demos: orbit controls, click interactions, basic animation.
- Teaching/explaining 3D game concepts with live visuals.

## Tool

```
Three.js 3D Viewer:show_threejs_scene
  code: JavaScript (Three.js r128)
  height: pixels (default 400)
```

## Available Globals

Pre-loaded — do not import these:
- `THREE` — Full Three.js library (r128)
- `OrbitControls` — Camera orbit/pan/zoom
- `EffectComposer`, `RenderPass`, `UnrealBloomPass` — Post-processing
- `canvas` — Target canvas element
- `width`, `height` — Canvas dimensions

## Minimal Scene

```javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 0);

// Geometry
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff88 })
);
scene.add(mesh);

// Lighting
scene.add(new THREE.DirectionalLight(0xffffff, 1));
scene.add(new THREE.AmbientLight(0x404040));

// Camera
camera.position.set(3, 2, 3);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, canvas);

// Animate
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.01;
  controls.update();
  renderer.render(scene, camera);
}
animate();
```

## Common Patterns

### Ground Plane
```javascript
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
```

### Grid Helper
```javascript
scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
```

### Multiple Objects with Positions
```javascript
const positions = [[0,0,0], [2,0,0], [-2,0,0], [0,0,2]];
positions.forEach(([x,y,z]) => {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff6600 })
  );
  m.position.set(x, y + 0.3, z);
  scene.add(m);
});
```

### Post-Processing Bloom
```javascript
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(width, height), 1.5, 0.4, 0.85
);
composer.addPass(bloom);

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
```

### Click Detection (Raycasting)
```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children);
  if (hits.length > 0) {
    hits[0].object.material.color.setHex(Math.random() * 0xffffff);
  }
});
```

## API Notes (r128)

- **Animation loop:** Use `requestAnimationFrame(animate)` manually. The newer `renderer.setAnimationLoop(animate)` was introduced post-r128 — don't use it.
- **OrbitControls damping:** `controls.enableDamping = true` gives smoother inertia-style camera movement. Requires `controls.update()` in the render loop.
- **Camera aspect ratio:** After resizing the canvas or viewport, call `camera.aspect = newAspect; camera.updateProjectionMatrix()` — without `updateProjectionMatrix()` the scene stretches.
- **Coordinate system:** Y-up, right-handed. Same as Unity's world space.

## Limitations (r128)

- No `THREE.CapsuleGeometry` — use CylinderGeometry or SphereGeometry instead.
- No module imports beyond the pre-loaded globals.
- External assets via URL only (no local file access).
- Single canvas — no multi-viewport.
- No physics engine built in (simulate manually or prototype layout only).
- No `THREE.WebGPURenderer` — r128 is WebGL only.

## Bridging to Full Engines

Three.js prototypes translate directly:
- **Positions/scales** -> same coordinate concepts in Unity (Y-up) and Unreal (Z-up, centimeters).
- **Material colors** -> map to engine material parameters.
- **Camera setup** -> translate FOV, near/far, position to engine cameras.
- **Object hierarchy** -> maps to scene trees in all engines.

Use Three.js to validate spatial relationships, then recreate in the target engine.
