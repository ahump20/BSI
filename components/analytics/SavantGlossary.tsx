'use client';

import { useState } from 'react';
import { METRIC_DEFINITIONS } from '@/lib/data/metric-definitions';

// ---------------------------------------------------------------------------
// Glossary categories
// ---------------------------------------------------------------------------

interface GlossaryEntry {
  key: string;
  abbr: string;
  name: string;
  description: string;
  context?: string;
}

interface GlossaryCategory {
  label: string;
  entries: GlossaryEntry[];
}

const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  {
    label: 'Batting',
    entries: ['AVG', 'OBP', 'SLG', 'OPS', 'wOBA', 'wRC+', 'OPS+', 'ISO', 'BABIP', 'K%', 'BB%'].map(key => {
      const def = METRIC_DEFINITIONS[key];
      return def
        ? { key, abbr: def.abbr, name: def.name, description: def.description, context: def.context }
        : { key, abbr: key, name: key, description: 'Definition pending.' };
    }),
  },
  {
    label: 'Pitching',
    entries: ['ERA', 'WHIP', 'FIP', 'xFIP', 'ERA-', 'K/9', 'BB/9', 'HR/9', 'K/BB', 'LOB%'].map(key => {
      const def = METRIC_DEFINITIONS[key];
      return def
        ? { key, abbr: def.abbr, name: def.name, description: def.description, context: def.context }
        : { key, abbr: key, name: key, description: 'Definition pending.' };
    }),
  },
  {
    label: 'Conference & Context',
    entries: [
      {
        key: 'CSI',
        abbr: 'CSI',
        name: 'Conference Strength Index',
        description:
          'BSI\'s composite ranking of D1 conferences. Blends inter-conference record, RPI average, aggregate offensive output, and pitching quality into a single index.',
        context: 'Higher = stronger conference. P5 conferences typically rank 60+.',
      },
      {
        key: 'RunEnv',
        abbr: 'RunEnv',
        name: 'Run Environment',
        description:
          'Average runs scored per game within a conference. Higher run environments inflate raw stats — park-adjusted metrics correct for this.',
        context: 'D1 avg ~5.5 R/G. SEC and Big 12 trend higher.',
      },
      ...[
        'Park Factor',
        'RPI',
        'WAR',
      ].map(key => {
        const def = METRIC_DEFINITIONS[key];
        return def
          ? { key, abbr: def.abbr, name: def.name, description: def.description, context: def.context }
          : { key, abbr: key, name: key, description: 'Definition pending.' };
      }),
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavantGlossary({ className = '' }: { className?: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className={`space-y-8 ${className}`}>
      {GLOSSARY_CATEGORIES.map(category => (
        <div key={category.label}>
          {/* Category header */}
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-savant-display text-sm uppercase tracking-widest text-[var(--svt-accent,_#BF5700)] font-bold">
              {category.label}
            </h2>
            <div className="flex-1 h-px bg-[var(--svt-border,_rgba(255,255,255,0.06))]" />
          </div>

          {/* Entries */}
          <div className="space-y-2">
            {category.entries.map((entry, i) => {
              const isOpen = openKey === entry.key;

              return (
                <div
                  key={entry.key}
                  className="savant-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <button
                    onClick={() => setOpenKey(isOpen ? null : entry.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${
                      isOpen
                        ? 'bg-[var(--svt-surface,_rgba(255,255,255,0.04))] border border-[var(--svt-accent,_#BF5700)]/20'
                        : 'bg-[var(--svt-card,_rgba(26,26,26,0.6))] border border-[var(--svt-border,_rgba(255,255,255,0.04))] hover:border-[var(--svt-accent,_#BF5700)]/30'
                    }`}
                  >
                    {/* Abbreviation badge */}
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-sm shrink-0 ${
                        isOpen
                          ? 'bg-[var(--svt-accent,_#BF5700)] text-white'
                          : 'bg-[var(--svt-accent,_#BF5700)]/10 text-[var(--svt-accent,_#BF5700)]'
                      }`}
                    >
                      {entry.abbr}
                    </span>

                    {/* Name */}
                    <span className="text-sm text-[var(--svt-text,_#F5F0EB)] text-left flex-1">
                      {entry.name}
                    </span>

                    {/* Expand indicator */}
                    <span className={`text-[10px] text-[var(--svt-text-dim,_#737373)] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="px-4 py-3 ml-4 border-l-2 border-[var(--svt-accent,_#BF5700)]/20 mt-1 mb-2">
                      <p className="text-sm text-[var(--svt-text-muted,_#A89F95)] leading-relaxed">
                        {entry.description}
                      </p>
                      {entry.context && (
                        <p className="mt-2 text-[11px] font-mono text-[var(--svt-text-dim,_#737373)]">
                          {entry.context}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
