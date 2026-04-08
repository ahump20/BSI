import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Research | Blaze Sports Intel',
  description:
    'Long-form scholarly analysis from BSI Research Division. Evidence-based investigation of the structural forces reshaping college athletics.',
  openGraph: {
    title: 'BSI Research Division',
    description:
      'Evidence-based investigation of the structural forces reshaping college athletics.',
    images: ogImage('/images/og/bsi-research.png'),
  },
};

const PUBLISHED_ANALYSES = [
  {
    slug: 'nil-analysis',
    title: 'The $1 Billion Experiment',
    subtitle:
      'Money, Power, and Transparency in the NCAA\u2019s NIL Era',
    description:
      'A scholarly analysis of NIL financial flows, gender equity, institutional leverage, and regulatory gaps in college athlete compensation (2021\u20132026). 43 references, 4 data tables, 35 inline citations.',
    date: 'March 2026',
    wordCount: '10,800',
    readTime: '45 min',
    tags: ['NIL', 'NCAA', 'Title IX', 'House v. NCAA', 'Antitrust'],
  },
];

export default function ResearchIndexPage() {
  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="text-text-muted hover:text-burnt-orange transition-colors"
              >
                Home
              </Link>
              <span className="text-text-muted/40">/</span>
              <span className="text-text-primary">Research</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/8 via-transparent to-transparent pointer-events-none" />
          <Container>
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px w-8 bg-burnt-orange/60" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-burnt-orange/70">
                  BSI Research Division
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                Research
              </h1>
              <p className="font-serif text-xl md:text-2xl text-text-tertiary leading-relaxed max-w-2xl">
                Long-form scholarly analysis of the structural forces reshaping college athletics.
                Evidence-based. Peer-review sourced. No takes without receipts.
              </p>
            </div>
          </Container>
        </Section>

        {/* Published Analyses */}
        <Section padding="lg" background="charcoal">
          <Container size="lg">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted mb-8">
              Published Analyses
            </p>
            <div className="space-y-8">
              {PUBLISHED_ANALYSES.map((analysis) => (
                <Link
                  key={analysis.slug}
                  href={`/research/${analysis.slug}`}
                  className="block group"
                >
                  <article className="relative bg-background-primary/40 border border-border/60 rounded-sm overflow-hidden hover:border-burnt-orange/25 transition-all duration-500">
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-burnt-orange/20 group-hover:bg-burnt-orange/60 transition-colors duration-500" />

                    <div className="p-8 md:p-10 pl-8 md:pl-12">
                      {/* Meta line */}
                      <div className="flex items-center gap-4 mb-5">
                        <span className="font-mono text-xs text-text-muted tracking-wide">
                          {analysis.date}
                        </span>
                        <span className="text-text-muted/30">&middot;</span>
                        <span className="font-mono text-xs text-text-muted tracking-wide">
                          {analysis.wordCount} words
                        </span>
                        <span className="text-text-muted/30">&middot;</span>
                        <span className="font-mono text-xs text-text-muted tracking-wide">
                          {analysis.readTime} read
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-wide mb-3 group-hover:text-burnt-orange transition-colors duration-300">
                        {analysis.title}
                      </h2>

                      {/* Subtitle */}
                      <p className="font-serif text-lg md:text-xl text-burnt-orange/70 italic mb-5">
                        {analysis.subtitle}
                      </p>

                      {/* Description */}
                      <p className="font-serif text-text-secondary leading-relaxed mb-8 max-w-3xl">
                        {analysis.description}
                      </p>

                      {/* Tags + CTA */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex flex-wrap gap-2">
                          {analysis.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-sm bg-burnt-orange/8 text-burnt-orange/60 border border-burnt-orange/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-xs text-burnt-orange/60 group-hover:text-burnt-orange transition-colors uppercase tracking-wider">
                          Read Analysis &rarr;
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}
