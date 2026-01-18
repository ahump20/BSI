/**
 * MiniMap - Tactical overview with building visualization
 *
 * Enhanced features:
 * - Shows building positions as colored squares (color by type, brightness by tier)
 * - Optional fog overlay (explored regions bright, unexplored dark)
 * - Agent pulsing dots
 * - Click to center view on buildings
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { MapData, Unit } from '@data/replay-schema';
import type { CityState, BuildingKind, Tier } from '@core/BuildingSystem';
import { BUILDING_CONFIGS } from '@core/BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface MiniMapProps {
  mapData?: MapData | null;
  units?: Unit[];
  cityState?: CityState | null;
  agents?: Record<string, { id: string; name: string; region: string; status: string }>;
  viewportBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  showFog?: boolean;
  onClickPosition?: (x: number, y: number) => void;
  onClickBuilding?: (buildingKind: BuildingKind) => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    background: 'linear-gradient(180deg, #1a1612 0%, #0f0d0a 100%)',
    border: '3px solid #4a3c2a',
    boxShadow: 'inset 0 1px 0 #3a2e20, inset 0 -1px 0 #0a0806, 0 2px 4px rgba(0,0,0,0.5)',
    borderRadius: '2px',
    padding: '0.5rem',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    paddingBottom: '0.25rem',
    borderBottom: '1px solid #4a3c2a',
  },
  title: {
    fontSize: '0.6rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  canvasWrapper: {
    position: 'relative' as const,
    background: '#0a0806',
    border: '2px solid #4a3c2a',
    borderRadius: '2px',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    cursor: 'pointer',
  },
  noMap: {
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0806',
    border: '2px solid #4a3c2a',
    borderRadius: '2px',
    fontSize: '0.65rem',
    color: '#555',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
    marginTop: '0.5rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.45rem',
    color: '#888',
  },
  legendDot: {
    width: '6px',
    height: '6px',
    borderRadius: '1px',
  },
};

// ─────────────────────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────────────────────

const COLORS = {
  ground: '#1a1612',
  wall: '#2a241e',
  resource: '#FFD700',
  team0: '#3498DB',
  team1: '#E74C3C',
  neutral: '#888888',
  viewport: 'rgba(255, 255, 255, 0.2)',
  viewportBorder: 'rgba(255, 255, 255, 0.5)',
  fog: 'rgba(0, 0, 0, 0.6)',
  agent: '#2ECC71',
};

const BUILDING_COLORS: Record<BuildingKind, string> = {
  townhall: '#FFD700',
  workshop: '#BF5700',
  market: '#2ECC71',
  barracks: '#E74C3C',
  stables: '#3498DB',
  library: '#9B59B6',
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getBuildingBrightness(tier: Tier): number {
  switch (tier) {
    case 0: return 0.4;
    case 1: return 0.7;
    case 2: return 1.0;
    default: return 0.4;
  }
}

function adjustColorBrightness(hex: string, brightness: number): string {
  // Parse hex color
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Adjust brightness
  const adjust = (c: number) => Math.round(c * brightness);

  return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function MiniMap({
  mapData,
  units = [],
  cityState,
  agents,
  viewportBounds,
  showFog = false,
  onClickPosition,
  onClickBuilding,
}: MiniMapProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Calculate grid dimensions for city view
  const gridSize = useMemo(() => {
    if (mapData) {
      return { width: mapData.width, height: mapData.height };
    }
    // Default city grid (5x5)
    return { width: 5, height: 5 };
  }, [mapData]);

  // Render the minimap
  const renderMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = gridSize;

    // Set canvas size
    const scale = 2; // Pixel density
    const canvasWidth = 180 * scale;
    const canvasHeight = Math.floor((height / width) * 180) * scale;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = '180px';
    canvas.style.height = `${Math.floor((height / width) * 180)}px`;

    const cellWidth = canvasWidth / width;
    const cellHeight = canvasHeight / height;

    // Clear with background
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw terrain if available
    if (mapData?.cells) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = mapData.cells[y]?.[x];
          if (!cell) continue;

          let color = COLORS.ground;
          if (cell.terrain === 'wall') color = COLORS.wall;
          if (cell.terrain === 'resource') color = COLORS.resource;

          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(x * cellWidth),
            Math.floor(y * cellHeight),
            Math.ceil(cellWidth) + 1,
            Math.ceil(cellHeight) + 1
          );
        }
      }
    }

    // Draw buildings (city view)
    if (cityState) {
      for (const [kind, building] of Object.entries(cityState.buildings)) {
        const config = BUILDING_CONFIGS[kind as BuildingKind];
        if (!config) continue;

        const { x, y } = config.gridPosition;
        const px = x * cellWidth;
        const py = y * cellHeight;
        const size = cellWidth * 0.8;

        const brightness = getBuildingBrightness(building.tier);
        const color = adjustColorBrightness(config.color, brightness);

        // Draw building square
        ctx.fillStyle = color;
        ctx.fillRect(
          px + (cellWidth - size) / 2,
          py + (cellHeight - size) / 2,
          size,
          size
        );

        // Draw border
        ctx.strokeStyle = config.color;
        ctx.lineWidth = building.tier >= 1 ? 2 : 1;
        ctx.strokeRect(
          px + (cellWidth - size) / 2,
          py + (cellHeight - size) / 2,
          size,
          size
        );

        // Draw tier indicator (dots)
        if (building.tier > 0) {
          const dotSize = 3;
          const dotY = py + cellHeight - 6;
          for (let i = 0; i < building.tier; i++) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(
              px + cellWidth / 2 - (building.tier - 1) * 4 + i * 8,
              dotY,
              dotSize,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }
    }

    // Draw units (replay mode)
    for (const unit of units) {
      if (unit.type === 'resource') continue;

      let color = COLORS.neutral;
      if (unit.team === '0') color = COLORS.team0;
      if (unit.team === '1') color = COLORS.team1;

      const px = (unit.position.x + 0.5) * cellWidth;
      const py = (unit.position.y + 0.5) * cellHeight;
      const size = unit.type === 'base' || unit.type === 'barracks' ? 4 : 2;

      ctx.fillStyle = color;
      if (unit.type === 'base' || unit.type === 'barracks') {
        ctx.fillRect(px - size, py - size, size * 2, size * 2);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw agents (live mode)
    if (agents) {
      const agentList = Object.values(agents);
      const time = Date.now() / 1000;

      for (const agent of agentList) {
        // Find agent's building position
        const config = BUILDING_CONFIGS[agent.region as BuildingKind];
        if (!config) continue;

        const { x, y } = config.gridPosition;
        const px = (x + 0.5) * cellWidth;
        const py = (y + 0.5) * cellHeight;

        // Pulsing effect for active agents
        const pulse = agent.status === 'working'
          ? 0.5 + 0.5 * Math.sin(time * 4)
          : 0.5;

        const size = 4 + pulse * 2;

        ctx.fillStyle = agent.status === 'error' ? '#E74C3C' : COLORS.agent;
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Inner dot
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw fog of war overlay
    if (showFog && cityState) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Check if any building is at this position
          let hasActivity = false;
          for (const building of Object.values(cityState.buildings)) {
            const config = BUILDING_CONFIGS[building.kind];
            if (config.gridPosition.x === x && config.gridPosition.y === y) {
              hasActivity = building.completions > 0;
              break;
            }
          }

          if (!hasActivity) {
            ctx.fillStyle = COLORS.fog;
            ctx.fillRect(
              Math.floor(x * cellWidth),
              Math.floor(y * cellHeight),
              Math.ceil(cellWidth) + 1,
              Math.ceil(cellHeight) + 1
            );
          }
        }
      }
    }

    // Draw viewport rectangle
    if (viewportBounds) {
      const vx = viewportBounds.x * cellWidth;
      const vy = viewportBounds.y * cellHeight;
      const vw = viewportBounds.width * cellWidth;
      const vh = viewportBounds.height * cellHeight;

      ctx.fillStyle = COLORS.viewport;
      ctx.fillRect(vx, vy, vw, vh);

      ctx.strokeStyle = COLORS.viewportBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, vw, vh);
    }
  }, [mapData, units, cityState, agents, viewportBounds, showFog, gridSize]);

  // Animation loop for pulsing agents
  useEffect(() => {
    if (!agents || Object.keys(agents).length === 0) {
      renderMinimap();
      return;
    }

    const animate = () => {
      renderMinimap();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderMinimap, agents]);

  // Re-render on data changes (non-animated)
  useEffect(() => {
    if (!agents || Object.keys(agents).length === 0) {
      renderMinimap();
    }
  }, [renderMinimap, agents]);

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const { width, height } = gridSize;
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      // Check if clicked on a building
      if (cityState && onClickBuilding) {
        for (const building of Object.values(cityState.buildings)) {
          const config = BUILDING_CONFIGS[building.kind];
          if (config.gridPosition.x === x && config.gridPosition.y === y) {
            onClickBuilding(building.kind);
            return;
          }
        }
      }

      // Otherwise, emit position click
      if (onClickPosition) {
        onClickPosition(x, y);
      }
    },
    [gridSize, cityState, onClickPosition, onClickBuilding]
  );

  // Show empty state if no data
  if (!mapData && !cityState) {
    return (
      <div style={styles.container} className="wc3-panel wc3-minimap-container">
        <div style={styles.header} className="wc3-minimap-header">
          <span style={styles.title}>Minimap</span>
        </div>
        <div style={styles.noMap}>No data loaded</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="wc3-panel wc3-minimap-container">
      <div style={styles.header} className="wc3-minimap-header">
        <span style={styles.title}>Minimap</span>
        {cityState && (
          <span style={{ ...styles.title, color: '#BF5700' }}>
            City View
          </span>
        )}
      </div>
      <div style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onClick={handleClick}
        />
      </div>

      {/* Building legend (city mode) */}
      {cityState && (
        <div style={styles.legend}>
          {Object.entries(BUILDING_CONFIGS).map(([kind, config]) => (
            <div key={kind} style={styles.legendItem}>
              <div
                style={{
                  ...styles.legendDot,
                  background: config.color,
                }}
              />
              <span>{config.name[0]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
