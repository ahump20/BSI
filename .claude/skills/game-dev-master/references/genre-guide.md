# Genre-Specific Guidance

Choose architecture, engine, and key systems based on genre. Each section points to deeper references where relevant.

## Arcade / Casual (Snake, Tetris, Breakout)

- **Engine**: Canvas 2D or Phaser 3 for web; Unity 2D for mobile
- **Architecture**: Simple game loop, no ECS needed. State machine with 3-4 states (menu, playing, game-over).
- **Focus**: Tight controls, satisfying feedback, difficulty curve
- **Key Systems**: Input, collision, score, high-score persistence
- **Pattern**: Fixed timestep at 60fps, single update/render pass

## Platformer (Mario-style)

- **Engine**: Godot, Unity 2D, or Phaser 3
- **Architecture**: Tile-based levels, character state machine (idle, running, jumping, falling, wall-slide)
- **Key Systems**: Jumping physics (coyote time, jump buffering), camera follow with dead zones, collision layers
- **Tuning Values**: Coyote time ~80-120ms, jump buffer ~100ms, gravity multiplier on fall ~2.5x
- **Reference**: Character controller patterns in engine-specific files

## Roguelike / Roguelite

- **Engine**: Godot, Unity, or terminal-based
- **Architecture**: Procedural generation pipeline, turn-based or real-time with pause
- **Key Systems**: Random level generation, item/loot systems, permadeath saves, seed-based RNG
- **Pattern**: Separate generation logic from rendering. Generate a data map first, then render it.
- **Reference**: `references/procedural-generation.md`

## FPS / Third-Person Shooter

- **Engine**: Unreal 5 (AAA), Unity (indie), Godot 4 (experimental)
- **Architecture**: Player controller, weapon system, enemy AI, damage model
- **Key Systems**: Ballistics/hitscan, hit detection, enemy AI state machines, networking for multiplayer
- **Reference**: `references/ai-patterns.md` for enemy behavior trees

## RPG

- **Engine**: Unity, Unreal, Godot
- **Architecture**: Quest system, dialogue tree, inventory, save/load, world state tracking
- **Key Systems**: Character stats, combat formulas, progression curves, world state persistence
- **Pattern**: Data-driven design. Define stats, items, quests in JSON/YAML, not code.
- **Reference**: State machines for dialogue; inventory patterns in engine-specific files

## Open-World (GTA / RDR2 style)

- **Engine**: Unreal 5 (only realistic choice for AAA quality)
- **Architecture**: Streaming world chunks, LOD system, dynamic AI schedules
- **Key Systems**: World simulation, NPC schedules, dynamic events, fast travel
- **Reality Check**: Requires large team, massive budget, 3-5+ years
- **Solo/Small Team Alternative**: Scope to smaller areas, stylized graphics, reduce NPC density

## Multiplayer

- **Networking Model**: Client-server authoritative for competitive; P2P acceptable for co-op
- **Key Systems**: Lobbies, matchmaking, lag compensation (client prediction + server reconciliation), anti-cheat
- **Additional Dev Time**: 2-3x single-player development
- **Pattern**: Build the full game single-player first, then add networking as the last layer
- **Reference**: `references/multiplayer-patterns.md`

---

## Platform Deployment Notes

### PC (Steam / Epic)

- Flexible performance targets
- Keyboard/mouse + controller support required
- Steam API for achievements, cloud saves, workshop
- No certification process — ship when ready

### Console (PS5 / Xbox / Switch)

- Strict certification requirements
- Platform-specific SDKs (require approved developer accounts)
- Performance targets: 30/60 FPS locked, no drops
- Controller-only UI navigation mandatory
- Console-specific features: haptics, adaptive triggers (PS5), HD rumble (Switch)

### Mobile (iOS / Android)

- Touch controls, gestures, virtual joysticks
- Battery and thermal constraints limit sustained performance
- Monetization: IAP, ads, subscriptions (platform takes 30%)
- App store review process adds 1-7 day delay per submission
- Test on low-end devices — not just flagships

### Web (Browser)

- Zero installation friction — lowest barrier to play
- Storage limits: localStorage ~5MB, IndexedDB for larger saves
- WebGL 2 baseline; WebGPU emerging but not universal
- Bandwidth constraints: lazy-load assets, compress aggressively
- Cross-browser testing required (Safari WebGL quirks, Firefox audio policy)
- **Reference**: `references/web-game-patterns.md`
