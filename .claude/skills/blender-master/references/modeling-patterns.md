# Modeling Patterns

Advanced modeling techniques for game assets.

## Topology Fundamentals

### Quad Rules

- **All quads:** Games convert to triangles, but quads deform predictably
- **No n-gons:** 5+ sided faces cause shading artifacts
- **Triangles OK:** Only where quads impossible (poles, caps)

### Poles

Pole = vertex with more/fewer than 4 edges.

- **3-pole (N-pole):** Creates pinching, hide in flat areas
- **5-pole (E-pole):** Redirects edge flow, use at corners
- **6+ poles:** Avoid, causes artifacts

**Pole placement:** Keep poles away from deformation zones (joints, face).

### Edge Flow

Edges should follow:
- Muscle direction (for characters)
- Mechanical seams (for hard-surface)
- Silhouette edges (for clean outline)

```
Good edge flow around eye:
    ╭───────╮
   ╱    ◉    ╲     ← Loops orbit the eye
  │           │
   ╲         ╱
    ╰───────╯
```

## Hard-Surface Techniques

### Bevel Workflow

Real objects don't have infinitely sharp edges.

```
Sharp edge → Add bevel → Catches light realistically

Bevel settings:
├── Width: 0.01-0.05 for subtle
├── Segments: 2-4 for smooth curve
└── Profile: 0.5 default, adjust for shape
```

### Boolean Operations

Cut holes, combine shapes.

**Clean boolean workflow:**
1. Add Boolean modifier (Difference/Union/Intersect)
2. Apply modifier
3. Clean up: Remove doubles, fix normals, add edge loops

**Avoid:** Booleans on low-poly game meshes. Use for high-poly bake source.

### Subdivision Surface

Smooth mesh by subdividing.

```
Control loops:
├── Tight loops = sharp edge (add loops close together)
└── Spread loops = soft edge

Levels:
├── Viewport: 1-2 (performance)
└── Render/Export: 2-3
```

### Mirror Modifier

Work on half, mirror automatically.

```
Settings:
├── Axis: X (usually)
├── Clipping: Enable (prevents center gap)
└── Merge: Enable (welds center vertices)
```

**Workflow:** Model half → Apply mirror → Fix center seam → Export

### Decals & Floating Geometry

Add detail without increasing base mesh complexity.

- Model detail as separate floating mesh
- Sits slightly above surface
- Bake to normal map, or keep as geometry (Nanite)

## Organic Techniques

### Box Modeling

Start from cube, extrude to shape.

```
Character box model:
1. Cube → Scale to torso proportions
2. Extrude down for pelvis
3. Extrude from pelvis for legs
4. Extrude from torso for arms
5. Extrude up for neck/head
6. Add loop cuts for joints
7. Shape silhouette
```

### Sculpting Workflow

**Stages:**
1. **Primary forms:** Large shapes (Draw, Clay)
2. **Secondary forms:** Muscles, folds (Clay Strips, Crease)
3. **Tertiary detail:** Pores, wrinkles (high subdivision)

**Brush settings:**
- Strength: 0.3-0.7 for control
- Radius: Large for primary, small for detail
- Dyntopo: Enable for adding geometry as you sculpt

### Retopology Strategies

**Manual (best quality):**
1. Shrinkwrap or snap to high-poly
2. Build quads following form
3. Focus on animation loops

**Semi-auto:**
1. Use Quad Remesher addon
2. Guide loops with drawn curves
3. Clean up manually

**Targets:**
- Face: Dense around eyes, mouth, nose
- Hands: Dense at knuckles
- Joints: 3+ loops minimum for bending

## Optimization

### Polygon Reduction

**Decimate modifier:**
- Ratio: 0.5 = half polys
- Un-Subdivide: Reverse subdivision
- Planar: Remove flat geometry

**Manual reduction:**
- Dissolve edges in flat areas (X → Dissolve Edges)
- Merge close vertices (M → By Distance)
- Remove interior faces

### LOD Creation

**Manual LODs:**
1. Duplicate mesh
2. Decimate or manually reduce
3. Name: `mesh_LOD0`, `mesh_LOD1`, etc.
4. Export each level

**LOD ratios:**
- LOD0: 100% (hero distance)
- LOD1: 50% (medium)
- LOD2: 25% (far)
- LOD3: 10% (distant)

### Mesh Cleanup

Before export checklist:
- [ ] Remove doubles (M → By Distance, 0.0001)
- [ ] Recalculate normals (Shift+N)
- [ ] Apply transforms (Ctrl+A → All)
- [ ] Delete loose vertices (Mesh → Clean Up → Delete Loose)
- [ ] Check manifold (3D Print addon for watertight check)

## Modular Asset Design

### Grid Snapping

Build pieces that snap together:

1. Enable snapping (Magnet → Increment)
2. Model to grid units (1m, 0.5m, 0.25m)
3. Pivot at connection point
4. Test assembly in scene

### Trim Sheets

Texture atlas for repeated detail.

```
Trim sheet layout:
┌────────────────────┐
│ ═══════════════════│  ← Molding
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Brick
│ ░░░░░░░░░░░░░░░░░░░│  ← Concrete
│ ████████████████████│  ← Metal panel
└────────────────────┘

UV map mesh strips to trim sheet rows.
```

### Instancing

Reuse geometry for memory efficiency:

1. Create master object
2. Alt+D to create linked duplicate (shares mesh data)
3. Each instance can have unique transforms
4. Engine imports as instances

## Common Modeling Mistakes

| Mistake | Why It's Bad | Fix |
|---------|--------------|-----|
| Overlapping faces | Z-fighting, artifacts | Delete interior geometry |
| Flipped normals | Inside-out rendering | Recalculate outside |
| Non-manifold edges | Export errors, shading issues | Clean up or cap holes |
| Unapplied scale | Wrong size in engine | Ctrl+A → Scale |
| N-gons in curved areas | Shading artifacts | Convert to quads |
| Poles at joints | Pinching when animated | Move poles to flat areas |
