# Game Asset Export

Engine-specific export workflows and optimization.

## Pre-Export Checklist

Before any export:

- [ ] Apply transforms: `Ctrl+A → All Transforms`
- [ ] Apply modifiers (or export will apply automatically)
- [ ] Check normals: `Mesh → Normals → Recalculate Outside`
- [ ] Remove doubles: `M → By Distance`
- [ ] Delete loose geometry: `Mesh → Clean Up → Delete Loose`
- [ ] Origin at logical point (center of mass, bottom center, etc.)
- [ ] Name objects clearly

## FBX Export

### Universal Settings

```
File → Export → FBX (.fbx)

Main:
├── Path Mode: Copy (embeds textures) or Auto
├── Batch Mode: Off (single file)
└── Selected Objects: Enable if not exporting all

Include:
├── Object Types: Mesh, Armature (as needed)
├── Custom Properties: Enable for metadata
└── Limit to: Selected Objects

Transform:
├── Scale: 1.0
├── Apply Scalings: FBX All
├── Forward: -Z Forward (most common)
├── Up: Y Up
└── Apply Transform: Enable

Geometry:
├── Smoothing: Face (or Edge if using custom normals)
├── Export Subdivision Surface: Off (apply first)
├── Apply Modifiers: On
└── Triangulate Faces: On (or let engine handle)

Armature:
├── Primary Bone Axis: Y Axis
├── Secondary Bone Axis: X Axis
├── Armature FBXNode Type: Null (or Limb Node)
├── Only Deform Bones: Enable (removes helper bones)
└── Add Leaf Bones: Off

Animation:
├── Baked Animation: On
├── Key All Bones: On
├── NLA Strips: Off (unless using NLA)
├── All Actions: On (exports each action)
└── Force Start/End Keying: On
```

### Scale Issues

```
Blender default: 1 unit = 1 meter
Unity default: 1 unit = 1 meter ✓
Unreal default: 1 unit = 1 cm (scale by 100)
Godot default: 1 unit = 1 meter ✓
```

**Fix for Unreal:**
- Option 1: Scale by 100 on export
- Option 2: Set Unit Scale in Blender to 0.01
- Option 3: Scale in Unreal import settings

## glTF/GLB Export

### Settings

```
File → Export → glTF 2.0 (.glb/.gltf)

Format:
├── glTF Binary (.glb): Single file, embedded textures
├── glTF Separate (.gltf + .bin + textures): Editable
└── glTF Embedded (.gltf): JSON with base64 textures

Include:
├── Selected Objects: As needed
├── Visible Objects: As needed
├── Custom Properties: On for metadata
└── Cameras/Lights: Off for game assets

Transform:
├── +Y Up: On (glTF standard)
└── Apply Modifiers: On

Mesh:
├── UVs: On
├── Normals: On
├── Tangents: On (required for normal maps)
├── Vertex Colors: On if using
├── Materials: Export (embeds/references textures)
└── Compression: Draco (optional, reduces size)

Animation:
├── Animation: On
├── Shape Keys: On
├── Skinning: On
├── Sample Animations: On (bakes constraints)
└── Optimize Animation: On
```

### glTF vs FBX

| Feature | glTF | FBX |
|---------|------|-----|
| Open standard | Yes | No (Autodesk) |
| Web support | Excellent | Poor |
| File size | Smaller | Larger |
| PBR materials | Native | Requires conversion |
| Unreal support | Good | Excellent |
| Unity support | Good (with plugin) | Excellent |
| Godot support | Excellent | Good |

**Use glTF for:** Web, Godot, open workflows
**Use FBX for:** Unreal, Unity, legacy pipelines

## Unity Pipeline

### Import Settings

```
Model:
├── Scale Factor: 1 (if Blender scale correct)
├── Convert Units: On
├── Import BlendShapes: On (for morph targets)
├── Import Visibility: Off
├── Import Cameras/Lights: Off
└── Mesh Compression: Low/Medium/High

Rig:
├── Animation Type:
│   ├── None (static mesh)
│   ├── Generic (custom rig)
│   └── Humanoid (for retargeting)
├── Avatar Definition: Create From This Model
└── Skin Weights: 4 Bones (mobile: 2)

Animation:
├── Import Animation: On
├── Bake Animations: On
├── Resample Curves: On
├── Animation Compression: Optimal
└── Anim. Clips: Configure start/end frames
```

### Material Extraction

Unity creates placeholder materials on import:

1. Select imported model
2. Materials tab → Extract Materials
3. Choose folder
4. Assign textures to extracted materials
5. Or: Embed to keep in prefab

### Humanoid Rig Setup

For animation retargeting:

1. Rig → Animation Type: Humanoid
2. Configure Avatar: Map bones to Unity skeleton
3. Required: Hips, Spine, Head, Arms, Legs
4. Optional: Fingers, eyes, jaw
5. Enforce T-Pose if source pose differs

