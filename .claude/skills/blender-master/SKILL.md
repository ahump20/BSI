---
name: blender-master
description: |
  Create production-quality 3D assets for games using Blender. Covers the full asset pipeline
  from concept to engine-ready exports: modeling, sculpting, retopology, UV mapping, texturing,
  rigging, animation, and optimized exports for Unity, Unreal, Godot, and web engines.

  Use when: (1) Creating 3D models for games, (2) Rigging and animating characters,
  (3) Setting up materials and textures, (4) Exporting assets to game engines,
  (5) Optimizing meshes for real-time rendering, (6) Baking high-poly details to low-poly.

  Handles: Characters, props, environments, weapons, vehicles, creatures, UI elements.
  Targets: Unity, Unreal Engine 5, Godot, Babylon.js, Three.js, PlayCanvas.

  Example triggers: "model a character in Blender", "rig this mesh", "export to Unity",
  "bake normal maps", "create game-ready asset", "UV unwrap", "weight painting help",
  "Blender to Unreal workflow", "low-poly modeling", "PBR texturing".
---

# Blender Master

Production 3D asset creation for games. Blender 4.x patterns.

## Asset Pipeline Overview

```
Concept → Block-out → High-poly → Retopo → UV → Bake → Texture → Rig → Animate → Export
```

**Not every asset needs every step:**

| Asset Type | Modeling | Sculpt | Retopo | Rig | Animate |
|------------|----------|--------|--------|-----|---------|
| Hard-surface prop | Yes | Optional | No | No | No |
| Organic character | Yes | Yes | Yes | Yes | Yes |
| Environment piece | Yes | Optional | Optional | No | No |
| Weapon | Yes | Optional | No | Optional | Optional |
| Vehicle | Yes | No | No | Yes | Yes |

## Polygon Budgets (Real-Time)

| Platform | Hero Character | Secondary | Props | Environment |
|----------|----------------|-----------|-------|-------------|
| Mobile | 5-15K | 2-8K | 500-2K | 50-200K total |
| PC/Console | 30-100K | 10-30K | 2-10K | 500K-2M total |
| Web/Browser | 3-10K | 1-5K | 200-1K | 30-100K total |

**LOD (Level of Detail):** Create 3-4 versions at 100%, 50%, 25%, 10% poly count.

## Core Blender Concepts

### Navigation
- **Orbit:** Middle mouse
- **Pan:** Shift + Middle mouse
- **Zoom:** Scroll wheel
- **Numpad:** 1=Front, 3=Right, 7=Top, 5=Toggle ortho/persp, 0=Camera

### Modes
- **Object Mode (Tab):** Transform whole objects
- **Edit Mode (Tab):** Modify geometry (vertices, edges, faces)
- **Sculpt Mode:** Organic deformation with brushes
- **Weight Paint:** Assign bone influence
- **Texture Paint:** Paint directly on model

### Selection
- **A:** Select all
- **Alt+A:** Deselect all
- **B:** Box select
- **C:** Circle select
- **L:** Select linked
- **Ctrl+L:** Select linked (by material, etc.)

### Transform
- **G:** Grab/move
- **R:** Rotate
- **S:** Scale
- **X/Y/Z:** Constrain to axis
- **Shift+X/Y/Z:** Constrain to plane (exclude axis)
- **Type number:** Precise value (e.g., S 2 Enter = scale 2x)

### Essential Operations
- **E:** Extrude
- **I:** Inset faces
- **Ctrl+R:** Loop cut
- **K:** Knife tool
- **F:** Fill/create face
- **M:** Merge vertices
- **P:** Separate selection
- **Ctrl+J:** Join objects

## Modeling Workflow

### Hard-Surface (Props, Weapons, Vehicles)

1. **Block-out:** Start with primitives, rough shapes
2. **Add detail:** Loop cuts, bevels, booleans
3. **Clean topology:** Remove n-gons, fix poles
4. **Apply scale:** Ctrl+A → Scale (CRITICAL before export)

```
Workflow: Cube → Extrude → Loop Cut → Bevel edges → Add details
```

**Key modifiers:**
- **Bevel:** Rounded edges (critical for realistic lighting)
- **Boolean:** Cut holes, combine shapes
- **Mirror:** Work on half, mirror result
- **Array:** Repeat geometry
- **Solidify:** Add thickness to flat surfaces

### Organic (Characters, Creatures)

1. **Base mesh:** Low-poly proportions (box modeling or sculpt)
2. **Sculpt:** Add detail in Sculpt mode
3. **Retopology:** Create clean, animation-ready mesh over sculpt
4. **Bake:** Transfer sculpt detail to normal/displacement maps

