# Procedural Generation Patterns

Algorithms for generating content: terrain, dungeons, items.

## Noise Functions

### Perlin/Simplex Noise

Smooth, natural-looking randomness. Use for terrain, clouds, textures.

```typescript
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

// Basic terrain heightmap
function generateHeightmap(width: number, height: number, scale: number): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = (noise2D(x / scale, y / scale) + 1) / 2;
    }
  }
  return map;
}

// Octave noise (more detail)
function octaveNoise(x: number, y: number, octaves: number, persistence: number): number {
  let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  return total / maxValue;
}
```

### Noise-Based Biomes

```typescript
const biomes = [
  { name: 'ocean', minH: 0, maxH: 0.3, minM: 0, maxM: 1, tile: 0 },
  { name: 'beach', minH: 0.3, maxH: 0.35, minM: 0, maxM: 1, tile: 1 },
  { name: 'desert', minH: 0.35, maxH: 0.6, minM: 0, maxM: 0.3, tile: 2 },
  { name: 'grassland', minH: 0.35, maxH: 0.6, minM: 0.3, maxM: 0.6, tile: 3 },
  { name: 'forest', minH: 0.35, maxH: 0.6, minM: 0.6, maxM: 1, tile: 4 },
  { name: 'mountain', minH: 0.6, maxH: 1, minM: 0, maxM: 1, tile: 5 },
];

function getBiome(height: number, moisture: number): number {
  for (const b of biomes) {
    if (height >= b.minH && height < b.maxH && moisture >= b.minM && moisture < b.maxM) {
      return b.tile;
    }
  }
  return 0;
}
```

## Dungeon Generation

### BSP (Binary Space Partitioning)

Room-based dungeons with guaranteed connectivity.

```typescript
interface Room { x: number; y: number; width: number; height: number; }

interface BSPNode {
  x: number; y: number; width: number; height: number;
  left: BSPNode | null; right: BSPNode | null; room: Room | null;
}

function generateBSP(x: number, y: number, w: number, h: number, minSize: number, depth: number): BSPNode {
  const node: BSPNode = { x, y, width: w, height: h, left: null, right: null, room: null };

  if (depth === 0 || w < minSize * 2 || h < minSize * 2) {
    // Leaf - create room
    const rw = Math.floor(w * (0.6 + Math.random() * 0.3));
    const rh = Math.floor(h * (0.6 + Math.random() * 0.3));
    node.room = {
      x: x + Math.floor(Math.random() * (w - rw)),
      y: y + Math.floor(Math.random() * (h - rh)),
      width: rw, height: rh
    };
    return node;
  }

  const splitH = Math.random() > 0.5;
  if (splitH && h >= minSize * 2) {
    const split = Math.floor(h * (0.3 + Math.random() * 0.4));
    node.left = generateBSP(x, y, w, split, minSize, depth - 1);
    node.right = generateBSP(x, y + split, w, h - split, minSize, depth - 1);
  } else if (w >= minSize * 2) {
    const split = Math.floor(w * (0.3 + Math.random() * 0.4));
    node.left = generateBSP(x, y, split, h, minSize, depth - 1);
    node.right = generateBSP(x + split, y, w - split, h, minSize, depth - 1);
  }

  return node;
}
```

### Drunkard's Walk

Organic cave-like structures.

```typescript
function drunkardWalk(width: number, height: number, fillPercent: number): number[][] {
  const map = Array.from({ length: height }, () => new Array(width).fill(1));
  const target = Math.floor(width * height * fillPercent);
  let floors = 0, x = width >> 1, y = height >> 1;

  while (floors < target) {
    if (map[y][x] === 1) { map[y][x] = 0; floors++; }
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0 && y > 1) y--;
    else if (dir === 1 && y < height - 2) y++;
    else if (dir === 2 && x > 1) x--;
    else if (dir === 3 && x < width - 2) x++;
  }
  return map;
}
```

### Cellular Automata

Smooth, natural caves.

```typescript
function cellularAutomata(w: number, h: number, iterations: number, fill: number): number[][] {
  let map = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) =>
      (x === 0 || x === w - 1 || y === 0 || y === h - 1) ? 1 : (Math.random() < fill ? 1 : 0)
    )
  );

  for (let i = 0; i < iterations; i++) {
    map = map.map((row, y) =>
      row.map((_, x) => countNeighbors(map, x, y) >= 5 ? 1 : 0)
    );
  }
  return map;
}

function countNeighbors(map: number[][], x: number, y: number): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const ny = y + dy, nx = x + dx;
      count += (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) ? 1 : map[ny][nx];
    }
  }
  return count;
}
```

## Loot Tables

```typescript
interface LootEntry {
  item: string;
  weight: number;
  min: number;
  max: number;
}

function rollLoot(entries: LootEntry[], rolls: number): Array<{ item: string; qty: number }> {
  const results: Array<{ item: string; qty: number }> = [];
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  for (let i = 0; i < rolls; i++) {
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    for (const entry of entries) {
      cumulative += entry.weight;
      if (roll < cumulative) {
        results.push({
          item: entry.item,
          qty: Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min
        });
        break;
      }
    }
  }
  return results;
}

// Usage
const chestLoot: LootEntry[] = [
  { item: 'gold', weight: 50, min: 10, max: 50 },
  { item: 'potion', weight: 30, min: 1, max: 3 },
  { item: 'sword', weight: 15, min: 1, max: 1 },
  { item: 'rare_gem', weight: 5, min: 1, max: 1 },
];
```

## Seeded Random

Reproducible generation.

```typescript
function createRNG(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Usage
const rng = createRNG(12345);
console.log(rng()); // Always same sequence for same seed
```

## Wave Function Collapse (WFC)

Constraint-based tile generation. Useful for:
- Tile-based maps that respect adjacency rules
- Sudoku-like constraint propagation

**Algorithm:**
1. Initialize grid where each cell can be any tile
2. Find cell with lowest entropy (fewest options)
3. Collapse that cell to one random option
4. Propagate constraints to neighbors
5. Repeat until all collapsed or contradiction

Libraries: `wfc-npm`, engine-specific implementations.

## Name Generation

Use Markov chains trained on example names:
1. Build transition map: "ar" → ['a', 'g', 'o']
2. Generate by walking chain until end token
3. Libraries: `tracery`, `compromise`, or custom 2-3 order chain
