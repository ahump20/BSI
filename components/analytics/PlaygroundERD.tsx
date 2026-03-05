'use client';

import { useReducer, useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Schema definition — pulled from D1 migrations
// ---------------------------------------------------------------------------

type TierLabel = 'key' | 'free' | 'pro' | 'meta';

interface Column {
  name: string;
  type: string;
  tier: TierLabel;
  note?: string;
}

interface TableNode {
  id: string;
  label: string;
  db: string;
  columns: Column[];
}

interface Relationship {
  from: string;
  to: string;
  label: string;
  cardinality: '1:1' | '1:M' | 'M:1' | 'ref';
}

const TABLES: TableNode[] = [
  {
    id: 'player_season_stats',
    label: 'player_season_stats',
    db: 'bsi-prod-db',
    columns: [
      { name: 'espn_id', type: 'TEXT PK', tier: 'key' },
      { name: 'season', type: 'INTEGER', tier: 'key' },
      { name: 'sport', type: 'TEXT', tier: 'key' },
      { name: 'name', type: 'TEXT', tier: 'free' },
      { name: 'team', type: 'TEXT', tier: 'free' },
      { name: 'team_id', type: 'TEXT', tier: 'free' },
      { name: 'position', type: 'TEXT', tier: 'free' },
      { name: 'at_bats', type: 'INTEGER', tier: 'free' },
      { name: 'hits', type: 'INTEGER', tier: 'free' },
      { name: 'home_runs', type: 'INTEGER', tier: 'free' },
      { name: 'walks_bat', type: 'INTEGER', tier: 'free' },
      { name: 'strikeouts_bat', type: 'INTEGER', tier: 'free' },
      { name: 'innings_pitched_thirds', type: 'INTEGER', tier: 'free', note: 'stored as thirds' },
      { name: 'earned_runs', type: 'INTEGER', tier: 'free' },
      { name: 'hit_by_pitch', type: 'INTEGER', tier: 'free' },
      { name: 'stats_source', type: 'TEXT', tier: 'meta' },
      { name: 'updated_at', type: 'TEXT', tier: 'meta' },
    ],
  },
  {
    id: 'processed_games',
    label: 'processed_games',
    db: 'bsi-prod-db',
    columns: [
      { name: 'game_id', type: 'TEXT PK', tier: 'key' },
      { name: 'sport', type: 'TEXT', tier: 'key' },
      { name: 'game_date', type: 'TEXT', tier: 'free' },
      { name: 'home_team', type: 'TEXT', tier: 'free' },
      { name: 'away_team', type: 'TEXT', tier: 'free' },
      { name: 'processed_at', type: 'TEXT', tier: 'meta' },
    ],
  },
  {
    id: 'cbb_batting_advanced',
    label: 'cbb_batting_advanced',
    db: 'bsi-prod-db',
    columns: [
      { name: 'player_id', type: 'TEXT', tier: 'key' },
      { name: 'season', type: 'INTEGER', tier: 'key' },
      { name: 'team', type: 'TEXT', tier: 'free' },
      { name: 'conference', type: 'TEXT', tier: 'free' },
      { name: 'k_pct', type: 'REAL', tier: 'free' },
      { name: 'bb_pct', type: 'REAL', tier: 'free' },
      { name: 'iso', type: 'REAL', tier: 'free' },
      { name: 'babip', type: 'REAL', tier: 'free' },
      { name: 'woba', type: 'REAL', tier: 'pro' },
      { name: 'wrc_plus', type: 'REAL', tier: 'pro' },
      { name: 'ops_plus', type: 'REAL', tier: 'pro' },
      { name: 'e_ba', type: 'REAL', tier: 'pro' },
      { name: 'e_slg', type: 'REAL', tier: 'pro' },
      { name: 'e_woba', type: 'REAL', tier: 'pro' },
      { name: 'computed_at', type: 'TEXT', tier: 'meta' },
    ],
  },
  {
    id: 'cbb_pitching_advanced',
    label: 'cbb_pitching_advanced',
    db: 'bsi-prod-db',
    columns: [
      { name: 'player_id', type: 'TEXT', tier: 'key' },
      { name: 'season', type: 'INTEGER', tier: 'key' },
      { name: 'team', type: 'TEXT', tier: 'free' },
      { name: 'conference', type: 'TEXT', tier: 'free' },
      { name: 'k_9', type: 'REAL', tier: 'free' },
      { name: 'bb_9', type: 'REAL', tier: 'free' },
      { name: 'hr_9', type: 'REAL', tier: 'free' },
      { name: 'fip', type: 'REAL', tier: 'pro' },
      { name: 'x_fip', type: 'REAL', tier: 'pro' },
      { name: 'era_minus', type: 'REAL', tier: 'pro' },
      { name: 'k_bb', type: 'REAL', tier: 'pro' },
      { name: 'lob_pct', type: 'REAL', tier: 'pro' },
      { name: 'babip', type: 'REAL', tier: 'pro' },
      { name: 'appearances_last_7d', type: 'INTEGER', tier: 'free' },
      { name: 'computed_at', type: 'TEXT', tier: 'meta' },
    ],
  },
  {
    id: 'cbb_park_factors',
    label: 'cbb_park_factors',
    db: 'bsi-prod-db',
    columns: [
      { name: 'team', type: 'TEXT', tier: 'key' },
      { name: 'season', type: 'INTEGER', tier: 'key' },
      { name: 'venue_name', type: 'TEXT', tier: 'free' },
      { name: 'conference', type: 'TEXT', tier: 'free' },
      { name: 'runs_factor', type: 'REAL', tier: 'pro' },
      { name: 'hits_factor', type: 'REAL', tier: 'pro' },
      { name: 'hr_factor', type: 'REAL', tier: 'pro' },
      { name: 'so_factor', type: 'REAL', tier: 'pro' },
      { name: 'sample_games', type: 'INTEGER', tier: 'meta' },
      { name: 'computed_at', type: 'TEXT', tier: 'meta' },
    ],
  },
  {
    id: 'cbb_conference_strength',
    label: 'cbb_conference_strength',
    db: 'bsi-prod-db',
    columns: [
      { name: 'conference', type: 'TEXT', tier: 'key' },
      { name: 'season', type: 'INTEGER', tier: 'key' },
      { name: 'strength_index', type: 'REAL', tier: 'pro' },
      { name: 'run_environment', type: 'REAL', tier: 'pro' },
      { name: 'avg_era', type: 'REAL', tier: 'free' },
      { name: 'avg_ops', type: 'REAL', tier: 'free' },
      { name: 'avg_woba', type: 'REAL', tier: 'pro' },
      { name: 'inter_conf_win_pct', type: 'REAL', tier: 'pro' },
      { name: 'is_power', type: 'INTEGER', tier: 'free' },
      { name: 'computed_at', type: 'TEXT', tier: 'meta' },
    ],
  },
  {
    id: 'cbb_league_context',
    label: 'cbb_league_context',
    db: 'bsi-prod-db',
    columns: [
      { name: 'season', type: 'INTEGER PK', tier: 'key' },
      { name: 'woba_scale', type: 'REAL', tier: 'pro' },
      { name: 'fip_constant', type: 'REAL', tier: 'pro' },
      { name: 'w_bb', type: 'REAL', tier: 'pro', note: 'linear weight: walk' },
      { name: 'w_1b', type: 'REAL', tier: 'pro', note: 'linear weight: single' },
      { name: 'w_2b', type: 'REAL', tier: 'pro', note: 'linear weight: double' },
      { name: 'w_hr', type: 'REAL', tier: 'pro', note: 'linear weight: HR' },
      { name: 'league_woba', type: 'REAL', tier: 'pro' },
      { name: 'league_obp', type: 'REAL', tier: 'free' },
      { name: 'league_era', type: 'REAL', tier: 'free' },
      { name: 'sample_pa', type: 'INTEGER', tier: 'meta' },
      { name: 'computed_at', type: 'TEXT', tier: 'meta' },
    ],
  },
  {
    id: 'source_system',
    label: 'source_system',
    db: 'bsi-prod-db',
    columns: [
      { name: 'id', type: 'INTEGER PK', tier: 'key' },
      { name: 'source_name', type: 'TEXT', tier: 'free' },
      { name: 'source_url', type: 'TEXT', tier: 'free' },
      { name: 'description', type: 'TEXT', tier: 'meta' },
      { name: 'last_sync', type: 'TEXT', tier: 'meta' },
    ],
  },
];

const RELATIONSHIPS: Relationship[] = [
  { from: 'processed_games', to: 'player_season_stats', label: 'game_date/team', cardinality: '1:M' },
  { from: 'player_season_stats', to: 'cbb_batting_advanced', label: 'player_id', cardinality: '1:1' },
  { from: 'player_season_stats', to: 'cbb_pitching_advanced', label: 'player_id', cardinality: '1:1' },
  { from: 'cbb_batting_advanced', to: 'cbb_conference_strength', label: 'conference', cardinality: 'M:1' },
  { from: 'cbb_pitching_advanced', to: 'cbb_conference_strength', label: 'conference', cardinality: 'M:1' },
  { from: 'cbb_batting_advanced', to: 'cbb_park_factors', label: 'team', cardinality: 'M:1' },
  { from: 'cbb_pitching_advanced', to: 'cbb_park_factors', label: 'team', cardinality: 'M:1' },
  { from: 'cbb_league_context', to: 'cbb_batting_advanced', label: 'provides weights', cardinality: 'ref' },
];

// ---------------------------------------------------------------------------
// Node position state
// ---------------------------------------------------------------------------

type NodePositions = Record<string, { x: number; y: number }>;

const INITIAL_POSITIONS: NodePositions = {
  player_season_stats:      { x: 360, y: 140 },
  processed_games:          { x: 60,  y: 140 },
  cbb_batting_advanced:     { x: 200, y: 360 },
  cbb_pitching_advanced:    { x: 540, y: 360 },
  cbb_park_factors:         { x: 700, y: 560 },
  cbb_conference_strength:  { x: 360, y: 560 },
  cbb_league_context:       { x: 60,  y: 560 },
  source_system:            { x: 700, y: 140 },
};

type PositionAction =
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'reset' };

