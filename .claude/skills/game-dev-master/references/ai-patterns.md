# Game AI Patterns

AI systems for NPCs, enemies, companions: behavior trees, FSM, pathfinding.

## Architecture Selection

| Pattern | Complexity | Best For |
|---------|------------|----------|
| **Finite State Machine** | Low | Simple enemies, predictable behavior |
| **Behavior Tree** | Medium | Complex AI, reusable behaviors |
| **Utility AI** | High | Dynamic decision-making, emergent behavior |
| **GOAP** | Very High | Planning agents, unpredictable solutions |

## Finite State Machine (FSM)

Simple, predictable, easy to debug.

```typescript
enum EnemyState {
  IDLE,
  PATROL,
  CHASE,
  ATTACK,
  FLEE
}

interface StateHandler {
  enter(): void;
  update(dt: number): void;
  exit(): void;
}

class EnemyFSM {
  private currentState: EnemyState = EnemyState.IDLE;
  private states: Map<EnemyState, StateHandler> = new Map();

  constructor(private enemy: Enemy) {
    this.states.set(EnemyState.IDLE, new IdleState(enemy, this));
    this.states.set(EnemyState.PATROL, new PatrolState(enemy, this));
    this.states.set(EnemyState.CHASE, new ChaseState(enemy, this));
    this.states.set(EnemyState.ATTACK, new AttackState(enemy, this));
    this.states.set(EnemyState.FLEE, new FleeState(enemy, this));
  }

  transition(newState: EnemyState): void {
    this.states.get(this.currentState)?.exit();
    this.currentState = newState;
    this.states.get(newState)?.enter();
  }

  update(dt: number): void {
    this.states.get(this.currentState)?.update(dt);
  }
}

class ChaseState implements StateHandler {
  constructor(private enemy: Enemy, private fsm: EnemyFSM) {}

  enter(): void {
    this.enemy.setAnimation('run');
  }

  update(dt: number): void {
    const distToPlayer = this.enemy.distanceTo(player);

    if (distToPlayer > this.enemy.sightRange) {
      this.fsm.transition(EnemyState.PATROL);
    } else if (distToPlayer < this.enemy.attackRange) {
      this.fsm.transition(EnemyState.ATTACK);
    } else {
      this.enemy.moveToward(player.position, dt);
    }
  }

  exit(): void {}
}
```

## Behavior Tree

Modular, reusable, industry standard for complex AI.

### Node Types

```
- Composite: Controls child execution
  - Sequence: Run children until one fails (AND)
  - Selector: Run children until one succeeds (OR)
  - Parallel: Run all children simultaneously

- Decorator: Modifies single child
  - Inverter: Flip success/failure
  - Repeater: Run N times or until fail
  - Succeeder: Always return success

- Leaf: Actual actions/conditions
  - Action: Do something (move, attack)
  - Condition: Check something (has target?)
```

### Implementation

```typescript
enum NodeStatus {
  SUCCESS,
  FAILURE,
  RUNNING
}

interface BTNode {
  tick(blackboard: Blackboard): NodeStatus;
}

// Blackboard: shared memory for the tree
interface Blackboard {
  target: Entity | null;
  lastKnownPosition: Vector2 | null;
  patrolPoints: Vector2[];
  currentPatrolIndex: number;
}

// Sequence: AND logic
class Sequence implements BTNode {
  private children: BTNode[];
  private currentChild = 0;

  constructor(children: BTNode[]) {
    this.children = children;
  }

  tick(blackboard: Blackboard): NodeStatus {
    while (this.currentChild < this.children.length) {
      const status = this.children[this.currentChild].tick(blackboard);

      if (status === NodeStatus.FAILURE) {
        this.currentChild = 0;
        return NodeStatus.FAILURE;
      }

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      this.currentChild++;
    }

    this.currentChild = 0;
    return NodeStatus.SUCCESS;
  }
}

// Selector: OR logic
class Selector implements BTNode {
  private children: BTNode[];
  private currentChild = 0;

  constructor(children: BTNode[]) {
    this.children = children;
  }

  tick(blackboard: Blackboard): NodeStatus {
    while (this.currentChild < this.children.length) {
      const status = this.children[this.currentChild].tick(blackboard);

      if (status === NodeStatus.SUCCESS) {
        this.currentChild = 0;
        return NodeStatus.SUCCESS;
      }

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      this.currentChild++;
    }

    this.currentChild = 0;
    return NodeStatus.FAILURE;
  }
}

// Condition leaf
class HasTarget implements BTNode {
  tick(blackboard: Blackboard): NodeStatus {
    return blackboard.target ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

// Action leaf
class MoveToTarget implements BTNode {
  constructor(private entity: Entity) {}

  tick(blackboard: Blackboard): NodeStatus {
    if (!blackboard.target) return NodeStatus.FAILURE;

    const dist = this.entity.distanceTo(blackboard.target);
    if (dist < 1) return NodeStatus.SUCCESS;

    this.entity.moveToward(blackboard.target.position);
    return NodeStatus.RUNNING;
  }
}
```

### Example Tree

