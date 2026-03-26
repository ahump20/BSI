# Rigging & Animation

Character rigging and animation for games.

## Armature Setup

### Bone Basics

```
Bone anatomy:
Head ●────────────● Tail
     ↑            ↑
   Root         Tip (children attach here)
```

**Bone properties:**
- **Connected:** Tail snaps to parent's tail
- **Deform:** Whether bone affects mesh
- **Inherit Rotation/Scale:** From parent

### Naming Conventions

Games expect consistent naming for retargeting:

```
Spine hierarchy:
spine → spine.001 → spine.002 → chest → neck → head

Limbs (use .L/.R suffix):
shoulder.L → upper_arm.L → forearm.L → hand.L
    └── finger_index.L.001 → .002 → .003

Alternative (Mixamo-style):
mixamorig:Hips → mixamorig:Spine → mixamorig:LeftArm
```

**Symmetry:** Name with .L/.R, then Armature → Symmetrize.

### Bone Layers/Collections (Blender 4.0+)

Organize bones:
- Layer 1: Deform bones
- Layer 2: Control bones (IK targets)
- Layer 3: Helper bones (twist, corrective)

### Root Bone

Every game rig needs a root:

```
Root (at origin, no parent)
└── Hips (character root motion)
    ├── Spine hierarchy
    └── Leg hierarchy
```

Root handles:
- World-space movement
- Root motion export
- Character placement

## Weight Painting

### Automatic Weights

Quick start, usually needs cleanup:

1. Select mesh
2. Shift+select armature
3. Ctrl+P → With Automatic Weights

**Common auto-weight issues:**
- Fingers bleed into palm
- Hip affects knees
- Shoulder affects neck

### Manual Weight Painting

**Brushes:**
- **Draw:** Add/subtract weight
- **Blur:** Smooth weight transitions
- **Average:** Even out weights

**Settings:**
- Weight: 0.0-1.0 (paint value)
- Strength: Brush intensity
- Falloff: Brush shape curve

### Workflow

1. Select mesh, enter Weight Paint mode
2. Select bone in armature (Ctrl+click)
3. Paint red where bone should fully control
4. Paint blue where no influence
5. Use Blur to smooth transitions
6. Test by posing bone

### Weight Normalization

Total weights per vertex should equal 1.0.

```
Vertex influenced by 3 bones:
├── Spine: 0.5
├── Chest: 0.3
└── Shoulder: 0.2
    Total: 1.0 ✓
```

**Auto-normalize:** Enable in Weight Paint tool settings.

### Common Weight Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Vertices don't move | Zero weight | Paint weight > 0 |
| Mesh tears | Missing weights | Paint all vertices |
| Double transform | Weights > 1.0 | Normalize |
| Wrong bone moves mesh | Misassigned weights | Clear and repaint |

## Inverse Kinematics (IK)

### IK Setup

IK = position end, chain follows.

```
FK (Forward Kinematics):
Shoulder rotates → Arm follows → Hand follows

IK (Inverse Kinematics):
Move hand target → Arm calculates → Shoulder adjusts
```

**Basic IK rig:**
1. Add target bone at hand/foot (unconnected)
2. Select forearm/shin bone
3. Add Bone Constraint → Inverse Kinematics
4. Target: Armature, Bone: IK target
5. Chain Length: 2 (arm) or 3 (leg with foot)

### Pole Targets

Control elbow/knee direction:

1. Add pole bone behind elbow/in front of knee
2. In IK constraint, set Pole Target
3. Adjust Pole Angle (usually 90° or -90°)

### IK/FK Switching

Games often need both:
- IK: Feet planted, hands on objects
- FK: Free movement, arcs

**Approach:** Separate IK/FK bone chains, blend with constraints or export both.

## Corrective Shapes

Fix deformation issues with shape keys:

1. Pose problem position (e.g., arm bent 90°)
2. Add Shape Key
3. Sculpt fix in Edit mode
4. Drive shape key with bone rotation

**Drivers:**
```
Shape key value driven by:
Armature → Bone → X Rotation

Graph: 0° = shape 0, 90° = shape 1
```

## Animation Fundamentals

### 12 Principles (Game-Relevant)

1. **Timing:** Fast = light/powerful, Slow = heavy/weak
2. **Ease In/Out:** Acceleration, deceleration
3. **Arcs:** Natural motion follows curves
4. **Anticipation:** Wind-up before action
5. **Follow-through:** Settle after action
6. **Secondary Action:** Hair, cloth, accessories move
7. **Exaggeration:** Push poses beyond realistic

### Keyframe Types

```
Interpolation modes:
├── Constant: Snap between values (frame-by-frame)
├── Linear: Even transition
├── Bezier: Smooth curves (default, most used)
└── Elastic/Bounce: Stylized effects
```

### Game Animation Cycles

**Idle:**
- Subtle breathing, weight shifts
- Loop: 60-120 frames
- Seamless: Match first/last frame

**Walk:**
- Contact → Down → Pass → Up → Contact
- Loop: 30-40 frames (1 second)
- Root motion or in-place (engine preference)

**Run:**
- Similar to walk, faster, more air time
- Loop: 20-30 frames

**Attack:**
- Anticipation (3-5f) → Strike (2-3f) → Recovery (5-10f)
- Non-looping
- Clear hit frame for engine to spawn damage

### Action Organization

```
NLA Editor workflow:
1. Create action (walk, run, jump)
2. Push action to NLA strip
3. Stash stores action without affecting timeline
4. Export: Individual actions or all
```

## Export Considerations

### Root Motion

Motion baked into root bone position:

```
Root motion walk:
├── Root moves forward each cycle
├── Export: Include root translation
└── Engine: Character controller uses root delta

In-place walk:
├── Root stays at origin
├── Legs move but no forward motion
└── Engine: Script moves character
```

**Unreal/Unity preference:** Root motion for precise foot placement.

### Animation Clips

**Single file, multiple actions:**
- Export all actions, split in engine
- Unreal: Import → Animation → Import Animations

**Separate files:**
- Export each action as own FBX
- More control, more files
- `SK_Character_Walk.fbx`, `SK_Character_Run.fbx`

### Baking

Constraints (IK, drivers) must bake to keyframes:

1. Select armature
2. Pose → Animation → Bake Action
3. Settings: Visual Keying, Clear Constraints
4. Result: Pure FK keyframes on all bones

## Rigify (Quick Rig)

Blender's auto-rig system:

1. Add → Armature → Basic Human (Rigify)
2. Scale/position metarig bones to match mesh
3. Armature Properties → Generate Rig
4. Parent mesh to generated rig
5. For export: Bake to DEF- bones only

**Rigify export tip:** DEF- bones are deform bones. Hide/delete others before export.
