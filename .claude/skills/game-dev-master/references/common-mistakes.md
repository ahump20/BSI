# Common Mistakes

Patterns that kill game projects. Organized by category — scope, code, and testing.

## Scope Mistakes

### Scope Creep
- Define MVP before writing code. List the 3-5 features that make the game playable.
- "Just one more feature" is the leading cause of abandoned projects.
- Cut features, not quality. A polished small game beats an unfinished large one.

### Premature Optimization
- Make it work, make it right, make it fast — in that order.
- Profile before optimizing. Intuition about bottlenecks is wrong more often than right.
- 90% of performance issues live in 10% of the code.

### Architecture Astronautics
- Do not over-engineer for hypothetical future features.
- Simple works until it doesn't — and "until it doesn't" is further away than you think.
- Refactor when the code tells you to, not preemptively.

### Solo Dev Traps
- Do not build an engine. Use one.
- Placeholder art is fine. Shipping matters more than polish on day one.
- Your first game should be tiny. Pong, not Skyrim.
- Avoid the "I'll just write my own physics" impulse — use an existing solution.

## Code Anti-Patterns

### Game Logic in the Render Loop

```typescript
// BAD: game logic coupled to frame rate
function draw() {
  player.x += 5; // moves faster at higher fps
  ctx.drawImage(player.sprite, player.x, player.y);
  requestAnimationFrame(draw);
}

// GOOD: separate update from render, use delta time
function update(dt: number) {
  player.x += player.speed * dt;
}
function render() {
  ctx.drawImage(player.sprite, player.x, player.y);
}
```

### String-Based State Comparisons

```typescript
// BAD: typos cause silent bugs
if (gameState === 'plaiyng') { ... }

// GOOD: enum or const object
const Phase = { MENU: 'menu', PLAYING: 'playing', OVER: 'over' } as const;
if (gameState === Phase.PLAYING) { ... }
```

### Allocations in Hot Paths

```typescript
// BAD: creates garbage every frame
function update() {
  const velocity = new Vector2(vx, vy); // GC pressure
  player.pos = player.pos.add(velocity);
}

// GOOD: reuse objects, mutate in place
const _tempVec = new Vector2(0, 0);
function update() {
  _tempVec.set(vx, vy);
  player.pos.addInPlace(_tempVec);
}
```

### Magic Numbers

```typescript
// BAD: what do these mean?
if (player.y > 580) { player.vy = -12; }

// GOOD: named constants
const GROUND_Y = 580;
const JUMP_VELOCITY = -12;
if (player.y > GROUND_Y) { player.vy = JUMP_VELOCITY; }
```

### Unbounded Collections

```typescript
// BAD: bullets array grows forever
bullets.push(new Bullet(x, y));

// GOOD: object pool with fixed capacity
const bulletPool = new ObjectPool(Bullet, MAX_BULLETS);
const bullet = bulletPool.acquire();
// ... when done:
bulletPool.release(bullet);
```

## Testing Anti-Patterns

### Self-Certifying Without Evidence
- Never declare a feature "done" without a screenshot proving it renders correctly.
- State JSON matching expectations is necessary but not sufficient — visual bugs exist independent of state.

### Skipping the Build Step
- `npm run build` catches real bugs (missing imports, type errors, dead references).
- Running from dev server only hides problems that surface in production.

### Manual-Only Testing
- Wire `window.render_game_to_text()` and `window.advanceTime()` early.
- Automated state snapshots catch regressions that manual playtesting misses.
- Use `scripts/test_game.py` for the full validation loop.

### Testing Happy Path Only
- Test edge cases: zero health, max score overflow, empty inventory, rapid input spam.
- Test state transitions: what happens when you pause during a level transition?
- Test resource exhaustion: what happens when the object pool is full?
