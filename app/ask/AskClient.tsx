'use client';

import { useSearchParams } from 'next/navigation';
import { AskBSI } from '@/components/home/AskBSI';
import { ScrollReveal } from '@/components/cinematic';

export default function AskClient() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get('q') || undefined;

  return (
    <>
      <div className="min-h-screen bg-midnight">
        {/* Hero */}
        <section className="pt-8 pb-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal>
              <span className="heritage-stamp mb-4 inline-block">Cross-Sport Concierge</span>
              <h1
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wider mt-4 text-bsi-bone"
              >
                Ask BSI
              </h1>
              <p
                className="mt-4 text-sm md:text-base max-w-xl mx-auto font-serif leading-relaxed text-bsi-dust"
              >
                Scores, standings, player stats, team intel, advanced metrics — across college
                baseball, MLB, NFL, and NBA. Ask a question and get a real answer backed by
                live data.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Ask component */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal delay={0.1}>
              <AskBSI initialQuestion={initialQuestion} />
            </ScrollReveal>
          </div>
        </section>

        {/* Context strip */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal delay={0.15}>
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
              >
                {[
                  { label: 'College Baseball', desc: 'Savant metrics, standings, scores' },
                  { label: 'MLB', desc: 'Live scores, team stats, news' },
                  { label: 'NFL', desc: 'Standings, schedules, analysis' },
                  { label: 'NBA', desc: 'Scores, playoffs, team intel' },
                ].map((sport) => (
                  <div
                    key={sport.label}
                    className="heritage-card p-4"
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-wider text-bsi-primary font-mono"
                    >
                      {sport.label}
                    </p>
                    <p
                      className="mt-1 text-[11px] leading-relaxed font-serif text-bsi-dust"
                    >
                      {sport.desc}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

      </div>
    </>
  );
}
