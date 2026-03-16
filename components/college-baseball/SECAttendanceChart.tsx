'use client';

import { ScrollReveal } from '@/components/cinematic';

const SEC_ATTENDANCE_2025 = [
  { team: 'LSU', attendance: 387000, color: '#461D7C' },
  { team: 'Arkansas', attendance: 357000, color: '#9D2235' },
  { team: 'Mississippi St', attendance: 330000, color: '#660000' },
  { team: 'Ole Miss', attendance: 309000, color: '#CE1126' },
  { team: 'South Carolina', attendance: 251000, color: '#73000A' },
  { team: 'Texas', attendance: 220000, color: '#BF5700' },
  { team: 'Florida', attendance: 214000, color: '#0021A5' },
  { team: 'Tennessee', attendance: 211000, color: '#FF8200' },
  { team: 'Texas A&M', attendance: 207000, color: '#500000' },
];

const MAX = SEC_ATTENDANCE_2025[0].attendance;

function formatK(n: number): string {
  return `${(n / 1000).toFixed(0)}K`;
}

export function SECAttendanceChart() {
  return (
    <div
      className="heritage-card p-6 sm:p-8"
      style={{ borderTop: '2px solid var(--bsi-primary)' }}
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="heritage-stamp">SEC Dominance</span>
      </div>
      <h3
        className="font-bold uppercase tracking-wide mb-1"
        style={{
          fontFamily: 'var(--bsi-font-display)',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          color: 'var(--bsi-bone)',
        }}
      >
        2025 Regular Season Attendance
      </h3>
      <p className="text-xs mb-6" style={{ color: 'var(--bsi-dust)' }}>
        9 of the top 10 national attendance spots belong to the SEC.
      </p>

      <div className="space-y-3">
        {SEC_ATTENDANCE_2025.map((row, i) => (
          <ScrollReveal key={row.team} direction="up" delay={i * 40}>
            <div className="flex items-center gap-3">
              <span
                className="w-28 sm:w-32 text-right text-xs font-semibold truncate shrink-0"
                style={{
                  fontFamily: 'var(--bsi-font-display)',
                  color: 'var(--bsi-bone)',
                }}
              >
                {row.team}
              </span>
              <div className="flex-1 h-6 relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700"
                  style={{
                    width: `${(row.attendance / MAX) * 100}%`,
                    background: `linear-gradient(90deg, var(--bsi-primary) 0%, ${row.color} 100%)`,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span
                className="w-12 text-right text-xs font-bold shrink-0"
                style={{
                  fontFamily: 'var(--bsi-font-data)',
                  color: 'var(--bsi-primary)',
                }}
              >
                {formatK(row.attendance)}
              </span>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <div className="mt-6 pt-4 flex items-center justify-between text-[9px] uppercase tracking-widest" style={{ borderTop: '1px solid rgba(140,98,57,0.15)', color: 'var(--bsi-dust)', opacity: 0.6 }}>
        <span>Source: NCAA, 2025 Regular Season</span>
        <span>Total attendance figures</span>
      </div>
    </div>
  );
}
