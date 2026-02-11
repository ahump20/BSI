'use client';

import { Flame, Pin, PinOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
      className="rounded-xl border p-3 mb-6"
      style={{
        borderColor: 'color-mix(in srgb, var(--bsi-ember, #FF6B35) 20%, transparent)',
        background: 'color-mix(in srgb, var(--bsi-ember, #FF6B35) 5%, transparent)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4" style={{ color: 'var(--bsi-ember, #FF6B35)' }} />
          <span className="font-mono text-[12px] text-white">Priority signals</span>
          <Badge variant="warning" className="text-[10px] font-mono">
            {signals.length}
          </Badge>
        </div>
        <span className="hidden md:block font-mono text-[11px] text-white/30">
          Click to pin
        </span>
      </div>

      {/* Signal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <AnimatePresence mode="popLayout">
          {signals.map((s, i) => {
            const accent = SPORT_ACCENT[s.sport];
            const pinState = isPinned(s.id);
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, delay: i * 0.04, ease: 'easeOut' }}
                layout
                onClick={() => onTogglePin(s.id)}
                className="group rounded-lg border bg-white/[0.03] p-3 text-left transition-all hover:bg-white/[0.06]"
                style={{ borderColor: `color-mix(in srgb, ${accent} 20%, transparent)` }}
              >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{
                      color: accent,
                      background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
                    }}
                  >
                    {s.sport.toUpperCase()}
                  </span>
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: PRIORITY_ACCENT[s.priority] }}
                  >
                    {s.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] text-white/30">{s.timestamp}</span>
                  <span className="opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: pinState ? 'var(--bsi-ember, #FF6B35)' : 'white' }}>
                    {pinState ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </span>
                </div>
              </div>
              <p className="text-[12px] leading-snug text-white/70">{s.text}</p>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
