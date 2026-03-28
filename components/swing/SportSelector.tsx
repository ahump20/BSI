'use client';

import { motion } from 'framer-motion';
import type { SwingSport } from '@/lib/swing/sport-models';

interface SportSelectorProps {
  selected: SwingSport | null;
  onSelect: (sport: SwingSport) => void;
}

const SPORTS: { key: SwingSport; label: string; desc: string; icon: string }[] = [
  {
    key: 'baseball',
    label: 'Baseball',
    desc: 'Rotational mechanics, launch angle emphasis',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15.5c-1 1-2.5 1-3.5 0s-1-2.5 0-3.5m11 0c1 1 1 2.5 0 3.5s-2.5 1-3.5 0',
  },
  {
    key: 'fastpitch',
    label: 'Fast-Pitch Softball',
    desc: 'Compact swing path, shorter reaction window',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4l3 3-3 3-3-3 3-3z',
  },
  {
    key: 'slowpitch',
    label: 'Slow-Pitch Softball',
    desc: 'Uppercut plane, USSSA/ASA arc timing',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7 12l5 5 5-5',
  },
];

export function SportSelector({ selected, onSelect }: SportSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {SPORTS.map((sport) => {
        const isSelected = selected === sport.key;
        return (
          <button
            key={sport.key}
            onClick={() => onSelect(sport.key)}
            className={`relative overflow-hidden rounded-sm border-2 p-6 text-left transition-all duration-300 cursor-pointer ${
              isSelected
                ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)]/10 shadow-[0_0_30px_rgba(191,87,0,0.15)]'
                : 'border-[var(--border-vintage)] bg-surface-dugout hover:border-[var(--bsi-primary)]/40 hover:bg-surface-dugout/80'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="sport-selected"
                className="absolute inset-0 rounded-sm border-2 border-[var(--bsi-primary)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-sm flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[var(--bsi-primary)]/20'
                      : 'bg-white/[0.04]'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-5 h-5 transition-colors ${
                      isSelected ? 'text-[var(--bsi-primary)]' : 'text-bsi-dust'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={sport.icon} />
                  </svg>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-[var(--bsi-primary)] flex items-center justify-center"
                  >
                    <svg viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 8l3 3 7-7" />
                    </svg>
                  </motion.div>
                )}
              </div>

              <h3
                className={`font-display text-lg font-bold uppercase tracking-wide mb-1 transition-colors ${
                  isSelected ? 'text-bsi-bone' : 'text-bsi-dust'
                }`}
              >
                {sport.label}
              </h3>
              <p className="text-xs text-[rgba(196,184,165,0.35)] leading-relaxed">{sport.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
