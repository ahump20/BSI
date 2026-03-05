'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
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
    <div className="bg-surface-light border border-border-subtle rounded-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
          {term.term}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {term.sport.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-burnt-orange bg-burnt-orange/10 rounded-md"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <span className="text-text-muted text-xs uppercase tracking-wider block mb-1">Definition</span>
          <p className="text-text-tertiary leading-relaxed">{term.mlbDefinition}</p>
          <p className="text-text-muted text-xs mt-1">Source: {term.mlbSource}</p>
        </div>

        <div>
          <span className="text-text-muted text-xs uppercase tracking-wider block mb-1">NCAA Equivalent</span>
          <p className="text-text-tertiary leading-relaxed">{term.ncaaEquivalent}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-text-muted text-xs uppercase tracking-wider block mb-1">Available Data</span>
            <p className="text-text-muted leading-relaxed text-xs">{term.availableData}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs uppercase tracking-wider block mb-1">Limitations</span>
            <p className="text-text-muted leading-relaxed text-xs">{term.limitations}</p>
          </div>
        </div>

        {term.bsiLink && (
          <div className="pt-2 border-t border-border-subtle">
            <Link
              href={term.bsiLink}
              className="text-xs text-burnt-orange hover:text-ember font-semibold transition-colors"
            >
              {term.bsiLinkLabel || 'Related BSI Model'} &#8594;
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

        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mb-8">
              <Badge variant="primary" className="mb-4">Reference</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mb-3">
                Analytics Glossary
              </h1>
              <p className="text-text-tertiary text-lg leading-relaxed">
                Pro-level metrics mapped to college equivalents. What each stat measures, what
                data actually exists at the college level, and where the gaps are. Honest about
                what BSI can and cannot measure.
              </p>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search terms..."
                className="flex-1 min-w-0 bg-surface-light border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-burnt-orange/50 transition-colors"
              />
              <div className="flex gap-1.5 overflow-x-auto">
                {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                      category === cat
                        ? 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/30'
                        : 'bg-surface-light text-text-muted border-border hover:text-text-tertiary'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
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
                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${
                      hasResults
                        ? 'bg-surface-light text-text-tertiary hover:text-burnt-orange hover:bg-burnt-orange/10 transition-all'
                        : 'bg-surface-light text-text-muted cursor-default'
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
                <h2 className="font-display text-2xl font-bold text-text-muted uppercase mb-4 sticky top-0 bg-background-primary py-2 z-10">
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
                <p className="text-text-muted text-sm">No terms match your search.</p>
                <button
                  onClick={() => { setSearch(''); setCategory('all'); }}
                  className="mt-4 text-burnt-orange hover:text-ember text-sm font-semibold transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Footer links */}
            <div className="mt-12 flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/models" className="hover:text-text-secondary transition-colors">
                Models & Methodology
              </Link>
              <Link href="/models/data-quality" className="hover:text-text-secondary transition-colors">
                Data Quality
              </Link>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