function positionReducer(state: NodePositions, action: PositionAction): NodePositions {
  if (action.type === 'reset') return { ...INITIAL_POSITIONS };
  return { ...state, [action.id]: { x: action.x, y: action.y } };
}

// ---------------------------------------------------------------------------
// Tier colors
// ---------------------------------------------------------------------------

function tierColor(tier: TierLabel): string {
  switch (tier) {
    case 'key':  return '#BF5700'; // burnt-orange
    case 'pro':  return '#FF6B35'; // ember
    case 'free': return '#FAF8F5'; // cream
    case 'meta': return '#6b7280'; // gray
  }
}

function tierLabel(tier: TierLabel): string {
  switch (tier) {
    case 'key':  return 'PK/FK';
    case 'pro':  return 'pro';
    case 'free': return 'free';
    case 'meta': return 'meta';
  }
}

// ---------------------------------------------------------------------------
// Relationship path helper
// ---------------------------------------------------------------------------

const NODE_W = 180;
const NODE_H = 40; // header height for midpoint calculation

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const fx = from.x + NODE_W / 2;
  const fy = from.y + NODE_H / 2;
  const tx = to.x + NODE_W / 2;
  const ty = to.y + NODE_H / 2;
  const cx = (fx + tx) / 2;
  return `M ${fx} ${fy} C ${cx} ${fy}, ${cx} ${ty}, ${tx} ${ty}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlaygroundERD() {
  const [positions, dispatch] = useReducer(positionReducer, { ...INITIAL_POSITIONS });
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const getTableById = (id: string) => TABLES.find(t => t.id === id);

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, id: string) => {
      // Capture on the SVG so onPointerMove/Up fire even when pointer leaves the node
      svgRef.current?.setPointerCapture(e.pointerId);
      const pos = positions[id];
      setDragging(id);
      setDragStart({ mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y });
      e.stopPropagation();
    },
    [positions],
  );

  const handleSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging || !dragStart) return;
      const dx = e.clientX - dragStart.mx;
      const dy = e.clientY - dragStart.my;
      dispatch({ type: 'move', id: dragging, x: dragStart.ox + dx, y: dragStart.oy + dy });
    },
    [dragging, dragStart],
  );

  const handleSvgPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging || !dragStart) return;
      const dx = e.clientX - dragStart.mx;
      const dy = e.clientY - dragStart.my;
      const moved = Math.abs(dx) + Math.abs(dy);
      // If barely moved, treat as click (select)
      if (moved < 3) {
        setSelectedTable(prev => prev === dragging ? null : dragging);
      }
      setDragging(null);
      setDragStart(null);
    },
    [dragging, dragStart],
  );

  const selectedTableData = selectedTable ? getTableById(selectedTable) : null;

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '600px' }}>
      {/* SVG canvas */}
      <div style={{ flex: 1, background: '#111', borderRadius: '8px', border: '1px solid rgba(191,87,0,0.2)', overflow: 'hidden', position: 'relative' }}>
        {/* Reset button */}
        <button
          onClick={() => dispatch({ type: 'reset' })}
          style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 10,
            background: 'rgba(191,87,0,0.15)', border: '1px solid rgba(191,87,0,0.3)',
            color: '#FF6B35', padding: '4px 10px', borderRadius: '4px',
            fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          Reset Layout
        </button>

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 920 700"
          style={{ userSelect: 'none', touchAction: 'none', cursor: dragging ? 'grabbing' : 'default' }}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
        >
          {/* Relationship lines */}
          <g>
            {RELATIONSHIPS.map((rel, i) => {
              const from = positions[rel.from];
              const to = positions[rel.to];
              if (!from || !to) return null;
              const mx = (from.x + NODE_W / 2 + to.x + NODE_W / 2) / 2;
              const my = (from.y + NODE_H / 2 + to.y + NODE_H / 2) / 2;
              const strokeColor = rel.cardinality === 'ref' ? 'rgba(191,87,0,0.4)' : 'rgba(255,107,53,0.5)';
              return (
                <g key={i}>
                  <path
                    d={edgePath(from, to)}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={rel.cardinality === 'ref' ? 1 : 1.5}
                    strokeDasharray={rel.cardinality === 'ref' ? '4 3' : undefined}
                  />
                  <text
                    x={mx}
                    y={my - 4}
                    textAnchor="middle"
                    fill="rgba(250,248,245,0.4)"
                    fontSize={9}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {rel.label}
                  </text>
                  <text
                    x={mx}
                    y={my + 9}
                    textAnchor="middle"
                    fill={strokeColor}
                    fontSize={8}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {rel.cardinality}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          {TABLES.map(table => {
            const pos = positions[table.id];
            const isSelected = selectedTable === table.id;
            const isDragging = dragging === table.id;
            return (
              <g
                key={table.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onPointerDown={e => handleNodePointerDown(e, table.id)}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {/* Node border */}
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  fill={isSelected ? 'rgba(191,87,0,0.25)' : '#1A1A1A'}
                  stroke={isSelected ? '#BF5700' : 'rgba(191,87,0,0.35)'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                {/* Table name */}
                <text
                  x={NODE_W / 2}
                  y={24}
                  textAnchor="middle"
                  fill="#FAF8F5"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {table.label}
                </text>
                {/* DB badge */}
                <text
                  x={NODE_W / 2}
                  y={35}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize={7.5}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {table.db}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Column detail panel */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: '#1A1A1A', borderRadius: '8px',
        border: '1px solid rgba(191,87,0,0.2)',
        overflowY: 'auto', padding: '1rem',
      }}>
        {selectedTableData ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                {selectedTableData.db}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FAF8F5', fontFamily: 'JetBrains Mono, monospace' }}>
                {selectedTableData.label}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {(['key', 'free', 'pro', 'meta'] as TierLabel[]).map(t => (
                <span key={t} style={{ fontSize: '0.65rem', color: tierColor(t), fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: tierColor(t), display: 'inline-block' }} />
                  {tierLabel(t)}
                </span>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              {selectedTableData.columns.map(col => (
                <div key={col.name} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.75rem', color: tierColor(col.tier), fontFamily: 'JetBrains Mono, monospace' }}>
                      {col.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                      {col.type}
                    </span>
                  </div>
                  {col.note && (
                    <div style={{ fontSize: '0.625rem', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', marginTop: '1px' }}>
                      ↳ {col.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: 'rgba(250,248,245,0.35)', fontSize: '0.8125rem', textAlign: 'center', marginTop: '3rem', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.5 }}>
            Click any table node to inspect its columns and tier gating.
          </div>
        )}
      </div>
    </div>
  );
}
