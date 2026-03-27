'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

const STARTER_PROMPTS = [
  "Who's leading the SEC in batting?",
  'When does Texas play next?',
  'Top pitchers by FIP',
  'Best wRC+ in the ACC this week',
  'Conference strength rankings',
];

export function HomeAskSection(): React.JSX.Element {
  const [input, setInput] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    router.push(`/ask?q=${encodeURIComponent(trimmed)}`);
  };

  const handlePromptClick = (prompt: string): void => {
    router.push(`/ask?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <section
      data-home-ask-section
      className="relative border-b border-[rgba(245,240,235,0.06)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      style={{
        background:
          'linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(16,16,16,1) 50%, rgba(12,12,12,1) 100%)',
      }}
    >
      {/* Subtle glow accent */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-48 sm:w-72"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(191, 87, 0, 0.4), transparent)',
        }}
      />

      <div className="mx-auto max-w-2xl text-center">
        <ScrollReveal direction="up">
          <span className="heritage-stamp mb-4 inline-block">AI Concierge</span>
          <h2
            className="font-display text-2xl font-bold uppercase tracking-wider sm:text-3xl md:text-4xl"
            style={{ color: 'var(--bsi-bone)' }}
          >
            Ask BSI Anything
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm font-serif leading-relaxed sm:text-base"
            style={{ color: 'var(--bsi-dust)' }}
          >
            Scores, standings, sabermetrics, rankings, schedules — ask a question
            and get a real answer backed by live data.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          {/* Input form */}
          <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Ask BSI a sports question"
              className="flex-1 px-4 py-3 text-sm transition-all focus:outline-none sm:text-base"
              style={{
                borderRadius: '2px',
                border: '1px solid var(--border-vintage)',
                borderBottom: '2px solid var(--bsi-primary)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--bsi-bone)',
                fontFamily: 'var(--bsi-font-body)',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn-heritage-fill shrink-0 px-5 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed sm:px-7"
            >
              Ask
            </button>
          </form>

          {/* Starter prompt chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="cursor-pointer text-[11px] px-3 py-1.5 transition-all duration-200 hover:border-[var(--bsi-primary)] hover:text-[var(--bsi-bone)]"
                style={{
                  borderRadius: '2px',
                  border: '1px solid var(--border-vintage)',
                  background: 'transparent',
                  color: 'var(--bsi-dust)',
                  fontFamily: 'var(--bsi-font-data)',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Link to full experience */}
          <p className="mt-6">
            <Link
              href="/ask"
              className="text-xs font-semibold uppercase tracking-widest transition-colors hover:text-[var(--bsi-bone)]"
              style={{ color: 'var(--heritage-columbia-blue)' }}
            >
              Open full concierge &rarr;
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
