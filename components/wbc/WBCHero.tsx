'use client';

import { useState, useEffect } from 'react';

const TOURNAMENT_START = new Date('2026-03-05T10:00:00-05:00'); // Pool C Tokyo, EST
const TOURNAMENT_END = new Date('2026-03-17T20:00:00-05:00');

type Phase = 'pre' | 'pool' | 'knockout' | 'final' | 'complete';

function getTournamentPhase(now: Date): Phase {
  const poolEnd = new Date('2026-03-11T23:59:59-05:00');
  const knockoutEnd = new Date('2026-03-16T23:59:59-05:00');

  if (now < TOURNAMENT_START) return 'pre';
  if (now <= poolEnd) return 'pool';
  if (now <= knockoutEnd) return 'knockout';
  if (now <= TOURNAMENT_END) return 'final';
  return 'complete';
}

const PHASE_LABELS: Record<Phase, string> = {
  pre: 'Pre-Tournament',
  pool: 'Pool Play Active',
  knockout: 'Knockout Stage',
  final: 'Championship Round',
  complete: 'Tournament Complete',
};

const PHASE_COLORS: Record<Phase, string> = {
  pre: 'text-text-tertiary',
  pool: 'text-[var(--bsi-primary)]',
  knockout: 'text-ember',
  final: 'text-burnt-orange',
  complete: 'text-text-secondary',
};

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(target: Date): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    function calculate() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return null;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { days, hours, minutes, seconds };
    }

    setCountdown(calculate());
    const timer = setInterval(() => setCountdown(calculate()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return countdown;
}

export function WBCHero() {
  const [phase, setPhase] = useState<Phase>('pre');
  const countdown = useCountdown(TOURNAMENT_START);

  useEffect(() => {
    setPhase(getTournamentPhase(new Date()));
    const timer = setInterval(() => setPhase(getTournamentPhase(new Date())), 60000);
    return () => clearInterval(timer);
  }, []);

  const isLive = phase === 'pool' || phase === 'knockout' || phase === 'final';

  return (
    <section className="relative overflow-hidden bg-midnight pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/8 via-transparent to-ember/4 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-burnt-orange/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center">
          {/* Phase badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            {isLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--bsi-primary)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--bsi-primary)]" />
              </span>
            )}
            <span className={`text-sm font-semibold tracking-wider uppercase ${PHASE_COLORS[phase]}`}>
              {PHASE_LABELS[phase]}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-display text-text-primary mb-4">
            World Baseball
            <br />
            <span className="text-gradient-blaze">Classic 2026</span>
          </h1>

          {/* Subtitle */}
          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            March 5–17 &middot; 20 Nations &middot; Four Pools &middot; One Title
          </p>

          {/* Countdown (pre-tournament only) */}
          {phase === 'pre' && countdown && (
            <div className="flex justify-center gap-4 sm:gap-8 mb-10">
              {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
                <div key={unit} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-text-primary font-mono tabular-nums">
                    {String(countdown[unit]).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mt-1">
                    {unit}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stat chips */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
            {[
              { value: '20', label: 'Nations' },
              { value: '47', label: 'Games' },
              { value: '$20M', label: 'Prize Pool' },
              { value: 'Miami', label: 'Final Venue' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-2xl font-bold text-burnt-orange">{stat.value}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
