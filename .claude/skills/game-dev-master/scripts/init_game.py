#!/usr/bin/env python3
"""
Game Project Initializer -- Scaffolds integration hooks and progress tracking.

Usage:
  python3 init_game.py --project-dir ./my-game --engine threejs
"""

import argparse
import json
from pathlib import Path

HOOK_TEMPLATES = {
    "threejs": '''
// Integration hooks for Three.js games
// Add these after your renderer and scene are created

(window as any).render_game_to_text = () => {
  return JSON.stringify({
    phase: gameState.phase || 'unknown',
    fps: 0,
    entities: scene.children.length,
    camera: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    },
    timestamp: Date.now(),
  });
};

(window as any).advanceTime = (ms: number) => {
  const dt = ms / 1000;
  // Replace with your update logic
  update(dt);
  renderer.render(scene, camera);
};
''',
    "canvas": '''
// Integration hooks for Canvas 2D games
(window as any).render_game_to_text = () => {
  return JSON.stringify({
    phase: gameState.phase || 'unknown',
    score: gameState.score || 0,
    entities: gameState.entities?.length || 0,
    timestamp: Date.now(),
  });
};

(window as any).advanceTime = (ms: number) => {
  const steps = Math.floor(ms / (1000 / 60));
  for (let i = 0; i < steps; i++) {
    update(1 / 60);
  }
};
''',
    "phaser": '''
// Integration hooks for Phaser 3 games
// Add these after new Phaser.Game(config) is created

(window as any).render_game_to_text = () => {
  const scene = game.scene.getScenes(true)[0];
  if (!scene) return JSON.stringify({ phase: 'no-scene', timestamp: Date.now() });

  return JSON.stringify({
    phase: scene.data.get('phase') || 'unknown',
    score: scene.data.get('score') || 0,
    entities: scene.children.list.length,
    paused: !scene.scene.isActive(),
    timestamp: Date.now(),
  });
};

(window as any).advanceTime = (ms: number) => {
  // Phaser scene.update receives (time, delta) in milliseconds
  const scene = game.scene.getScenes(true)[0];
  if (!scene) return;

  const currentTime = scene.time.now;
  scene.update(currentTime + ms, ms);
};
''',
    "babylon": '''
// Integration hooks for Babylon.js games
// Add these after engine and scene are created

(window as any).render_game_to_text = () => {
  return JSON.stringify({
    phase: scene.metadata?.phase || 'unknown',
    fps: Math.round(engine.getFps()),
    meshes: scene.meshes.length,
    camera: scene.activeCamera ? {
      x: scene.activeCamera.position.x,
      y: scene.activeCamera.position.y,
      z: scene.activeCamera.position.z,
    } : null,
    timestamp: Date.now(),
  });
};

(window as any).advanceTime = (ms: number) => {
  // Step the Babylon.js scene deterministically
  scene.metadata = scene.metadata || {};
  const dt = ms / 1000;
  if (typeof update === 'function') update(dt);
  scene.render();
};
''',
}

PROGRESS_TEMPLATE = """# Progress

## Current Phase
- [ ] Core loop working
- [ ] Integration hooks wired
- [ ] Basic gameplay functional
- [ ] Visual polish pass
- [ ] Audio integration
- [ ] Performance optimization
- [ ] Deployment ready

## What's Working
- (none yet)

## Known Issues
- (none yet)

## Next Steps
1. Implement core game loop
2. Wire integration hooks
3. Test via validation loop
"""


def init_project(project_dir: str, engine: str):
    path = Path(project_dir)

    # Create progress.md
    progress_path = path / "progress.md"
    if not progress_path.exists():
        progress_path.write_text(PROGRESS_TEMPLATE)
        print(f"Created: {progress_path}")
    else:
        print(f"Skipped (exists): {progress_path}")

    # Show hook template
    template = HOOK_TEMPLATES.get(engine, HOOK_TEMPLATES["canvas"])
    print(f"\n=== Integration Hook Template ({engine}) ===")
    print(template)
    print("Add these to your entry point after game initialization.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Game Project Initializer")
    parser.add_argument("--project-dir", default=".", help="Path to game project")
    parser.add_argument("--engine", choices=["threejs", "canvas", "phaser", "babylon"], default="canvas")

    args = parser.parse_args()
    init_project(args.project_dir, args.engine)
