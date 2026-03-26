# Game Templates

## Minimal Canvas Game

```typescript
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

interface GameState {
  phase: 'menu' | 'playing' | 'gameover';
  score: number;
  entities: Entity[];
}

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
}

const state: GameState = { phase: 'menu', score: 0, entities: [] };

function update(dt: number) {
  for (const e of state.entities) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const e of state.entities) {
    ctx.fillRect(e.x, e.y, 10, 10);
  }
}

let lastTime = 0;
function gameLoop(time: number) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Integration hooks
(window as any).render_game_to_text = () => JSON.stringify(state);
(window as any).advanceTime = (ms: number) => update(ms / 1000);
```

## Three.js Game Skeleton

```typescript
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
const renderer = new THREE.WebGLRenderer();

const gameState = {
  phase: 'loading' as string,
  score: 0,
  time: 0,
};

function update(dt: number) {
  gameState.time += dt;
  // Game logic here
}

let lastTime = 0;
function animate(time: number) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Integration hooks
(window as any).render_game_to_text = () => JSON.stringify(gameState);
(window as any).advanceTime = (ms: number) => update(ms / 1000);
```
