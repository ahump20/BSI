---
name: game-dev-master
description: |
  Build, test, and debug video games at any complexity level — from browser
  toys to AAA productions. Covers engine selection, architecture patterns,
  validation workflows, and production-ready code for all major platforms.

  This skill should be used when the user wants to: create a game, build
  a game, make a game, choose a game engine, test a game, fix a game bug,
  debug a game, optimize game performance, handle collision detection.

  File types: .html, .js, .ts, .cs, .gd, .gdscript, .uasset, .glsl, .wgsl.

  Engines: Unity, Unreal Engine 5, Godot, Phaser 3, Babylon.js, Three.js,
  Canvas 2D, PixiJS, pygame.

  Genres: platformer, roguelike, puzzle, arcade, RPG, FPS, browser game,
  multiplayer, open-world, shooter, casual, tower defense.

  Triggers: "game loop", "ECS pattern", "multiplayer netcode",
  "procedural generation", "behavior tree", "test my game", "game bug",
  "game not working", "game screenshot", "game feels laggy",
  "blank screen in my game", "make a 2D platformer", "Three.js prototype",
  "sprite animation", "tilemap", "game state management".
---

# Game Development Master

Build any game from browser toys to console-quality productions.

## 1. Scope Assessment

Before touching code, establish project reality.

| Complexity | Solo Dev Timeline | Team (5+) Timeline | Examples |
|------------|-------------------|---------------------|----------|
| Micro | 1-4 weeks | 1-2 weeks | Snake, Pong, Flappy Bird |
| Small | 1-3 months | 2-4 weeks | Platformer, puzzle game |
| Medium | 6-12 months | 2-4 months | Roguelike, action game |
| Large | 2-4 years | 6-12 months | RPG, open-world lite |
| AAA | Not realistic solo | 3-5 years (100+) | RDR2, GTA, Elder Scrolls |

Scope questions: target platform(s), team size, timeline, art style, monetization model.

## 2. Engine Selection

```
Is it a web game (browser-based)?
├─ Yes → 2D only?
│         ├─ Yes → Phaser 3 or Canvas/PixiJS
│         └─ No  → Babylon.js or Three.js
└─ No → Mobile-only?
          ├─ Yes → Unity (cross-platform) or native
          └─ No → Console/PC?
                   ├─ Indie/solo → Godot or Unity
                   └─ AAA visuals → Unreal Engine 5
```

| Engine | Best For | Avoid For |
|--------|----------|-----------|
| **Unity** | Mobile, VR/AR, 2D/3D indie, cross-platform | Photorealistic AAA |
| **Unreal** | Cinematic visuals, FPS, open-world, AAA | Simple 2D, rapid prototyping |
| **Godot** | 2D games, indie, solo devs, open-source | Large teams, AAA graphics |
| **Phaser 3** | Browser 2D, casual games, game jams | 3D, mobile-native |
| **Babylon.js** | Browser 3D, WebXR, web deployment | Mobile-native, offline |
| **pygame** | Learning, prototypes, Python devs | Production, performance |

Engine-specific patterns: `references/unity-patterns.md`, `references/unreal-patterns.md`, `references/godot-patterns.md`, `references/web-game-patterns.md`.

## 3. Architecture Foundation

Implement these systems in order:

1. Game Loop — core timing, update/render cycle
2. State Machine — menu, playing, paused, game over
3. Input System — abstract input from game logic
4. Scene/Level System — load, unload, transition between content
5. Entity System — objects in the world (ECS or OOP)
6. Physics — collision, movement
7. Audio — music, SFX, spatial audio
8. UI — menus, HUD, feedback
9. Save/Load — persistence (if needed)
10. Networking — multiplayer (if needed)

For implementation patterns: `references/core-patterns.md`.

## 4. Validation Loop (Mandatory)

Every change follows this cycle. No exceptions.

