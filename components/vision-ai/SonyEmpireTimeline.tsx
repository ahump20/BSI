'use client';

/**
 * Visual timeline of Sony's computer vision acquisitions
 * and what each acquisition covers for sports analytics.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';

interface Acquisition {
  year: number;
  company: string;
  focus: string;
  detail: string;
  sports: string[];
  significance: string;
}

const ACQUISITIONS: Acquisition[] = [
  {
    year: 2011,
    company: 'Hawk-Eye Innovations',
    focus: 'Ball & Player Tracking',
    detail: 'Optical tracking pioneer — originally built for cricket LBW decisions. Now powers MLB Statcast, NBA, and tennis line-calling.',
    sports: ['MLB', 'NBA', 'Tennis', 'Cricket'],
    significance: 'Foundation of Sony\'s sports CV empire',
  },
  {
    year: 2020,
    company: 'Beyond Sports',
    focus: 'Real-Time 3D Visualization',
    detail: 'Converts tracking data into real-time 3D virtual worlds. Used for broadcast, coaching, and fan engagement.',
    sports: ['NFL', 'MLB', 'NBA'],
    significance: 'Bridges raw tracking to visual storytelling',
  },
  {
    year: 2021,
    company: 'Pulselive',
    focus: 'Digital Content Platform',
    detail: 'Powers digital platforms for ICC, Premier League, FIFA. Delivers tracking-enriched content to fan-facing surfaces.',
    sports: ['Soccer', 'Cricket'],
    significance: 'Distribution layer for Sony CV data',
  },
  {
    year: 2024,
    company: 'KinaTrax',
    focus: 'Biomechanical Motion Capture',
    detail: 'Markerless 3D motion capture measuring elbow torque, shoulder rotation, hip-shoulder separation. Installed at 7 NCAA programs and all 30 MLB parks.',
    sports: ['MLB', 'NCAA Baseball'],
    significance: 'Injury prediction + pitching analytics',
  },
  {
    year: 2025,
    company: 'STATSports',
    focus: 'Wearable Performance Monitoring',
    detail: 'GPS + IMU wearable platform used across 1,500+ teams globally. When combined with optical tracking, enables validated biomechanical load monitoring.',
    sports: ['NFL', 'NCAA Football', 'Soccer'],
    significance: 'Wearable + optical CV fusion',
  },
];

export function SonyEmpireTimeline({ className = '' }: { className?: string }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className={className}>
      {/* Timeline header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-burnt-orange animate-pulse" />
        <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
          2011 &mdash; Present
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-burnt-orange/30 to-transparent" />
      </div>

      {/* Timeline entries */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-burnt-orange/50 via-burnt-orange/20 to-transparent" />

        <div className="space-y-0">
          {ACQUISITIONS.map((acq, i) => {
            const isExpanded = expanded === i;
            const isLast = i === ACQUISITIONS.length - 1;

            return (
              <div key={acq.company} className="relative pl-12 pb-8">
                {/* Timeline node */}
                <div className="absolute left-0 top-0 flex flex-col items-center">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : i)}
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all border ${
                      isLast
                        ? 'bg-burnt-orange text-white border-burnt-orange shadow-[0_0_20px_rgba(191,87,0,0.4)]'
                        : isExpanded
                          ? 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/40'
                          : 'bg-graphite text-text-secondary border-border hover:border-burnt-orange/30 hover:text-burnt-orange'
                    }`}
                    aria-expanded={isExpanded}
                    aria-label={`${acq.year}: ${acq.company}`}
                  >
                    {String(acq.year).slice(2)}
                  </button>
                </div>

                {/* Content */}
                <div
                  className={`rounded-lg border transition-all cursor-pointer ${
                    isExpanded
                      ? 'bg-surface-light border-burnt-orange/20'
                      : 'bg-transparent border-transparent hover:bg-surface-light'
                  }`}
                  onClick={() => setExpanded(isExpanded ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpanded(isExpanded ? null : i);
                    }
                  }}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-burnt-orange font-mono text-sm font-bold">{acq.year}</span>
                      <span className="text-text-primary font-semibold text-sm">{acq.company}</span>
                      <Badge variant="primary" size="sm">{acq.focus}</Badge>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                        <p className="text-text-secondary text-sm leading-relaxed">{acq.detail}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                          {acq.sports.map((sport) => (
                            <span
                              key={sport}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-surface-light text-text-muted border border-border-subtle font-mono"
                            >
                              {sport}
                            </span>
                          ))}
                        </div>

                        <div className="bg-burnt-orange/5 border border-burnt-orange/10 rounded px-3 py-2">
                          <p className="text-burnt-orange/80 text-xs font-semibold">
                            {acq.significance}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary insight */}
      <div className="mt-4 bg-graphite rounded-lg p-4 border border-border-subtle">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-tertiary">Total acquisitions</span>
          <span className="text-text-primary font-mono">{ACQUISITIONS.length}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-tertiary">Span</span>
          <span className="text-text-primary font-mono">{ACQUISITIONS[ACQUISITIONS.length - 1].year - ACQUISITIONS[0].year} years</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-tertiary">Sports covered</span>
          <span className="text-text-primary font-mono">7+</span>
        </div>
        <p className="text-text-muted text-xs mt-3 pt-3 border-t border-border-subtle">
          Sony now owns the full stack: data capture (Hawk-Eye), biomechanics (KinaTrax),
          wearable fusion (STATSports), visualization (Beyond Sports), and distribution (Pulselive).
        </p>
      </div>
    </div>
  );
}
