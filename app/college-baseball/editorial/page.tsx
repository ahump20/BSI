'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { FileText, Calendar, ChevronRight } from 'lucide-react';

const editorialArticles = [
  {
    id: 'texas-2026',
    title: 'Texas Baseball 2026 Outlook & Roster Breakdown',
    subtitle: 'Deep Dive on the Longhorns Path to Omaha',
    description:
      'In-depth 2026 Texas Longhorns baseball preview with key returnees, roster analysis, and what it means for the College World Series race. From Ethan Mendoza setting the table to Dylan Volantis shutting the door.',
    category: 'Season Preview',
    readTime: '15 min read',
    date: 'Feb 12, 2026',
    featured: true,
    href: '/college-baseball/editorial/texas-2026',
    imageGradient: 'from-[#BF5700] to-[#8B4513]',
  },
  {
    id: 'acc-opening-weekend',
    title: 'ACC Opening Weekend Preview',
    subtitle: 'Conference Realignment Meets Opening Day',
    description:
      'Stanford and Cal make their ACC debuts while Wake Forest, Virginia, and North Carolina reload for another Omaha push. Breaking down the ACC\'s top teams and storylines as the 2026 season begins.',
    category: 'Conference Preview',
    readTime: '10 min read',
    date: 'Feb 13, 2026',
    featured: false,
    href: '/college-baseball/editorial/acc-opening-weekend',
    imageGradient: 'from-[#FF6B35] to-[#BF5700]',
  },
];

export default function CollegeBaseballEditorialPage() {
  return (
    <>
      <main id="main-content">
        {/* Hero Section */}
        <Section padding="lg" className="pt-24 pb-12">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href="/college-baseball"
                  className="text-white/40 hover:text-[#BF5700] transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white">Editorial</span>
              </div>

              <div className="max-w-3xl">
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  College Baseball <span className="text-[#BF5700]">Editorial</span>
                </h1>
                <p className="text-lg text-white/60 leading-relaxed">
                  Deep dives, season previews, and analysis on the programs, players, and stories
                  that define college baseball — written for fans who want more than box scores.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Featured Articles */}
        <Section padding="lg">
          <Container>
            <div className="space-y-8">
              {editorialArticles.map((article, index) => (
                <ScrollReveal key={article.id} direction="up" delay={index * 100}>
                  <Card
                    variant="default"
                    className={`group relative overflow-hidden ${
                      article.featured ? 'border-[#BF5700]/30' : ''
                    }`}
                  >
                    {/* Background Gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${article.imageGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                    />

                    <div className="relative p-6 md:p-8">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <Badge variant={article.featured ? 'primary' : 'default'}>
                            {article.category}
                          </Badge>
                          {article.featured && (
                            <Badge variant="outline" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/40">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{article.date}</span>
                          </div>
                          <span>{article.readTime}</span>
                        </div>
                      </div>

                      <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 group-hover:text-[#BF5700] transition-colors">
                        <Link href={article.href} className="block">
                          {article.title}
                        </Link>
                      </h2>

                      {article.subtitle && (
                        <p className="text-lg font-semibold text-white/80 mb-3">
                          {article.subtitle}
                        </p>
                      )}

                      <p className="text-white/60 leading-relaxed mb-6 max-w-3xl">
                        {article.description}
                      </p>

                      <Link
                        href={article.href}
                        className="inline-flex items-center gap-2 text-[#BF5700] hover:text-[#FF6B35] transition-colors font-medium"
                      >
                        Read Full Article
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* Empty State Message if needed */}
            {editorialArticles.length === 0 && (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-2">
                  More Editorial Coming Soon
                </h3>
                <p className="text-white/60">
                  Check back for in-depth analysis and coverage throughout the season.
                </p>
              </div>
            )}
          </Container>
        </Section>

        {/* Related Links */}
        <Section padding="lg" className="border-t border-white/10">
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-2">
                  More College Baseball
                </h3>
                <p className="text-white/60 text-sm">
                  Explore additional coverage, preseason content, and live scores.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/college-baseball/preseason"
                  className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors font-medium"
                >
                  Preseason Hub →
                </Link>
                <Link
                  href="/college-baseball/scores"
                  className="text-sm text-white/40 hover:text-white transition-colors font-medium"
                >
                  Live Scores →
                </Link>
                <Link
                  href="/college-baseball/rankings"
                  className="text-sm text-white/40 hover:text-white transition-colors font-medium"
                >
                  Rankings →
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
