'use client';

import { Flame, Pin, PinOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { IntelSignal } from '@/lib/intel/types';
import { SPORT_ACCENT, PRIORITY_ACCENT } from '@/lib/intel/types';

interface PrioritySignalsProps {
  signals: IntelSignal[];
  isPinned: (id: string) => boolean;
  onTogglePin: (id: string) => void;
}

export function PrioritySignals({ signals, isPinned, onTogglePin }: PrioritySignalsProps) {
  if (signals.length === 0) return null;

  return (
    <div
      className="intel-panel p-3"
      style={{
        borderColor: 'color-mix(in srgb, var(--bsi-accent) 20%, transparent)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="intel-section-label">
          <Flame className="h-4 w-4" style={{ color: 'var(--bsi-accent)' }} />
          Priority Signals
          <Badge variant="warning" className="text-[10px]" style={{ fontFamily: 'var(--intel-mono)' }}>
            {signals.length}
          </Badge>
        </div>
        <span className="hidden md:block intel-caption">
          Click to pin
        </span>
      </div>

      <hr className="intel-rule mb-3" />

      {/* Signal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {signals.map((s) => {
          const accent = SPORT_ACCENT[s.sport];
          const pinState = isPinned(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onTogglePin(s.id)}
              className="group intel-panel-elevated p-3 text-left transition-all hover:bg-[var(--intel-bg-elevated)]"
              style={{ borderColor: `color-mix(in srgb, ${accent} 20%, transparent)` }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="intel-sport-tag"
                    style={{
                      color: accent,
                      background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
                    }}
                  >
                    {s.sport.toUpperCase()}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ fontFamily: 'var(--intel-mono)', color: PRIORITY_ACCENT[s.priority] }}
                  >
                    {s.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="intel-caption">{s.timestamp}</span>
                  <span className="opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: pinState ? 'var(--bsi-accent)' : 'white' }}>
                    {pinState ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </span>
                </div>
              </div>
              <p className="text-[12px] leading-snug" style={{ color: 'var(--intel-text-body)' }}>{s.text}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
