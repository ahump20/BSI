'use client';

import { Command, Info } from 'lucide-react';
import { Badge, FreshnessBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChicagoClock } from '@/lib/intel/hooks';
import {
  type IntelMode,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
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
  fetchedAt?: string;
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
  fetchedAt,
}: IntelHeaderProps) {
  const { time, date } = useChicagoClock();

  return (
    <header className="mb-4">
      {/* Top row: logo + title + clock */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center border border-border"
            style={{
              background: 'linear-gradient(135deg, var(--bsi-intel-accent, var(--bsi-primary, #BF5700)), var(--bsi-ember, #FF6B35))',
              borderRadius: '2px',
            }}
          >
            <span
              className="text-[11px] font-bold tracking-widest text-white"
              style={{ fontFamily: 'var(--intel-mono)' }}
            >
              BSI
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="intel-masthead text-xl md:text-[2.25rem]">
                Intel Briefing
              </h1>
              <FreshnessBadge isLive={liveCount > 0} fetchedAt={fetchedAt} />
              {liveCount > 0 && (
                <Badge variant="success" className="text-[10px]">
                  {liveCount} Live
                </Badge>
              )}
            </div>
            <p className="intel-caption mt-0.5">
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
              className="gap-2 text-[11px]"
              style={{ fontFamily: 'var(--intel-mono)' }}
            >
              <Command className="h-4 w-4" />
              <span className="hidden lg:inline">⌘K</span>
            </Button>
          </Tooltip>

          {/* Clock */}
          <div className="text-right hidden sm:block">
            <div
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--intel-mono)', color: 'var(--bsi-intel-accent, var(--bsi-primary, #BF5700))' }}
            >
              {time}
            </div>
            <div className="intel-caption">
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
          accentColor="var(--bsi-intel-accent, var(--bsi-cyan, #06B6D4))"
        />

        <Tooltip content={MODE_DESCRIPTIONS[mode]} side="bottom">
          <span className="inline-flex items-center gap-1 text-text-muted">
            <Info className="h-3.5 w-3.5" />
            <span className="intel-caption">{MODE_LABELS[mode]}</span>
          </span>
        </Tooltip>

        {/* Team lens dropdown */}
        {teamLens ? (
          <button
            onClick={() => onTeamLensChange(null)}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] transition-colors hover:border-border-strong"
            style={{
              fontFamily: 'var(--intel-mono)',
              borderRadius: '2px',
              border: `1px solid color-mix(in srgb, var(--bsi-intel-accent, var(--bsi-ember, #FF6B35)) 30%, transparent)`,
              background: 'color-mix(in srgb, var(--bsi-intel-accent, var(--bsi-ember, #FF6B35)) 10%, transparent)',
              color: 'var(--bsi-intel-accent, var(--bsi-ember, #FF6B35))',
            }}
          >
            Lens: {teamLens} ✕
          </button>
        ) : allTeams.length > 0 ? (
          <select
            value=""
            onChange={(e) => e.target.value && onTeamLensChange(e.target.value)}
            className="h-8 border border-border bg-surface-light px-2 text-[11px] text-text-secondary outline-none focus:border-border-strong"
            style={{ fontFamily: 'var(--intel-mono)', borderRadius: '2px' }}
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