## Unreal Engine 5 Pipeline

### Import Settings

```
Static Mesh:
├── Import Mesh: On
├── Combine Meshes: Off (keep separate)
├── Generate Lightmap UVs: On (for baked lighting)
├── Transform Vertex to Absolute: On
└── Nanite: Enable for high-poly

Skeletal Mesh:
├── Import Mesh: On
├── Skeletal Mesh: Enabled
├── Skeleton:
│   ├── None (create new)
│   └── Existing (for shared animations)
├── Import Morph Targets: On
└── Import Content Type: Geometry and Skinning Weights

Animation:
├── Import Animations: On
├── Animation Length:
│   ├── Exported Time (use FBX timing)
│   └── Set Range (manual)
├── Frame Import Range: Start/End
├── Use Default Sample Rate: On (or custom)
└── Import Custom Attribute: On
```

### Scale Correction

```
If asset is 100x too small:
├── Import Uniform Scale: 100
Or in Blender:
├── Export Scale: 100
Or:
├── Blender Unit Scale: 0.01 before modeling
```

### Nanite Setup

For high-poly static meshes:

1. Import normally
2. Static Mesh Editor → Nanite → Enable
3. Settings: Fallback triangle percent (for non-Nanite)
4. Build Nanite data

**Limitations:** No skeletal meshes, no morph targets, no translucency.

### Skeleton Sharing

Reuse skeleton for animation sharing:

1. Import first character, creates skeleton asset
2. Import additional characters → Skeleton: Select existing
3. All characters can share animation assets

## Godot Pipeline

### Import Settings

```
Scene Import:
├── Root Type: Node3D (or CharacterBody3D, etc.)
├── Root Name: Based on filename
└── Apply Root Scale: On

Meshes:
├── Ensure Tangents: On (for normal maps)
├── Generate LODs: On
├── LOD Min Distance: 0
├── LOD Max Distance: 100
└── Create Shadow Meshes: On

Animation:
├── Import: On
├── FPS: 30 (or source rate)
├── Remove Immutable Tracks: On
└── Import Rest as RESET: On
```

### GLTF Advantages

Godot prefers glTF:
- Native PBR material conversion
- Automatic LOD generation
- Lighter file weight
- Better material preservation

### Scene Composition

```
.glb import creates:
├── Node3D (root)
│   ├── MeshInstance3D (each mesh)
│   └── Skeleton3D (if rigged)
│       └── AnimationPlayer (if animated)

Workflow:
1. Import .glb to /assets/
2. Open as scene or instance in level
3. Inherited scene: Changes update when reimporting
```

## Web Export (Three.js/Babylon.js)

### Optimization Priority

Web has strictest limits:

```
Targets:
├── Total scene: 50-100K triangles
├── Hero character: 3-10K
├── Props: 200-1K each
├── Textures: 512-1024px max
└── File size: <5MB total
```

### Compression

**Draco (glTF):**
- Mesh compression
- ~90% size reduction
- Decoder required in runtime

```
glTF export:
├── Compression: Draco
├── Compression Level: 6 (balance)
└── Quantization: Position 14, Normal 10, UV 12
```

**Texture compression:**
- KTX2 with Basis Universal
- WebP fallback
- Power-of-2 dimensions

### Loading Strategy

```javascript
// Progressive loading
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// LOD switching
const lod = new THREE.LOD();
lod.addLevel(highDetail, 0);
lod.addLevel(mediumDetail, 50);
lod.addLevel(lowDetail, 100);
```

## Batch Export

### Multiple Objects

Export each object as separate file:

1. Select all objects
2. File → Export → FBX
3. Batch Mode: Active Scene Collection
4. Or use script:

```python
import bpy
import os

output = "//export/"
for obj in bpy.context.selected_objects:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.fbx(
        filepath=os.path.join(output, f"{obj.name}.fbx"),
        use_selection=True
    )
```

### Naming Conventions

```
Static meshes:  SM_AssetName.fbx
Skeletal:       SK_CharacterName.fbx
Animation:      A_CharacterName_ActionName.fbx
Texture:        T_AssetName_MapType.png

Map types:
├── _D or _BaseColor
├── _N or _Normal
├── _M or _Metallic
├── _R or _Roughness
├── _AO or _Occlusion
├── _ORM (packed)
└── _E or _Emissive
```

## Troubleshooting

| Issue | Engine | Fix |
|-------|--------|-----|
| Mesh invisible | All | Check normals, recalculate outside |
| Wrong scale | All | Apply transforms before export |
| No textures | Unity/UE | Extract materials, reassign |
| Animations missing | All | Bake animation on export |
| Bones wrong | All | Check bone naming, apply armature |
| Smooth shading wrong | All | Export smoothing: Edge or Face |
| T-pose in engine | UE | Import as animation, not rig |
| Material black | Godot | Check texture paths, reimport |
