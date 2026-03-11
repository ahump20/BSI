'use client';

import { ScrollReveal } from '@/components/cinematic';

const differentiators = [
  {
    label: 'The Gap',
    body: 'Tuesday night college baseball between Rice and Sam Houston. Mid-major programs that move futures without ever making the national broadcast. That coverage exists here and nowhere else.',
  },
  {
    label: 'The Data',
    body: 'Park-adjusted sabermetrics — wOBA, wRC+, FIP, ERA-minus — computed every six hours from live game data and available free to every visitor.',
  },
  {
    label: 'The Scope',
    body: 'Five sports, 300+ programs, one platform. MLB, NFL, NBA, NCAA football, and college baseball under a single roof — with the same analytical depth across all of them.',
  },
];

export function WhyBSI() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal direction="up">
          <div
            className="heritage-card p-6 sm:p-8 space-y-5"
            style={{ borderLeft: '3px solid var(--bsi-primary)' }}
          >
            {differentiators.map((item) => (
              <div
                key={item.label}
                className="border-l-2 pl-4"
                style={{ borderColor: 'var(--bsi-primary)' }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-ui)' }}
                >
                  {item.label}
                </p>
                <p
                  className="font-serif text-base leading-relaxed"
                  style={{ color: 'var(--bsi-bone)' }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
