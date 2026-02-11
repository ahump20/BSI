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
          <div className={clsx('flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-6', className)}>
            {SPORTS.map((s) => {
                    const active = value === s;
                    return (
                                <motion.button
                                              key={s}
                                              onClick={() => onChange(s)}
                                              layout
                                              whileTap={{ scale: 0.95 }}
                                              className={clsx(
                                                              'relative shrink-0 rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors',
                                                              active
                                                                ? 'shadow-sm'
                                                                : 'border-transparent text-white/40 hover:text-white/70',
                                                            )}
                                              style={
                                                              active
                                                                ? {
                                                                                      color: `var(--bsi-intel-accent, ${SPORT_ACCENT[s]})`,
                                                                                      borderColor: `color-mix(in srgb, var(--bsi-intel-accent, ${SPORT_ACCENT[s]}) 30%, transparent)`,
                                                                                      background: `color-mix(in srgb, var(--bsi-intel-accent, ${SPORT_ACCENT[s]}) 10%, transparent)`,
                                                                }
                                                                : undefined
                                              }
                                            >
                                            <AnimatePresence>
                                              {active && (
                                                              <motion.span
                                                                                  layoutId="sport-filter-indicator"
                                                                                  className="absolute inset-0 rounded-lg"
                                                                                  style={{
                                                                                                        borderColor: `color-mix(in srgb, var(--bsi-intel-accent, ${SPORT_ACCENT[s]}) 30%, transparent)`,
                                                                                                        background: `color-mix(in srgb, var(--bsi-intel-accent, ${SPORT_ACCENT[s]}) 10%, transparent)`,
                                                                                    }}
                                                                                  initial={{ opacity: 0 }}
                                                                                  animate={{ opacity: 1 }}
                                                                                  exit={{ opacity: 0 }}
                                                                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                                />
                                                            )}
                                            </AnimatePresence>AnimatePresence>
                                            <span className="relative z-10">{SPORT_LABELS[s]}</span>span>
                                </motion.button>motion.button>
                              );
          })}
          </div>div>
        );
}</motion.button>
