# Engine Detection

Determine which platform to target before writing any code. Check signals in priority order — first match wins.

## Detection Priority

### 1. Explicit User Request

User names the engine directly: "Blender", "Unity", "Unreal", "Three.js", "Godot", "Phaser". Use what they asked for.

### 2. MCP Tool Availability

Check which engine MCPs are connected in this session:

| MCP Tools Available | Platform | Notes |
|---------------------|----------|-------|
| `blender:*` tools | Blender | 3D scenes, asset creation, Python scripting |
| `unityMCP:*` tools | Unity | Full project: GameObjects, C#, scenes |
| `unrealMCP:*` tools | Unreal | Actors, Blueprints, UMG widgets |
| `Three.js 3D Viewer:*` tools | Three.js | Inline 3D preview only |
| None of the above | Browser HTML5 | Default — single-file canvas game |

If multiple engine MCPs are available, ask the user which they prefer. Don't guess.

### 3. File Type Signals

If user uploads files, infer platform from extensions:

| Extensions | Platform |
|-----------|----------|
| `.blend` | Blender |
| `.cs`, `.unity`, `.prefab`, `.asset` | Unity |
| `.uasset`, `.umap`, `.bp` | Unreal |
| `.html`, `.js`, `.ts` | Browser or Three.js |
| `.gd`, `.tscn`, `.tres` | Godot (not yet supported — build as browser game or note limitation) |

### 4. Genre + Complexity Heuristic

| Request Pattern | Recommended Platform |
|----------------|---------------------|
| Simple 2D arcade, snake, breakout, platformer | Browser HTML5 Canvas |
| 2D game with physics, tilemaps, sprite sheets | Phaser 3 (CDN: `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js`) |
| Quick 3D visualization, proof of concept | Three.js (inline) |
| Detailed 3D scene with lighting, materials | Blender |
| Full game with physics, scripting, build pipeline | Unity or Unreal |
| "Just make something fun" / no specifics | Browser HTML5 Canvas |

### Phaser 3 (Browser Framework)

Phaser is a supported browser framework for 2D games that need physics, sprite sheets, tilemaps, or scene management beyond what raw Canvas provides. Use when:
- User says "Phaser" or references Phaser API (`this.add.sprite`, `this.physics.arcade`)
- Game needs built-in physics (arcade or matter.js)
- Game uses sprite sheet animations, tilemaps, or particle emitters

Phaser game structure follows the scene lifecycle: `preload` -> `create` -> `update`. Config object defines game dimensions, physics, and scene list:

```javascript
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: 'arcade', arcade: { gravity: { y: 300 } } },
  scene: { preload, create, update }
};
const game = new Phaser.Game(config);
```

**Testing Phaser games:** The `test_game.py` validation loop works — Phaser renders to a `<canvas>` element. Add `window.render_game_to_text` and `window.advanceTime` hooks to the Phaser scene's `create` method to expose state for automated testing.

## Multi-Platform Workflows

Some projects span platforms. Common combinations:

- **Blender -> Browser**: Model assets in Blender, export, render in Three.js or Canvas
- **Three.js -> Unity**: Prototype camera/lighting in Three.js, build production scene in Unity
- **Browser prototype -> Engine**: Validate game mechanics in HTML5, then port to Unity/Unreal for polish

When combining platforms, prototype in the simpler environment first. Validate gameplay before investing in engine-specific work.

## Unsupported Platforms

If the user requests a platform not covered here (Godot, GameMaker, RPG Maker, Defold):
1. Acknowledge the request directly.
2. Offer the closest supported alternative:
   - Godot 2D -> Browser HTML5 Canvas or Phaser 3
   - GameMaker / RPG Maker -> Browser HTML5 Canvas (can approximate most 2D mechanics)
   - Godot 3D -> Three.js prototype or Blender for assets
3. If they insist, build what you can — browser games can approximate most 2D engines.
