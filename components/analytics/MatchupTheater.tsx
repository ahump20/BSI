'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { withAlpha } from '@/lib/utils/color';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatterProfile {
  player_id: string;
  player_name: string;
  team: string;
  conference?: string;
  position?: string;
  stats: {
    avg?: number;
    obp?: number;
    slg?: number;
    ops?: number;
    woba?: number;
    wrc_plus?: number;
    ops_plus?: number;
    iso?: number;
    k_pct?: number;
    bb_pct?: number;
    pa?: number;
    hr?: number;
  };
}

export interface PitcherProfile {
  player_id: string;
  player_name: string;
  team: string;
  conference?: string;
  position?: string;
  stats: {
    era?: number;
    fip?: number;
    whip?: number;
    k_9?: number;
    bb_9?: number;
    hr_9?: number;
    era_minus?: number;
    ip?: number;
    k_pct?: number;
    bb_pct?: number;
  };
}

interface MatchupTheaterProps {
  batter: BatterProfile | null;
  pitcher: PitcherProfile | null;
  batters: { id: string; name: string; team: string }[];
  pitchers: { id: string; name: string; team: string }[];
  onSelectBatter: (id: string) => void;
  onSelectPitcher: (id: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Stat bar definitions
// ---------------------------------------------------------------------------

interface StatBarDef {
  key: string;
  label: string;
  min: number;
  max: number;
  format: (v: number) => string;
  elite: number; // threshold where the stat becomes "elite"
  invert?: boolean; // lower is better (ERA, WHIP, K%)
}

const BATTER_STATS: StatBarDef[] = [
  { key: 'avg', label: 'AVG', min: 0.150, max: 0.400, format: v => v.toFixed(3).replace(/^0/, ''), elite: 0.320 },
  { key: 'obp', label: 'OBP', min: 0.200, max: 0.500, format: v => v.toFixed(3).replace(/^0/, ''), elite: 0.400 },
  { key: 'slg', label: 'SLG', min: 0.200, max: 0.700, format: v => v.toFixed(3).replace(/^0/, ''), elite: 0.550 },
  { key: 'woba', label: 'wOBA', min: 0.200, max: 0.500, format: v => v.toFixed(3).replace(/^0/, ''), elite: 0.400 },
  { key: 'wrc_plus', label: 'wRC+', min: 50, max: 200, format: v => Math.round(v).toString(), elite: 140 },
  { key: 'iso', label: 'ISO', min: 0, max: 0.350, format: v => v.toFixed(3).replace(/^0/, ''), elite: 0.220 },
  { key: 'k_pct', label: 'K%', min: 0, max: 0.40, format: v => `${(v * 100).toFixed(1)}%`, elite: 0.12, invert: true },
  { key: 'bb_pct', label: 'BB%', min: 0, max: 0.25, format: v => `${(v * 100).toFixed(1)}%`, elite: 0.12 },
];

const PITCHER_STATS: StatBarDef[] = [
  { key: 'era', label: 'ERA', min: 0, max: 8, format: v => v.toFixed(2), elite: 2.5, invert: true },
  { key: 'fip', label: 'FIP', min: 0, max: 8, format: v => v.toFixed(2), elite: 3.0, invert: true },
  { key: 'whip', label: 'WHIP', min: 0.6, max: 2.0, format: v => v.toFixed(2), elite: 1.0, invert: true },
  { key: 'k_9', label: 'K/9', min: 3, max: 15, format: v => v.toFixed(1), elite: 10 },
  { key: 'bb_9', label: 'BB/9', min: 0, max: 6, format: v => v.toFixed(1), elite: 2.0, invert: true },
  { key: 'era_minus', label: 'ERA-', min: 30, max: 150, format: v => Math.round(v).toString(), elite: 70, invert: true },
  { key: 'k_pct', label: 'K%', min: 0.10, max: 0.40, format: v => `${(v * 100).toFixed(1)}%`, elite: 0.28 },
  { key: 'bb_pct', label: 'BB%', min: 0, max: 0.20, format: v => `${(v * 100).toFixed(1)}%`, elite: 0.06, invert: true },
];

const BATTER_COLOR = 'var(--bsi-primary, #D97706)';
const PITCHER_COLOR = '#6B8DB2';

// ---------------------------------------------------------------------------
// Animated stat bar
// ---------------------------------------------------------------------------

function StatBar({
  def,
  value,
  color,
  align,
  delay,
}: {
  def: StatBarDef;
  value: number;
  color: string;
  align: 'left' | 'right';
  delay: number;
}) {
  const clampedValue = Math.max(def.min, Math.min(def.max, value));
  const pct = ((clampedValue - def.min) / (def.max - def.min)) * 100;
  const isElite = def.invert ? value <= def.elite : value >= def.elite;

  return (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <span className={`text-[10px] font-mono text-text-muted w-8 ${align === 'right' ? 'text-left' : 'text-right'}`}>
        {def.label}
      </span>
      <div className="flex-1 h-[10px] rounded-full bg-surface-light relative overflow-hidden">
        <motion.div
          className={`absolute top-0 bottom-0 rounded-full ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{
            backgroundColor: color,
            opacity: isElite ? 0.9 : 0.5,
            filter: isElite ? `drop-shadow(0 0 4px ${withAlpha(color, 0.4)})` : 'none',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18, delay }}
        />
      </div>
      <span
        className="text-[11px] font-mono font-bold tabular-nums w-12"
        style={{
          color: isElite ? color : 'rgba(255,255,255,0.6)',
          textAlign: align === 'right' ? 'right' : 'left',
        }}
      >
        {def.format(value)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player selector
// ---------------------------------------------------------------------------

function PlayerSelector({
  players,
  selected,
  onSelect,
  label,
  align,
}: {
  players: { id: string; name: string; team: string }[];
  selected: string;
  onSelect: (id: string) => void;
  label: string;
  align: 'left' | 'right';
}) {
  return (
    <div className={`${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span className="text-[9px] font-display uppercase tracking-widest text-text-muted block mb-1">
        {label}
      </span>
      <select
        aria-label={`Select ${label.toLowerCase()}`}
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className={`w-full bg-surface-light border border-border rounded-md px-3 py-2 text-sm text-text-tertiary font-mono appearance-none cursor-pointer hover:border-border-strong transition-colors focus:outline-none focus:border-burnt-orange/40 ${align === 'right' ? 'text-right' : ''}`}
      >
        <option value="" className="bg-background-secondary text-text-primary">
          Select {label.toLowerCase()}...
        </option>
        {players.map(p => (
          <option key={p.id} value={p.id} className="bg-background-secondary text-text-primary">
            {p.name} — {p.team}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player identity plate
// ---------------------------------------------------------------------------

function IdentityPlate({
  name,
  team,
  conference,
  position,
  color,
  align,
}: {
  name: string;
  team: string;
  conference?: string;
  position?: string;
  color: string;
  align: 'left' | 'right';
}) {
  return (
    <div className={`${align === 'right' ? 'text-right' : 'text-left'} mb-4`}>
      <h3
        className="font-display text-lg md:text-xl font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {name}
      </h3>
      <div className="flex items-center gap-2 mt-0.5" style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <span className="text-xs text-text-secondary">{team}</span>
        {conference && (
          <span className="text-[10px] text-text-muted">({conference})</span>
        )}
        {position && position !== 'UN' && (
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: withAlpha(color, 0.1), color }}
          >
            {position}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyHalf({ label, align }: { label: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center py-12 ${align === 'right' ? 'md:border-l md:border-border-subtle' : ''}`}>
      <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-text-muted">
          <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <span className="text-[11px] text-text-muted font-mono">Select a {label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MatchupTheater({
  batter,
  pitcher,
  batters,
  pitchers,
  onSelectBatter,
  onSelectPitcher,
  className = '',
}: MatchupTheaterProps) {
  const [focusSide, setFocusSide] = useState<'batter' | 'pitcher' | null>(null);

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="px-5 pt-5 pb-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm uppercase tracking-widest text-text-secondary">
            Matchup Theater
          </h3>
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
            Batter vs Pitcher
          </span>
        </div>

        {/* Selectors — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PlayerSelector
            players={batters}
            selected={batter?.player_id ?? ''}
            onSelect={onSelectBatter}
            label="Batter"
            align="left"
          />
          <PlayerSelector
            players={pitchers}
            selected={pitcher?.player_id ?? ''}
            onSelect={onSelectPitcher}
            label="Pitcher"
            align="right"
          />
        </div>
      </div>

      {/* Main theater — split screen */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px]">
        {/* Batter side */}
        <div
          className={`p-5 transition-opacity duration-300 ${focusSide === 'pitcher' ? 'opacity-40' : ''}`}
          onMouseEnter={() => setFocusSide('batter')}
          onMouseLeave={() => setFocusSide(null)}
        >
          {batter ? (
            <>
              <IdentityPlate
                name={batter.player_name}
                team={batter.team}
                conference={batter.conference}
                position={batter.position}
                color={BATTER_COLOR}
                align="left"
              />

              {/* Summary stat chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {batter.stats.pa != null && (
                  <span className="text-[10px] font-mono text-text-muted bg-surface-light px-2 py-0.5 rounded">
                    {batter.stats.pa} PA
                  </span>
                )}
                {batter.stats.hr != null && (
                  <span className="text-[10px] font-mono text-text-muted bg-surface-light px-2 py-0.5 rounded">
                    {batter.stats.hr} HR
                  </span>
                )}
              </div>

              {/* Stat bars */}
              <div className="space-y-2">
                {BATTER_STATS.map((def, i) => {
                  const val = batter.stats[def.key as keyof typeof batter.stats];
                  if (val == null || !Number.isFinite(val)) return null;
                  return (
                    <StatBar
                      key={def.key}
                      def={def}
                      value={val}
                      color={BATTER_COLOR}
                      align="left"
                      delay={i * 0.04}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyHalf label="batter" align="left" />
          )}
        </div>

        {/* Divider line (desktop) */}
        <div
          className={`hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border-subtle`}
          style={{ position: 'relative', width: 0 }}
        />

        {/* Pitcher side — mirrored layout */}
        <div
          className={`p-5 border-t md:border-t-0 md:border-l border-border-subtle transition-opacity duration-300 ${focusSide === 'batter' ? 'opacity-40' : ''}`}
          onMouseEnter={() => setFocusSide('pitcher')}
          onMouseLeave={() => setFocusSide(null)}
        >
          {pitcher ? (
            <>
              <IdentityPlate
                name={pitcher.player_name}
                team={pitcher.team}
                conference={pitcher.conference}
                position={pitcher.position ?? 'P'}
                color={PITCHER_COLOR}
                align="right"
              />

              {/* Summary stat chips */}
              <div className="flex flex-wrap gap-2 mb-4 justify-end">
                {pitcher.stats.ip != null && (
                  <span className="text-[10px] font-mono text-text-muted bg-surface-light px-2 py-0.5 rounded">
                    {pitcher.stats.ip.toFixed(1)} IP
                  </span>
                )}
              </div>

              {/* Stat bars — mirrored (right-aligned) */}
              <div className="space-y-2">
                {PITCHER_STATS.map((def, i) => {
                  const val = pitcher.stats[def.key as keyof typeof pitcher.stats];
                  if (val == null || !Number.isFinite(val)) return null;
                  return (
                    <StatBar
                      key={def.key}
                      def={def}
                      value={val}
                      color={PITCHER_COLOR}
                      align="right"
                      delay={i * 0.04}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyHalf label="pitcher" align="right" />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border-subtle text-center">
        <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
          {batter && pitcher ? (
            `${batter.player_name} vs ${pitcher.player_name}`
          ) : (
            'Select both players to compare'
          )}
        </span>
      </div>
    </div>
  );
}
