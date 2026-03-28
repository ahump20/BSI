'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { FilterPill } from '@/components/ui/FilterPill';
import { Footer } from '@/components/layout-ds/Footer';
import { GLOSSARY_TERMS, getGlossaryLetters, type GlossaryTerm } from '@/lib/data/glossary-terms';

type CategoryFilter = 'all' | 'baseball' | 'football' | 'basketball' | 'general';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  baseball: 'Baseball',
  football: 'Football',
  basketball: 'Basketball',
  general: 'General',
};

function TermCard({ term }: { term: GlossaryTerm }) {
  return (
    <div className="border-l-2 border-[var(--bsi-primary)]/15 pl-5 sm:pl-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
          {term.term}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {term.sport.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[var(--bsi-primary)]/70"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[rgba(196,184,165,0.35)]/60 block mb-1">Definition</span>
          <p className="text-[rgba(196,184,165,0.5)] leading-relaxed">{term.mlbDefinition}</p>
          <p className="text-[rgba(196,184,165,0.35)]/50 text-[11px] font-mono mt-1">{term.mlbSource}</p>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[rgba(196,184,165,0.35)]/60 block mb-1">NCAA Equivalent</span>
          <p className="text-[rgba(196,184,165,0.5)] leading-relaxed">{term.ncaaEquivalent}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[rgba(196,184,165,0.35)]/60 block mb-1">Available Data</span>
            <p className="text-[rgba(196,184,165,0.35)] leading-relaxed text-xs">{term.availableData}</p>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[rgba(196,184,165,0.35)]/60 block mb-1">Limitations</span>
            <p className="text-[rgba(196,184,165,0.35)] leading-relaxed text-xs">{term.limitations}</p>
          </div>
        </div>

        {term.bsiLink && (
          <div className="pt-2 border-t border-white/[0.04]">
            <Link
              href={term.bsiLink}
              className="text-xs text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] font-mono transition-colors"
            >
              {term.bsiLinkLabel || 'Related BSI Model'} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GlossaryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const letters = getGlossaryLetters();

  const filtered = GLOSSARY_TERMS.filter((term) => {
    const matchesSearch = search === '' || term.term.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || term.category === category;
    return matchesSearch && matchesCategory;
  });

  // Group filtered terms by letter
  const grouped = new Map<string, GlossaryTerm[]>();
  for (const term of filtered) {
    const letter = term.term[0].toUpperCase();
    const existing = grouped.get(letter) || [];
    existing.push(term);
    grouped.set(letter, existing);
  }
  const sortedLetters = Array.from(grouped.keys()).sort();

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Glossary' }]} />
          </Container>
        </Section>

        <Section padding="lg" className="relative overflow-hidden">
          <Container>
            <div className="max-w-3xl mb-8 relative">
              <span className="heritage-stamp block mb-4">Reference</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mb-3">
                Analytics Glossary
              </h1>
              <p className="text-[var(--bsi-primary)] font-serif italic text-lg leading-relaxed">
                Pro-level metrics mapped to college equivalents. What each stat measures, what
                data exists, and where the gaps are.
              </p>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search terms..."
                className="flex-1 min-w-0 bg-[var(--surface-press-box)] border border-border rounded-sm px-4 py-2.5 text-sm text-[var(--bsi-bone)] placeholder:text-[rgba(196,184,165,0.35)] focus:outline-none focus:border-[var(--bsi-primary)]/50 transition-colors"
              />
              <div className="flex gap-1.5 overflow-x-auto">
                {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => (
                  <FilterPill
                    key={cat}
                    active={category === cat}
                    onClick={() => setCategory(cat)}
                    size="sm"
                    className="shrink-0 py-2"
                  >
                    {CATEGORY_LABELS[cat]}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* Alphabetical navigation */}
            <div className="flex flex-wrap gap-1.5 mb-8">
              {letters.map((letter) => {
                const hasResults = grouped.has(letter);
                return (
                  <a
                    key={letter}
                    href={hasResults ? `#letter-${letter}` : undefined}
                    className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-mono font-bold border transition-all ${
                      hasResults
                        ? 'text-[rgba(196,184,165,0.5)] border-white/[0.06] hover:text-[var(--bsi-primary)] hover:border-[var(--bsi-primary)]/30 hover:bg-[var(--bsi-primary)]/10'
                        : 'text-[rgba(196,184,165,0.35)]/30 border-transparent cursor-default'
                    }`}
                  >
                    {letter}
                  </a>
                );
              })}
            </div>

            {/* Terms */}
            {sortedLetters.map((letter) => (
              <div key={letter} id={`letter-${letter}`} className="mb-10">
                <h2 className="font-display text-2xl font-bold text-[var(--bsi-primary)]/30 uppercase mb-4 sticky top-0 py-2 z-10 backdrop-blur-sm" style={{ background: 'linear-gradient(to bottom, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.7) 100%)' }}>
                  {letter}
                </h2>
                <div className="space-y-4">
                  {grouped.get(letter)!.map((term) => (
                    <TermCard key={term.term} term={term} />
                  ))}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[rgba(196,184,165,0.35)] text-sm">No terms match your search.</p>
                <button
                  onClick={() => { setSearch(''); setCategory('all'); }}
                  className="mt-4 text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] text-sm font-semibold transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Footer links */}
            <div className="mt-12 pt-6 border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/models" className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                  Models & Methodology
                </Link>
                <Link href="/models/data-quality" className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                  Data Quality
                </Link>
                <Link href="/college-baseball/savant" className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                  BSI Savant
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
