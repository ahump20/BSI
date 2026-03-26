# Web Game Patterns

Browser-based game development: Canvas 2D, Phaser 3, Babylon.js, PixiJS.

## Framework Selection

| Framework | Best For | Performance |
|-----------|----------|-------------|
| **Canvas 2D** | Learning, simple games, full control | Medium |
| **Phaser 3** | 2D games, game jams, rapid dev | High (WebGL) |
| **PixiJS** | 2D rendering, custom engines | Very High |
| **Babylon.js** | 3D games, WebXR, complex scenes | High |
| **Three.js** | 3D visualization, creative coding | High |

## Canvas 2D Basics

```typescript
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Game loop
let lastTime = 0;
function gameLoop(currentTime: number): void {
  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  update(delta);
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt: number): void {
  // Update game state
  player.x += player.vx * dt;
  player.y += player.vy * dt;
}

function render(): void {
  // Clear screen
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

requestAnimationFrame(gameLoop);
```

### Canvas Input

```typescript
const keys: Set<string> = new Set();

window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

function update(dt: number): void {
  if (keys.has('ArrowLeft')) player.vx = -SPEED;
  else if (keys.has('ArrowRight')) player.vx = SPEED;
  else player.vx = 0;

  if (keys.has('Space') && player.grounded) {
    player.vy = JUMP_VELOCITY;
  }
}

// Mouse/touch
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  handleClick(x, y);
});
```

### Canvas Collision

```typescript
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function circlesOverlap(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2;
}
```

## Phaser 3

```typescript
import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('MainScene');
  }

  preload(): void {
    this.load.image('player', 'assets/player.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.spritesheet('coins', 'assets/coins.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create(): void {
    // Create player with physics
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setCollideWorldBounds(true);

    // Create ground
    const ground = this.physics.add.staticGroup();
    ground.create(400, 568, 'ground').setScale(2).refreshBody();

    // Collision
    this.physics.add.collider(this.player, ground);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Animation
    this.anims.create({
      key: 'spin',
      frames: this.anims.generateFrameNumbers('coins', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
  }

  update(): void {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body!.touching.down) {
      this.player.setVelocityY(-330);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 300 } }
  },
  scene: MainScene
};

new Phaser.Game(config);
```

### Phaser Scene Management

```typescript
// Switch scenes
this.scene.start('GameOverScene', { score: this.score });

// Parallel scenes
this.scene.launch('UIScene'); // Runs alongside current scene
this.scene.pause('MainScene');
this.scene.resume('MainScene');

// Scene data
class GameOverScene extends Phaser.Scene {
  init(data: { score: number }): void {
    this.finalScore = data.score;
  }
}
```

## Babylon.js (3D)

```typescript
import * as BABYLON from '@babylonjs/core';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = (): BABYLON.Scene => {
  const scene = new BABYLON.Scene(engine);

  // Camera
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    Math.PI / 2,
    Math.PI / 3,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);

  // Light
  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

  // Ground
  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground',
    { width: 10, height: 10 },
    scene
  );

  // Player (sphere)
  const player = BABYLON.MeshBuilder.CreateSphere(
    'player',
    { diameter: 1 },
    scene
  );
  player.position.y = 0.5;

  // Material
  const material = new BABYLON.StandardMaterial('playerMat', scene);
  material.diffuseColor = new BABYLON.Color3(1, 0, 0);
  player.material = material;

  // Physics (using Havok or Cannon.js)
  // scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.HavokPlugin());

  return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener('resize', () => {
  engine.resize();
});
```

### Babylon Input

```typescript
// Keyboard
const inputMap: Record<string, boolean> = {};
scene.actionManager = new BABYLON.ActionManager(scene);

scene.actionManager.registerAction(
  new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnKeyDownTrigger,
    (evt) => { inputMap[evt.sourceEvent.code] = true; }
  )
);

scene.actionManager.registerAction(
  new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnKeyUpTrigger,
    (evt) => { inputMap[evt.sourceEvent.code] = false; }
  )
);

// In render loop
scene.registerBeforeRender(() => {
  if (inputMap['KeyW']) player.position.z += 0.1;
  if (inputMap['KeyS']) player.position.z -= 0.1;
});
```

## PixiJS (2D Rendering)

