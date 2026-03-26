# Materials & Texturing

PBR materials, node setups, and texture workflows for games.

## PBR Theory

Physically Based Rendering = materials react to light realistically.

### Core Maps

| Map | Purpose | Value Range |
|-----|---------|-------------|
| Base Color/Albedo | Surface color without lighting | RGB color |
| Metallic | Metal vs non-metal | 0=dielectric, 1=metal |
| Roughness | Surface smoothness | 0=mirror, 1=matte |
| Normal | Surface detail bumps | RGB tangent-space |
| Ambient Occlusion | Soft shadowing in crevices | 0=dark, 1=bright |
| Emission | Self-illumination | RGB color + intensity |
| Height/Displacement | Actual geometry offset | Grayscale |

### Metal vs Non-Metal

**Metals (Metallic = 1):**
- Reflect environment color
- No diffuse color (base color = reflection tint)
- Examples: Gold, steel, copper, aluminum

**Dielectrics (Metallic = 0):**
- Reflect white/gray highlights
- Have diffuse color
- Examples: Plastic, wood, skin, fabric, stone

**No in-between:** Metallic is binary in real world. Use 0 or 1, not 0.5.

### Roughness Guidelines

```
0.0-0.1: Mirror, chrome, wet surfaces
0.1-0.3: Polished metal, glossy plastic, lacquer
0.3-0.5: Brushed metal, semi-gloss paint
0.5-0.7: Rough metal, matte plastic, skin
0.7-0.9: Concrete, wood, fabric
0.9-1.0: Chalk, dust-covered surfaces
```

## Node Setup

### Basic PBR Material

```
Image Texture (BaseColor) ──→ Base Color
Image Texture (Metallic)  ──→ Metallic
Image Texture (Roughness) ──→ Roughness
Image Texture (Normal) ─→ Normal Map ──→ Normal
Image Texture (AO) ──→ Multiply with Base Color

               ┌─────────────────┐
Textures ────→ │ Principled BSDF │ ────→ Material Output
               └─────────────────┘
```

### Normal Map Setup

```
Image Texture ──→ Normal Map Node ──→ Principled BSDF (Normal)
                       ↑
              Color Space: Non-Color
              Strength: 1.0 (adjustable)
```

**Critical:** Normal maps must use Non-Color color space.

### ORM Packed Texture

Many engines use single texture for Occlusion/Roughness/Metallic:

```
RGB Channels:
├── R: Ambient Occlusion
├── G: Roughness
└── B: Metallic

Node setup:
Image Texture (ORM) ──→ Separate RGB
                            ├── R ──→ Mix with Base Color (Multiply)
                            ├── G ──→ Roughness
                            └── B ──→ Metallic
```

### Emission Setup

```
Image Texture (Emission) ──→ Emission
Emission Strength ──────────→ Emission Strength

Or with mask:
Base Color × Emission Mask ──→ Emission
```

## Texture Baking

### High to Low Poly Bake

Transfer sculpt detail to game mesh:

**Setup:**
1. UV unwrap low-poly
2. High-poly doesn't need UVs
3. Position low-poly slightly inside high-poly

**Bake settings:**
```
Render Properties → Bake:
├── Bake Type: Normal / Diffuse / AO / etc.
├── Output: Image Texture (create in UV Editor)
├── Selected to Active: Enabled
├── Extrusion: 0.01-0.1 (ray distance)
└── Max Ray Distance: 0 (auto)
```

**Process:**
1. Select high-poly first
2. Shift+select low-poly (active)
3. Create target image in UV Editor
4. Bake

### Bake Types

**Normal:**
- Captures surface angles
- Most common bake
- Requires tangent space

**Ambient Occlusion:**
- Soft shadows
- Bake separately or into base color
- No high-poly needed (self-occlusion)

**Curvature:**
- Edge/cavity detection
- Used for edge wear, dirt accumulation
- Bake or generate in Substance

**ID/Material:**
- Color-coded material regions
- Export for masking in texture tools
- Assign flat colors to materials, bake Diffuse

### Bake Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Black areas | Ray misses surface | Increase Extrusion |
| Artifacts at edges | Cage too tight | Increase ray distance |
| Wrong colors | Color space | Use Non-Color for data maps |
| Seams visible | UV padding issue | Increase margin in bake |
| Wavy normals | Smoothing mismatch | Match smooth/flat shading |

## UV Best Practices

### Texel Density

Consistent pixel density across model:

1. UV Editor → N panel → Image → Texture Density
2. Select all UVs
3. UV → Average Islands Scale
4. Pack Islands

**Target density:** 512px/meter (mobile) to 2048px/meter (hero assets).

### UV Padding

Space between UV islands prevents bleeding:

```
Texture Resolution → Minimum Margin:
├── 256:   2px
├── 512:   4px
├── 1024:  8px
├── 2048:  16px
└── 4096:  32px
```

### Straightening UVs

Straight UVs = efficient texture space:

1. Select edge loop
2. UV → Align → Straighten
3. Or: TexTools addon → Rectify

### UDIM (Multi-tile UV)

For high-detail assets needing multiple textures:

```
UDIM tiles:
1001: Face
1002: Body
1003: Arms
1004: Legs

Each tile = separate 4K texture
Total: 16K+ effective resolution
```

**Engine support:** Unreal (native), Unity (with workarounds), Godot (limited).

## Texture Painting

### Blender Paint Setup

1. Create image: UV Editor → Image → New
2. Size: 2048x2048 or 4096x4096
3. Alpha: Enable for transparency painting
4. Color: Black for masks, white for base

### Painting Workflow

1. Enter Texture Paint mode
2. Set active texture slot in Properties → Material
3. Choose brush: Draw, Soften, Smear, Clone
4. Paint directly on 3D view or UV Editor

### Layer Workflow

Blender lacks layers, but workaround:

1. Paint each detail to separate image
2. Combine in node editor (Mix nodes)
3. Or: Export UV layout, paint in external app

### External Tools

For complex texturing, export to:

- **Substance Painter:** Industry standard, procedural layers
- **Quixel Mixer:** Free with Epic account, Megascans integration
- **ArmorPaint:** Open source, node-based
- **Photoshop/GIMP:** Manual painting, photo sourcing

**Workflow:**
1. Export mesh + UVs (FBX)
2. Import to texture app
3. Paint with layers
4. Export textures
5. Import back to Blender/engine

## Texture Optimization

### Resolution Guidelines

```
Platform → Base Color → Normal → ORM
├── Mobile:    512-1024   512-1024   512
├── Desktop:   2048       2048       1024-2048
├── Hero:      4096       4096       2048
└── Web:       512-1024   512-1024   512
```

### Compression

**Export formats:**
- PNG: Lossless, large files
- TGA: Lossless, alpha support
- JPEG: Lossy, no alpha, smaller
- WebP: Modern, good compression + alpha

**Engine compression:**
- Unity: BC7 (quality), BC1 (size), ASTC (mobile)
- Unreal: BC7, BC5 (normals), ASTC
- Web: Basis/KTX2, WebP

### Atlasing

Combine multiple textures into one:

```
Atlas benefits:
├── Fewer draw calls
├── Batch similar materials
└── Reduce texture swaps

Atlas layout:
┌────┬────┐
│ A  │ B  │  Each quadrant = different object
├────┼────┤
│ C  │ D  │  All share one material
└────┴────┘
```

**Workflow:**
1. UV all objects to 0-1 space
2. Offset UVs to atlas quadrant
3. Bake combined atlas texture
