'use client';

import { ScrollReveal } from '@/components/cinematic';

export function WhyBSI() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal direction="up">
          <div
            className="heritage-card p-6 sm:p-8"
            style={{ borderLeft: '3px solid var(--bsi-primary)' }}
          >
            <p
              className="font-serif text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--bsi-bone)' }}
            >
              Five sports. One standard. BSI delivers the analytics that mainstream platforms
              reserve for big-market teams &mdash; to every program, every conference, every fan.
              College baseball is the proving ground. Every stat is free.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
