# Core Production Patterns

Universal patterns for game architecture. Use these as starting points — engine-specific versions exist in the engine reference files.

## Game Loop

```typescript
let lastTime = 0;
const targetFPS = 60;
const targetDelta = 1000 / targetFPS;

function gameLoop(currentTime: number): void {
  const delta = (currentTime - lastTime) / 1000; // seconds
  lastTime = currentTime;

  update(delta);
  render();

  requestAnimationFrame(gameLoop);
}
```

## State Machine

```typescript
enum GameState {
  LOADING,
  MAIN_MENU,
  PLAYING,
  PAUSED,
  GAME_OVER
}

class StateMachine {
  private current: GameState = GameState.LOADING;
  private states: Map<GameState, StateHandler> = new Map();

  register(state: GameState, handler: StateHandler): void {
    this.states.set(state, handler);
  }

  transition(to: GameState): void {
    this.states.get(this.current)?.exit();
    this.current = to;
    this.states.get(to)?.enter();
  }

  update(dt: number): void {
    this.states.get(this.current)?.update(dt);
  }
}
```

## Object Pool

Reuse frequently created/destroyed objects (bullets, particles, enemies) to avoid GC pressure.

```typescript
class ObjectPool<T> {
  private available: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 50) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    return this.available.length > 0 ? this.available.pop()! : this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.available.push(obj);
  }
}

// Usage: bullets, particles, enemies - anything created/destroyed frequently
const bulletPool = new ObjectPool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, active: false }),
  (b) => { b.active = false; b.x = 0; b.y = 0; },
  100
);
```

## Entity-Component Pattern

```typescript
interface Entity {
  id: string;
  components: Map<string, Component>;
}

interface Component {
  type: string;
  update?(dt: number, entity: Entity): void;
}

// Transform component
interface Transform extends Component {
  type: 'transform';
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

// Velocity component
interface Velocity extends Component {
  type: 'velocity';
  vx: number;
  vy: number;
}

// System that processes entities with matching components
function movementSystem(entities: Entity[], dt: number): void {
  for (const entity of entities) {
    const transform = entity.components.get('transform') as Transform;
    const velocity = entity.components.get('velocity') as Velocity;
    if (transform && velocity) {
      transform.x += velocity.vx * dt;
      transform.y += velocity.vy * dt;
    }
  }
}
```

For deep ECS patterns (Unity DOTS, custom implementations): `unity-patterns.md` (ECS section)

For common mistakes and anti-patterns: `common-mistakes.md`
