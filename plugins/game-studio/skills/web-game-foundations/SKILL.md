---
name: Web Game Foundations
description: Game architecture fundamentals for browser games — loop patterns, input abstraction, state machines, asset loading, save systems, performance boundaries, and engine selection. Triggers on "game architecture", "how should I structure my game", "game design patterns", "game loop", or when starting any new game project.
---

# Web Game Foundations

You are a game architecture specialist. When invoked, provide authoritative guidance on how to structure browser games for correctness, performance, and maintainability. Every recommendation must account for the browser runtime — single-threaded main loop, garbage collection pauses, tab visibility changes, and variable device performance.

## Core Separation: Simulation vs Rendering

This is the most important architectural decision in any game. Violating it creates bugs that are nearly impossible to fix later.

**Simulation** is the game's truth — positions, velocities, health, scores, AI decisions, physics. It runs at a fixed timestep (e.g., 1/60th of a second) regardless of frame rate. Simulation code never touches the DOM, never calls rendering APIs, never reads pixel data. It operates on plain data structures.

**Rendering** is the visual representation of simulation state. It reads simulation state and draws it. Rendering runs at the display's refresh rate (requestAnimationFrame). It interpolates between simulation states for smooth visuals on high-refresh displays.

Why this matters:
- Physics and game logic produce deterministic results regardless of frame rate.
- You can run simulation without rendering (headless testing, server-side validation).
- You can swap renderers (Canvas2D, WebGL, DOM) without touching game logic.
- Replay systems become trivial — record inputs, replay simulation.

Implementation pattern:

```
// Fixed-step simulation with variable-rate rendering
let accumulator = 0;
const STEP = 1 / 60; // 60 Hz simulation

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  accumulator += Math.min(dt, 0.25); // Cap to prevent spiral of death

  while (accumulator >= STEP) {
    simulate(STEP);
    accumulator -= STEP;
  }

  const alpha = accumulator / STEP; // Interpolation factor
  render(alpha);
  requestAnimationFrame(gameLoop);
}
```

The `alpha` value lets the renderer interpolate between the previous and current simulation state, producing smooth motion even when simulation and rendering run at different rates. The 0.25-second cap on delta time prevents the "spiral of death" where the simulation falls behind and tries to catch up with increasingly large steps.

## Input Mapping

Never bind game actions directly to physical keys. Create an input mapping layer that abstracts device inputs into game actions.

Define actions semantically: "jump", "move_left", "fire", "pause" — not "spacebar", "A key", "left click". Then map devices to actions:

```
const inputMap = {
  jump: { keyboard: 'Space', gamepad: 'A', touch: 'button_jump' },
  move_left: { keyboard: 'ArrowLeft', gamepad: 'LeftStickLeft', touch: 'dpad_left' },
  fire: { keyboard: 'KeyZ', gamepad: 'RightTrigger', touch: 'button_fire' },
};
```

Benefits:
- Rebindable controls with zero game logic changes.
- Simultaneous keyboard + gamepad + touch support.
- Input recording for replays — record action streams, not raw events.
- Testable — feed synthetic action streams into simulation.

Handle keyboard via `keydown`/`keyup` tracking (not single events). Track which keys are currently held in a Set. For gamepad, poll `navigator.getGamepads()` each frame. For touch, create virtual buttons positioned in the DOM overlay.

Always process input at the start of each simulation step, not inside event handlers. Event handlers update the input state buffer; the simulation reads it.

## Game State Machine

Every game has discrete states: loading, main menu, playing, paused, game over, cutscene. Model these as a finite state machine with explicit enter/exit transitions.

Each state owns:
- **enter()** — set up the state (show menu, start music, reset score).
- **update(dt)** — run per-frame logic for this state.
- **render(alpha)** — draw this state.
- **exit()** — clean up (hide menu, stop music, release resources).

Transitions are explicit: `stateMachine.transitionTo('playing')` calls the current state's `exit()`, then the new state's `enter()`. No state should know about other states' internals.

The pause state is special: it must freeze simulation time but keep rendering. Dim the canvas, show the pause menu overlay, and stop calling `simulate()`. When unpausing, resume with the correct delta time (discard the accumulated time during pause).

Handle browser visibility changes (`document.visibilitychange`). When the tab loses focus, auto-pause. When it regains focus, either auto-resume or show the pause menu, depending on the game's design.

## Asset Loading

Preload all assets before the game starts. Never load assets during gameplay — it causes stutters, race conditions, and broken states.

Create a boot sequence:
1. Show a loading screen (HTML, not canvas — it works even before any engine loads).
2. Load the asset manifest (a JSON file listing all assets with paths, types, and sizes).
3. Load assets in parallel with a progress bar updating per-asset.
4. When all assets are loaded, transition to the main menu state.

For large games, load per-level: the boot loads shared assets (UI, player, common sounds), and each level transition loads level-specific assets with a loading screen.

Asset manifest structure:
```json
{
  "sprites": { "player": "assets/player.png", "enemies": "assets/enemies.png" },
  "audio": { "music": "assets/bgm.ogg", "jump": "assets/sfx/jump.ogg" },
  "data": { "levels": "assets/levels.json", "dialogue": "assets/dialogue.json" }
}
```

