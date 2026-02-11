'use client';

import { Command, Info } from 'lucide-react';
import Image from 'next/image';
import { Badge, LiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChicagoClock } from '@/lib/intel/hooks';
import {
  type IntelMode,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
  SPORT_ACCENT,
} from '@/lib/intel/types';

interface IntelHeaderProps {
  mode: IntelMode;
  onModeChange: (mode: IntelMode) => void;
  teamLens: string | null;
  onTeamLensChange: (team: string | null) => void;
  allTeams: string[];
  onOpenPalette: () => void;
  liveCount: number;
  briefingLine: string;
}

const MODE_OPTIONS: Array<{ value: IntelMode; label: string }> = [
  { value: 'coach', label: 'Coach' },
  { value: 'scout', label: 'Scout' },
  { value: 'fan', label: 'Fan' },
];

export function IntelHeader({
  mode,
  onModeChange,
  teamLens,
  onTeamLensChange,
  allTeams,
  onOpenPalette,
  liveCount,
  briefingLine,
}: IntelHeaderProps) {
  const { time, date } = useChicagoClock();

  return (
    <header className="mb-6">
      {/* Top row: logo + title + clock */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10"
            style={{ background: 'linear-gradient(135deg, var(--bsi-primary, #BF5700), var(--bsi-ember, #FF6B35))' }}
          >
            <span className="font-mono text-[11px] font-bold tracking-widest text-white">BSI</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-white">
                Intel Briefing
              </h1>
              <LiveBadge />
              {liveCount > 0 && (
                <Badge variant="success" className="text-[10px]">
                  {liveCount} Live
                </Badge>
              )}
            </div>
            <p className="font-mono text-[11px] text-white/40">
              {briefingLine}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Command palette trigger */}
          <Tooltip content="Command palette (⌘K)">
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenPalette}
              className="gap-2 font-mono text-[11px]"
            >
              <Command className="h-4 w-4" />
              <span className="hidden lg:inline">⌘K</span>
            </Button>
          </Tooltip>

          {/* Clock */}
          <div className="text-right hidden sm:block">
            <div className="font-mono text-sm font-semibold" style={{ color: 'var(--bsi-primary, #BF5700)' }}>
              {time}
            </div>
            <div className="font-mono text-[10px] text-white/40">
              {date} CST
            </div>
          </div>
        </div>
      </div>

      {/* Controls row: mode + team lens */}
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          value={mode}
          onValueChange={onModeChange}
          options={MODE_OPTIONS}
          accentColor="var(--bsi-cyan, #06B6D4)"
        />

        <Tooltip content={MODE_DESCRIPTIONS[mode]} side="bottom">
          <span className="inline-flex items-center gap-1 text-white/30">
            <Info className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px]">{MODE_LABELS[mode]}</span>
          </span>
        </Tooltip>

        {/* Team lens dropdown */}
        {teamLens ? (
          <button
            onClick={() => onTeamLensChange(null)}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors hover:border-white/30"
            style={{
              borderColor: 'color-mix(in srgb, var(--bsi-ember, #FF6B35) 30%, transparent)',
              background: 'color-mix(in srgb, var(--bsi-ember, #FF6B35) 10%, transparent)',
              color: 'var(--bsi-ember, #FF6B35)',
            }}
          >
            Lens: {teamLens} ✕
          </button>
        ) : allTeams.length > 0 ? (
          <select
            value=""
            onChange={(e) => e.target.value && onTeamLensChange(e.target.value)}
            className="h-8 rounded-md border border-white/10 bg-white/5 px-2 font-mono text-[11px] text-white/60 outline-none focus:border-white/30"
          >
            <option value="">Team lens...</option>
            {allTeams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        ) : null}
      </div>
    </header>
  );
}