**Sculpt brushes:**
- **Draw:** Add/remove volume
- **Clay Strips:** Build up form
- **Smooth:** Even surface
- **Crease:** Sharp lines
- **Grab:** Move chunks of mesh
- **Inflate:** Expand volume

### Retopology

Manual retopo workflow:
1. Enable snapping: Magnet icon → Face → Project Individual Elements
2. Add new mesh, enter Edit mode
3. Build clean quads over high-poly surface
4. Focus on edge loops for animation (joints, face)

**Target topology:**
- All quads (no triangles, no n-gons)
- Edge loops follow muscle/joint flow
- Denser at deformation points (elbows, knees, face)
- Sparser on static areas (torso back, skull top)

## UV Mapping

UV unwrapping = flattening 3D surface to 2D for texturing.

### Workflow

1. **Mark seams:** Select edges → Ctrl+E → Mark Seam
2. **Unwrap:** U → Unwrap
3. **Pack:** UV menu → Pack Islands
4. **Straighten:** Select → UV → Align

### Seam Placement Rules

- Hide seams in unseen areas (underarms, inner legs, bottom)
- Follow natural breaks (clothing edges, material boundaries)
- Minimize stretching (check with UV → Display Stretch)
- Keep islands proportional to 3D size

### UV Tools

- **Project from View:** Quick unwrap for flat surfaces
- **Cube/Cylinder/Sphere Projection:** Geometric unwraps
- **Smart UV Project:** Automatic (messy but fast)
- **Minimize Stretch:** Reduce distortion

**Texel density:** Keep consistent pixel-per-unit across model. Select all UVs → UV → Average Islands Scale.

## Materials & Texturing

### PBR Material Setup

Principled BSDF is the standard game-ready shader:

```
Principled BSDF inputs:
├── Base Color      → Albedo/Diffuse texture
├── Metallic        → 0=dielectric, 1=metal (usually texture)
├── Roughness       → 0=mirror, 1=matte (texture)
├── Normal          → Normal map (via Normal Map node)
├── Emission        → Glowing areas
└── Alpha           → Transparency
```

### Texture Baking

Transfer detail from high-poly to low-poly via textures.

**Bake types:**
- **Normal:** Surface detail without geometry
- **Ambient Occlusion:** Soft shadows in crevices
- **Curvature:** Edge/cavity detection
- **ID/Color:** Material separation masks

**Bake workflow:**
1. UV unwrap low-poly
2. Select high-poly, then low-poly (low-poly active)
3. Render Properties → Bake → Selected to Active
4. Set ray distance to cover gap
5. Bake each map type

### Texture Painting

Paint directly in Blender or export UVs to external tools (Substance Painter, Quixel Mixer, ArmorPaint).

**Blender texture paint:**
1. Create image in UV Editor (power of 2: 1024, 2048, 4096)
2. Assign to material node
3. Switch to Texture Paint mode
4. Paint with brushes

## Rigging

Armature = skeleton for animation.

### Basic Rig Setup

1. **Add Armature:** Shift+A → Armature
2. **Edit bones:** Tab into Edit mode, E to extrude
3. **Name bones:** Consistent naming (spine.001, arm.L, arm.R)
4. **Parent mesh:** Select mesh, Shift+select armature, Ctrl+P → With Automatic Weights

### Bone Hierarchy

```
Root
└── Spine
    ├── Spine.001
    │   └── Spine.002
    │       ├── Neck → Head
    │       ├── Shoulder.L → Arm.L → Forearm.L → Hand.L
    │       └── Shoulder.R → Arm.R → Forearm.R → Hand.R
    └── Pelvis
        ├── Thigh.L → Shin.L → Foot.L → Toe.L
        └── Thigh.R → Shin.R → Foot.R → Toe.R
```

### Weight Painting

Weights determine how much each bone moves each vertex (0-1).

**Workflow:**
1. Select mesh, then armature bone
2. Enter Weight Paint mode
3. Paint: Red=1 (full influence), Blue=0 (no influence)
4. Use Blur brush to smooth transitions

**Common issues:**
- Vertices not moving: Check weights assigned
- Mesh tearing: Overlapping influences not blending
- Popping joints: Needs more weight gradient at joint

### Inverse Kinematics (IK)

IK = move hand/foot, arm/leg follows automatically.

1. Add IK target bone (not connected)
2. Select arm/leg tip bone
3. Bone Constraints → Inverse Kinematics
4. Set target to IK bone, chain length to limb bones

