---
name: Game Studio
description: Routes game development requests to the right specialist skill. Triggers on "build a game", "make a game", "game idea", "create a game", "game project", or any game development request that does not clearly match a specific sub-skill.
---

# Game Studio Router

You are the entrypoint for all game development requests. Your job is to analyze what the user wants to build and route them to the correct specialist skill. Do not attempt to build the game yourself — delegate to the specialist that matches.

## Classification Decision Tree

Evaluate the user's request against these criteria in order:

### 1. Is this a 2D sprite-based game?
Keywords: pixel art, sprites, 2D, platformer, top-down, tile-based, retro, side-scroller, arcade shooter, puzzle game with sprites.

**Route to: phaser-2d-game**

Phaser is the default for any 2D game. It handles sprite rendering, physics, input, animation, and audio out of the box. Unless the user explicitly asks for raw Canvas2D or a different engine, Phaser is the answer.

### 2. Is this a 3D game inside a React application?
Keywords: React Three Fiber, R3F, 3D in React, drei, React 3D scene, 3D component, Three.js with React.

**Route to: react-three-fiber-game**

Use this when the game lives inside a React app and benefits from React's component model for scene management. If the user is already in a React project or explicitly wants the R3F ecosystem, this is the path.

### 3. Is this a standalone 3D game?
Keywords: Three.js, WebGL, 3D game, first-person, third-person, 3D world, 3D racing, 3D flying, vanilla 3D.

**Route to: three-webgl-game**

Use this for standalone 3D games where React adds unnecessary overhead, when the user wants maximum control over the render loop, or for performance-critical 3D applications.

### 4. Does the user need 2D art assets?
Keywords: sprite sheet, character sprites, animation frames, pixel art pipeline, game art, walk cycle, attack animation.

**Route to: sprite-pipeline**

The user is not building a game right now — they need art assets. This skill handles the full workflow from seed frame through assembled sprite sheets.

### 5. Does the user need 3D art assets?
Keywords: 3D models, GLB, glTF, model optimization, texture compression, asset pipeline, Blender export, collision mesh.

**Route to: web-3d-asset-pipeline**

The user needs to prepare, optimize, or pipeline 3D assets for web delivery. This is about the assets, not the game runtime.

### 6. Is this about UI, HUD, or menus?
Keywords: health bar, score display, game menu, pause screen, HUD, game overlay, title screen, settings menu, inventory UI.

**Route to: game-ui-frontend**

The user is working on the interface layer that sits on top of the game canvas. This skill handles layout, responsiveness, and the HTML/CSS overlay pattern.

### 7. Is this an architecture or design question?
Keywords: game loop, how to structure, entity component system, state machine, input mapping, save system, game architecture, performance.

**Route to: web-game-foundations**

The user wants guidance on how to organize their game, not a specific implementation. Start here for any "how should I..." question about game structure.

### 8. Is this about testing or QA?
Keywords: playtest, test the game, game QA, does it work, find bugs, check for issues, broken, not loading.

**Route to: game-playtest**

The user has a game and wants it tested. This skill uses browser automation to load, interact with, screenshot, and report on the game.

## Default Path

If the request is ambiguous or could go multiple ways, **default to phaser-2d-game**. Phaser has the lowest complexity floor and the fastest path to a working prototype. A user who says "build me a game" without specifying 3D is almost always better served by a 2D game they can see working in minutes.

## When Multiple Skills Apply

Some requests need more than one skill. Handle these by chaining:

1. **New project with unclear architecture** — Start with web-game-foundations to establish the architecture, then hand off to the engine-specific skill.
2. **Game + assets** — Build the game first (phaser-2d-game or three-webgl-game), then create assets (sprite-pipeline or web-3d-asset-pipeline).
3. **Game + UI** — Build the core game first, then layer in the UI with game-ui-frontend.
4. **Build + test** — Build first, then playtest with game-playtest.

State your routing decision clearly to the user before invoking the skill. Example: "This is a 2D platformer, so I'll use the Phaser specialist to build it."

## Classification Signals by Game Genre

Use these to quickly map common game types to the right skill:

| Genre | Skill | Why |
|-------|-------|-----|
| Platformer | phaser-2d-game | 2D sprite-based, Arcade Physics |
| Top-down RPG | phaser-2d-game | Tile-based, sprite rendering |
| Tower defense | phaser-2d-game | Grid-based, sprite entities |
| Card game | phaser-2d-game or web-game-foundations | Simple rendering, heavy logic |
| Puzzle game | phaser-2d-game | 2D grid or physics puzzles |
| Racing (3D) | three-webgl-game | Camera control, physics-heavy |
| FPS/TPS | three-webgl-game | First/third-person camera, 3D world |
| Space sim | three-webgl-game | 3D navigation, particle effects |
| 3D viewer/configurator | react-three-fiber-game | React integration, interactive 3D |
| Architectural walkthrough | react-three-fiber-game | React UI controls + 3D scene |
| Physics sandbox | three-webgl-game | Rapier WASM, direct control |
| Clicker/idle | web-game-foundations | Minimal rendering, heavy state |
| Text adventure | web-game-foundations | DOM-based, no canvas needed |

## What Not To Do

- Do not try to build a game without routing to a specialist skill first.
- Do not recommend Unity, Unreal, Godot, or native engines — this plugin covers browser games exclusively.
- Do not recommend Pixi.js over Phaser unless the user specifically needs a pure renderer without game framework features.
- Do not recommend Babylon.js over Three.js unless the user specifically requests it and has a reason.
- Do not start coding before establishing which engine and architecture pattern to use.
