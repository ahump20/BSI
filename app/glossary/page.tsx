'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { FilterPill } from '@/components/ui/FilterPill';
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
    <div className="border-l-2 pl-5 sm:pl-6 py-4" style={{ borderColor: 'rgba(191,87,0,0.15)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3
          className="text-lg font-bold uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
        >
          {term.term}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {term.sport.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)', color: 'rgba(191,87,0,0.7)' }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <span
            className="text-[10px] uppercase tracking-[0.15em] block mb-1 font-mono text-bsi-dust/35"
          >Definition</span>
          <p className="leading-relaxed text-bsi-dust/50">{term.mlbDefinition}</p>
          <p className="text-[11px] mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(196,184,165,0.25)' }}>{term.mlbSource}</p>
        </div>

        <div>
          <span
            className="text-[10px] uppercase tracking-[0.15em] block mb-1 font-mono text-bsi-dust/35"
          >NCAA Equivalent</span>
          <p className="leading-relaxed text-bsi-dust/50">{term.ncaaEquivalent}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span
              className="text-[10px] uppercase tracking-[0.15em] block mb-1 font-mono text-bsi-dust/35"
            >Available Data</span>
            <p className="leading-relaxed text-xs text-bsi-dust/35">{term.availableData}</p>
          </div>
          <div>
            <span
              className="text-[10px] uppercase tracking-[0.15em] block mb-1 font-mono text-bsi-dust/35"
            >Limitations</span>
            <p className="leading-relaxed text-xs text-bsi-dust/35">{term.limitations}</p>
          </div>
        </div>

        {term.bsiLink && (
          <div className="pt-2" style={{ borderTop: '1px solid rgba(140,98,57,0.1)' }}>
            <Link
              href={term.bsiLink}
              className="text-xs transition-colors"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--bsi-primary)' }}
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
    <div className="bg-surface-scoreboard text-bsi-bone min-h-screen">
      <Section padding="sm" style={{ borderBottom: '1px solid var(--border-vintage)' }}>
        <Container>
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Glossary' }]} />
        </Container>
      </Section>

      <Section padding="lg" className="relative overflow-hidden">
        <Container>
          <div className="max-w-3xl mb-8 relative">
            <span className="heritage-stamp block mb-4">Reference</span>
            <h1
              className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-3"
              style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
            >
              Analytics Glossary
            </h1>
            <p
              className="italic text-lg leading-relaxed"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--bsi-primary)' }}
            >
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
              className="flex-1 min-w-0 rounded-sm px-4 py-2.5 text-sm transition-colors focus:outline-none"
              style={{
                background: 'var(--surface-press-box)',
                border: '1px solid var(--border-vintage)',
                color: 'var(--bsi-bone)',
              }}
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
                  className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-bold border transition-all ${
                    !hasResults ? 'border-transparent cursor-default' : ''
                  }`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: hasResults ? 'rgba(196,184,165,0.5)' : 'rgba(196,184,165,0.2)',
                    borderColor: hasResults ? 'rgba(140,98,57,0.15)' : undefined,
                  }}
                >
                  {letter}
                </a>
              );
            })}
          </div>

          {/* Terms */}
          {sortedLetters.map((letter) => (
            <div key={letter} id={`letter-${letter}`} className="mb-10">
              <h2
                className="text-2xl font-bold uppercase mb-4 sticky top-0 py-2 z-10 backdrop-blur-sm"
                style={{
                  fontFamily: 'var(--font-oswald)',
                  color: 'rgba(191,87,0,0.3)',
                  background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 100%)',
                }}
              >
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
              <p className="text-sm text-bsi-dust/35">No terms match your search.</p>
              <button
                onClick={() => { setSearch(''); setCategory('all'); }}
                className="mt-4 text-sm font-semibold transition-colors text-bsi-primary"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Footer links */}
          <div className="mt-12 pt-6" style={{ borderTop: '1px solid var(--border-vintage)' }}>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/models" className="text-sm transition-colors text-bsi-dust/35">
                Models & Methodology
              </Link>
              <Link href="/models/data-quality" className="text-sm transition-colors text-bsi-dust/35">
                Data Quality
              </Link>
              <Link href="/college-baseball/savant" className="text-sm transition-colors text-bsi-dust/35">
                BSI Savant
              </Link>
            </div>
          </div>
        </Container>
      </Section>

    </div>
  );
}
