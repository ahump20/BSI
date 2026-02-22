'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

interface Article {
  title: string;
  excerpt: string;
  href: string;
  tag: string;
}

const featured: Article[] = [
  {
    title: 'Texas vs. UC Davis: 2026 Season Opener',
    excerpt:
      'Complete box score, pitch-by-pitch breakdown, and what the first lineup card tells us about the Longhorns\u2019 direction this season.',
    href: '/college-baseball/editorial/texas-uc-davis-opener-2026',
    tag: 'Game Recap',
  },
  {
    title: 'Week 1 Recap: Three Grand Slams. One Record Book.',
    excerpt:
      'Opening weekend delivered chaos across the SEC, Big 12, and ACC. The numbers behind the biggest storylines from Week 1.',
    href: '/college-baseball/editorial/week-1-recap',
    tag: 'Weekly Recap',
  },
];

/**
 * EditorialPreview — featured article cards proving BSI produces real coverage.
 * Hardcoded links until a CMS or content API exists.
 */
export function EditorialPreview() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal direction="up">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#BF5700] mb-4">
            From the Press Box
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white uppercase tracking-wide mb-10">
            Editorial
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featured.map((article, i) => (
            <ScrollReveal key={article.href} direction="up" delay={i * 120}>
              <Link href={article.href} className="group block h-full">
                <article className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 transition-all duration-300 hover:border-[#BF5700]/40 hover:bg-white/[0.05]">
                  <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#BF5700]/15 text-[#BF5700] mb-4">
                    {article.tag}
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-white leading-snug mb-3 group-hover:text-[#BF5700] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-4">
                    {article.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#BF5700] group-hover:gap-2.5 transition-all">
                    Read
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </article>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
