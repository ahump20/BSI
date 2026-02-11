'use client';

import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { IntelSport } from '@/lib/intel/types';
import { SPORT_LABELS, SPORT_ACCENT } from '@/lib/intel/types';

interface SportFilterProps {
    value: IntelSport;
    onChange: (sport: IntelSport) => void;
    className?: string;
}

const SPORTS: IntelSport[] = ['all', 'nfl', 'nba', 'mlb', 'ncaafb', 'cbb', 'd1bb'];

export function SportFilter({ value, onChange, className }: SportFilterProps) {
    return (
      <div className={clsx('flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 mb-6', className)}>
        {SPORTS.map((s) => {
            const active = value === s;
            return (
              <motion.button
                key={s}
                onClick={() => onChange(s)}
                layout
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  'relative shrink-0 border-b-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors',
                  active
                    ? 'border-current'
                    : 'border-transparent text-white/40 hover:text-white/60',
                )}
                style={{
                  fontFamily: 'var(--intel-display)',
                  fontWeight: active ? 600 : 400,
                  color: active
                    ? `var(--bsi-intel-accent, ${SPORT_ACCENT[s]})`
                    : undefined,
                }}
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="sport-filter-indicator"
                      className="absolute inset-x-0 -bottom-[2px] h-[2px]"
                      style={{
                        background: `var(--bsi-intel-accent, ${SPORT_ACCENT[s]})`,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
                <span className="relative z-10">{SPORT_LABELS[s]}</span>
              </motion.button>
            );
        })}
      </div>
    );
}