```
1. IMPLEMENT  — Smallest change that moves the game forward.
2. BUILD      — Compile clean. No TypeScript errors, no missing imports.
3. SERVE      — Start local server (browser) or viewport (engine).
4. CAPTURE    — Run test script. Screenshots + state JSON land on disk.
5. VALIDATE   — View screenshot. Compare state JSON to expected outcome.
6. PASS/FAIL  — Fail → fix and repeat from step 2.
                Pass → commit progress, next feature.
```

**Stop condition:** A feature is "done" only when the screenshot visually matches intent AND state JSON confirms expected values. Never self-certify without screenshot evidence.

### Integration Hooks (Required)

Every browser game MUST expose these window-level hooks for automated testing:

```typescript
window.render_game_to_text = () => JSON.stringify(engine.getState());
window.advanceTime = (ms: number) => engine.step(ms);
```

`render_game_to_text()` returns a JSON snapshot of game state. `advanceTime()` deterministically steps the game forward so tests don't depend on wall-clock timing.

### Validation Contracts

Before implementing each feature, write a validation contract:

```
FEATURE:       [what is being built]
PRECONDITION:  [required state before testing]
ACTION:        [what the test does]
EXPECTED VISUAL: [what the screenshot should show]
EXPECTED STATE:  [what render_game_to_text() should return]
PASS IF:       [specific pass criteria]
FAIL IF:       [specific fail criteria]
```

### Test Script

```bash
python3 scripts/test_game.py <path/to/index.html> [--steps 5] [--expect-mode playing]
# Exit codes: 0 = PASS, 1 = FAIL, 2 = INFRASTRUCTURE ERROR
```

### Project Setup

```bash
python3 scripts/init_game.py --project-dir ./my-game --engine canvas|threejs|phaser|babylon
```

### Progress Tracking

Maintain a `progress.md` in the game project root. Read it first if it exists — you may be continuing another session's work.

### Platform Detection

Before starting development, identify the rendering platform. For detection logic and edge cases: `references/engine-detection.md`.

## Reference Files

Load based on engine, system, or problem:

| Need | Reference File |
|------|----------------|
| Unity (C#, MonoBehaviour, URP/HDRP) | `references/unity-patterns.md` |
| Unreal (Blueprints, C++, GAS, Nanite) | `references/unreal-patterns.md` |
| Godot (GDScript, signals, scenes) | `references/godot-patterns.md` |
| Web (Canvas, Phaser, Babylon, PixiJS) | `references/web-game-patterns.md` |
| Three.js (inline 3D, BufferGeometry, r160+) | `references/platform-threejs.md` |
| Multiplayer (netcode, prediction, lobbies) | `references/multiplayer-patterns.md` |
| Game AI (behavior trees, FSM, pathfinding) | `references/ai-patterns.md` |
| Procedural generation (dungeons, terrain, WFC) | `references/procedural-generation.md` |
| Core patterns (game loop, state machine, pools, ECS) | `references/core-patterns.md` |
| Genre selection and platform deployment | `references/genre-guide.md` |
| Common mistakes and anti-patterns | `references/common-mistakes.md` |
| Engine/platform detection and routing | `references/engine-detection.md` |
| Debugging common game failures | `references/debugging-playbook.md` |
| Screenshot inspection and validation contracts | `references/visual-validation.md` |
| Starter code templates by genre | `references/game-templates.md` |

## Quick Start by Goal

**"I want to learn game dev"**
→ Start with Pong in Canvas, then Platformer in Godot

**"I need a browser game fast"**
→ Phaser 3 + TypeScript, deploy to itch.io or Cloudflare Pages

**"I want to ship on mobile"**
→ Unity 2D, target iOS + Android simultaneously

**"I want AAA-quality visuals"**
→ Unreal 5 (be realistic about timeline and team size)

**"I want to make multiplayer"**
→ Start with single-player, add networking last. See `references/multiplayer-patterns.md`.