Use the engine's built-in loader (Phaser's `this.load`, Three.js's `GLTFLoader`) — do not write custom loaders unless the engine doesn't cover your format.

For assets that can vary in size (level packs, user-generated content), implement lazy loading with explicit loading states. The player must always see either content or a loading indicator — never a blank space where content should be.

## Save System

Browser games save to `localStorage`. Design the save format from day one, even for simple games.

Principles:
- The save is a serialized snapshot of simulation state, not rendering state.
- Version the save format. Include a `version` field in every save. When the format changes, write a migration function from each old version.
- Serialize to JSON. Keep it human-readable during development.
- Save at natural checkpoints (level completion, room transitions, explicit save points), not every frame.
- Limit save size. `localStorage` has a 5-10MB limit per origin. Compress if needed.
- Handle missing/corrupt saves gracefully. If `JSON.parse` fails, start a new game — do not crash.

```
interface SaveData {
  version: 2;
  timestamp: number;
  player: { x: number; y: number; health: number; inventory: string[] };
  level: string;
  flags: Record<string, boolean>; // Story progress, unlocks, etc.
}
```

For auto-save, save to a separate slot from manual saves. Keep the last N auto-saves as a safety net.

## Debug Tooling

Build debug tools from the start — not as an afterthought. They pay for themselves within the first hour of development.

Essential debug tools for every browser game:
- **FPS counter**: display current FPS, min/max over last 5 seconds, and frame time histogram. Use `performance.now()`, not `Date.now()`.
- **Entity inspector**: click any game entity to see its state (position, velocity, health, current AI state). Render as an HTML overlay panel.
- **Physics debug draw**: render collision boxes, physics bodies, raycasts, and spatial partitioning grids as wireframe overlays.
- **State viewer**: show the current game state machine state and recent transitions.
- **Console commands**: bind a key (backtick is standard) to open a command console. Useful commands: `god` (invincibility), `noclip` (fly through walls), `spawn [entity]`, `goto [level]`, `speed [multiplier]`.
- **Timeline scrubber**: record simulation states and allow rewinding. Invaluable for debugging physics and AI.

Gate all debug tools behind a flag (`?debug=true` query parameter, or a build-time constant). Strip from production builds.

## Performance Boundaries

Browser games run in a constrained environment. Know the boundaries and design within them.

**Object pooling**: Never create and destroy objects during gameplay. Bullets, particles, enemies, projectiles — pre-allocate a pool and recycle. `new` during gameplay triggers GC pauses. Pre-allocate pools during loading.

**Spatial partitioning**: Do not check every entity against every other entity for collision. Use a grid, quadtree (2D), or octree (3D). For a 2D game with 100 entities on a grid: 100 entities * 9 neighbor cells = 900 checks, vs 100 * 100 = 10,000 brute force.

**Draw call batching**: Every material/texture switch is a draw call. Minimize by using texture atlases (2D) or shared materials (3D). Target under 100 draw calls for mobile, under 500 for desktop.

**Offscreen culling**: Do not render what the camera cannot see. In 2D, check entity bounds against camera viewport. In 3D, use frustum culling (Three.js does this automatically for objects in the scene graph).

**Memory budget**: Track allocations. Use the browser's Performance tab to monitor heap growth. A steadily growing heap means you have a leak — usually event listeners, closures referencing stale state, or unpooled objects.

**Target frame rate**: 60 FPS is the target. If you cannot maintain 60 on target devices, design for 30 with interpolation. Never ship at an unlocked variable rate without interpolation — it causes speed-dependent physics bugs.

## DOM for UI, Canvas for Gameplay

Use HTML and CSS for all UI: menus, HUD, dialogue boxes, inventory screens, settings panels. Use the canvas exclusively for gameplay rendering.

Why:
- HTML text is crisp at every resolution. Canvas text is blurry without careful font rendering.
- CSS handles layout, animation, and responsiveness automatically.
- HTML is accessible — screen readers, keyboard navigation, tab order.
- CSS transitions and animations are GPU-accelerated and do not block the game loop.
- DOM elements can be styled, themed, and localized without touching game code.

Implementation: position an HTML overlay `<div>` over the game canvas with `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;`. Child elements that need interaction (buttons, menus) set `pointer-events: auto`. The canvas handles all pointer events that pass through the transparent overlay.

## Engine Selection Rules

Match the engine to the game, not the other way around.

| Game Type | Engine | Reasoning |
|-----------|--------|-----------|
| 2D sprite game (any genre) | **Phaser** | Built-in physics, sprite management, input, audio, scene system. Batteries included. |
| 3D game in a React app | **React Three Fiber** | React component model for scene management, Drei utilities, Rapier physics integration. |
| 3D standalone game | **Three.js (vanilla)** | Maximum control over render loop, no framework overhead, best for performance-critical games. |
| Simple toy / demo | **Canvas2D** | No engine needed. Raw `CanvasRenderingContext2D` for particle effects, simple animations, visualizations. |
| Text-heavy / narrative | **DOM only** | No canvas needed. HTML + CSS + JS for interactive fiction, visual novels, card games with complex UI. |

Do not over-engineer. A Wordle clone does not need Phaser. A 3D MMO should not use React Three Fiber. Match complexity to requirements.