```typescript
/*
Selector (try until one succeeds)
├── Sequence: Combat
│   ├── Condition: HasTarget
│   ├── Condition: TargetInRange
│   └── Action: Attack
├── Sequence: Chase
│   ├── Condition: HasTarget
│   └── Action: MoveToTarget
└── Sequence: Patrol
    ├── Action: MoveToPatrolPoint
    └── Action: Wait(2s)
*/

const enemyBT = new Selector([
  new Sequence([
    new HasTarget(),
    new TargetInRange(attackRange),
    new Attack()
  ]),
  new Sequence([
    new HasTarget(),
    new MoveToTarget(enemy)
  ]),
  new Sequence([
    new MoveToPatrolPoint(enemy),
    new Wait(2000)
  ])
]);

// In update loop
enemyBT.tick(blackboard);
```

## Utility AI

Score-based decision making. More dynamic than BT.

```typescript
interface UtilityAction {
  name: string;
  score(context: AIContext): number;
  execute(context: AIContext): void;
}

interface AIContext {
  self: Entity;
  health: number;
  maxHealth: number;
  nearbyEnemies: Entity[];
  nearbyAllies: Entity[];
  ammo: number;
}

class UtilityAI {
  private actions: UtilityAction[] = [];

  addAction(action: UtilityAction): void {
    this.actions.push(action);
  }

  selectAction(context: AIContext): UtilityAction | null {
    let bestAction: UtilityAction | null = null;
    let bestScore = 0;

    for (const action of this.actions) {
      const score = action.score(context);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  }
}

// Example actions
const attackAction: UtilityAction = {
  name: 'Attack',
  score(ctx) {
    if (ctx.nearbyEnemies.length === 0) return 0;
    const healthRatio = ctx.health / ctx.maxHealth;
    const hasAmmo = ctx.ammo > 0 ? 1 : 0;
    return healthRatio * 0.5 + hasAmmo * 0.5;
  },
  execute(ctx) {
    const nearest = findNearest(ctx.nearbyEnemies, ctx.self);
    ctx.self.attack(nearest);
  }
};

const fleeAction: UtilityAction = {
  name: 'Flee',
  score(ctx) {
    const healthRatio = ctx.health / ctx.maxHealth;
    const danger = ctx.nearbyEnemies.length / 5; // Normalize
    return (1 - healthRatio) * 0.7 + danger * 0.3;
  },
  execute(ctx) {
    const awayFromEnemies = calculateFleeDirection(ctx);
    ctx.self.moveInDirection(awayFromEnemies);
  }
};
```

## Pathfinding

### A* Algorithm

```typescript
interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // g + h
  parent: PathNode | null;
}

function aStar(
  start: Vector2,
  goal: Vector2,
  isWalkable: (x: number, y: number) => boolean
): Vector2[] {
  const openSet: PathNode[] = [];
  const closedSet: Set<string> = new Set();

  const startNode: PathNode = {
    x: Math.floor(start.x),
    y: Math.floor(start.y),
    g: 0,
    h: heuristic(start, goal),
    f: 0,
    parent: null
  };
  startNode.f = startNode.h;
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Get node with lowest f
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    // Goal reached
    if (current.x === Math.floor(goal.x) && current.y === Math.floor(goal.y)) {
      return reconstructPath(current);
    }

    closedSet.add(`${current.x},${current.y}`);

    // Check neighbors
    for (const [dx, dy] of [[0,1], [1,0], [0,-1], [-1,0], [1,1], [-1,1], [1,-1], [-1,-1]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;

      if (closedSet.has(key) || !isWalkable(nx, ny)) continue;

      const g = current.g + (dx !== 0 && dy !== 0 ? 1.414 : 1);
      const existing = openSet.find(n => n.x === nx && n.y === ny);

      if (!existing || g < existing.g) {
        const node: PathNode = {
          x: nx,
          y: ny,
          g,
          h: heuristic({ x: nx, y: ny }, goal),
          f: 0,
          parent: current
        };
        node.f = node.g + node.h;

        if (existing) {
          Object.assign(existing, node);
        } else {
          openSet.push(node);
        }
      }
    }
  }

  return []; // No path found
}

function heuristic(a: Vector2, b: Vector2): number {
  // Euclidean distance
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function reconstructPath(node: PathNode): Vector2[] {
  const path: Vector2[] = [];
  let current: PathNode | null = node;

  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}
```

### NavMesh (Engine-Specific)

**Unity:** Use NavMeshAgent, NavMeshSurface components
**Unreal:** Use NavigationSystem, NavMesh bounds volume
**Godot:** Use NavigationServer2D/3D, NavigationAgent

## Steering Behaviors

Smooth, natural movement for NPCs. Core behaviors:

- **Seek**: Move toward target at max speed
- **Flee**: Move away from target (inverse seek)
- **Arrive**: Slow down as approaching target
- **Separation**: Maintain distance from neighbors (flocking)
- **Cohesion**: Move toward center of group
- **Alignment**: Match velocity with neighbors

Combine behaviors with weights for complex movement. Libraries: `@pixi/math`, Three.js vectors.

## Combat AI

```typescript
class CombatAI {
  private attackCooldown = 0;

  update(dt: number, enemy: Enemy, target: Entity): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const dist = enemy.distanceTo(target);

    if (dist > enemy.preferredRange) enemy.moveToward(target.position, dt);
    else if (dist < enemy.preferredRange * 0.5) enemy.moveAway(target.position, dt);
    else if (this.attackCooldown <= 0) {
      enemy.attack(target);
      this.attackCooldown = enemy.attackSpeed;
    }
  }
}
```

## Group Behavior

Squad formations: store offset positions relative to leader. Each member moves toward `leader.position + offset[i]`. Common formations: line, V-shape, circle, wedge.