```typescript
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view as HTMLCanvasElement);

// Load assets
await PIXI.Assets.load('assets/player.png');

// Create sprite
const player = PIXI.Sprite.from('assets/player.png');
player.anchor.set(0.5);
player.x = app.screen.width / 2;
player.y = app.screen.height / 2;
app.stage.addChild(player);

// Game loop
app.ticker.add((delta) => {
  // delta is frame-time normalized (1 = 60fps)
  player.rotation += 0.01 * delta;
});

// Container for grouping
const enemies = new PIXI.Container();
app.stage.addChild(enemies);

for (let i = 0; i < 10; i++) {
  const enemy = PIXI.Sprite.from('assets/enemy.png');
  enemy.x = Math.random() * 800;
  enemy.y = Math.random() * 600;
  enemies.addChild(enemy);
}
```

## Asset Loading

```typescript
// Phaser
this.load.on('progress', (value: number) => {
  console.log(`Loading: ${Math.round(value * 100)}%`);
});

this.load.on('complete', () => {
  console.log('All assets loaded');
});

// Babylon.js
const assetsManager = new BABYLON.AssetsManager(scene);

const meshTask = assetsManager.addMeshTask('player', '', 'assets/', 'player.glb');
meshTask.onSuccess = (task) => {
  task.loadedMeshes[0].position = new BABYLON.Vector3(0, 0, 0);
};

assetsManager.onProgress = (remaining, total) => {
  console.log(`Loading: ${Math.round((1 - remaining / total) * 100)}%`);
};

assetsManager.load();
```

## Audio

```typescript
// Web Audio API
const audioContext = new AudioContext();

async function loadSound(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

function playSound(buffer: AudioBuffer, volume = 1): void {
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = buffer;
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(0);
}

// Phaser
this.sound.play('explosion', { volume: 0.5 });

// Babylon
const music = new BABYLON.Sound('bgm', 'assets/music.mp3', scene, null, {
  loop: true,
  autoplay: true,
  volume: 0.5
});
```

## Save/Load (LocalStorage)

```typescript
interface SaveData {
  level: number;
  score: number;
  highScore: number;
  unlockedItems: string[];
}

function saveGame(data: SaveData): void {
  localStorage.setItem('gameData', JSON.stringify(data));
}

function loadGame(): SaveData | null {
  const saved = localStorage.getItem('gameData');
  if (!saved) return null;
  return JSON.parse(saved) as SaveData;
}

// For larger data, use IndexedDB
const dbRequest = indexedDB.open('GameDB', 1);

dbRequest.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;
  db.createObjectStore('saves', { keyPath: 'id' });
};
```

## Mobile/Touch

```typescript
// Touch events
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  handleTouch(touch.clientX, touch.clientY);
});

// Fullscreen
function requestFullscreen(): void {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
}

// Orientation
window.addEventListener('orientationchange', () => {
  resizeGame();
});

// Prevent zoom on double-tap
document.addEventListener('touchend', (e) => {
  e.preventDefault();
}, { passive: false });
```

## Deployment

**itch.io:**
1. Build to dist folder
2. Zip contents (index.html at root)
3. Upload to itch.io project
4. Set to HTML embed

**Self-hosted:**
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Game</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module" src="game.js"></script>
</body>
</html>
```

## Performance Tips

```typescript
// Object pooling
const bulletPool: Bullet[] = [];

function getBullet(): Bullet {
  return bulletPool.pop() ?? new Bullet();
}

function returnBullet(bullet: Bullet): void {
  bullet.reset();
  bulletPool.push(bullet);
}

// Sprite batching (PixiJS/Phaser)
// Use sprite sheets instead of individual images

// Reduce draw calls
// Group similar sprites in containers

// Offscreen culling
function isOnScreen(obj: { x: number; y: number }): boolean {
  return (
    obj.x > -100 && obj.x < canvas.width + 100 &&
    obj.y > -100 && obj.y < canvas.height + 100
  );
}

// RequestAnimationFrame throttling for background tabs
let lastFrame = 0;
function gameLoop(timestamp: number): void {
  if (timestamp - lastFrame < 16) { // Cap at ~60fps
    requestAnimationFrame(gameLoop);
    return;
  }
  lastFrame = timestamp;
  // ... game logic
}
```