## Animation

### Keyframe Basics

- **I:** Insert keyframe
- **Location/Rotation/Scale:** Common keyframe types
- **Timeline:** Scrub, set frame range
- **Dope Sheet:** View all keyframes
- **Graph Editor:** Edit interpolation curves

### Animation Workflow

1. Set start/end frames (usually 0-based for games)
2. Pose character at key poses
3. Insert keyframes (I → Location/Rotation)
4. Scrub between, adjust timing
5. Add breakdowns (in-between poses)

### Action System

Actions = reusable animation clips.

1. Create action in Action Editor
2. Name clearly: "Idle", "Walk", "Run", "Attack"
3. Push to NLA (Nonlinear Animation) to store
4. Export individual actions to engine

**Game animation tips:**
- Loop seamlessly: First/last frames match
- Root motion vs in-place: Engine-dependent
- Keep actions short, blend in engine

## Export for Game Engines

### FBX Export Settings

```
FBX Export:
├── Scale: 1.0 (or match engine units)
├── Apply Scalings: FBX All
├── Forward: -Z Forward (Unity), Y Forward (Unreal)
├── Up: Y Up
├── Apply Transform: Yes (bakes rotation/scale)
├── Mesh:
│   ├── Apply Modifiers: Yes
│   └── Triangulate: Yes (optional, engines do this)
├── Armature:
│   ├── Add Leaf Bones: No (usually)
│   └── Primary Bone Axis: Y
└── Animation:
    ├── Bake Animation: Yes
    └── NLA Strips / All Actions: Depends on workflow
```

### glTF Export (Web/Godot)

Preferred for web engines (Three.js, Babylon.js) and Godot.

```
glTF Export:
├── Format: glTF Binary (.glb) for single file
├── Include: Selected Objects
├── Transform: +Y Up
├── Mesh:
│   ├── Apply Modifiers: Yes
│   └── UVs, Normals, Tangents: Yes
├── Material: Export (embeds textures in .glb)
└── Animation: Export
```

### Engine-Specific Notes

**Unity:**
- Scale: 1 unit = 1 meter (Blender default matches)
- Import settings: Rig → Animation Type (Humanoid for characters)
- Materials: Extract and assign

**Unreal Engine 5:**
- Scale: 1 unit = 1 cm (scale Blender export by 100 or adjust in UE)
- Import: Skeletal Mesh for rigged, Static Mesh for props
- Nanite: Enable for high-poly static meshes

**Godot:**
- Supports .glb/.gltf natively
- Import dock: Reimport with settings
- AnimationPlayer: Splits actions automatically

**Web (Three.js/Babylon.js):**
- Use .glb (binary, compressed)
- Draco compression for large meshes
- Keep textures power-of-2, compressed (WebP/KTX2)

## Common Issues & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| Mesh inside-out | Flipped normals | Edit Mode → Mesh → Normals → Recalculate Outside |
| Dark spots on model | Bad normals | Add Weighted Normal modifier, or fix geometry |
| Scale issues in engine | Unapplied transforms | Ctrl+A → All Transforms before export |
| Animation jitters | Keyframe interpolation | Graph Editor → Set to Linear or adjust handles |
| Texture seams visible | UV seam placement | Move seams to hidden areas, or paint over in texture |
| Bones not exporting | Not in rest pose | Pose → Apply → Apply Pose as Rest Pose |
| Mesh deforms wrong | Bad weights | Weight paint, normalize weights |

## File Organization

```
project/
├── blend/
│   ├── character_hero.blend
│   ├── props_weapons.blend
│   └── environment_modular.blend
├── textures/
│   ├── T_Hero_BaseColor.png
│   ├── T_Hero_Normal.png
│   └── T_Hero_ORM.png    (Occlusion/Roughness/Metallic packed)
└── export/
    ├── SM_Prop_Crate.fbx
    ├── SK_Hero.fbx
    └── SK_Hero_Animations.fbx
```

**Naming conventions:**
- `SM_` = Static Mesh
- `SK_` = Skeletal Mesh
- `T_` = Texture
- `M_` = Material
- `A_` = Animation

## Reference Files

For deep dives, see:

- `references/modeling-patterns.md` — Advanced modeling techniques, topology guides
- `references/rigging-animation.md` — Complex rigs, IK/FK, animation principles
- `references/materials-texturing.md` — Node setups, baking workflows, PBR theory
- `references/game-asset-export.md` — Engine-specific pipelines, optimization
